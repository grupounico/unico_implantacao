import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Database,
  Loader2,
  PackageSearch,
  RefreshCw,
  ShieldAlert,
  TableProperties,
  TimerReset,
} from 'lucide-react';

import { ModalFrame } from '../../../components/ModalFrame';
import {
  checkIntegrationDatabaseStatus,
  type DatabaseIntegrationStatusResult,
} from '../../../services/database.service';
import { extractErrorMessage } from '../../../utils/error';

type InspectionState = 'loading' | 'success' | 'error';

interface DatabaseStatusModalProps {
  databaseName: string;
  onClose: () => void;
}

export function DatabaseStatusModal({
  databaseName,
  onClose,
}: DatabaseStatusModalProps) {
  const [status, setStatus] = useState<InspectionState>('loading');
  const [result, setResult] = useState<DatabaseIntegrationStatusResult | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState('');

  const loadStatus = useCallback(async () => {
    setStatus('loading');
    setResult(null);
    setErrorMessage('');

    try {
      const response = await checkIntegrationDatabaseStatus(databaseName);
      setResult(response);
      setStatus('success');
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(
          error,
          'Nao foi possivel verificar o status deste banco.',
        ),
      );
      setStatus('error');
    }
  }, [databaseName]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const summaryTone =
    status === 'success' && result
      ? result.readyForIntegration
        ? {
            container: 'border-emerald-200 bg-emerald-50',
            icon: 'bg-white text-emerald-600',
            title: 'Banco pronto para integracao',
            descriptionClassName: 'text-emerald-800',
          }
        : result.requirements.tableExists
          ? {
              container: 'border-amber-200 bg-amber-50',
              icon: 'bg-white text-amber-600',
              title: 'Banco com pendencia de carga',
              descriptionClassName: 'text-amber-900',
            }
          : {
              container: 'border-rose-200 bg-rose-50',
              icon: 'bg-white text-rose-600',
              title: 'Tabela obrigatoria nao encontrada',
              descriptionClassName: 'text-rose-900',
            }
      : null;

  return (
    <ModalFrame
      title={
        <span className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          Status da Integracao
        </span>
      }
      onClose={onClose}
      maxWidthClassName="max-w-3xl"
      bodyClassName="custom-scrollbar overflow-y-auto p-6"
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          Esta verificacao consulta apenas a existencia da tabela{' '}
          <span className="font-semibold">public.out_embalagem</span> e a
          quantidade de produtos cadastrados. Nenhum registro e exibido na
          interface. Quando o banco nao libera leitura direta, a quantidade e
          exibida por estimativa dos metadados do PostgreSQL.
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <Database className="h-4 w-4 text-blue-500" />
              Banco analisado
            </div>
            <div className="text-lg font-bold text-slate-900">{databaseName}</div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <TableProperties className="h-4 w-4 text-indigo-500" />
              Requisito monitorado
            </div>
            <div className="text-lg font-bold text-slate-900">
              public.out_embalagem
            </div>
          </div>
        </div>

        {status === 'loading' ? (
          <div className="animate-in fade-in rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  Verificando criterios da integracao...
                </p>
                <p className="text-sm text-slate-500">
                  Estamos conectando no banco e validando a tabela monitorada.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {status === 'success' && result && summaryTone ? (
          <div
            className={`animate-in fade-in rounded-2xl border p-5 shadow-sm ${summaryTone.container}`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full shadow-sm ${summaryTone.icon}`}
              >
                {result.readyForIntegration ? (
                  <BadgeCheck className="h-6 w-6" />
                ) : (
                  <ShieldAlert className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {summaryTone.title}
                </h3>
                <p className={`mt-1 text-sm ${summaryTone.descriptionClassName}`}>
                  {result.message}
                </p>
                {!result.requirements.hasReadAccess ? (
                  <p className="mt-2 text-xs text-slate-600">
                    O usuario configurado neste painel nao possui leitura direta
                    na tabela. Por isso a contagem foi obtida pelos metadados do
                    PostgreSQL.
                  </p>
                ) : null}

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-white/70 bg-white p-3 text-sm text-slate-700">
                    <div className="mb-1 flex items-center gap-2 text-slate-500">
                      <TableProperties className="h-4 w-4" />
                      Tabela
                    </div>
                    <div className="font-semibold">
                      {result.requirements.tableExists ? 'Encontrada' : 'Ausente'}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/70 bg-white p-3 text-sm text-slate-700">
                    <div className="mb-1 flex items-center gap-2 text-slate-500">
                      <PackageSearch className="h-4 w-4" />
                      Produtos
                    </div>
                    <div className="font-semibold">
                      {result.requirements.productCount.toLocaleString('pt-BR')}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {result.requirements.productCountSource === 'estimated'
                        ? 'Quantidade estimada pelos metadados do PostgreSQL'
                        : 'Quantidade exata lida diretamente da tabela'}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/70 bg-white p-3 text-sm text-slate-700">
                    <div className="mb-1 flex items-center gap-2 text-slate-500">
                      <BadgeCheck className="h-4 w-4" />
                      Liberacao
                    </div>
                    <div className="font-semibold">
                      {result.readyForIntegration ? 'Pode prosseguir' : 'Ainda bloqueado'}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/70 bg-white p-3 text-sm text-slate-700">
                    <div className="mb-1 flex items-center gap-2 text-slate-500">
                      <TimerReset className="h-4 w-4" />
                      Latencia
                    </div>
                    <div className="font-semibold">{result.latencyMs} ms</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="animate-in fade-in rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600 shadow-sm">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900">
                  Nao foi possivel verificar este banco
                </h3>
                <p className="mt-1 text-sm text-red-800">{errorMessage}</p>
                <p className="mt-4 rounded-xl border border-red-100 bg-white p-3 text-sm text-slate-600">
                  Se o banco acabou de ser criado ou ainda nao recebeu carga,
                  voce pode repetir a verificacao assim que a etapa anterior da
                  integracao for concluida.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={status === 'loading'}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => {
              void loadStatus();
            }}
            disabled={status === 'loading'}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Verificar novamente
              </>
            )}
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}
