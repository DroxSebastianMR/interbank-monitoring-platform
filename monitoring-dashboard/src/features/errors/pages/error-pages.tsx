import error403 from '@/assets/images/errors/error_403.png';
import error404 from '@/assets/images/errors/error_404.png';
import error500 from '@/assets/images/errors/error_500.png';
import { ErrorPage } from '@/features/errors/components/error-page';

export function ForbiddenPage() {
  return (
    <ErrorPage
      code="403"
      title="No tienes acceso a esta página"
      description="No cuentas con los permisos necesarios para ver este contenido. Si crees que es un error, contacta al administrador."
      image={error403}
      imageAlt="Acceso restringido por seguridad"
    />
  );
}

export function NotFoundPage() {
  return (
    <ErrorPage
      code="404"
      title="¡Ups! No encontramos esta página"
      description="Es posible que la dirección haya cambiado o que la página ya no esté disponible."
      image={error404}
      imageAlt="Búsqueda de una página no encontrada"
    />
  );
}

export function ServerErrorPage() {
  return (
    <ErrorPage
      code="500"
      title="Algo salió mal de nuestro lado"
      description="Estamos teniendo un inconveniente técnico. Por favor, espera unos momentos e inténtalo nuevamente."
      image={error500}
      imageAlt="Mantenimiento por un inconveniente técnico"
    />
  );
}
