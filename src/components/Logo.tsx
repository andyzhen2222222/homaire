import { useState } from 'react';
import { HOMAIRE_SLOGAN } from '../content/homaireBrandStory';

interface LogoProps {
  className?: string;
  showSlogan?: boolean;
  variant?: 'full' | 'symbol' | 'wordmark';
  light?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/** Full wordmark with tagline (transparent PNG) */
const HOMAIRE_WORDMARK_FULL = '/homaire-wordmark.png';
/** Footer / dark backgrounds: light recolor of wordmark */
const HOMAIRE_WORDMARK_LIGHT = '/homaire-wordmark-light.png';

function HomaireWordmarkText({
  light,
  showSlogan,
  compact,
  size,
}: {
  light: boolean;
  showSlogan: boolean;
  compact: boolean;
  size: LogoProps['size'];
}) {
  const titleClass = compact
    ? size === 'sm'
      ? 'text-lg'
      : 'text-xl sm:text-2xl'
    : light && (size === 'lg' || size === 'xl')
      ? 'text-xl sm:text-2xl'
      : size === 'lg' || size === 'xl'
        ? 'text-2xl sm:text-3xl'
        : 'text-xl sm:text-2xl';

  const sloganClass =
    size === 'lg' || size === 'xl'
      ? 'text-[11px] sm:text-xs'
      : 'text-[10px] sm:text-[11px]';

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span
        className={`font-brand font-semibold tracking-tight leading-none ${titleClass} ${
          light ? 'text-white' : 'text-brand-navy'
        }`}
      >
        Homaire
        <span className="text-brand-beige">^</span>
      </span>
      {showSlogan && !compact && (
        <span
          className={`${sloganClass} font-medium tracking-wide leading-snug ${
            light ? 'text-brand-beige/95' : 'text-brand-navy/55'
          }`}
        >
          {HOMAIRE_SLOGAN}
        </span>
      )}
    </div>
  );
}

function HomaireWordmark({
  light,
  showSlogan,
  size,
  variant,
}: {
  light: boolean;
  showSlogan: boolean;
  size: LogoProps['size'];
  variant: LogoProps['variant'];
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const compact = variant === 'symbol';
  const src = light ? HOMAIRE_WORDMARK_LIGHT : HOMAIRE_WORDMARK_FULL;

  const heightClass = compact
    ? variant === 'symbol'
      ? 'h-8 max-h-8 sm:h-9 sm:max-h-9'
      : size === 'xl'
        ? 'h-10 max-h-10 sm:h-11 sm:max-h-11'
        : size === 'lg'
          ? 'h-9 max-h-9 sm:h-10 sm:max-h-10'
          : size === 'sm'
            ? 'h-7 max-h-7'
            : 'h-8 max-h-8 sm:h-9 sm:max-h-9'
    : light && (size === 'lg' || size === 'xl')
      ? 'h-11 max-h-11 sm:h-12 sm:max-h-12'
      : size === 'lg' || size === 'xl'
        ? 'h-10 max-h-10 sm:h-11 sm:max-h-11'
        : 'h-9 max-h-9 sm:h-10 sm:max-h-10';

  const widthClass = compact
    ? 'max-w-[min(100%,180px)] sm:max-w-[min(100%,200px)]'
    : light && (size === 'lg' || size === 'xl')
      ? 'max-w-[min(100%,240px)] sm:max-w-[min(100%,280px)]'
      : size === 'xl'
        ? 'max-w-[min(100%,200px)] sm:max-w-[min(100%,220px)]'
        : 'max-w-[min(100%,220px)] sm:max-w-[min(100%,260px)]';

  if (imgFailed) {
    return (
      <HomaireWordmarkText light={light} showSlogan={showSlogan} compact={compact} size={size} />
    );
  }

  return (
    <div className={compact ? 'min-w-0 leading-none' : 'flex flex-col gap-1 min-w-0'}>
      <img
        src={src}
        alt={`Homaire ? ${HOMAIRE_SLOGAN}`}
        width={compact ? 200 : 320}
        height={compact ? 40 : 88}
        decoding="async"
        onError={() => setImgFailed(true)}
        className={`block w-auto max-w-none ${heightClass} ${widthClass} object-contain object-left`}
      />
    </div>
  );
}

export default function Logo({
  className = '',
  showSlogan = false,
  variant = 'full',
  light = false,
  size = 'md',
}: LogoProps) {
  const showSloganBlock = showSlogan && (variant === 'full' || variant === 'wordmark');

  return (
    <div className={className}>
      <HomaireWordmark light={light} showSlogan={showSloganBlock} size={size} variant={variant} />
    </div>
  );
}
