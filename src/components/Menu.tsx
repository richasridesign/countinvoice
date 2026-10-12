import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from './Icon';

/**
 * A button that opens a list of actions. Focus moves into the menu on open;
 * Esc closes it and returns focus to the button; a click outside closes it.
 */
export function Menu({
  label,
  className,
  children,
}: {
  label: ReactNode;
  className: string;
  children: (close: (fn: () => void) => () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    wrap.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    function onClick(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div className="menu-wrap" ref={wrap}>
      <button
        ref={trigger}
        className={`menu-trigger ${className}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
        <Icon name="chevron" />
      </button>
      {open ? (
        <div className="menu" role="menu">
          {children(run)}
        </div>
      ) : null}
    </div>
  );
}
