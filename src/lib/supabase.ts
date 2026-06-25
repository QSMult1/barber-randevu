import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }
  return _client;
}

export type AppointmentRow = {
  id: string;
  customer_name: string;
  phone: string;
  service_id: string;
  service_name: string;
  service_duration: number;
  service_price: number;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  notes: string | null;
};

export type SettingsRow = {
  id: number;
  working_days: number[];
  work_start: string;
  work_end: string;
  work_interval: number;
};

export function rowToAppointment(row: AppointmentRow) {
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    serviceId: row.service_id,
    serviceName: row.service_name,
    serviceDuration: row.service_duration,
    servicePrice: row.service_price,
    date: row.date,
    time: row.time,
    status: row.status,
    createdAt: row.created_at,
    notes: row.notes ?? undefined,
  };
}
