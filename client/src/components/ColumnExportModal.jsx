import React, { useEffect, useRef } from 'react';

const ColumnExportModal = ({
  open,
  title = 'Export Events',
  subtitle = 'Choose the information you want to include in your CSV file.',
  columns,
  selectedColumns,
  onSelectedColumnsChange,
  onClose,
  onExport,
  isExporting,
  error,
}) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isExporting) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, isExporting, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-3 py-4 backdrop-blur-sm" role="presentation">
      <div ref={dialogRef} tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="column-export-title" className="flex max-h-[min(640px,calc(100dvh-2rem))] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl outline-none dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800 sm:px-6">
          <div><h2 id="column-export-title" className="text-lg font-black text-neutral-900 dark:text-white">{title}</h2><p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p></div>
          <button type="button" aria-label="Close export dialog" disabled={isExporting} onClick={onClose} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 dark:hover:bg-neutral-800"><i className="ri-close-line text-lg" /></button>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-5 py-3 dark:border-neutral-800 sm:px-6">
          <div className="flex gap-2">
            <button type="button" onClick={() => onSelectedColumnsChange(columns.map(column => column.key))} className="rounded-lg border border-neutral-300 px-3 py-2 text-[10px] font-bold uppercase tracking-wider dark:border-neutral-700">Select All</button>
            <button type="button" onClick={() => onSelectedColumnsChange([])} className="rounded-lg border border-neutral-300 px-3 py-2 text-[10px] font-bold uppercase tracking-wider dark:border-neutral-700">Clear All</button>
          </div>
          <span className="text-xs font-semibold text-neutral-500">{selectedColumns.length} of {columns.length} selected</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {columns.map(column => {
              const checked = selectedColumns.includes(column.key);
              return <label key={column.key} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-orange-50 dark:hover:bg-orange-950/20"><input type="checkbox" checked={checked} onChange={() => onSelectedColumnsChange(checked ? selectedColumns.filter(key => key !== column.key) : [...selectedColumns, column.key])} className="h-4 w-4 accent-orange-600" /><span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{column.label}</span></label>;
            })}
          </div>
        </div>
        {error && <p role="alert" className="px-5 pb-2 text-xs font-semibold text-rose-600 sm:px-6">{error}</p>}
        <div className="flex flex-col-reverse gap-2 border-t border-neutral-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-neutral-800">
          <button type="button" disabled={isExporting} onClick={onClose} className="rounded-xl border border-neutral-300 px-5 py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-40 dark:border-neutral-700">Cancel</button>
          <button type="button" disabled={isExporting || selectedColumns.length === 0} onClick={onExport} className="rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-40"><i className={`${isExporting ? 'ri-loader-4-line animate-spin' : 'ri-download-2-line'} mr-1`} />{isExporting ? 'Exporting...' : 'Export CSV'}</button>
        </div>
      </div>
    </div>
  );
};

export default ColumnExportModal;
