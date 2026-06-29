import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// تصنيف ثلاثي: النوع (SPECIES) ← اللون/الصنف (TYPE) ← السلالة (BREED)
// تصنيف ثلاثي حسب المتعارف عليه:
//  إبل → اللون → سلالة | غنم → (نجدي/حري/ماعز) → سلالة | خيل → اللون → سلالة
const CATALOG: Record<string, { icon: string; groups: Record<string, { icon?: string; breeds: string[] }> }> = {
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

// سوق المستلزمات: القسم ← الفئة (مع رموز) ← أصناف
const SUPPLIES: { icon: string; groups: Record<string, { icon: string; items: string[] }> } = {
  icon: '🛒',
  groups: {
    'أعلاف': { icon: '🌾', items: ['برسيم', 'شعير', 'جت', 'أعلاف مركّزة'] },
    'صيدلية بيطرية': { icon: '💊', items: ['أدوية', 'لقاحات', 'مكمّلات وفيتامينات'] },
    'مستلزمات وأدوات': { icon: '⚙️', items: ['مشارب ومعالف', 'حظائر وأسوار', 'أدوات عناية'] },
  },
};

async function ensureUser(phone: string, data: any) {
  return (await prisma.user.findUnique({ where: { phone } })) ??
    (await prisma.user.create({ data: { phone, ...data } }));
}

const img = (id: string) => `https://images.unsplash.com/${id}`;

async function fullRebuild() {
  console.log('🌱 إعادة بناء التصنيف الثلاثي والبيانات التجريبية...');
  await prisma.listing.deleteMany();
  await prisma.category.deleteMany();

  const breedIds: Record<string, string> = {};
  for (const [species, { icon, groups }] of Object.entries(CATALOG)) {
    const sp = await prisma.category.create({ data: { name: species, level: 'SPECIES', icon } });
    for (const [type, { icon: tIcon, breeds }] of Object.entries(groups)) {
      const col = await prisma.category.create({ data: { name: type, level: 'TYPE', parentId: sp.id, icon: tIcon ?? null } });
      for (const breed of breeds) {
        const br = await prisma.category.create({ data: { name: breed, level: 'BREED', parentId: col.id } });
        breedIds[`${species}/${type}/${breed}`] = br.id;
      }
    }
  }

  const seller = await ensureUser('966500000001', { name: 'أبو محمد القحطاني', isPhoneVerified: true, identityStatus: 'VERIFIED', city: 'بريدة', region: 'القصيم', trustScore: 4.8 });
  const broker = await ensureUser('966500000002', { name: 'دلال المنصة — سعد', role: 'BROKER', isPhoneVerified: true, identityStatus: 'VERIFIED', city: 'الرياض', region: 'الرياض', trustScore: 4.9 });
  const buyer = await ensureUser('966500000003', { name: 'فهد العتيبي', isPhoneVerified: true, city: 'الرياض', region: 'الرياض', trustScore: 4.5 });

  await prisma.listing.create({ data: {
    sellerId: seller.id, categoryId: breedIds['غنم/نجدي/أصل'], title: 'خروف نجدي أسود ممتاز',
    description: 'خروف نجدي، صحته ممتازة، مطعّم بالكامل.', count: 1, sex: 'MALE', approxWeightKg: 55,
    saleType: 'DIRECT', price: new Prisma.Decimal(1800), city: 'بريدة', region: 'القصيم', lat: 26.359, lng: 43.973, status: 'ACTIVE',
    health: { create: [{ key: 'vaccinated', value: true }, { key: 'teeth', value: true }] },
    media: { create: [{ url: img('photo-1484557985045-edf25e08da73'), type: 'IMAGE' }] },
  } });
  await prisma.listing.create({ data: {
    sellerId: seller.id, categoryId: breedIds['غنم/ماعز/عارضي'], title: 'تيس عارضي أصيل',
    description: 'تيس عارضي لون أسود، نشيط، مناسب للتربية.', count: 1, sex: 'MALE', approxWeightKg: 40,
    saleType: 'DIRECT', price: new Prisma.Decimal(2500), city: 'عنيزة', region: 'القصيم', status: 'ACTIVE',
    health: { create: [{ key: 'vaccinated', value: true }] },
    media: { create: [{ url: img('photo-1524024973431-2ad916746881'), type: 'IMAGE' }] },
  } });

  const auctionListing = await prisma.listing.create({ data: {
    sellerId: seller.id, categoryId: breedIds['إبل/مجاهيم/غير معروف'], title: 'ناقة مجاهيم أصايل — مزاد مفتوح',
    description: 'ناقة مجاهيم أصيلة، منتجة، خالية من العيوب.', count: 1, sex: 'FEMALE', approxWeightKg: 450,
    productionStatus: 'منتجة', saleType: 'AUCTION', city: 'الرياض', region: 'الرياض', lat: 24.713, lng: 46.675, status: 'ACTIVE',
    health: { create: [{ key: 'vaccinated', value: true }, { key: 'udder', value: true }, { key: 'mange', value: false }, { key: 'abscess', value: false }] },
    media: { create: [{ url: img('photo-1547234935-80c7145ec969'), type: 'IMAGE' }] },
  } });
  const now = new Date();
  const auction = await prisma.auction.create({ data: {
    listingId: auctionListing.id, brokerId: broker.id, startPrice: new Prisma.Decimal(15000),
    minIncrement: new Prisma.Decimal(500), reservePrice: new Prisma.Decimal(20000), deposit: new Prisma.Decimal(1000),
    startAt: now, endAt: new Date(now.getTime() + 24 * 3600_000), status: 'LIVE',
  } });
  const b1 = await prisma.bid.create({ data: { auctionId: auction.id, bidderId: buyer.id, amount: new Prisma.Decimal(15000) } });
  const b2 = await prisma.bid.create({ data: { auctionId: auction.id, bidderId: broker.id, amount: new Prisma.Decimal(16000) } });
  await prisma.auction.update({ where: { id: auction.id }, data: { highestBidId: b2.id } });

  const horseListing = await prisma.listing.create({ data: {
    sellerId: seller.id, categoryId: breedIds['خيل/أدهم/عربي أصيل'], title: 'مهرة عربية أصيلة (كحيلان) — مزاد',
    description: 'مهرة عربية أصيلة بنسب موثّق، صحة ممتازة.', count: 1, sex: 'FEMALE', saleType: 'AUCTION',
    city: 'الدرعية', region: 'الرياض', status: 'ACTIVE',
    health: { create: [{ key: 'vaccinated', value: true }] },
    media: { create: [{ url: img('photo-1553284965-83fd3e82fa5a'), type: 'IMAGE' }] },
  } });
  await prisma.auction.create({ data: {
    listingId: horseListing.id, brokerId: broker.id, startPrice: new Prisma.Decimal(40000),
    minIncrement: new Prisma.Decimal(1000), startAt: now, endAt: new Date(now.getTime() + 48 * 3600_000), status: 'LIVE',
  } });

  console.log('✅ تمت إعادة البناء (تصنيف ثلاثي + عروض + مزادات).');
}

// إضافة سوق المستلزمات (غير مدمّر — يُضاف فقط إن لم يكن موجوداً)
async function ensureSupplies() {
  const exists = await prisma.category.findFirst({ where: { name: 'مستلزمات الحلال', level: 'SPECIES' } });
  if (exists) { console.log('ℹ️ سوق المستلزمات موجود — تخطّي.'); return; }

  console.log('🛒 إضافة سوق المستلزمات...');
  const root = await prisma.category.create({ data: { name: 'مستلزمات الحلال', level: 'SPECIES', icon: SUPPLIES.icon } });
  const leaf: Record<string, string> = {};
  for (const [cat, { icon, items }] of Object.entries(SUPPLIES.groups)) {
    const c = await prisma.category.create({ data: { name: cat, level: 'TYPE', parentId: root.id, icon } });
    for (const it of items) {
      const b = await prisma.category.create({ data: { name: it, level: 'BREED', parentId: c.id } });
      leaf[`${cat}/${it}`] = b.id;
    }
  }

  const supplier = await ensureUser('966500000004', { name: 'مؤسسة الأعلاف والمستلزمات', role: 'USER', isPhoneVerified: true, identityStatus: 'VERIFIED', city: 'الرياض', region: 'الرياض', trustScore: 4.7 });

  const supply = (categoryId: string, title: string, desc: string, price: number, image: string) =>
    prisma.listing.create({ data: {
      sellerId: supplier.id, categoryId, title, description: desc, count: 1, sex: 'MIXED',
      saleType: 'DIRECT', price: new Prisma.Decimal(price), city: 'الرياض', region: 'الرياض', status: 'ACTIVE',
      media: { create: [{ url: img(image), type: 'IMAGE' }] },
    } });

  await supply(leaf['أعلاف/برسيم'], 'برسيم حجازي مجفّف — بالة', 'برسيم نظيف عالي الجودة، توصيل متوفر.', 35, 'photo-1500382017468-9049fed747ef');
  await supply(leaf['أعلاف/شعير'], 'شعير علفي — كيس 50كجم', 'شعير ممتاز لتسمين الأغنام والإبل.', 70, 'photo-1574323347407-f5e1ad6d020b');
  await supply(leaf['صيدلية بيطرية/لقاحات'], 'لقاحات وأدوية بيطرية', 'تشكيلة لقاحات معتمدة مع إرشادات الاستخدام.', 120, 'photo-1576091160550-2173dba999ef');
  await supply(leaf['مستلزمات وأدوات/مشارب ومعالف'], 'مشارب ومعالف بلاستيكية', 'مشارب ومعالف متينة بأحجام متعددة.', 90, 'photo-1416879595882-3373a0480b5b');

  console.log('✅ تمت إضافة سوق المستلزمات.');
}

async function ensureHealthItems() {
  const count = await prisma.healthItem.count();
  if (count > 0) { console.log('ℹ️ بنود الحالة الصحية موجودة — تخطّي.'); return; }
  console.log('🩺 إضافة بنود الحالة الصحية الافتراضية...');
  const defaults = ['مُطعّم', 'الضرع سليم', 'الأسنان سليمة', 'خالٍ من الخراجات', 'خالٍ من الجرب', 'خالٍ من العرج'];
  for (let i = 0; i < defaults.length; i++) {
    await prisma.healthItem.create({ data: { label: defaults[i], order: i + 1 } });
  }
  console.log('✅ تمت إضافة بنود الحالة الصحية.');
}

async function main() {
  const hasTypes = await prisma.category.count({ where: { level: 'TYPE' } });
  if (hasTypes === 0) await fullRebuild();
  else console.log('ℹ️ التصنيف الثلاثي موجود — تخطّي إعادة البناء.');
  await ensureSupplies();
  await ensureHealthItems();
}

main()
  .catch((e) => { console.error('فشل البذر:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
