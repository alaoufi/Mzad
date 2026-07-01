'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { uiToast } from '@/lib/ui';
import { RegionCityPicker } from './RegionCityPicker';

export interface EditableProfile {
  name?: string;
  city?: string | null;
  region?: string | null;
  bio?: string | null;
  experienceYears?: number | null;
  bankName?: string | null;
  bankAccount?: string | null;
  iban?: string | null;
}

// نافذة تعديل البيانات الشخصية والبنكية — كلّها اختيارية عدا الاسم
export function ProfileEditSheet({
  initial, onSaved, onClose,
}: { initial: EditableProfile; onSaved: () => void; onClose: () => void }) {
  const [name, setName] = useState(initial.name ?? '');
  const [city, setCity] = useState(initial.city ?? '');
  const [region, setRegion] = useState(initial.region ?? '');
  const [bio, setBio] = useState(initial.bio ?? '');
  const [experienceYears, setExperienceYears] = useState(initial.experienceYears != null ? String(initial.experienceYears) : '');
  const [bankName, setBankName] = useState(initial.bankName ?? '');
  const [bankAccount, setBankAccount] = useState(initial.bankAccount ?? '');
  const [iban, setIban] = useState(initial.iban ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) { uiToast('الاسم مطلوب', 'error'); return; }
    setSaving(true);
    try {
      await api('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim() || null,
          region: region.trim() || null,
          bio: bio.trim() || null,
          experienceYears: experienceYears ? Number(experienceYears) : null,
          bankName: bankName.trim() || null,
          bankAccount: bankAccount.trim() || null,
          iban: iban.trim() || null,
        }),
      });
      uiToast('✓ حُفظت بياناتك', 'success');
      onSaved();
      onClose();
    } catch (e: any) {
      uiToast(`تعذّر الحفظ: ${e?.message ?? 'خطأ'}`, 'error');
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-3" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-engrave">تعديل بياناتي</h3>
          <button onClick={onClose} className="text-2xl leading-none text-gray-400">×</button>
        </div>

        <div className="space-y-3">
          <Field label="الاسم" required>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك" />
          </Field>
          <RegionCityPicker region={region} city={city} onChange={(r, c) => { setRegion(r); setCity(c); }} />
          <Field label="تعريف بنفسك">
            <textarea className="input min-h-[64px]" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="نبذة مختصرة عنك ونشاطك في السوق" />
          </Field>
          <Field label="سنوات الخبرة في سوق الحلال">
            <input className="input" inputMode="numeric" value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value.replace(/\D/g, ''))} placeholder="مثال: 5" />
          </Field>

          <div className="rounded-2xl bg-sand-50 p-3">
            <p className="mb-2 text-xs font-extrabold text-brand-dark">🏦 البيانات البنكية (لاستلام مستحقات مبيعاتك — تبقى خاصة)</p>
            <div className="space-y-3">
              <Field label="البنك"><input className="input" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="اسم البنك" /></Field>
              <Field label="رقم الحساب"><input className="input" inputMode="numeric" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="رقم الحساب البنكي" /></Field>
              <Field label="الآيبان (IBAN)"><input className="input" value={iban} onChange={(e) => setIban(e.target.value)} placeholder="SA00 0000 0000 0000 0000 0000" /></Field>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="btn-outline flex-1">إلغاء</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">{saving ? '...' : 'حفظ'}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-bold text-gray-600">{label}{required && <span className="text-red-500"> *</span>}</label>
      {children}
    </div>
  );
}
