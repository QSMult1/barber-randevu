import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json();
  const { password } = body;
  const correct = process.env.BARBER_PASSWORD ?? 'berber123';
  if (password === correct) return NextResponse.json({ success: true });
  return NextResponse.json({ error: 'Hatalı şifre' }, { status: 401 });
}
