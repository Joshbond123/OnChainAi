import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/automation/dashboard').then((r) => setData(r.data)); }, []);
  if (!data) return <p>Loading dashboard...</p>;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <section className="card"><h2 className="font-bold mb-2">Connected Facebook Pages</h2>{data.pages.map((p) => <p key={p.id}>{p.name} • {p.status}</p>) || 'None'}</section>
      <section className="card"><h2 className="font-bold mb-2">Upcoming Schedules</h2>{data.schedules.map((s) => <p key={s.id}>{s.type} • {s.niche} • {new Date(s.dateTime).toLocaleString()}</p>)}</section>
      <section className="card"><h2 className="font-bold mb-2">Recent Published Videos</h2>{data.recentVideos.map((v) => <p key={v.id}>{v.topic}</p>)}</section>
      <section className="card"><h2 className="font-bold mb-2">Recent Published Posts</h2>{data.recentPosts.map((p) => <p key={p.id}>{p.topic}</p>)}</section>
      <section className="card md:col-span-2"><h2 className="font-bold mb-2">Generation Logs</h2>{data.logs.map((l) => <p key={l.id}>{l.at} • {l.level} • {l.message}</p>)}</section>
    </div>
  );
}
