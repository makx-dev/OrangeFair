import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createRide } from '../api/endpoints';
import { Car, MapPin, IndianRupee, Calendar, FileText, CheckCircle2 } from 'lucide-react';

export default function LogRidePage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialPlate = searchParams.get('plate') || '';

  const [form, setForm] = useState({
    plateNumber: initialPlate,
    pickup: '',
    drop: '',
    farePaid: '',
    meterFare: '',
    date: new Date().toISOString().slice(0, 16),
    notes: ''
  });
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setIsLoading(true);

    try {
      // Backend expects plateNumber, pickup, drop, farePaid, meterFare, notes
      // We pass the payload
      const payload = {
        ...form,
        farePaid: Number(form.farePaid),
        meterFare: form.meterFare ? Number(form.meterFare) : undefined,
        plateNumber: form.plateNumber.toUpperCase()
      };
      
      await createRide(payload);
      setStatus({ type: 'success', message: 'Your ride has been successfully logged. Thank you for contributing!' });
      
      // Reset form but keep date current
      setForm({
        plateNumber: '',
        pickup: '',
        drop: '',
        farePaid: '',
        meterFare: '',
        date: new Date().toISOString().slice(0, 16),
        notes: ''
      });
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to log ride. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <Car className="text-primary" size={32} />
          Log a Ride
        </h1>
        <p className="text-text-secondary">Help the community by sharing your ride details to track fair pricing and auto routes.</p>
      </div>

      {status.type === 'success' ? (
        <div className="bg-success/10 border border-success/20 rounded-2xl p-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
          <CheckCircle2 className="mx-auto text-success" size={48} />
          <h2 className="text-2xl font-bold text-success">Ride Logged!</h2>
          <p className="text-text-primary">{status.message}</p>
          <div className="pt-4 flex justify-center gap-4">
            <button
              onClick={() => setStatus({ type: '', message: '' })}
              className="px-6 py-2 bg-surface border border-border text-text-primary font-medium rounded-lg hover:bg-background transition-colors"
            >
              Log Another Ride
            </button>
            <button
              onClick={() => navigate('/history')}
              className="px-6 py-2 bg-primary text-surface font-medium rounded-lg hover:bg-primary-dark transition-colors"
            >
              View History
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          {status.type === 'error' && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-medium">
              {status.message}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-text-primary mb-1">Auto Registration Number *</label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  name="plateNumber"
                  value={form.plateNumber}
                  onChange={handleChange}
                  required
                  placeholder="MH 31 AB 1234"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none uppercase font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">Pickup Location *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  name="pickup"
                  value={form.pickup}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Sitabuldi"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">Drop Location *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  name="drop"
                  value={form.drop}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Dharampeth"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">Total Fare Paid (₹) *</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  type="number"
                  name="farePaid"
                  value={form.farePaid}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="Amount"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">Meter Fare (₹) (Optional)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  type="number"
                  name="meterFare"
                  value={form.meterFare}
                  onChange={handleChange}
                  min="0"
                  placeholder="Meter reading"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-text-primary mb-1">Date & Time *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  type="datetime-local"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-text-primary mb-1">Additional Notes (Optional)</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-text-secondary" size={18} />
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Any extra details about the ride..."
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark text-surface font-semibold text-lg py-3.5 px-6 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isLoading ? 'Logging Ride...' : 'Log Ride'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
