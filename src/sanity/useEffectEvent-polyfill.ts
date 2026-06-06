import { useRef, useEffect, useLayoutEffect, useCallback } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const useEffectEvent = <T extends (...args: any[]) => any>(callback: T): T => {
  const ref = useRef<T>(callback);
  useIsomorphicLayoutEffect(() => {
    ref.current = callback;
  });
  return useCallback((...args: any[]) => {
    return ref.current(...args);
  }, []) as unknown as T;
};
