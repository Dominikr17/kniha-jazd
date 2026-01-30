'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Image from 'next/image'

// Validácia redirect URL - povolené len interné cesty
function isValidRedirect(url: string): boolean {
  // Musí začínať s / a nesmie obsahovať protokol
  if (!url.startsWith('/')) return false
  if (url.startsWith('//')) return false
  if (url.includes('://')) return false

  // Povolené cesty
  const allowedPrefixes = ['/vodic', '/admin', '/']
  return allowedPrefixes.some(prefix => url === prefix || url.startsWith(prefix + '/'))
}

function PinForm() {
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })

      const data = await response.json()

      if (data.success) {
        const redirectParam = searchParams.get('redirect') || '/'
        const redirect = isValidRedirect(redirectParam) ? redirectParam : '/'
        router.push(redirect)
        router.refresh()
      } else {
        toast.error(data.error || 'Nesprávny PIN')
        setPin('')
      }
    } catch {
      toast.error('Chyba pri overovaní PINu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pin">PIN</Label>
        <Input
          id="pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Zadajte PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          autoFocus
          required
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-[#004B87] hover:bg-[#003a6b]"
        disabled={isLoading || !pin}
      >
        {isLoading ? 'Overujem...' : 'Pokračovať'}
      </Button>
    </form>
  )
}

export default function PinPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.svg"
              alt="ZVL Slovakia"
              width={120}
              height={40}
              priority
            />
          </div>
          <CardTitle className="text-xl">Kniha jázd</CardTitle>
          <CardDescription>
            Pre prístup zadajte PIN kód
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-[116px]" />}>
            <PinForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
