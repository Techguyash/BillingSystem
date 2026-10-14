import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { downloadCsv } from '@/lib/csv'
import type { AuditLog } from '@/types/audit-log'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search } from 'lucide-react'

export function AuditLogPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => (await api.get<AuditLog[]>('/audit-logs')).data,
  })

  const filtered = useMemo(() => {
    if (!data) return []
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(
      (log) =>
        log.action.toLowerCase().includes(q) ||
        log.entityType.toLowerCase().includes(q) ||
        (log.userName ?? '').toLowerCase().includes(q) ||
        (log.description ?? '').toLowerCase().includes(q),
    )
  }, [data, search])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit Log</h1>
          <p className="text-sm text-muted-foreground">
            Every mutating action taken in this install — who did what, and when.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-1.5"
          disabled={!filtered.length}
          onClick={() =>
            downloadCsv(
              'audit-log.csv',
              ['Date', 'User', 'Action', 'Entity Type', 'Description'],
              filtered.map((log) => [
                new Date(log.createdAt).toISOString(),
                log.userName ?? '',
                log.action,
                log.entityType,
                log.description ?? '',
              ]),
            )
          }
        >
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="relative mb-4 max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by user, action, or description..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {isError && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-destructive">
                    Failed to load audit log: {getErrorMessage(error, 'Something went wrong.')}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !isError && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No matching activity.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="font-medium">{log.userName ?? 'System'}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{log.action}</code>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.entityType}</TableCell>
                  <TableCell>{log.description ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
