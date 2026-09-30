import { MapPin, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header() {
  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950">
            <MapPin size={19} />
          </span>
          <span>
            <span className="block leading-4">Lounaskartta</span>
            <span className="text-xs font-normal text-slate-500">Turku</span>
          </span>
        </Link>
        <button className="icon-btn" onClick={toggle} aria-label="Vaihda väriteemaa">
          <Sun size={17} className="dark:hidden" />
          <Moon size={17} className="hidden dark:block" />
        </button>
      </div>
    </header>
  );
}
