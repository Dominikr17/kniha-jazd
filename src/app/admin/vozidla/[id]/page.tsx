import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Car, FileText, Shield, CreditCard } from 'lucide-react'
import { FUEL_TYPES } from '@/types'
import { EditVehicleForm } from './edit-form'
import { InspectionsSection } from './inspections-section'
import { VignettesSection } from './vignettes-section'

interface VehicleDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: vehicle, error: vehicleError },
    { data: inspections },
    { data: vignettes },
  ] = await Promise.all([
    supabase.from('vehicles').select('*').eq('id', id).single(),
    supabase.from('vehicle_inspections').select('*').eq('vehicle_id', id).order('valid_until', { ascending: false }),
    supabase.from('vehicle_vignettes').select('*').eq('vehicle_id', id).order('valid_until', { ascending: false }),
  ])

  if (vehicleError || !vehicle) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/vozidla">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{vehicle.name}</h1>
            <Badge variant="outline" className="text-base">
              {vehicle.license_plate}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`} · {FUEL_TYPES[vehicle.fuel_type as keyof typeof FUEL_TYPES]}
          </p>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="info" className="gap-2">
            <Car className="h-4 w-4 hidden sm:inline" />
            Základné údaje
          </TabsTrigger>
          <TabsTrigger value="inspections" className="gap-2">
            <Shield className="h-4 w-4 hidden sm:inline" />
            STK / EK
          </TabsTrigger>
          <TabsTrigger value="vignettes" className="gap-2">
            <CreditCard className="h-4 w-4 hidden sm:inline" />
            Diaľničné známky
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4 hidden sm:inline" />
            Dokumenty
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Základné údaje</CardTitle>
            </CardHeader>
            <CardContent>
              <EditVehicleForm vehicle={vehicle} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspections">
          <InspectionsSection vehicleId={id} inspections={inspections || []} />
        </TabsContent>

        <TabsContent value="vignettes">
          <VignettesSection vehicleId={id} vignettes={vignettes || []} />
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Dokumenty vozidla</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Správa dokumentov vozidla bude implementovaná v ďalšej verzii.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
