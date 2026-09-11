import {
  ArrowRight,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface ApplicationModuleCardProps {
  title: string;
  description: string;
  badge: string;
  icon: LucideIcon;
  path: string;
  points: string[];
}

export default function ApplicationModuleCard({
  title,
  description,
  badge,
  icon: Icon,
  path,
  points,
}: ApplicationModuleCardProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(path)}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-8 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <span className="rounded-lg bg-gray-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">
          {badge}
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm leading-relaxed text-foreground/70">{description}</p>
      </div>

      <div className="mt-6 space-y-2">
        {points.map((point) => (
          <div
            key={point}
            className="flex items-center gap-2 text-sm text-foreground/80"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>{point}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-8">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-transform group-hover:translate-x-1">
          Acessar modulo
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </button>
  );
}
