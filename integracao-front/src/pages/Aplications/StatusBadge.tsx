import { STATUS_DOT, STATUS_TEXT, type StatusTone } from './bancoUnicoImports.ui';

export default function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${STATUS_TEXT[tone]}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[tone]}`} />
      {label}
    </span>
  );
}
