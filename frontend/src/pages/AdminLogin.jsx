import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import logoUrl from '../assets/globale-logo.svg';

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState(''); // phone or email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();

  const normalizePhoneE164 = (input) => {
    let s = String(input || '').replace(/[^\d+]/g, '');
    if (!s) return '';
    if (s.startsWith('+')) return s; // already E.164
    // Strip leading zero if present
    if (s.startsWith('0')) s = s.slice(1);
    // If local TR mobile (starts with 5 and has 10 digits), prefix +90
    if (s.length === 10 && s.startsWith('5')) return `+90${s}`;
    // If starts with country code 90 (11 digits), add +
    if (s.length === 11 && s.startsWith('90')) return `+${s}`;
    // Fallback: return as is (backend may still accept)
    return s;
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const raw = identifier.trim();
      const isEmail = /@/.test(raw);
      const payload = isEmail
        ? { email: raw, password }
        : { phone: normalizePhoneE164(raw), password };
      const { data } = await api.post('/auth/login', payload);
      if (data?.user?.role !== 'admin') {
        setError('Yalnızca admin hesaplarıyla giriş yapabilirsiniz');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      nav('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5a0a17] via-[#800020] to-[#2b0010] flex items-center justify-center p-4">
      <div className="w-full max-w-sm card p-6 space-y-5 shadow-xl">
        <img src={logoUrl} alt="Globale Logo" className="mx-auto w-24 h-auto select-none" />
        <h2 className="text-2xl font-semibold text-center">Admin Girişi</h2>
        {error && <div className="text-accent text-center">{error}</div>}
        <form className="space-y-3" onSubmit={submit}>
          <input className="w-full border rounded-xl p-4 text-lg" placeholder="Telefon (örn. +905555000001) veya E-posta" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          <input className="w-full border rounded-xl p-4 text-lg" placeholder="Şifre" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn-primary w-full py-4 text-lg" disabled={loading}>{loading ? '...' : 'Giriş'}</button>
        </form>
      </div>
    </div>
  );
}