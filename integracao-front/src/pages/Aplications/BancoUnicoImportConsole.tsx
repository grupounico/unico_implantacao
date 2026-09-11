import {
  AlertTriangle,
  ArrowDown,
  ChevronDown,
  Copy,
  Info,
  Search,
  SquareTerminal,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { BancoUnicoImportEvent } from '../../services/bancoUnicoImports.service';

type LogLevel = 'info' | 'warning' | 'error';

const LEVEL_FILTERS: Array<{ value: 'all' | LogLevel; label: string }> = [
  { value: 'all', label: 'Tudo' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Atencao' },
  { value: 'error', label: 'Erro' },
];

const LEVEL_META: Record<LogLevel, { icon: typeof Info; text: string }> = {
  info: { icon: Info, text: 'text-zinc-400' },
  warning: { icon: AlertTriangle, text: 'text-amber-400' },
  error: { icon: XCircle, text: 'text-rose-400' },
};

function normalizeLevel(level: string): LogLevel {
  if (level === 'warning' || level === 'error') return level;
  return 'info';
}

export default function BancoUnicoImportConsole({
  jobId,
  events,
  streamConnected,
  defaultOpen = false,
}: {
  jobId: number;
  events: BancoUnicoImportEvent[];
  streamConnected: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [logLevelFilter, setLogLevelFilter] = useState<'all' | LogLevel>('all');
  const [logSearch, setLogSearch] = useState('');
  const [logAutoScroll, setLogAutoScroll] = useState(true);
  const logScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLogSearch('');
    setLogLevelFilter('all');
    setLogAutoScroll(true);
  }, [jobId]);

  const logLevelCounts = useMemo(() => {
    const counts: Record<LogLevel, number> = { info: 0, warning: 0, error: 0 };
    for (const event of events) {
      counts[normalizeLevel(event.level)] += 1;
    }
    return counts;
  }, [events]);

  const filteredEvents = useMemo(() => {
    const query = logSearch.trim().toLowerCase();
    return events.filter((event) => {
      if (event.jobId !== jobId) {
        return false;
      }
      if (logLevelFilter !== 'all' && normalizeLevel(event.level) !== logLevelFilter) {
        return false;
      }
      if (query && !event.message.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [events, jobId, logLevelFilter, logSearch]);

  useEffect(() => {
    if (!logAutoScroll) {
      return;
    }

    const el = logScrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [filteredEvents, logAutoScroll]);

  function handleLogScroll() {
    const el = logScrollRef.current;
    if (!el) {
      return;
    }

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setLogAutoScroll(distanceFromBottom < 48);
  }

  function jumpToLatestLog() {
    setLogAutoScroll(true);
    const el = logScrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }

  function handleCopyLogs() {
    const text = filteredEvents
      .map((event) => `[${new Date(event.createdAt).toLocaleTimeString('pt-BR')}] ${event.message}`)
      .join('\n');
    void navigator.clipboard.writeText(text);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="import-console-panel"
        className="flex w-full flex-wrap items-center justify-between gap-3 bg-gray-900 px-5 py-3.5 text-left transition-colors hover:bg-gray-800/70"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <SquareTerminal className="h-4 w-4 shrink-0 text-gray-400" />
          <h3 className="text-sm font-semibold text-white">Console da importação</h3>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-700 bg-gray-950 px-2 py-0.5 text-[10px] font-medium text-gray-300">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                streamConnected ? 'bg-emerald-400 motion-safe:animate-pulse' : 'bg-amber-400'
              }`}
            />
            {streamConnected ? 'ao vivo' : 'reconectando'}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {!open ? (
            <div className="flex items-center gap-2.5 text-[11px] text-gray-400">
              <span className="flex items-center gap-1"><Info className="h-3 w-3" />{logLevelCounts.info}</span>
              <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="h-3 w-3" />{logLevelCounts.warning}</span>
              <span className="flex items-center gap-1 text-rose-400"><XCircle className="h-3 w-3" />{logLevelCounts.error}</span>
            </div>
          ) : null}
          <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open ? (
        <div id="import-console-panel">
          <div className="flex flex-wrap items-center gap-2 border-t border-gray-800 bg-black/20 px-5 py-2.5">
            {LEVEL_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setLogLevelFilter(filter.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  logLevelFilter === filter.value
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-500 hover:text-gray-200'
                }`}
              >
                {filter.label}
                {filter.value !== 'all' ? (
                  <span className="ml-1.5 tabular-nums text-gray-500">
                    {logLevelCounts[filter.value]}
                  </span>
                ) : null}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                <input
                  value={logSearch}
                  onChange={(event) => setLogSearch(event.target.value)}
                  placeholder="Filtrar mensagens..."
                  className="w-44 rounded-lg border border-gray-700 bg-gray-950 py-1.5 pl-8 pr-2 text-xs text-gray-100 outline-none transition-colors placeholder:text-gray-500 focus:border-gray-500 sm:w-56"
                />
              </div>
              <button
                onClick={handleCopyLogs}
                disabled={filteredEvents.length === 0}
                title="Copiar linhas visiveis"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-700 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-30"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div
              ref={logScrollRef}
              onScroll={handleLogScroll}
              className="custom-scrollbar h-[420px] overflow-y-auto bg-[#050816] p-5 font-mono text-[13px] leading-relaxed text-gray-200"
            >
              {filteredEvents.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-500">
                  {events.length === 0 ? 'Sem eventos carregados.' : 'Nenhum evento corresponde ao filtro.'}
                </div>
              ) : (
                filteredEvents.map((event) => {
                  const level = normalizeLevel(event.level);
                  const Icon = LEVEL_META[level].icon;
                  return (
                    <div key={event.id} className="mb-1.5 flex items-start gap-2 whitespace-pre-wrap break-words">
                      <span className="select-none text-gray-600">$</span>
                      <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${LEVEL_META[level].text}`} />
                      <span className="shrink-0 text-gray-500 tabular-nums">
                        {new Date(event.createdAt).toLocaleTimeString('pt-BR')}
                      </span>
                      <span className={LEVEL_META[level].text}>{event.message}</span>
                    </div>
                  );
                })
              )}
            </div>

            {!logAutoScroll ? (
              <button
                onClick={jumpToLatestLog}
                className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs font-medium text-gray-100 shadow-lg transition-colors hover:bg-gray-800"
              >
                <ArrowDown className="h-3 w-3" /> Ir para o fim
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
