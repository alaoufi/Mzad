'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const requestOtp = async () => {
    setError(''); setBusy(true);
    try {
      const r = await api<{ devCode?: string }>('/auth/request-otp', { method: 'POST', body: JSON.stringify({ phone }) });
      setDevCode(r.devCode ?? null); setStep('code');
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  const verify = async () => {
    setError(''); setBusy(true);
    try {
      const r = await api<{ token: string; user: any }>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, code, name }) });
      login(r.token, r.user); router.push('/');
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-md animate-fadeup">
      {/* هوية بصرية */}
      <div className="mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark to-brand-light p-8 text-center text-white shadow-xl"
        style={{ boxShadow: '0 24px 48px -20px rgba(10,92,80,0.55)' }}>
        <div className="animate-floaty text-6xl drop-shadow">🐪</div>
        <h1 className="mt-2 text-3xl font-extrabold text-emboss-light">مزاد</h1>
        <p className="mt-1 text-white/85">سوق ومزادات المواشي</p>
      </div>

      <div className="card float-box p-6">
        <h2 className="mb-1 text-2xl font-extrabold text-engrave">تسجيل الدخول</h2>
        <p className="mb-6 text-gray-500">أدخل رقم جوالك ليصلك رمز التحقق</p>

        {error && <div className="mb-4 rounded-2xl bg-red-50 p-3 text-red-700">{error}</div>}

        {step === 'phone' ? (
          <>
            <label className="mb-2 block text-lg font-bold">رقم الجوال</label>
            <input className="input mb-4 text-center text-2xl tracking-widest" placeholder="05XXXXXXXX"
              inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <label className="mb-2 block text-lg font-bold">الاسم (اختياري)</label>
            <input className="input mb-6" placeholder="اسمك" value={name} onChange={(e) => setName(e.target.value)} />
            <button onClick={requestOtp} disabled={busy || phone.length < 9} className="btn-primary w-full disabled:opacity-50">
              {busy ? '...' : 'إرسال الرمز'}
            </button>
          </>
        ) : (
          <>
            {devCode && (
              <div className="mb-4 rounded-2xl bg-amber-50 p-3 text-center text-amber-800">
                🔐 رمز التطوير: <b className="text-xl text-emboss">{devCode}</b>
              </div>
            )}
            <label className="mb-2 block text-lg font-bold">رمز التحقق</label>
            <input className="input mb-6 text-center text-3xl tracking-[0.5em]" placeholder="••••"
              inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
            <button onClick={verify} disabled={busy || code.length < 4} className="btn-primary w-full disabled:opacity-50">
              {busy ? '...' : 'تأكيد ودخول'}
            </button>
            <button onClick={() => setStep('phone')} className="mt-3 w-full text-center text-gray-500">تغيير الرقم</button>
          </>
        )}
      </div>
    </div>
  );
}
