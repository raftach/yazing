import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Lock, Eye, EyeOff, Boxes } from 'lucide-react';

export default function LoginPage() {
  const { login } = useApp();
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 600));
    const ok = login(password);
    if (!ok) {
      setError('Λάθος κωδικός. Παρακαλώ ξαναπροσπαθήστε.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse at 60% 30%, rgba(79,142,247,0.12) 0%, transparent 60%), var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '72px', height: '72px',
            background: 'linear-gradient(135deg, #4f8ef7, #a78bfa)',
            borderRadius: '22px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 36px rgba(79,142,247,0.35)',
          }}>
            <Boxes size={36} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, background: 'linear-gradient(135deg, #f0f2f8, #8892a4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              LogiTrack
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Logistics Management System</p>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '28px 24px',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h1 style={{ fontSize: '28px', margin: '0 0 5px 0' }}>Yazing</h1>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>Συνδεθείτε για να συνεχίσετε</p>
            </div>

            <div className="form-group">
              <label className="form-label">Κωδικός Πρόσβασης</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Lock size={16} />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Εισάγετε κωδικό"
                  style={{ paddingLeft: '40px', paddingRight: '44px' }}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', padding: '4px', cursor: 'pointer',
                }}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'var(--danger-soft)', border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: 'var(--radius-md)', padding: '11px 14px',
                color: 'var(--danger)', fontSize: '13px',
              }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px' }} disabled={loading}>
              {loading ? 'Σύνδεση...' : 'Σύνδεση'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
