import React from 'react';

interface StatusPillProps {
  tone?: 'crimson' | 'neutral';
  children: React.ReactNode;
}

const StatusPill: React.FC<StatusPillProps> = ({ tone = 'neutral', children }) => (
  <span className={`status-pill tone-${tone}`}>{children}</span>
);

export default StatusPill;
