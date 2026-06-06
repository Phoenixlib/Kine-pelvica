import React, { useRef, useEffect, useLayoutEffect, useCallback } from 'react';

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

// Polyfill React object itself so any direct named import from 'react' in node_modules resolves correctly
if (React && typeof (React as any).useEffectEvent === 'undefined') {
  try {
    Object.defineProperty(React, 'useEffectEvent', {
      value: useEffectEvent,
      writable: true,
      configurable: true
    });
  } catch (e) {
    try {
      (React as any).useEffectEvent = useEffectEvent;
    } catch (err) {
      console.warn("Could not polyfill React.useEffectEvent:", err);
    }
  }
}

