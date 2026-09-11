import type { ChangeEventHandler, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Search } from 'lucide-react';

type CatalogShellTheme = 'system' | 'slate';

interface CatalogPageShellProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
  searchTerm: string;
  onSearchTermChange: ChangeEventHandler<HTMLInputElement>;
  searchPlaceholder: string;
  children: ReactNode;
  headerActions?: ReactNode;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  theme?: CatalogShellTheme;
}

const themeClasses = {
  system: {
    page: 'bg-background font-sans text-foreground',
    header: 'bg-card border-border',
    title: 'text-foreground',
    description: 'text-muted-foreground',
    searchIcon: 'text-muted-foreground',
    searchInput:
      'block w-full rounded-lg border border-border bg-muted py-2 pl-10 pr-3 text-foreground outline-none transition focus:bg-card focus:ring-2 focus:ring-primary sm:text-sm placeholder:text-muted-foreground',
    emptyIcon: 'text-muted-foreground',
    emptyTitle: 'text-lg font-medium text-foreground',
    emptyDescription: 'text-muted-foreground',
  },
  slate: {
    page: 'bg-slate-50 font-sans text-slate-800',
    header: 'bg-white border-gray-200',
    title: 'text-slate-900',
    description: 'text-slate-500',
    searchIcon: 'text-gray-400',
    searchInput:
      'block w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-3 text-slate-800 outline-none transition duration-150 focus:bg-white focus:ring-2 focus:ring-violet-500 sm:text-sm placeholder:text-gray-400',
    emptyIcon: 'text-slate-300',
    emptyTitle: 'text-xl font-medium text-gray-900',
    emptyDescription: 'text-gray-500',
  },
};

export function CatalogPageShell({
  title,
  description,
  icon: Icon,
  iconClassName = '',
  searchTerm,
  onSearchTermChange,
  searchPlaceholder,
  children,
  headerActions,
  isEmpty = false,
  emptyTitle,
  emptyDescription,
  emptyIcon: EmptyIcon,
  theme = 'slate',
}: CatalogPageShellProps) {
  const styles = themeClasses[theme];

  return (
    <div className={`flex h-screen max-h-screen flex-col overflow-hidden ${styles.page}`}>
      <header
        className={`sticky top-0 z-10 flex flex-col justify-between gap-4 border-b px-8 py-6 md:flex-row md:items-center ${styles.header}`}
      >
        <div>
          <h1 className={`flex items-center gap-2 text-2xl font-bold ${styles.title}`}>
            <Icon className={`h-7 w-7 ${iconClassName}`} /> {title}
          </h1>
          <p className={`mt-1  text-sm text-slate-500 ${styles.description}`}>{description}</p>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full md:w-96">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className={`h-5 w-5 ${styles.searchIcon}`} />
            </div>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={onSearchTermChange}
            />
          </div>

          {headerActions ? <div className="shrink-0">{headerActions}</div> : null}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        {isEmpty && EmptyIcon ? (
          <div className="mt-10 flex h-full flex-col items-center justify-center text-center opacity-60">
            <EmptyIcon className={`mb-4 h-16 w-16 ${styles.emptyIcon}`} />
            {emptyTitle ? <h3 className={styles.emptyTitle}>{emptyTitle}</h3> : null}
            {emptyDescription ? (
              <p className={styles.emptyDescription}>{emptyDescription}</p>
            ) : null}
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
