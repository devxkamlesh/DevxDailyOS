'use client'

import { DateProvider } from '@/contexts/DateContext'
import { ReactNode } from 'react'

export default function DateProviderWrapper({ children }: { children: ReactNode }) {
  return <DateProvider>{children}</DateProvider>
}
