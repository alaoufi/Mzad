import { Theme, gradient, motifPattern, heroEdgePath } from '@/lib/themes';

// ترويسة قسم بهويّة كاملة: تدرّج لوني + زخرفة النمط + ظلّ النوع + حافة مقصوصة
export function CategoryHero({
  theme, motif, emoji, title, subtitle,
}: { theme: Theme; motif: string; emoji: string; title: string; subtitle?: string }) {
  const pat = motifPattern(motif, '#ffffff');
  return (
    <div className="relative -mx-4 -mt-6 mb-3 overflow-hidden px-4 pb-9 pt-9" style={{ backgroundImage: gradient(theme) }}>
      {/* زخرفة النمط بلون أبيض شفّاف */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{ backgroundImage: pat.image, backgroundSize: pat.size, backgroundRepeat: 'repeat' }} />
      {/* ظلّ النوع الكبير */}
      <div aria-hidden className="pointer-events-none absolute -left-5 -top-4 select-none text-[160px] leading-none text-white/15">
        {emoji}
      </div>
      {/* لمعة علوية ناعمة */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/20 to-transparent" />

      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="text-4xl drop-shadow">{emoji}</span>
          <h1 className="text-2xl font-extrabold text-white text-emboss-light sm:text-3xl">{title}</h1>
        </div>
        {subtitle && <p className="mt-1 text-sm font-bold text-white/85">{subtitle}</p>}
      </div>

      {/* حافة مقصوصة بلون الصفحة */}
      <svg className="absolute inset-x-0 bottom-0 h-5 w-full" viewBox="0 0 1440 48" preserveAspectRatio="none" fill={theme.bg}>
        <path d={heroEdgePath(motif)} />
      </svg>
    </div>
  );
}
