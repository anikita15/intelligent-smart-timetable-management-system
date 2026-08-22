import React from 'react';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false
}) => (
  <Modal open={open} onClose={onClose} title={title}
    footer={
      <>
        <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>
          {loading ? 'Loading...' : confirmLabel}
        </button>
      </>
    }
  >
    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{message}</p>
  </Modal>
);

export default ConfirmDialog;
