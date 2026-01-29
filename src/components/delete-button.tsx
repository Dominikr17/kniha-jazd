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

type TableName = 'trips' | 'fuel_records' | 'drivers' | 'vehicles'
type UserType = 'admin' | 'driver'

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
  itemLabel,
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

    const { data: oldData } = await supabase.from(tableName).select('*').eq('id', recordId).single()
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
