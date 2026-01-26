import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Car } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo a názov */}
          <div className="text-center">
            <img
              src="/logo.svg"
              alt="ZVL SLOVAKIA"
              className="h-16 w-auto mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold tracking-tight">Kniha jázd</h1>
            <p className="text-muted-foreground mt-2">
              Elektronická evidencia služobných ciest
            </p>
          </div>

          {/* Výber prístupu */}
          <div className="space-y-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Car className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle>Evidencia jázd</CardTitle>
                    <CardDescription>Pre vodičov</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Zaznamenávanie jázd a tankovania. Rýchly prístup bez hesla.
                </p>
                <Button asChild className="w-full" size="lg">
                  <Link href="/vodic">
                    Vstúpiť ako vodič
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle>Administrácia</CardTitle>
                    <CardDescription>Pre správcov</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Správa vozidiel, vodičov, STK, reporty. Vyžaduje prihlásenie.
                </p>
                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link href="/login">
                    Prihlásiť sa ako admin
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            ZVL SLOVAKIA a.s. &copy; {new Date().getFullYear()}
          </p>
        </div>
      </main>
    </div>
  )
}
