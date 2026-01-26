import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { EditDriverForm } from './edit-form'

interface EditDriverPageProps {
  params: Promise<{ id: string }>
}

export default async function EditDriverPage({ params }: EditDriverPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: driver, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !driver) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vodici">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Upraviť vodiča</h1>
          <p className="text-muted-foreground">
            {driver.first_name} {driver.last_name}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Údaje vodiča</CardTitle>
        </CardHeader>
        <CardContent>
          <EditDriverForm driver={driver} />
        </CardContent>
      </Card>
    </div>
  )
}
