import { createClient } from '@/lib/supabase/server'
import { AuditLogTable } from './audit-log-table'

export const dynamic = 'force-dynamic'

export default async function ZurnalPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string; operation?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (params.table) {
    query = query.eq('table_name', params.table)
  }
  if (params.operation) {
    query = query.eq('operation', params.operation)
  }
  if (params.from) {
    query = query.gte('created_at', params.from)
  }
  if (params.to) {
    query = query.lte('created_at', `${params.to}T23:59:59`)
  }

  const { data: logs } = await query

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Žurnál aktivít</h1>
        <p className="text-muted-foreground">
          História všetkých zmien v systéme
        </p>
      </div>

      <AuditLogTable
        logs={logs || []}
        initialFilters={{
          table: params.table,
          operation: params.operation,
          from: params.from,
          to: params.to,
        }}
      />
    </div>
  )
}
