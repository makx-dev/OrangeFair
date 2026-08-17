import { useEffect, useState } from 'react';
import { getLeaderboard } from '../api/endpoints';
import { Trophy, ShieldCheck, Car } from 'lucide-react';
import { useTranslation } from '../i18n/TranslationProvider';
import { Link } from 'react-router-dom';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await getLeaderboard();
        setLeaders(data.leaderboard);
      } catch (err) {
        setError('Unable to load Leaderboard. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Trophy size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
              {t('leaderboard.title')}
            </h1>
            <p className="text-text-secondary text-sm md:text-base max-w-2xl">
              OrangeFair verified community favorites, ranked by consistent fair pricing and safety.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-error/10 border border-error/20 rounded-xl p-8 text-center text-error">
          <Trophy className="mx-auto mb-3" size={32} />
          {error}
        </div>
      ) : leaders.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <Car size={32} className="mx-auto text-text-secondary/50 mb-3" />
          <p className="text-text-primary font-medium">Not enough data to form a leaderboard yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaders.map((driver) => (
            <Link 
              key={driver.plateNumber} 
              to={`/auto/${driver.plateNumber}`}
              className="block bg-surface border border-border rounded-xl p-5 md:p-6 shadow-sm transition-colors hover:border-primary/50"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${driver.rank === 1 ? 'bg-yellow-400/20 text-yellow-600 border border-yellow-400/30' : driver.rank === 2 ? 'bg-gray-300/20 text-gray-500 border border-gray-300/30' : driver.rank === 3 ? 'bg-orange-400/20 text-orange-600 border border-orange-400/30' : 'bg-background border border-border text-text-secondary'}`}>
                    #{driver.rank}
                  </div>
                  <div>
                    <div className="text-xl font-bold text-text-primary mb-1">
                      {driver.plateNumber}
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-success uppercase tracking-wider">
                      <ShieldCheck size={14} /> {driver.trustTier}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 md:justify-end text-sm">
                  <div className="text-left md:text-right">
                    <p className="font-bold text-text-primary text-lg">{driver.nearExpectedFarePct}%</p>
                    <p className="text-text-secondary">{t('leaderboard.nearExpected')}</p>
                  </div>
                  <div className="h-10 w-px bg-border hidden md:block"></div>
                  <div className="text-left md:text-right">
                    <p className="font-bold text-text-primary text-lg">{driver.verifiedRides}</p>
                    <p className="text-text-secondary">{t('leaderboard.verifiedRides')}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
