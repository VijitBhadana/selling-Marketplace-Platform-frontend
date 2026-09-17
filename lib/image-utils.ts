export const FALLBACK_LISTING_IMAGE = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8';

// Appends Unsplash-style transform params to a remote image URL — but not to a
// data: URL (an uploaded photo's resized preview), which isn't a queryable endpoint
// and would just get corrupted by a trailing "?w=...".
export function withImageParams(src: string, params: string) {
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;
  return `${src}${src.includes('?') ? '&' : '?'}${params}`;
}

// Downscales an image file to a JPEG data URL so an uploaded photo can be kept
// in localStorage (the demo listing store) without blowing the storage quota.
export function fileToResizedDataUrl(file: File, maxDim = 1000, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read image'));
    };
    img.src = objectUrl;
  });
}
