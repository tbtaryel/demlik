import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import logoUrl from '../assets/globale-logo.svg';
import PhoneInput, { buildE164 } from '../components/PhoneInput.jsx';

export default function Login() {
  const [countryCode, setCountryCode] = useState('+90');
  const [localPhone, setLocalPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allowedDials, setAllowedDials] = useState(['+90']);
  const nav = useNavigate();

  // Hidden admin access: 7 taps on logo within 3 seconds
  const tapCountRef = useRef(0);
  const resetTimerRef = useRef(null);
  const onLogoTap = () => {
    tapCountRef.current += 1;
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 3000);
    if (tapCountRef.current >= 7) {
      tapCountRef.current = 0;
      clearTimeout(resetTimerRef.current);
      nav('/admin-login');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const phoneE164 = buildE164(countryCode, localPhone);
      const { data } = await api.post('/auth/login', { phone: phoneE164, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('user_id', String(data.user.id));
      nav(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    api.get('/settings').then((r) => {
      if (!mounted) return;
      const s = r.data || {};
      const allowed = String(s.phone_allowed_dials || '+90').split(',').map((x) => x.trim()).filter(Boolean);
      setAllowedDials(allowed.length ? allowed : ['+90']);
      if (!allowed.includes(countryCode)) {
        setCountryCode(allowed[0] || '+90');
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5a0a17] via-[#800020] to-[#2b0010] flex items-center justify-center p-4">
      <div className="w-full max-w-sm card p-6 space-y-5 shadow-xl">
        <img src={logoUrl} alt="Globale Logo" className="mx-auto w-24 h-auto cursor-pointer select-none" onClick={onLogoTap} />
        <h2 className="text-2xl font-semibold text-center">Giriş Yap</h2>
        <p className="text-center text-sm text-gray-600">Hızlı ve güvenli giriş için bilgilerini gir.</p>
        {error && <div className="text-accent text-center">{error}</div>}
        <form className="space-y-3" onSubmit={submit}>
          <PhoneInput allowedDials={allowedDials} countryCode={countryCode} onCountryChange={setCountryCode} localNumber={localPhone} onLocalNumberChange={setLocalPhone} />
          <input className="w-full border rounded-xl p-4 text-lg outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent placeholder:text-gray-400" placeholder="Şifre" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn-primary w-full py-4 text-lg" disabled={loading}>{loading ? '...' : 'Giriş'}</button>
        </form>
        <div className="text-center">
          <a href="/register" className="text-accent text-sm underline">Kayıt işlemi</a>
        </div>
      </div>
    </div>
  );
}