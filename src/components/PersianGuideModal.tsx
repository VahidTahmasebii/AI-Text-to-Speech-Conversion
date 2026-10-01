import React from 'react';
import { X, Sparkles, BookOpen, HardDrive, WifiOff, CheckCircle2 } from 'lucide-react';
import { DIACRITICS } from '../utils/constants';

interface PersianGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PersianGuideModal: React.FC<PersianGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">راهنمای تولید صدای طبیعی و دسترسی آفلاین</h3>
              <p className="text-slate-400 text-xs mt-0.5">نکات کلیدی برای دستیابی به باکیفیت‌ترین تلفظ زبان فارسی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6 text-sm text-slate-300">
          {/* Section 1: Offline Access */}
          <div className="bg-slate-950/70 border border-indigo-900/40 rounded-2xl p-4">
            <h4 className="text-indigo-400 font-bold text-sm flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4" />
              <span>چگونه فایل‌های صوتی به صورت آفلاین ذخیره می‌شوند؟</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              این برنامه از پایگاه داده استاندارد <strong className="text-white">IndexedDB</strong> در مرورگر شما بهره می‌برد. به محض اینکه دکمه «ذخیره در کتابخانه آفلاین» را لمس کنید:
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>فایل کامل صوتی با فرمت استاندارد WAV مستقیماً درون دیسک سخت دستگاه ذخیره می‌شود.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>در هر زمان (حتی هنگام قطعی کامل اینترنت یا در حالت هواپیما)، به تب «کتابخانه آفلاین» بروید و بدون هیچ افت کیفیتی به فایل‌ها گوش دهید.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>همچنین می‌توانید روی دکمه «دانلود WAV» بزنید تا فایل مستقیماً در پوشه Downloads کامپیوتر یا گوشی شما ذخیره شود.</span>
              </li>
            </ul>
          </div>

          {/* Section 2: Diacritics & Pronunciation */}
          <div>
            <h4 className="text-cyan-400 font-bold text-sm flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" />
              <span>نکات طلایی تلفظ دقیق کلمات فارسی</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                <strong className="text-white block mb-1">۱. اعراب‌گذاری کلمات چندمعنایی:</strong>
                <span>
                  کلماتی مانند «مِهر» (عاطفه) در برابر «مُهر» (خاتم)، یا «کِشت» در برابر «کُشت» با قرار دادن فتحه یا کسره، بدون کوچکترین خطا خوانده می‌شوند.
                </span>
              </div>
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                <strong className="text-white block mb-1">۲. دکمه «اعراب‌گذاری هوشمند»:</strong>
                <span>
                  کافیست روی دکمه اعراب‌گذاری هوشمند بالای کادر متن بزنید تا هوش مصنوعی به صورت خودکار حرکات کلمات حساس را تکمیل کند.
                </span>
              </div>
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                <strong className="text-white block mb-1">۳. رعایت مکث با ویرگول (،):</strong>
                <span>
                  برای ایجاد نفس یا مکث کوتاه طبیعی بین جملات، از علامت کاما یا ویرگول فارسی (،) استفاده کنید. برای پایان‌بندی کامل، از نقطه (.) بهره ببرید.
                </span>
              </div>
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                <strong className="text-white block mb-1">۴. شعر و دکلمه:</strong>
                <span>
                  برای بیت‌های شعر، هر مصراع را در یک سطر جداگانه بنویسید و لحن را روی «شعرخوانی و دکلمه» قرار دهید.
                </span>
              </div>
            </div>
          </div>

          {/* Diacritics Reference Table */}
          <div>
            <h4 className="text-slate-200 font-bold text-xs mb-2">جدول راهنمای علائم اعراب فارسی:</h4>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center text-xs">
              {DIACRITICS.map((d) => (
                <div key={d.name} className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                  <div className="text-base font-bold text-indigo-400 mb-0.5">{d.example}</div>
                  <div className="text-[11px] text-slate-400">{d.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition-all"
          >
            متوجه شدم، بازگشت به برنامه
          </button>
        </div>
      </div>
    </div>
  );
};
