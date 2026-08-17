import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createReport } from '../api/endpoints';
import { FileWarning, Car, MessageSquare, AlertTriangle, CheckCircle2 } from 'lucide-react';

const REASON_OPTIONS = [
  'Overcharged',
  'Refused Meter',
  'Refused Short Trip',
  'Rude',
  'Safe Driving',
  'Used Meter',
];

export default function ReportsPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialPlate = searchParams.get('plate') || '';

  const [form, setForm] = useState({
    plateNumber: initialPlate,
    reason: '',
    description: ''
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
    
    if (!form.reason) {
      setStatus({ type: 'error', message: 'Please select a reason for your report.' });
      return;
    }
    
    setIsLoading(true);

    try {
      const payload = {
        ...form,
        plateNumber: form.plateNumber.toUpperCase()
      };
      
      await createReport(payload);
      setStatus({ type: 'success', message: 'Your report has been submitted successfully and is under review.' });
      
      setForm({
        plateNumber: '',
        reason: '',
        description: ''
      });
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to submit report. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <FileWarning className="text-error" size={32} />
          Report an Issue
        </h1>
        <p className="text-text-secondary">File a trusted community report for issues like overcharging or meter refusal.</p>
      </div>

      {status.type === 'success' ? (
        <div className="bg-success/10 border border-success/20 rounded-2xl p-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
          <CheckCircle2 className="mx-auto text-success" size={48} />
          <h2 className="text-2xl font-bold text-success">Report Submitted</h2>
          <p className="text-text-primary">{status.message}</p>
          <div className="pt-4 flex justify-center gap-4">
            <button
              onClick={() => setStatus({ type: '', message: '' })}
              className="px-6 py-2 bg-surface border border-border text-text-primary font-medium rounded-lg hover:bg-background transition-colors"
            >
              Submit Another Report
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
          
          {/* Notice Banner */}
          <div className="bg-info/10 border border-info/20 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="text-info shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-text-primary">
              Reports are used to identify patterns of behavior and improve safety for the community. Please ensure your report is accurate.
            </p>
          </div>

          {status.type === 'error' && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-medium">
              {status.message}
            </div>
          )}

          <div className="space-y-6">
            <div>
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
              <label className="block text-sm font-semibold text-text-primary mb-3">Issue Type *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {REASON_OPTIONS.map((reason) => (
                  <label 
                    key={reason}
                    className={`
                      flex items-center p-4 border rounded-xl cursor-pointer transition-all
                      ${form.reason === reason 
                        ? 'bg-primary/5 border-primary ring-1 ring-primary' 
                        : 'bg-background border-border hover:border-primary/50'}
                    `}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason}
                      checked={form.reason === reason}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex-1 text-sm font-medium text-text-primary text-center">
                      {reason}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">Additional Details (Optional)</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 text-text-secondary" size={18} />
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="Please provide any additional context..."
                  rows={4}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                />
              </div>
              <div className="text-right mt-1">
                <span className={`text-xs ${form.description.length >= 100 ? 'text-error font-medium' : 'text-text-secondary'}`}>
                  {form.description.length}/100
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <button
              type="submit"
              disabled={isLoading || !form.plateNumber || !form.reason}
              className="w-full bg-error hover:bg-error/90 text-surface font-semibold text-lg py-3.5 px-6 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isLoading ? 'Submitting Report...' : 'Submit Report'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
