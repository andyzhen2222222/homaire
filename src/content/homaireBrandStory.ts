/** Official brand slogan */
export const HOMAIRE_SLOGAN = 'For Every Corner of Home.';

export const HOMAIRE_SLOGAN_SHORT = 'For Every Corner of Home';

/** 首页宣言区默认文案（英文；可被站点配置 / 首页装修覆盖） */
export const HOME_MANIFESTO_DEFAULTS = {
  homeManifestoEyebrow: 'Homaire · Brand',
  homeManifestoTitle: 'For Every Corner\nof Home.',
  homeManifestoBody:
    'Modern furniture designed for comfort, style, and everyday living. We believe great furniture should not only look good — it should make everyday life easier, calmer, and more inviting. From living rooms to outdoor moments, we bring together thoughtful materials, clean lines, and details that work for real routines.',
  homeManifestoCtaLabel: 'Read our story',
  homeManifestoCtaHref: '/brand-story',
  homeManifestoImageUrl:
    'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=1200',
  homeManifestoCardTitle: 'Homaire',
  homeManifestoCardSub: HOMAIRE_SLOGAN,
  homeManifestoCardYear: 'Comfort · Design · Trust',
} as const;

export const HOME_MANIFESTO_TAGLINE = HOMAIRE_SLOGAN_SHORT;

/** 品牌故事页首屏全宽背景图 */
export const BRAND_STORY_HERO_BG =
  'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=85&w=2400';

export const BRAND_STORY_HERO = {
  eyebrow: 'Brand story',
  title: 'Where better\nliving begins',
  subtitle: HOMAIRE_SLOGAN_SHORT,
  lead: 'Modern home furnishings designed for real life — comfortable, natural, and built for every day.',
} as const;

export const BRAND_STORY_MANIFESTO =
  'Home is where you recharge. Homaire brings clean lines, dependable materials, and everyday-minded details so every piece truly belongs in your life.';

export const BRAND_STORY_PILLARS = [
  {
    index: '01',
    title: 'Designed for real life',
    body: 'Shaped around room size, daily use, and storage — not just display.',
  },
  {
    index: '02',
    title: 'Comfort & aesthetics',
    body: 'Neutral palettes and crisp silhouettes that settle naturally into your space.',
  },
  {
    index: '03',
    title: 'Effortless choices',
    body: 'From living room to outdoor — curate once, enjoy more, research less.',
  },
] as const;

export const BRAND_STORY_EDITORIAL = {
  imageUrl:
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1600&h=1200',
  imageAlt: 'Homaire living space',
  eyebrow: 'Our approach',
  title: 'More than beautiful.\nBuilt to work.',
  body: 'A sofa can anchor family time; outdoor seating can hold a weekend in the sun. We care about life after delivery — how it feels, how it lasts, how easy it is to live with, and how the proportions hold up over years.',
} as const;

export const BRAND_STORY_MISSION = {
  mission:
    'To offer modern families furniture that balances design, comfort, and practicality — making it easier to shape spaces you love.',
  vision:
    'To become a home brand people trust — in more homes, for calmer, more considered everyday living.',
} as const;

export const BRAND_STORY_VALUES = ['Comfort', 'Design', 'Practicality', 'Warmth', 'Trust'] as const;

export const BRAND_STORY_PULL_QUOTE = {
  text: 'Great furniture is the piece that makes everyday life lighter — and worth looking forward to.',
  attribution: 'Homaire',
} as const;

export const BRAND_STORY_CTA_LINKS = [
  { label: 'Shop sofas', href: '/category/sofas' },
  { label: 'Bedroom', href: '/category/beds' },
  { label: 'Sale', href: '/category/sale' },
] as const;

export const BRAND_STORY_UI = {
  backHome: 'Back to home',
  philosophyHeading: 'What we believe',
  exploreHeading: 'Explore Homaire',
} as const;

/** @deprecated 旧版长文区块，仅保留类型供兼容 */
export type BrandStorySection = {
  id: string;
  title: string;
  body: string;
  variant?: 'default' | 'highlight' | 'quote' | 'tags' | 'slogan-grid' | 'hero-options';
  imageUrl?: string;
  imageAlt?: string;
};
