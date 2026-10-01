import { TTSRequest, TTSResponse } from '../types/tts';

/**
 * Generate Persian TTS using Gemini TTS via server API
 */
export async function generatePersianTTS(request: TTSRequest): Promise<TTSResponse> {
  const response = await fetch('/api/tts/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errMessage = 'خطا در تبدیل متن به صدا';
    try {
      const data = await response.json();
      if (data.error) errMessage = data.error;
    } catch {
      errMessage = `خطای سرور: ${response.status} ${response.statusText}`;
    }
    throw new Error(errMessage);
  }

  const data: TTSResponse = await response.json();
  return data;
}

/**
 * Enhance Persian text with diacritics (اعراب‌گذاری) or poetic rhythm
 */
export async function enhancePersianText(
  text: string,
  mode: 'diacritize' | 'poetic_rhythm' = 'diacritize'
): Promise<string> {
  const response = await fetch('/api/persian/assist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, mode }),
  });

  if (!response.ok) {
    throw new Error('خطا در اعراب‌گذاری هوشمند متن');
  }

  const data = await response.json();
  return data.result || text;
}

/**
 * Web Speech API fallback: Check if browser supports speech synthesis for Persian
 */
export function getBrowserVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

/**
 * Synthesize speech locally in browser using Web Speech API (fallback when offline)
 */
export function speakWithBrowserAPI(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): { stop: () => void } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError?.(new Error('مرورگر شما از SpeechSynthesis پشتیبانی نمی‌کند.'));
    return { stop: () => {} };
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  // Look for Persian / Farsi voices if available
  const voices = window.speechSynthesis.getVoices();
  const persianVoice = voices.find(
    (v) => v.lang.startsWith('fa') || v.name.toLowerCase().includes('persian') || v.name.toLowerCase().includes('farsi')
  );

  if (persianVoice) {
    utterance.voice = persianVoice;
    utterance.lang = persianVoice.lang;
  } else {
    utterance.lang = 'fa-IR';
  }

  utterance.rate = 0.95; // slightly slower for better Persian clarity
  utterance.pitch = 1.0;

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = (e) => onError?.(e);

  window.speechSynthesis.speak(utterance);

  return {
    stop: () => window.speechSynthesis.cancel(),
  };
}
