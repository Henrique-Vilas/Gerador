// src/composables/useWhatsapp.ts

export function toWhatsAppMessage(monthLabel: string, year: number) {
  return `Escala de ${monthLabel} de ${year} gerada.`
}

function isMobileUA() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/**
 * Tenta compartilhar o PDF com Web Share API (anexando arquivo).
 * 1) Tenta direto navigator.share({ files }) sem checar canShare (muitos Androids reportam errado).
 * 2) Se falhar, tenta novamente checando canShare.
 * 3) Se ainda falhar, baixa o arquivo e abre WhatsApp com texto (usuário anexa manualmente).
 *
 * Retorna:
 *  - 'shared'     -> share nativo executado (arquivo incluso)
 *  - 'downloaded' -> fez download e abriu o WhatsApp com texto
 */
export async function sharePdf(file: File, text: string) {
  const title = file.name.replace(/\.pdf$/i, '')

  // 1) Tenta SEM checar canShare (alguns Chrome/Android aceitam mesmo com canShare false)
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      // precisa acontecer em gesto do usuário e em https/localhost
      await (navigator as any).share({
        files: [file],
        text,
        title
      })
      return 'shared'
    } catch (err: any) {
      // Se for erro de "cannot share files", a gente tenta o caminho com canShare logo abaixo
      // Outros erros (cancelado, etc.) também caem no fallback
    }
  }

  // 2) Tenta com canShare (alguns navegadores exigem)
  const canShareFiles =
    typeof navigator !== 'undefined' &&
    'share' in navigator &&
    'canShare' in navigator &&
    (navigator as any).canShare?.({ files: [file] }) === true

  if (canShareFiles) {
    try {
      await (navigator as any).share({ files: [file], text, title })
      return 'shared'
    } catch {
      // segue pro fallback
    }
  }

  // 3) Fallback universal: baixar + abrir WhatsApp com texto
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)

  const encoded = encodeURIComponent(`${text} Anexe o PDF baixado.`)
  const link = isMobileUA()
    ? `https://api.whatsapp.com/send?text=${encoded}`
    : `https://web.whatsapp.com/send?text=${encoded}`

  window.open(link, '_blank')
  return 'downloaded'
}
