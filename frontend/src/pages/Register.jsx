import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import PhoneInput, { buildE164 } from '../components/PhoneInput.jsx';

export default function Register() {
  const [countryCode, setCountryCode] = useState('+90');
  const [localPhone, setLocalPhone] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allowedDials, setAllowedDials] = useState(['+90']);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const phoneE164 = buildE164(countryCode, localPhone);
      const { data } = await api.post('/auth/register', { phone: phoneE164, invite_code: inviteCode.trim(), password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('user_id', String(data.user.id));
      nav('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Kayıt başarısız');
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
        <h2 className="text-2xl font-semibold text-center">Kayıt Ol</h2>
        {error && <div className="text-accent text-center">{error}</div>}
        <form className="space-y-3" onSubmit={submit}>
          <PhoneInput allowedDials={allowedDials} countryCode={countryCode} onCountryChange={setCountryCode} localNumber={localPhone} onLocalNumberChange={setLocalPhone} />
          <input className="w-full border rounded-xl p-4 text-lg" placeholder="Davet Kodu" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
          <input className="w-full border rounded-xl p-4 text-lg" placeholder="Şifre" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn-primary w-full py-4 text-lg" disabled={loading}>{loading ? '...' : 'Kayıt'}</button>
        </form>
        <p className="text-sm text-center">Zaten hesabın var mı? <a href="/login" className="text-accent">Giriş yap</a></p>
      </div>
    </div>
  );
}