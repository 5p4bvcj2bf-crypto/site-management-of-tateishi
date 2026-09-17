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

/** 初期状態: データはすべて空。メンバーだけはチーム利用のため既定値を設定 */
function seed(): PersistedData {
  return { sites: [], reports: [], claims: [], members: defaultMembers() }
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
