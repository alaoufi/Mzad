# نموذج البيانات (Data Model)

> المخطط الأساسي لقاعدة البيانات. المصدر الرسمي هو `apps/api/prisma/schema.prisma`؛ هذه الوثيقة شرح مفاهيمي.

---

## الكيانات الرئيسية (Entities)

```
User ──< Listing ──< Media
 │         │  │
 │         │  └──< HealthAttribute (العيوب والحالة الصحية)
 │         │
 │         └──1 Auction ──< Bid
 │
 ├──< Verification (مستويات التوثيق)
 ├──< Review (تقييم مُعطى/مُستلَم)
 └──< Conversation ──< Message

Category (هرمي: parentId ذاتي المرجع)
```

---

## الجداول

### `User` — المستخدم
| الحقل | النوع | ملاحظات |
|------|------|---------|
| id | UUID | المعرّف |
| phone | String unique | الجوال (المعرّف الأساسي للدخول) |
| name | String | الاسم |
| role | Enum | USER / BROKER / ADMIN |
| isPhoneVerified | Bool | توثيق الجوال |
| identityStatus | Enum | NONE / PENDING / VERIFIED |
| city / region | String | الموقع |
| trustScore | Float | محسوب من التقييمات |
| createdAt | DateTime | |

### `Category` — التصنيف الهرمي
| الحقل | النوع | ملاحظات |
|------|------|---------|
| id | UUID | |
| name | String | الاسم (نوع/فئة/سلالة...) |
| level | Enum | SPECIES / TYPE / BREED |
| parentId | UUID? | مرجع ذاتي (الهرمية) |
| icon | String? | أيقونة |

> مثال: إبل (SPECIES) ← مجاهيم (BREED) ... يُدار بالكامل من لوحة التحكم.

### `Listing` — الإعلان
| الحقل | النوع | ملاحظات |
|------|------|---------|
| id | UUID | |
| sellerId | UUID | البائع |
| categoryId | UUID | السلالة/الفئة |
| title / description | String | |
| count | Int | العدد |
| sex | Enum | MALE / FEMALE / MIXED |
| approxWeightKg | Int? | الوزن التقريبي |
| productionStatus | String? | حالة الإنتاج/الحمل |
| price | Decimal? | سعر مباشر (إن لم يكن مزاداً) |
| saleType | Enum | DIRECT / AUCTION |
| city / region | String | |
| lat / lng | Float? | للترتيب الجغرافي |
| hidePhone | Bool | إخفاء الرقم |
| status | Enum | DRAFT / ACTIVE / SOLD / CLOSED |

### `HealthAttribute` — الحالة الصحية والعيوب
| الحقل | النوع | ملاحظات |
|------|------|---------|
| listingId | UUID | |
| key | String | vaccinated / udder / abscess / mange / teeth / limp ... |
| value | Bool | موجود/سليم |
| note | String? | تفصيل |

> إفصاح إلزامي قانونياً (PRD §5.أ).

### `Media` — الميديا
| id, listingId, type (IMAGE/VIDEO/VIDEO_360/DOC), url, order |

### `Auction` — المزاد
| الحقل | النوع | ملاحظات |
|------|------|---------|
| id | UUID | |
| listingId | UUID unique | |
| brokerId | UUID? | الدلال/مدير المزاد |
| startPrice | Decimal | سعر البداية |
| minIncrement | Decimal | الحد الأدنى للزيادة |
| reservePrice | Decimal? | السعر الاحتياطي (امتثال المتاجر) |
| deposit | Decimal? | العربون |
| startAt / endAt | DateTime | |
| antiSnipingSec | Int | نافذة التمديد (افتراضي 60) |
| status | Enum | SCHEDULED / LIVE / ENDED / CANCELLED |
| highestBidId | UUID? | أعلى عرض حالي |

### `Bid` — المزايدة
| id, auctionId, bidderId, amount (Decimal), createdAt |

> تُكتب داخل معاملة + قفل Redis لمنع التزامن (راجع البنية §4).

### `Verification` — التوثيق
| id, userId, type (PHONE/IDENTITY/COMMERCIAL/BROKER), status, data(JSON مشفّر) |

### `Review` — التقييم المتبادل
| id, authorId, targetId, dealId?, role (BUYER/SELLER/BROKER), rating(1–5), descMatch(1–5), comment |

### `Conversation` / `Message` — المحادثات
| Conversation: id, listingId, isPublic |
| Message: id, conversationId, senderId, type (TEXT/IMAGE/VOICE/LOCATION), body, createdAt |

### `Report` — البلاغات (Trust & Safety)
| id, reporterId, targetType, targetId, reason, status |

---

## فهارس مهمة (Indexes)
- `Listing(categoryId, status, region)` — للبحث والفلترة.
- `Bid(auctionId, amount desc)` — لجلب أعلى عرض بسرعة.
- `Auction(status, endAt)` — لمهمة إغلاق المزادات المنتهية.
- فهرس جغرافي على `Listing(lat, lng)` (PostGIS لاحقاً).

---

## ملاحظات تصميمية
- استخدمنا **Enums** بدل جداول مرجعية صغيرة للحالات الثابتة (أسرع وأوضح).
- **Decimal** للمبالغ المالية (لا Float) لتجنّب أخطاء التقريب.
- التصنيف **هرمي ذاتي المرجع** ليُدار بالكامل من لوحة التحكم دون تغيير في الكود.
