import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Car } from 'lucide-react'
import { VehiclesTable } from './vehicles-table'

export default async function VehiclesPage() {
  const supabase = await createClient()

  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('*, responsible_driver:drivers(*)')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error loading vehicles:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vozidlá</h1>
          <p className="text-muted-foreground">Správa vozového parku</p>
        </div>
        <Button asChild>
          <Link href="/admin/vozidla/nove">
            <Plus className="mr-2 h-4 w-4" />
            Pridať vozidlo
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Zoznam vozidiel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VehiclesTable vehicles={vehicles || []} />
        </CardContent>
      </Card>
    </div>
  )
}
