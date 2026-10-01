const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Convert English digits to Persian digits
 */
export function toPersianDigits(input: string | number): string {
  if (input === null || input === undefined) return '';
  return String(input).replace(/[0-9]/g, (w) => PERSIAN_DIGITS[+w]);
}

/**
 * Format seconds into mm:ss with Persian digits
 */
export function formatTime(seconds: number, persian = true): string {
  if (isNaN(seconds) || seconds < 0) return persian ? '۰۰:۰۰' : '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return persian ? toPersianDigits(formatted) : formatted;
}

/**
 * Format bytes to readable Persian representation (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '۰ بایت';
  if (bytes < 1024) {
    return `${toPersianDigits(bytes)} بایت`;
  } else if (bytes < 1024 * 1024) {
    const kb = (bytes / 1024).toFixed(1);
    return `${toPersianDigits(kb)} کیلوبایت`;
  } else {
    const mb = (bytes / (1024 * 1024)).toFixed(1);
    return `${toPersianDigits(mb)} مگابایت`;
  }
}

/**
 * Format epoch timestamp into Persian date and time
 */
export function formatPersianDate(timestamp: number): string {
  try {
    const date = new Date(timestamp);
    const now = Date.now();
    const diffSec = Math.floor((now - timestamp) / 1000);

    if (diffSec < 60) return 'همین چند لحظه پیش';
    if (diffSec < 3600) return `${toPersianDigits(Math.floor(diffSec / 60))} دقیقه پیش`;
    if (diffSec < 86400) return `${toPersianDigits(Math.floor(diffSec / 3600))} ساعت پیش`;

    // Persian calendar Intl formatting
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return new Date(timestamp).toLocaleDateString();
  }
}

/**
 * Base64 string to Blob
 */
export function base64ToBlob(base64: string, mimeType = 'audio/wav'): Blob {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * Download a Blob or base64 as an audio file to user's device
 */
export function triggerAudioDownload(
  data: Blob | string,
  filename = 'ava-negar.wav',
  mimeType = 'audio/wav'
) {
  let blob: Blob;
  if (typeof data === 'string') {
    blob = base64ToBlob(data, mimeType);
  } else {
    blob = data;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.wav') ? filename : `${filename}.wav`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Create a safe clean filename in Persian or English
 */
export function createSafeFilename(title: string): string {
  const clean = title
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .slice(0, 30)
    .replace(/\s+/g, '_');
  return clean || 'ava_persian_audio';
}
