import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { ArrowUp, LoaderCircle } from 'lucide-react';

const MAX_TEXTAREA_ROWS = 6;

type Props = {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  inputRef?: MutableRefObject<HTMLTextAreaElement | null>;
  onHeightChange?: (height: number) => void;
};

export default function MessageInput({
  value,
  disabled = false,
  onChange,
  onSubmit,
  inputRef,
  onHeightChange,
}: Props) {
  const internalTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isSubmitDisabled = disabled || !value.trim();

  function focusTextarea() {
    if (disabled) {
      return;
    }

    internalTextareaRef.current?.focus();
  }

  useEffect(() => {
    const textarea = internalTextareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = 'auto';

    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 28;
    const maxHeight = lineHeight * MAX_TEXTAREA_ROWS;
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !onHeightChange) {
      return;
    }

    const emitHeight = () => {
      onHeightChange(container.offsetHeight);
    };

    emitHeight();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', emitHeight);

      return () => {
        window.removeEventListener('resize', emitHeight);
      };
    }

    const observer = new ResizeObserver(() => {
      emitHeight();
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [onHeightChange, value]);

  function assignTextareaRef(element: HTMLTextAreaElement | null) {
    internalTextareaRef.current = element;

    if (inputRef) {
      inputRef.current = element;
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 left-1/2 z-20 flex w-[90%] max-w-3xl -translate-x-1/2 items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-colors focus-within:border-primary"
    >
      <div
        className="flex min-h-[48px] flex-1 cursor-text items-start rounded-md px-1.5 py-2"
        onClick={focusTextarea}
      >
        <textarea
          ref={assignTextareaRef}
          rows={1}
          wrap="soft"
          className="scrollbar-minimal block max-h-[168px] min-h-[28px] w-full resize-none overflow-x-hidden border-0 bg-transparent p-0 text-base font-normal leading-7 whitespace-pre-wrap text-foreground outline-0 [overflow-wrap:anywhere] disabled:cursor-not-allowed disabled:opacity-60"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onClick={focusTextarea}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Como posso ajudar voce hoje?"
        />
      </div>

      <button
        type="button"
        disabled={isSubmitDisabled}
        onClick={onSubmit}
        className="flex size-[40px] shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Enviar mensagem"
      >
        {disabled ? <LoaderCircle className="animate-spin" size={22} /> : <ArrowUp size={22} />}
      </button>
    </div>
  );
}
