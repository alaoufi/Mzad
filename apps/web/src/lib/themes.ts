// هوية بصرية كاملة لكل نوع — لون، خلفية، تدرّج، وعلامة مائية
// تجعل كل سوق "مكاناً مختلفاً".
export interface SpeciesTheme {
  emoji: string;
  from: string;
  to: string;
  accent: string;
  bg: string;       // خلفية الصفحة
  surface: string;  // لمسة لون للأسطح
  glow: string;     // توهّج خفيف للعمق
  label: string;
  tagline: string;
}

export const SPECIES_THEMES: Record<string, SpeciesTheme> = {
  'إبل': {
    emoji: '🐪', from: '#6b4f2a', to: '#c79a3a', accent: '#a87b2e',
    bg: '#f7efdf', surface: '#fffaf0', glow: 'rgba(199,154,58,0.18)',
    label: 'سوق الإبل', tagline: 'مجاهيم · مغاتير · وضح · أصايل',
  },
  'خيل': {
    emoji: '🐎', from: '#2a2a4a', to: '#7a66b0', accent: '#5b4b8a',
    bg: '#eeebf7', surface: '#f8f6ff', glow: 'rgba(122,102,176,0.18)',
    label: 'سوق الخيل', tagline: 'عربي أصيل · نسب وأصالة',
  },
  'غنم': {
    emoji: '🐑', from: '#235c41', to: '#56b083', accent: '#2f7a57',
    bg: '#e7f4ec', surface: '#f3fbf6', glow: 'rgba(86,176,131,0.18)',
    label: 'سوق الغنم', tagline: 'نجدي · نعيمي · حري · سواكني',
  },
  'ماعز': {
    emoji: '🐐', from: '#7a4521', to: '#cf8447', accent: '#a85f33',
    bg: '#fbeee2', surface: '#fff8f1', glow: 'rgba(207,132,71,0.18)',
    label: 'سوق الماعز', tagline: 'عارضي · شامي · حجازي',
  },
  'بقر': {
    emoji: '🐄', from: '#454033', to: '#9a8a64', accent: '#6e6147',
    bg: '#f4f1e8', surface: '#fdfcf7', glow: 'rgba(154,138,100,0.18)',
    label: 'سوق البقر', tagline: 'هولشتاين · جيرسي · بلدي',
  },
  'مستلزمات الحلال': {
    emoji: '🛒', from: '#0e5a6b', to: '#28a0a8', accent: '#127d86',
    bg: '#e6f5f6', surface: '#f2fbfb', glow: 'rgba(40,160,168,0.18)',
    label: 'سوق المستلزمات', tagline: 'أعلاف · صيدليات بيطرية · مستلزمات',
  },
};

export const DEFAULT_THEME: SpeciesTheme = {
  emoji: '🐪', from: '#0a5c50', to: '#13a08c', accent: '#0f7b6c',
  bg: '#f3f1ea', surface: '#ffffff', glow: 'rgba(19,160,140,0.16)',
  label: 'سوق ومزادات المواشي', tagline: 'إبل · غنم · ماعز · بقر · خيل',
};

export const SUPPLIES_NAME = 'مستلزمات الحلال';

export function themeFor(speciesName?: string | null): SpeciesTheme {
  if (speciesName && SPECIES_THEMES[speciesName]) return SPECIES_THEMES[speciesName];
  return DEFAULT_THEME;
}

export function gradient(t: SpeciesTheme): string {
  return `linear-gradient(135deg, ${t.from}, ${t.to})`;
}

// خلفية المشهد ثلاثية الأبعاد (تدرّجات شعاعية ناعمة) لكل نوع
export function sceneBackground(t: SpeciesTheme): string {
  return [
    `radial-gradient(900px circle at 100% -5%, ${t.glow}, transparent 45%)`,
    `radial-gradient(700px circle at -10% 10%, ${t.glow}, transparent 40%)`,
    `linear-gradient(180deg, ${t.bg}, ${t.bg})`,
  ].join(', ');
}
