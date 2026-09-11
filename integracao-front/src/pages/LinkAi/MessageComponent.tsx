import {
  Fragment,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Bot, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ChatAction, ChatTraceStep } from '../../services/linkAi.service';

type ChatRole = 'assistant' | 'user';

type Props = {
  role: ChatRole;
  content?: string;
  action?: ChatAction | null;
  actions?: ChatAction[];
  trace?: ChatTraceStep[];
  isThinking?: boolean;
  thinkingSteps?: string[];
  animate?: boolean;
  onContentProgress?: () => void;
};

type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; label: string; href: string };

function getTraceDotColor(status: ChatTraceStep['status']) {
  if (status === 'success') {
    return 'bg-primary';
  }

  if (status === 'error') {
    return 'bg-red-500';
  }

  return 'bg-foreground/35';
}

function tokenizeInlineMarkdown(content: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const pattern =
    /(\[([^\]]+)\]\((\/main\/[^)\s]+|https?:\/\/[^)\s]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        value: content.slice(lastIndex, match.index),
      });
    }

    if (match[2] && match[3]) {
      tokens.push({
        type: 'link',
        label: match[2],
        href: match[3],
      });
    } else if (match[5]) {
      tokens.push({
        type: 'code',
        value: match[5],
      });
    } else if (match[7]) {
      tokens.push({
        type: 'strong',
        value: match[7],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    tokens.push({
      type: 'text',
      value: content.slice(lastIndex),
    });
  }

  return tokens;
}

function renderInlineMarkdown(content: string, keyPrefix: string) {
  return tokenizeInlineMarkdown(content).map((token, index) => {
    const key = `${keyPrefix}-${index}`;

    if (token.type === 'strong') {
      return <strong key={key}>{token.value}</strong>;
    }

    if (token.type === 'code') {
      return (
        <code
          key={key}
          className="rounded bg-foreground/6 px-1.5 py-0.5 font-mono text-[0.95em]"
        >
          {token.value}
        </code>
      );
    }

    if (token.type === 'link') {
      return token.href.startsWith('/main/') ? (
        <Link
          key={key}
          to={token.href}
          className="font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-opacity hover:opacity-80"
        >
          {token.label}
        </Link>
      ) : (
        <a
          key={key}
          href={token.href}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-opacity hover:opacity-80"
        >
          {token.label}
        </a>
      );
    }

    return <Fragment key={key}>{token.value}</Fragment>;
  });
}

function renderMarkdown(content: string) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const nodes: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      index += 1;
      continue;
    }

    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 6);
      const headingText = headingMatch[2];
      const headingClassByLevel: Record<number, string> = {
        1: 'text-2xl font-semibold',
        2: 'text-xl font-semibold',
        3: 'text-lg font-semibold',
        4: 'text-base font-semibold',
        5: 'text-sm font-semibold',
        6: 'text-sm font-semibold uppercase tracking-wide',
      };
      const headingTagByLevel = {
        1: 'h1',
        2: 'h2',
        3: 'h3',
        4: 'h4',
        5: 'h5',
        6: 'h6',
      } as const;

      const Tag = headingTagByLevel[level as keyof typeof headingTagByLevel];
      nodes.push(
        <Tag
          key={`heading-${index}`}
          className={`${headingClassByLevel[level]} mt-4 first:mt-0`}
        >
          {renderInlineMarkdown(headingText, `heading-${index}`)}
        </Tag>,
      );
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmedLine)) {
      const items: string[] = [];

      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''));
        index += 1;
      }

      nodes.push(
        <ul key={`ul-${index}`} className="mt-3 list-disc space-y-1 pl-5">
          {items.map((item, itemIndex) => (
            <li key={`ul-item-${index}-${itemIndex}`} className="leading-relaxed">
              {renderInlineMarkdown(item, `ul-${index}-${itemIndex}`)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmedLine)) {
      const items: string[] = [];

      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ''));
        index += 1;
      }

      nodes.push(
        <ol key={`ol-${index}`} className="mt-3 list-decimal space-y-1 pl-5">
          {items.map((item, itemIndex) => (
            <li key={`ol-item-${index}-${itemIndex}`} className="leading-relaxed">
              {renderInlineMarkdown(item, `ol-${index}-${itemIndex}`)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    const paragraphLines = [trimmedLine];
    index += 1;

    while (index < lines.length) {
      const nextTrimmedLine = lines[index].trim();

      if (
        !nextTrimmedLine ||
        /^(#{1,6})\s+/.test(nextTrimmedLine) ||
        /^[-*]\s+/.test(nextTrimmedLine) ||
        /^\d+\.\s+/.test(nextTrimmedLine)
      ) {
        break;
      }

      paragraphLines.push(nextTrimmedLine);
      index += 1;
    }

    nodes.push(
      <p key={`p-${index}`} className="mt-3 whitespace-pre-wrap leading-relaxed first:mt-0">
        {renderInlineMarkdown(paragraphLines.join(' '), `p-${index}`)}
      </p>,
    );
  }

  return nodes;
}

export default function MessageComponent({
  role,
  content = '',
  action = null,
  actions = [],
  trace = [],
  isThinking = false,
  thinkingSteps = [],
  animate = false,
  onContentProgress,
}: Props) {
  const isAi = role === 'assistant';
  const availableActions =
    actions.length > 0
      ? actions
      : action?.type === 'download' && action.url
        ? [action]
        : [];
  const [displayedContent, setDisplayedContent] = useState(content);
  const [isAnimating, setIsAnimating] = useState(false);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (isThinking) {
      return;
    }

    if (!isAi || !animate || !content.trim()) {
      setDisplayedContent(content);
      setIsAnimating(false);
      return;
    }

    if (hasAnimatedRef.current) {
      setDisplayedContent(content);
      setIsAnimating(false);
      return;
    }

    hasAnimatedRef.current = true;
    const tokens = content.split(/(\s+)/).filter(Boolean);

    setDisplayedContent('');
    setIsAnimating(true);

    let currentIndex = 0;

    const intervalId = window.setInterval(() => {
      currentIndex += 1;
      const nextValue = tokens.slice(0, currentIndex).join('');
      setDisplayedContent(nextValue);
      onContentProgress?.();

      if (currentIndex >= tokens.length) {
        window.clearInterval(intervalId);
        setDisplayedContent(content);
        setIsAnimating(false);
      }
    }, 28);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [animate, content, isAi, isThinking, onContentProgress]);

  useEffect(() => {
    if (!animate || isThinking) {
      setDisplayedContent(content);
    }
  }, [animate, content, isThinking]);

  if (isThinking) {
    return (
      <div className="flex w-full items-start gap-3 self-start">
        <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot size={15} />
        </span>

        <div className="min-w-0 pt-1.5">
          <div className="flex items-center gap-1.5">
            <span className="typing-dot size-1.5 rounded-full bg-foreground/40 [animation-delay:0ms]" />
            <span className="typing-dot size-1.5 rounded-full bg-foreground/40 [animation-delay:180ms]" />
            <span className="typing-dot size-1.5 rounded-full bg-foreground/40 [animation-delay:360ms]" />
          </div>

          {thinkingSteps.length ? (
            <p className="mt-2 text-xs text-foreground/45">{thinkingSteps[0]}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full items-start gap-3 ${isAi ? 'self-start' : 'flex-row-reverse self-end'}`}>
      <span
        className={`mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full ${
          isAi ? 'bg-primary/10 text-primary' : 'bg-foreground/8 text-foreground/60'
        }`}
      >
        {isAi ? <Bot size={15} /> : <User size={15} />}
      </span>

      <div
        className={`min-w-0 w-fit  ${
          isAi
            ? `text-foreground ${isAi ? 'link-ai-message-in max-w-[640px]' : ''}`
            : 'rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground max-w-[550px]'
        }`}
      >
        <div>
          {isAi && !isAnimating ? (
            <div className="break-words text-[15px] font-normal leading-relaxed">
              {renderMarkdown(displayedContent)}
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words text-[15px] font-normal leading-relaxed">
              {displayedContent}
              {isAi && isAnimating ? (
                <span className="ml-1 inline-block h-4 w-[2px] animate-pulse rounded-full bg-primary align-middle" />
              ) : null}
            </p>
          )}

          {isAi && !isAnimating && availableActions.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {availableActions.map((downloadAction, index) => (
                <a
                  key={`${downloadAction.url}-${index}`}
                  href={downloadAction.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {downloadAction.label || `Baixar arquivo ${index + 1}`}
                </a>
              ))}
            </div>
          ) : null}

          {isAi && !isAnimating && !!trace.length ? (
            <details className="mt-3 w-full max-w-[320px] rounded-lg border border-border">
              <summary className="cursor-pointer list-none px-3.5 py-2.5 text-left text-xs font-medium text-foreground/50">
                Ver etapas executadas
              </summary>

              <div className="border-t border-border px-3.5 py-2.5">
                <div className="space-y-2">
                  {trace.map((step) => (
                    <div
                      key={step.id}
                      className="flex items-start gap-2.5 text-xs text-foreground/70"
                    >
                      <span
                        className={`mt-1 size-1.5 shrink-0 rounded-full ${getTraceDotColor(step.status)}`}
                      />
                      <span>{step.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </div>
  );
}
