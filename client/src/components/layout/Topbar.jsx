import { useState } from 'react';
import { Menu, Search, Bell, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ onMenuClick }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const query = new FormData(e.target).get('search');
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-8 z-30 relative">
      {/* Left: Mobile Toggle */}
      <div className="flex items-center md:hidden">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-md hover:bg-background transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Center: Global Search */}
      <div className="flex-1 max-w-2xl px-4 flex items-center justify-center md:justify-start">
        <form onSubmit={handleSearch} className="w-full max-w-md relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" size={18} />
          <input
            name="search"
            type="text"
            placeholder="Search auto number, route or location..."
            className="w-full bg-background border border-border rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-text-primary placeholder:text-text-secondary"
          />
        </form>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 text-text-secondary hover:text-primary rounded-full hover:bg-primary/10 transition-colors relative">
          <Bell size={20} />
          {/* Unread badge indicator could go here */}
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-full hover:bg-background transition-colors border border-transparent hover:border-border"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary-dark font-medium uppercase text-sm">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
          </button>
          
          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg border border-border py-1 z-50">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-sm font-medium text-text-primary truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-text-secondary truncate">{user?.email}</p>
                </div>
                <button 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background flex items-center gap-2"
                >
                  <Settings size={16} />
                  Settings
                </button>
                <button 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
