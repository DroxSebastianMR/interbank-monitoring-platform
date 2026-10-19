import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type TwinOrbitProps = ComponentProps<'span'> & {
  label?: string;
};

export function TwinOrbit({ className, label = 'Cargando', ...props }: TwinOrbitProps) {
  return (
    <>
      <style>{`
        @keyframes loading-ui-twin-orbit-rotate {
          100% { transform: rotate(360deg) translate(155%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .loading-ui-twin-orbit-marker { animation: none !important; }
          .loading-ui-twin-orbit-marker:last-of-type { opacity: .35; }
        }
      `}</style>
      <span
        role="status"
        className={cn('relative inline-block aspect-square rounded-full bg-current', className)}
        {...props}
      >
        <span
          aria-hidden="true"
          className="loading-ui-twin-orbit-marker absolute inset-0 rounded-full bg-current"
          style={{
            transform: 'rotate(0deg) translate(155%)',
            animation: 'loading-ui-twin-orbit-rotate var(--duration, 1s) linear infinite',
          }}
        />
        <span
          aria-hidden="true"
          className="loading-ui-twin-orbit-marker absolute inset-0 rounded-full bg-current"
          style={{
            transform: 'rotate(0deg) translate(155%)',
            animation: 'loading-ui-twin-orbit-rotate var(--duration, 1s) linear infinite',
            animationDelay: 'calc(var(--duration, 1s) / 2)',
          }}
        />
        <span className="sr-only">{label}</span>
      </span>
    </>
  );
}
