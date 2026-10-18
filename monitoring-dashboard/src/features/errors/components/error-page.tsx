import { ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PATHS } from '@/app/router/constants/paths';
import { Button } from '@/components/ui/button';
import { InterbankMonitorLogo } from '@/features/auth/components/interbank-monitor-logo';

type ErrorPageProps = {
  code: '403' | '404' | '500';
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

export function ErrorPage({ code, title, description, image, imageAlt }: ErrorPageProps) {
  const navigate = useNavigate();
  const canGoBack = window.history.length > 1;
  const isServerError = code === '500';

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#f6fbf7] text-foreground">
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center px-6 py-6 sm:px-10 lg:px-12">
        <InterbankMonitorLogo variant="dark" />
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100svh-112px)] w-full max-w-6xl items-center gap-6 px-6 pb-12 sm:px-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:gap-14 lg:px-12 lg:pb-20">
        <div className="order-2 flex max-w-xl flex-col items-center text-center lg:order-1 lg:items-start lg:text-left">
          <span className="font-heading mb-4 inline-flex rounded-full border border-primary/15 bg-primary/8 px-3.5 py-1.5 text-xs font-bold tracking-[0.18em] text-primary">
            ERROR {code}
          </span>
          <h1 className="max-w-lg text-3xl leading-tight font-bold tracking-[-0.04em] text-[#102c1e] sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
            {description}
          </p>

          <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row lg:justify-start">
            <Button
              size="lg"
              className="h-11 rounded-xl px-5 font-semibold shadow-[0_8px_24px_#008f3c24]"
              onClick={() => isServerError ? window.location.reload() : navigate(PATHS.DASHBOARD)}
            >
              {isServerError ? <RefreshCw aria-hidden="true" /> : <Home aria-hidden="true" />}
              {isServerError ? 'Intentar nuevamente' : 'Volver al inicio'}
            </Button>
            {canGoBack && (
              <Button
                variant="outline"
                size="lg"
                className="h-11 rounded-xl px-5 font-semibold"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft aria-hidden="true" />
                Regresar
              </Button>
            )}
          </div>
        </div>

        <div className="order-1 flex items-center justify-center lg:order-2">
          <div className="relative flex aspect-square w-full max-w-[290px] items-center justify-center sm:max-w-[360px] lg:max-w-[500px]">
            <div className="absolute inset-[12%] rounded-full bg-white/85 shadow-[0_28px_80px_#0d6b3820] ring-1 ring-primary/5" />
            <img
              src={image}
              alt={imageAlt}
              className="relative z-10 h-full w-full object-contain drop-shadow-[0_24px_28px_rgba(6,59,35,0.13)]"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
