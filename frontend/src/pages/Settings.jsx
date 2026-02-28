import { useEffect, useState } from 'react';
import { api } from '../lib/api';

function KeyManager({ title, type, keys = [], usage = {}, reload, needsAccountId = false }) {
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [accountId, setAccountId] = useState('');
  const [editingId, setEditingId] = useState('');

  const add = async () => {
    await api.post(`/settings/keys/${type}`, { label, value, accountId });
    setLabel(''); setValue(''); setAccountId(''); reload();
  };
  const remove = async (id) => { await api.delete(`/settings/keys/${type}/${id}`); reload(); };
  const validate = async (id) => { await api.post(`/settings/keys/${type}/${id}/validate`); reload(); };
  const startEdit = (k) => {
    setEditingId(k.id);
    setLabel(k.label || '');
    setValue(k.value || '');
    setAccountId(k.accountId || '');
  };
  const saveEdit = async () => {
    await api.put(`/settings/keys/${type}/${editingId}`, { label, value, accountId });
    setEditingId(''); setLabel(''); setValue(''); setAccountId(''); reload();
  };

  return (
    <div className="card">
      <h3 className="font-bold">{title}</h3>
      <div className={`grid ${needsAccountId ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-2 my-2`}>
        <input className="input" placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input className="input" placeholder="API Key / Token" value={value} onChange={(e) => setValue(e.target.value)} />
        {needsAccountId && <input className="input" placeholder="Cloudflare Account ID" value={accountId} onChange={(e) => setAccountId(e.target.value)} />}
        {editingId ? <button className="btn" onClick={saveEdit}>Save Edit</button> : <button className="btn" onClick={add}>Add</button>}
      </div>
      {keys.map((k) => (
        <p key={k.id} className="text-sm break-all">
          {k.label} • status: {k.status || 'unknown'} • used: {usage[k.id]?.used || 0} • ok: {usage[k.id]?.success || 0} • fail: {usage[k.id]?.failure || 0}
          <button onClick={() => validate(k.id)} className="text-cyan-300 ml-2">validate</button>
          <button onClick={() => startEdit(k)} className="text-yellow-300 ml-2">edit</button>
          <button onClick={() => remove(k.id)} className="text-red-400 ml-2">delete</button>
        </p>
      ))}
    </div>
  );
}

export default function Settings() {
  const [data, setData] = useState({ settings: { pages: [], cerebrasKeys: [], unrealKeys: [], cloudflareKeys: [] }, usage: { cerebras: {}, unreal: {}, cloudflare: {} } });
  const [token, setToken] = useState('');
  const [catboxHash, setCatboxHash] = useState('');
  const load = () => api.get('/settings').then((r) => { setData(r.data); setCatboxHash(r.data.settings.catboxHash || ''); });
  useEffect(() => { load(); }, []);

  const connectPage = async () => { await api.post('/settings/pages/connect', { token }); setToken(''); load(); };
  const removePage = async (id) => { await api.delete(`/settings/pages/${id}`); load(); };
  const saveCatbox = async () => { await api.put('/settings', { catboxHash }); load(); };
  const clearCatbox = async () => { await api.put('/settings', { catboxHash: '' }); setCatboxHash(''); load(); };

  return (
    <div className="space-y-4">
      <KeyManager title="Cerebras API Keys" type="cerebras" keys={data.settings.cerebrasKeys} usage={data.usage.cerebras} reload={load} />
      <KeyManager title="Unreal Speech API Keys" type="unreal" keys={data.settings.unrealKeys} usage={data.usage.unreal} reload={load} />
      <KeyManager title="Cloudflare Workers AI Tokens" type="cloudflare" keys={data.settings.cloudflareKeys} usage={data.usage.cloudflare} reload={load} needsAccountId />
      <div className="card">
        <h3 className="font-bold mb-2">Catbox.moe</h3>
        <div className="flex gap-2"><input className="input" value={catboxHash} onChange={(e) => setCatboxHash(e.target.value)} /><button className="btn" onClick={saveCatbox}>Save</button><button className="px-3 py-2 rounded bg-red-500" onClick={clearCatbox}>Delete</button></div>
      </div>
      <div className="card">
        <h3 className="font-bold mb-2">Facebook Page Access Tokens</h3>
        <div className="flex gap-2"><input className="input" placeholder="Page access token" value={token} onChange={(e) => setToken(e.target.value)} /><button className="btn" onClick={connectPage}>Connect</button></div>
        {data.settings.pages.map((p) => <p key={p.id}>{p.name} • {p.status} <button className="text-red-400" onClick={() => removePage(p.id)}>remove</button></p>)}
      </div>
    </div>
  );
}
