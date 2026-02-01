'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { logAudit } from '@/lib/audit-logger'
import { DRIVER_EDIT_TIME_LIMIT_MINUTES } from '@/types'

type TableName = 'trips' | 'fuel_records' | 'drivers' | 'vehicles' | 'fuel_inventory'
type UserType = 'admin' | 'driver'

// Validácia časového limitu pre vodičov
function isWithinEditTimeLimit(createdAt: string): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const diffMinutes = (now.getTime() - created.getTime()) / (1000 * 60)
  return diffMinutes <= DRIVER_EDIT_TIME_LIMIT_MINUTES
}

interface DeleteButtonProps {
  tableName: TableName
  recordId: string
  itemLabel: string
  dialogTitle: string
  dialogDescription: string
  successMessage: string
  errorMessage: string
  userType?: UserType
  userId?: string
  userName?: string
  variant?: 'ghost' | 'outline' | 'destructive'
  size?: 'default' | 'sm' | 'icon'
  showLabel?: boolean
}

export function DeleteButton({
  tableName,
  recordId,
  dialogTitle,
  dialogDescription,
  successMessage,
  errorMessage,
  userType = 'admin',
  userId,
  userName,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
}: DeleteButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setIsDeleting(true)

    // Načítať záznam pred vymazaním
    const { data: oldData, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', recordId)
      .single()

    if (fetchError || !oldData) {
      toast.error('Záznam nebol nájdený')
      setIsDeleting(false)
      return
    }

    // Ownership a časová validácia pre vodičov
    if (userType === 'driver' && userId) {
      // Pre trips a fuel_records overiť driver_id
      if ((tableName === 'trips' || tableName === 'fuel_records') && oldData.driver_id !== userId) {
        toast.error('Nemáte oprávnenie vymazať tento záznam')
        setIsDeleting(false)
        return
      }

      // Časový limit pre mazanie (rovnaký ako pre úpravu)
      if ((tableName === 'trips' || tableName === 'fuel_records') && oldData.created_at) {
        if (!isWithinEditTimeLimit(oldData.created_at)) {
          toast.error(`Čas na vymazanie vypršal (limit ${DRIVER_EDIT_TIME_LIMIT_MINUTES} minút)`)
          setIsDeleting(false)
          return
        }
      }
    }

    const { error } = await supabase.from(tableName).delete().eq('id', recordId)

    if (error) {
      toast.error(errorMessage)
      setIsDeleting(false)
      return
    }

    let auditUserId = userId
    let auditUserName = userName

    if (userType === 'admin' && !userId) {
      const { data: { user } } = await supabase.auth.getUser()
      auditUserId = user?.id
      auditUserName = user?.email
    }

    await logAudit({
      tableName,
      recordId,
      operation: 'DELETE',
      userType,
      userId: auditUserId,
      userName: auditUserName,
      oldData,
    })

    toast.success(successMessage)
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
          {showLabel && <span className="ml-1">Zmazať</span>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            Zrušiť
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mazanie...
              </>
            ) : (
              'Vymazať'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
