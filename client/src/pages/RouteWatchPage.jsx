import { useEffect, useState } from 'react';
import { getRouteWatch } from '../api/endpoints';
import { Activity, MapPin, AlertTriangle, ArrowRight } from 'lucide-react';
import { useTranslation } from '../i18n/TranslationProvider';

export default function RouteWatchPage() {
  const [hotspots, setHotspots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const fetchRouteWatch = async () => {
      try {
        const { data } = await getRouteWatch();
        setHotspots(data.hotspots);
      } catch (err) {
        setError(t('routeWatch.notEnoughData') || 'Unable to load Route Watch. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRouteWatch();
  }, [t]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
              {t('routeWatch.title')}
            </h1>
            <p className="text-text-secondary text-sm md:text-base max-w-2xl">
              {t('routeWatch.subtitle')}
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
          <AlertTriangle className="mx-auto mb-3" size={32} />
          {error}
        </div>
      ) : hotspots.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <MapPin size={32} className="mx-auto text-text-secondary/50 mb-3" />
          <p className="text-text-primary font-medium">{t('routeWatch.notEnoughData')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {hotspots.map((route, index) => (
            <div key={index} className="bg-surface border border-border rounded-xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-primary/30">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center font-bold text-text-secondary shrink-0">
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-lg font-bold text-text-primary flex-wrap">
                    <span>{route.pickup}</span>
                    <ArrowRight size={16} className="text-text-secondary" />
                    <span>{route.drop}</span>
                  </div>
                  <div className="text-sm text-text-secondary mt-1">
                    {route.totalRides} {t('routeWatch.rides')}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-start md:items-end bg-error/5 border border-error/10 px-4 py-3 rounded-lg">
                <div className="text-xl font-bold text-error flex items-center gap-1">
                  +{route.deviationPct}%
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-error/80">
                  {t('routeWatch.aboveExpected')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
