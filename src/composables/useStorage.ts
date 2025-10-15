// src/composables/useStorage.ts
import { reactive, watch } from 'vue'
import type { Employee } from '@/types'

// -------------------- Tipos e Constantes --------------------
type Settings = {
  count: number
  month: number
  year: number
  employees: Employee[]
}

// versão nova p/ ignorar sujeira antiga
const KEY = 'escala-settings-v3'

// paleta base (rosa, turquesa, roxo, laranja claro)
const PALETTE = ['#ec4899', '#06b6d4', '#8b5cf6', '#f59e0b']

// -------------------- Helpers seguros --------------------
function uid(): string {
  try {
    // @ts-ignore - nem todo TS conhece globalThis.crypto
    if (globalThis?.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  } catch {}
  // fallback: pseudo-uid
  return 'id-' + Math.random().toString(16).slice(2) + Date.now().toString(16)
}

function safeGetItem(key: string): string | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(key, value)
  } catch {
    // dane-se, só não travar
  }
}

function makeEmployee(order: number, color: string): Employee {
  // name SEMPRE vazio para o placeholder funcionar
  return { id: uid(), order, name: '', color }
}

function pickColor(index: number, used: string[]) {
  const free = PALETTE.find(c => !used.includes(c))
  return free ?? PALETTE[index % PALETTE.length]
}

function seedEmployees(n: number): Employee[] {
  const res: Employee[] = []
  const used: string[] = []
  for (let i = 0; i < n; i++) {
    const color = pickColor(i, used)
    used.push(color)
    res.push(makeEmployee(i + 1, color))
  }
  return res
}

// -------------------- Carregar estado --------------------
function load(): Settings {
  const now = new Date()
  const fallback: Settings = {
    count: 4,
    month: now.getMonth(),
    year: now.getFullYear(),
    employees: seedEmployees(4)
  }

  const raw = safeGetItem(KEY)
  if (!raw) return reactive(fallback) as Settings

  try {
    const parsed = JSON.parse(raw) as Partial<Settings>

    const month =
      typeof parsed.month === 'number' && parsed.month >= 0 && parsed.month <= 11
        ? parsed.month
        : now.getMonth()

    const year = typeof parsed.year === 'number' ? parsed.year : now.getFullYear()

    const arr = Array.isArray(parsed.employees) ? parsed.employees : []
    const employees: Employee[] =
      arr.length > 0
        ? arr.map((e, i) => ({
            id: e?.id || uid(),
            order: i + 1,
            name: '', // limpa sempre
            color: e?.color || PALETTE[i % PALETTE.length]
          }))
        : seedEmployees(typeof parsed.count === 'number' ? parsed.count : 4)

    const count = Math.max(1, Math.min(20, employees.length || parsed.count || 4))

    return reactive({ count, month, year, employees }) as Settings
  } catch {
    // JSON zoado? Vida que segue no fallback
    return reactive(fallback) as Settings
  }
}

const settings = load()

// -------------------- Salvar estado (sem nomes) --------------------
function save() {
  const snapshot: Settings = {
    count: settings.count,
    month: settings.month,
    year: settings.year,
    employees: settings.employees.map((e, i) => ({
      id: e.id,
      order: i + 1,
      name: '', // nunca persiste
      color: e.color
    }))
  }
  safeSetItem(KEY, JSON.stringify(snapshot))
}
watch(settings, save, { deep: true })

// -------------------- API pública compatível --------------------
export function useStorage() {
  function setCount(n: number) {
    n = Math.max(1, Math.min(20, n))

    if (n > settings.employees.length) {
      const toAdd = n - settings.employees.length
      const used = settings.employees.map(e => e.color)
      for (let i = 0; i < toAdd; i++) {
        const color = pickColor(settings.employees.length + i, used)
        used.push(color)
        settings.employees.push(makeEmployee(settings.employees.length + 1, color))
      }
    } else if (n < settings.employees.length) {
      settings.employees.splice(n)
    }

    settings.employees.forEach((e, i) => (e.order = i + 1))
    settings.count = n
  }

  function setMonth(m: number) {
    settings.month = m
  }

  function setYear(y: number) {
    settings.year = y
  }

  function updateEmployee(id: string, patch: Partial<Employee>) {
    const e = settings.employees.find(x => x.id === id)
    if (!e) return
    if (typeof patch.name === 'string') e.name = patch.name // fica só em memória
    if (typeof patch.color === 'string') e.color = patch.color
    if (typeof patch.order === 'number') e.order = patch.order
  }

  return {
    settings,
    setCount,
    setMonth,
    setYear,
    updateEmployee
  }
}
