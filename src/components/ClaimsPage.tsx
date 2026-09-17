import { useMemo, useState } from 'react'
import { FileWarning, Pencil, Plus, Search, Trash2 } from 'lucide-react'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  ClaimStatusBadge,
  DeadlineBadge,
  FacilityTypeBadge,
  PriorityBadge,
} from '@/components/badges'
import { ReadOnlyGuard } from '@/components/ReadOnlyGuard'
import type { GenbaStore } from '@/lib/store'
import { daysUntil, fmtDate, todayStr } from '@/lib/store'
import type { Claim, ClaimPriority, ClaimStatus, FacilityType } from '@/types'

const PRIORITIES: ClaimPriority[] = ['高', '中', '低']
const STATUSES: ClaimStatus[] = ['未対応', '対応中', '完了']

function emptyClaim(): Omit<Claim, 'id' | 'code'> {
  return {
    receivedDate: todayStr(),
    siteId: '',
    manager: '',
    contractor: '',
    title: '',
    content: '',
    priority: '中',
    status: '未対応',
    deadline: '',
    completedDate: undefined,
    createdBy: '',
  }
}

export default function ClaimsPage({ store }: { store: GenbaStore }) {
  const { data, siteById } = store
  const [fStatus, setFStatus] = useState<'all' | ClaimStatus>('all')
  const [fPriority, setFPriority] = useState<'all' | ClaimPriority>('all')
  const [fType, setFType] = useState<'all' | FacilityType>('all')
  const [fKeyword, setFKeyword] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Claim | null>(null)
  const [form, setForm] = useState<Omit<Claim, 'id' | 'code'>>(emptyClaim())
  const [deleting, setDeleting] = useState<Claim | null>(null)

  const claims = useMemo(() => {
    const kw = fKeyword.trim()
    return [...data.claims]
      .filter((c) => fStatus === 'all' || c.status === fStatus)
      .filter((c) => fPriority === 'all' || c.priority === fPriority)
      .filter((c) => fType === 'all' || siteById(c.siteId)?.facilityType === fType)
      .filter((c) => {
        if (!kw) return true
        const site = siteById(c.siteId)
        const hay = [c.code, c.title, c.content, c.manager, c.contractor, site?.name ?? ''].join(' ')
        return hay.includes(kw)
      })
      .sort((a, b) => {
        // 未完了を優先、その後は期限が近い順
        const doneA = a.status === '完了' ? 1 : 0
        const doneB = b.status === '完了' ? 1 : 0
        if (doneA !== doneB) return doneA - doneB
        return daysUntil(a.deadline) - daysUntil(b.deadline)
      })
  }, [data.claims, fStatus, fPriority, fType, fKeyword, siteById])

  const openNew = () => {
    setEditing(null)
    const first = data.sites[0]
    setForm({
      ...emptyClaim(),
      siteId: first?.id ?? '',
      manager: first?.manager ?? '',
      contractor: first?.contractor ?? '',
    })
    setDialogOpen(true)
  }

  const openEdit = (c: Claim) => {
    setEditing(c)
    const { id: _id, code: _code, ...rest } = c
    setForm(rest)
    setDialogOpen(true)
  }

  const save = () => {
    if (!form.siteId) {
      toast.error('現場を選択してください')
      return
    }
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('件名・クレーム内容は必須です')
      return
    }
    if (!form.manager.trim() || !form.contractor.trim()) {
      toast.error('担当者・施工会社は必須です')
      return
    }
    if (!form.deadline) {
      toast.error('対応期限(納期)を設定してください')
      return
    }
    // 完了にする場合は完了日を自動セット
    const payload = {
      ...form,
      completedDate:
        form.status === '完了' ? (form.completedDate ?? todayStr()) : undefined,
    }
    if (editing) {
      store.updateClaim({ ...payload, id: editing.id, code: editing.code })
      toast.success(`クレーム ${editing.code} を更新しました`)
    } else {
      store.addClaim({ ...payload, createdBy: store.currentUserName })
      toast.success('クレームを登録しました')
    }
    setDialogOpen(false)
  }

  const readOnly = editing ? !store.canEdit(editing.createdBy) : false

  const quickStatus = (c: Claim, status: ClaimStatus) => {
    store.updateClaim({
      ...c,
      status,
      completedDate: status === '完了' ? todayStr() : undefined,
    })
    toast.success(`${c.code} を「${status}」に更新しました`)
  }

  const set = <K extends keyof Omit<Claim, 'id' | 'code'>>(k: K, v: Omit<Claim, 'id' | 'code'>[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  // 現場選択時に担当者・施工会社を自動補完
  const pickSite = (siteId: string) => {
    const site = siteById(siteId)
    setForm((f) => ({
      ...f,
      siteId,
      manager: site?.manager || f.manager,
      contractor: site?.contractor || f.contractor,
    }))
  }

  const openCount = data.claims.filter((c) => c.status !== '完了').length
  const overdueCount = data.claims.filter(
    (c) => c.status !== '完了' && daysUntil(c.deadline) < 0
  ).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1 px-3 py-1.5">
            <FileWarning className="h-3.5 w-3.5" />
            未完了 {openCount}件
          </Badge>
          <Badge
            variant="outline"
            className={`px-3 py-1.5 ${overdueCount > 0 ? 'border-red-300 bg-red-50 font-bold text-red-700 dark:bg-red-950 dark:text-red-300' : ''}`}
          >
            期限超過 {overdueCount}件
          </Badge>
        </div>
        <Button onClick={openNew} className="gap-1.5">
          <Plus className="h-4 w-4" />
          クレームを追加
        </Button>
      </div>

      {/* フィルタ */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="キーワード検索（番号・件名・内容・担当者…）"
              value={fKeyword}
              onChange={(e) => setFKeyword(e.target.value)}
            />
          </div>
          <Select value={fStatus} onValueChange={(v) => setFStatus(v as typeof fStatus)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての状態</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fPriority} onValueChange={(v) => setFPriority(v as typeof fPriority)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての重要度</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  重要度: {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fType} onValueChange={(v) => setFType(v as typeof fType)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての種別</SelectItem>
              <SelectItem value="キッチン">キッチンのみ</SelectItem>
              <SelectItem value="ユニットバス">ユニットバスのみ</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 一覧 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">番号</TableHead>
                  <TableHead className="w-24">受付日</TableHead>
                  <TableHead>件名 / 現場</TableHead>
                  <TableHead className="w-28">担当者</TableHead>
                  <TableHead className="w-36">施工会社</TableHead>
                  <TableHead className="w-20">重要度</TableHead>
                  <TableHead className="w-24">状態</TableHead>
                  <TableHead className="w-28">対応期限</TableHead>
                  <TableHead className="w-36 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      該当するクレームはありません
                    </TableCell>
                  </TableRow>
                )}
                {claims.map((c) => {
                  const overdue = c.status !== '完了' && daysUntil(c.deadline) < 0
                  return (
                    <TableRow key={c.id} className={overdue ? 'bg-red-50/60 dark:bg-red-950/20' : ''}>
                      <TableCell className="font-mono text-xs font-semibold">{c.code}</TableCell>
                      <TableCell className="text-sm">{fmtDate(c.receivedDate)}</TableCell>
                      <TableCell>
                        <p className="max-w-72 truncate text-sm font-medium" title={c.title}>
                          {c.title}
                        </p>
                        <p className="max-w-72 truncate text-xs text-muted-foreground">
                          {siteById(c.siteId)?.name ?? '（削除された現場）'}
                        </p>
                        <div className="mt-0.5">
                          {siteById(c.siteId) && (
                            <FacilityTypeBadge type={siteById(c.siteId)!.facilityType} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{c.manager}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.createdBy || '—'}
                          {store.canEdit(c.createdBy) ? '' : '（閲覧のみ）'}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">{c.contractor}</TableCell>
                      <TableCell>
                        <PriorityBadge priority={c.priority} />
                      </TableCell>
                      <TableCell>
                        <ClaimStatusBadge status={c.status} />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-xs">{fmtDate(c.deadline)}</p>
                          <DeadlineBadge deadline={c.deadline} done={c.status === '完了'} />
                        </div>
                      </TableCell>
                      <TableCell>
                        {store.canEdit(c.createdBy) ? (
                          <div className="flex justify-end gap-1">
                            {c.status === '未対応' && (
                              <Button variant="outline" size="sm" onClick={() => quickStatus(c, '対応中')}>
                                対応中へ
                              </Button>
                            )}
                            {c.status === '対応中' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-emerald-300 text-emerald-700 hover:text-emerald-700"
                                onClick={() => quickStatus(c, '完了')}
                              >
                                完了へ
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-600"
                              onClick={() => setDeleting(c)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                              詳細
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 登録・編集ダイアログ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? `クレーム編集 (${editing.code})${readOnly ? ' ― 閲覧のみ' : ''}`
                : 'クレームを新規登録'}
            </DialogTitle>
          </DialogHeader>
          <div className={`relative grid gap-4${readOnly ? ' pt-8' : ''}`}>
            <ReadOnlyGuard show={readOnly} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-received">受付日</Label>
                <Input
                  id="c-received"
                  type="date"
                  value={form.receivedDate}
                  onChange={(e) => set('receivedDate', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>現場 <span className="text-red-500">*</span></Label>
                <Select value={form.siteId} onValueChange={pickSite}>
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
                {siteById(form.siteId) && (
                  <div className="pt-1">
                    <FacilityTypeBadge type={siteById(form.siteId)!.facilityType} />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-manager">担当者 <span className="text-red-500">*</span></Label>
                <Input
                  id="c-manager"
                  value={form.manager}
                  onChange={(e) => set('manager', e.target.value)}
                  placeholder="例: 田中 健一"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-contractor">施工会社 <span className="text-red-500">*</span></Label>
                <Input
                  id="c-contractor"
                  value={form.contractor}
                  onChange={(e) => set('contractor', e.target.value)}
                  placeholder="例: 山田建設株式会社"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-title">件名 <span className="text-red-500">*</span></Label>
              <Input
                id="c-title"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="例: 近隣住民からの騒音クレーム"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-content">クレーム内容 <span className="text-red-500">*</span></Label>
              <Textarea
                id="c-content"
                rows={4}
                value={form.content}
                onChange={(e) => set('content', e.target.value)}
                placeholder="受け付けた内容、相手の要望、状況などを詳しく記入"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>重要度 <span className="text-red-500">*</span></Label>
                <Select value={form.priority} onValueChange={(v) => set('priority', v as ClaimPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>対応状態</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v as ClaimStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-deadline">対応期限(納期) <span className="text-red-500">*</span></Label>
                <Input
                  id="c-deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => set('deadline', e.target.value)}
                />
              </div>
            </div>
            {form.status === '完了' && (
              <div className="space-y-1.5">
                <Label htmlFor="c-completed">完了日</Label>
                <Input
                  id="c-completed"
                  type="date"
                  value={form.completedDate ?? todayStr()}
                  onChange={(e) => set('completedDate', e.target.value)}
                />
              </div>
            )}
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
            <AlertDialogTitle>クレームを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.code}「{deleting?.title}」を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleting) {
                  store.removeClaim(deleting.id)
                  toast.success(`クレーム ${deleting.code} を削除しました`)
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
