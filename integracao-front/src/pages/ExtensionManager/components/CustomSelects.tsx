import { useState } from 'react';
import { ChevronDown, Database, Check, Search } from 'lucide-react';
import { useClickOutside } from '../../../hooks/useClickOutside';

// --- CREATABLE SELECT ---
export function CreatableSelect({
  options,
  value,
  onChange,
  placeholder = 'Digite ou selecione...',
}: {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(value.toLowerCase()),
  );

  const displayOptions = filteredOptions.slice(0, 3);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          className="w-full p-3 pr-10 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {isOpen && displayOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {displayOptions.map((opt, idx) => (
              <div
                key={idx}
                className="p-3 text-sm cursor-pointer hover:bg-violet-50 transition-colors flex items-center justify-between text-slate-700"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Database className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate" title={opt}>{opt}</span>
                </div>
                {opt === value && (
                  <Check className="w-4 h-4 text-violet-600 shrink-0 ml-2" />
                )}
              </div>
            ))}
          </div>
          {filteredOptions.length > 6 && (
            <div className="p-2 text-center text-[10px] text-gray-400 border-t border-gray-100 bg-gray-50 uppercase tracking-wider">
              E mais {filteredOptions.length - 6} resultados...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- SEARCHABLE SELECT ---
export interface Option {
  value: string | number;
  label: string;
  subLabel?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
}: {
  options: Option[];
  value: string | number;
  onChange: (val: string | number) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(search.toLowerCase())),
  );

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div
        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl flex items-center justify-between cursor-pointer hover:border-violet-400 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`truncate text-sm ${selectedOption ? 'text-slate-800' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                className="w-full p-2 text-sm outline-none"
                placeholder="Pesquisar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`p-3 text-sm cursor-pointer hover:bg-violet-50 transition-colors flex items-center justify-between ${
                    opt.value === value
                      ? 'bg-violet-50 text-violet-700 font-medium'
                      : 'text-slate-700'
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{opt.label}</span>
                    {opt.subLabel && (
                      <span className="text-xs text-gray-400 truncate">{opt.subLabel}</span>
                    )}
                  </div>
                  {opt.value === value && (
                    <Check className="w-4 h-4 text-violet-600 shrink-0" />
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-gray-400">
                Nenhum resultado encontrado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
