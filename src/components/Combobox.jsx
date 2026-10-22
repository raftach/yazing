import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Combobox({
  id,
  value,
  onChange,
  options,
  placeholder = 'Επιλέξτε...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  // Close on outside tap
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  const selectedOption = useMemo(() => (options || []).find(o => o.id === value), [options, value]);

  const filteredOptions = useMemo(() => {
    const opts = options || [];
    if (!search.trim()) return opts;
    const s = search.toLowerCase();
    return opts.filter(o => (o.searchContent || `${o.title} ${o.subtitle || ''}`).toLowerCase().includes(s));
  }, [options, search]);

  return (
    <div ref={wrapperRef} className="combo">
      <button type="button" id={id} className="combo-trigger" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
        <span className={selectedOption ? '' : 'ph'}>{selectedOption ? selectedOption.title : placeholder}</span>
        <ChevronDown size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
      </button>

      {isOpen && (
        <div className="combo-pop">
          <input
            autoFocus
            type="text"
            placeholder="Αναζήτηση..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="combo-list">
            {filteredOptions.length === 0 ? (
              <div className="hint" style={{ padding: 12, textAlign: 'center' }}>Δεν βρέθηκαν αποτελέσματα.</div>
            ) : (
              filteredOptions.map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  className={`combo-opt${value === opt.id ? ' on' : ''}`}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <b>{opt.title}</b>
                  {opt.subtitle && <small>{opt.subtitle}</small>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
