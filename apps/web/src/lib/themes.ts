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

/* ───────── نظام الأنماط الشكلية (ليست ألواناً فقط) ─────────
   لكل عائلة/نوع نمط زخرفي مختلف بالشكل: كثبان، تلال، قمم، أمواج،
   حراشف، خطوط حركة، بقع، شبكة… يتحوّل تصفّح كل صنف كأنه موقع مستقل. */

const svgBg = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}")`;

type Pattern = (c: string) => { svg: string; size: string };

const PATTERNS: Record<string, Pattern> = {
  // كثبان رملية متموّجة — للإبل والعائلة الترابية
  dunes: (c) => ({ size: '160px 80px', svg:
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='80'><g fill='none' stroke='${c}' stroke-width='2.4' opacity='0.13'><path d='M0 52 Q40 28 80 52 T160 52'/><path d='M0 70 Q40 46 80 70 T160 70'/></g></svg>` }),
  // تلال خضراء ناعمة — للغنم والمراعي
  hills: (c) => ({ size: '150px 70px', svg:
    `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='70'><g fill='${c}' opacity='0.10'><ellipse cx='35' cy='90' rx='55' ry='48'/><ellipse cx='110' cy='95' rx='60' ry='52'/></g></svg>` }),
  // قمم جبلية — للماعز
  peaks: (c) => ({ size: '120px 70px', svg:
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='70'><g fill='none' stroke='${c}' stroke-width='2.4' opacity='0.14'><path d='M0 68 L28 22 L56 68 M58 68 L88 30 L118 68'/></g></svg>` }),
  // أمواج مائية — للعائلات الزرقاء
  waves: (c) => ({ size: '90px 44px', svg:
    `<svg xmlns='http://www.w3.org/2000/svg' width='90' height='44'><g fill='none' stroke='${c}' stroke-width='1.8' opacity='0.14'><path d='M0 22 Q22 8 45 22 T90 22'/><path d='M0 36 Q22 22 45 36 T90 36'/></g></svg>` }),
  // حراشف/ريش — للطيور والدواجن
  scales: (c) => ({ size: '64px 32px', svg:
    `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='32'><g fill='none' stroke='${c}' stroke-width='1.8' opacity='0.14'><path d='M0 32 A16 16 0 0 1 32 32 A16 16 0 0 1 64 32'/><path d='M-32 16 A16 16 0 0 1 0 16 A16 16 0 0 1 32 16 A16 16 0 0 1 64 16'/></g></svg>` }),
  // خطوط حركة قطرية — للخيل
  motion: (c) => ({ size: '70px 70px', svg:
    `<svg xmlns='http://www.w3.org/2000/svg' width='70' height='70'><g stroke='${c}' stroke-width='2.4' stroke-linecap='round' opacity='0.11'><line x1='6' y1='22' x2='34' y2='22'/><line x1='40' y1='48' x2='66' y2='48'/></g></svg>` }),
  // بقع — للبقر
  spots: (c) => ({ size: '110px 110px', svg:
    `<svg xmlns='http://www.w3.org/2000/svg' width='110' height='110'><g fill='${c}' opacity='0.08'><ellipse cx='32' cy='30' rx='18' ry='13' transform='rotate(-18 32 30)'/><ellipse cx='80' cy='76' rx='14' ry='19' transform='rotate(12 80 76)'/></g></svg>` }),
  // شبكة منقّطة — للمستلزمات
  grid: (c) => ({ size: '30px 30px', svg:
    `<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30'><circle cx='3' cy='3' r='2.2' fill='${c}' opacity='0.16'/></svg>` }),
  // نقاط ناعمة — الافتراضي
  bloom: (c) => ({ size: '96px 96px', svg:
    `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><g fill='${c}' opacity='0.08'><circle cx='22' cy='22' r='6'/><circle cx='74' cy='52' r='4'/><circle cx='44' cy='80' r='5'/></g></svg>` }),
};

const SPECIES_MOTIF: Record<string, string> = {
  'إبل': 'dunes', 'خيل': 'motion', 'غنم': 'hills', 'ماعز': 'peaks',
  'بقر': 'spots', 'دجاج': 'scales', 'طيور': 'scales', 'دواجن': 'scales',
  [SUPPLIES_NAME]: 'grid',
};
const FAMILY_MOTIF: Record<string, string> = {
  'ذهبي وترابي': 'dunes', 'أخضر وفيروزي': 'hills', 'برتقالي وأحمر': 'peaks',
  'أزرق وسماوي': 'waves', 'بنفسجي وأزرق': 'waves', 'وردي وبنفسجي': 'bloom',
  'محايد وداكن': 'grid',
};

// يحدّد نمط الشكل من سلسلة التصنيفات (اسم النوع أولاً) ثم العائلة اللونية
export function resolveMotif(chain: (CatNode | null | undefined)[], theme: Theme): string {
  for (const c of chain) { if (c?.name && SPECIES_MOTIF[c.name]) return SPECIES_MOTIF[c.name]; }
  return FAMILY_MOTIF[theme.family] ?? 'bloom';
}

// خلفية المشهد — نمط شكلي مميّز للنوع + نفحات لونية هادئة فوق قاعدة فاتحة
export function sceneBackground(t: Theme, motif: string = 'bloom'): string {
  const p = (PATTERNS[motif] ?? PATTERNS.bloom)(t.accent);
  return [
    `${svgBg(p.svg)} center top / ${p.size} repeat`,
    `radial-gradient(1200px circle at 100% -14%, ${t.accent}2e, transparent 58%) no-repeat`,
    `radial-gradient(1000px circle at -10% 2%, ${t.to}20, transparent 54%) no-repeat`,
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
