// يحوّل صور Data URL (base64) إلى روابط /api/media/{id} خفيفة قابلة للتخزين المؤقّت،
// فتخرج الصور الضخمة من حمولة JSON ويحمّلها المتصفّح بتكاسل ويخزّنها → فتحٌ أسرع بكثير.
export function mediaLink<T extends { id: string; url: string }>(m: T): T {
  return m && m.url?.startsWith('data:') ? { ...m, url: `/api/media/${m.id}` } : m;
}

// يطبّق التحويل على مصفوفة media داخل عنصر (إعلان)
export function lightenMedia<T extends { media?: { id: string; url: string }[] }>(item: T): T {
  return item?.media ? { ...item, media: item.media.map(mediaLink) } : item;
}
