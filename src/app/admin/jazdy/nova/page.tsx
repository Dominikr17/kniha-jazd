import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { NewTripForm } from './new-trip-form'

export default async function NewTripPage() {
  const supabase = await createClient()

  const [{ data: vehicles }, { data: drivers }] = await Promise.all([
    supabase.from('vehicles').select('id, name, license_plate').order('name'),
    supabase.from('drivers').select('id, first_name, last_name').order('last_name'),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/jazdy">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nová jazda</h1>
          <p className="text-muted-foreground">Zaznamenanie novej jazdy do knihy jázd</p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Údaje o jazde</CardTitle>
        </CardHeader>
        <CardContent>
          <NewTripForm vehicles={vehicles || []} drivers={drivers || []} />
        </CardContent>
      </Card>
    </div>
  )
}
