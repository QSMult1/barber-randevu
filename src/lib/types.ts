export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  icon: string;
}

export interface Appointment {
  id: string;
  customerName: string;
  phone: string;
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  notes?: string;
}

export interface WorkingHours {
  start: string;
  end: string;
  interval: number;
}

export interface StoreData {
  appointments: Appointment[];
  blockedSlots: Array<{ date: string; time: string }>;
  workingDays: number[];
  workingHours: WorkingHours;
}

export const SERVICES: Service[] = [
  { id: '1', name: 'Saç Kesimi', duration: 30, price: 150, icon: '✂️' },
  { id: '2', name: 'Sakal Düzenleme', duration: 20, price: 100, icon: '🪒' },
  { id: '3', name: 'Saç + Sakal', duration: 50, price: 220, icon: '💈' },
  { id: '4', name: 'Çocuk Saç Kesimi', duration: 20, price: 100, icon: '👦' },
  { id: '5', name: 'Saç Yıkama + Kesim', duration: 45, price: 180, icon: '🚿' },
  { id: '6', name: 'Kaş Düzenleme', duration: 10, price: 50, icon: '✨' },
];
