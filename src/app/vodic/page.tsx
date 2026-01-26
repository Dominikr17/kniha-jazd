import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { DriverSelect } from './driver-select'

export default async function SelectDriverPage() {
  const supabase = await createClient()

  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, first_name, last_name')
    .order('last_name')

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Späť
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <img
              src="/logo.svg"
              alt="ZVL SLOVAKIA"
              className="h-12 w-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold">Evidencia jázd</h1>
            <p className="text-muted-foreground">Vyberte svoje meno</p>
          </div>

          {drivers && drivers.length > 0 ? (
            <Card>
              <CardContent className="p-6">
                <DriverSelect drivers={drivers} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Žiadni vodiči nie sú zaregistrovaní.
                <br />
                Kontaktujte administrátora.
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
