import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Car } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md -mt-8">
          {/* Logo a názov */}
          <div className="text-center mb-16">
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

          {/* Vodičovská karta - dominantná */}
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
              <Button asChild className="w-full bg-[#FFC72C] text-[#004B87] hover:bg-[#e6b327]" size="lg">
                <Link href="/vodic">
                  Vstúpiť ako vodič
                </Link>
              </Button>
            </CardContent>
          </Card>

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
