import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';

/**
 * Enhanced memoization utilities for React components
 */

// Deep comparison function for complex objects
export const deepEqual = (a, b) => {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (let key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
};

// Smart memo wrapper that uses deep comparison when needed
export const smartMemo = (Component, compareProps = null) => {
  return memo(Component, compareProps || ((prevProps, nextProps) => {
    // Only use deep comparison for objects/arrays
    const keys = Object.keys(prevProps);
    for (let key of keys) {
      const prev = prevProps[key];
      const next = nextProps[key];
      
      if (typeof prev === 'object' && prev !== null) {
        if (!deepEqual(prev, next)) return false;
      } else if (prev !== next) {
        return false;
      }
    }
    return true;
  }));
};

// Optimized callback hook with dependency validation
export const useOptimizedCallback = (callback, deps = []) => {
  // Validate dependencies to prevent unnecessary re-renders
  const memoizedDeps = useMemo(() => {
    return deps.filter(dep => dep !== undefined && dep !== null);
  }, deps);
  
  return useCallback(callback, memoizedDeps);
};

// Memoized value with size limit to prevent memory leaks
const memoCache = new Map();
const MAX_CACHE_SIZE = 100;

export const useMemoizedValue = (factory, deps = []) => {
  const key = JSON.stringify(deps);
  
  return useMemo(() => {
    if (memoCache.has(key)) {
      return memoCache.get(key);
    }
    
    const value = factory();
    
    // Implement LRU cache
    if (memoCache.size >= MAX_CACHE_SIZE) {
      const firstKey = memoCache.keys().next().value;
      memoCache.delete(firstKey);
    }
    
    memoCache.set(key, value);
    return value;
  }, deps);
};

// Debounced state hook
export const useDebouncedState = (initialValue, delay = 300) => {
  const [value, setValue] = React.useState(initialValue);
  const [debouncedValue, setDebouncedValue] = React.useState(initialValue);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return [debouncedValue, setValue];
};

// Virtual scrolling helper for large lists
export const useVirtualList = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItemCount, items.length);
  
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index,
      offsetY: (startIndex + index) * itemHeight
    }));
  }, [items, startIndex, endIndex, itemHeight]);
  
  return {
    visibleItems,
    totalHeight,
    scrollTop,
    setScrollTop
  };
};

// Lazy loading wrapper with error boundary
export const createLazyComponent = (importFunc, fallback = null) => {
  const LazyComponent = lazy(importFunc);
  
  return React.forwardRef((props, ref) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ));
};

// Image lazy loading hook
export const useLazyImage = (src, placeholder = null) => {
  const [imageSrc, setImageSrc] = React.useState(placeholder);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  
  React.useEffect(() => {
    if (!src) return;
    
    setLoading(true);
    setError(false);
    
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setLoading(false);
    };
    img.onerror = () => {
      setError(true);
      setLoading(false);
    };
    img.src = src;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);
  
  return { imageSrc, loading, error };
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
  const renderCount = React.useRef(0);
  const mountTime = React.useRef(performance.now());
  
  React.useEffect(() => {
    renderCount.current += 1;
  });
  
  React.useEffect(() => {
    const mountDuration = performance.now() - mountTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      
    }
    
    return () => {
      if (process.env.NODE_ENV === 'development') {
      }
    };
  }, [componentName]);
  
  return {
    renderCount: renderCount.current,
    getMountDuration: () => performance.now() - mountTime.current
  };
};

// Throttled event handler
export const useThrottledCallback = (callback, delay = 100) => {
  const lastRan = React.useRef(Date.now());
  
  return useCallback((...args) => {
    if (Date.now() - lastRan.current >= delay) {
      callback(...args);
      lastRan.current = Date.now();
    }
  }, [callback, delay]);
};

// Component size observer hook
export const useComponentSize = () => {
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const ref = React.useRef(null);
  
  React.useEffect(() => {
    if (!ref.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setSize({ width, height });
      }
    });
    
    resizeObserver.observe(ref.current);
    
    return () => resizeObserver.disconnect();
  }, []);
  
  return [ref, size];
};

// Batch state updates to prevent multiple re-renders
export const useBatchedState = (initialState) => {
  const [state, setState] = React.useState(initialState);
  const batchedUpdates = React.useRef([]);
  
  const batchUpdate = useCallback((updates) => {
    batchedUpdates.current.push(updates);
    
    // Process all batched updates in next tick
    Promise.resolve().then(() => {
      if (batchedUpdates.current.length > 0) {
        const allUpdates = batchedUpdates.current.reduce((acc, update) => ({
          ...acc,
          ...(typeof update === 'function' ? update(acc) : update)
        }), state);
        
        setState(allUpdates);
        batchedUpdates.current = [];
      }
    });
  }, [state]);
  
  return [state, batchUpdate];
};

export default {
  smartMemo,
  useOptimizedCallback,
  useMemoizedValue,
  useDebouncedState,
  useVirtualList,
  createLazyComponent,
  useLazyImage,
  usePerformanceMonitor,
  useThrottledCallback,
  useComponentSize,
  useBatchedState
};
