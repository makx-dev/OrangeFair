import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Calculator, 
  Search, 
  Car, 
  FileWarning, 
  History, 
  Settings, 
  LogOut,
  X,
  Route,
  Activity,
  Trophy
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import { useTranslation } from '../../i18n/TranslationProvider';

const NAV_ITEMS = [
  { labelKey: 'home', path: '/home', icon: Home, group: 'MAIN' },
  { labelKey: 'localFare', path: '/local-fare', icon: Route, group: 'MAIN' },
  { labelKey: 'fareSplit', path: '/fare-split', icon: Calculator, group: 'MAIN' },
  { labelKey: 'search', path: '/search', icon: Search, group: 'MAIN' },
  { labelKey: 'logRide', path: '/log-ride', icon: Car, group: 'MAIN' },
  { labelKey: 'reports', path: '/reports', icon: FileWarning, group: 'COMMUNITY' },
  { labelKey: 'routeWatch', path: '/route-watch', icon: Activity, group: 'COMMUNITY' },
  { labelKey: 'leaderboard', path: '/leaderboard', icon: Trophy, group: 'COMMUNITY' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  
  const navGroups = NAV_ITEMS.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-text-primary/50 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar Content */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-surface border-r border-border flex flex-col
        transition-transform duration-200 ease-in-out md:translate-x-0 md:static
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <div className="text-xl font-bold text-primary flex items-center gap-2">
            <span className="text-2xl">🍊</span> OrangeFair
          </div>
          <button onClick={onClose} className="md:hidden text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-6">
          {Object.entries(navGroups).map(([group, items]) => (
            <div key={group}>
              <div className="px-3 mb-2 text-xs font-semibold text-text-secondary tracking-wider">
                {group}
              </div>
              <nav className="flex flex-col gap-1">
                {items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-primary/10 text-primary-dark font-medium' 
                        : 'text-text-primary hover:bg-background hover:text-primary-dark'}
                    `}
                  >
                    <item.icon size={20} />
                    <span>{t(`nav.${item.labelKey}`)}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
          
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-text-secondary tracking-wider">
              ACCOUNT
            </div>
            <nav className="flex flex-col gap-1">
              <NavLink
                to="/settings"
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-primary/10 text-primary-dark font-medium' 
                    : 'text-text-primary hover:bg-background hover:text-primary-dark'}
                `}
              >
                <Settings size={20} />
                <span>Settings</span>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* User Footer */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-dark font-bold uppercase shrink-0">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-text-secondary truncate">
                {user?.email || ''}
              </p>
            </div>
            <button 
              onClick={logout}
              className="text-text-secondary hover:text-error transition-colors p-2 rounded-md hover:bg-error/10 shrink-0"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
