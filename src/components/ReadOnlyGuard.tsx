import { Eye } from 'lucide-react'

/**
 * 他のメンバーが登録したデータの閲覧モード用ガード。
 * ダイアログ内のフォームを相対配置のコンテナで包んで使う。
 * show=true のとき、入力操作を遮断し「閲覧のみ」の案内を表示する。
 */
export function ReadOnlyGuard({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="absolute inset-0 z-10 cursor-not-allowed">
      <div className="sticky top-0 flex items-center gap-1.5 rounded-md bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
        <Eye className="h-3.5 w-3.5" />
        他のメンバーが登録したため閲覧のみです
      </div>
    </div>
  )
}
