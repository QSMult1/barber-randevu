import { NextResponse } from 'next/server';
import { getSupabase, rowToAppointment, type AppointmentRow } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data as AppointmentRow[]).map(rowToAppointment));
}

export async function POST(request: Request) {
  const supabase = getSupabase();
  const body = await request.json();
  const { customerName, phone, serviceId, serviceName, serviceDuration, servicePrice, date, time, notes } = body;

  if (!customerName || !phone || !serviceId || !date || !time) {
    return NextResponse.json({ error: 'Eksik bilgi gönderildi.' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('appointments')
    .select('id')
    .eq('date', date)
    .eq('time', time)
    .neq('status', 'cancelled')
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Bu saat zaten dolu. Lütfen başka bir saat seçin.' }, { status: 409 });
  }

  const newRow = {
    id: generateId(),
    customer_name: String(customerName).trim(),
    phone: String(phone).trim(),
    service_id: String(serviceId),
    service_name: String(serviceName),
    service_duration: Number(serviceDuration),
    service_price: Number(servicePrice),
    date: String(date),
    time: String(time),
    status: 'pending' as const,
    notes: notes ? String(notes).trim() : null,
  };

  const { data, error } = await supabase.from('appointments').insert(newRow).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(rowToAppointment(data as AppointmentRow), { status: 201 });
}
