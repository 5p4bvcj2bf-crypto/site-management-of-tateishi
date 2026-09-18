import { useState } from 'react'
import { HardHat, KeyRound, LogIn, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { GenbaStore } from '@/lib/store'

/**
 * 招待コードによる入口ロック画面。
 * コードが設定済みかつこの端末が未承認のときのみ表示される。
 * 正しいコードを入力すると承認済みになり、その端末では以後スキップされる。
 */
export default function LockScreen({ store }: { store: GenbaStore }) {
  const [name, setName] = useState(store.currentUserName)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    if (!name.trim()) {
      setError('名前を入力してください')
      return
    }
    if (!code.trim()) {
      setError('招待コードを入力してください')
      return
    }
    if (!store.matchInviteCode(code)) {
      setError('招待コードが違います')
      return
    }
    store.setCurrentUserName(name.trim())
    store.approve()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 inline-flex rounded-xl bg-amber-500 p-3 text-slate-900">
            <HardHat className="h-8 w-8" />
          </div>
          <h1 className="text-lg font-bold tracking-wide">Site management of Tateishi</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            キッチン・ユニットバス 現場・クレーム管理
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-900">
          <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
            このアプリはチームメンバー専用です。
            <br />
            管理者から受け取った<strong className="text-foreground">招待コード</strong>を入力してください。
          </p>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="lock-name">名前</Label>
              <div className="relative">
                <UserRound className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lock-name"
                  className="pl-8"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lock-code">招待コード</Label>
              <div className="relative">
                <KeyRound className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lock-code"
                  type="password"
                  className="pl-8"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value)
                    setError('')
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
              </div>
            </div>

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}

            <Button onClick={submit} className="w-full gap-1.5">
              <LogIn className="h-4 w-4" />
              利用開始
            </Button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          コードをお持ちでない場合は、管理者にお問い合わせください。
        </p>
      </div>
    </div>
  )
}
