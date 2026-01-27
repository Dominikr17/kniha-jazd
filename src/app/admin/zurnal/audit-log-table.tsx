'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, Filter, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { sk } from 'date-fns/locale'
import { AuditLog, AUDIT_TABLES, AUDIT_OPERATIONS } from '@/types'

interface AuditLogTableProps {
  logs: AuditLog[]
  initialFilters: {
    table?: string
    operation?: string
    from?: string
    to?: string
  }
}

function OperationBadge({ operation }: { operation: AuditLog['operation'] }) {
  const variants: Record<AuditLog['operation'], string> = {
    INSERT: 'bg-green-500 hover:bg-green-500',
    UPDATE: 'bg-blue-500 hover:bg-blue-500',
    DELETE: 'bg-red-500 hover:bg-red-500',
  }

  return (
    <Badge className={variants[operation]}>
      {AUDIT_OPERATIONS[operation]}
    </Badge>
  )
}

function DataDiff({ oldData, newData }: { oldData: Record<string, unknown> | null; newData: Record<string, unknown> | null }) {
  if (!oldData && !newData) {
    return <p className="text-muted-foreground">Žiadne dáta</p>
  }

  const allKeys = new Set([
    ...Object.keys(oldData || {}),
    ...Object.keys(newData || {}),
  ])

  const excludeKeys = ['id', 'created_at', 'updated_at']
  const filteredKeys = Array.from(allKeys).filter(key => !excludeKeys.includes(key))

  return (
    <div className="space-y-2 text-sm max-h-96 overflow-y-auto">
      {filteredKeys.map(key => {
        const oldVal = oldData?.[key]
        const newVal = newData?.[key]
        const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal)

        return (
          <div key={key} className={`p-2 rounded ${changed ? 'bg-yellow-50' : 'bg-gray-50'}`}>
            <span className="font-medium">{key}:</span>
            {oldData && newData ? (
              <div className="flex gap-2 mt-1">
                <span className="text-red-600 line-through">{JSON.stringify(oldVal)}</span>
                <span>→</span>
                <span className="text-green-600">{JSON.stringify(newVal)}</span>
              </div>
            ) : (
              <span className="ml-2">{JSON.stringify(newVal ?? oldVal)}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function AuditLogTable({ logs, initialFilters }: AuditLogTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tableFilter, setTableFilter] = useState(initialFilters.table || '')
  const [operationFilter, setOperationFilter] = useState(initialFilters.operation || '')
  const [fromDate, setFromDate] = useState(initialFilters.from || '')
  const [toDate, setToDate] = useState(initialFilters.to || '')

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (tableFilter) params.set('table', tableFilter)
    if (operationFilter) params.set('operation', operationFilter)
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)
    router.push(`/admin/zurnal?${params.toString()}`)
  }

  const clearFilters = () => {
    setTableFilter('')
    setOperationFilter('')
    setFromDate('')
    setToDate('')
    router.push('/admin/zurnal')
  }

  const hasFilters = tableFilter || operationFilter || fromDate || toDate

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label>Tabuľka</Label>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Všetky" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AUDIT_TABLES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Operácia</Label>
              <Select value={operationFilter} onValueChange={setOperationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Všetky" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AUDIT_OPERATIONS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Od</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Do</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={applyFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Filtrovať
              </Button>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Žiadne záznamy
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dátum a čas</TableHead>
                  <TableHead>Tabuľka</TableHead>
                  <TableHead>Operácia</TableHead>
                  <TableHead>Používateľ</TableHead>
                  <TableHead>Popis</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(parseISO(log.created_at), 'd.M.yyyy HH:mm', { locale: sk })}
                    </TableCell>
                    <TableCell>
                      {AUDIT_TABLES[log.table_name as keyof typeof AUDIT_TABLES] || log.table_name}
                    </TableCell>
                    <TableCell>
                      <OperationBadge operation={log.operation} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{log.user_name || '-'}</span>
                        <span className="text-xs text-muted-foreground">
                          {log.user_type === 'admin' ? 'Admin' : 'Vodič'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {log.description}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detail zmeny</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Dátum:</span>{' '}
                                {format(parseISO(log.created_at), 'd.M.yyyy HH:mm:ss', { locale: sk })}
                              </div>
                              <div>
                                <span className="text-muted-foreground">ID záznamu:</span>{' '}
                                <code className="text-xs">{log.record_id}</code>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Zmeny:</h4>
                              <DataDiff oldData={log.old_data} newData={log.new_data} />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
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
