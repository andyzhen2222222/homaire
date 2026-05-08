import React from 'react';
import logoHorizontal from '../assets/logo-horizontal.png';
import logoMark from '../assets/logo-mark.png';
import logoWordmark from '../assets/logo-wordmark.png';

interface LogoProps {
  className?: string;
  showSlogan?: boolean;
  variant?: 'full' | 'symbol' | 'wordmark';
  light?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Logo({ className = '', showSlogan = false, variant = 'full', light = false, size = 'md' }: LogoProps) {
  const textColor = light ? 'text-white' : 'text-brand-navy';
  const src = variant === 'symbol' ? logoMark : variant === 'wordmark' ? logoWordmark : logoHorizontal;
  const [imgError, setImgError] = React.useState(false);

  const heightClass =
    size === 'sm' ? 'h-8' :
    size === 'lg' ? 'h-12' :
    size === 'xl' ? 'h-14' :
    'h-10';

  const minStyle =
    variant === 'symbol'
      ? (size === 'xl' ? { minWidth: '56px', minHeight: '56px' } :
         size === 'lg' ? { minWidth: '48px', minHeight: '48px' } :
         size === 'sm' ? { minWidth: '32px', minHeight: '32px' } :
         { minWidth: '40px', minHeight: '40px' })
      : (size === 'xl' ? { minWidth: '240px', minHeight: '56px' } :
         size === 'lg' ? { minWidth: '210px', minHeight: '48px' } :
         size === 'sm' ? { minWidth: '140px', minHeight: '32px' } :
         { minWidth: '160px', minHeight: '40px' });

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-3">
        {!imgError ? (
          <img 
            src={src} 
            alt="ZipSofa Logo" 
            className={`${heightClass} w-auto object-contain block`}
            style={minStyle}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={`flex items-center gap-2 ${textColor} py-1`}>
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-brand-beige/20 rounded-xl rotate-12" />
              <div className="absolute inset-0 border-2 border-brand-beige rounded-xl" />
              <span className="font-brand font-black text-xl italic tracking-tighter">Z</span>
            </div>
            {variant !== 'symbol' && (
              <span className="font-brand font-bold text-2xl tracking-tighter uppercase whitespace-nowrap">
                Zip<span className="text-brand-beige text-3xl">.</span>Sofa
              </span>
            )}
          </div>
        )}
      </div>
      {showSlogan && variant === 'full' && (
        <span className={`text-[8px] uppercase tracking-[0.4em] font-black mt-1 ml-1 opacity-40 ${textColor}`}>
          Zip Small. Live Big.
        </span>
      )}
    </div>
  );
}
