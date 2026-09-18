import { useMemo, useState } from 'react'
import {
  Building2,
  ClipboardCheck,
  FileWarning,
  HardHat,
  LayoutDashboard,
  Lock,
  RotateCcw,
  Settings,
  UserRound,
} from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ClaimsPage from '@/components/ClaimsPage'
import CoverScreen from '@/components/CoverScreen'
import Dashboard from '@/components/Dashboard'
import LockScreen from '@/components/LockScreen'
import ReportsPage from '@/components/ReportsPage'
import SitesPage from '@/components/SitesPage'
import { useGenbaStore } from '@/lib/store'

type PageKey = 'dashboard' | 'sites' | 'reports' | 'claims'

const NAV: { key: PageKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { key: 'sites', label: '現場管理', icon: Building2 },
  { key: 'reports', label: '日次確認', icon: ClipboardCheck },
  { key: 'claims', label: 'クレーム管理', icon: FileWarning },
]

const TITLES: Record<PageKey, string> = {
  dashboard: 'ダッシュボード',
  sites: '現場管理',
  reports: '日次確認（日報）',
  claims: 'クレーム管理',
}

const SUBTITLES: Record<PageKey, string> = {
  dashboard: '現場・日次報告・クレームの状況を一目で確認',
  sites: 'キッチン / ユニットバスの現場・担当者・施工会社・進捗の管理',
  reports: '毎日の現場状況・安全確認の記録',
  claims: 'クレームの内容・重要度・納期（対応期限）の管理',
}

export default function Home() {
  const store = useGenbaStore()
  const [page, setPage] = useState<PageKey>('dashboard')
  const [adminOpen, setAdminOpen] = useState(false)
  const [adminDraft, setAdminDraft] = useState(store.adminName)
  const [inviteDraft, setInviteDraft] = useState(store.inviteCode)
  const [coverOpen, setCoverOpen] = useState(true)

  const todayLabel = useMemo(() => {
    const d = new Date()
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 (${days[d.getDay()]})`
  }, [])

  // 表紙（カバー画面）→ 「アプリを開く」で内部に進む
  if (coverOpen) {
    return <CoverScreen onEnter={() => setCoverOpen(false)} />
  }

  // 招待コードが設定済みで未承認の端末はロック画面のみ表示
  if (store.isLocked) {
    return <LockScreen store={store} />
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Toaster position="top-right" richColors />

      {/* ヘッダー */}
      <header className="sticky top-0 z-20 border-b bg-slate-900 text-white shadow-sm dark:bg-slate-950">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-amber-500 p-1.5 text-slate-900">
              <HardHat className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight tracking-wide">
                Site management of Tateishi
              </h1>
              <p className="text-[10px] font-medium text-slate-400">
                キッチン・ユニットバス 現場・クレーム管理
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-300 sm:block">{todayLabel}</span>
            {/* 利用者切り替え */}
            <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-slate-300" />
            <Input
              list="genba-known-names"
              value={store.currentUserName}
              onChange={(e) => store.setCurrentUserName(e.target.value)}
              placeholder="名前を入力"
              aria-label="利用者名"
              className="h-8 w-40 border-slate-600 bg-slate-800 text-xs text-white placeholder:text-slate-500 hover:bg-slate-700"
            />
            <datalist id="genba-known-names">
              {store.knownNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            {store.isAdmin && (
              <Badge className="border-0 bg-amber-500 text-slate-900 hover:bg-amber-500">
                管理者
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-slate-300 hover:bg-slate-800 hover:text-white"
              aria-label="管理者設定"
              onClick={() => {
                setAdminDraft(store.adminName)
                setInviteDraft(store.inviteCode)
                setAdminOpen(true)
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
            {store.inviteCode && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                aria-label="ロック"
                title="ロックして別の人に切り替え"
                onClick={() => {
                  if (window.confirm('ロック画面に戻りますか？次に使う人は招待コードの再入力が必要です。')) {
                    store.lock()
                  }
                }}
              >
                <Lock className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={() => {
                if (window.confirm('すべてのデータを削除して空の状態に戻しますか？この操作は取り消せません。')) {
                  store.resetAll()
                }
              }}
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              初期化
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* サイドナビ（PC） */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-52 shrink-0 border-r bg-white p-3 dark:bg-slate-900 md:block">
          <nav className="space-y-1">
            {NAV.map((n) => (
              <button
                key={n.key}
                onClick={() => setPage(n.key)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  page === n.key
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <n.icon
                  className={`h-4 w-4 ${page === n.key ? 'text-amber-600 dark:text-amber-400' : ''}`}
                />
                {n.label}
              </button>
            ))}
          </nav>
          <p className="mt-6 px-3 text-[11px] leading-relaxed text-slate-400">
            データはこの端末のブラウザに保存されます。他のメンバーが登録したデータは閲覧のみです（管理者は編集可）。
          </p>
        </aside>

        {/* メイン */}
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold">{TITLES[page]}</h2>
            <p className="text-sm text-muted-foreground">{SUBTITLES[page]}</p>
          </div>

          {/* モバイル用タブ */}
          <div className="mb-5 flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 dark:bg-slate-800 md:hidden">
            {NAV.map((n) => (
              <button
                key={n.key}
                onClick={() => setPage(n.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold ${
                  page === n.key ? 'bg-white shadow-sm dark:bg-slate-950' : 'text-slate-500'
                }`}
              >
                <n.icon className="h-3.5 w-3.5" />
                {n.label}
              </button>
            ))}
          </div>

          {page === 'dashboard' && (
            <Dashboard
              store={store}
              goClaims={() => setPage('claims')}
              goReports={() => setPage('reports')}
            />
          )}
          {page === 'sites' && <SitesPage store={store} />}
          {page === 'reports' && <ReportsPage store={store} />}
          {page === 'claims' && <ClaimsPage store={store} />}
        </main>
      </div>

      {/* 管理者名設定 */}
      <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>管理者設定</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="admin-name">管理者名</Label>
            <Input
              id="admin-name"
              value={adminDraft}
              onChange={(e) => setAdminDraft(e.target.value)}
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              ヘッダーでこの名前と同じ名前を入力すると「管理者」になり、全データの編集ができます。
              空欄にすると管理者は存在しない状態（各担当者は自分が登録したデータのみ編集可）になります。
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-code">招待コード</Label>
            <Input
              id="invite-code"
              value={inviteDraft}
              onChange={(e) => setInviteDraft(e.target.value)}
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              コードを設定するとアプリがロックされ、コードを知っている人だけが閲覧・入力できます。
              メンバーにはこのコードをLINEなどでお知らせください。空欄にするとロックが解除されます。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={() => {
                store.setAdminName(adminDraft.trim())
                store.setInviteCode(inviteDraft)
                // コードを設定した本人の端末はそのまま承認済みにする
                if (inviteDraft.trim()) store.approve()
                setAdminOpen(false)
              }}
            >
              保存する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
