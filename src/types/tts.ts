export interface VoiceOption {
  id: string;
  name: string;
  persianName: string;
  gender: 'female' | 'male';
  description: string;
  badge: string;
  color: string;
}

export interface StylePreset {
  id: string;
  label: string;
  prompt: string;
  iconName: string;
  description: string;
}

export interface SavedAudio {
  id: string;
  title: string;
  text: string;
  audioBlob?: Blob;
  base64Audio: string;
  mimeType: string;
  voiceName: string;
  voicePersianName: string;
  style: string;
  duration: number; // in seconds
  fileSizeBytes: number;
  createdAt: number; // epoch ms
  isFavorite: boolean;
  tags: string[];
}

export interface TTSRequest {
  text: string;
  voiceName: string;
  style: string;
  model: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts';
}

export interface TTSResponse {
  audio: string; // base64
  mimeType: string;
  voiceName: string;
  model: string;
  text: string;
  duration: number;
  byteLength: number;
}

export interface SampleText {
  id: string;
  title: string;
  category: 'شعر' | 'ادبی' | 'خبری' | 'داستان' | 'آموزشی' | 'روزمره';
  text: string;
  suggestedVoice: string;
  suggestedStyle: string;
}
