import { NextResponse } from 'next/server';
import { getSupabase, type SettingsRow } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function generateTimeSlots(start: string, end: string, interval: number): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let cur = sh * 60 + sm;
  const endMin = eh * 60 + em;
  while (cur < endMin) {
    slots.push(`${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`);
    cur += interval;
  }
  return slots;
}

const DEFAULT_SETTINGS: SettingsRow = {
  id: 1,
  working_days: [1, 2, 3, 4, 5, 6],
  work_start: '09:00',
  work_end: '19:00',
  work_interval: 30,
};

async function getSettings(): Promise<SettingsRow> {
  const supabase = getSupabase();
  const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
  return (data as SettingsRow) ?? DEFAULT_SETTINGS;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const settings = await getSettings();

  if (!date) {
    return NextResponse.json({
      workingDays: settings.working_days,
      workingHours: {
        start: settings.work_start,
        end: settings.work_end,
        interval: settings.work_interval,
      },
    });
  }

  const dayOfWeek = new Date(date + 'T00:00:00').getDay();
  if (!settings.working_days.includes(dayOfWeek)) {
    return NextResponse.json({ slots: [], isWorkingDay: false });
  }

  const supabase = getSupabase();
  const allSlots = generateTimeSlots(settings.work_start, settings.work_end, settings.work_interval);

  const [{ data: booked }, { data: blocked }] = await Promise.all([
    supabase.from('appointments').select('time').eq('date', date).neq('status', 'cancelled'),
    supabase.from('blocked_slots').select('time').eq('date', date),
  ]);

  const bookedTimes = (booked ?? []).map((r: { time: string }) => r.time);
  const blockedTimes = (blocked ?? []).map((r: { time: string }) => r.time);

  const available = allSlots.filter((s) => !bookedTimes.includes(s) && !blockedTimes.includes(s));
  return NextResponse.json({ slots: available, isWorkingDay: true });
}

export async function PUT(request: Request) {
  const supabase = getSupabase();
  const body = await request.json();
  const update: Partial<SettingsRow> = { id: 1 };
  if (body.workingDays !== undefined) update.working_days = body.workingDays;
  if (body.workingHours?.start !== undefined) update.work_start = body.workingHours.start;
  if (body.workingHours?.end !== undefined) update.work_end = body.workingHours.end;
  if (body.workingHours?.interval !== undefined) update.work_interval = body.workingHours.interval;

  await supabase.from('settings').upsert(update);
  return NextResponse.json({ success: true });
}
