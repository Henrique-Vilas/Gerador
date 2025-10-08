<script setup lang="ts">
import { computed } from 'vue'
import { useStorage } from '../composables/useStorage'

const emit = defineEmits<{ (e: 'generate'): void, (e: 'export'): void, (e: 'share'): void }>()

const { settings, setCount, updateEmployee } = useStorage()

const years = computed(() => {
  const y = new Date().getFullYear()
  return Array.from({ length: 7 }, (_, i) => y - 3 + i)
})

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

// rosa, azul turquesa, roxo, laranja claro
const suggested = ['#ec4899', '#0ea5e9', '#8b5cf6', '#f59e0b']
</script>

<template>
  <section
    class="w-full max-w-[760px] mx-auto bg-offwhite2/95 backdrop-blur rounded-2xl shadow-soft p-5 sm:p-6 md:p-8 mt-6 mb-10"
    aria-label="Configurações da escala"
  >
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Quantidade de funcionários</span>
        <select
          class="h-11 rounded-lg border border-gray-300 px-3 focus:outline-none focus:ring focus:ring-blue-200"
          :value="settings.count"
          @change="setCount(parseInt(($event.target as HTMLSelectElement).value))"
          aria-label="Quantidade de funcionários"
        >
          <option v-for="n in 20" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Mês</span>
        <select
          class="h-11 rounded-lg border border-gray-300 px-3 focus:outline-none focus:ring focus:ring-blue-200"
          v-model.number="settings.month"
          aria-label="Selecione o mês"
        >
          <option v-for="(m, idx) in months" :key="m" :value="idx">{{ m }}</option>
        </select>
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Ano</span>
        <select
          class="h-11 rounded-lg border border-gray-300 px-3 focus:outline-none focus:ring focus:ring-blue-200"
          v-model.number="settings.year"
          aria-label="Selecione o ano"
        >
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </label>
    </div>

    <!-- ==== CARDS DE FUNCIONÁRIOS (com número e placeholder) ==== -->
    <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="emp in settings.employees"
        :key="emp.id"
        class="relative min-w-0 rounded-xl border border-gray-200 bg-offwhite p-3 flex items-center gap-3"
      >
        <!-- Número da ordem -->
        <span
          class="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center shadow"
          aria-hidden="true"
        >{{ emp.order }}</span>

        <!-- Cor -->
        <div class="w-11 h-11 shrink-0 rounded-lg border border-gray-300 overflow-hidden">
          <input
            type="color"
            class="w-full h-full cursor-pointer"
            :value="emp.color"
            @input="updateEmployee(emp.id, { color: ($event.target as HTMLInputElement).value })"
            :aria-label="`Cor do Funcionário ${emp.order}`"
          />
        </div>

        <!-- Nome (placeholder Funcionario N; valor não persiste após reload) -->
        <div class="flex-1 min-w-0">
          <label class="text-xs text-gray-600">Nome</label>
          <input
            :value="emp.name"
            @input="updateEmployee(emp.id, { name: ($event.target as HTMLInputElement).value })"
            class="mt-1 w-full h-11 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring focus:ring-blue-200 min-w-0"
            :placeholder="`Funcionário ${emp.order}`"
            :aria-label="`Nome do Funcionário ${emp.order}`"
          />
          <div class="mt-2 flex flex-wrap gap-2 items-center">
            <span class="text-xs text-gray-500">Paleta:</span>
            <button
              v-for="c in suggested"
              :key="c"
              class="w-6 h-6 rounded border border-gray-300"
              :style="{ backgroundColor: c }"
              @click.prevent="updateEmployee(emp.id, { color: c })"
              :aria-label="`Aplicar cor sugerida ${c}`"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 flex flex-wrap gap-3">
      <button
        class="h-11 px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99]"
        @click="emit('generate')"
      >Gerar Escala</button>
      <button
        class="h-11 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99]"
        @click="emit('export')"
      >Exportar em PDF</button>
      <button
        class="h-11 px-4 rounded-xl bg-gray-900 text-white hover:bg-black active:scale-[0.99]"
        @click="emit('share')"
      >Enviar para WhatsApp</button>
    </div>
  </section>
</template>
