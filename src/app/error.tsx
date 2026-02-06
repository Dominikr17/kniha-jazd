'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Nastala neočakávaná chyba</h2>
      <p className="text-muted-foreground max-w-md">
        Niečo sa pokazilo. Skúste to znova alebo sa vráťte na úvodnú stránku.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Skúsiť znova</Button>
        <Button variant="outline" asChild>
          <a href="/">Úvodná stránka</a>
        </Button>
      </div>
    </div>
  )
}
