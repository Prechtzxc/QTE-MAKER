import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-eyelectric-navy focus:ring-2 focus:ring-eyelectric-navy/10 disabled:bg-slate-100 disabled:text-slate-400";

interface LabeledProps {
  label: string;
  hint?: string;
  children?: ReactNode;
  className?: string;
}

export function FieldLabel({ label, hint, children, className = "" }: LabeledProps) {
  return (
    <label className={`block ${className}`}>
      <span className="flex items-baseline justify-between gap-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
        <span>{label}</span>
        {hint ? <span className="font-normal normal-case tracking-normal text-slate-400">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export function TextField({ label, hint, className = "", ...props }: LabeledProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldLabel label={label} hint={hint} className={className}>
      <input className={inputClass} {...props} />
    </FieldLabel>
  );
}

export function TextAreaField({ label, hint, className = "", ...props }: LabeledProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldLabel label={label} hint={hint} className={className}>
      <textarea className={`${inputClass} resize-y`} {...props} />
    </FieldLabel>
  );
}

export function SelectField({ label, hint, className = "", children, ...props }: LabeledProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldLabel label={label} hint={hint} className={className}>
      <select className={inputClass} {...props}>{children}</select>
    </FieldLabel>
  );
}

export function PrimaryButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`inline-flex items-center justify-center gap-2 rounded-lg bg-eyelectric-navy px-4 py-2 text-sm font-bold text-white transition hover:bg-[#101a42] disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}>
      {children}
    </button>
  );
}

export function SecondaryButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-eyelectric-navy hover:text-eyelectric-navy disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}>
      {children}
    </button>
  );
}

export function DangerButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}>
      {children}
    </button>
  );
}

export function IconButton({ className = "", title, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { title: string }) {
  return (
    <button aria-label={title} title={title} className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-eyelectric-navy disabled:cursor-not-allowed disabled:opacity-40 ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Panel({ title, eyebrow, actions, children, className = "" }: { title?: string; eyebrow?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-panel ${className}`}>
      {(title || eyebrow || actions) && (
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            {eyebrow ? <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-eyelectric-red">{eyebrow}</p> : null}
            {title ? <h2 className="mt-1 text-base font-bold text-eyelectric-navy">{title}</h2> : null}
          </div>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-eyelectric-blue text-lg font-black text-eyelectric-navy">Q</div>
      <h2 className="mt-4 text-lg font-bold text-eyelectric-navy">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
