import { useEffect, useRef } from 'react';

export function useClickOutside<T extends HTMLElement>(
  onClickOutside: () => void,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target;

      if (ref.current && target instanceof Node && !ref.current.contains(target)) {
        onClickOutside();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClickOutside]);

  return ref;
}
