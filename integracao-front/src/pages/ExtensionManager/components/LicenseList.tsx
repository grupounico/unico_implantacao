import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Copy,
  Database,
  Filter,
  Globe,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  Monitor,
  MonitorX,
  Search,
  Server,
  Shield,
  Trash2,
  Unplug,
} from 'lucide-react';
import { type LicenseData } from '../../../services/extension.service';
import { ToggleSwitch } from './SharedUI';

export type LicenseBulkAction = 'activate' | 'deactivate' | 'unbind' | 'delete';

interface LicenseListProps {
  licenses: LicenseData[];
  loading: boolean;
  onToggle: (license: LicenseData) => void;
  onDelete: (key: string) => void;
  onUnbind: (license: LicenseData) => void;
  onCopy: (text: string) => void;
  onBulkAction: (action: LicenseBulkAction, licenses: LicenseData[], scopeLabel: string) => void;
}

type InstanceSummary = {
  instanceKey: string;
  instanceUrl: string;
  clientName: string;
  total: number;
  active: number;
  bound: number;
  latestCreatedAt: string;
};

const NO_INSTANCE_KEY = '__NO_INSTANCE__';

const safeText = (value?: string | null) => value?.trim() ?? '';
const lower = (value?: string | null) => safeText(value).toLowerCase();
const getInstanceKey = (license: LicenseData) =>
  safeText(license.configs?.instancias?.instance_url) || NO_INSTANCE_KEY;
const getInstanceUrl = (instanceKey: string) =>
  instanceKey === NO_INSTANCE_KEY ? 'Sem instancia' : instanceKey;

function formatDate(value?: string) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed);
}

function getLicenseTargets(action: LicenseBulkAction, source: LicenseData[]) {
  if (action === 'activate') return source.filter((l) => !l.is_active);
  if (action === 'deactivate') return source.filter((l) => !!l.is_active);
  if (action === 'unbind') return source.filter((l) => !!l.activated_machine_id);
  return source;
}

