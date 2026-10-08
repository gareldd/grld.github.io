export type Project = {
  id: string;
  name: string;
  logo: string;
  website: string;
  description: string;
  descriptionHighlight?: string;
  authorParagraphs: string[];
  socials: { name: string; href: string; icon?: string }[];
};

export const PROJECTS: Project[] = [
  {
    id: 'gdz', name: 'G.D.Z. Server', logo: 'assets/img/gdzserver_logo.png', website: 'https://gdzserver.ru',
    description: 'Описание: «Это РОФЛ Vanilla+, сервер без хлам. модов, без читов, для реальных игроков! Мы стараемся быть уникальными, интересными, и конечно лучшими.»',
    authorParagraphs: [
      'Это был мой первый проект — Minecraft-сервер. К сожалению, он провалился из-за того, что не было онлайна и желания его развивать. Сервер работал 12 дней и был заморожен 5 июня. Но сейчас у меня есть планы, как «разогреть» сервер и сделать его живым. Подробнее в будущем...',
    ],
    socials: [
      { name: 'YouTube', href: 'https://www.youtube.com/@gdzserver', icon: 'assets/img/social/youtube_icon_bg.png' },
      { name: 'Telegram', href: 'https://t.me/gdzserver', icon: 'assets/img/social/telegram_icon_bg.png' },
      { name: 'TikTok', href: 'https://www.tiktok.com/@gdz.server', icon: 'assets/img/social/tiktok_icon_bg.png' },
      { name: 'Discord', href: 'https://discord.gg/SwMg5xBXgs', icon: 'assets/img/social/discord_icon_bg.png' },
    ],
  },
  {
    id: 'slh', name: 'SLH', logo: 'assets/img/SLHmain.png', website: 'https://slhmc.github.io/',
    description: 'Описание: «SLH (Smile LauncHer) - бесплатный лаунчер Minecraft с открытым исходным кодом, созданный для удобной и гибкой игры. Устанавливайте разные версии Minecraft Java - Bedrock, создавайте собственные сборки, управляйте модами и мирами, а также настраивайте внешний вид под себя. Всё необходимое в одном месте - без лишней сложности и ограничений.»',
    authorParagraphs: [
      'Это мой лаунчер для майнкрафт, который я с удовольствием буду развивать.',
      'В первую очередь я делаю его для себя, так как другие лаунчеры мне надоели, и в них нету тех функций которые мне нужны, но надеюсь что другим людям он тоже понравится.',
    ],
    socials: [
      { name: 'Telegram', href: 'https://t.me/smile_launcher', icon: 'assets/img/social/telegram_icon_bg.png' },
      { name: 'Discord', href: 'https://discord.gg/yhTvuB6U8n', icon: 'assets/img/social/discord_icon_bg.png' },
      { name: 'GitHub', href: 'https://github.com/slhmc/slh', icon: 'assets/img/social/github_icon_bg.png' },
    ],
  },
];
