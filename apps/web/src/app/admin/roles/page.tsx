'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ACCOUNT_TYPES } from '@/lib/roles';
import { SECTIONS, ACTIONS, can } from '@/lib/permissions';

export default function AdminRolesPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <p className="py-10 text-center text-gray-500">للإدارة فقط.</p>;

  // نعرض الأدوار ذات الصلاحيات الإدارية أولاً
  const roles = ACCOUNT_TYPES;

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.push('/admin')} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-brand-dark shadow-sm ring-1 ring-sand-200">→ الإدارة</button>
        <h1 className="text-2xl font-extrabold text-engrave">🔑 الصلاحيات والأدوار</h1>
      </div>
      <p className="text-sm text-gray-500">مصفوفة صلاحيات كل دور على الأقسام الأربعة: اطلاع · إضافة · تعديل · حذف.</p>

      {roles.map((r) => (
        <div key={r.key} className="card p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xl">{r.emoji}</span>
            <span className="font-extrabold text-engrave">{r.label}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400">
                  <th className="p-1.5 text-right font-bold">القسم</th>
                  {ACTIONS.map((a) => <th key={a.key} className="p-1.5 text-center font-bold">{a.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {SECTIONS.map((s) => (
                  <tr key={s.key} className="border-t border-sand-100">
                    <td className="p-1.5 font-bold text-gray-700">{s.icon} {s.label}</td>
                    {ACTIONS.map((a) => (
                      <td key={a.key} className="p-1.5 text-center">
                        {can(r.key, s.key, a.key)
                          ? <span className="text-green-600">✔</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
