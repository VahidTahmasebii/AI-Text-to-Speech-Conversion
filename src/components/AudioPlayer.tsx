import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Download,
  Volume2,
  VolumeX,
  Repeat,
  BookmarkCheck,
  BookmarkPlus,
  Share2,
} from 'lucide-react';
import { formatTime, toPersianDigits, triggerAudioDownload } from '../utils/formatters';

interface AudioPlayerProps {
  audioSrc: string | Blob; // base64 data url or Blob
  title?: string;
  voiceName?: string;
  duration?: number;
  onSaveToVault?: () => void;
  isSavedInVault?: boolean;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioSrc,
  title = 'فایل صوتی فارسی',
  voiceName = 'Kore',
  duration: initialDuration = 0,
  onSaveToVault,
  isSavedInVault = false,
  autoPlay = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [shareSuccess, setShareSuccess] = useState(false);

  // Setup blob url or data url
  useEffect(() => {
    let url = '';
    if (typeof audioSrc === 'string') {
      if (audioSrc.startsWith('data:') || audioSrc.startsWith('blob:')) {
        url = audioSrc;
      } else {
        url = `data:audio/wav;base64,${audioSrc}`;
      }
    } else if (audioSrc instanceof Blob) {
      url = URL.createObjectURL(audioSrc);
    }
    setAudioUrl(url);

    return () => {
      if (audioSrc instanceof Blob && url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [audioSrc]);

  // Audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    if (autoPlay) {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, autoPlay]);

  // Visualizer Web Audio API Setup
  const setupAudioContext = () => {
    if (audioContextRef.current || !audioRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceNodeRef.current = source;
    } catch (e) {
      // AudioContext may be restricted by autoplay policy
    }
  };

  // Canvas visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barCount = 28;
      const barWidth = 4;
      const gap = (width - barCount * barWidth) / (barCount - 1);

      if (analyserRef.current && isPlaying) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        for (let i = 0; i < barCount; i++) {
          const val = dataArray[i % dataArray.length] / 255;
          const barHeight = Math.max(4, val * (height - 6));
          const x = i * (barWidth + gap);
          const y = (height - barHeight) / 2;

          // Gradient color: Cyan to Indigo
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, '#06b6d4');
          gradient.addColorStop(1, '#6366f1');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }
      } else {
        // Idle gentle waveform wave
        const progress = duration > 0 ? currentTime / duration : 0;
        for (let i = 0; i < barCount; i++) {
          const isPassed = i / barCount <= progress;
          // Synthetic audio wave height pattern
          const hRatio = 0.25 + 0.55 * Math.abs(Math.sin((i / barCount) * Math.PI * 3 + 1));
          const barHeight = Math.max(4, hRatio * height * 0.7);
          const x = i * (barWidth + gap);
          const y = (height - barHeight) / 2;

          ctx.fillStyle = isPassed ? '#6366f1' : '#334155';
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, duration]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setupAudioContext();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipTime = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(Math.max(audio.currentTime + seconds, 0), duration);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const val = parseFloat(e.target.value);
    audio.volume = val;
    setVolume(val);
    if (val === 0) setIsMuted(true);
    else if (isMuted) setIsMuted(false);
  };

  const handleRateChange = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const toggleLoop = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = !isLooping;
    setIsLooping(!isLooping);
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const filename = `${title.replace(/\s+/g, '_')}_${voiceName}.wav`;
    triggerAudioDownload(audioUrl, filename);
  };

  const handleShare = async () => {
    if (navigator.share && audioUrl) {
      try {
        await navigator.share({
          title: `پخش صوت: ${title}`,
          text: `صوت تولید شده با صدای فارسی هوش مصنوعی (${voiceName})`,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch {
        // user cancelled share
      }
    } else {
      // Copy current URL or title
      navigator.clipboard?.writeText?.(title);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-white font-semibold text-sm sm:text-base truncate">
              {title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>گوینده: {voiceName}</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">کیفیت استودیویی 24kHz</span>
            </div>
          </div>
        </div>

        {/* Quick action buttons: Save to Vault & Download */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onSaveToVault && (
            <button
              onClick={onSaveToVault}
              title={isSavedInVault ? 'ذخیره شده در کتابخانه آفلاین' : 'ذخیره در حافظه آفلاین'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSavedInVault
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 hover:bg-indigo-600/30 text-slate-200 hover:text-indigo-300 border border-slate-700'
              }`}
            >
              {isSavedInVault ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>آفلاین ذخیره شد</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>ذخیره آفلاین</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleDownload}
            title="دانلود فایل صوتی WAV در دستگاه"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">دانلود WAV</span>
          </button>

          <button
            onClick={handleShare}
            title="اشتراک‌گذاری"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          {shareSuccess && (
            <span className="text-[11px] text-emerald-400">کپی شد!</span>
          )}
        </div>
      </div>

      {/* Waveform Canvas Visualizer */}
      <div className="relative w-full h-14 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-3 flex items-center justify-center px-4 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={50}
          className="w-full h-full cursor-pointer"
          onClick={togglePlay}
        />
        {!isPlaying && currentTime === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 pointer-events-none">
            <span className="text-xs text-slate-400 font-medium">
              برای پخش، دکمه پلی یا نوار صوتی را لمس کنید
            </span>
          </div>
        )}
      </div>

      {/* Scrub Range Bar */}
      <div className="space-y-1 mb-4">
        <div className="relative">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.01"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
            dir="ltr"
          />
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400 font-mono px-0.5" dir="ltr">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-slate-800/60">
        {/* Playback speed selector */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
          {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
            <button
              key={rate}
              onClick={() => handleRateChange(rate)}
              className={`px-2 py-0.5 text-xs rounded font-medium transition-all ${
                playbackRate === rate
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {toPersianDigits(rate)}x
            </button>
          ))}
        </div>

        {/* Center transport buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => skipTime(-5)}
            title="۵ ثانیه عقب‌تر"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-[-1px]" />
            )}
          </button>

          <button
            onClick={() => skipTime(5)}
            title="۵ ثانیه جلوتر"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleLoop}
            title={isLooping ? 'تکرار مکرر روشن' : 'تکرار مکرر خاموش'}
            className={`p-2 rounded-xl transition-all ${
              isLooping
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Volume slider */}
        <div className="flex items-center gap-2 min-w-[110px]">
          <button
            onClick={toggleMute}
            className="text-slate-400 hover:text-slate-200 transition-all"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
};
