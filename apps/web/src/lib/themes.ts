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

// بانٍ تدرّج مزدوج (لونان مختلفان) — لثيمات فاخرة مرسومة يدوياً، أوضح حيويةً
function duo(
  label: string, h1: number, s1: number, l1: number, h2: number, s2: number, l2: number,
  ha: number, sa: number, la: number,
): Theme {
  return {
    label, family: 'ثيمات فاخرة',
    from: hslToHex(h1, s1, l1),
    to: hslToHex(h2, s2, l2),
    accent: hslToHex(ha, sa, la),
    bg: hslToHex(ha, Math.min(Math.round(sa * 0.3), 28), 96),
    surface: hslToHex(ha, Math.min(Math.round(sa * 0.2), 18), 98),
    glow: `hsla(${ha}, ${sa}%, ${la}%, 0.16)`,
  };
}

// أقسام لونية، لكل قسم درجات متقاربة. لكل درجة تُولّد نسختان (عادية وغامقة).
export const FAMILIES = [
  'ثيمات فاخرة',
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
  FAMILY_BASES[family]?.forEach(([label, h, s]) => {
    generated[`g_${h}_${s}_n`] = make(label, family, h, s, 50);
    generated[`g_${h}_${s}_d`] = make(`${label} غامق`, family, h, s, 38);
  });
}

// ثيمات فاخرة بتدرّجات مزدوجة مرسومة يدوياً — حيوية لكنها مريحة للعين
const LUX: Record<string, Theme> = {
  lux_sunset:   duo('صحراء الغروب', 28, 88, 56, 332, 70, 56, 15, 85, 52),
  lux_najdi:    duo('ليل نجدي', 235, 58, 30, 268, 55, 46, 226, 70, 56),
  lux_oasis:    duo('واحة', 180, 62, 40, 150, 56, 46, 166, 64, 40),
  lux_sand:     duo('رمال ذهبية', 45, 80, 56, 33, 82, 50, 40, 85, 48),
  lux_redsea:   duo('البحر الأحمر', 8, 78, 56, 186, 60, 46, 2, 76, 52),
  lux_emerald:  duo('زمرّد ملكي', 162, 62, 38, 186, 56, 44, 158, 66, 38),
  lux_taif:     duo('وردة الطائف', 340, 66, 60, 356, 60, 56, 336, 70, 52),
  lux_coffee:   duo('قهوة عربية', 25, 48, 38, 32, 56, 48, 22, 52, 40),
  lux_dawn:     duo('فجر', 20, 82, 66, 282, 46, 66, 14, 76, 58),
  lux_ruby:     duo('ياقوت', 346, 66, 46, 356, 62, 44, 348, 70, 46),
  lux_azure:    duo('لازورد', 206, 72, 52, 226, 62, 50, 210, 76, 48),
  lux_lavender: duo('خزامى', 256, 46, 58, 276, 50, 56, 262, 56, 52),
  lux_mint:     duo('نعناع بارد', 160, 52, 56, 186, 56, 56, 168, 56, 46),
  lux_berry:    duo('توت بري', 330, 56, 46, 290, 46, 44, 320, 60, 46),
  lux_aurora:   duo('شفق قطبي', 170, 62, 46, 266, 56, 54, 190, 66, 46),
  lux_ocean:    duo('محيط عميق', 220, 56, 32, 196, 56, 44, 206, 66, 42),
  lux_honey:    duo('عسل وكراميل', 42, 82, 56, 30, 56, 46, 38, 76, 48),
  lux_dusk:     duo('سماء المغيب', 215, 56, 56, 30, 78, 62, 220, 60, 50),
};

export const THEMES: Record<string, Theme> = { ...LUX, ...NAMED, ...generated };

export const THEME_LIST = Object.entries(THEMES).map(([key, t]) => ({ key, ...t }));

export const DEFAULT_THEME: Theme = THEMES['brand'];
export const SUPPLIES_NAME = 'مستلزمات الحلال';

// أيقونات صور حقيقية لبعض الأنواع (بدل الإيموجي) — تُطابَق بالاسم
export const CAT_IMAGE_ICONS: Record<string, string> = {
  'إبل': '/icons/ibil.jpg',
  'غنم': '/icons/ghanam.jpg',
};
export const catImageIcon = (name?: string | null): string | null =>
  (name && CAT_IMAGE_ICONS[name.trim()]) || null;
