import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// التصنيف الهرمي: نوع ← سلالات
const CATALOG: Record<string, { icon: string; breeds: string[] }> = {
  'إبل': { icon: '🐪', breeds: ['مجاهيم', 'مغاتير', 'وضح', 'صفر', 'شعل', 'حمر'] },
  'غنم': { icon: '🐑', breeds: ['نجدي', 'نعيمي', 'حري', 'سواكني', 'بربري', 'نقدي'] },
  'ماعز': { icon: '🐐', breeds: ['عارضي', 'شامي', 'حجازي', 'تهامي'] },
  'بقر': { icon: '🐄', breeds: ['هولشتاين', 'جيرسي', 'بلدي'] },
  'خيل': { icon: '🐎', breeds: ['عربي أصيل', 'واهو', 'شعبي'] },
};

async function main() {
  // إدخال آمن متكرر (Idempotent): إن وُجدت بيانات، لا تُكرّرها
  const existing = await prisma.category.count();
  if (existing > 0) {
    console.log('ℹ️ قاعدة البيانات مهيّأة مسبقاً — تخطّي البذر.');
    return;
  }

  console.log('🌱 بدء إدخال البيانات التجريبية...');

  const breedIds: Record<string, string> = {};
  for (const [species, { icon, breeds }] of Object.entries(CATALOG)) {
    const parent = await prisma.category.create({
      data: { name: species, level: 'SPECIES', icon },
    });
    for (const breed of breeds) {
      const b = await prisma.category.create({
        data: { name: breed, level: 'BREED', parentId: parent.id },
      });
      breedIds[`${species}:${breed}`] = b.id;
    }
  }

  const seller = await prisma.user.create({
    data: {
      phone: '966500000001',
      name: 'أبو محمد القحطاني',
      isPhoneVerified: true,
      identityStatus: 'VERIFIED',
      city: 'بريدة',
      region: 'القصيم',
      trustScore: 4.8,
    },
  });
  const broker = await prisma.user.create({
    data: {
      phone: '966500000002',
      name: 'دلال المنصة — سعد',
      role: 'BROKER',
      isPhoneVerified: true,
      identityStatus: 'VERIFIED',
      city: 'الرياض',
      region: 'الرياض',
      trustScore: 4.9,
    },
  });
  const buyer = await prisma.user.create({
    data: {
      phone: '966500000003',
      name: 'فهد العتيبي',
      isPhoneVerified: true,
      city: 'الرياض',
      region: 'الرياض',
      trustScore: 4.5,
    },
  });

  await prisma.review.createMany({
    data: [
      { authorId: buyer.id, targetId: seller.id, role: 'SELLER', rating: 5, descMatch: 5, comment: 'الوصف مطابق تماماً' },
      { authorId: broker.id, targetId: seller.id, role: 'SELLER', rating: 5, descMatch: 4 },
    ],
  });

  await prisma.listing.create({
    data: {
      sellerId: seller.id,
      categoryId: breedIds['غنم:نجدي'],
      title: 'خروف نجدي ممتاز جاهز للأضحية',
      description: 'خروف نجدي سمين، صحته ممتازة، مطعّم بالكامل. الموقع بريدة.',
      count: 1,
      sex: 'MALE',
      approxWeightKg: 55,
      saleType: 'DIRECT',
      price: new Prisma.Decimal(1800),
      city: 'بريدة',
      region: 'القصيم',
      lat: 26.359,
      lng: 43.973,
      health: {
        create: [
          { key: 'vaccinated', value: true, note: 'مطعّم ضد الطاعون' },
          { key: 'teeth', value: true },
          { key: 'limp', value: false },
        ],
      },
      media: { create: [{ url: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73', type: 'IMAGE' }] },
    },
  });

  await prisma.listing.create({
    data: {
      sellerId: seller.id,
      categoryId: breedIds['ماعز:عارضي'],
      title: 'تيس عارضي أصيل',
      description: 'تيس عارضي لون أسود، نشيط، مناسب للتربية.',
      count: 1,
      sex: 'MALE',
      approxWeightKg: 40,
      saleType: 'DIRECT',
      price: new Prisma.Decimal(2500),
      city: 'عنيزة',
      region: 'القصيم',
      lat: 26.094,
      lng: 43.994,
      health: { create: [{ key: 'vaccinated', value: true }] },
      media: { create: [{ url: 'https://images.unsplash.com/photo-1524024973431-2ad916746881', type: 'IMAGE' }] },
    },
  });

  const auctionListing = await prisma.listing.create({
    data: {
      sellerId: seller.id,
      categoryId: breedIds['إبل:مجاهيم'],
      title: 'ناقة مجاهيم وضح — مزاد مفتوح',
      description: 'ناقة مجاهيم أصيلة، منتجة، خالية من العيوب. مزاد ينتهي خلال 24 ساعة.',
      count: 1,
      sex: 'FEMALE',
      approxWeightKg: 450,
      productionStatus: 'منتجة',
      saleType: 'AUCTION',
      city: 'الرياض',
      region: 'الرياض',
      lat: 24.713,
      lng: 46.675,
      health: {
        create: [
          { key: 'vaccinated', value: true },
          { key: 'udder', value: true, note: 'الضرع سليم' },
          { key: 'mange', value: false },
          { key: 'abscess', value: false },
        ],
      },
      media: { create: [{ url: 'https://images.unsplash.com/photo-1547234935-80c7145ec969', type: 'IMAGE' }] },
    },
  });

  const now = new Date();
  const auction = await prisma.auction.create({
    data: {
      listingId: auctionListing.id,
      brokerId: broker.id,
      startPrice: new Prisma.Decimal(15000),
      minIncrement: new Prisma.Decimal(500),
      reservePrice: new Prisma.Decimal(20000),
      deposit: new Prisma.Decimal(1000),
      startAt: now,
      endAt: new Date(now.getTime() + 24 * 3600_000),
      status: 'LIVE',
    },
  });
  const bid1 = await prisma.bid.create({
    data: { auctionId: auction.id, bidderId: buyer.id, amount: new Prisma.Decimal(15000) },
  });
  const bid2 = await prisma.bid.create({
    data: { auctionId: auction.id, bidderId: broker.id, amount: new Prisma.Decimal(16000) },
  });
  await prisma.auction.update({ where: { id: auction.id }, data: { highestBidId: bid2.id } });

  console.log('✅ تمت التهيئة بنجاح.');
}

main()
  .catch((e) => {
    console.error('فشل البذر:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
