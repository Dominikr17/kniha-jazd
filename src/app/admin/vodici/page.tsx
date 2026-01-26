import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Users } from 'lucide-react'
import { Driver } from '@/types'
import { DeleteDriverButton } from './delete-button'

export default async function DriversPage() {
  const supabase = await createClient()

  const { data: drivers, error } = await supabase
    .from('drivers')
    .select('*')
    .order('last_name', { ascending: true })

  if (error) {
    console.error('Error loading drivers:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vodiči</h1>
          <p className="text-muted-foreground">Správa vodičov vozového parku</p>
        </div>
        <Button asChild>
          <Link href="/admin/vodici/novy">
            <Plus className="mr-2 h-4 w-4" />
            Pridať vodiča
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Zoznam vodičov
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!drivers || drivers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Zatiaľ neboli pridaní žiadni vodiči.</p>
              <Button asChild className="mt-4">
                <Link href="/admin/vodici/novy">Pridať prvého vodiča</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meno</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefón</TableHead>
                  <TableHead className="w-[100px]">Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(drivers as Driver[]).map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">
                      {driver.first_name} {driver.last_name}
                    </TableCell>
                    <TableCell>{driver.email || '-'}</TableCell>
                    <TableCell>{driver.phone || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/vodici/${driver.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteDriverButton id={driver.id} name={`${driver.first_name} ${driver.last_name}`} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
