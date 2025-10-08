<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import type { DayEntry, Employee } from '../types'
import IconEdit from './IconEdit.vue'
import ColorBadge from './ColorBadge.vue'

const props = defineProps<{
  title: string
  rows: DayEntry[]
  employees: Employee[]
}>()

const emit = defineEmits<{
  (e: 'update:row', index: number, employeeId: string): void
}>()

const editingIdx = ref<number | null>(null)
const tempEmployeeId = ref<string>('')

const selectEl = ref<HTMLSelectElement | null>(null)

const employeesMap = computed(() =>
  Object.fromEntries(props.employees.map(e => [e.id, e]))
)

function startEdit(idx: number) {
  editingIdx.value = idx
  tempEmployeeId.value = props.rows[idx].employeeId
  // foca o select assim que entrar em modo edição
  nextTick(() => selectEl.value?.focus())
}
function cancelEdit() {
  editingIdx.value = null
}

function confirmEditOnChange() {
  if (editingIdx.value == null) return
  const idx = editingIdx.value
  const chosen = tempEmployeeId.value
  emit('update:row', idx, chosen)
  editingIdx.value = null
}

function employeeColor(id: string) {
  return employeesMap.value[id]?.color || '#e5e7eb'
}

/* Nome exibido: usa o digitado; se vazio, mostra "Funcionário {order}" */
function displayNameById(id: string) {
  const e = employeesMap.value[id]
  if (!e) return ''
  const name = (e.name ?? '').trim()
  return name || `Funcionário ${e.order}`
}

/* Passa para o badge um Employee com name já resolvido */
function employeeForBadge(id: string): Employee | undefined {
  const e = employeesMap.value[id]
  return e ? ({ ...e, name: displayNameById(id) } as Employee) : undefined
}
</script>

<template>
  <section class="max-w-[1000px] w-full mx-auto bg-white/95 rounded-2xl shadow-soft p-4 md:p-6">
    <header class="mb-4">
      <h2 class="text-xl md:text-2xl font-bold leading-tight text-center export-black">
        Escala de {{ title }}
      </h2>
    </header>

    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead class="sticky top-0 bg-white">
          <tr class="text-left text-gray-600 border-b">
            <th class="py-2 pr-4">Dia da Semana</th>
            <th class="py-2 pr-4">Data</th>
            <th class="py-2 pr-4 text-center">Responsável</th>
            <th class="py-2 pr-4">Ações</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(r, idx) in rows" :key="idx" class="align-top">
            <!-- Dia da semana -->
            <td class="cell-day py-2 pr-4 whitespace-nowrap text-base">
              {{ r.weekday }}
            </td>

            <!-- Data -->
            <td class="cell-date py-2 pr-4 whitespace-nowrap text-base">
              {{ new Date(r.date).toLocaleDateString('pt-BR') }}
            </td>

            <!-- Responsável -->
            <td class="py-2 pr-4 text-center">
              <div
                class="border rounded-lg p-2 mx-auto max-w-[360px] w-full"
                :style="{ borderColor: employeeColor(r.employeeId), backgroundColor: employeeColor(r.employeeId) + '20' }"
              >
                <!-- Modo edição: seletor único, confirma ao mudar -->
                <template v-if="editingIdx === idx">
                  <select
                    ref="selectEl"
                    v-model="tempEmployeeId"
                    @change="confirmEditOnChange"
                    @blur="cancelEdit"
                    class="w-full h-10 rounded-lg border border-gray-300 px-2"
                    aria-label="Selecionar responsável"
                  >
                    <option v-for="e in employees" :key="e.id" :value="e.id">
                      {{ e.name?.trim() || `Funcionário ${e.order}` }}
                    </option>
                  </select>
                </template>

                <!-- Visual normal: badge ocupando 100% -->
                <template v-else>
                  <ColorBadge
                    v-if="employeeForBadge(r.employeeId)"
                    :employee="employeeForBadge(r.employeeId)!"
                    class="w-full"
                  />
                </template>
              </div>
            </td>

            <!-- Ações -->
            <td class="py-2 pr-4">
              <button
                class="inline-flex items-center justify-center w-11 h-11 rounded-lg hover:bg-gray-100"
                aria-label="Editar responsável"
                @click="startEdit(idx)"
              >
                <IconEdit />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
/* Força texto preto no PDF quando .pdf-export está no html */
:global(html.pdf-export .export-black) {
  color: #000 !important;
}
</style>