// مطابقة بالنص: يعيد صورة النوع إن ورد اسمه داخل النص (مثل «عروض إبل»)
export const catImageIconForText = (text?: string | null): string | null => {
  if (!text) return null;
  for (const key of Object.keys(CAT_IMAGE_ICONS)) if (text.includes(key)) return CAT_IMAGE_ICONS[key];
  return null;
};

const SPECIES_DEFAULT: Record<string, string> = {
  'إبل': 'lux_sand', 'خيل': 'lux_najdi', 'غنم': 'lux_oasis',
  'ماعز': 'lux_coffee', 'بقر': 'lux_honey', 'دجاج': 'lux_dawn', 'طيور': 'lux_aurora',
  'مستلزمات الحلال': 'lux_mint',
};

export function themeByKey(key?: string | null): Theme {
  return (key && THEMES[key]) || DEFAULT_THEME;
}
export function themeForSpeciesName(name?: string | null): Theme {
  return themeByKey(name ? SPECIES_DEFAULT[name] : undefined);
}

export interface CatNode {
  name?: string; icon?: string | null; themeKey?: string | null;
  motifKey?: string | null; shapeKey?: string | null; layoutKey?: string | null; cardStyle?: string | null;
}

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

/* ───────── محرّك الهويّات (Skin Engine) ─────────
   يركّب لكل تصنيف هويّة كاملة من محاور مستقلة:
   لوحة لونية × نمط شكلي × استدارة مكوّنات × تخطيط × شكل بطاقة.
   تُشتقّ حتمياً من اسم التصنيف (نفس التصنيف = نفس الهوية دائماً) فيحصل
   كل قسم تلقائياً على إحساس «موقع مستقل» — وعدد التوليفات هائل جداً. */

// لغة شكل المكوّنات — تتبدّل استدارة البطاقات والرقائق والأزرار حسب الصنف
const SHAPES: Record<string, { card: string; chip: string; btn: string }> = {
  dunes:  { card: '1.75rem', chip: '9999px', btn: '1.25rem' },
  hills:  { card: '2rem',    chip: '9999px', btn: '1.5rem'  },
  peaks:  { card: '0.55rem', chip: '0.5rem', btn: '0.5rem'  },
  waves:  { card: '1.5rem',  chip: '9999px', btn: '1.1rem'  },
  motion: { card: '1rem',    chip: '0.6rem', btn: '0.7rem'  },
  spots:  { card: '1.6rem',  chip: '9999px', btn: '1.25rem' },
  scales: { card: '1.25rem', chip: '1rem',   btn: '0.9rem'  },
  grid:   { card: '0.7rem',  chip: '0.5rem', btn: '0.5rem'  },
  bloom:  { card: '1.5rem',  chip: '9999px', btn: '1rem'    },
};

const PATTERN_KEYS = Object.keys(PATTERNS);
const SHAPE_KEYS = Object.keys(SHAPES);
export const CARD_STYLES = ['classic', 'overlay', 'polaroid', 'ticket'] as const;
export type CardStyle = (typeof CARD_STYLES)[number];
export const LAYOUT_KEYS = ['dunes', 'hills', 'peaks', 'waves', 'motion', 'spots', 'scales', 'grid', 'bloom'];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export type Mood = 'airy' | 'rich';

export interface Skin {
  theme: Theme;
  motif: string;     // نمط خلفية الشكل
  shapeKey: string;  // استدارة المكوّنات
  layoutKey: string; // تخطيط الشبكة
  cardStyle: CardStyle;
  font: string;      // خط العناوين (CSS font-family)
  mood: Mood;        // مزاج فاتح/غني
}

// خطوط العناوين حسب العائلة اللونية + قائمة احتياطية حتمية
const FAMILY_FONT: Record<string, string> = {
  'ذهبي وترابي': "'Amiri', serif",
  'برتقالي وأحمر': "'Changa', sans-serif",
  'وردي وبنفسجي': "'El Messiri', sans-serif",
  'بنفسجي وأزرق': "'Reem Kufi', sans-serif",
  'أزرق وسماوي': "'Cairo', sans-serif",
  'أخضر وفيروزي': "'El Messiri', sans-serif",
  'محايد وداكن': "'Cairo', sans-serif",
};
const FONT_CSS = [
  "'Cairo', sans-serif", "'Reem Kufi', sans-serif", "'El Messiri', sans-serif",
  "'Changa', sans-serif", "'Lalezar', cursive", "'Amiri', serif",
];

