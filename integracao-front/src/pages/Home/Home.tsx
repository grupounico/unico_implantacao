/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Cpu,
  Database,
  KeySquare,
  Layout,
  Plus,
  Shield,
  TriangleAlert,
  X,
} from 'lucide-react';
import { getDatabases } from '../../services/database.service';
import { listLicenses } from '../../services/extension.service';
import { getLatestNews, type NewsItem } from '../../services/news.service';
import { templates } from '../../data/templates_ia';
import { getAuthSession } from '../../utils/authSession';

type NewsTone = 'neutral' | 'active' | 'success' | 'warning' | 'danger';

const NEWS_TONE: Record<string, NewsTone> = {
  feature: 'success',
  update: 'active',
  maintenance: 'warning',
  alert: 'danger',
};

const NEWS_DOT: Record<NewsTone, string> = {
  neutral: 'bg-slate-400',
  active: 'bg-primary',
  success: 'bg-emerald-600',
  warning: 'bg-amber-600',
  danger: 'bg-rose-600',
};

const NEWS_TEXT: Record<NewsTone, string> = {
  neutral: 'text-slate-600',
  active: 'text-primary',
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger: 'text-rose-700',
};

const NEWS_LABEL: Record<string, string> = {
  feature: 'Novo',
  update: 'Atualização',
  maintenance: 'Manutenção',
  alert: 'Alerta',
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Hoje';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active || window.matchMedia('(prefers-reduced-motion: reduce)').matches || target === 0) {
      setValue(target);
      return;
    }

    const start = performance.now();
    let frameId = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 420);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 4))));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active, target]);

  return value;
}

