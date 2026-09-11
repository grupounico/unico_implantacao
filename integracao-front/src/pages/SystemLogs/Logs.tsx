import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Calendar,
  User,
  Activity,
  Database,
  ChevronLeft,
  ChevronRight,
  History,
  Loader2,
  Globe,
} from 'lucide-react';
import { fetchLogs } from '../../services/logs.services.js'; // Ajuste o import se necessário

// Tipagem do Log
interface SystemLog {
  id: number;
  userName: string;
  action: string;
  target: string | null;
  createdAt: string;
}

export default function Logs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Paginação
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Função principal de busca
  // Usamos useCallback para garantir a estabilidade da função dentro do useEffect
  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLogs({
        page,
        limit: itemsPerPage,
        search,
        startDate: dateStart,
        endDate: dateEnd,
      });

      setLogs(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, dateStart, dateEnd]);

  // --- EFEITO 1: DEBOUNCE (Busca Automática) ---
  useEffect(() => {
    // Cria um temporizador. Se o usuário digitar, ele espera 600ms.
    const timer = setTimeout(() => {
      loadLogs();
    }, 600);

    // Se o usuário digitar de novo antes dos 600ms, o React limpa o timer anterior
    // e começa um novo. Isso evita chamadas excessivas ao backend.
    return () => clearTimeout(timer);
  }, [loadLogs]);

  // --- EFEITO 2: RESET DE PÁGINA ---
  // Se mudar o filtro de busca ou data, volta para a página 1
  useEffect(() => {
    setPage(1);
  }, [search, dateStart, dateEnd]);

  // Formatador de Data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <div className=" mx-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 h-screen overflow-x-hidden overflow-y-auto ">
      {/* Header */}
      <header className="px-2 pb-6  bg-card border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3 bg-background">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <History className="w-7 h-7 text-primary" />
            Logs do sistema
          </h1>
          <p className="text-muted-foreground opacity-80 text-sm mt-1">
            Logs do Sistema Auditoria de ações realizadas na plataforma.
          </p>
        </div>
      </header>
      {/* Barra de Filtros Automática */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-end">
        {/* Input de Busca com Loading Visual */}
        <div className="flex-1 w-full">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
            Pesquisar
          </label>
          <div className="relative">
            {loading ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            )}
            <input
              type="text"
              placeholder="Digite para buscar (usuário, instância...)"
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full md:w-auto">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
            De
          </label>
          <input
            type="date"
            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 text-slate-600"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
          />
        </div>

        <div className="w-full md:w-auto">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
            Até
          </label>
          <input
            type="date"
            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 text-slate-600"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
        {/* Overlay de carregamento sutil (opcional, se quiser bloquear a tabela enquanto busca) */}
        {loading && logs.length > 0 && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-start justify-center pt-20 backdrop-blur-[1px]">
            {/* O spinner já está no input, então aqui é só pra dar um efeito visual de "ocupado" */}
          </div>
        )}

        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Usuário</th>
                <th className="px-6 py-4 font-semibold">Ação</th>
                <th className="px-6 py-4 font-semibold">Banco / Instância</th>
                <th className="px-6 py-4 font-semibold text-right">
                  Data & Hora
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 overflow-auto">
              {logs.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Nenhum registro encontrado.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-700 font-medium flex items-center gap-2">
                      <div className="p-1.5 bg-gray-100 rounded-full text-gray-500">
                        <User className="w-4 h-4" />
                      </div>
                      {log.userName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Activity className="w-4 h-4 text-violet-400" />
                        {log.action}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.target ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium">
                          {log.target.startsWith('http') ? (
                            <Globe className="w-3 h-3" />
                          ) : (
                            <Database className="w-3 h-3" />
                          )}
                          {log.target}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 tabular-nums">
                      <div className="flex items-center justify-end gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(log.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between mt-auto">
          <span className="text-sm text-gray-500">
            Página <strong>{page}</strong> de <strong>{totalPages || 1}</strong>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
