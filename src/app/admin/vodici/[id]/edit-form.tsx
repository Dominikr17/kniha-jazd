'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Driver } from '@/types'

interface EditDriverFormProps {
  driver: Driver
}

export function EditDriverForm({ driver }: EditDriverFormProps) {
  const [firstName, setFirstName] = useState(driver.first_name)
  const [lastName, setLastName] = useState(driver.last_name)
  const [email, setEmail] = useState(driver.email || '')
  const [phone, setPhone] = useState(driver.phone || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { error } = await supabase
      .from('drivers')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
      })
      .eq('id', driver.id)

    if (error) {
      toast.error('Nepodarilo sa uložiť zmeny')
      setIsSubmitting(false)
      return
    }

    toast.success('Zmeny boli uložené')
    router.push('/admin/vodici')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">Meno *</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Priezvisko *</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefón</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ukladám...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Uložiť zmeny
            </>
          )}
        </Button>
        <Button type="button" variant="outline" asChild disabled={isSubmitting}>
          <Link href="/admin/vodici">Zrušiť</Link>
        </Button>
      </div>
    </form>
  )
}
