<script setup lang="ts">
import { computed, ref } from 'vue'
import ControlsCard from '@/components/ControlsCard.vue'
import ScheduleTable from '@/components/ScheduleTable.vue'
import { useStorage } from '@/composables/useStorage'
import { useSchedule } from '@/composables/useSchedule'
import { exportElementToPdf, withPdfExportClass } from '@/composables/usePdf'
import { sharePdf, toWhatsAppMessage } from '@/composables/useWhatsapp'
import type { Employee } from '@/types'

const { settings } = useStorage()

const { rows, generate, monthLabel, updateEntryEmployee } = useSchedule(
  () => settings.value.employees,
  () => settings.value.month,
  () => settings.value.year
)

const title = computed(() => `${monthLabel.value} de ${settings.value.year}`)
const pdfRef = ref<HTMLElement | null>(null)
const busy = ref(false)

const messages = ref<{ id: string; msg: string; type: 'ok' | 'err' }[]>([])
function toast(msg: string, type: 'ok' | 'err' = 'ok') {
  messages.value.push({ id: crypto.randomUUID(), msg, type })
  setTimeout(() => {
    messages.value.shift()
  }, 3000)
}

async function handleExport() {
  if (!pdfRef.value) return
  try {
    busy.value = true
    const name = `Escala-${monthLabel.value}-${settings.value.year}.pdf`
    const pdf = await withPdfExportClass(() =>
      exportElementToPdf(pdfRef.value!, name)
    )
    pdf.save(name)
    toast('PDF gerado com sucesso.')
  } catch (e: any) {
    toast(e?.message || 'Falha ao gerar PDF', 'err')
  } finally {
    busy.value = false
  }
}

async function handleShare() {
  if (!pdfRef.value) return
  try {
    busy.value = true
    const name = `Escala-${monthLabel.value}-${settings.value.year}.pdf`
    const pdf = await withPdfExportClass(() =>
      exportElementToPdf(pdfRef.value!, name)
    )
    const blob = pdf.output('blob') as Blob
    const file = new File([blob], name, { type: 'application/pdf' })
    const status = await sharePdf(file, toWhatsAppMessage(monthLabel.value, settings.value.year))
    toast(status === 'shared' ? 'Compartilhado.' : 'PDF baixado. Abra o WhatsApp para enviar.')
  } catch (e: any) {
    toast(e?.message || 'Falha ao compartilhar', 'err')
  } finally {
    busy.value = false
  }
}

function onGenerate() {
  try {
    generate()
    toast('Escala gerada.')
  } catch (e: any) {
    toast(e?.message || 'Erro na geração', 'err')
  }
}

function employeeById(id: string): Employee | undefined {
  return settings.value.employees.find(e => e.id === id)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-[#0b2447] to-[#0b4f3a] text-slate-900">
    <!-- Topo com o nome do app -->
    <header class="pt-6 md:pt-8">
      <h1 class="text-center text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow">
        EscalaFácil
      </h1>
    </header>

    <main class="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8">
      <!-- Card centralizado -->
      <div class="flex justify-center">
        <ControlsCard
          @generate="onGenerate"
          @export="handleExport"
          @share="handleShare"
        />
      </div>

      <!-- Bloco capturado para PDF -->
      <div ref="pdfRef" class="w-full mt-6" data-pdf-root>
        <ScheduleTable
          :title="title"
          :rows="rows"
          :employees="settings.employees"
          @update:row="updateEntryEmployee"
        />
      </div>
    </main>

    <!-- toasts simples -->
    <div class="fixed inset-x-0 bottom-4 flex flex-col items-center gap-2 px-4 pointer-events-none">
      <div
        v-for="m in messages"
        :key="m.id"
        class="pointer-events-auto rounded-lg px-4 py-2 text-white shadow-lg"
        :class="m.type === 'ok' ? 'bg-emerald-600' : 'bg-rose-600'"
      >
        {{ m.msg }}
      </div>
    </div>
  </div>
</template>

<style>
/* Garantir que o título e a palavra "Escala" fiquem pretos no PDF */
html.pdf-export .export-black,
html.pdf-export .export-black * { color: #000 !important; }
</style>
