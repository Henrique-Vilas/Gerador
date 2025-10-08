import { computed, ref } from 'vue'
import type { Employee, DayEntry } from '../types'
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Capitaliza a primeira letra respeitando acentos (Português).
 */
function capitalizePt(text: string) {
  if (!text) return text
  const first = text[0].toLocaleUpperCase('pt-BR')
  return first + text.slice(1)
}

type Provide<T> = () => T

export function useSchedule(
  employeesRef: Provide<Employee[]>,
  monthRef: Provide<number>,
  yearRef: Provide<number>
) {
  const rows = ref<DayEntry[]>([])

  const monthLabel = computed(() => {
    const d = new Date(yearRef(), monthRef(), 1)
    // mês por extenso em pt-BR com inicial maiúscula
    const m = format(d, 'LLLL', { locale: ptBR })
    return capitalizePt(m)
  })

  const title = computed(() => `Escala de ${monthLabel.value} de ${yearRef()}`)

  function generate() {
    const month = monthRef()
    const year = yearRef()
    const start = startOfMonth(new Date(year, month, 1))
    const end = endOfMonth(start)
    const days = eachDayOfInterval({ start, end })
    const employees = employeesRef()

    if (!employees.length) {
      throw new Error('Adicione pelo menos 1 funcionário.')
    }

    const result: DayEntry[] = []
    for (let i = 0; i < days.length; i++) {
      const d = days[i]
      const e = employees[i % employees.length]
      result.push({
        date: d,
        weekday: capitalizePt(format(d, 'eeee', { locale: ptBR })), // aqui vai com maiúscula
        employeeId: e.id
      })
    }
    rows.value = result
  }

  function updateEntryEmployee(index: number, employeeId: string) {
    if (index < 0 || index >= rows.value.length) return
    rows.value[index] = { ...rows.value[index], employeeId }
  }

  return {
    rows,
    monthLabel,
    title,
    generate,
    updateEntryEmployee
  }
}
