// مكتبة ثيمات واسعة مصنّفة بأقسام لونية. كل تصنيف (نوع/لون/سلالة) يمكن أن
// يُعيّن له ثيم من الإدارة فيتحوّل تصفّحه كأنه موقع مستقل بهويته.

export interface Theme {
  label: string;
  family: string;
  from: string;
  to: string;
  accent: string;
  bg: string;
  surface: string;
  glow: string;
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function make(label: string, family: string, h: number, s: number, l: number): Theme {
  // تشبّع مكبوح ودرجات وسطى مريحة للعين — لا قاتمة ولا باهتة
  const sat = Math.min(s, 68);
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  return {
    label, family,
    from: hslToHex(h, sat, clamp(l - 10, 32, 58)),
    to: hslToHex(h, sat, clamp(l + 3, 42, 62)),
    accent: hslToHex(h, Math.min(sat + 4, 70), clamp(l - 5, 34, 58)),
    // خلفية وأسطح فاتحة جداً وهادئة — تلوين خفيف مريح
    bg: hslToHex(h, Math.min(Math.round(sat * 0.34), 32), 96),
    surface: hslToHex(h, Math.min(Math.round(sat * 0.22), 22), 98),
    glow: `hsla(${h}, ${sat}%, ${l}%, 0.12)`,
  };
}

// أقسام لونية، لكل قسم درجات متقاربة. لكل درجة تُولّد نسختان (عادية وغامقة).
export const FAMILIES = [
  'ذهبي وترابي', 'برتقالي وأحمر', 'وردي وبنفسجي', 'بنفسجي وأزرق',
  'أزرق وسماوي', 'أخضر وفيروزي', 'محايد وداكن',
];

const FAMILY_BASES: Record<string, [string, number, number][]> = {
  'ذهبي وترابي': [['ذهبي', 43, 66], ['عسلي', 38, 68], ['خردلي', 48, 60], ['كهرماني', 35, 72], ['نحاسي', 28, 60], ['رملي', 40, 48], ['قمحي', 45, 54], ['برونزي', 33, 52]],
  'برتقالي وأحمر': [['يوسفي', 30, 80], ['يقطيني', 25, 74], ['غروب', 14, 76], ['مرجاني', 8, 72], ['قرمزي', 352, 66], ['ياقوتي', 345, 62], ['عنّابي', 358, 52], ['طوبي', 16, 60]],
  'وردي وبنفسجي': [['وردي', 335, 58], ['زهري', 330, 60], ['فلامنجو', 348, 70], ['فوشيا', 305, 62], ['أرجواني وردي', 320, 58], ['توتي', 290, 48], ['عنبي', 280, 48], ['جمشت', 275, 46]],
  'بنفسجي وأزرق': [['أرجواني ملكي', 262, 48], ['بنفسجي', 270, 52], ['خزامى', 255, 44], ['نيلي', 240, 48], ['كوبالت', 225, 62], ['كحلي', 222, 50], ['ياقوت أزرق', 218, 58], ['لازوردي', 214, 58]],
  'أزرق وسماوي': [['سماء', 205, 66], ['محيط', 215, 56], ['سماوي', 192, 60], ['مائي', 185, 52], ['تركوازي', 172, 58], ['جينز', 210, 42], ['أزور', 200, 60], ['نيلي فاتح', 198, 55]],
  'أخضر وفيروزي': [['فيروزي', 184, 56], ['أزرق مخضر', 178, 52], ['زمردي', 160, 56], ['يشمي', 165, 52], ['مرعى', 145, 46], ['غابة', 150, 50], ['نعناعي', 158, 46], ['زيتوني', 75, 46]],
  'محايد وداكن': [['قهوة', 25, 35], ['شوكولاتة', 20, 42], ['موكا', 28, 26], ['بنّي رمادي', 30, 18], ['حجري', 40, 12], ['إردوازي', 215, 16], ['غرافيت', 220, 10], ['فحمي', 222, 9]],
};

// ثيمات ثابتة الأسماء (لافتراضات الأنواع)
const NAMED: Record<string, Theme> = {
  brand: make('الافتراضي', 'مميّزة', 168, 60, 38),
  'sand-gold': make('رملي ذهبي', 'مميّزة', 40, 52, 50),
  'royal-purple': make('أرجواني ملكي', 'مميّزة', 262, 46, 46),
  'meadow-green': make('مرعى', 'مميّزة', 145, 46, 42),
  terracotta: make('طيني', 'مميّزة', 18, 55, 48),
  taupe: make('بنّي رمادي', 'مميّزة', 30, 18, 46),
  'teal-supply': make('فيروزي', 'مميّزة', 184, 56, 42),
};

const generated: Record<string, Theme> = {};
for (const family of FAMILIES) {
  FAMILY_BASES[family].forEach(([label, h, s], i) => {
    generated[`g_${h}_${s}_n`] = make(label, family, h, s, 50);
    generated[`g_${h}_${s}_d`] = make(`${label} غامق`, family, h, s, 38);
  });
}

export const THEMES: Record<string, Theme> = { ...NAMED, ...generated };

export const THEME_LIST = Object.entries(THEMES).map(([key, t]) => ({ key, ...t }));

export const DEFAULT_THEME: Theme = THEMES['brand'];
export const SUPPLIES_NAME = 'مستلزمات الحلال';

const SPECIES_DEFAULT: Record<string, string> = {
  'إبل': 'sand-gold', 'خيل': 'royal-purple', 'غنم': 'meadow-green',
  'ماعز': 'terracotta', 'بقر': 'taupe', 'مستلزمات الحلال': 'teal-supply',
};

export function themeByKey(key?: string | null): Theme {
  return (key && THEMES[key]) || DEFAULT_THEME;
}
export function themeForSpeciesName(name?: string | null): Theme {
  return themeByKey(name ? SPECIES_DEFAULT[name] : undefined);
}

export interface CatNode { name?: string; icon?: string | null; themeKey?: string | null }

export function resolveTheme(chain: (CatNode | null | undefined)[]): Theme {
  for (const c of chain) if (c?.themeKey && THEMES[c.themeKey]) return THEMES[c.themeKey];
  const species = chain[chain.length - 1];
  return themeForSpeciesName(species?.name);
}
export function resolveIcon(chain: (CatNode | null | undefined)[]): string {
  for (const c of chain) if (c?.icon) return c.icon;
  return '🐾';
}

export function gradient(t: Theme): string {
  return `linear-gradient(135deg, ${t.from}, ${t.to})`;
}

// خلفية المشهد — تلوين هادئ مريح بلون النوع (نفحات خفيفة فوق قاعدة فاتحة)
export function sceneBackground(t: Theme): string {
  return [
    `radial-gradient(1200px circle at 100% -14%, ${t.accent}33, transparent 58%)`,
    `radial-gradient(1000px circle at -10% 2%, ${t.to}24, transparent 54%)`,
    `linear-gradient(180deg, ${t.bg}, ${t.surface})`,
  ].join(', ');
}

// متغيّرات CSS تُمرَّر للحاوية: بطاقات بيضاء ناصعة تبرز فوق الحقل اللوني + حدود بلون النوع
export function themeVars(t: Theme): Record<string, string> {
  return {
    '--card-bg': '#ffffff',
    '--card-ring': `${t.accent}33`,
    '--th-from': t.from,
    '--th-to': t.to,
    '--th-accent': t.accent,
    '--th-ink': t.from,
  };
}
