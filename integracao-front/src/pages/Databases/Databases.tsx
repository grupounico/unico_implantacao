import { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Database,
  HardDrive,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  Plus,
  Search,
  Server,
} from 'lucide-react';

import { Toast } from '../ExtensionManager/components/SharedUI';
import {
  createDatabase,
  getDatabases,
  type DatabaseItem,
  type PaginatedResponse,
} from '../../services/database.service';
import { useRequireAuth } from '../../hooks/useAuthRedirect';
import { extractErrorMessage } from '../../utils/error';
import { CreateDatabaseModal } from './components/CreateDatabaseModal';
import { DatabaseStatusModal } from './components/DatabaseStatusModal';
import { TestDatabaseConnectionModal } from './components/TestDatabaseConnectionModal';

type DatabaseModal = 'create' | 'status' | 'test-connection' | null;

export default function Databases() {
  const [databases, setDatabases] = useState<DatabaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [activeModal, setActiveModal] = useState<DatabaseModal>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseItem | null>(null);
  const [newDbName, setNewDbName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useRequireAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const limit = viewMode === 'list' ? 10 : 9;
      const response: PaginatedResponse = await getDatabases(page, limit, searchTerm);
      setDatabases(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.totalItems);
    } catch (error) {
      console.error(error);
      setToastMessage(extractErrorMessage(error, 'Erro ao carregar bancos.'));
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, viewMode]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleOpenStatusModal = (database: DatabaseItem) => {
    setSelectedDatabase(database);
    setActiveModal('status');
  };

  const handleCloseStatusModal = () => {
    setActiveModal(null);
    setSelectedDatabase(null);
  };

  const handleCreateDatabase = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!newDbName.trim()) {
      return;
    }

    setIsCreating(true);

    try {
      await createDatabase(newDbName);
      setActiveModal(null);
      setNewDbName('');
      setToastMessage('Banco criado com sucesso.');
      void fetchData();
    } catch (error) {
      console.error(error);
      setToastMessage(extractErrorMessage(error, 'Erro ao criar banco.'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex h-screen max-h-screen flex-col overflow-hidden bg-slate-50 font-sans text-slate-800">
      <header className="sticky top-0 z-10 flex shrink-0 flex-col justify-between gap-4 border-b border-gray-200 bg-white px-8 py-6 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Database className="h-7 w-7 text-blue-600" />
            Gerenciador de Bancos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Visualize, crie e gerencie as bases de dados do sistema.
          </p>
        </div>

        <div className="flex w-full items-center gap-3 md:w-auto">
          <div className="relative w-full md:w-64 lg:w-80">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-3 transition duration-150 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 sm:text-sm placeholder:text-gray-400"
              placeholder="Buscar database..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <div className="flex items-center rounded-lg border border-gray-200 bg-gray-100 p-1">
            <button
              onClick={() => {
                setViewMode('grid');
                setPage(1);
              }}
              className={`rounded-md p-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                setViewMode('list');
                setPage(1);
              }}
              className={`rounded-md p-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <ListIcon className="h-5 w-5" />
            </button>
          </div>

          <button
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
            onClick={() => setActiveModal('test-connection')}
          >
            <Server className="h-5 w-5" />
            <span className="hidden sm:inline">Testar conexão</span>
          </button>

          <button
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            onClick={() => setActiveModal('create')}
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Novo Banco</span>
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <main className="custom-scrollbar flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="animate-in fade-in flex h-full flex-col items-center justify-center text-slate-400">
              <Loader2 className="mb-3 h-10 w-10 animate-spin text-blue-500" />
              <p>Carregando databases...</p>
            </div>
          ) : databases.length > 0 ? (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-3 pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {databases.map((db, index) => (
                    <div
                      key={index}
                      className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 animate-in fade-in zoom-in-95 hover:border-blue-300 hover:shadow-lg"
                    >
                      <div className="mb-4 flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 transition-colors group-hover:bg-blue-100">
                          <Server className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3
                            className="truncate text-lg font-bold text-slate-900"
                            title={db.name}
                          >
                            {db.name}
                          </h3>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                            </span>
                            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Online
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1.5" title="Tamanho em disco">
                          <HardDrive className="h-4 w-4" />
                          {db.size || 'N/A'}
                        </div>
                        <button
                          className="font-medium text-blue-600 opacity-0 transition-opacity hover:underline group-hover:opacity-100"
                          onClick={() => handleOpenStatusModal(db)}
                        >
                          Gerenciar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <th className="px-6 py-4">Nome do Banco</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Tamanho</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {databases.map((db, index) => (
                        <tr
                          key={index}
                          className="group transition-colors hover:bg-blue-50/50"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                <Database className="h-5 w-5" />
                              </div>
                              <span className="font-medium text-slate-700">
                                {db.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              <span className="rounded-full bg-green-50 px-2 py-0.5 text-sm font-medium text-green-600">
                                Online
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <HardDrive className="h-4 w-4 text-gray-400" />
                              {db.size || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              className="rounded px-3 py-1 text-sm font-medium text-blue-600 transition-all hover:bg-blue-50 hover:text-blue-800 hover:underline"
                              onClick={() => handleOpenStatusModal(db)}
                            >
                              Gerenciar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-60">
              <div className="mb-4 rounded-full bg-gray-100 p-4">
                <Database className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">
                Nenhum banco encontrado
              </h3>
              <p className="mt-1 text-gray-500">
                Tente buscar por outro termo ou crie um novo banco.
              </p>
            </div>
          )}
        </main>

        <div className="z-20 flex shrink-0 items-center justify-between border-t border-gray-200 bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <span className="hidden text-sm text-gray-500 sm:inline">
            Mostrando{' '}
            <span className="font-medium text-slate-900">{databases.length}</span> de{' '}
            <span className="font-medium text-slate-900">{totalItems}</span> resultados
          </span>

          <div className="flex w-full items-center justify-center gap-2 sm:w-auto sm:justify-end">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-300 p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <span className="min-w-[100px] rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-center text-sm font-medium text-gray-700">
              Página {page} de {totalPages || 1}
            </span>

            <button
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page === totalPages || totalPages === 0}
              className="rounded-lg border border-gray-300 p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {activeModal === 'create' ? (
        <CreateDatabaseModal
          value={newDbName}
          isSubmitting={isCreating}
          onChange={setNewDbName}
          onClose={() => {
            setActiveModal(null);
            setNewDbName('');
          }}
          onSubmit={(event) => {
            void handleCreateDatabase(event);
          }}
        />
      ) : null}

      {activeModal === 'test-connection' ? (
        <TestDatabaseConnectionModal onClose={() => setActiveModal(null)} />
      ) : null}

      {activeModal === 'status' && selectedDatabase ? (
        <DatabaseStatusModal
          databaseName={selectedDatabase.name}
          onClose={handleCloseStatusModal}
        />
      ) : null}

      {toastMessage ? (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      ) : null}
    </div>
  );
}
