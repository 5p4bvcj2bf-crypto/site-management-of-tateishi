import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  FileWarning,
  HardHat,
  Lock,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const FEATURES = [
  {
    icon: Building2,
    title: '現場管理',
    desc: 'キッチン / ユニットバス・担当者・施工会社・進捗の管理',
  },
  {
    icon: ClipboardCheck,
    title: '日次確認',
    desc: '毎日の作業内容・安全朝礼・事故の有無を記録',
  },
  {
    icon: FileWarning,
    title: 'クレーム管理',
    desc: '内容・重要度・納期（対応期限）まで総合管理',
  },
  {
    icon: Users,
    title: 'チームで利用',
    desc: 'メンバーは閲覧、登録者本人は編集が可能',
  },
  {
    icon: ShieldCheck,
    title: '管理者権限',
    desc: '管理者は全データの編集・承認コードの設定が可能',
  },
  {
    icon: Lock,
    title: '招待コードロック',
    desc: 'コードを知っているチームメンバーだけが利用可能',
  },
]

/**
 * アプリの表紙（カバー画面）。
 * URLにアクセスした最初に表示され、「アプリを開く」で内部に進む。
 */
export default function CoverScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-10 text-white">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-4 inline-flex rounded-2xl bg-amber-500 p-4 text-slate-900">
          <HardHat className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold tracking-wide">Site management of Tateishi</h1>
        <p className="mt-1 text-sm text-slate-400">キッチン・ユニットバス 現場・クレーム管理</p>

        <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-800/60 p-4"
            >
              <div className="rounded-lg bg-amber-500/15 p-2 text-amber-400">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={onEnter}
          className="mt-8 gap-2 bg-amber-500 px-8 text-base font-bold text-slate-900 hover:bg-amber-400"
        >
          アプリを開く
          <ArrowRight className="h-5 w-5" />
        </Button>

        <p className="mt-6 text-xs text-slate-500">
          チームメンバー専用です。初回利用時は管理者から受け取った招待コードが必要です。
        </p>
      </div>
    </div>
  )
}
