import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * تصنيف هرمي ثلاثي: النوع (SPECIES) ← اللون/الصنف (TYPE) ← السلالة (BREED)
 * قابل للتعديل لاحقاً من لوحة الإدارة.
 */
const CATALOG: Record<string, { icon: string; groups: Record<string, string[]> }> = {
  'إبل': {
    icon: '🐪',
    groups: {
      'مجاهيم': ['مجاهيم أصايل', 'مجاهيم شعل'],
      'مغاتير': ['وضح', 'ملاحيم'],
      'صُفر': ['صفر صافية', 'شُقُح'],
      'حُمر': ['حُمر صافية', 'صُهب'],
      'شُعل': ['شُعل'],
      'زُرق': ['زُرق'],
    },
  },
  'خيل': {
    icon: '🐎',
    groups: {
      'عربي أصيل': ['كحيلان', 'صقلاوي', 'عبيان', 'دهمان', 'هدبان'],
      'واهو': ['واهو'],
      'شعبي': ['شعبي'],
    },
  },
  'غنم': {
    icon: '🐑',
    groups: {
      'نجدي': ['نجدي أسود', 'نجدي أبيض'],
      'نعيمي': ['نعيمي'],
      'حري': ['حري'],
      'سواكني': ['سواكني'],
      'عواسي': ['عواسي'],
      'بربري': ['بربري'],
    },
  },
  'ماعز': {
    icon: '🐐',
    groups: {
      'عارضي': ['عارضي أسود', 'عارضي ملوّن'],
      'شامي': ['شامي'],
      'حجازي': ['حجازي'],
      'تهامي': ['تهامي'],
    },
  },
  'بقر': {
    icon: '🐄',
    groups: {
      'هولشتاين': ['هولشتاين'],
      'جيرسي': ['جيرسي'],
      'بلدي': ['بلدي', 'دمشقي'],
    },
  },
};

