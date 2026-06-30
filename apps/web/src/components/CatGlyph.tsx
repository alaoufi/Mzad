import { catImageIcon } from '@/lib/themes';

// يعرض صورة دائرية حقيقية للنوع إن وُجدت (إبل/غنم)، وإلا الإيموجي — بنفس المقاس
export function CatGlyph({
  name, icon, size = 28, className = '', emojiClassName = '',
}: { name?: string | null; icon?: string | null; size?: number; className?: string; emojiClassName?: string }) {
  const url = catImageIcon(name);
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name ?? ''} width={size} height={size}
        className={`inline-block shrink-0 rounded-full object-cover align-middle ring-1 ring-black/10 ${className}`}
        style={{ width: size, height: size }} />
    );
  }
  return <span className={emojiClassName || className}>{icon ?? '🐾'}</span>;
}
