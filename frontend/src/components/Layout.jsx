import { NavLink } from 'react-router-dom';

const links = [
  ['/', 'Dashboard'],
  ['/schedule-video', 'Schedule Video Post'],
  ['/schedule-post', 'Schedule Text/Image Post'],
  ['/settings', 'Settings']
];

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="p-4 border-b border-slate-800 sticky top-0 bg-slate-950/90 backdrop-blur">
        <h1 className="text-xl font-bold">OnChain AI Social Automation</h1>
        <nav className="flex gap-2 mt-3 flex-wrap">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `px-3 py-1 rounded ${isActive ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800'}`}>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="p-4 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
