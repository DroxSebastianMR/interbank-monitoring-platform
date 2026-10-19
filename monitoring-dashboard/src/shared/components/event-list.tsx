import type { ReactNode } from 'react';

export interface EventListItem {
  id: string;
  content: ReactNode;
}

interface EventListProps {
  items: EventListItem[];
  emptyMessage?: ReactNode;
}

export function EventList({ items, emptyMessage = 'Sin registros.' }: EventListProps) {
  if (!items.length) return <p>{emptyMessage}</p>;
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.content}</li>
      ))}
    </ul>
  );
}
