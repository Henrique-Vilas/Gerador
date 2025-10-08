/// <reference types="vite/client" />

// (Opcional com Vite 5, mas ajuda o editor)
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
