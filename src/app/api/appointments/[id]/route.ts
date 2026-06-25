import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const store = getStore();
  const body = await request.json();
  const idx = store.appointments.findIndex((a) => a.id === params.id);
  if (idx === -1) return NextResponse.json({ error: 'Randevu bulunamadı' }, { status: 404 });
  store.appointments[idx] = { ...store.appointments[idx], status: body.status };
  return NextResponse.json(store.appointments[idx]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const store = getStore();
  const idx = store.appointments.findIndex((a) => a.id === params.id);
  if (idx === -1) return NextResponse.json({ error: 'Randevu bulunamadı' }, { status: 404 });
  store.appointments.splice(idx, 1);
  return NextResponse.json({ success: true });
}
