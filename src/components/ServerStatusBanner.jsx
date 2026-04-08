import { useEffect, useState } from 'react';
import { healthCheck } from '@/services/api';
import { useTheme } from '@/context/ThemeContext';

export default function ServerStatusBanner() {
  const [reachable, setReachable] = useState(true);
  const { t } = useTheme();

  useEffect(() => {
    healthCheck().then(ok => setReachable(ok));
  }, []);

  if (reachable) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white px-4 py-2 text-sm text-center">
      {t.serverBanner}
    </div>
  );
}
