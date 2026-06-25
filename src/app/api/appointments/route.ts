import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import type { Appointment } from '@/lib/types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export async function GET() {
  const store = getStore();
  const sorted = [...store.appointments].sort((a, b) => {
    const ta = new Date(`${a.date}T${a.time}`).getTime();
    const tb = new Date(`${b.date}T${b.time}`).getTime();
    return ta - tb;
  });
  return NextResponse.json(sorted);
}

export async function POST(request: Request) {
  const store = getStore();
  const body = await request.json();
  const { customerName, phone, serviceId, serviceName, serviceDuration, servicePrice, date, time, notes } = body;

  if (!customerName || !phone || !serviceId || !date || !time) {
    return NextResponse.json({ error: 'Eksik bilgi gönderildi.' }, { status: 400 });
  }

  const conflict = store.appointments.some(
    (a) => a.date === date && a.time === time && a.status !== 'cancelled'
  );
  if (conflict) {
    return NextResponse.json({ error: 'Bu saat zaten dolu. Lütfen başka bir saat seçin.' }, { status: 409 });
  }

  const appointment: Appointment = {
    id: generateId(),
    customerName: String(customerName).trim(),
    phone: String(phone).trim(),
    serviceId: String(serviceId),
    serviceName: String(serviceName),
    serviceDuration: Number(serviceDuration),
    servicePrice: Number(servicePrice),
    date: String(date),
    time: String(time),
    status: 'pending',
    createdAt: new Date().toISOString(),
    notes: notes ? String(notes).trim() : undefined,
  };

  store.appointments.push(appointment);
  return NextResponse.json(appointment, { status: 201 });
}
