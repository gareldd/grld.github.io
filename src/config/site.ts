export const MINECRAFT_USERNAME = 'gareldd';
export const MINECRAFT_MODEL = 'slim' as const;
export const FALLBACK_SKIN_ENDPOINT = `https://mc-heads.net/skin/${MINECRAFT_USERNAME}`;

export const GREETINGS = ['Приветствую!', 'Привет!', 'Здаров!', 'Хеллоу!', 'Салют!', 'Рад тебя видеть!', 'Здравствуй!'];

export const PORTRAIT = {
  targetY: 7, fov: 42, verticalSpan: 24, horizontalSpan: 20,
  greetingHorizontalSpan: 34, depthMargin: 4, settleMs: 650,
} as const;

export const MOTION = {
  entranceMs: 500,
  greetingEndMs: 2000,
  armRaiseMs: 180,
  armReturnMs: 260,
  waveBeats: 2,
  headYaw: 28 * Math.PI / 180,
  headPitch: 15 * Math.PI / 180,
  torsoYaw: 6 * Math.PI / 180,
  cameraParallax: 0.55,
  responseMs: 190,
  pointerIdleMs: 10000,
  stanceYaw: -0.10,
  maxDpr: 2,
  skinTimeoutMs: 15000,
} as const;

export const IDLE = { blendMs: 800, breathPeriodMs: 4600, swayPeriodMs: 11000, armPeriodMs: 6200 } as const;

export const SOCIALS = [
  { name: 'YouTube', href: 'https://www.youtube.com/@gareldd', icon: 'yt_alt.png' },
  { name: 'Twitch', href: 'https://www.twitch.tv/gareldd', icon: 'tw_alt.png' },
  { name: 'Telegram', href: 'https://t.me/garelddd', icon: 'tg_alt.png' },
  { name: 'Discord', href: 'https://discord.com/invite/VMNft2dGn6', icon: 'ds_alt.png' },
];

export const TELEGRAM_CHANNELS = [
  { name: 'Основной Telegram', subtitle: '@garelddd', href: 'https://t.me/garelddd', private: false },
  { name: 'Приватка', subtitle: 'Закрытый канал', href: 'https://web.tribute.tg/e/w6', private: true },
  { name: 'ИИ-штуки', subtitle: '@gAIreld', href: 'https://t.me/gAIreld', private: false },
];
