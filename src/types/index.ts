export type SiteStatus = '計画中' | '施工中' | '一時中断' | '完了'

/** 設備種別: キッチン or ユニットバス */
export type FacilityType = 'キッチン' | 'ユニットバス'

/** チームメンバーの役割 */
export type MemberRole = '管理者' | 'メンバー'

export interface TeamMember {
  id: string
  name: string
  role: MemberRole
}

export interface Site {
  id: string
  name: string
  facilityType: FacilityType // キッチン / ユニットバス
  manager: string // 担当者
  contractor: string // 施工会社
  status: SiteStatus
  location: string
  startDate: string // 着工日
  endDate: string // 完了予定日
  progress: number // 進捗率 0-100
  createdBy: string // 登録したメンバーID
}

export type Weather = '晴' | '曇' | '雨' | '雪'

export interface DailyReport {
  id: string
  siteId: string
  date: string
  weather: Weather
  workers: number // 作業員数
  progress: number // 当日進捗率(%)
  workContent: string // 作業内容
  safetyMeeting: boolean // 朝礼・安全ミーティング
  incidents: string // 事故・ヒヤリハット(なしの場合は「なし」)
  notes: string // 特記事項
  createdBy: string // 登録したメンバーID
}

export type ClaimPriority = '高' | '中' | '低'
export type ClaimStatus = '未対応' | '対応中' | '完了'

export interface Claim {
  id: string
  code: string // クレーム番号
  receivedDate: string // 受付日
  siteId: string
  manager: string // 担当者
  contractor: string // 施工会社
  title: string
  content: string // クレーム内容
  priority: ClaimPriority // 重要度
  status: ClaimStatus
  deadline: string // 対応期限(納期)
  completedDate?: string // 完了日
  createdBy: string // 登録したメンバーID
}
