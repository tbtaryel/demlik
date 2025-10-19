import React from 'react';

const COUNTRY_OPTIONS = [
  { code: 'TR', dial: '+90', flag: '🇹🇷', label: 'Türkiye (+90)' },
  { code: 'US', dial: '+1', flag: '🇺🇸', label: 'United States (+1)' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', label: 'United Kingdom (+44)' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', label: 'Almanya (+49)' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', label: 'Fransa (+33)' },
  { code: 'ES', dial: '+34', flag: '🇪🇸', label: 'İspanya (+34)' },
  { code: 'IT', dial: '+39', flag: '🇮🇹', label: 'İtalya (+39)' },
  { code: 'NL', dial: '+31', flag: '🇳🇱', label: 'Hollanda (+31)' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', label: 'BAE (+971)' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', label: 'Suudi Arabistan (+966)' },
];

export default function PhoneInput({ countryCode, onCountryChange, localNumber, onLocalNumberChange, allowedDials }) {
  const allowed = Array.isArray(allowedDials) && allowedDials.length ? allowedDials.map((d) => String(d).trim()) : null;
  const options = allowed ? COUNTRY_OPTIONS.filter((opt) => allowed.includes(opt.dial)) : COUNTRY_OPTIONS;
  return (
    <div className="flex gap-2 w-full items-stretch">
      <select
        aria-label="Ülke Kodu"
        className="border rounded-xl p-3 text-base w-24 md:w-28 text-center leading-tight appearance-none outline-none focus:ring-2 focus:ring-inset focus:ring-accent/40 focus:border-accent"
        value={countryCode}
        onChange={(e) => onCountryChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.code} value={opt.dial} title={`${opt.label}`}>
            {opt.flag} {opt.dial}
          </option>
        ))}
      </select>
      <input
        className="flex-1 min-w-0 border rounded-xl p-4 text-lg outline-none focus:ring-2 focus:ring-inset focus:ring-accent/40 focus:border-accent placeholder:text-gray-400"
        placeholder="Telefon Numarası"
        type="tel"
        inputMode="tel"
        value={localNumber}
        onChange={(e) => onLocalNumberChange(e.target.value.replace(/\+/g, ''))}
      />
    </div>
  );
}

export function buildE164(countryDial, local) {
  const d = String(countryDial || '').replace(/[^\d]/g, '');
  let l = String(local || '').replace(/[^\d]/g, '');
  l = l.replace(/^0+/, '');
  if (!d && local.startsWith('+')) {
    // Fallback: user pasted full number
    const full = local.replace(/[^+\d]/g, '');
    return full.startsWith('+') ? full : `+${full}`;
  }
  return `+${d}${l}`;
}