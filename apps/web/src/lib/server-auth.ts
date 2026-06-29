import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const SECRET = process.env.JWT_SECRET ?? 'change-me-in-production';

export interface TokenPayload {
  sub: string;
  role: string;
  name: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function getUser(req: NextRequest): TokenPayload | null {
  const header = req.headers.get('authorization') ?? '';
  const token = header.replace('Bearer ', '');
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function normalizePhone(phone: string): string {
  let p = phone.replace(/\s|-/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('05')) p = '966' + p.slice(1);
  if (p.startsWith('5')) p = '966' + p;
  return p;
}

// رد JSON موحّد
export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
