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
  () => settings.employees,
  () => settings.month,
  () => settings.year
)

const title = computed(() => `${monthLabel.value} de ${settings.year}`)
const pdfRef = ref<HTMLElement | null>(null)
const busy = ref(false)

const messages = ref<{ id: string, msg: string, type: 'ok' | 'err' }[]>([])
function toast(msg: string, type: 'ok' | 'err' = 'ok') {
  messages.value.push({ id: (crypto as any).randomUUID?.() ?? String(Math.random()), msg, type })
  setTimeout(() => { messages.value.shift() }, 3000)
}

/* ========= Validação =========
   Se houver funcionário sem nome (string vazia/whitespace),
   exibe erro e foca o primeiro campo vazio. Retorna false para
   cancelar a ação. Não desabilita botão; só barra a execução. */
function validateNames(): boolean {
  const missing = settings.employees.filter(e => !(e.name ?? '').trim())
  if (missing.length === 0) return true

  toast('Preencha os nomes de todos os funcionários.', 'err')

  // foca o primeiro input vazio pelo aria-label usado no ControlsCard
  const first = missing[0]
  queueMicrotask(() => {
    const sel = `input[aria-label="Nome do Funcionário ${first.order}"]`
    const el = document.querySelector(sel) as HTMLInputElement | null
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.focus()
  })

  return false
}

async function handleExport() {
  if (!validateNames()) return
  if (!pdfRef.value) return
  try {
    busy.value = true
    const pdf = await withPdfExportClass(async () =>
      await exportElementToPdf(pdfRef.value!, `escala-${monthLabel.value}-${settings.year}.pdf`)
    )
    pdf.save(`Escala-${monthLabel.value}-${settings.year}.pdf`)
    toast('PDF gerado com sucesso.')
  } catch (e: any) {
    toast(e?.message || 'Falha ao gerar PDF', 'err')
  } finally {
    busy.value = false
  }
}

async function handleShare() {
  if (!validateNames()) return
  if (!pdfRef.value) return
  try {
    busy.value = true
    const pdf = await withPdfExportClass(async () =>
      await exportElementToPdf(pdfRef.value!, `escala-${monthLabel.value}-${settings.year}.pdf`)
    )
    const blob = pdf.output('blob') as Blob
    const file = new File([blob], `Escala-${monthLabel.value}-${settings.year}.pdf`, { type: 'application/pdf' })
    const status = await sharePdf(file, toWhatsAppMessage(monthLabel.value, settings.year))
    toast(
      status === 'shared'
        ? 'Compartilhado pelo share nativo.'
        : status === 'server-sent'
        ? 'Enviado pelo backend (Cloud API).'
        : 'PDF baixado. Abra o WhatsApp para enviar.'
    )
  } catch (e: any) {
    toast(e?.message || 'Falha ao compartilhar', 'err')
  } finally {
    busy.value = false
  }
}

function onGenerate() {
  if (!validateNames()) return
  try {
    generate()
    toast('Escala gerada.')
  } catch (e: any) {
    toast(e?.message || 'Erro na geração', 'err')
  }
}

function employeeById(id: string): Employee | undefined {
  return settings.employees.find(e => e.id === id)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-[#0b2447] to-[#0b4f3a] text-slate-900">
    <header class="pt-6 md:pt-8">
      <h1 class="text-center text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow">
        EscalaFácil
      </h1>
    </header>

    <main class="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8">
      <div class="flex justify-center">
        <ControlsCard
          @generate="onGenerate"
          @export="handleExport"
          @share="handleShare"
        />
      </div>

      <div ref="pdfRef" class="w-full mt-6" data-pdf-root>
        <ScheduleTable
          :title="title"
          :rows="rows"
          :employees="settings.employees"
          @update:row="updateEntryEmployee"
        />
      </div>

      <!-- toasts -->
      <div class="fixed bottom-4 left-1/2 -translate-x-1/2 space-y-2 w-[92vw] max-w-md z-50">
        <div
          v-for="m in messages"
          :key="m.id"
          class="rounded-lg px-3 py-2 text-white shadow"
          :class="m.type === 'ok' ? 'bg-emerald-600' : 'bg-rose-600'"
        >
          {{ m.msg }}
        </div>
      </div>
    </main>
  </div>
</template>