// عدد التوليفات الممكنة (لإظهاره للإدارة) = ألوان × أنماط × أشكال × تخطيطات × بطاقات
export const SKIN_COMBINATIONS =
  THEME_LIST.length * PATTERN_KEYS.length * SHAPE_KEYS.length * LAYOUT_KEYS.length * CARD_STYLES.length;

// أقرب تثبيت يدوي في السلسلة (الأعمق أولاً) لمحور معيّن
function pinned(chain: (CatNode | null | undefined)[], get: (c: CatNode) => string | null | undefined): string | undefined {
  for (const c of chain) { const v = c ? get(c) : null; if (v) return v; }
  return undefined;
}

export function resolveSkin(chain: (CatNode | null | undefined)[]): Skin {
  const theme = resolveTheme(chain);
  const speciesName = chain[chain.length - 1]?.name;          // النوع (الجذر)
  const seedName = chain.find((c) => c?.name)?.name ?? speciesName ?? 'مزاد'; // الأعمق
  const h = hashStr(`${seedName}|${theme.family}`);

  // كل محور: تثبيت يدوي إن وُجد، وإلا مخصّص معروف، وإلا حتمي من البذرة
  const motif = pinned(chain, (c) => c.motifKey)
    || (speciesName && SPECIES_MOTIF[speciesName])
    || FAMILY_MOTIF[theme.family]
    || PATTERN_KEYS[h % PATTERN_KEYS.length];
  const shapeKey = pinned(chain, (c) => c.shapeKey) || SHAPE_KEYS[Math.floor(h / 7) % SHAPE_KEYS.length];
  const layoutKey = pinned(chain, (c) => c.layoutKey) || LAYOUT_KEYS[Math.floor(h / 53) % LAYOUT_KEYS.length];
  const pinnedCard = pinned(chain, (c) => c.cardStyle) as CardStyle | undefined;
  const cardStyle = (pinnedCard && CARD_STYLES.includes(pinnedCard) ? pinnedCard : null)
    || CARD_STYLES[Math.floor(h / 389) % CARD_STYLES.length];

  const font = FAMILY_FONT[theme.family] || FONT_CSS[Math.floor(h / 97) % FONT_CSS.length];
  const mood: Mood = Math.floor(h / 211) % 3 === 0 ? 'rich' : 'airy';

  return { theme, motif, shapeKey, layoutKey, cardStyle, font, mood };
}

// كل متغيّرات الهوية للحاوية: استدارة + خط العناوين + سطح البطاقة حسب المزاج
export function skinVars(skin: Skin): Record<string, string> {
  const base = themeVars(skin.theme, skin.shapeKey);
  return {
    ...base,
    '--font-display': skin.font,
    '--card-bg': skin.mood === 'rich' ? `color-mix(in srgb, ${skin.theme.accent} 7%, white)` : '#ffffff',
    '--card-ring': skin.mood === 'rich' ? `${skin.theme.accent}40` : base['--card-ring'],
  };
}

// خيارات المحاور (مفتاح + وصف عربي) — للوحة الإدارة
export const MOTIF_OPTIONS = [
  { key: 'dunes', label: 'كثبان' }, { key: 'hills', label: 'تلال' }, { key: 'peaks', label: 'قمم' },
  { key: 'waves', label: 'أمواج' }, { key: 'scales', label: 'حراشف' }, { key: 'motion', label: 'حركة' },
  { key: 'spots', label: 'بقع' }, { key: 'grid', label: 'شبكة' }, { key: 'bloom', label: 'نقاط' },
];
export const SHAPE_OPTIONS = [
  { key: 'hills', label: 'دائري ناعم' }, { key: 'dunes', label: 'انسيابي' }, { key: 'bloom', label: 'معتدل' },
  { key: 'scales', label: 'متوسط' }, { key: 'waves', label: 'مدوّر' }, { key: 'motion', label: 'عصري' },
  { key: 'spots', label: 'مدوّر دافئ' }, { key: 'peaks', label: 'حادّ' }, { key: 'grid', label: 'صندوقي' },
];
export const LAYOUT_OPTIONS = [
  { key: 'bloom', label: 'شبكة قياسية' }, { key: 'hills', label: 'فسيح' }, { key: 'spots', label: 'فسيح مريح' },
  { key: 'grid', label: 'كثيف (كتالوج)' }, { key: 'scales', label: 'كثيف جداً' }, { key: 'peaks', label: 'متوسط مدمج' },
  { key: 'waves', label: 'قياسي' }, { key: 'dunes', label: 'بطاقة متصدّرة' }, { key: 'motion', label: 'متصدّرة حركية' },
];
export const CARD_OPTIONS = [
  { key: 'classic', label: 'كلاسيكي' }, { key: 'overlay', label: 'مجلّة' },
  { key: 'polaroid', label: 'بولارويد' }, { key: 'ticket', label: 'تذكرة' },
];

