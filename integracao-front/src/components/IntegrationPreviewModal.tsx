import { useState } from 'react';
import {
  X,
  CheckCircle2,
  PlayCircle,
  ArrowRight,
  Puzzle,
  Zap,
  ShieldCheck,
  LayoutTemplate,
  BookOpen,
  FileText,
} from 'lucide-react';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template: any;
  onClose: () => void;
  onContinue: () => void;
}

export function IntegrationPreviewModal({
  template,
  onClose,
  onContinue,
}: Props) {
  // Estado para controlar a aba ativa (Visão Geral ou Documentação)
  const [activeTab, setActiveTab] = useState<'overview' | 'guide'>('overview');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* --- HEADER --- */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Puzzle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight flex justify-center items-center gap-2">
                {template.name}{' '}
                <span
                  className={`px-1 py-1 rounded-md text-[10px] font-bold uppercase ${template.active == false && template.type == 'Extensão' ? 'bg-blue-100 text-blue-700' :
                    template.active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {template.active == false && template.type == 'Extensão' ? 'Extensão' : template.active ? 'Disponível' : 'Manutenção'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                {template.type || 'Integração Oficial'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* --- CORPO (Layout 2 Colunas) --- */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* COLUNA ESQUERDA: Conteúdo Principal */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* TAB NAVIGATION */}
            <div className="flex border-b border-gray-100 px-6 pt-2 sticky top-0 bg-white z-10">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <LayoutTemplate className="w-4 h-4" /> Visão Geral
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'guide'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <BookOpen className="w-4 h-4" /> Como Integrar
              </button>
            </div>

            {/* TAB CONTENT (Scrollável) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* --- ABA 1: VISÃO GERAL --- */}
              {activeTab === 'overview' && (
                <>
                  {/* Banner */}
                  <div className="w-full h-56 bg-gray-100 relative group overflow-hidden">
                    {template.banner ? (
                      <div
                        className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url(${template.banner})` }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300">
                        <LayoutTemplate className="w-16 h-16 mb-2 opacity-50" />
                        <span className="text-sm font-medium">
                          Sem imagem de capa
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
                  </div>

                  <div className="p-6 sm:p-10 space-y-10">
                    <section>
                      <h3 className="text-lg font-bold text-slate-900 mb-4">
                        Sobre a Integração
                      </h3>
                      <p className="text-slate-600 leading-7 text-base whitespace-pre-line">
                        {template.longDescription || template.description}
                      </p>
                    </section>

                    {template.videoUrl && (
                      <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <PlayCircle className="w-5 h-5 text-blue-600" /> Como
                          funciona
                        </h3>
                        <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-slate-900">
                          <iframe
                            src={template.videoUrl}
                            className="w-full h-full"
                            title="Video Demo"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </section>
                    )}
                  </div>
                </>
              )}

              {/* --- ABA 2: GUIA PASSO A PASSO --- */}
              {activeTab === 'guide' && (
                <div className="p-6 sm:p-10">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex gap-3">
                    <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 leading-relaxed">
                      Siga o passo a passo abaixo para configurar a integração
                      corretamente. Certifique-se de ter as credenciais
                      necessárias em mãos.
                    </p>
                  </div>

                  {template.steps && template.steps.length > 0 ? (
                    <div className="relative border-l border-gray-200 ml-3 space-y-8">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {template.steps.map((step: any, index: number) => (
                        <div key={index} className="pl-8 relative group">
                          {/* Bolinha do Passo */}
                          <div className="absolute -left-[17px] top-0 flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-slate-200 text-slate-500 text-sm font-bold group-hover:border-blue-500 group-hover:text-blue-600 transition-colors">
                            {index + 1}
                          </div>

                          {/* Conteúdo do Passo */}
                          <div>
                            <h4 className="text-base font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                              {step.title}
                            </h4>
                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                              {step.content}
                            </p>

                            {/* Opcional: Snippet de código ou imagem se houver no objeto */}
                            {step.code && (
                              <div className="mt-3 bg-slate-900 rounded-lg p-3 overflow-x-auto">
                                <code className="text-xs text-green-400 font-mono">
                                  {step.code}
                                </code>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 opacity-50">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-500">
                        Nenhuma documentação disponível para esta integração.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: Sidebar (Mantida igual, apenas renderizada aqui) */}
          <div className="w-full lg:w-96 bg-slate-50 border-l border-gray-200 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-5">
              {/* Requisitos de Dados (Movido para sidebar para liberar espaço) */}
              <div className=" border-b border-gray-200 pb-6">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" /> Dados
                  Necessários
                </h4>
                <div className="flex flex-wrap gap-2">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {template.fields?.map((f: any) => (
                    <span
                      key={f.key}
                      className="px-2 py-1 bg-white text-slate-600 text-[10px] uppercase font-bold rounded border border-gray-200 shadow-sm"
                    >
                      {f.label}
                    </span>
                  ))}
                </div>
              </div>
              {/* Card de Ação */}
              <button
                onClick={onContinue}
                disabled={!template.active}
                className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
                    ${
                      template.active
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 hover:-translate-y-0.5'
                        : 'bg-gray-300 cursor-not-allowed text-gray-500 shadow-none'
                    }
                    `}
              >
                {template.active ? (
                  <>
                    Instalar Agora <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  'Indisponível'
                )}
              </button>

              {/* Benefícios */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Destaques
                </h4>
                <ul className="space-y-3">
                  {template.benefits &&
                    template.benefits.map((benefit: string, index: number) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 text-sm text-slate-600"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        <span className="leading-snug">{benefit}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
