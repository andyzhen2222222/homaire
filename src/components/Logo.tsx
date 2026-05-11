interface LogoProps {
  className?: string;
  showSlogan?: boolean;
  variant?: 'full' | 'symbol' | 'wordmark';
  light?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/** 全站统一字标：Homaire + 屋顶符号 + 标语（与 VI 一致，不依赖栅格 logo） */
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
  const compact = variant === 'symbol';

  const titleClass = compact
    ? 'text-xl sm:text-2xl'
    : size === 'xl'
      ? 'text-3xl sm:text-4xl'
      : size === 'lg'
        ? 'text-2xl sm:text-3xl'
        : size === 'sm'
          ? 'text-lg'
          : 'text-xl sm:text-2xl';

  const title = light ? 'text-white' : 'text-brand-navy';
  const sloganClass = light ? 'text-brand-beige/95' : 'text-brand-navy/55';

  return (
    <div className="flex flex-col gap-1.5">
      <span className={`font-brand font-semibold tracking-tight ${titleClass} ${title}`}>
        Homaire
        <span className="text-brand-beige align-super text-[0.55em] font-medium leading-none ml-0.5" aria-hidden>
          ^
        </span>
      </span>
      {showSlogan && variant === 'full' && (
        <span className={`text-[10px] sm:text-[11px] font-medium tracking-wide ${sloganClass}`}>
          For Every Corner of Home.
        </span>
      )}
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