// طبقة نمط الشكل بلون مخصّص (للترويسات والزخارف) — صورة + مقاس التكرار
export function motifPattern(motif: string, color: string): { image: string; size: string } {
  const p = (PATTERNS[motif] ?? PATTERNS.bloom)(color);
  return { image: svgBg(p.svg), size: p.size };
}

// حافة مقصوصة لأسفل الترويسة بشكل يناسب النمط (مسار SVG ضمن 1440×48، يُملأ بلون الصفحة)
const HERO_EDGES: Record<string, string> = {
  wave: 'M0 48 L0 22 C240 0 480 44 720 22 C960 0 1200 44 1440 22 L1440 48 Z',
  zigzag: 'M0 48 L0 26 L120 8 L240 26 L360 8 L480 26 L600 8 L720 26 L840 8 L960 26 L1080 8 L1200 26 L1320 8 L1440 26 L1440 48 Z',
  scallop: 'M0 48 L0 26 Q60 0 120 26 T240 26 T360 26 T480 26 T600 26 T720 26 T840 26 T960 26 T1080 26 T1200 26 T1320 26 T1440 26 L1440 48 Z',
  slant: 'M0 48 L0 32 L1440 8 L1440 48 Z',
  flat: 'M0 48 L0 18 L1440 18 L1440 48 Z',
  curve: 'M0 48 L0 30 Q720 -6 1440 30 L1440 48 Z',
};
const MOTIF_EDGE: Record<string, string> = {
  dunes: 'wave', waves: 'wave', peaks: 'zigzag', scales: 'scallop',
  motion: 'slant', grid: 'flat', hills: 'curve', spots: 'curve', bloom: 'curve',
};
export function heroEdgePath(motif: string): string {
  return HERO_EDGES[MOTIF_EDGE[motif] ?? 'curve'] ?? HERO_EDGES.curve;
}

// خلفية المشهد — نمط شكلي مميّز للنوع + نفحات لونية (أغنى في المزاج «الغني»)
export function sceneBackground(t: Theme, motif: string = 'bloom', mood: Mood = 'airy'): string {
  const p = (PATTERNS[motif] ?? PATTERNS.bloom)(t.accent);
  const a1 = mood === 'rich' ? '4a' : '2e';
  const a2 = mood === 'rich' ? '30' : '20';
  return [
    `${svgBg(p.svg)} center top / ${p.size} repeat`,
    `radial-gradient(1200px circle at 100% -14%, ${t.accent}${a1}, transparent 58%) no-repeat`,
    `radial-gradient(1000px circle at -10% 2%, ${t.to}${a2}, transparent 54%) no-repeat`,
    `linear-gradient(180deg, ${t.bg}, ${t.surface})`,
  ].join(', ');
}

// متغيّرات CSS تُمرَّر للحاوية: بطاقات بيضاء ناصعة تبرز فوق الحقل اللوني + حدود بلون النوع
// + لغة شكل المكوّنات (استدارة) حسب النمط
export function themeVars(t: Theme, motif: string = 'bloom'): Record<string, string> {
  const s = SHAPES[motif] ?? SHAPES.bloom;
  return {
    '--card-bg': '#ffffff',
    '--card-ring': `${t.accent}33`,
    '--th-from': t.from,
    '--th-to': t.to,
    '--th-accent': t.accent,
    '--th-ink': t.from,
    '--card-radius': s.card,
    '--chip-radius': s.chip,
    '--btn-radius': s.btn,
  };
}
