export default function FormField({ label, id, hint, ...inputProps }) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input id={id} className="min-h-12 w-full rounded-xl border border-slate-200 bg-surface px-4 text-base text-ink shadow-sm transition placeholder:text-slate-400 hover:border-slate-300 focus:border-accent-500 dark:border-slate-700" {...inputProps} />
      {hint && <span className="mt-2 block text-xs leading-5 text-muted">{hint}</span>}
    </label>
  )
}
