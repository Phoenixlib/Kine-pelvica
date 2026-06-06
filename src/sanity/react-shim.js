// @ts-nocheck
import React from 'next/dist/compiled/react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

export const useEffectEvent = (callback) => {
  const ref = React.useRef(callback);
  useIsomorphicLayoutEffect(() => {
    ref.current = callback;
  });
  return React.useCallback((...args) => {
    return ref.current(...args);
  }, []);
};

// Re-export all named exports from the original React
export * from 'next/dist/compiled/react';

// Re-export the default export of React
export default React;
