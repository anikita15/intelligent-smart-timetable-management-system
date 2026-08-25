import React from 'react';
import { createPortal } from 'react-dom';

interface StatItem {
  label: string;
  value: React.ReactNode;
  dim?: boolean;
}

interface PageHeaderProps {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  count?: React.ReactNode;
  countLabel?: string;
  action?: React.ReactNode;
  stats?: StatItem[];
  hero?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, description, count, countLabel, action, stats, hero }) => {
  const target = document.getElementById('page-header-slot');
  if (!target) return null;

  return createPortal(
    <div className={`page-header ${hero ? 'hero' : ''}`}>
      <div className="page-header-main">
        <div className="page-header-eyebrow">{eyebrow}</div>
        <h1 className="page-header-title">{title}</h1>
        {description && <p className="page-header-description">{description}</p>}
      </div>

      {stats && stats.length > 0 && (
        <div className="page-header-stats">
          {stats.map((s, i) => (
            <div className="page-header-stat" key={i}>
              <div className="page-header-stat-label">{s.label}</div>
              <div className={`page-header-stat-value ${s.dim ? 'dim' : ''}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {(count !== undefined || action) && (
        <div className="page-header-side">
          {count !== undefined && (
            <div className="page-header-count-block">
              <div className="page-header-count-label">{countLabel || 'RECORDS'}</div>
              <div className="page-header-count-value">{count}</div>
            </div>
          )}
          {action && <div className="page-header-action-slot">{action}</div>}
        </div>
      )}
    </div>,
    target
  );
};

export default PageHeader;
