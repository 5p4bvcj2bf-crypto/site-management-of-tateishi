import { useCallback, useEffect, useState } from 'react'
import type { Claim, DailyReport, Site, TeamMember } from '@/types'

const STORAGE_KEY = 'genba-kanri-data-v1'
const MEMBER_KEY = 'genba-kanri-current-member'

export interface PersistedData {
  sites: Site[]
  reports: DailyReport[]
  claims: Claim[]
  members: TeamMember[]
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

/** デフォルトのチームメンバー（初回・移行時に使用） */
export function defaultMembers(): TeamMember[] {
  return [
    { id: 'member-1', name: '中村 翔太', role: '管理者' },
    { id: 'member-2', name: '山田 太郎', role: 'メンバー' },
    { id: 'member-3', name: '鈴木 花子', role: 'メンバー' },
    { id: 'member-4', name: '高橋 健', role: 'メンバー' },
  ]
}

export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addDays(base: string, days: number): string {
  const d = new Date(base + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 期限までの残り日数。0=今日、負=超過 */
export function daysUntil(date: string): number {
  const a = new Date(todayStr() + 'T00:00:00')
  const b = new Date(date + 'T00:00:00')
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export function fmtDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${y}/${m}/${d}`
}

function seed(): PersistedData {
  const t = todayStr()
  const members = defaultMembers()
  const sites: Site[] = [
    {
      id: 'site-1',
      name: '〇〇マンション キッチン取替工事（1期）',
      facilityType: 'キッチン',
      manager: '田中 健一',
      contractor: '山田設備株式会社',
      status: '施工中',
      location: '東京都新宿区西新宿2-1',
      startDate: addDays(t, -45),
      endDate: addDays(t, 120),
      progress: 32,
      createdBy: 'member-1',
    },
    {
      id: 'site-2',
      name: '△△団地 ユニットバス設置工事',
      facilityType: 'ユニットバス',
      manager: '佐藤 美咲',
      contractor: '鈴木設備工業',
      status: '施工中',
      location: '東京都渋谷区渋谷3-15',
      startDate: addDays(t, -20),
      endDate: addDays(t, 70),
      progress: 41,
      createdBy: 'member-2',
    },
    {
      id: 'site-3',
      name: '□□戸建分譲住宅 キッチン新設工事',
      facilityType: 'キッチン',
      manager: '田中 健一',
      contractor: '高橋設備株式会社',
      status: '計画中',
      location: '神奈川県横浜市港北区新横浜1-1',
      startDate: addDays(t, 14),
      endDate: addDays(t, 200),
      progress: 0,
      createdBy: 'member-1',
    },
    {
      id: 'site-4',
      name: '◇◇アパート ユニットバス更新工事',
      facilityType: 'ユニットバス',
      manager: '鈴木 大輔',
      contractor: '山田設備株式会社',
      status: '施工中',
      location: '東京都中野区中野5-6',
      startDate: addDays(t, -80),
      endDate: addDays(t, 40),
      progress: 78,
      createdBy: 'member-3',
    },
    {
      id: 'site-5',
      name: '☆☆マンション キッチン取替工事（2期）',
      facilityType: 'キッチン',
      manager: '高橋 一郎',
      contractor: '斉藤設備株式会社',
      status: '完了',
      location: '東京都杉並区阿佐谷南3-2',
      startDate: addDays(t, -150),
      endDate: addDays(t, -10),
      progress: 100,
      createdBy: 'member-1',
    },
  ]

  const reports: DailyReport[] = [
    {
      id: uid(),
      siteId: 'site-1',
      date: t,
      weather: '晴',
      workers: 6,
      progress: 34,
      workContent: '3階 2戸分 キッチンユニット搬入・据付、給排水配管接続',
      safetyMeeting: true,
      incidents: 'なし',
      notes: 'ユニット搬入時エレベーター使用。近隣挨拶済み。',
      createdBy: 'member-1',
    },
    {
      id: uid(),
      siteId: 'site-2',
      date: t,
      weather: '曇',
      workers: 4,
      progress: 43,
      workContent: 'ユニットバスパネル組立、防水パン設置、配管接続',
      safetyMeeting: true,
      incidents: 'なし',
      notes: '',
      createdBy: 'member-2',
    },
    {
      id: uid(),
      siteId: 'site-4',
      date: addDays(t, -1),
      weather: '雨',
      workers: 5,
      progress: 77,
      workContent: '浴室ユニット据付、鏡・照明器具取付 (雨天のため屋内作業中心)',
      safetyMeeting: true,
      incidents: 'なし',
      notes: '明日は追い焚き配管の接続試験を実施予定。',
      createdBy: 'member-3',
    },
  ]

  const claims: Claim[] = [
    {
      id: uid(),
      code: 'CLM-2026-001',
      receivedDate: addDays(t, -3),
      siteId: 'site-1',
      manager: '田中 健一',
      contractor: '山田設備株式会社',
      title: 'キッチン扉の輸送傷',
      content:
        '納品されたキッチン扉に輸送中の傷が複数箇所あると管理会社より連絡あり。メーカーへの交換手配が必要。',
      priority: '高',
      status: '対応中',
      deadline: addDays(t, 2),
      createdBy: 'member-1',
    },
    {
      id: uid(),
      code: 'CLM-2026-002',
      receivedDate: addDays(t, -7),
      siteId: 'site-4',
      manager: '鈴木 大輔',
      contractor: '山田設備株式会社',
      title: 'バス床の排水勾配不良',
      content:
        '設置済みユニットバスの床に水溜まりが発生し排水勾配が不良と判定。メーカー立会いの上、調整または交換を要請。',
      priority: '中',
      status: '未対応',
      deadline: addDays(t, 10),
      createdBy: 'member-3',
    },
    {
      id: uid(),
      code: 'CLM-2026-003',
      receivedDate: addDays(t, -12),
      siteId: 'site-2',
      manager: '佐藤 美咲',
      contractor: '鈴木設備工業',
      title: '吊戸棚の取付け歪み',
      content:
        'キッチン吊戸棚の取付けが水平からずれているとの入居者指摘。再調整を実施済み、再確認待ち。',
      priority: '中',
      status: '対応中',
      deadline: addDays(t, 5),
      createdBy: 'member-2',
    },
    {
      id: uid(),
      code: 'CLM-2026-004',
      receivedDate: addDays(t, -20),
      siteId: 'site-1',
      manager: '田中 健一',
      contractor: '山田設備株式会社',
      title: '工事後の清掃不足',
      content: '取付け工事後のフロア保護材の回収と清掃が不完全だった。',
      priority: '低',
      status: '完了',
      deadline: addDays(t, -5),
      completedDate: addDays(t, -8),
      createdBy: 'member-1',
    },
    {
      id: uid(),
      code: 'CLM-2026-005',
      receivedDate: addDays(t, -1),
      siteId: 'site-2',
      manager: '佐藤 美咲',
      contractor: '鈴木設備工業',
      title: 'バス鏡の割れ',
      content: '納品時のユニットバス鏡にひびが入っているのを施工時に発見。交換品の納期確認が必要。',
      priority: '高',
      status: '未対応',
      deadline: addDays(t, -2),
      createdBy: 'member-2',
    },
  ]

  return { sites, reports, claims, members }
}

function load(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedData
      if (parsed.sites && parsed.reports && parsed.claims) {
        // 移行: チームメンバー未設定の場合はデフォルトメンバーを補完
        if (!parsed.members || parsed.members.length === 0) {
          parsed.members = defaultMembers()
        }
        // 移行: 設備種別・作成者が未設定の既存データを補完
        const fallback = parsed.members[0].id
        parsed.sites = parsed.sites.map((s) => ({
          ...s,
          facilityType: s.facilityType ?? 'キッチン',
          createdBy: s.createdBy ?? fallback,
        }))
        parsed.reports = parsed.reports.map((r) => ({
          ...r,
          createdBy: r.createdBy ?? fallback,
        }))
        parsed.claims = parsed.claims.map((c) => ({
          ...c,
          createdBy: c.createdBy ?? fallback,
        }))
        return parsed
      }
    }
  } catch {
    /* fall through to seed */
  }
  return seed()
}

export function useGenbaStore() {
  const [data, setData] = useState<PersistedData>(load)
  const [currentMemberId, setCurrentMemberId] = useState<string>(() => {
    try {
      return localStorage.getItem(MEMBER_KEY) || 'member-1'
    } catch {
      return 'member-1'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* storage full or unavailable */
    }
  }, [data])

  useEffect(() => {
    try {
      localStorage.setItem(MEMBER_KEY, currentMemberId)
    } catch {
      /* ignore */
    }
  }, [currentMemberId])

  const memberById = useCallback(
    (id: string) => data.members.find((m) => m.id === id),
    [data.members]
  )

  const currentMember = memberById(currentMemberId) ?? data.members[0]

  /** このレコードを現在の利用者が編集できるか（管理者は全て編集可） */
  const canEdit = useCallback(
    (createdBy: string) =>
      !!currentMember && (currentMember.role === '管理者' || currentMember.id === createdBy),
    [currentMember]
  )

  // ── 現場 ──────────────────────────────────────────────
  const addSite = useCallback((s: Omit<Site, 'id'>) => {
    setData((d) => ({ ...d, sites: [...d.sites, { ...s, id: uid() }] }))
  }, [])

  const updateSite = useCallback((s: Site) => {
    setData((d) => ({ ...d, sites: d.sites.map((x) => (x.id === s.id ? s : x)) }))
  }, [])

  const removeSite = useCallback((id: string) => {
    setData((d) => ({ ...d, sites: d.sites.filter((x) => x.id !== id) }))
  }, [])

  // ── 日次報告 ──────────────────────────────────────────
  const addReport = useCallback((r: Omit<DailyReport, 'id'>) => {
    setData((d) => ({ ...d, reports: [...d.reports, { ...r, id: uid() }] }))
  }, [])

  const updateReport = useCallback((r: DailyReport) => {
    setData((d) => ({ ...d, reports: d.reports.map((x) => (x.id === r.id ? r : x)) }))
  }, [])

  const removeReport = useCallback((id: string) => {
    setData((d) => ({ ...d, reports: d.reports.filter((x) => x.id !== id) }))
  }, [])

  // ── クレーム ──────────────────────────────────────────
  const addClaim = useCallback((c: Omit<Claim, 'id' | 'code'>) => {
    setData((d) => {
      const year = new Date().getFullYear()
      const count = d.claims.filter((x) => x.code.includes(`CLM-${year}`)).length + 1
      const code = `CLM-${year}-${String(count).padStart(3, '0')}`
      return { ...d, claims: [...d.claims, { ...c, id: uid(), code }] }
    })
  }, [])

  const updateClaim = useCallback((c: Claim) => {
    setData((d) => ({ ...d, claims: d.claims.map((x) => (x.id === c.id ? c : x)) }))
  }, [])

  const removeClaim = useCallback((id: string) => {
    setData((d) => ({ ...d, claims: d.claims.filter((x) => x.id !== id) }))
  }, [])

  const resetAll = useCallback(() => {
    setData(seed())
  }, [])

  const siteById = useCallback(
    (id: string) => data.sites.find((s) => s.id === id),
    [data.sites]
  )

  return {
    data,
    currentMemberId,
    setCurrentMemberId,
    currentMember,
    memberById,
    canEdit,
    addSite,
    updateSite,
    removeSite,
    addReport,
    updateReport,
    removeReport,
    addClaim,
    updateClaim,
    removeClaim,
    resetAll,
    siteById,
  }
}

export type GenbaStore = ReturnType<typeof useGenbaStore>
