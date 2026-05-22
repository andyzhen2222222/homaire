import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
  BRAND_STORY_CTA_LINKS,
  BRAND_STORY_EDITORIAL,
  BRAND_STORY_HERO,
  BRAND_STORY_HERO_BG,
  BRAND_STORY_MANIFESTO,
  BRAND_STORY_MISSION,
  BRAND_STORY_PILLARS,
  BRAND_STORY_PULL_QUOTE,
  BRAND_STORY_UI,
  BRAND_STORY_VALUES,
} from '../content/homaireBrandStory';

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export default function BrandStoryPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-navy">
      <header className="relative min-h-[70vh] overflow-hidden md:min-h-[78vh]">
        <img
          src={BRAND_STORY_HERO_BG}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/70 to-brand-navy/30" />
        <div className="relative flex min-h-[70vh] flex-col justify-end px-4 pb-14 pt-28 md:min-h-[78vh] md:pb-20 md:pt-36">
          <div className="mx-auto w-full max-w-6xl">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-5 text-[11px] font-bold uppercase tracking-[0.5em] text-brand-beige"
            >
              {BRAND_STORY_HERO.eyebrow}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="mb-6 max-w-4xl whitespace-pre-line font-brand text-[2.75rem] font-bold leading-[1.02] tracking-tight text-white md:text-7xl lg:text-8xl"
            >
              {BRAND_STORY_HERO.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-3 font-brand text-lg font-medium italic tracking-tight text-brand-beige md:text-2xl"
            >
              {BRAND_STORY_HERO.subtitle}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.28 }}
              className="mb-10 max-w-md text-sm leading-relaxed text-white/65 md:text-base"
            >
              {BRAND_STORY_HERO.lead}
            </motion.p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-white/70 transition-colors hover:text-brand-beige"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              {BRAND_STORY_UI.backHome}
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-brand-border bg-white py-20 md:py-28">
        <motion.div {...fadeUp} className="mx-auto max-w-4xl px-4 text-center">
          <p className="font-brand text-2xl font-semibold leading-[1.45] tracking-tight text-brand-navy md:text-4xl md:leading-[1.35]">
            {BRAND_STORY_MANIFESTO}
          </p>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <motion.div {...fadeUp} className="mb-14 md:mb-20">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-sage">Philosophy</p>
          <h2 className="font-brand text-3xl font-bold tracking-tight text-brand-navy md:text-5xl">
            {BRAND_STORY_UI.philosophyHeading}
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-brand-border bg-brand-border md:grid-cols-3">
          {BRAND_STORY_PILLARS.map((pillar, i) => (
            <motion.div
              key={pillar.index}
              {...fadeUp}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex flex-col bg-brand-bg p-8 md:p-10 lg:p-12"
            >
              <span className="mb-8 font-brand text-4xl font-bold text-brand-beige/80">{pillar.index}</span>
              <h3 className="mb-4 font-brand text-xl font-bold tracking-tight text-brand-navy md:text-2xl">
                {pillar.title}
              </h3>
              <p className="mt-auto text-sm leading-relaxed text-brand-navy/60 md:text-[15px]">{pillar.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden bg-brand-navy text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2">
          <motion.div {...fadeUp} className="relative min-h-[320px] lg:min-h-[560px]">
            <img
              src={BRAND_STORY_EDITORIAL.imageUrl}
              alt={BRAND_STORY_EDITORIAL.imageAlt}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent to-brand-navy/40 lg:bg-gradient-to-t lg:from-brand-navy/60 lg:to-transparent" />
          </motion.div>
          <motion.div
            {...fadeUp}
            className="flex flex-col justify-center px-6 py-16 md:px-14 md:py-24 lg:px-16"
          >
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-beige">
              {BRAND_STORY_EDITORIAL.eyebrow}
            </p>
            <h2 className="mb-8 whitespace-pre-line font-brand text-3xl font-bold leading-[1.08] tracking-tight md:text-5xl">
              {BRAND_STORY_EDITORIAL.title}
            </h2>
            <p className="max-w-md text-[15px] leading-[1.85] text-white/75 md:text-base">{BRAND_STORY_EDITORIAL.body}</p>
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-brand-border py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]">
          <span className="font-brand text-[12rem] font-bold uppercase leading-none md:text-[18rem]">Homaire</span>
        </div>
        <motion.blockquote {...fadeUp} className="relative mx-auto max-w-3xl px-4 text-center">
          <p className="mb-8 font-brand text-2xl font-semibold leading-snug tracking-tight text-brand-navy md:text-4xl">
            {`\u201c${BRAND_STORY_PULL_QUOTE.text}\u201d`}
          </p>
          <footer className="text-[11px] font-bold uppercase tracking-[0.35em] text-brand-beige">
            {BRAND_STORY_PULL_QUOTE.attribution}
          </footer>
        </motion.blockquote>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
          <motion.div {...fadeUp} className="rounded-3xl border border-brand-border bg-white p-8 shadow-sm md:p-10">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-brand-sage">Mission</p>
            <p className="text-[15px] leading-[1.8] text-brand-navy/80">{BRAND_STORY_MISSION.mission}</p>
          </motion.div>
          <motion.div {...fadeUp} className="rounded-3xl bg-brand-gray/60 p-8 md:p-10">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-brand-beige">Vision</p>
            <p className="text-[15px] leading-[1.8] text-brand-navy/80">{BRAND_STORY_MISSION.vision}</p>
          </motion.div>
        </div>
        <motion.div {...fadeUp} className="mt-14 flex flex-wrap justify-center gap-3 md:mt-16">
          {BRAND_STORY_VALUES.map((value) => (
            <span
              key={value}
              className="rounded-full border border-brand-navy/10 bg-white px-5 py-2.5 text-xs font-bold tracking-widest text-brand-navy/75 shadow-sm"
            >
              {value}
            </span>
          ))}
        </motion.div>
      </section>

      <section className="bg-brand-navy px-4 py-20 text-white md:py-28">
        <motion.div {...fadeUp} className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.45em] text-brand-beige">Explore</p>
          <h2 className="mb-10 font-brand text-3xl font-bold tracking-tight md:text-5xl">
            {BRAND_STORY_UI.exploreHeading}
          </h2>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            {BRAND_STORY_CTA_LINKS.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="group inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:border-brand-beige hover:bg-brand-beige hover:text-brand-navy"
              >
                {item.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
