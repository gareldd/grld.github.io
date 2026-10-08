import { FALLBACK_SKIN_ENDPOINT, MOTION } from '../config/site.ts';

// Keep one successfully decoded texture in memory for StrictMode remounts/retries.
// This is not persistent storage: a fresh visit resolves the online skin again.
let lastSkin: HTMLImageElement | null = null;
let pending: Promise<HTMLImageElement> | null = null;

export function loadMinecraftSkin(): Promise<HTMLImageElement> {
  if (lastSkin) return Promise.resolve(lastSkin);
  if (pending) return pending;
  pending = (async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), MOTION.skinTimeoutMs);
    let objectUrl: string | undefined;
    try {
      const response = await fetch(FALLBACK_SKIN_ENDPOINT, { signal: controller.signal, cache: 'default' });
      if (!response.ok) throw new Error(`Skin request: ${response.status}`);
      objectUrl = URL.createObjectURL(await response.blob());
      const image = new Image();
      image.src = objectUrl;
      await image.decode();
      if (image.width !== image.height || image.width < 64 || image.width % 64 !== 0) {
        throw new Error('Expected a modern square Minecraft skin texture');
      }
      lastSkin = image;
      return image;
    } finally {
      window.clearTimeout(timeout);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      pending = null;
    }
  })();
  return pending;
}
