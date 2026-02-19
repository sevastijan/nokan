import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface UseAutosaveProps {
     callback: () => Promise<void | boolean>;
     delay: number;
     shouldSave: boolean;
}

export const useAutosave = ({ callback, delay, shouldSave }: UseAutosaveProps) => {
     const { t } = useTranslation();
     const timerRef = useRef<NodeJS.Timeout | null>(null);
     const [isAutoSaving, setIsAutoSaving] = useState(false);

     useEffect(() => {
          if (!shouldSave) {
               if (timerRef.current) {
                    clearTimeout(timerRef.current);
                    timerRef.current = null;
               }
               return;
          }

          if (timerRef.current) {
               clearTimeout(timerRef.current);
          }

          timerRef.current = setTimeout(async () => {
               try {
                    setIsAutoSaving(true);
                    await callback();
                    toast.success(t('task.autoSaved'));
               } catch (err) {
                    console.error('Autosave failed:', err);
                    toast.error(t('task.autoSaveFailed'));
               } finally {
                    setIsAutoSaving(false);
                    timerRef.current = null;
               }
          }, delay);

          return () => {
               if (timerRef.current) {
                    clearTimeout(timerRef.current);
                    timerRef.current = null;
               }
          };
     }, [shouldSave, callback, delay, t]);

     return { isAutoSaving };
};
