import { ref, watch } from 'vue'
import type { Settings, Employee } from '../types'

const STORAGE_KEY = 'gerador-escala:settings:v2' // versão sem persistir nomes

// Paleta base (rosa, azul, roxo, laranja claro)
const BASE_COLORS = ['#ec4899', '#0ea5e9', '#8b5cf6', '#f59e0b']

type Persisted = {
  count: number
  month: number
  year: number
  employees: Array<{ id: string; order: number; color: string }>
}

/* ================== Helpers de Cores ================== */
// Converte HSL para HEX
function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
}

// Gera uma cor única não usada em `taken`. Primeiro tenta da paleta base sem repetir.
// Se esgotar a base, gera cores novas no círculo de cores (golden angle) sem colisão.
function pickUniqueColor(taken: string[], seed: number): string {
  // 1) tenta pegar da paleta base sem repetir
  for (const c of BASE_COLORS) {
    if (!taken.includes(c.toLowerCase())) return c
  }
  // 2) gera cor HSL única
  // usa ângulo dourado para espalhar tons e evita colisão exata
  let i = 0
  while (true) {
    const hue = (seed * 137.508 + i * 23) % 360
    const cand = hslToHex(hue, 70, 55).toLowerCase()
    if (!taken.includes(cand)) return cand
    i++
  }
}

/* ================== Carregamento/Serialização ================== */

function sampleEmployees(n: number): Employee[] {
  const out: Employee[] = []
  const used: string[] = []
  for (let i = 0; i < n; i++) {
    const color = pickUniqueColor(used, i)
    used.push(color.toLowerCase())
    out.push({
      id: crypto.randomUUID(),
      order: i + 1,
      name: `Funcionário ${i + 1}`, // não persiste
      color
    })
  }
  return out
}

function serialize(settings: Settings): Persisted {
  return {
    count: settings.count,
    month: settings.month,
    year: settings.year,
    employees: settings.employees.map(e => ({
      id: e.id,
      order: e.order,
      color: e.color, // NÃO salva nome
    })),
  }
}

function deserialize(p: Persisted | null): Settings {
  if (!p) {
    const now = new Date()
    return {
      count: 4,
      month: now.getMonth(),
      year: now.getFullYear(),
      employees: sampleEmployees(4),
    }
  }
  const employees: Employee[] = p.employees
    .sort((a, b) => a.order - b.order)
    .map(e => ({
      id: e.id,
      order: e.order,
      name: `Funcionário ${e.order}`, // reconstrói placeholder
      color: e.color,
    }))
  return { count: p.count, month: p.month, year: p.year, employees }
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Persisted) : null
    return deserialize(parsed)
  } catch {
    return deserialize(null)
  }
}

/* ================== Store Singleton ================== */

const settings = ref<Settings>(load())

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(settings.value)))
}
watch(settings, save, { deep: true })

function setCount(n: number) {
  const curr = settings.value.employees.slice().sort((a, b) => a.order - b.order)
  if (n > curr.length) {
    // adiciona funcionários com cores únicas
    const used = curr.map(e => e.color.toLowerCase())
    const start = curr.length + 1
    const extra: Employee[] = []
    for (let i = 0; i < n - curr.length; i++) {
      const color = pickUniqueColor(used, start + i)
      used.push(color.toLowerCase())
      extra.push({
        id: crypto.randomUUID(),
        order: start + i,
        name: `Funcionário ${start + i}`,
        color
      })
    }
    settings.value.employees = curr.concat(extra)
  } else {
    settings.value.employees = curr.slice(0, n)
  }
  settings.value.count = n
}

function updateEmployee(id: string, patch: Partial<Employee>) {
  const arr = settings.value.employees
  const idx = arr.findIndex(e => e.id === id)
  if (idx >= 0) {
    const { order } = arr[idx]
    arr[idx] = { ...arr[idx], ...patch, order }
    // se o usuário trocar a cor manualmente, respeitamos (pode repetir por decisão dele)
  }
}

export function useStorage() {
  return { settings, setCount, updateEmployee, save }
}
