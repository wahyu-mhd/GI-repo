'use client'

import { Button } from '@/components/ui/button'

type Props = {
  label?: string
}

export function PrintButton({ label = 'Print' }: Props) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handlePrint}>
      {label}
    </Button>
  )
}
