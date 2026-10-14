type InterbankMonitorLogoProps = {
  variant?: 'light' | 'dark';
};

export function InterbankMonitorLogo({ variant = 'light' }: InterbankMonitorLogoProps) {
  const isLight = variant === 'light';

  return (
    <div className="flex items-center gap-3.5" aria-label="Interbank Monitor">
      <svg viewBox="0 0 48 48" className="size-12 shrink-0" fill="none" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M8 0H40C44.42 0 48 3.58 48 8V40C48 44.42 44.42 48 40 48H8C3.58 48 0 44.42 0 40V8C0 3.58 3.58 0 8 0ZM12 18.5V41.5L36 36.5V13.5L12 18.5Z"
          fill="#003DA5"
        />
      </svg>
      <span className={`text-xl font-bold tracking-[-0.04em] sm:text-2xl ${isLight ? 'text-white' : 'text-[#07532b]'}`}>
        Interbank <span className={`font-normal ${isLight ? 'text-white/80' : 'text-[#65796b]'}`}>Monitor</span>
      </span>
    </div>
  );
}
