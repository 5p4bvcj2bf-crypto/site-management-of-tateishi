import { useCallback, useEffect, useState } from 'react'
import type { Claim, DailyReport, Site } from '@/types'

const STORAGE_KEY = 'genba-kanri-data-v2'
const NAME_KEY = 'genba-kanri-current-name'
const ADMIN_KEY = 'genba-kanri-admin-name'

export interface PersistedData {
  sites: Site[]
  reports: DailyReport[]
  claims: Claim[]
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
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

/** 初期状態: すべて空 */
function emptyData(): PersistedData {
  return { sites: [], reports: [], claims: [] }
}

function load(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedData
      if (parsed.sites && parsed.reports && parsed.claims) {
        return parsed
      }
    }
  } catch {
    /* fall through to empty */
  }
  return emptyData()
}

function loadString(key: string): string {
  try {
    return localStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

export function useGenbaStore() {
  const [data, setData] = useState<PersistedData>(load)
  const [currentUserName, setCurrentUserName] = useState<string>(() => loadString(NAME_KEY))
  const [adminName, setAdminName] = useState<string>(() => loadString(ADMIN_KEY))

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* storage full or unavailable */
    }
  }, [data])

  useEffect(() => {
    try {
      localStorage.setItem(NAME_KEY, currentUserName)
    } catch {
      /* ignore */
    }
  }, [currentUserName])

  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_KEY, adminName)
    } catch {
      /* ignore */
    }
  }, [adminName])

  /** 現在の利用者が管理者かどうか（入力名が管理者名と一致する場合） */
  const isAdmin = !!adminName && !!currentUserName && currentUserName === adminName

  /**
   * このレコードを現在の利用者が編集できるか。
   * 管理者は全て編集可。それ以外は、登録時の名前と現在入力している名前が一致する場合のみ。
   */
  const canEdit = useCallback(
    (createdBy: string) => isAdmin || (!!currentUserName && createdBy === currentUserName),
    [currentUserName, isAdmin]
  )

  /** これまでに入力された名前（担当者・登録者）の候補リスト */
  const knownNames: string[] = Array.from(
    new Set(
      [
        ...data.sites.map((s) => s.manager),
        ...data.claims.map((c) => c.manager),
        ...data.sites.map((s) => s.createdBy),
        ...data.reports.map((r) => r.createdBy),
        ...data.claims.map((c) => c.createdBy),
      ].filter((n) => !!n && n.trim())
    )
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
    setData(emptyData())
  }, [])

  const siteById = useCallback(
    (id: string) => data.sites.find((s) => s.id === id),
    [data.sites]
  )

  return {
    data,
    currentUserName,
    setCurrentUserName,
    adminName,
    setAdminName,
    isAdmin,
    canEdit,
    knownNames,
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