function ActionButton({
  label,
  count,
  onClick,
  disabled,
  tone = 'default',
}: {
  label: string;
  count: number;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-red-200 text-red-700 hover:bg-red-50 disabled:text-red-300'
      : 'border-slate-200 text-slate-700 hover:bg-slate-50 disabled:text-slate-400';

  return (
    <button
      onClick={onClick}
      disabled={disabled || count === 0}
      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${toneClass}`}
    >
      {label} ({count})
    </button>
  );
}

export function LicenseList({
  licenses,
  loading,
  onToggle,
  onDelete,
  onUnbind,
  onCopy,
  onBulkAction,
}: LicenseListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedInstanceKey, setSelectedInstanceKey] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const instanceSummaries = useMemo(() => {
    const map = new Map<string, InstanceSummary>();

    for (const license of licenses) {
      const instanceKey = getInstanceKey(license);
      const current = map.get(instanceKey);
      const createdAt = safeText(license.created_at);
      const clientName =
        safeText(license.configs?.instancias?.client_name) || getInstanceUrl(instanceKey);

      if (!current) {
        map.set(instanceKey, {
          instanceKey,
          instanceUrl: getInstanceUrl(instanceKey),
          clientName,
          total: 1,
          active: license.is_active ? 1 : 0,
          bound: license.activated_machine_id ? 1 : 0,
          latestCreatedAt: createdAt,
        });
        continue;
      }

      current.total += 1;
      if (license.is_active) current.active += 1;
      if (license.activated_machine_id) current.bound += 1;

      const currentTime = current.latestCreatedAt
        ? new Date(current.latestCreatedAt).getTime()
        : Number.NEGATIVE_INFINITY;
      const nextTime = createdAt ? new Date(createdAt).getTime() : Number.NEGATIVE_INFINITY;
      if (nextTime > currentTime) current.latestCreatedAt = createdAt;
    }

    return Array.from(map.values()).sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [licenses]);

  const filteredInstances = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return instanceSummaries;

    return instanceSummaries.filter(
      (item) => lower(item.clientName).includes(term) || lower(item.instanceUrl).includes(term),
    );
  }, [instanceSummaries, searchTerm]);

  const baseLicenses = useMemo(() => {
    if (!selectedInstanceKey) return licenses;
    return licenses.filter((license) => getInstanceKey(license) === selectedInstanceKey);
  }, [licenses, selectedInstanceKey]);

  const filteredLicenses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let result = baseLicenses;

    if (term) {
      result = result.filter((license) => {
        const haystack = [
          license.license_key,
          safeText(license.configs?.instancias?.client_name),
          safeText(license.configs?.instancias?.instance_url),
          safeText(license.configs?.config_name),
          safeText(license.configs?.config_data?.dbName),
          safeText(license.activated_machine_id),
        ]
          .join(' ')
          .toLowerCase();

        return haystack.includes(term);
      });
    }

    if (statusFilter !== 'all') {
      const shouldBeActive = statusFilter === 'active';
      result = result.filter((license) => !!license.is_active === shouldBeActive);
    }

    return result;
  }, [baseLicenses, searchTerm, statusFilter]);

  useEffect(() => {
    setSelectedKeys(new Set());
  }, [selectedInstanceKey]);

  useEffect(() => {
    const validKeys = new Set(baseLicenses.map((license) => license.license_key));
    setSelectedKeys((previous) => {
      const next = new Set<string>();
      let changed = false;

      for (const key of previous) {
        if (validKeys.has(key)) {
          next.add(key);
        } else {
          changed = true;
        }
      }

      return changed ? next : previous;
    });
  }, [baseLicenses]);

  const selectedSummary = useMemo(() => {
    if (!selectedInstanceKey) return null;
    return instanceSummaries.find((item) => item.instanceKey === selectedInstanceKey) ?? null;
  }, [instanceSummaries, selectedInstanceKey]);

  const visibleKeys = filteredLicenses.map((license) => license.license_key);
  const allVisibleSelected =
    visibleKeys.length > 0 && visibleKeys.every((key) => selectedKeys.has(key));
  const selectedLicenses = baseLicenses.filter((license) => selectedKeys.has(license.license_key));

  const batchSource = selectedLicenses.length > 0 ? selectedLicenses : filteredLicenses;
  const batchScopeLabel =
    selectedLicenses.length > 0
      ? selectedSummary
        ? `na selecao de ${selectedSummary.clientName}`
        : 'na selecao'
      : selectedSummary
        ? `em massa para ${selectedSummary.clientName}`
        : 'em massa nas licencas visiveis';

  const toggleSelection = (licenseKey: string) => {
    setSelectedKeys((previous) => {
      const next = new Set(previous);
      if (next.has(licenseKey)) next.delete(licenseKey);
      else next.add(licenseKey);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedKeys((previous) => {
      const next = new Set(previous);

      if (allVisibleSelected) {
        for (const key of visibleKeys) next.delete(key);
        return next;
      }

      for (const key of visibleKeys) next.add(key);
      return next;
    });
  };

  const runAction = (action: LicenseBulkAction) => {
    const targets = getLicenseTargets(action, batchSource);
    onBulkAction(action, targets, batchScopeLabel);
  };

  return (
    <div className="space-y-6">
      {selectedSummary ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-start gap-3">
            <button
              onClick={() => {
                setSelectedInstanceKey(null);
                setSearchTerm('');
                setSelectedKeys(new Set());
                setStatusFilter('all');
                setViewMode('list');
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para clientes
            </button>

            <div className="text-sm text-slate-700">
              <div className="font-semibold text-slate-900">
                Cliente: {selectedSummary.clientName}
              </div>
              <div className="text-xs text-slate-500">
                Instancia: {selectedSummary.instanceUrl} | Licencas: {baseLicenses.length}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={
                selectedInstanceKey
                  ? 'Buscar licenca por chave, config, banco ou maquina...'
                  : 'Buscar cliente, instancia, banco ou chave...'
              }
              className="w-full rounded-xl border border-gray-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            {selectedInstanceKey ? (
              <>
                <div className="relative min-w-[220px]">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <select
                    className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-200"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
                    }
                  >
                    <option value="all">Todos os status</option>
                    <option value="active">Apenas ativos</option>
                    <option value="inactive">Apenas inativos</option>
                  </select>
                </div>

                <div className="flex h-fit items-center rounded-lg border border-gray-200 bg-gray-100 p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded-md p-1.5 transition-all ${
                      viewMode === 'grid' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-400'
                    }`}
                  >
                    <LayoutGrid className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded-md p-1.5 transition-all ${
                      viewMode === 'list' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-400'
                    }`}
                  >
                    <ListIcon className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {!selectedInstanceKey ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-700">
            Clientes encontrados: {filteredInstances.length}
          </div>

          <div className="max-h-[38vh] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Instancia</th>
                  <th className="px-4 py-3 font-semibold">Licencas</th>
                  <th className="px-4 py-3 font-semibold">Ativas</th>
                  <th className="px-4 py-3 font-semibold">Em uso</th>
                  <th className="px-4 py-3 font-semibold">Ultima criacao</th>
                  <th className="px-4 py-3 text-right font-semibold">Acao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && filteredInstances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : null}

                {filteredInstances.map((item) => (
                  <tr key={item.instanceKey} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3 align-top font-semibold text-slate-800">
                      {item.clientName}
                    </td>
                    <td className="px-4 py-3 align-top text-slate-600">
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-xs text-blue-700">
                        <Server className="h-3.5 w-3.5" />
                        <span className="max-w-[380px] truncate">{item.instanceUrl}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-slate-700">{item.total}</td>
                    <td className="px-4 py-3 align-top text-slate-700">{item.active}</td>
                    <td className="px-4 py-3 align-top text-slate-700">{item.bound}</td>
                    <td className="px-4 py-3 align-top text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(item.latestCreatedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <button
                        onClick={() => {
                          setSelectedInstanceKey(item.instanceKey);
                          setSearchTerm('');
                          setSelectedKeys(new Set());
                          setStatusFilter('all');
                          setViewMode('list');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-white"
                      >
                        Entrar
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {selectedInstanceKey ? (
        <>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        

        <div className="flex flex-wrap gap-2">
          <ActionButton
            label="Ativar"
            count={getLicenseTargets('activate', batchSource).length}
            onClick={() => runAction('activate')}
            disabled={batchSource.length === 0}
          />
          <ActionButton
            label="Desativar"
            count={getLicenseTargets('deactivate', batchSource).length}
            onClick={() => runAction('deactivate')}
            disabled={batchSource.length === 0}
          />
          <ActionButton
            label="Desconectar"
            count={getLicenseTargets('unbind', batchSource).length}
            onClick={() => runAction('unbind')}
            disabled={batchSource.length === 0}
          />
          <ActionButton
            label="Excluir"
            count={batchSource.length}
            onClick={() => runAction('delete')}
            disabled={batchSource.length === 0}
            tone="danger"
          />
        </div>
      </div>

      {loading && licenses.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
        </div>
      ) : null}

      {filteredLicenses.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-20 text-center opacity-60">
          <Shield className="mx-auto mb-4 h-14 w-14 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-700">Nenhuma licenca encontrada</h3>
          <p className="text-sm text-slate-500">Ajuste os filtros para visualizar os registros.</p>
        </div>
      ) : null}

      {filteredLicenses.length > 0 && viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredLicenses.map((license) => {
            const isSelected = selectedKeys.has(license.license_key);
            return (
              <div
                key={license.license_key}
                className={`relative rounded-xl border p-5 shadow-sm transition-all ${
                  isSelected
                    ? 'border-violet-300 bg-violet-50/30'
                    : 'border-gray-200 bg-white hover:shadow-md'
                }`}
              >
                <div className="absolute left-4 top-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(license.license_key)}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                </div>

                <div className="absolute right-4 top-4">
                  <div
                    className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold ${
                      license.is_active
                        ? 'border-green-100 bg-green-50 text-green-700'
                        : 'border-red-100 bg-red-50 text-red-700'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        license.is_active ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    {license.is_active ? 'ATIVO' : 'INATIVO'}
                  </div>
                </div>

                <div className="mb-4 mt-6 flex items-center gap-3 pr-20">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-600">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="truncate font-bold text-slate-900">
                      {license.configs?.instancias?.client_name ?? 'Cliente'}
                    </h3>
                    <p className="truncate text-xs text-slate-500">
                      {license.configs?.config_name ?? 'Config sem nome'}
                    </p>
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2 text-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Chave
                    </span>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs tracking-widest text-slate-600">
                        ••••••••
                      </code>
                      <button
                        onClick={() => onCopy(license.license_key)}
                        className="rounded p-1 text-violet-600 transition-colors hover:bg-violet-100"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-xs text-slate-600">
                    <div
                      className="flex items-center gap-2 truncate"
                      title={license.configs?.instancias?.instance_url ?? ''}
                    >
                      <Globe className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{license.configs?.instancias?.instance_url ?? '-'}</span>
                    </div>
                    <div
                      className="flex items-center gap-2 truncate"
                      title={license.configs?.config_data?.dbName ?? ''}
                    >
                      <Database className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{license.configs?.config_data?.dbName ?? '-'}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      {license.activated_machine_id ? (
                        <div
                          className="flex items-center gap-2 text-slate-500"
                          title={`ID Maquina: ${license.activated_machine_id}`}
                        >
                          <Monitor className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                          <span className="truncate">Em uso</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                          <MonitorX className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Disponivel</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2">
                    <ToggleSwitch checked={!!license.is_active} onClick={() => onToggle(license)} />
                    <span className="text-xs font-medium text-slate-400">
                      {license.is_active ? 'Ativada' : 'Desativada'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {license.activated_machine_id ? (
                      <button
                        onClick={() => onUnbind(license)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-orange-50 hover:text-orange-600"
                        title="Desconectar maquina"
                      >
                        <Unplug className="h-4 w-4" />
                      </button>
                    ) : null}
                    <button
                      onClick={() => onDelete(license.license_key)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Excluir licenca"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {filteredLicenses.length > 0 && viewMode === 'list' ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-4 text-xs font-semibold uppercase text-gray-500">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    title="Selecionar visiveis"
                  />
                </th>
                <th className="px-4 py-4 text-xs font-semibold uppercase text-gray-500">Status</th>
                <th className="px-4 py-4 text-xs font-semibold uppercase text-gray-500">Uso</th>
                <th className="px-4 py-4 text-xs font-semibold uppercase text-gray-500">
                  Cliente / Config
                </th>
                <th className="px-4 py-4 text-xs font-semibold uppercase text-gray-500">
                  Instancia / Banco
                </th>
                <th className="px-4 py-4 text-xs font-semibold uppercase text-gray-500">Chave</th>
                <th className="px-4 py-4 text-right text-xs font-semibold uppercase text-gray-500">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLicenses.map((license) => {
                const isSelected = selectedKeys.has(license.license_key);
                return (
                  <tr
                    key={license.license_key}
                    className={`group transition-colors hover:bg-slate-50 ${
                      isSelected ? 'bg-violet-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(license.license_key)}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <ToggleSwitch checked={!!license.is_active} onClick={() => onToggle(license)} />
                    </td>
                    <td className="px-4 py-4">
                      {license.activated_machine_id ? (
                        <span className="whitespace-nowrap text-xs font-medium text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <Monitor className="h-3 w-3 text-violet-500" /> Em uso
                          </span>
                        </span>
                      ) : (
                        <span className="whitespace-nowrap text-xs font-medium text-gray-400">
                          <span className="inline-flex items-center gap-1.5">
                            <MonitorX className="h-3 w-3" /> Livre
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-slate-800">
                        {license.configs?.instancias?.client_name ?? '-'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {license.configs?.config_name ?? 'Config sem nome'}
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-4">
                      <div className="truncate text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Globe className="h-3 w-3 text-slate-400" />
                          {license.configs?.instancias?.instance_url ?? '-'}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Database className="h-3 w-3 text-slate-400" />
                          {license.configs?.config_data?.dbName ?? '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-xs text-slate-500">• • • • • • • •</code>
                        <button
                          onClick={() => onCopy(license.license_key)}
                          className="rounded p-1 text-violet-600 hover:bg-violet-100"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-70 transition-opacity group-hover:opacity-100">
                        {license.activated_machine_id ? (
                          <button
                            onClick={() => onUnbind(license)}
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-orange-50 hover:text-orange-600"
                            title="Desconectar maquina"
                          >
                            <Unplug className="h-4 w-4" />
                          </button>
                        ) : null}
                        <button
                          onClick={() => onDelete(license.license_key)}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Excluir licenca"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
        </>
      ) : null}
    </div>
  );
}