async function main() {
  // إصدار التصنيف v2 (ثلاثي المستوى). إن وُجد مستوى الألوان (TYPE) فالقاعدة محدّثة → تخطّي.
  const hasTypes = await prisma.category.count({ where: { level: 'TYPE' } });
  if (hasTypes > 0) {
    console.log('ℹ️ التصنيف الثلاثي موجود مسبقاً — تخطّي البذر.');
    return;
  }

  console.log('🌱 إعادة بناء التصنيف الثلاثي والبيانات التجريبية...');
  // مسح الإعلانات القديمة (تتسلسل لحذف الميديا/المزادات/المحادثات) ثم التصنيفات
  await prisma.listing.deleteMany();
  await prisma.category.deleteMany();

  // بناء الشجرة الثلاثية
  const breedIds: Record<string, string> = {}; // "نوع/لون/سلالة" → id
  for (const [species, { icon, groups }] of Object.entries(CATALOG)) {
    const sp = await prisma.category.create({ data: { name: species, level: 'SPECIES', icon } });
    for (const [color, breeds] of Object.entries(groups)) {
      const col = await prisma.category.create({
        data: { name: color, level: 'TYPE', parentId: sp.id },
      });
      for (const breed of breeds) {
        const br = await prisma.category.create({
          data: { name: breed, level: 'BREED', parentId: col.id },
        });
        breedIds[`${species}/${color}/${breed}`] = br.id;
      }
    }
  }

  // مستخدمون
  const ensureUser = async (phone: string, data: any) =>
    (await prisma.user.findUnique({ where: { phone } })) ??
    (await prisma.user.create({ data: { phone, ...data } }));

  const seller = await ensureUser('966500000001', {
    name: 'أبو محمد القحطاني', isPhoneVerified: true, identityStatus: 'VERIFIED',
    city: 'بريدة', region: 'القصيم', trustScore: 4.8,
  });
  const broker = await ensureUser('966500000002', {
    name: 'دلال المنصة — سعد', role: 'BROKER', isPhoneVerified: true,
    identityStatus: 'VERIFIED', city: 'الرياض', region: 'الرياض', trustScore: 4.9,
  });
  const buyer = await ensureUser('966500000003', {
    name: 'فهد العتيبي', isPhoneVerified: true, city: 'الرياض', region: 'الرياض', trustScore: 4.5,
  });

  const img = (id: string) => `https://images.unsplash.com/${id}`;

  // عروض (بيع مباشر)
  await prisma.listing.create({
    data: {
      sellerId: seller.id, categoryId: breedIds['غنم/نجدي/نجدي أسود'],
      title: 'خروف نجدي أسود ممتاز', description: 'خروف نجدي، صحته ممتازة، مطعّم بالكامل.',
      count: 1, sex: 'MALE', approxWeightKg: 55, saleType: 'DIRECT', price: new Prisma.Decimal(1800),
      city: 'بريدة', region: 'القصيم', lat: 26.359, lng: 43.973, status: 'ACTIVE',
      health: { create: [{ key: 'vaccinated', value: true }, { key: 'teeth', value: true }] },
      media: { create: [{ url: img('photo-1484557985045-edf25e08da73'), type: 'IMAGE' }] },
    },
  });
  await prisma.listing.create({
    data: {
      sellerId: seller.id, categoryId: breedIds['ماعز/عارضي/عارضي أسود'],
      title: 'تيس عارضي أصيل', description: 'تيس عارضي لون أسود، نشيط، مناسب للتربية.',
      count: 1, sex: 'MALE', approxWeightKg: 40, saleType: 'DIRECT', price: new Prisma.Decimal(2500),
      city: 'عنيزة', region: 'القصيم', status: 'ACTIVE',
      health: { create: [{ key: 'vaccinated', value: true }] },
      media: { create: [{ url: img('photo-1524024973431-2ad916746881'), type: 'IMAGE' }] },
    },
  });

  // مزاد إبل
  const auctionListing = await prisma.listing.create({
    data: {
      sellerId: seller.id, categoryId: breedIds['إبل/مجاهيم/مجاهيم أصايل'],
      title: 'ناقة مجاهيم أصايل — مزاد مفتوح',
      description: 'ناقة مجاهيم أصيلة، منتجة، خالية من العيوب.',
      count: 1, sex: 'FEMALE', approxWeightKg: 450, productionStatus: 'منتجة',
      saleType: 'AUCTION', city: 'الرياض', region: 'الرياض', lat: 24.713, lng: 46.675, status: 'ACTIVE',
      health: { create: [
        { key: 'vaccinated', value: true }, { key: 'udder', value: true },
        { key: 'mange', value: false }, { key: 'abscess', value: false },
      ] },
      media: { create: [{ url: img('photo-1547234935-80c7145ec969'), type: 'IMAGE' }] },
    },
  });
  const now = new Date();
  const auction = await prisma.auction.create({
    data: {
      listingId: auctionListing.id, brokerId: broker.id,
      startPrice: new Prisma.Decimal(15000), minIncrement: new Prisma.Decimal(500),
      reservePrice: new Prisma.Decimal(20000), deposit: new Prisma.Decimal(1000),
      startAt: now, endAt: new Date(now.getTime() + 24 * 3600_000), status: 'LIVE',
    },
  });
  const b1 = await prisma.bid.create({ data: { auctionId: auction.id, bidderId: buyer.id, amount: new Prisma.Decimal(15000) } });
  const b2 = await prisma.bid.create({ data: { auctionId: auction.id, bidderId: broker.id, amount: new Prisma.Decimal(16000) } });
  await prisma.auction.update({ where: { id: auction.id }, data: { highestBidId: b2.id } });

  // مزاد خيل
  const horseListing = await prisma.listing.create({
    data: {
      sellerId: seller.id, categoryId: breedIds['خيل/عربي أصيل/كحيلان'],
      title: 'مهرة عربية أصيلة (كحيلان) — مزاد',
      description: 'مهرة عربية أصيلة بنسب موثّق، صحة ممتازة.',
      count: 1, sex: 'FEMALE', saleType: 'AUCTION', city: 'الدرعية', region: 'الرياض', status: 'ACTIVE',
      health: { create: [{ key: 'vaccinated', value: true }] },
      media: { create: [{ url: img('photo-1553284965-83fd3e82fa5a'), type: 'IMAGE' }] },
    },
  });
  await prisma.auction.create({
    data: {
      listingId: horseListing.id, brokerId: broker.id,
      startPrice: new Prisma.Decimal(40000), minIncrement: new Prisma.Decimal(1000),
      startAt: now, endAt: new Date(now.getTime() + 48 * 3600_000), status: 'LIVE',
    },
  });

  console.log('✅ تمت إعادة البناء بنجاح (تصنيف ثلاثي + عروض + مزادات).');
}

main()
  .catch((e) => { console.error('فشل البذر:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
