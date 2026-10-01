import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Google GenAI client with required telemetry User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Persian TTS Generation Endpoint
app.post('/api/tts/generate', async (req, res) => {
  try {
    const {
      text,
      voiceName = 'Kore',
      style = 'Natural, clear Persian speaker with warm tone and proper pronunciation',
      model = 'gemini-3.8-flash-lite-tts',
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'لطفاً متن فارسی معتبری وارد کنید.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'کلید وب‌سرویس هوش مصنوعی (GEMINI_API_KEY) یافت نشد.',
      });
    }

    const trimmedText = text.trim();
    // Validate model selection to official allowed TTS models
    const targetModel =
      model === 'gemini-3.8-flash-tts'
        ? 'gemini-3.8-flash-tts'
        : 'gemini-3.8-flash-lite-tts';

    // Persian-tailored style guidance instruction
    const enhancedStyle = style
      ? `Speak in Persian (Farsi). ${style}. Pronounce words with proper Persian rhythm, natural vowels, and gentle cadence.`
      : 'Speak in fluent, warm, and natural Persian (Farsi) with articulate pronunciation.';

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: trimmedText,
              speechMetadata: {
                style: enhancedStyle,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // Puck, Charon, Kore, Fenrir, Zephyr
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(
      (part: any) => part.inlineData && part.inlineData.data
    );

    if (!audioPart || !audioPart.inlineData?.data) {
      return res.status(502).json({
        error: 'پاسخ صوتی از سرور هوش مصنوعی دریافت نشد. لطفاً مجدداً امتحان کنید.',
      });
    }

    const base64Audio = audioPart.inlineData.data;
    const mimeType = audioPart.inlineData.mimeType || 'audio/wav';

    // Calculate approximate duration based on 24kHz 16-bit mono PCM wav
    // 24000 samples/sec * 2 bytes/sample = 48000 bytes/sec
    const byteLength = Math.floor((base64Audio.length * 3) / 4);
    const estimatedSeconds = Math.max(1, Math.round(((byteLength - 44) / 48000) * 10) / 10);

    return res.json({
      audio: base64Audio,
      mimeType,
      voiceName,
      model: targetModel,
      text: trimmedText,
      duration: estimatedSeconds,
      byteLength,
    });
  } catch (error: any) {
    console.error('Error generating speech:', error);
    return res.status(500).json({
      error: error?.message || 'خطا در برقراری ارتباط با سرور تبدیل متن به صدا.',
    });
  }
});

// Persian Text Assistant: Diacritics (اعراب‌گذاری) & Pronunciation polishing
app.post('/api/persian/assist', async (req, res) => {
  try {
    const { text, mode = 'diacritize' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'متن الزامی است.' });
    }

    let prompt = '';
    if (mode === 'diacritize') {
      prompt = `به عنوان متخصص زبان و ادبیات فارسی، به متن فارسی زیر حرکات و اعراب (فتحه، کسره، ضمه، تشدید، سکون، تنوین) اضافه کن تا برای تبدیل متن به گفتار (TTS) کاملاً دقیق، روان و بدون اشتباه تلفظ شود.
قوانین:
۱. فقط متن اعراب‌گذاری شده را برگردان، بدون هیچ توضیح اضافی، بدون پیشگفتار و بدون علامت‌های نقل قول.
۲. کلمات دشوار یا کلماتی که احتمال تلفظ نادرست دارند را حتماً علامت‌گذاری کن.
۳. معنای جمله نباید تغییر کند.

متن:
${text}`;
    } else if (mode === 'poetic_rhythm') {
      prompt = `به عنوان استاد ادبیات فارسی، متن یا شعر زیر را برای خوانش صوتی (دکلمه و گفتار) با مکث‌های استاندارد (ویرگول و نقطه‌گذاری مناسب و اعراب کلمات حساس) بهینه‌سازی کن تا در گفتار هوش مصنوعی با وقفه و احساس مطلوب خوانده شود.
فقط متن بهینه‌شده را برگردان بدون توضیحات اضافی:

متن:
${text}`;
    } else {
      prompt = `متن فارسی زیر را ویرایش و پیراسته کن تا برای خواندن صوتی رسا و شیوا باشد. فقط متن خروجی را بازگردان:
${text}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    const result = response.text?.trim() || text;
    res.json({ result });
  } catch (err: any) {
    console.error('Assist warning (fallback to original text):', err?.message || err);
    // Graceful fallback to user's original text so workflow is never disrupted
    res.json({ result: req.body.text || '', warning: 'امکان اعراب‌گذاری خودکار در این لحظه میسر نشد.' });
  }
});

// Serve frontend: Vite middlewares in dev mode, static files in production
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Persian TTS Server running on port ${PORT}`);
});
