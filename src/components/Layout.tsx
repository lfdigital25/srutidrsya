import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Search, Bell, User, PlaySquare } from 'lucide-react';
import { clsx } from 'clsx';
import InstallPrompt from './InstallPrompt';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/notifications', icon: Bell, label: 'Alerts' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-50 font-sans">
      {/* Top Navigation / Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800 sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-2">
          <PlaySquare className="w-6 h-6 text-red-600" />
          <span className="font-bold text-lg tracking-tight">SRUTI DRSYA</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/search" className="p-2 rounded-full hover:bg-neutral-800 transition-colors">
            <Search className="w-5 h-5 text-neutral-400" />
          </Link>
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-sm font-medium">
            U
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </main>
      <InstallPrompt />

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 flex justify-around items-center h-16 px-2 z-10">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
                isActive ? 'text-red-600' : 'text-neutral-400 hover:text-neutral-200'
              )}
            >
              <Icon className={clsx('w-6 h-6', isActive && 'fill-red-600/20')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Side Navigation (Desktop) - Optional, keeping simple for now */}
    </div>
  );
}
