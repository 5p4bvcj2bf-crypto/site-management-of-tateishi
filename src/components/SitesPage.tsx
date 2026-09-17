import { useState } from 'react'
import { ChefHat, MapPin, Pencil, Plus, Trash2, Bath } from 'lucide-react'
import { toast } from 'sonner'
import { FacilityTypeBadge, SiteStatusBadge } from '@/components/badges'
import { ReadOnlyGuard } from '@/components/ReadOnlyGuard'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { GenbaStore } from '@/lib/store'
import { fmtDate } from '@/lib/store'
import type { Site, SiteStatus, FacilityType } from '@/types'

const STATUS_OPTIONS: SiteStatus[] = ['計画中', '施工中', '一時中断', '完了']
const FACILITY_TYPES: FacilityType[] = ['キッチン', 'ユニットバス']

const EMPTY: Omit<Site, 'id'> = {
  name: '',
  facilityType: 'キッチン',
  manager: '',
  contractor: '',
  status: '計画中',
  location: '',
  startDate: '',
  endDate: '',
  progress: 0,
  createdBy: '',
}

export default function SitesPage({ store }: { store: GenbaStore }) {
  const { data } = store
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Site | null>(null)
  const [form, setForm] = useState<Omit<Site, 'id'>>(EMPTY)
  const [deleting, setDeleting] = useState<Site | null>(null)
  const [filterType, setFilterType] = useState<'all' | FacilityType>('all')

  const visibleSites =
    filterType === 'all' ? data.sites : data.sites.filter((s) => s.facilityType === filterType)

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY)
    setDialogOpen(true)
  }

  const openEdit = (s: Site) => {
    setEditing(s)
    setForm({ ...s })
    setDialogOpen(true)
  }

  const save = () => {
    if (!form.name.trim() || !form.manager.trim() || !form.contractor.trim()) {
      toast.error('現場名・担当者・施工会社は必須です')
      return
    }
    if (editing) {
      store.updateSite({ ...form, id: editing.id })
      toast.success(`「${form.name}」を更新しました`)
    } else {
      store.addSite({ ...form, createdBy: store.currentUserName })
      toast.success(`「${form.name}」を登録しました`)
    }
    setDialogOpen(false)
  }

  const claimCount = (siteId: string) =>
    data.claims.filter((c) => c.siteId === siteId && c.status !== '完了').length

  const readOnly = editing ? !store.canEdit(editing.createdBy) : false

  const set = <K extends keyof Omit<Site, 'id'>>(k: K, v: Omit<Site, 'id'>[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての種別</SelectItem>
              {FACILITY_TYPES.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}のみ
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{visibleSites.length}</span> 件
            （キッチン {data.sites.filter((s) => s.facilityType === 'キッチン').length} / ユニットバス{' '}
            {data.sites.filter((s) => s.facilityType === 'ユニットバス').length}）
          </p>
        </div>
        <Button onClick={openNew} className="gap-1.5">
          <Plus className="h-4 w-4" />
          現場を追加
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleSites.map((s) => {
          const claims = claimCount(s.id)
          return (
            <Card key={s.id} className="transition-shadow hover:shadow-md">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`rounded-lg p-2 ${
                        s.facilityType === 'キッチン'
                          ? 'bg-orange-50 dark:bg-orange-950'
                          : 'bg-cyan-50 dark:bg-cyan-950'
                      }`}
                    >
                      {s.facilityType === 'キッチン' ? (
                        <ChefHat className="h-5 w-5 text-orange-600" />
                      ) : (
                        <Bath className="h-5 w-5 text-cyan-700" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">{s.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {s.location || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <SiteStatusBadge status={s.status} />
                    <FacilityTypeBadge type={s.facilityType} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">担当者</p>
                    <p className="font-medium">{s.manager}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">施工会社</p>
                    <p className="font-medium">{s.contractor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">着工日</p>
                    <p className="font-medium">{fmtDate(s.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">完了予定</p>
                    <p className="font-medium">{fmtDate(s.endDate)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">登録者</p>
                    <p className="font-medium">
                      {s.createdBy || '—'}
                      {store.canEdit(s.createdBy) ? '' : '（閲覧のみ）'}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">進捗</span>
                    <span className="font-semibold">{s.progress}%</span>
                  </div>
                  <Progress value={s.progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <span
                    className={`text-xs font-medium ${
                      claims > 0 ? 'text-red-600' : 'text-muted-foreground'
                    }`}
                  >
                    未完了クレーム {claims}件
                  </span>
                  {store.canEdit(s.createdBy) ? (
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        編集
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-600"
                        onClick={() => setDeleting(s)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                      詳細
                    </Button>
                  )}
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
              {editing ? `現場を編集${readOnly ? '（閲覧のみ）' : ''}` : '現場を新規登録'}
            </DialogTitle>
          </DialogHeader>
          <div className={`relative grid gap-4${readOnly ? ' pt-8' : ''}`}>
            <ReadOnlyGuard show={readOnly} />
            <div className="space-y-1.5">
              <Label htmlFor="site-name">現場名 <span className="text-red-500">*</span></Label>
              <Input
                id="site-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>設備種別 <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-2">
                {FACILITY_TYPES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => set('facilityType', f)}
                    className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                      form.facilityType === f
                        ? f === 'キッチン'
                          ? 'border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                          : 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300'
                        : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/40'
                    }`}
                  >
                    {f === 'キッチン' ? (
                      <ChefHat className="h-4 w-4" />
                    ) : (
                      <Bath className="h-4 w-4" />
                    )}
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="site-manager">担当者 <span className="text-red-500">*</span></Label>
                <Input
                  id="site-manager"
                  value={form.manager}
                  onChange={(e) => set('manager', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="site-contractor">施工会社 <span className="text-red-500">*</span></Label>
                <Input
                  id="site-contractor"
                  value={form.contractor}
                  onChange={(e) => set('contractor', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="site-location">所在地</Label>
              <Input
                id="site-location"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="site-start">着工日</Label>
                <Input
                  id="site-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="site-end">完了予定日</Label>
                <Input
                  id="site-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => set('endDate', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>ステータス</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v as SiteStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="site-progress">進捗率 ({form.progress}%)</Label>
                <Input
                  id="site-progress"
                  type="number"
                  min={0}
                  max={100}
                  value={form.progress}
                  onChange={(e) =>
                    set('progress', Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                  }
                />
              </div>
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
            <AlertDialogTitle>現場を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleting?.name}」を削除します。この現場に紐づく日次報告・クレームは削除されません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleting) {
                  store.removeSite(deleting.id)
                  toast.success(`「${deleting.name}」を削除しました`)
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
