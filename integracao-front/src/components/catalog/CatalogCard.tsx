import type { ReactNode } from 'react';

type CatalogCardTheme = 'system' | 'slate';

interface CatalogCardProps {
  selected?: boolean;
  theme?: CatalogCardTheme;
  media?: ReactNode;
  badge?: ReactNode;
  onClick: () => void;
  children: ReactNode;
}

const themeClasses = {
  system: {
    card: 'bg-card border border-border hover:border-primary/50',
    selected: 'ring-2 ring-primary',
  },
  slate: {
    card: 'bg-white border border-gray-200 hover:border-violet-300',
    selected: 'ring-2 ring-violet-500',
  },
};

export function CatalogCard({
  selected = false,
  theme = 'slate',
  media,
  badge,
  onClick,
  children,
}: CatalogCardProps) {
  const styles = themeClasses[theme];

  return (
    <div
      onClick={onClick}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:shadow-xl ${styles.card} ${
        selected ? styles.selected : ''
      }`}
    >
      {media}
      {badge ? <div className="absolute right-3 top-3">{badge}</div> : null}
      <div className="flex flex-1 flex-col p-5">{children}</div>
    </div>
  );
}