function StatCell({
  title,
  value,
  active,
  detail,
  status,
  icon: Icon,
  onClick,
}: {
  title: string;
  value: number;
  active: boolean;
  detail: string;
  status: 'good' | 'attention' | 'info';
  icon: typeof Database;
  onClick: () => void;
}) {
  const displayValue = useCountUp(value, active);
  const statusClass = status === 'attention' ? 'text-amber-700' : status === 'info' ? 'text-primary' : 'text-emerald-700';
  const StatusIcon = status === 'attention' ? TriangleAlert : status === 'info' ? Bot : CheckCircle2;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-44 flex-col justify-between px-5 py-5 text-left transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary sm:px-6"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="size-5" />
        </span>
        <ArrowRight className="mt-1 size-4 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="mt-1 text-3xl font-semibold tracking-[-0.03em] tabular-nums text-slate-950">{displayValue}</p>
        <span className={`mt-3 inline-flex items-center gap-1.5 text-xs font-medium ${statusClass}`}>
          <StatusIcon className="size-3.5" />
          {detail}
        </span>
      </div>
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const username = getAuthSession()?.authUsername ?? null;
  const formattedUsername = username?.split('--')[1] || 'usuário';
  const appVersion = __APP_VERSION__;
  const [stats, setStats] = useState({ databases: 0, licenses: 0, activeLicenses: 0 });
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const hasLoadedRef = useRef(false);
  const iaCount = Object.keys(templates).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    let isMounted = true;

    async function fetchData() {
      const [dbResult, licResult, newsResult] = await Promise.allSettled([
        getDatabases(1, 1),
        listLicenses(),
        getLatestNews(),
      ]);
      if (!isMounted) return;

      const licenses = licResult.status === 'fulfilled' ? licResult.value : [];
      setStats({
        databases: dbResult.status === 'fulfilled' ? dbResult.value.meta?.totalItems || 0 : 0,
        licenses: licenses.length,
        activeLicenses: licenses.filter((license: any) => license.is_active).length,
      });
      setNews(newsResult.status === 'fulfilled' ? newsResult.value : []);
      setLoading(false);
    }

    void fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const actions = [
    { label: 'Aplicações', desc: 'Executáveis e serviços de IA', icon: Layout, path: '/main/aplications' },
    { label: 'Novo banco de dados', desc: 'Criar estrutura SQL', icon: Plus, path: '/main/databases' },
    { label: 'Gerar licença', desc: 'Vincular cliente e instância', icon: KeySquare, path: '/main/extensions' },
    { label: 'Configurar IA', desc: 'Treinar e organizar agentes', icon: Cpu, path: '/main/iaPage' },
  ];

  const newsItems = Array.isArray(news) ? news : [];
  const formatMessage = (text: string) => text.split('**').map((part, index) => index % 2 ? <strong key={index} className="font-semibold text-slate-950">{part}</strong> : part);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f8fafc] font-sans text-slate-950">
      <header className="flex min-h-[76px] shrink-0 items-center justify-between gap-4 border-b border-[#dbe3ef] bg-background px-5 sm:px-8">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-[-0.025em] text-slate-950">{greeting}, {formattedUsername}</h1>
          <p className="mt-0.5 truncate text-xs text-slate-500">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <span className="shrink-0 text-xs font-medium text-slate-400">v{appVersion}</span>
      </header>

      <main className="custom-scrollbar mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col gap-8 overflow-y-auto px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <section className="grid gap-7 xl:grid-cols-[minmax(0,0.88fr)_minmax(580px,1.12fr)] xl:items-center">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-primary">Visão geral</p>
            <h2 className="mt-3 max-w-[17ch] text-3xl font-semibold leading-[1.12] tracking-[-0.035em] text-slate-950 sm:text-4xl">Controle sua operação em um só lugar.</h2>
            <p className="mt-4 max-w-[55ch] text-base leading-7 text-slate-600">Acompanhe recursos, confira o status do ambiente e avance para as tarefas que mantêm a plataforma em movimento.</p>
            <button type="button" onClick={() => navigate('/main/databases')} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-[#0f50df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              Gerenciar bancos
              <ArrowRight className="size-4" />
            </button>
          </div>

          <div className="grid overflow-hidden rounded-xl border border-[#dbe3ef] bg-background sm:grid-cols-3 sm:divide-x sm:divide-[#dbe3ef]">
            <StatCell title="Bancos de dados" value={stats.databases} active={!loading} detail="Ambientes registrados" status="good" icon={Database} onClick={() => navigate('/main/databases')} />
            <StatCell title="Licenças ativas" value={stats.activeLicenses} active={!loading} detail={`${stats.activeLicenses} de ${stats.licenses} em uso`} status={stats.licenses > stats.activeLicenses ? 'attention' : 'good'} icon={Shield} onClick={() => navigate('/main/extensions')} />
            <StatCell title="Modelos de IA" value={iaCount} active={!loading} detail="Modelos disponíveis" status="info" icon={Cpu} onClick={() => navigate('/main/iaPage')} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
          <div className="overflow-hidden rounded-xl border border-[#dbe3ef] bg-background">
            <div className="flex items-center justify-between border-b border-[#dbe3ef] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-semibold tracking-[-0.015em] text-slate-950">Ações de trabalho</h2>
                <p className="mt-0.5 text-xs text-slate-500">Atalhos para as tarefas mais frequentes.</p>
              </div>
            </div>
            <div className="divide-y divide-[#dbe3ef]">
              {actions.map((action) => (
                <button type="button" key={action.path} onClick={() => navigate(action.path)} className="group flex min-h-[82px] w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary sm:px-6">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors duration-200 group-hover:bg-primary/10 group-hover:text-primary"><action.icon className="size-5" /></span>
                    <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-900">{action.label}</span><span className="mt-0.5 block truncate text-sm text-slate-500">{action.desc}</span></span>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#dbe3ef] bg-background">
            <div className="flex items-center justify-between border-b border-[#dbe3ef] px-5 py-4 sm:px-6"><div><h2 className="text-base font-semibold tracking-[-0.015em] text-slate-950">Atualizações do sistema</h2><p className="mt-0.5 text-xs text-slate-500">O que mudou recentemente na plataforma.</p></div></div>
            {newsItems.length ? <ul className="divide-y divide-[#dbe3ef]">{newsItems.map((item) => { const tone = NEWS_TONE[item.type] || 'neutral'; return <li key={item.id}><button type="button" onClick={() => setSelectedNews(item)} className="group flex w-full gap-3 px-5 py-4 text-left transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary sm:px-6"><span className={`mt-1.5 size-2 shrink-0 rounded-full ${NEWS_DOT[tone]}`} /><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-3"><span className="line-clamp-1 text-sm font-semibold text-slate-900">{item.title}</span><span className="shrink-0 text-xs text-slate-400">{formatDate(item.created_at)}</span></span><span className="mt-1 line-clamp-3 text-sm leading-6 text-slate-500">{item.description}</span><span className={`mt-2 inline-flex text-xs font-medium ${NEWS_TEXT[tone]}`}>{NEWS_LABEL[item.type] || item.type}</span></span><ArrowRight className="mt-1 size-4 shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" /></button></li>; })}</ul> : <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center"><CheckCircle2 className="size-7 text-emerald-600" /><h3 className="mt-3 text-sm font-semibold text-slate-900">Tudo em dia</h3><p className="mt-1 max-w-[28ch] text-sm leading-6 text-slate-500">Novas atualizações e avisos aparecerão aqui.</p></div>}
          </div>
        </section>
      </main>

      {selectedNews ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={() => setSelectedNews(null)}><div role="dialog" aria-modal="true" aria-labelledby="news-title" className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-background shadow-[0_8px_20px_rgba(15,23,42,0.18)]" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4 border-b border-[#dbe3ef] px-5 py-4"><div><span className={`inline-flex text-xs font-semibold ${NEWS_TEXT[NEWS_TONE[selectedNews.type] || 'neutral']}`}>{NEWS_LABEL[selectedNews.type] || selectedNews.type}</span><h2 id="news-title" className="mt-1 text-lg font-semibold tracking-[-0.02em] text-slate-950">{selectedNews.title}</h2></div><button type="button" onClick={() => setSelectedNews(null)} aria-label="Fechar atualização" className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><X className="size-5" /></button></div><div className="custom-scrollbar overflow-y-auto px-5 py-5 text-sm leading-7 text-slate-600 whitespace-pre-line">{formatMessage(selectedNews.description)}</div><div className="flex justify-end border-t border-[#dbe3ef] px-5 py-3"><button type="button" onClick={() => setSelectedNews(null)} className="min-h-10 rounded-lg border border-[#dbe3ef] px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Fechar</button></div></div></div> : null}
    </div>
  );
}
