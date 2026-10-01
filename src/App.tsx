/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Volume2,
  HardDrive,
  Sparkles,
  HelpCircle,
  Wifi,
  WifiOff,
  FolderArchive,
  Music,
  CheckCircle,
  Download,
} from 'lucide-react';
import { TTSStudio } from './components/TTSStudio';
import { OfflineVault } from './components/OfflineVault';
import { AudioPlayer } from './components/AudioPlayer';
import { PersianGuideModal } from './components/PersianGuideModal';
import { SavedAudio, TTSRequest, TTSResponse } from './types/tts';
import { generatePersianTTS } from './services/ttsApi';
import {
  getAllSavedAudios,
  saveAudioToVault,
  deleteAudioFromVault,
  toggleAudioFavorite,
  updateAudioMetadata,
  clearEntireVault,
  exportVaultToJson,
  importVaultFromJson,
} from './services/audioStorage';
import {
  base64ToBlob,
  createSafeFilename,
  toPersianDigits,
  triggerAudioDownload,
} from './utils/formatters';
import { VOICES } from './utils/constants';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'vault'>('studio');
  const [savedAudios, setSavedAudios] = useState<SavedAudio[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState<TTSResponse | null>(null);
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null);

  // Active audio player state for offline vault or studio
  const [activePlaybackAudio, setActivePlaybackAudio] = useState<SavedAudio | null>(null);
  const [isPlayingActive, setIsPlayingActive] = useState<boolean>(false);

  // Online / Offline monitor
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Guide modal
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Studio pre-fill state when loading from vault
  const [studioPrefill, setStudioPrefill] = useState<{
    text: string;
    voice: string;
    style: string;
  } | null>(null);

  // Show brief toast notification
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  // Monitor network online/offline state
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('اتصال به اینترنت برقرار شد.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('اتصال اینترنت قطع شد. حالت آفلاین فعال است.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Load saved audios from IndexedDB on startup
  const loadVaultAudios = useCallback(async () => {
    try {
      const audios = await getAllSavedAudios();
      setSavedAudios(audios);
    } catch (err) {
      console.error('Failed to load saved audios from vault:', err);
    }
  }, []);

  useEffect(() => {
    loadVaultAudios();
  }, [loadVaultAudios]);

  // Generate Persian Speech
  const handleGenerateTTS = async (req: TTSRequest): Promise<TTSResponse | null> => {
    setIsGenerating(true);
    setTtsError(null);
    setCurrentResponse(null);
    setCurrentSavedId(null);

    try {
      const res = await generatePersianTTS(req);
      setCurrentResponse(res);

      // Auto save or prepare audio in state
      const voiceInfo = VOICES.find((v) => v.id === req.voiceName);
      const title = req.text.slice(0, 36).replace(/\n/g, ' ') + (req.text.length > 36 ? '...' : '');

      const newAudioItem: SavedAudio = {
        id: `ava_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        title,
        text: req.text,
        base64Audio: res.audio,
        mimeType: res.mimeType || 'audio/wav',
        audioBlob: base64ToBlob(res.audio, res.mimeType || 'audio/wav'),
        voiceName: req.voiceName,
        voicePersianName: voiceInfo?.persianName || req.voiceName,
        style: req.style,
        duration: res.duration || 3,
        fileSizeBytes: res.byteLength || Math.round((res.audio.length * 3) / 4),
        createdAt: Date.now(),
        isFavorite: false,
        tags: ['تولید جدید'],
      };

      // Automatically store in IndexedDB offline vault so user never loses it
      await saveAudioToVault(newAudioItem);
      setCurrentSavedId(newAudioItem.id);
      await loadVaultAudios();
      showToast('صوت فارسی با موفقیت تولید و در حافظه آفلاین ذخیره شد.');

      return res;
    } catch (err: any) {
      console.error('Generation error:', err);
      const msg = err?.message || 'خطا در تولید صدای فارسی. لطفاً اتصال اینترنت خود را بررسی کنید.';
      setTtsError(msg);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // Explicit Save Current Audio to Vault
  const handleSaveCurrentToVault = async () => {
    if (!currentResponse) return;

    if (currentSavedId) {
      showToast('این فایل قبلاً در کتابخانه آفلاین ذخیره شده است.');
      return;
    }

    try {
      const voiceInfo = VOICES.find((v) => v.id === currentResponse.voiceName);
      const title =
        currentResponse.text.slice(0, 36).replace(/\n/g, ' ') +
        (currentResponse.text.length > 36 ? '...' : '');

      const newAudioItem: SavedAudio = {
        id: `ava_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        title,
        text: currentResponse.text,
        base64Audio: currentResponse.audio,
        mimeType: currentResponse.mimeType || 'audio/wav',
        audioBlob: base64ToBlob(currentResponse.audio, currentResponse.mimeType || 'audio/wav'),
        voiceName: currentResponse.voiceName,
        voicePersianName: voiceInfo?.persianName || currentResponse.voiceName,
        style: '',
        duration: currentResponse.duration || 3,
        fileSizeBytes:
          currentResponse.byteLength || Math.round((currentResponse.audio.length * 3) / 4),
        createdAt: Date.now(),
        isFavorite: false,
        tags: ['استودیو'],
      };

      await saveAudioToVault(newAudioItem);
      setCurrentSavedId(newAudioItem.id);
      await loadVaultAudios();
      showToast('فایل با موفقیت در کتابخانه آفلاین ذخیره شد.');
    } catch (e) {
      console.error('Save error:', e);
      showToast('خطا در ذخیره سازی آفلاین.');
    }
  };

  // Delete audio from Vault
  const handleDeleteAudio = async (id: string) => {
    try {
      await deleteAudioFromVault(id);
      if (activePlaybackAudio?.id === id) {
        setActivePlaybackAudio(null);
        setIsPlayingActive(false);
      }
      if (currentSavedId === id) {
        setCurrentSavedId(null);
      }
      await loadVaultAudios();
      showToast('فایل صوتی از کتابخانه حذف شد.');
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleAudioFavorite(id);
      await loadVaultAudios();
    } catch (e) {
      console.error('Favorite error:', e);
    }
  };

  // Update Metadata
  const handleUpdateMetadata = async (id: string, updates: Partial<SavedAudio>) => {
    try {
      await updateAudioMetadata(id, updates);
      await loadVaultAudios();
      showToast('مشخصات فایل به‌روزرسانی شد.');
    } catch (e) {
      console.error('Update metadata error:', e);
    }
  };

  // Clear Entire Vault
  const handleClearVault = async () => {
    try {
      await clearEntireVault();
      setActivePlaybackAudio(null);
      setIsPlayingActive(false);
      setCurrentSavedId(null);
      await loadVaultAudios();
      showToast('تمام فایل‌های صوتی از حافظه پاک شدند.');
    } catch (e) {
      console.error('Clear error:', e);
    }
  };

  // Export Backup JSON
  const handleExportBackup = async () => {
    try {
      const jsonStr = await exportVaultToJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const filename = `ava_negar_persian_tts_backup_${Date.now()}.json`;
      triggerAudioDownload(blob, filename, 'application/json');
      showToast('نسخه پشتیبان تمام فایل‌های صوتی دانلود شد.');
    } catch (e) {
      console.error('Export error:', e);
      showToast('خطا در ایجاد فایل پشتیبان.');
    }
  };

  // Import Backup JSON
  const handleImportBackup = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        if (content) {
          const count = await importVaultFromJson(content);
          await loadVaultAudios();
          showToast(`${toPersianDigits(count)} قطعه صوتی با موفقیت بازیابی شد.`);
        }
      };
      reader.readAsText(file);
    } catch (e) {
      console.error('Import error:', e);
      showToast('فایل پشتیبان معتبر نیست.');
    }
  };

  // Play audio item from vault
  const handlePlayVaultAudio = (audio: SavedAudio) => {
    setActivePlaybackAudio(audio);
    setIsPlayingActive(true);
  };

  const handlePauseVaultAudio = () => {
    setIsPlayingActive(false);
  };

  // Transfer text from vault back to studio for editing or regenerating
  const handleLoadTextIntoStudio = (text: string, voiceName: string, style: string) => {
    setStudioPrefill({ text, voice: voiceName, style });
    setActiveTab('studio');
    showToast('متن به استودیو منتقل شد.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-indigo-500/40 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm animate-fade-in backdrop-blur-md">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Guide Modal */}
      <PersianGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo & App Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-white font-extrabold text-base sm:text-lg tracking-tight">
                  آوا نگار فارسی
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                  Persian AI TTS
                </span>
              </div>
              <p className="text-slate-400 text-[11px] sm:text-xs">
                استودیوی هوشمند تبدیل متن به گفتار با دسترسی آفلاین
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'studio'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>استودیو تبدیل متن</span>
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all relative ${
                activeTab === 'vault'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>کتابخانه آفلاین</span>
              {savedAudios.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === 'vault'
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-500/20 text-indigo-400'
                  }`}
                >
                  {toPersianDigits(savedAudios.length)}
                </span>
              )}
            </button>
          </div>

          {/* Status & Guide Icon */}
          <div className="flex items-center gap-2">
            {/* Online/Offline status pill */}
            <div
              title={isOnline ? 'متصل به سرور و اینترنت' : 'حالت آفلاین (بدون اینترنت)'}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                isOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isOnline ? 'آنلاین' : 'آفلاین'}</span>
            </div>

            <button
              onClick={() => setIsGuideOpen(true)}
              title="راهنمای اعراب و دسترسی آفلاین"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 flex-1 w-full">
        {activeTab === 'studio' ? (
          <div className="space-y-6">
            <TTSStudio
              onGenerate={handleGenerateTTS}
              isGenerating={isGenerating}
              error={ttsError}
              currentResponse={currentResponse}
              onSaveCurrentToVault={handleSaveCurrentToVault}
              isCurrentSavedInVault={Boolean(currentSavedId)}
              isOnline={isOnline}
              initialText={studioPrefill?.text}
              initialVoice={studioPrefill?.voice}
              initialStyle={studioPrefill?.style}
            />

            {/* Generated Audio Result Player */}
            {currentResponse && (
              <div className="mt-8 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-white font-bold text-base">صوت تولید شده آماده پخش و دانلود</h3>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    ذخیره شده در حافظه آفلاین
                  </span>
                </div>

                <AudioPlayer
                  audioSrc={currentResponse.audio}
                  title={
                    currentResponse.text.slice(0, 45) +
                    (currentResponse.text.length > 45 ? '...' : '')
                  }
                  voiceName={currentResponse.voiceName}
                  duration={currentResponse.duration}
                  onSaveToVault={handleSaveCurrentToVault}
                  isSavedInVault={Boolean(currentSavedId)}
                  autoPlay={true}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active floating / fixed player when playing item from Vault */}
            {activePlaybackAudio && (
              <div className="mb-6 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <Music className="w-4 h-4" />
                    <span>در حال پخش از کتابخانه آفلاین:</span>
                  </span>
                </div>
                <AudioPlayer
                  key={activePlaybackAudio.id}
                  audioSrc={activePlaybackAudio.audioBlob || activePlaybackAudio.base64Audio}
                  title={activePlaybackAudio.title}
                  voiceName={activePlaybackAudio.voiceName}
                  duration={activePlaybackAudio.duration}
                  autoPlay={isPlayingActive}
                />
              </div>
            )}

            <OfflineVault
              savedAudios={savedAudios}
              activeAudioId={activePlaybackAudio?.id || null}
              isPlaying={isPlayingActive}
              onPlayAudio={handlePlayVaultAudio}
              onPauseAudio={handlePauseVaultAudio}
              onDeleteAudio={handleDeleteAudio}
              onToggleFavorite={handleToggleFavorite}
              onUpdateMetadata={handleUpdateMetadata}
              onClearVault={handleClearVault}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onLoadTextIntoStudio={handleLoadTextIntoStudio}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 pt-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span>آوا نگار فارسی — استودیوی تبدیل متن به گفتار و ذخیره‌سازی آفلاین</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              راهنمای تلفظ و اعراب
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('vault')}
              className="hover:text-slate-300 transition-colors"
            >
              مدیریت فایل‌های ذخیره شده ({toPersianDigits(savedAudios.length)})
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
