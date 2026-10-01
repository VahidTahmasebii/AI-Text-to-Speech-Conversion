import React, { useState, useRef } from 'react';
import {
  Volume2,
  Sparkles,
  BookOpen,
  Wand2,
  Copy,
  Trash2,
  Check,
  ChevronDown,
  Info,
  Sliders,
  Mic,
  BookmarkCheck,
  Radio,
  FileText,
  AlertCircle,
  WifiOff,
} from 'lucide-react';
import { VOICES, STYLE_PRESETS, SAMPLE_TEXTS, DIACRITICS } from '../utils/constants';
import { TTSRequest, TTSResponse, VoiceOption, StylePreset, SampleText } from '../types/tts';
import { enhancePersianText, speakWithBrowserAPI } from '../services/ttsApi';
import { toPersianDigits } from '../utils/formatters';

interface TTSStudioProps {
  onGenerate: (req: TTSRequest) => Promise<TTSResponse | null>;
  isGenerating: boolean;
  error: string | null;
  currentResponse: TTSResponse | null;
  onSaveCurrentToVault: () => void;
  isCurrentSavedInVault: boolean;
  isOnline: boolean;
  initialText?: string;
  initialVoice?: string;
  initialStyle?: string;
}

export const TTSStudio: React.FC<TTSStudioProps> = ({
  onGenerate,
  isGenerating,
  error,
  currentResponse,
  onSaveCurrentToVault,
  isCurrentSavedInVault,
  isOnline,
  initialText = '',
  initialVoice = 'Kore',
  initialStyle = 'standard',
}) => {
  const [text, setText] = useState<string>(
    initialText ||
      `بنی‌آدم اعضای یک پیکرند
که در آفرینش ز یک گوهرند
چو عضوی به درد آورَد روزگار
دگر عضوها را نمانَد قرار`
  );
  const [selectedVoice, setSelectedVoice] = useState<string>(initialVoice);
  const [selectedStyleId, setSelectedStyleId] = useState<string>(initialStyle);
  const [customStyle, setCustomStyle] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts'>(
    'gemini-3.8-flash-lite-tts'
  );
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showSamplesModal, setShowSamplesModal] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [isBrowserSpeaking, setIsBrowserSpeaking] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Character and word counts in Persian digits
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  // Insert diacritic at cursor
  const handleInsertDiacritic = (symbol: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + symbol + text.substring(end);
    setText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + symbol.length, start + symbol.length);
    }, 10);
  };

  const handleSelectSample = (sample: SampleText) => {
    setText(sample.text);
    if (sample.suggestedVoice) setSelectedVoice(sample.suggestedVoice);
    if (sample.suggestedStyle) setSelectedStyleId(sample.suggestedStyle);
    setShowSamplesModal(false);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setText('');
    textareaRef.current?.focus();
  };

  // AI Diacritic Enhancer
  const handleAutoDiacritize = async () => {
    if (!text.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePersianText(text, 'diacritize');
      setText(enhanced);
    } catch (err: any) {
      console.error('Enhancement error:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // AI Poetic Rhythm Enhancer
  const handlePoeticRhythm = async () => {
    if (!text.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePersianText(text, 'poetic_rhythm');
      setText(enhanced);
    } catch (err: any) {
      console.error('Poetic enhancement error:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Trigger speech generation
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isGenerating) return;

    const activePreset = STYLE_PRESETS.find((p) => p.id === selectedStyleId);
    const stylePrompt = customStyle.trim()
      ? `${activePreset?.prompt || ''}. ${customStyle.trim()}`
      : activePreset?.prompt || 'Clear natural Persian';

    await onGenerate({
      text: text.trim(),
      voiceName: selectedVoice,
      style: stylePrompt,
      model: selectedModel,
    });
  };

  // Offline Web Speech API fallback playback
  const handleBrowserFallbackSpeak = () => {
    if (isBrowserSpeaking) {
      window.speechSynthesis?.cancel();
      setIsBrowserSpeaking(false);
      return;
    }

    setIsBrowserSpeaking(true);
    speakWithBrowserAPI(
      text,
      () => setIsBrowserSpeaking(true),
      () => setIsBrowserSpeaking(false),
      () => setIsBrowserSpeaking(false)
    );
  };

  return (
    <div className="space-y-6">
      {/* Offline Alert Notice if user is offline */}
      {!isOnline && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
          <WifiOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <h4 className="text-amber-300 font-bold">اتصال اینترنت قطع است (حالت آفلاین)</h4>
            <p className="text-slate-300 mt-1">
              شما می‌توانید به تمام فایل‌های صوتی ذخیره شده در تب «کتابخانه آفلاین» بدون اینترنت دسترسی داشته باشید، یا از دکمه «تست گفتار صوتی مرورگر» در زیر استفاده کنید.
            </p>
          </div>
        </div>
      )}

      {/* Main Text Input Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-white font-bold text-sm sm:text-base">متن فارسی را وارد کنید</h3>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSamplesModal(!showSamplesModal)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>نمونه متون و اشعار</span>
            </button>

            <button
              type="button"
              onClick={handleAutoDiacritize}
              disabled={isEnhancing || !text.trim()}
              title="افزودن خودکار فتحه، کسره، ضمه و تشدید برای تلفظ دقیق‌تر"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/30 disabled:opacity-40 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isEnhancing ? 'در حال اعراب‌گذاری...' : 'اعراب‌گذاری هوشمند'}</span>
            </button>

            <button
              type="button"
              onClick={handlePoeticRhythm}
              disabled={isEnhancing || !text.trim()}
              title="تنظیم مکث و ویرگول برای دکلمه ادبی"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-medium border border-cyan-500/30 disabled:opacity-40 transition-all"
            >
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>آهنگین‌سازی دکلمه</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={!text.trim()}
              title="کپی متن"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 disabled:opacity-40 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={!text.trim()}
              title="پاک کردن متن"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 disabled:opacity-40 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="متن فارسی، شعر، داستان یا خبر مورد نظر خود را اینجا بنویسید یا بچسبانید..."
            rows={5}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-slate-100 placeholder-slate-500 text-base sm:text-lg leading-relaxed focus:outline-none focus:border-indigo-500 transition-all resize-y min-h-[140px]"
            dir="rtl"
          />
        </div>

        {/* Diacritics Quick Toolbar & Counters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-800/80">
          {/* Quick Diacritics insertion bar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium ml-1">اعراب سریع:</span>
            {DIACRITICS.map((item) => (
              <button
                key={item.symbol}
                type="button"
                onClick={() => handleInsertDiacritic(item.symbol)}
                title={item.name}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 font-bold text-sm flex items-center justify-center border border-slate-700 active:scale-95 transition-all"
              >
                {item.symbol}
              </button>
            ))}
          </div>

          {/* Counts */}
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono" dir="rtl">
            <span>{toPersianDigits(wordCount)} کلمه</span>
            <span>•</span>
            <span>{toPersianDigits(charCount)} نویسه</span>
          </div>
        </div>
      </div>

      {/* Samples Modal / Popover */}
      {showSamplesModal && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>انتخاب از نمونه متون کلاسیک و معاصر فارسی</span>
            </h4>
            <button
              onClick={() => setShowSamplesModal(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              بستن
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SAMPLE_TEXTS.map((sample) => (
              <div
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className="bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl p-3.5 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-white truncate">{sample.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {sample.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {sample.text}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/40 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>گوینده پیشنهادی: {sample.suggestedVoice}</span>
                  <span className="text-indigo-400 font-medium">انتخاب متن ←</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Persian Voices Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-indigo-400" />
              <span>انتخاب صدای گوینده فارسی (AI Voices)</span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              صداهای بهینه‌شده با ادای طبیعی کلمات و لحن فارسی
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {VOICES.map((v) => {
            const isSelected = selectedVoice === v.id;
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVoice(v.id)}
                className={`cursor-pointer rounded-2xl p-4 transition-all relative border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-950/50 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${v.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}
                    >
                      {v.gender === 'female' ? 'زن' : 'مرد'}
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-white font-bold text-sm mb-1">{v.persianName}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                    {v.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 block text-center truncate">
                    {v.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Speech Tone / Style Presets */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>لحن و سبک خوانش (Style & Emotion)</span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              انتخاب حس، هیجان، سرعت و ریتم متناسب با موضوع متن
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {STYLE_PRESETS.map((preset) => {
            const isSelected = selectedStyleId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedStyleId(preset.id)}
                className={`p-3 rounded-2xl text-right transition-all border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-950/50 to-slate-900 border-cyan-500 ring-2 ring-cyan-500/30 text-white shadow-md'
                    : 'bg-slate-950/50 border-slate-800/90 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="text-xs font-bold mb-1">{preset.label}</div>
                <div className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                  {preset.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* Advanced Settings Toggle */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>تنظیمات پیشرفته هوش مصنوعی (مدل و پرامپت سفارشی لحن)</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1.5">
                  انتخاب مدل تبدیل صدا:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedModel('gemini-3.8-flash-lite-tts')}
                    className={`p-3 rounded-xl border text-right transition-all ${
                      selectedModel === 'gemini-3.8-flash-lite-tts'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-indigo-400">gemini-3.8-flash-lite-tts (پیشنهادی)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      سرعت بسیار بالا، وضوح عالی برای متون عمومی، مقالات و اخبار
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedModel('gemini-3.8-flash-tts')}
                    className={`p-3 rounded-xl border text-right transition-all ${
                      selectedModel === 'gemini-3.8-flash-tts'
                        ? 'border-cyan-500 bg-cyan-500/10 text-white'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-cyan-400">gemini-3.8-flash-tts (پرچمدار)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      مناسب طراحی شخصیت، نمایش‌نامه، آواهای حسی و دکلمه‌های پیچیده
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  توصیف سفارشی برای سبک صدا (Prompt Nuances):
                </label>
                <input
                  type="text"
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                  placeholder="مثال: با لحن شاد و صمیمی، صدای گرم، مکث‌های شمرده بین جملات..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <h4 className="text-rose-400 font-bold">خطا در تولید صدا</h4>
            <p className="text-slate-300 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons: Generate & Fallback */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Main Generate Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isGenerating || !text.trim()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-base shadow-xl shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 transition-all"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>در حال ساخت صدای فارسی...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                <span>تولید صدای طبیعی با هوش مصنوعی</span>
              </>
            )}
          </button>
        </div>

        {/* Offline Web Speech fallback button */}
        <button
          type="button"
          onClick={handleBrowserFallbackSpeak}
          disabled={!text.trim()}
          title="خوانش فوری با موتور صوتی مرورگر (بدون اینترنت)"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all"
        >
          <Mic className={`w-4 h-4 ${isBrowserSpeaking ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
          <span>{isBrowserSpeaking ? 'توقف خوانش مرورگر' : 'پخش سریع با موتور محلی مرورگر'}</span>
        </button>
      </div>
    </div>
  );
};
