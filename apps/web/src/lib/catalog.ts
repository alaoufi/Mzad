// تعريف التصنيف الافتراضي — مصدر واحد يستخدمه البذر وإعادة البناء من الإدارة.
//  إبل → اللون → سلالة | غنم → (نجدي/حري/ماعز) → سلالة | خيل → اللون → سلالة

export interface CatalogType { icon?: string; breeds: string[] }
export interface CatalogSpecies { icon: string; groups: Record<string, CatalogType> }

export const ANIMAL_CATALOG: Record<string, CatalogSpecies> = {
  'إبل': { icon: '🐪', groups: {
    'وضح': { breeds: ['غير معروف'] },
    'شقح': { breeds: ['غير معروف'] },
    'صفر': { breeds: ['غير معروف'] },
    'شعل': { breeds: ['غير معروف'] },
    'مجاهيم': { breeds: ['غير معروف'] },
    'أخرى': { breeds: ['غير معروف'] },
  } },
  'غنم': { icon: '🐑', groups: {
    'نجدي': { icon: '🐑', breeds: ['أصل', 'مهجن'] },
    'حري': { icon: '🐑', breeds: ['أصل', 'مهجن'] },
    'ماعز': { icon: '🐐', breeds: ['عارضي', 'بورقوت', 'مهجن'] },
  } },
  'خيل': { icon: '🐎', groups: {
    'أدهم': { breeds: ['عربي أصيل', 'هجين'] },
    'أشقر': { breeds: ['عربي أصيل', 'هجين'] },
    'كميت': { breeds: ['عربي أصيل', 'هجين'] },
    'أشهب': { breeds: ['عربي أصيل', 'هجين'] },
    'أحمر': { breeds: ['عربي أصيل', 'هجين'] },
    'أخرى': { breeds: ['عربي أصيل', 'هجين'] },
  } },
};

export const SUPPLIES_NAME = 'مستلزمات الحلال';
export const SUPPLIES_CATALOG: { icon: string; groups: Record<string, { icon: string; items: string[] }> } = {
  icon: '🛒',
  groups: {
    'أعلاف': { icon: '🌾', items: ['برسيم', 'شعير', 'جت', 'أعلاف مركّزة'] },
    'صيدلية بيطرية': { icon: '💊', items: ['أدوية', 'لقاحات', 'مكمّلات وفيتامينات'] },
    'مستلزمات وأدوات': { icon: '⚙️', items: ['مشارب ومعالف', 'حظائر وأسوار', 'أدوات عناية'] },
  },
};
