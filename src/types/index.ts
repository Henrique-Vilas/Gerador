export type Employee = {
  id: string
  order: number      // posição na rotação (1..N)
  name: string       // não será persistido; só runtime
  color: string
}

export type DayEntry = {
  date: Date
  weekday: string
  employeeId: string
}

export type Settings = {
  count: number
  month: number // 0-11
  year: number
  employees: Employee[]
}
