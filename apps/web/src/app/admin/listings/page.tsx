'use client';

import { AdminNav } from '@/components/AdminNav';
import { ListingsSection } from '@/components/admin/ListingsSection';

export default function AdminListingsPage() {
  return (
    <div className="animate-fadeup space-y-4">
      <h1 className="text-2xl font-extrabold text-engrave">📋 إدارة الإعلانات</h1>
      <AdminNav />
      <ListingsSection embedded />
    </div>
  );
}
