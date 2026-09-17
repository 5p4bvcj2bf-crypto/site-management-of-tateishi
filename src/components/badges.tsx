import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ClaimPriority, ClaimStatus, FacilityType, SiteStatus } from '@/types'

/** 設備種別バッジ: キッチン / ユニットバス */
export function FacilityTypeBadge({ type }: { type: FacilityType }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-semibold',
        type === 'キッチン'
          ? 'border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
          : 'border-cyan-600 bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300'
      )}
    >
      {type === 'キッチン' ? 'キッチン' : 'ユニットバス'}
    </Badge>
  )
}

export function PriorityBadge({ priority }: { priority: ClaimPriority }) {
  return (
    <Badge
      className={cn(
        'border-0 font-semibold',
        priority === '高' && 'bg-red-600 text-white hover:bg-red-600',
        priority === '中' && 'bg-amber-500 text-white hover:bg-amber-500',
        priority === '低' && 'bg-sky-600 text-white hover:bg-sky-600'
      )}
    >
      {priority}
    </Badge>
  )
}

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold',
        status === '未対応' && 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
        status === '対応中' && 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        status === '完了' && 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      )}
    >
      {status}
    </Badge>
  )
}

export function SiteStatusBadge({ status }: { status: SiteStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold',
        status === '施工中' && 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        status === '計画中' && 'border-sky-300 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
        status === '一時中断' && 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        status === '完了' && 'border-slate-300 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
      )}
    >
      {status}
    </Badge>
  )
}

/** 期限に応じた表示バッジ。残り日数または超過日数 */
export function DeadlineBadge({ deadline, done }: { deadline: string; done: boolean }) {
  if (done) {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  const diff = daysUntilLocal(deadline)
  if (diff < 0) {
    return (
      <Badge className="border-0 bg-red-600 text-white hover:bg-red-600">
        期限超過 {Math.abs(diff)}日
      </Badge>
    )
  }
  if (diff === 0) {
    return <Badge className="border-0 bg-red-500 text-white hover:bg-red-500">今日期限</Badge>
  }
  if (diff <= 3) {
    return (
      <Badge className="border-0 bg-amber-500 text-white hover:bg-amber-500">残り{diff}日</Badge>
    )
  }
  return <span className="text-sm text-muted-foreground">残り{diff}日</span>
}

function daysUntilLocal(date: string): number {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const a = new Date(today + 'T00:00:00')
  const b = new Date(date + 'T00:00:00')
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}
