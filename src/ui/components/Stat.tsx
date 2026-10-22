interface StatProps {
  label: string
  value: ReactNodeValue
  hint?: string
}

type ReactNodeValue = string | number

export function Stat({ label, value, hint }: StatProps) {
  return (
    <div className="stat flex flex-col gap-0.5 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="text-2xl font-bold text-white tabular-nums">{value}</span>
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </div>
  )
}