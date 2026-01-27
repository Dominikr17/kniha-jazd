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

interface DeleteDriverButtonProps {
  id: string
  name: string
}

export function DeleteDriverButton({ id, name }: DeleteDriverButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setIsDeleting(true)

    const { data: oldData } = await supabase.from('drivers').select('*').eq('id', id).single()
    const { error } = await supabase.from('drivers').delete().eq('id', id)

    if (error) {
      toast.error('Nepodarilo sa vymazať vodiča')
      setIsDeleting(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    await logAudit({
      tableName: 'drivers',
      recordId: id,
      operation: 'DELETE',
      userType: 'admin',
      userId: user?.id,
      userName: user?.email,
      oldData,
    })

    toast.success('Vodič bol vymazaný')
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vymazať vodiča</DialogTitle>
          <DialogDescription>
            Naozaj chcete vymazať vodiča <strong>{name}</strong>? Táto akcia sa nedá vrátiť späť.
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
