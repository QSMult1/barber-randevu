import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';

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

export async function GET(request: Request) {
  const store = getStore();
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({
      workingDays: store.workingDays,
      workingHours: store.workingHours,
    });
  }

  const dayOfWeek = new Date(date + 'T00:00:00').getDay();
  if (!store.workingDays.includes(dayOfWeek)) {
    return NextResponse.json({ slots: [], isWorkingDay: false });
  }

  const allSlots = generateTimeSlots(
    store.workingHours.start,
    store.workingHours.end,
    store.workingHours.interval
  );

  const bookedTimes = store.appointments
    .filter((a) => a.date === date && a.status !== 'cancelled')
    .map((a) => a.time);

  const blockedTimes = store.blockedSlots
    .filter((s) => s.date === date)
    .map((s) => s.time);

  const available = allSlots.filter((s) => !bookedTimes.includes(s) && !blockedTimes.includes(s));
  return NextResponse.json({ slots: available, isWorkingDay: true });
}

export async function PUT(request: Request) {
  const store = getStore();
  const body = await request.json();
  if (body.workingDays !== undefined) store.workingDays = body.workingDays;
  if (body.workingHours !== undefined) store.workingHours = { ...store.workingHours, ...body.workingHours };
  return NextResponse.json({ success: true });
}
