import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ForbiddenPage, NotFoundPage, ServerErrorPage } from '@/features/errors/pages/error-pages';

describe('Error pages', () => {
  it.each([
    [ForbiddenPage, 'ERROR 403', 'No tienes acceso a esta página'],
    [NotFoundPage, 'ERROR 404', '¡Ups! No encontramos esta página'],
    [ServerErrorPage, 'ERROR 500', 'Algo salió mal de nuestro lado'],
  ])('renders its status and message', (Page, status, heading) => {
    render(<MemoryRouter><Page /></MemoryRouter>);

    expect(screen.getByText(status)).toBeTruthy();
    expect(screen.getByRole('heading', { name: heading })).toBeTruthy();
  });
});
