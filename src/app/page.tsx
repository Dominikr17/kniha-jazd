import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { DriverSelect } from './vodic/driver-select'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, first_name, last_name')
    .order('last_name')

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md -mt-24">
          {/* Logo a názov */}
          <div className="text-center mb-8">
            <Image
              src="/logo.svg"
              alt="ZVL SLOVAKIA"
              width={160}
              height={64}
              className="h-16 w-auto mx-auto mb-4"
              priority
            />
            <h1 className="text-3xl font-bold tracking-tight">Kniha jázd</h1>
            <p className="text-muted-foreground mt-2">
              Elektronická evidencia služobných ciest
            </p>
          </div>

          {/* Výber vodiča */}
          {drivers && drivers.length > 0 ? (
            <Card className="mt-8">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Vyberte svoje meno
                </p>
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

          {/* Admin link - sekundárny */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Ste administrátor?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Prihlásiť sa
            </Link>
          </p>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            ZVL SLOVAKIA a.s. &copy; {new Date().getFullYear()}
          </p>
        </div>
      </main>
    </div>
  )
}
