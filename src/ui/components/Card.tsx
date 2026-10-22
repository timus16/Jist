import type { ReactNode } from 'react'

interface CardProps {
  className?: string
  children: ReactNode
}

export function Card({ className = '', children }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/5 bg-white/[0.04] p-4 ${className}`}
    >
      {children}
    </div>
  )
}