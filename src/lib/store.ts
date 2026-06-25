import type { StoreData } from './types';

declare global {
  var __barberStore: StoreData | undefined;
}

export function getStore(): StoreData {
  if (!global.__barberStore) {
    global.__barberStore = {
      appointments: [],
      blockedSlots: [],
      workingDays: [1, 2, 3, 4, 5, 6],
      workingHours: {
        start: '09:00',
        end: '19:00',
        interval: 30,
      },
    };
  }
  return global.__barberStore;
}
