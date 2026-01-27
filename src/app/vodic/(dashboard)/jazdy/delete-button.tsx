'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { logAudit } from '@/lib/audit-logger'

interface DeleteTripButtonProps {
  tripId: string
  driverId: string
  driverName: string
  variant?: 'ghost' | 'outline' | 'destructive'
  size?: 'default' | 'sm' | 'icon'
}

export function DeleteTripButton({
  tripId,
  driverId,
  driverName,
  variant = 'ghost',
  size = 'icon',
}: DeleteTripButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setIsDeleting(true)

    const { data: oldData } = await supabase.from('trips').select('*').eq('id', tripId).single()
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)

    if (error) {
      toast.error('Nepodarilo sa zmazať jazdu')
      console.error(error)
      setIsDeleting(false)
      return
    }

    await logAudit({
      tableName: 'trips',
      recordId: tripId,
      operation: 'DELETE',
      userType: 'driver',
      userId: driverId,
      userName: driverName,
      oldData,
    })

    toast.success('Jazda bola zmazaná')
    setOpen(false)
    router.refresh()
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
          {size !== 'icon' && <span className="ml-1">Zmazať</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Zmazať jazdu?</AlertDialogTitle>
          <AlertDialogDescription>
            Táto akcia je nevratná. Jazda bude trvalo odstránená.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Zrušiť</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mazanie...
              </>
            ) : (
              'Zmazať'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
