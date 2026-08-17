import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, ShieldCheck, MessageSquare, AlertTriangle } from 'lucide-react';

export default function SearchPage() {
  const [plateNumber, setPlateNumber] = useState('');
  const navigate = useNavigate();

  const handleSearch = (event) => {
    event.preventDefault();
    const normalized = plateNumber.trim().replace(/\s+/g, '').toUpperCase();
    if (!normalized) return;
    navigate(`/auto/${encodeURIComponent(normalized)}`);
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 animate-in fade-in duration-300">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-6">
          <Search size={40} />
        </div>
        <h1 className="text-4xl font-bold text-text-primary mb-4">Verify an auto before you ride.</h1>
        <p className="text-lg text-text-secondary max-w-xl mx-auto">
          Enter an auto-rickshaw registration number to verify official vehicle details and check community trust.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm mb-12">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary" size={24} />
            <input
              type="text"
              value={plateNumber}
              onChange={(event) => setPlateNumber(event.target.value.toUpperCase())}
              placeholder="MH 31 AB 1234"
              className="w-full pl-14 pr-6 py-4 bg-background border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-xl font-medium tracking-wider uppercase"
              autoFocus
            />
          </div>
          <button 
            type="submit"
            disabled={!plateNumber.trim()}
            className="px-8 py-4 bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-surface font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-lg whitespace-nowrap"
          >
            Check Auto
            <ArrowRight size={20} />
          </button>
        </form>
      </div>

      <div className="max-w-xl mx-auto bg-surface border border-border rounded-xl p-6 md:p-8">
        <h3 className="text-xl font-bold text-text-primary mb-6 text-center">Why check an auto?</h3>
        <ul className="space-y-4">
          <li className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <span className="text-text-primary font-medium">Verify official vehicle information</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <span className="text-text-primary font-medium">See community trust status</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-info/10 text-info flex items-center justify-center shrink-0">
              <MessageSquare size={18} />
            </div>
            <span className="text-text-primary font-medium">Review verified experiences</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <span className="text-text-primary font-medium">Check previous fare and report history</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
