import { VoiceOption, StylePreset, SampleText } from '../types/tts';

export const VOICES: VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Kore',
    persianName: 'کُوره (Kore)',
    gender: 'female',
    description: 'صدای زنانه دلنشین، آرام و شفاف؛ ایده‌آل برای شعر، پادکست و روایت متن‌های احساسی',
    badge: 'پیشنهادی برای شعر و داستان',
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    persianName: 'زَفیر (Zephyr)',
    gender: 'female',
    description: 'صدای زنانه رسا، رسمی و شیوا؛ مناسب برای اخبار، مستند، کتاب‌های آموزشی و مقالات',
    badge: 'گویندگی رسمی و اداری',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'Charon',
    name: 'Charon',
    persianName: 'کارون (Charon)',
    gender: 'male',
    description: 'صدای مردانه بم، گرم و پرصلابت؛ فوق‌العاده برای متون تاریخی، رمان و دکلمه سنگین',
    badge: 'راوی عمیق و حماسی',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'Puck',
    name: 'Puck',
    persianName: 'پاک (Puck)',
    gender: 'male',
    description: 'صدای مردانه پرانرژی، جوان و باانگیزه؛ مناسب مکالمات روزمره، تیزرهای تبلیغاتی و شوخ‌طبعی',
    badge: 'پویا و پرانرژی',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    persianName: 'فَنریر (Fenrir)',
    gender: 'male',
    description: 'صدای مردانه قاطع، رادیویی و کلاسیک؛ عالی برای گویندگی بخش‌های خبری و کنفرانس',
    badge: 'کلاسیک رادیویی',
    color: 'from-violet-500 to-indigo-600',
  },
];

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'standard',
    label: 'استاندارد و رسا',
    prompt: 'Clear, articulate, natural Persian pronunciation, well-paced and elegant.',
    iconName: 'Sparkles',
    description: 'بیان شفاف با تلفظ دقیق و طبیعی حروف فارسی',
  },
  {
    id: 'poetic',
    label: 'شعرخوانی و دکلمه',
    prompt: 'Expressive poetic Persian declamation, emotional cadence with subtle contemplative pauses between verses.',
    iconName: 'Feather',
    description: 'آهنگین و با احساس همراه با مکث‌های ادبی میان ابیات',
  },
  {
    id: 'news',
    label: 'گویندگی خبری و رسمی',
    prompt: 'Professional Persian news anchor tone, authoritative, clear cadence, broadcast journalism quality.',
    iconName: 'Radio',
    description: 'لحن استوار، صریح و بدون مکث اضافی مشابه مجریان اخبار',
  },
  {
    id: 'story',
    label: 'قصه‌گویی و داستانی',
    prompt: 'Engaging, warm Persian audiobook narrator, gentle pacing, captivating and immersive storytelling.',
    iconName: 'BookOpen',
    description: 'روایت گرم و شنیدنی مناسب رمان و قصه‌های کوتاه',
  },
  {
    id: 'friendly',
    label: 'صمیمی و پرانرژی',
    prompt: 'Warm, friendly, casual conversational Persian with cheerful and approachable inflection.',
    iconName: 'Smile',
    description: 'مکالمه دوستانه و پرطراوت مناسب پادکست و گفتگو',
  },
  {
    id: 'calm',
    label: 'آرامش‌بخش و مراقبه',
    prompt: 'Soothing, gentle, calm Persian speaker with relaxed breathing tempo and tranquil cadence.',
    iconName: 'Moon',
    description: 'ملایم و آرام مناسب مراقبه، کتاب صوتی شبانه و متن‌های معنوی',
  },
];

export const SAMPLE_TEXTS: SampleText[] = [
  {
    id: 'saadi',
    title: 'بنی‌آدم - سعدی شیرازی',
    category: 'شعر',
    suggestedVoice: 'Kore',
    suggestedStyle: 'poetic',
    text: `بنی‌آدم اعضای یک پیکرند
که در آفرینش ز یک گوهرند
چو عضوی به درد آورَد روزگار
دگر عضوها را نمانَد قرار
تو کز مِحنت دیگران بی‌غمی
نشاید که نامت نهند آدمی`,
  },
  {
    id: 'hafez',
    title: 'غزلیات - حافظ شیرازی',
    category: 'شعر',
    suggestedVoice: 'Charon',
    suggestedStyle: 'poetic',
    text: `ساقیا برخیز و درده جام را
خاک بر سر کن غمِ ایام را
ساغرِ می بر کفم نه تا ز بر
برکشم این دلق ازرق‌فام را`,
  },
  {
    id: 'ferdowsi',
    title: 'شاهنامه - حکیم فردوسی',
    category: 'شعر',
    suggestedVoice: 'Charon',
    suggestedStyle: 'standard',
    text: `به نام خداوند جان و خرد
کزین برتر اندیشه برنگذرد
خداوند نام و خداوند جای
خداوند روزی‌ده رهنما`,
  },
  {
    id: 'story',
    title: 'قصه‌ای از نسیم سحری',
    category: 'داستان',
    suggestedVoice: 'Kore',
    suggestedStyle: 'story',
    text: `در دامنه‌های سرسبز البرز، صبح با صدای نغمه پرندگان و بوی پونه‌های وحشی آغاز می‌شد. خورشید آرام‌آرام پرتوهای طلایی‌اش را بر پهنه دشت می‌گسترد و شبنم روی گلبرگ‌ها چون مرواریدی درخشان خودنمایی می‌کرد.`,
  },
  {
    id: 'tech',
    title: 'خبر فناوری هوش مصنوعی',
    category: 'خبری',
    suggestedVoice: 'Zephyr',
    suggestedStyle: 'news',
    text: `پژوهشگران اعلام کردند مدل‌های نوین تبدیل متن به گفتار، امکان تولید صدای طبیعی با لحن‌های متناسب احساسی را فراهم کرده‌اند. این فناوری دسترسی به محتوای صوتی را برای همگان آسان‌تر از پیش ساخته است.`,
  },
  {
    id: 'conversation',
    title: 'احوالپرسی و گفتگوی دوستانه',
    category: 'روزمره',
    suggestedVoice: 'Puck',
    suggestedStyle: 'friendly',
    text: `سلام دوستان عزیز! روزتون بخیر و پر از شادی و انرژی مثبت. امیدوارم تا این لحظه روز فوق‌العاده‌ای رو پشت سر گذاشته باشید و برنامه‌هاتون به بهترین شکل پیش بره.`,
  },
];

export const DIACRITICS = [
  { symbol: 'َ', name: 'فتحه (زَبَر)', example: 'بَ' },
  { symbol: 'ِ', name: 'کسره (زیر)', example: 'بِ' },
  { symbol: 'ُ', name: 'ضمه (پیش)', example: 'بُ' },
  { symbol: 'ً', name: 'تنوین نصب', example: 'بً' },
  { symbol: 'ٍ', name: 'تنوین جر', example: 'بٍ' },
  { symbol: 'ٌ', name: 'تنوین رفع', example: 'بٌ' },
  { symbol: 'ّ', name: 'تشدید', example: 'بّ' },
  { symbol: 'ْ', name: 'سکون', example: 'بْ' },
  { symbol: 'ـ', name: 'کشیده (تطویل)', example: 'بـ' },
];
