export interface DebouncedFunction<T extends (...args: never[]) => void> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
}

/**
 * Leading-free trailing debounce utility with explicit `.cancel()` and `.flush()`
 * controls for high-frequency map zoom, pan, and point-sampling events.
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delayMs: number
): DebouncedFunction<T> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      const invokeArgs = lastArgs;
      lastArgs = null;
      if (invokeArgs) {
        fn(...invokeArgs);
      }
    }, Math.max(0, delayMs));
  }) as DebouncedFunction<T>;

  debounced.cancel = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    lastArgs = null;
  };

  debounced.flush = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    const invokeArgs = lastArgs;
    lastArgs = null;
    if (invokeArgs) {
      fn(...invokeArgs);
    }
  };

  return debounced;
}
