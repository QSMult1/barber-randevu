import { NextResponse } from 'next/server';
import { getSupabase, rowToAppointment, type AppointmentRow } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabase();
  const body = await request.json();
  const { data, error } = await supabase
    .from('appointments')
    .update({ status: body.status })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToAppointment(data as AppointmentRow));
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabase();
  const { error } = await supabase.from('appointments').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
