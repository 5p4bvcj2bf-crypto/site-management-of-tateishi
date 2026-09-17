import { useMemo, useState } from 'react'
import { CalendarDays, ClipboardList, CloudSun, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FacilityTypeBadge } from '@/components/badges'
import { ReadOnlyGuard } from '@/components/ReadOnlyGuard'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { GenbaStore } from '@/lib/store'
import { fmtDate, todayStr } from '@/lib/store'
import type { DailyReport, Weather } from '@/types'

const WEATHERS: Weather[] = ['晴', '曇', '雨', '雪']

const WEATHER_ICON: Record<Weather, string> = {
  晴: '☀️',
  曇: '☁️',
  雨: '🌧️',
  雪: '❄️',
}

function emptyReport(siteId: string): Omit<DailyReport, 'id'> {
  return {
    siteId,
    date: todayStr(),
    weather: '晴',
    workers: 0,
    progress: 0,
    workContent: '',
    safetyMeeting: true,
    incidents: 'なし',
    notes: '',
    createdBy: '',
  }
}

export default function ReportsPage({ store }: { store: GenbaStore }) {
  const { data, siteById } = store
  const [filterSite, setFilterSite] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DailyReport | null>(null)
  const [form, setForm] = useState<Omit<DailyReport, 'id'>>(emptyReport(''))
  const [deleting, setDeleting] = useState<DailyReport | null>(null)

  const today = todayStr()
  const activeSites = data.sites.filter((s) => s.status === '施工中')
  const reportedToday = new Set(
    data.reports.filter((r) => r.date === today).map((r) => r.siteId)
  )

  const reports = useMemo(
    () =>
      [...data.reports]
        .filter((r) => filterSite === 'all' || r.siteId === filterSite)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [data.reports, filterSite]
  )

  const openNew = () => {
    setEditing(null)
    setForm(emptyReport(activeSites[0]?.id ?? data.sites[0]?.id ?? ''))
    setDialogOpen(true)
  }

  const openEdit = (r: DailyReport) => {
    setEditing(r)
    const { id: _id, ...rest } = r
    setForm(rest)
    setDialogOpen(true)
  }

  const save = () => {
    if (!form.siteId) {
      toast.error('現場を選択してください')
      return
    }
    if (!form.workContent.trim()) {
      toast.error('作業内容を入力してください')
      return
    }
    if (editing) {
      store.updateReport({ ...form, id: editing.id })
      toast.success('日次報告を更新しました')
    } else {
      store.addReport({ ...form, createdBy: store.currentMemberId })
      toast.success('日次報告を登録しました')
    }
    setDialogOpen(false)
  }

  const readOnly = editing ? !store.canEdit(editing.createdBy) : false

  const set = <K extends keyof Omit<DailyReport, 'id'>>(k: K, v: Omit<DailyReport, 'id'>[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="space-y-4">
      {/* 本日の提出状況 */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-semibold">本日 ({fmtDate(today)}) の日次確認状況</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeSites.length === 0 && (
              <span className="text-sm text-muted-foreground">施工中の現場はありません</span>
            )}
            {activeSites.map((s) => (
              <Badge
                key={s.id}
                variant="outline"
                className={
                  reportedToday.has(s.id)
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }
              >
                {s.name}: {reportedToday.has(s.id) ? '提出済み' : '未提出'}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={filterSite} onValueChange={setFilterSite}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="現場で絞り込み" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての現場</SelectItem>
            {data.sites.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                【{s.facilityType}】{s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="gap-1.5">
          <Plus className="h-4 w-4" />
          日次報告を追加
        </Button>
      </div>

      <div className="space-y-3">
        {reports.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              日次報告がまだ登録されていません
            </CardContent>
          </Card>
        )}
        {reports.map((r) => {
          const site = siteById(r.siteId)
          return (
            <Card key={r.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{site?.name ?? '（削除された現場）'}</span>
                      {site && <FacilityTypeBadge type={site.facilityType} />}
                      <Badge variant="secondary" className="gap-1">
                        <CloudSun className="h-3 w-3" />
                        {WEATHER_ICON[r.weather]} {r.weather}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <ClipboardList className="h-3 w-3" />
                        進捗 {r.progress}%
                      </Badge>
                      {r.safetyMeeting ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        >
                          安全朝礼 実施
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                        >
                          安全朝礼 未実施
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(r.date)} ・ 作業員 {r.workers}名 ・ 担当: {site?.manager ?? '—'} ・
                      施工: {site?.contractor ?? '—'} ・ 報告者:{' '}
                      {store.memberById(r.createdBy)?.name ?? '—'}
                      {store.canEdit(r.createdBy) ? '' : '（閲覧のみ）'}
                    </p>
                    <p className="text-sm">{r.workContent}</p>
                    {r.incidents && r.incidents !== 'なし' && (
                      <p className="text-sm text-red-600">⚠ 事故・ヒヤリハット: {r.incidents}</p>
                    )}
                    {r.notes && <p className="text-sm text-muted-foreground">特記: {r.notes}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {store.canEdit(r.createdBy) ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          編集
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-600"
                          onClick={() => setDeleting(r)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
                        詳細
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 登録・編集ダイアログ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? `日次報告を編集${readOnly ? '（閲覧のみ）' : ''}` : '日次報告を新規登録'}
            </DialogTitle>
          </DialogHeader>
          <div className={`relative grid gap-4${readOnly ? ' pt-8' : ''}`}>
            <ReadOnlyGuard show={readOnly} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>現場 <span className="text-red-500">*</span></Label>
                <Select value={form.siteId} onValueChange={(v) => set('siteId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="現場を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.sites.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        【{s.facilityType}】{s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-date">日付</Label>
                <Input
                  id="r-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>天気</Label>
                <Select value={form.weather} onValueChange={(v) => set('weather', v as Weather)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEATHERS.map((w) => (
                      <SelectItem key={w} value={w}>
                        {WEATHER_ICON[w]} {w}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-workers">作業員数</Label>
                <Input
                  id="r-workers"
                  type="number"
                  min={0}
                  value={form.workers}
                  onChange={(e) => set('workers', Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-progress">進捗率 (%)</Label>
                <Input
                  id="r-progress"
                  type="number"
                  min={0}
                  max={100}
                  value={form.progress}
                  onChange={(e) => set('progress', Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-content">作業内容 <span className="text-red-500">*</span></Label>
              <Textarea
                id="r-content"
                rows={3}
                value={form.workContent}
                onChange={(e) => set('workContent', e.target.value)}
                placeholder="例: 3階コンクリート打設、型枠組立…"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="r-safety"
                checked={form.safetyMeeting}
                onCheckedChange={(v) => set('safetyMeeting', v === true)}
              />
              <Label htmlFor="r-safety" className="cursor-pointer">
                朝礼・安全ミーティングを実施
              </Label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-incidents">事故・ヒヤリハット</Label>
              <Input
                id="r-incidents"
                value={form.incidents}
                onChange={(e) => set('incidents', e.target.value)}
                placeholder="なし の場合は「なし」のまま"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-notes">特記事項</Label>
              <Textarea
                id="r-notes"
                rows={2}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="近隣挨拶、資材入場、今後の予定など"
              />
            </div>
          </div>
          <DialogFooter>
            {readOnly ? (
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                閉じる
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={save}>{editing ? '更新する' : '登録する'}</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認 */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>日次報告を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {fmtDate(deleting?.date ?? '')} の報告を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleting) {
                  store.removeReport(deleting.id)
                  toast.success('日次報告を削除しました')
                }
                setDeleting(null)
              }}
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
