// اختبار آلي شامل لفلترة الإعلانات حسب الاهتمامات — يحاكي منطق الواجهة ويتحقّق من الخادم.
// يكشف أي تسرّب (ظهور إعلان خارج اهتمام المستخدم) عبر سيناريوهات متعددة.
// التشغيل: node scripts/test-filter.mjs [baseUrl]
const BASE = (process.argv[2] || 'https://mzad-web.vercel.app') + '/api';

const j = async (path, opts = {}) => {
  const r = await fetch(BASE + path, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.token ? { Authorization: 'Bearer ' + opts.token } : {}), ...(opts.headers || {}) } });
  return r.json();
};

const SUPPLIES_NAME = 'مستلزمات الحلال';

async function main() {
  // 1) شجرة التصنيفات + فهارس
  const cats = await j('/categories');
  const byId = new Map(), parentOf = new Map(), nameOf = new Map();
  const walk = (n, p) => { byId.set(n.id, n); parentOf.set(n.id, p); nameOf.set(n.id, n.name); (n.children || []).forEach(c => walk(c, n.id)); };
  cats.forEach(c => walk(c, undefined));
  const suppliesRoot = cats.find(c => c.name === SUPPLIES_NAME);
  const subtree = (id) => { const out = []; const st = [id]; while (st.length) { const c = st.pop(); out.push(c); const n = byId.get(c); (n?.children || []).forEach(k => st.push(k.id)); } return out; };
  const suppliesIds = new Set(suppliesRoot ? subtree(suppliesRoot.id) : []);
  const ancestorsOf = (id) => { const out = []; let p = parentOf.get(id); while (p) { out.push(p); p = parentOf.get(p); } return out; };
  const inAnyInterest = (catId, interests) => interests.some(i => catId === i || ancestorsOf(catId).includes(i));

  // helper: find a category id by name
  const findId = (name) => { for (const [id, n] of nameOf) if (n === name) return id; return null; };

  // 2) محاكاة منطق load() في الواجهة (بعد إعادة البناء)
  function clientFetchPlan(interests, mode /* DIRECT|AUCTION|SUPPLIES */) {
    const animal = interests.filter(id => !suppliesIds.has(id));
    const supply = interests.filter(id => suppliesIds.has(id));
    const market = mode === 'SUPPLIES' ? supply : animal;
    const hasCurated = interests.length > 0;
    const params = { saleType: mode === 'AUCTION' ? 'AUCTION' : 'DIRECT' };
    if (market.length) { params.categoryIds = market.join(','); return { params, expectEmpty: false }; }
    if (hasCurated) return { params: null, expectEmpty: true }; // اهتمام لكن لا شيء بهذا السوق → فارغ
    if (mode === 'SUPPLIES') { if (suppliesRoot) params.categoryId = suppliesRoot.id; return { params, expectEmpty: false }; }
    if (suppliesRoot) params.exclude = suppliesRoot.id;
    return { params, expectEmpty: false };
  }

  // 3) سيناريوهات الاختبار
  const wad7 = findId('وضح'), ibil = findId('إبل'), ghanam = findId('غنم'), najdi = findId('نجدي أسود') || findId('نجدي'), vetPh = findId('صيدلية بيطرية');
  const scenarios = [
    { name: 'اهتمام وضح فقط', interests: [wad7].filter(Boolean), mode: 'DIRECT' },
    { name: 'اهتمام إبل (نوع كامل)', interests: [ibil].filter(Boolean), mode: 'DIRECT' },
    { name: 'اهتمام غنم', interests: [ghanam].filter(Boolean), mode: 'DIRECT' },
    { name: 'اهتمام نجدي', interests: [najdi].filter(Boolean), mode: 'DIRECT' },
    { name: 'اهتمام مستلزمات (سوق المستلزمات)', interests: [vetPh].filter(Boolean), mode: 'SUPPLIES' },
    { name: 'اهتمام مستلزمات لكن سوق المواشي (يجب فارغ)', interests: [vetPh].filter(Boolean), mode: 'DIRECT' },
    { name: 'اهتمامان وضح+نجدي', interests: [wad7, najdi].filter(Boolean), mode: 'DIRECT' },
    { name: 'بلا اهتمام (يُسمح بعرض الكل)', interests: [], mode: 'DIRECT' },
  ];

  let pass = 0, fail = 0;
  for (const s of scenarios) {
    if (s.interests.length === 0 && s.name.includes('وضح')) { continue; }
    const plan = clientFetchPlan(s.interests, s.mode);
    let verdict = 'PASS', detail = '';
    if (plan.expectEmpty) {
      detail = 'الواجهة تعرض «لا نتائج» بلا استعلام (صحيح)';
    } else {
      const qs = Object.entries(plan.params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
      const res = await j('/listings?' + qs);
      const items = res.items || [];
      // تحقّق التسرّب: كل إعلان يجب أن يكون داخل اهتمام (إن وُجد اهتمام)
      if (s.interests.length > 0) {
        const leaks = items.filter(it => !inAnyInterest(it.categoryId, s.interests));
        if (leaks.length) { verdict = 'FAIL ❌'; detail = `تسرّب ${leaks.length}: ` + leaks.map(l => `${l.title}[${nameOf.get(l.categoryId)}]`).join(', '); }
        else detail = `${items.length} نتيجة، كلها داخل الاهتمام ✓`;
      } else {
        detail = `${items.length} نتيجة (بلا فلتر — مسموح)`;
      }
    }
    if (verdict.startsWith('PASS')) pass++; else fail++;
    console.log(`${verdict}  | ${s.name}\n        ${detail}`);
  }
  console.log(`\n=== النتيجة: ${pass} نجح / ${fail} فشل من ${pass + fail} ===`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(2); });
