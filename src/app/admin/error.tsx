'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin error:', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Nastala chyba</h2>
      <p className="text-muted-foreground max-w-md">
        Pri načítaní stránky nastala chyba. Skúste to znova.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Skúsiť znova</Button>
        <Button variant="outline" asChild>
          <a href="/admin">Dashboard</a>
        </Button>
      </div>
    </div>
  )
}
