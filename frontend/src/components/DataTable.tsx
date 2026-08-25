import React from 'react';
import { Search } from 'lucide-react';

interface DataTableProps {
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  searchExtra?: React.ReactNode;
  columns: string[];
  gridTemplate: string;
  rightAlignLast?: boolean;
  loading?: boolean;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  summary?: React.ReactNode;
  advisory?: React.ReactNode;
  children: React.ReactNode;
}

export const DataTable: React.FC<DataTableProps> = ({
  searchValue, onSearchChange, searchPlaceholder, searchExtra,
  columns, gridTemplate, rightAlignLast = true, loading, empty, emptyTitle, emptyDescription, emptyAction,
  summary, advisory, children,
}) => {
  return (
    <div>
      <div className="data-table-card">
        {onSearchChange && (
          <div className="dt-search-row">
            <div className="search-input-wrapper">
              <Search size={15} />
              <input
                className="form-input search-input"
                placeholder={searchPlaceholder || 'Search'}
                value={searchValue}
                onChange={e => onSearchChange(e.target.value)}
              />
            </div>
            {searchExtra}
          </div>
        )}

        {!loading && !empty && (
          <div className="dt-head-row" style={{ gridTemplateColumns: gridTemplate }}>
            {columns.map((c, i) => (
              <div key={i} className={`dt-head-cell ${rightAlignLast && i === columns.length - 1 ? 'align-right' : ''}`}>{c}</div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="empty-state"><p>Loading...</p></div>
        ) : empty ? (
          <div className="empty-state">
            <h3>{emptyTitle || 'No records found'}</h3>
            {emptyDescription && <p>{emptyDescription}</p>}
            {emptyAction}
          </div>
        ) : (
          children
        )}
      </div>

      {!loading && !empty && summary && <div className="dt-summary">{summary}</div>}
      {!loading && !empty && advisory}
    </div>
  );
};

interface DataTableRowProps {
  gridTemplate: string;
  onClick?: () => void;
  children: React.ReactNode;
}

export const DataTableRow: React.FC<DataTableRowProps> = ({ gridTemplate, onClick, children }) => (
  <div
    className={`dt-row ${onClick ? 'clickable' : ''}`}
    style={{ gridTemplateColumns: gridTemplate }}
    onClick={onClick}
  >
    {children}
  </div>
);
