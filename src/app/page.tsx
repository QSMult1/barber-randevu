'use client';

import { useState, useEffect } from 'react';
import { SERVICES, type Service, type Appointment } from '@/lib/types';

type Step = 1 | 2 | 3 | 4 | 5;

const DAYS_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}, ${DAYS_TR[d.getDay()]}`;
}

function getNextWorkingDays(workingDays: number[], count = 14): string[] {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 1; dates.length < count && i <= 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (workingDays.includes(d.getDay())) dates.push(localDateStr(d));
  }
  return dates;
}

const STEP_LABELS = ['Hizmet', 'Tarih', 'Saat', 'Bilgiler'];

export default function CustomerPage() {
  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME || 'Berber Salonu';

  const [step, setStep] = useState<Step>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmedAppt, setConfirmedAppt] = useState<Appointment | null>(null);

  useEffect(() => {
    fetch('/api/slots')
      .then((r) => r.json())
      .then((d) => { if (d.workingDays) setWorkingDays(d.workingDays); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    setSlotsLoading(true);
    fetch(`/api/slots?date=${selectedDate}`)
      .then((r) => r.json())
      .then((d) => setAvailableSlots(d.slots ?? []))
      .catch(() => setAvailableSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate]);

  const availableDates = getNextWorkingDays(workingDays);

  async function handleSubmit() {
    if (!selectedService || !selectedDate || !selectedTime || !customerName.trim() || !phone.trim()) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          phone: phone.trim(),
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          serviceDuration: selectedService.duration,
          servicePrice: selectedService.price,
          date: selectedDate,
          time: selectedTime,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || 'Bir hata oluştu.'); return; }
      setConfirmedAppt(data);
      setStep(5);
    } catch {
      setSubmitError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function reset() {
    setStep(1); setSelectedService(null); setSelectedDate('');
    setSelectedTime(''); setCustomerName(''); setPhone('');
    setNotes(''); setSubmitError(''); setConfirmedAppt(null);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-3xl">💈</span>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{shopName}</h1>
            <p className="text-amber-400 text-xs font-medium">Online Randevu</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Step Indicator */}
        {step < 5 && (
          <div className="flex items-center mb-10">
            {STEP_LABELS.map((label, i) => {
              const s = (i + 1) as 1 | 2 | 3 | 4;
              const active = step === s;
              const done = step > s;
              return (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                      done ? 'bg-amber-500 text-slate-900' :
                      active ? 'bg-amber-500 text-slate-900 ring-4 ring-amber-500/30' :
                      'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}>
                      {done ? '✓' : s}
                    </div>
                    <span className={`text-xs mt-1 font-medium transition-colors ${active ? 'text-amber-400' : done ? 'text-slate-400' : 'text-slate-600'}`}>
                      {label}
                    </span>
                  </div>
                  {i < 3 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${done ? 'bg-amber-500' : 'bg-slate-800'}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── STEP 1: Hizmet Seçimi ── */}
        {step === 1 && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold text-white text-center mb-2">Hizmet Seçin</h2>
            <p className="text-slate-400 text-center text-sm mb-8">Almak istediğiniz hizmeti seçin</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {SERVICES.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => { setSelectedService(svc); setStep(2); }}
                  className="group bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/60 rounded-2xl p-5 text-left transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/5"
                >
                  <div className="text-3xl mb-3">{svc.icon}</div>
                  <div className="font-semibold text-white text-sm leading-tight">{svc.name}</div>
                  <div className="text-slate-500 text-xs mt-1">~{svc.duration} dk</div>
                  <div className="text-amber-400 font-bold mt-3 text-lg">{svc.price} ₺</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Tarih Seçimi ── */}
        {step === 2 && (
          <div className="animate-slide-up">
            <button onClick={() => setStep(1)} className="text-slate-500 hover:text-amber-400 text-sm mb-6 flex items-center gap-1 transition-colors">
              ← Geri
            </button>
            <h2 className="text-2xl font-bold text-white text-center mb-2">Tarih Seçin</h2>
            <p className="text-slate-400 text-center text-sm mb-6">Uygun olduğunuz günü seçin</p>
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
              <span className="text-xl">{selectedService?.icon}</span>
              <div>
                <div className="text-white font-medium text-sm">{selectedService?.name}</div>
                <div className="text-slate-400 text-xs">{selectedService?.duration} dakika · {selectedService?.price} ₺</div>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {availableDates.map((date) => {
                const d = new Date(date + 'T00:00:00');
                const isSelected = selectedDate === date;
                return (
                  <button
                    key={date}
                    onClick={() => { setSelectedDate(date); setSelectedTime(''); setStep(3); }}
                    className={`rounded-xl py-4 px-2 text-center transition-all duration-200 border ${
                      isSelected
                        ? 'bg-amber-500 border-amber-500 text-slate-900'
                        : 'bg-slate-800/60 border-slate-700 hover:border-amber-500/50 text-white'
                    }`}
                  >
                    <div className={`text-xs font-medium ${isSelected ? 'text-slate-700' : 'text-slate-400'}`}>{DAYS_TR[d.getDay()]}</div>
                    <div className="text-xl font-bold my-0.5">{d.getDate()}</div>
                    <div className={`text-xs ${isSelected ? 'text-slate-700' : 'text-slate-400'}`}>{MONTHS_TR[d.getMonth()]}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 3: Saat Seçimi ── */}
        {step === 3 && (
          <div className="animate-slide-up">
            <button onClick={() => setStep(2)} className="text-slate-500 hover:text-amber-400 text-sm mb-6 flex items-center gap-1 transition-colors">
              ← Geri
            </button>
            <h2 className="text-2xl font-bold text-white text-center mb-2">Saat Seçin</h2>
            <p className="text-slate-400 text-center text-sm mb-6">Müsait saatlerden birini seçin</p>
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3 mb-6 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="text-xl">{selectedService?.icon}</span>
                <span className="text-white font-medium text-sm">{selectedService?.name}</span>
              </div>
              <div className="text-amber-400 text-sm font-medium">{formatDate(selectedDate)}</div>
            </div>
            {slotsLoading ? (
              <div className="text-center py-12 text-slate-400">
                <div className="inline-block w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
                <div className="text-sm">Müsait saatler yükleniyor...</div>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">😔</div>
                <div className="text-slate-400">Bu gün için müsait saat bulunmuyor.</div>
                <button onClick={() => setStep(2)} className="mt-4 text-amber-400 hover:underline text-sm">Başka bir gün seçin</button>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => { setSelectedTime(slot); setStep(4); }}
                    className={`rounded-xl py-3 text-center text-sm font-semibold transition-all duration-200 border ${
                      selectedTime === slot
                        ? 'bg-amber-500 border-amber-500 text-slate-900'
                        : 'bg-slate-800/60 border-slate-700 hover:border-amber-500/50 text-white'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: Kişisel Bilgiler ── */}
        {step === 4 && (
          <div className="animate-slide-up">
            <button onClick={() => setStep(3)} className="text-slate-500 hover:text-amber-400 text-sm mb-6 flex items-center gap-1 transition-colors">
              ← Geri
            </button>
            <h2 className="text-2xl font-bold text-white text-center mb-2">Bilgilerinizi Girin</h2>
            <p className="text-slate-400 text-center text-sm mb-6">Randevunuz için iletişim bilgilerinizi girin</p>

            {/* Özet Kartı */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 mb-6 grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className="text-slate-500 text-xs mb-1">Hizmet</div>
                <div className="text-white font-medium">{selectedService?.name}</div>
              </div>
              <div className="text-center border-x border-slate-700">
                <div className="text-slate-500 text-xs mb-1">Tarih</div>
                <div className="text-white font-medium">{new Date(selectedDate + 'T00:00:00').getDate()} {MONTHS_TR[new Date(selectedDate + 'T00:00:00').getMonth()]}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-500 text-xs mb-1">Saat</div>
                <div className="text-amber-400 font-bold text-base">{selectedTime}</div>
              </div>
            </div>

            <div className="space-y-4 max-w-sm mx-auto">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Ad Soyad <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Telefon <span className="text-red-400">*</span></label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0532 123 45 67"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notlar <span className="text-slate-500 font-normal">(isteğe bağlı)</span></label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Özel isteğiniz varsa belirtin..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                />
              </div>

              {submitError && (
                <div className="bg-red-900/40 border border-red-700/60 text-red-300 px-4 py-3 rounded-xl text-sm">
                  ⚠️ {submitError}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!customerName.trim() || !phone.trim() || isSubmitting}
                className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold py-4 rounded-xl transition-all text-base shadow-lg shadow-amber-500/20 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-slate-700 border-t-slate-900 rounded-full animate-spin" />
                    Gönderiliyor...
                  </span>
                ) : 'Randevu Al'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Onay ── */}
        {step === 5 && confirmedAppt && (
          <div className="animate-slide-up text-center">
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-2">Randevunuz Alındı!</h2>
            <p className="text-slate-400 mb-8">Berberiniz en kısa sürede randevunuzu onaylayacak.</p>

            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 max-w-sm mx-auto mb-8 text-left">
              <h3 className="text-white font-semibold text-center mb-5 text-lg">Randevu Detayı</h3>
              <div className="space-y-3 text-sm">
                {[
                  ['Ad Soyad', confirmedAppt.customerName],
                  ['Telefon', confirmedAppt.phone],
                  ['Hizmet', confirmedAppt.serviceName],
                  ['Süre', `~${confirmedAppt.serviceDuration} dakika`],
                  ['Tarih', formatDate(confirmedAppt.date)],
                  ['Saat', confirmedAppt.time],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-white font-medium">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                  <span className="text-slate-400">Ücret</span>
                  <span className="text-amber-400 font-bold text-lg">{confirmedAppt.servicePrice} ₺</span>
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-yellow-900/30 border border-yellow-700/40 text-yellow-300 text-xs px-4 py-2 rounded-full mb-8">
              ⏳ Onay bekleniyor
            </div>

            <div>
              <button
                onClick={reset}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20"
              >
                Yeni Randevu Al
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 py-4 mt-auto">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <a href="/berber" className="text-slate-600 hover:text-amber-400 text-xs transition-colors">
            🔐 Berber Girişi
          </a>
        </div>
      </footer>
    </div>
  );
}
