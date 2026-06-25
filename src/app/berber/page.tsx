'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Appointment } from '@/lib/types';

type Tab = 'appointments' | 'settings';
type Filter = 'all' | 'pending' | 'confirmed' | 'cancelled';

const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} · ${DAY_NAMES[d.getDay()]}`;
}

const STATUS_MAP = {
  pending:   { label: 'Bekliyor',   cls: 'bg-yellow-500/10 text-yellow-300 border-yellow-600/40' },
  confirmed: { label: 'Onaylandı', cls: 'bg-green-500/10 text-green-300 border-green-600/40' },
  cancelled: { label: 'İptal',      cls: 'bg-red-500/10 text-red-300 border-red-600/40' },
} as const;

export default function BarberPanel() {
  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME || 'Berber Salonu';

  // Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Panel
  const [activeTab, setActiveTab] = useState<Tab>('appointments');
  const [filter, setFilter] = useState<Filter>('pending');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Settings
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [workHours, setWorkHours] = useState({ start: '09:00', end: '19:00', interval: 30 });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('berber_auth') === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    const res = await fetch('/api/slots');
    const d = await res.json();
    if (d.workingDays) setWorkingDays(d.workingDays);
    if (d.workingHours) setWorkHours(d.workingHours);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    loadAppointments();
    loadSettings();
    const t = setInterval(loadAppointments, 30_000);
    return () => clearInterval(t);
  }, [isLoggedIn, loadAppointments, loadSettings]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        localStorage.setItem('berber_auth', 'true');
        setIsLoggedIn(true);
      } else {
        setLoginError('Hatalı şifre. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('berber_auth');
    setIsLoggedIn(false);
    setPassword('');
  }

  async function updateStatus(id: string, status: 'confirmed' | 'cancelled') {
    await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadAppointments();
  }

  async function deleteAppointment(id: string) {
    if (!confirm('Bu randevuyu kalıcı olarak silmek istiyor musunuz?')) return;
    await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
    loadAppointments();
  }

  async function saveSettings() {
    setSavingSettings(true);
    await fetch('/api/slots', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workingDays, workingHours: workHours }),
    });
    setSavingSettings(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  }

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const todayAppts   = appointments.filter((a) => a.date === todayStr && a.status !== 'cancelled');
  const pendingAppts = appointments.filter((a) => a.status === 'pending');
  const confirmedAll = appointments.filter((a) => a.status === 'confirmed');

  const filtered = appointments.filter((a) => filter === 'all' || a.status === filter);

  // ── Login Screen ──
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">💈</div>
            <h1 className="text-2xl font-bold text-white">{shopName}</h1>
            <p className="text-amber-400 text-sm mt-1 font-medium">Berber Paneli</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                className="w-full bg-slate-700/60 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>
            {loginError && (
              <div className="bg-red-900/40 border border-red-700/50 text-red-300 px-4 py-3 rounded-xl text-sm">
                ⚠️ {loginError}
              </div>
            )}
            <button
              type="submit"
              disabled={!password || isLoggingIn}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:shadow-none"
            >
              {isLoggingIn ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <a href="/" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
              ← Müşteri Sayfasına Dön
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard ──
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💈</span>
            <div>
              <span className="font-bold text-white">{shopName}</span>
              <span className="text-slate-500 text-xs ml-2">Berber Paneli</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pendingAppts.length > 0 && (
              <span className="bg-amber-500 text-slate-900 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                {pendingAppts.length} bekliyor
              </span>
            )}
            <a href="/" className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block">
              Müşteri Sayfası ↗
            </a>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 text-sm transition-colors">
              Çıkış
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{todayAppts.length}</div>
            <div className="text-slate-500 text-xs mt-0.5">Bugünkü</div>
          </div>
          <div className="text-center border-x border-slate-800">
            <div className="text-2xl font-bold text-amber-400">{pendingAppts.length}</div>
            <div className="text-slate-500 text-xs mt-0.5">Bekleyen</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{confirmedAll.length}</div>
            <div className="text-slate-500 text-xs mt-0.5">Onaylı</div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['appointments', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === tab
                  ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab === 'appointments' ? '📅 Randevular' : '⚙️ Ayarlar'}
            </button>
          ))}
        </div>

        {/* ── TAB: Randevular ── */}
        {activeTab === 'appointments' && (
          <div>
            {/* Filters */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-slate-600 text-white'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {f === 'all' ? 'Tümü' : f === 'pending' ? 'Bekleyen' : f === 'confirmed' ? 'Onaylı' : 'İptal'}
                  {f === 'pending' && pendingAppts.length > 0 && (
                    <span className="ml-1.5 bg-amber-500 text-slate-900 text-xs px-1.5 py-0.5 rounded-full font-bold">
                      {pendingAppts.length}
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={loadAppointments}
                disabled={loading}
                className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                <span className={loading ? 'animate-spin' : ''}>↻</span> Yenile
              </button>
            </div>

            {lastUpdated && (
              <p className="text-slate-600 text-xs mb-4">
                Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}
              </p>
            )}

            {loading && appointments.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <div className="inline-block w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
                <div>Yükleniyor...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📭</div>
                <div className="text-slate-400 text-lg">Randevu bulunamadı</div>
                <div className="text-slate-600 text-sm mt-1">Bu kategoride henüz randevu yok</div>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((appt) => {
                  const isToday = appt.date === todayStr;
                  return (
                    <div
                      key={appt.id}
                      className={`rounded-2xl border p-4 transition-all ${
                        isToday && appt.status !== 'cancelled'
                          ? 'bg-amber-500/5 border-amber-500/30'
                          : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            {isToday && appt.status !== 'cancelled' && (
                              <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full border border-amber-500/30 font-medium">
                                Bugün
                              </span>
                            )}
                            <h3 className="text-white font-semibold text-base">{appt.customerName}</h3>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${STATUS_MAP[appt.status].cls}`}>
                              {STATUS_MAP[appt.status].label}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                            <div className="flex gap-1.5">
                              <span className="text-slate-500">📅</span>
                              <span className="text-slate-300">{formatDate(appt.date)}</span>
                            </div>
                            <div className="flex gap-1.5">
                              <span className="text-slate-500">🕐</span>
                              <span className="text-slate-300 font-medium">{appt.time}</span>
                            </div>
                            <div className="flex gap-1.5">
                              <span className="text-slate-500">✂️</span>
                              <span className="text-slate-300">{appt.serviceName}</span>
                            </div>
                            <div className="flex gap-1.5">
                              <span className="text-slate-500">📞</span>
                              <span className="text-slate-300">{appt.phone}</span>
                            </div>
                          </div>
                          {appt.notes && (
                            <div className="mt-2 text-xs text-slate-400 bg-slate-700/40 rounded-lg px-3 py-2">
                              💬 {appt.notes}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 items-start flex-shrink-0">
                          {appt.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateStatus(appt.id, 'confirmed')}
                                className="bg-green-600 hover:bg-green-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                              >
                                ✓ Onayla
                              </button>
                              <button
                                onClick={() => updateStatus(appt.id, 'cancelled')}
                                className="bg-red-800 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                              >
                                ✕ İptal
                              </button>
                            </>
                          )}
                          {appt.status === 'confirmed' && (
                            <button
                              onClick={() => updateStatus(appt.id, 'cancelled')}
                              className="bg-red-800 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                            >
                              ✕ İptal Et
                            </button>
                          )}
                          {appt.status === 'cancelled' && (
                            <button
                              onClick={() => updateStatus(appt.id, 'confirmed')}
                              className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                            >
                              ↩ Geri Al
                            </button>
                          )}
                          <button
                            onClick={() => deleteAppointment(appt.id)}
                            className="bg-slate-700/60 hover:bg-slate-700 text-slate-400 hover:text-red-400 text-xs px-2.5 py-2 rounded-lg transition-colors"
                            title="Sil"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Ayarlar ── */}
        {activeTab === 'settings' && (
          <div className="max-w-lg animate-slide-up">
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-4">
              <h2 className="text-white font-semibold mb-4">Çalışma Günleri</h2>
              <div className="flex flex-wrap gap-2">
                {DAY_NAMES.map((day, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setWorkingDays((prev) =>
                        prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i].sort((a, b) => a - b)
                      )
                    }
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      workingDays.includes(i)
                        ? 'bg-amber-500 text-slate-900'
                        : 'bg-slate-700 text-slate-400 hover:text-white border border-slate-600'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-4">
              <h2 className="text-white font-semibold mb-4">Çalışma Saatleri</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Açılış</label>
                  <input
                    type="time"
                    value={workHours.start}
                    onChange={(e) => setWorkHours((p) => ({ ...p, start: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Kapanış</label>
                  <input
                    type="time"
                    value={workHours.end}
                    onChange={(e) => setWorkHours((p) => ({ ...p, end: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Randevu Aralığı</label>
                <select
                  value={workHours.interval}
                  onChange={(e) => setWorkHours((p) => ({ ...p, interval: Number(e.target.value) }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none transition-all"
                >
                  <option value={15}>15 dakika</option>
                  <option value={20}>20 dakika</option>
                  <option value={30}>30 dakika</option>
                  <option value={45}>45 dakika</option>
                  <option value={60}>60 dakika</option>
                </select>
              </div>
            </div>

            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="bg-amber-500 hover:bg-amber-400 disabled:bg-amber-700 text-slate-900 font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              {savingSettings ? 'Kaydediliyor...' : settingsSaved ? '✓ Kaydedildi!' : 'Ayarları Kaydet'}
            </button>

            <div className="mt-8 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
              <h2 className="text-white font-semibold mb-3">🔑 Şifre Değiştirme</h2>
              <p className="text-slate-400 text-sm">
                Şifreyi değiştirmek için sunucudaki{' '}
                <code className="bg-slate-700 px-1.5 py-0.5 rounded text-amber-300 text-xs">.env.local</code>{' '}
                dosyasında{' '}
                <code className="bg-slate-700 px-1.5 py-0.5 rounded text-amber-300 text-xs">BARBER_PASSWORD</code>{' '}
                değişkenini güncelleyin ve sunucuyu yeniden başlatın.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
