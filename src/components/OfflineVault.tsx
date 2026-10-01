import React, { useState, useMemo } from 'react';
import {
  FolderArchive,
  Download,
  Trash2,
  Star,
  Search,
  Tag,
  Play,
  Pause,
  HardDrive,
  FileAudio,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Edit2,
  Check,
  X,
  Upload,
  Layers,
} from 'lucide-react';
import { SavedAudio } from '../types/tts';
import {
  formatFileSize,
  formatPersianDate,
  formatTime,
  toPersianDigits,
  triggerAudioDownload,
} from '../utils/formatters';

interface OfflineVaultProps {
  savedAudios: SavedAudio[];
  activeAudioId: string | null;
  isPlaying: boolean;
  onPlayAudio: (audio: SavedAudio) => void;
  onPauseAudio: () => void;
  onDeleteAudio: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateMetadata: (id: string, updates: Partial<SavedAudio>) => void;
  onClearVault: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onLoadTextIntoStudio: (text: string, voiceName: string, style: string) => void;
}

export const OfflineVault: React.FC<OfflineVaultProps> = ({
  savedAudios,
  activeAudioId,
  isPlaying,
  onPlayAudio,
  onPauseAudio,
  onDeleteAudio,
  onToggleFavorite,
  onUpdateMetadata,
  onClearVault,
  onExportBackup,
  onImportBackup,
  onLoadTextIntoStudio,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Compute total storage
  const totalBytes = useMemo(() => {
    return savedAudios.reduce((acc, curr) => acc + (curr.fileSizeBytes || 0), 0);
  }, [savedAudios]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    savedAudios.forEach((audio) => {
      audio.tags?.forEach((t) => tagsSet.add(t));
    });
    return Array.from(tagsSet);
  }, [savedAudios]);

  // Filtered audios
  const filteredAudios = useMemo(() => {
    return savedAudios.filter((item) => {
      // Search
      const matchesSearch =
        !searchTerm.trim() ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.voiceName.toLowerCase().includes(searchTerm.toLowerCase());

      // Tag filter
      let matchesTag = true;
      if (selectedTag === 'favorites') {
        matchesTag = item.isFavorite;
      } else if (selectedTag !== 'all') {
        matchesTag = item.tags?.includes(selectedTag);
      }

      return matchesSearch && matchesTag;
    });
  }, [savedAudios, searchTerm, selectedTag]);

  const handleStartEdit = (audio: SavedAudio) => {
    setEditingId(audio.id);
    setEditTitle(audio.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      onUpdateMetadata(id, { title: editTitle.trim() });
    }
    setEditingId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackup(file);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Offline Storage Status */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900/80 to-slate-900/70 border border-indigo-900/50 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-lg">کتابخانه و مخزن صوتی آفلاین</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium">
                  دسترس‌پذیر ۱۰۰٪ بدون اینترنت
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                تمام فایل‌های صوتی در حافظه پایدار دستگاه شما ذخیره شده‌اند و در هر زمان بدون نیاز به شبکه قابل پخش هستند.
              </p>
            </div>
          </div>

          {/* Storage stats badge */}
          <div className="flex items-center gap-4 bg-slate-950/70 px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
            <div>
              <div className="text-slate-400">تعداد فایل‌ها:</div>
              <div className="text-white font-bold text-sm">{toPersianDigits(savedAudios.length)} قطعه</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <div className="text-slate-400">فضای ذخیره شده:</div>
              <div className="text-cyan-400 font-bold text-sm">{formatFileSize(totalBytes)}</div>
            </div>
          </div>
        </div>

        {/* Action bar: Export / Import / Clear */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onExportBackup}
              disabled={savedAudios.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 transition-all"
            >
              <FolderArchive className="w-3.5 h-3.5 text-indigo-400" />
              <span>پشتیبان‌گیری (دانلود JSON)</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>بازیابی نسخه پشتیبان</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {savedAudios.length > 0 && (
            <div>
              {showClearConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-400">آیا همه پاک شوند؟</span>
                  <button
                    onClick={() => {
                      onClearVault();
                      setShowClearConfirm(false);
                    }}
                    className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs"
                  >
                    بله، حذف همه
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                  >
                    انصراف
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تخلیه کامل کتابخانه</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در عنوان، متن، یا صدای گوینده..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedTag === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            همه ({toPersianDigits(savedAudios.length)})
          </button>

          <button
            onClick={() => setSelectedTag('favorites')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedTag === 'favorites'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-amber-400 border border-slate-800'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>نشان‌شده‌ها</span>
          </button>

          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedTag === tag
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Audio Cards List */}
      {filteredAudios.length === 0 ? (
        <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800/70 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <FileAudio className="w-8 h-8" />
          </div>
          <h4 className="text-white font-bold text-base mb-1">
            {savedAudios.length === 0
              ? 'هنوز فایل صوتی ذخیره نشده است'
              : 'موردی با این مشخصات یافت نشد'}
          </h4>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto mb-5">
            {savedAudios.length === 0
              ? 'از تب «استودیو تبدیل متن»، متن دلخواه خود را تایپ کرده و پس از ایجاد صدا، دکمه «ذخیره در کتابخانه آفلاین» را بزنید.'
              : 'عبارت جستجو یا فیلتر دسته‌بندی را تغییر دهید.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAudios.map((audio) => {
            const isThisPlaying = activeAudioId === audio.id && isPlaying;
            return (
              <div
                key={audio.id}
                className={`bg-slate-900/80 border rounded-2xl p-4 transition-all hover:border-slate-700 relative flex flex-col justify-between ${
                  activeAudioId === audio.id
                    ? 'border-indigo-500/80 ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-500/10'
                    : 'border-slate-800'
                }`}
              >
                {/* Card Top: Play button, Title, Star, Delete */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => {
                          if (isThisPlaying) {
                            onPauseAudio();
                          } else {
                            onPlayAudio(audio);
                          }
                        }}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md transition-all active:scale-95 ${
                          isThisPlaying
                            ? 'bg-cyan-500 shadow-cyan-500/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                        }`}
                      >
                        {isThisPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current translate-x-[-1px]" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        {editingId === audio.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="bg-slate-800 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none w-full"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEdit(audio.id)}
                              className="p-1 text-emerald-400 hover:bg-slate-800 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-800 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 group">
                            <h4 className="text-white font-semibold text-sm truncate">
                              {audio.title}
                            </h4>
                            <button
                              onClick={() => handleStartEdit(audio)}
                              title="ویرایش عنوان"
                              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 transition-opacity p-0.5"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span className="text-indigo-400 font-medium">{audio.voiceName}</span>
                          <span>•</span>
                          <span>{formatTime(audio.duration)}</span>
                          <span>•</span>
                          <span>{formatFileSize(audio.fileSizeBytes)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Star & Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onToggleFavorite(audio.id)}
                        title={audio.isFavorite ? 'حذف از برگزیده‌ها' : 'افزودن به برگزیده‌ها'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          audio.isFavorite
                            ? 'text-amber-400 hover:bg-amber-400/10'
                            : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${audio.isFavorite ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={() => onDeleteAudio(audio.id)}
                        title="حذف از حافظه"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Persian text excerpt */}
                  <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/80 mb-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-24 overflow-y-auto">
                    {audio.text}
                  </div>
                </div>

                {/* Card Bottom: Metadata, Tags & Action buttons */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
                    <span className="text-slate-500 font-mono">
                      {formatPersianDate(audio.createdAt)}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onLoadTextIntoStudio(audio.text, audio.voiceName, audio.style)}
                        title="انتقال متن به استودیو برای ویرایش مجدد"
                        className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>انتقال به استودیو</span>
                      </button>

                      <button
                        onClick={() => {
                          const filename = `${audio.title.replace(/\s+/g, '_')}.wav`;
                          triggerAudioDownload(audio.audioBlob || audio.base64Audio, filename);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 border border-slate-700 font-medium transition-all"
                      >
                        <Download className="w-3 h-3" />
                        <span>دانلود WAV</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
