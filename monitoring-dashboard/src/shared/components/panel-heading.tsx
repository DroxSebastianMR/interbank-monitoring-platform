import type { ReactNode } from 'react';

interface PanelHeadingProps {
  title: ReactNode;
  description?: ReactNode;
  id?: string;
  children?: ReactNode;
}

export function PanelHeading({ title, description, id, children }: PanelHeadingProps) {
  return (
    <header className="panel-heading">
      <div>
        <h2 id={id}>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </header>
  );
}
