import React from 'react';
import { X } from 'lucide-react';

/** Stat card */
export const StatCard = ({ label, value, accent }) => (
    <div className={`p-5 rounded-2xl border transition-colors ${
        accent 
            ? "bg-black dark:bg-white border-black dark:border-white" 
            : "bg-white dark:bg-[#0a0a0a] border-neutral-200 dark:border-zinc-800"
    }`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500">{label}</p>
        <p className={`text-2xl font-black mt-1 ${
            accent ? "text-orange-500 dark:text-orange-600" : "text-black dark:text-white"
        }`}>{value}</p>
    </div>
);

/** DataTable wrapper */
export const DataTable = ({ children }) => (
    <div className="bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full">{children}</table>
        </div>
    </div>
);

/** Table header cell */
export const Th = ({ children, align = "left" }) => (
    <th className={`px-5 py-4 text-${align} text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500`}>
        {children}
    </th>
);

/** Table body cell */
export const Td = ({ children, align = "left", className = "" }) => (
    <td className={`px-5 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300 text-${align} ${className}`}>
        {children}
    </td>
);

/** Event type badge */
export const TypeBadge = ({ isPaid, fee }) => (
    <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${
        isPaid
            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
    }`}>
        {isPaid ? (fee ? `Paid (₹${fee})` : 'Paid') : 'Free'}
    </span>
);

/** Form input */
export const FormInput = ({ name, type = "text", placeholder, required }) => (
    <input 
        name={name} 
        type={type} 
        placeholder={placeholder} 
        required={required} 
        className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-400 dark:border-zinc-800 rounded-xl text-[13px] focus:border-orange-600 dark:focus:border-orange-500 outline-none transition-colors placeholder:text-neutral-500 dark:placeholder:text-neutral-600" 
    />
);

/** Filter select */
export const FilterSelect = ({ children, value, onChange }) => (
    <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-[12px] font-bold text-neutral-600 dark:text-neutral-300 focus:border-orange-600 dark:focus:border-orange-500 outline-none transition-colors cursor-pointer"
    >
        {children}
    </select>
);

/** Modal wrapper */
export const Modal = ({ onClose, title, subtitle, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
        <div className="bg-white dark:bg-[#0f0f0f] border border-neutral-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-black text-black dark:text-white tracking-tight">{title}</h3>
                    {subtitle && <p className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold mt-0.5 tracking-wide">{subtitle}</p>}
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                    <X size={18} />
                </button>
            </div>
            {/* Body */}
            <div className="px-6 pb-6">{children}</div>
        </div>
    </div>
);

/** Modal field (read-only) */
export const ModalField = ({ label, value, mono, accent }) => (
    <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">{label}</label>
        <p className={`font-semibold text-sm border-b border-neutral-200 dark:border-zinc-800 pb-1.5 ${
            mono ? "font-mono" : ""
        } ${accent ? "text-orange-600 dark:text-orange-400" : "text-black dark:text-white"}`}>
            {value || 'N/A'}
        </p>
    </div>
);

/** Modal form field */
export const ModalFormField = ({ label, name, type = "text", defaultValue, placeholder, required }) => (
    <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">{label}</label>
        <input 
            name={name} 
            type={type} 
            defaultValue={defaultValue} 
            placeholder={placeholder} 
            required={required} 
            className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-[13px] focus:border-orange-600 dark:focus:border-orange-500 outline-none transition-colors" 
        />
    </div>
);
