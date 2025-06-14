import { useRef, useEffect, useCallback } from "react";

export const useDebounce = (func: (...args: any[]) => void, delay: number) => {
  const timeoutRef = useRef<number | undefined>(undefined);
  const funcRef = useRef(func);

  // keep latest callback
  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  const debounced = useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        funcRef.current(...args);
      }, delay);
    },
    [delay]
  );

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debounced;
};
