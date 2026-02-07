'use client';

import { useState, useEffect } from 'react';

export function usePWAStandalone(): boolean {
     const [isStandalone, setIsStandalone] = useState(false);

     useEffect(() => {
          const checkStandalone = () => {
               // iOS Safari
               const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
               // Android / Desktop Chrome
               const mediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
               return iosStandalone || mediaStandalone;
          };

          setIsStandalone(checkStandalone());

          const mql = window.matchMedia('(display-mode: standalone)');
          const handleChange = (e: MediaQueryListEvent) => {
               setIsStandalone(e.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
          };

          mql.addEventListener('change', handleChange);
          return () => mql.removeEventListener('change', handleChange);
     }, []);

     return isStandalone;
}
