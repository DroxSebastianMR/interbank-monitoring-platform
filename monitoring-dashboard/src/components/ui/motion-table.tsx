import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import {
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

export type MotionTableSortDirection = 'asc' | 'desc';

export type MotionTableSortState = {
  key: string;
  direction: MotionTableSortDirection;
};

export type MotionTableColumn<T> = {
  key: string;
  header: ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  cell?: (row: T, index: number) => ReactNode;
  sortValue?: (row: T) => string | number | Date | null | undefined;
};

type MotionTableProps<T> = {
  data: T[];
  columns: MotionTableColumn<T>[];
  getRowId?: (row: T, index: number) => string;
  defaultSort?: MotionTableSortState | null;
  sort?: MotionTableSortState | null;
  onSortChange?: (sort: MotionTableSortState | null) => void;
  selectable?: boolean;
  selectedRowIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  rowHeight?: number;
  maxHeight?: number;
  virtualizeAfter?: number;
  emptyState?: ReactNode;
  ariaLabel?: string;
  className?: string;
  onRowClick?: (row: T) => void;
};

function compareValues(
  left: string | number | Date | null | undefined,
  right: string | number | Date | null | undefined,
) {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime();
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right), 'es', { numeric: true, sensitivity: 'base' });
}

export function MotionTable<T>({
  data,
  columns,
  getRowId,
  defaultSort = null,
  sort: controlledSort,
  onSortChange,
  selectable = false,
  selectedRowIds,
  onSelectionChange,
  rowHeight = 62,
  maxHeight = 520,
  virtualizeAfter = 50,
  emptyState = 'No hay datos disponibles.',
  ariaLabel = 'Tabla de datos',
  className,
  onRowClick,
}: MotionTableProps<T>) {
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [internalSort, setInternalSort] = useState<MotionTableSortState | null>(defaultSort);
  const [internalSelection, setInternalSelection] = useState<string[]>([]);
  const sort = controlledSort === undefined ? internalSort : controlledSort;
  const selection = selectedRowIds ?? internalSelection;

  const rows = useMemo(
    () => data.map((row, index) => ({ row, id: getRowId?.(row, index) ?? String(index) })),
    [data, getRowId],
  );

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((candidate) => candidate.key === sort.key);
    if (!column?.sortable) return rows;
    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) =>
      compareValues(column.sortValue?.(a.row), column.sortValue?.(b.row)) * direction,
    );
  }, [columns, rows, sort]);

  const updateSort = useCallback((key: string) => {
    const next: MotionTableSortState =
      sort?.key === key
        ? { key, direction: sort.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' };
    if (controlledSort === undefined) setInternalSort(next);
    onSortChange?.(next);
  }, [controlledSort, onSortChange, sort]);

  const updateSelection = useCallback((next: string[]) => {
    if (selectedRowIds === undefined) setInternalSelection(next);
    onSelectionChange?.(next);
  }, [onSelectionChange, selectedRowIds]);

  const selected = useMemo(() => new Set(selection), [selection]);
  const allSelected = sortedRows.length > 0 && sortedRows.every(({ id }) => selected.has(id));
  const shouldVirtualize = sortedRows.length > virtualizeAfter;
  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? sortedRows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
  });
  const virtualItems = virtualizer.getVirtualItems();
  const visibleRows = shouldVirtualize
    ? virtualItems.map((item) => ({ entry: sortedRows[item.index], index: item.index }))
    : sortedRows.map((entry, index) => ({ entry, index }));
  const paddingTop = shouldVirtualize && virtualItems.length ? virtualItems[0].start : 0;
  const paddingBottom = shouldVirtualize && virtualItems.length
    ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
    : 0;

  return (
    <div className={cn('motion-table', className)}>
      <div
        ref={scrollRef}
        className="motion-table-viewport"
        style={{ maxHeight, height: shouldVirtualize ? maxHeight : undefined }}
      >
        <table aria-label={ariaLabel}>
          <colgroup>
            {selectable && <col style={{ width: 48 }} />}
            {columns.map((column) => <col key={column.key} style={column.width ? { width: column.width } : undefined} />)}
          </colgroup>
          <thead>
            <tr>
              {selectable && (
                <th className="motion-table-select">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    aria-label="Seleccionar todas las filas"
                    onChange={() => updateSelection(allSelected ? [] : sortedRows.map(({ id }) => id))}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th key={column.key} className={`align-${column.align ?? 'left'}`} aria-sort={sort?.key === column.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {column.sortable ? (
                    <button type="button" onClick={() => updateSort(column.key)}>
                      <span>{column.header}</span>
                      {sort?.key !== column.key ? <ChevronsUpDown aria-hidden="true" /> : sort.direction === 'asc' ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />}
                    </button>
                  ) : column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr><td className="motion-table-empty" colSpan={columns.length + (selectable ? 1 : 0)}>{emptyState}</td></tr>
            ) : (
              <>
                {paddingTop > 0 && <tr aria-hidden="true" style={{ height: paddingTop }}><td colSpan={columns.length + (selectable ? 1 : 0)} /></tr>}
                {visibleRows.map(({ entry, index }) => (
                  <motion.tr
                    key={entry.id}
                    data-selected={selected.has(entry.id)}
                    initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.18, delay: reduceMotion ? 0 : Math.min(index * 0.018, 0.12) }}
                    style={{ height: rowHeight }}
                    className={onRowClick ? 'is-clickable' : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onClick={() => onRowClick?.(entry.row)}
                    onKeyDown={(event) => {
                      if (!onRowClick || (event.key !== 'Enter' && event.key !== ' ')) return;
                      event.preventDefault();
                      onRowClick(entry.row);
                    }}
                  >
                    {selectable && (
                      <td className="motion-table-select">
                        <input
                          type="checkbox"
                          checked={selected.has(entry.id)}
                          aria-label={`Seleccionar fila ${index + 1}`}
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => updateSelection(selected.has(entry.id) ? selection.filter((id) => id !== entry.id) : [...selection, entry.id])}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className={`align-${column.align ?? 'left'}`}>
                        {column.cell?.(entry.row, index) ?? '—'}
                      </td>
                    ))}
                  </motion.tr>
                ))}
                {paddingBottom > 0 && <tr aria-hidden="true" style={{ height: paddingBottom }}><td colSpan={columns.length + (selectable ? 1 : 0)} /></tr>}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MotionTable;
