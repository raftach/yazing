import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export default function Combobox({ 
  value, 
  onChange, 
  options, 
  placeholder = "Επιλέξτε..." 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  
  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = useMemo(() => options.find(o => o.id === value), [options, value]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const s = search.toLowerCase();
    return options.filter(o => {
       const content = o.searchContent || `${o.title} ${o.subtitle || ''}`;
       return content.toLowerCase().includes(s);
    });
  }, [options, search]);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button */}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          textAlign: 'left',
          color: selectedOption ? 'var(--text-base)' : 'var(--text-muted)',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.title : placeholder}
        </span>
        <ChevronDown size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          zIndex: 1000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '300px'
        }}>
          {/* Search Input */}
          <div style={{ padding: '8px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }} />
            <input 
              autoFocus
              type="text" 
              placeholder="Αναζήτηση..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 8px 8px 30px',
                border: 'none',
                background: 'var(--bg-base)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                color: 'var(--text-base)'
              }}
            />
          </div>

          {/* Options List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                Δεν βρέθηκαν αποτελέσματα.
              </div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: value === opt.id ? 'var(--accent-soft)' : 'transparent',
                  }}
                  onMouseEnter={e => { if(value !== opt.id) e.currentTarget.style.background = 'var(--bg-card)'; }}
                  onMouseLeave={e => { if(value !== opt.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                     <span style={{ fontSize: '13px', fontWeight: value === opt.id ? 600 : 400, color: value === opt.id ? 'var(--accent)' : 'var(--text-base)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {opt.title}
                     </span>
                     {opt.subtitle && (
                       <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{opt.subtitle}</span>
                     )}
                  </div>
                  {value === opt.id && <Check size={14} color="var(--accent)" style={{ flexShrink: 0, marginLeft: 8 }} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
