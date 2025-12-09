import { RefObject, useEffect } from 'react';

export function useOutsideClick(refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[], handler: (event: MouseEvent | TouchEvent) => void) {
     useEffect(() => {
          const listener = (event: MouseEvent | TouchEvent) => {
               const target = event.target as Node | null;

               if (!target) return;

               const refArray = Array.isArray(refs) ? refs : [refs];

               const isOutside = refArray.every((ref) => {
                    const el = ref.current;
                    return !el || !el.contains(target);
               });

               if (isOutside) {
                    handler(event);
               }
          };

          document.addEventListener('mousedown', listener);
          document.addEventListener('touchstart', listener);

          return () => {
               document.removeEventListener('mousedown', listener);
               document.removeEventListener('touchstart', listener);
          };
     }, [refs, handler]);
}
