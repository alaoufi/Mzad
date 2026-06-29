// هوية بصرية مختلفة لكل نوع ماشية — تتغيّر الصفحة بالكامل حسب السوق
export interface SpeciesTheme {
  emoji: string;
  from: string;
  to: string;
  accent: string;
  bg: string;
  label: string;
  tagline: string;
}

export const SPECIES_THEMES: Record<string, SpeciesTheme> = {
  'إبل': {
    emoji: '🐪', from: '#7c5e3b', to: '#c79a3a', accent: '#a87b2e',
    bg: '#faf5ea', label: 'سوق الإبل', tagline: 'مجاهيم · مغاتير · وضح · أصايل',
  },
  'خيل': {
    emoji: '🐎', from: '#33324f', to: '#6d5b9e', accent: '#5b4b8a',
    bg: '#f3f1fa', label: 'سوق الخيل', tagline: 'عربي أصيل · نسب وأصالة',
  },
  'غنم': {
    emoji: '🐑', from: '#2f6d4f', to: '#4fa37a', accent: '#2f7a57',
    bg: '#eef7f1', label: 'سوق الغنم', tagline: 'نجدي · نعيمي · حري · سواكني',
  },
  'ماعز': {
    emoji: '🐐', from: '#8a4f2b', to: '#c07a45', accent: '#a85f33',
    bg: '#fbf2ea', label: 'سوق الماعز', tagline: 'عارضي · شامي · حجازي',
  },
  'بقر': {
    emoji: '🐄', from: '#4a4438', to: '#9a8a64', accent: '#6e6147',
    bg: '#f7f4ec', label: 'سوق البقر', tagline: 'هولشتاين · جيرسي · بلدي',
  },
};

export const DEFAULT_THEME: SpeciesTheme = {
  emoji: '🐪', from: '#0a5c50', to: '#13a08c', accent: '#0f7b6c',
  bg: '#faf7f0', label: 'سوق ومزادات المواشي', tagline: 'إبل · غنم · ماعز · بقر · خيل',
};

export function themeFor(speciesName?: string | null): SpeciesTheme {
  if (speciesName && SPECIES_THEMES[speciesName]) return SPECIES_THEMES[speciesName];
  return DEFAULT_THEME;
}

export function gradient(t: SpeciesTheme): string {
  return `linear-gradient(to left, ${t.from}, ${t.to})`;
}
