'use client';

import { AdminNav } from '@/components/AdminNav';
import { SiteSection } from '@/components/admin/SiteSection';

export default function AdminSitePage() {
  return (
    <div className="animate-fadeup space-y-4">
      <h1 className="text-2xl font-extrabold text-engrave">⚙️ تجهيزات الموقع</h1>
      <AdminNav />
      <SiteSection embedded />
    </div>
  );
}
