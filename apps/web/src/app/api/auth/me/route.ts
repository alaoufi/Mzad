import { NextRequest } from 'next/server';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return json({ message: 'غير مصرّح' }, 401);
  return json({ id: user.sub, role: user.role, name: user.name });
}
