import React, { useEffect } from 'react';

// Sheets can stack, so page scroll stays locked while any of them is open.
let openSheets = 0;

// Bottom sheet. `left` / `right` are header actions: { label, onClick, disabled }.
export default function Sheet({ title, left, right, onClose, short, children }) {
  useEffect(() => {
    openSheets++;
    document.body.style.overflow = 'hidden';
    return () => {
      openSheets--;
      if (openSheets === 0) document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const l = left || { label: 'Κλείσιμο', onClick: onClose };
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className={`sheet${short ? ' short' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-grab" />
        <div className="sheet-top">
          <button className="l" onClick={l.onClick}>{l.label}</button>
          <span className="t">{title}</span>
          {right ? <button className="r" onClick={right.onClick} disabled={right.disabled}>{right.label}</button> : <span />}
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </>
  );
}

// Confirmation for destructive actions. `confirm` = { title, text, action, danger, onConfirm }.
export function ConfirmSheet({ confirm, onClose }) {
  if (!confirm) return null;
  return (
    <Sheet title={confirm.title} onClose={onClose} short left={{ label: 'Άκυρο', onClick: onClose }}>
      <p style={{ fontSize: 15, color: 'var(--ink-2)', whiteSpace: 'pre-line' }}>{confirm.text}</p>
      <div className="sheet-foot">
        <button className="btn btn-quiet" onClick={onClose}>Άκυρο</button>
        <button
          className={`btn ${confirm.danger ? 'btn-danger' : 'btn-ink'}`}
          onClick={() => { confirm.onConfirm(); onClose(); }}
        >
          {confirm.action}
        </button>
      </div>
    </Sheet>
  );
}
