export type ColumnType = "text" | "badge" | "link" | "button";

export interface Column<T> {
  key: keyof T;
  header: string;
  type?: ColumnType;
  align?: "left" | "right" | "center";
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  getRowKey: (row: T) => string;
  onRowAction?: (row: T) => void;
  rowActionLabel?: string;
  onCellAction?: (row: T, key: keyof T) => void;
  isCellLoading?: (row: T, key: keyof T) => boolean;
}
