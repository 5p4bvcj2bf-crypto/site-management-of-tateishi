import {
  AlertTriangle,
  Building2,
  CalendarClock,
  ClipboardCheck,
  FileWarning,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClaimStatusBadge, DeadlineBadge, FacilityTypeBadge, PriorityBadge } from '@/components/badges'
import type { GenbaStore } from '@/lib/store'
import { daysUntil, fmtDate, todayStr } from '@/lib/store'
import type { ClaimPriority } from '@/types'

const PRIORITY_ORDER: ClaimPriority[] = ['高', '中', '低']

export default function Dashboard({
  store,
  goClaims,
  goReports,
}: {
  store: GenbaStore
  goClaims: () => void
  goReports: () => void
}) {
  const { data, siteById } = store
  const today = todayStr()

  const activeSites = data.sites.filter((s) => s.status === '施工中')
  const todayReports = data.reports.filter((r) => r.date === today)
  const reportedSiteIds = new Set(todayReports.map((r) => r.siteId))
  const pendingSites = activeSites.filter((s) => !reportedSiteIds.has(s.id))

  const openClaims = data.claims.filter((c) => c.status !== '完了')
  const overdue = openClaims.filter((c) => daysUntil(c.deadline) < 0)
  const dueSoon = openClaims.filter((c) => {
    const d = daysUntil(c.deadline)
    return d >= 0 && d <= 3
  })
  const highClaims = openClaims.filter((c) => c.priority === '高')

  const urgent = [...openClaims]
    .sort((a, b) => daysUntil(a.deadline) - daysUntil(b.deadline))
    .slice(0, 6)

  const priorityCounts = PRIORITY_ORDER.map((p) => ({
    name: `重要度 ${p}`,
    count: data.claims.filter((c) => c.priority === p && c.status !== '完了').length,
  }))
  const statusCounts = (['未対応', '対応中', '完了'] as const).map((st) => ({
    name: st,
    count: data.claims.filter((c) => c.status === st).length,
  }))
  const maxPrio = Math.max(1, ...priorityCounts.map((p) => p.count))
  const maxStat = Math.max(1, ...statusCounts.map((p) => p.count))
  const typeCounts = (['キッチン', 'ユニットバス'] as const).map((t) => ({
    name: t,
    count: openClaims.filter((c) => siteById(c.siteId)?.facilityType === t).length,
  }))
  const maxType = Math.max(1, ...typeCounts.map((p) => p.count))

  const stats = [
    {
      label: '管理中の現場',
      value: data.sites.length,
      sub: `キッチン ${data.sites.filter((s) => s.facilityType === 'キッチン').length} / ユニットバス ${
        data.sites.filter((s) => s.facilityType === 'ユニットバス').length
      }`,
      icon: Building2,
      tone: 'text-sky-600 bg-sky-50 dark:bg-sky-950',
    },
    {
      label: '本日の日次確認',
      value: `${todayReports.length} / ${activeSites.length}`,
      sub: pendingSites.length > 0 ? `未提出 ${pendingSites.length}件` : '全現場提出済み',
      icon: ClipboardCheck,
      tone: pendingSites.length > 0 ? 'text-amber-600 bg-amber-50 dark:bg-amber-950' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
      onClick: goReports,
    },
    {
      label: '未完了クレーム',
      value: openClaims.length,
      sub: `対応中 ${openClaims.filter((c) => c.status === '対応中').length} / 未対応 ${openClaims.filter((c) => c.status === '未対応').length}`,
      icon: FileWarning,
      tone: 'text-orange-600 bg-orange-50 dark:bg-orange-950',
      onClick: goClaims,
    },
    {
      label: '期限超過 / 間近',
      value: `${overdue.length} / ${dueSoon.length}`,
      sub: overdue.length > 0 ? '要即対応あり' : '超過なし',
      icon: AlertTriangle,
      tone: overdue.length > 0 ? 'text-red-600 bg-red-50 dark:bg-red-950' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
      onClick: goClaims,
    },
  ]

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <Card
            key={s.label}
            className={s.onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}
            onClick={s.onClick}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg p-3 ${s.tone}`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold leading-tight">{s.value}</p>
                <p className="truncate text-xs text-muted-foreground">{s.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 期限が近いクレーム */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-orange-600" />
              対応期限が近いクレーム
            </CardTitle>
            <button
              className="text-xs font-medium text-orange-600 hover:underline"
              onClick={goClaims}
            >
              すべて見る →
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgent.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                未完了のクレームはありません
              </p>
            )}
            {urgent.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <PriorityBadge priority={c.priority} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{c.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.code} ・ {siteById(c.siteId)?.name ?? '—'} ・ 担当: {c.manager} ・ 期限{' '}
                    {fmtDate(c.deadline)}
                  </p>
                </div>
                {siteById(c.siteId) && (
                  <FacilityTypeBadge type={siteById(c.siteId)!.facilityType} />
                )}
                <div className="flex shrink-0 items-center gap-2">
                  <DeadlineBadge deadline={c.deadline} done={false} />
                  <ClaimStatusBadge status={c.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 集計 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-sky-600" />
              クレーム集計
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">ステータス別（全期間）</p>
              <div className="space-y-2">
                {statusCounts.map((s) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <span className="w-12 text-xs">{s.name}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-slate-700 dark:bg-slate-300"
                        style={{ width: `${(s.count / maxStat) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-xs font-semibold">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">重要度別（未完了）</p>
              <div className="space-y-2">
                {priorityCounts.map((p) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <span className="w-12 text-xs">{p.name.replace('重要度 ', '')}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${
                          p.name.includes('高')
                            ? 'bg-red-500'
                            : p.name.includes('中')
                              ? 'bg-amber-500'
                              : 'bg-sky-500'
                        }`}
                        style={{ width: `${(p.count / maxPrio) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-xs font-semibold">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">種別別（未完了）</p>
              <div className="space-y-2">
                {typeCounts.map((t) => (
                  <div key={t.name} className="flex items-center gap-2">
                    <span className="w-20 text-xs">{t.name}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${
                          t.name === 'キッチン' ? 'bg-orange-500' : 'bg-cyan-600'
                        }`}
                        style={{ width: `${(t.count / maxType) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-xs font-semibold">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
              重要度「高」の未対応クレームは{' '}
              <span className="font-bold text-red-600">{highClaims.length}件</span>
              です。期限超過 {overdue.length}件・今週中 {dueSoon.length}件を優先確認してください。
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
