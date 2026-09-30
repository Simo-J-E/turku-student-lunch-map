import { MapPin, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header() {
  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };
  return <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
    <div className="mx-auto flex max-w-[1800px] items-center justify-between px-4 py-3">
      <Link to="/" className="flex items-center gap-2 font-semibold"><MapPin size={20}/> Turun opiskelijalounaat</Link>
      <div className="flex items-center gap-1">
        <Link className="btn" to="/admin">Admin</Link>
        <button className="btn" onClick={toggle} aria-label="Vaihda väriteemaa"><Sun size={17} className="dark:hidden"/><Moon size={17} className="hidden dark:block"/></button>
      </div>
    </div>
  </header>;
}
