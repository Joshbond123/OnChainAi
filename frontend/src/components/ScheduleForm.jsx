import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const niches = [
  ['romance', 'Romance & Pig-Butchering Crypto Scams'],
  ['deepfake', 'AI-Driven & Deepfake Crypto Scams'],
  ['stats', 'Crypto Scam Statistics & Big Numbers']
];

export default function ScheduleForm({ type }) {
  const [settings, setSettings] = useState({ pages: [] });
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState({ niche: 'romance', pageId: '', dateTime: '', recurringDaily: false, type });

  const load = () => Promise.all([api.get('/settings'), api.get('/schedules')]).then(([s, sc]) => {
    setSettings(s.data.settings);
    setSchedules(sc.data.filter((x) => x.type === type));
  });

  useEffect(() => { load(); }, [type]);

  const submit = async () => {
    if (!form.pageId || !form.dateTime) return;
    await api.post('/schedules', form);
    setForm({ ...form, dateTime: '' });
    load();
  };
  const del = async (id) => { await api.delete(`/schedules/${id}`); load(); };
  const runNow = async (id) => { await api.post(`/automation/run/${id}`); load(); };
  const toggleRecurring = async (s) => { await api.put(`/schedules/${s.id}`, { recurringDaily: !s.recurringDaily }); load(); };
  const postponeOneHour = async (s) => {
    const current = new Date(s.dateTime);
    current.setHours(current.getHours() + 1);
    await api.put(`/schedules/${s.id}`, { dateTime: current.toISOString() });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="card grid md:grid-cols-2 gap-3">
        <select className="input" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })}>{niches.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select className="input" value={form.pageId} onChange={(e) => setForm({ ...form, pageId: e.target.value })}>
          <option value="">Select connected Facebook page</option>{settings.pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input className="input" type="datetime-local" value={form.dateTime ? new Date(form.dateTime).toISOString().slice(0,16) : ''} onChange={(e) => setForm({ ...form, dateTime: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.recurringDaily} onChange={(e) => setForm({ ...form, recurringDaily: e.target.checked })} /> Daily recurring</label>
        <button className="btn" onClick={submit}>Schedule Post</button>
      </div>
      <div className="card">
        <h3 className="font-bold mb-2">Recent Schedules</h3>
        {schedules.map((s) => (
          <div key={s.id} className="border-b border-slate-800 py-2 flex flex-wrap gap-2 items-center justify-between">
            <span>{s.niche} • {new Date(s.dateTime).toLocaleString()} • recurring: {String(s.recurringDaily)}</span>
            <div className="space-x-2">
              <button className="btn" onClick={() => runNow(s.id)}>Run</button>
              <button className="px-3 py-2 rounded bg-slate-700" onClick={() => postponeOneHour(s)}>Edit +1h</button>
              <button className="px-3 py-2 rounded bg-amber-500 text-black" onClick={() => toggleRecurring(s)}>Toggle recurring</button>
              <button className="px-3 py-2 rounded bg-red-500" onClick={() => del(s.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
