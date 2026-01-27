import { createClient } from '@/lib/supabase/client'

interface AuditLogParams {
  tableName: string
  recordId: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  userType: 'admin' | 'driver'
  userId?: string | null
  userName?: string | null
  oldData?: Record<string, unknown> | null
  newData?: Record<string, unknown> | null
  description?: string
}

export async function logAudit(params: AuditLogParams) {
  const supabase = createClient()

  const opText = { INSERT: 'vytvoril', UPDATE: 'upravil', DELETE: 'zmazal' }
  const description = params.description ||
    `${params.userName || 'Používateľ'} ${opText[params.operation]} záznam`

  await supabase.from('audit_logs').insert({
    table_name: params.tableName,
    record_id: params.recordId,
    operation: params.operation,
    user_type: params.userType,
    user_id: params.userId,
    user_name: params.userName,
    old_data: params.oldData,
    new_data: params.newData,
    description
  })
}
