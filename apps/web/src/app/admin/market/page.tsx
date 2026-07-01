'use client';

import { AdminNav } from '@/components/AdminNav';
import { MarketSection } from '@/components/admin/MarketSection';

export default function AdminMarketPage() {
  return (
    <div className="animate-fadeup space-y-4">
      <h1 className="text-2xl font-extrabold text-engrave">⚖️ السوق والمستخدمون والنزاعات</h1>
      <AdminNav />
      <MarketSection embedded />
    </div>
  );
}
