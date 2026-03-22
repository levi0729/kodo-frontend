import { useEffect, useState } from 'react';
import { healthCheck } from '@/services/api';

export default function ServerStatusBanner() {
  const [reachable, setReachable] = useState(true);

  useEffect(() => {
    healthCheck().then(ok => setReachable(ok));
  }, []);

  if (reachable) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white px-4 py-2 text-sm text-center">
      A backend szerver nem elérhető. Indítsd el a szervert vagy ellenőrizd a hálózati beállításokat.
    </div>
  );
}
