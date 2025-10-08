// src/composables/useWhatsapp.ts

export function toWhatsAppMessage(monthLabel: string, year: number) {
  return `Escala de ${monthLabel} de ${year} gerada.`
}

function isMobileUA() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/**
 * Tenta compartilhar o PDF com Web Share (anexa o arquivo no WhatsApp em Android).
 * Se o navegador não suportar "files" (ex.: iOS Safari), faz download e abre o link do WhatsApp com o texto.
 * Retorna:
 *  - 'shared'     -> share nativo executado (arquivo incluso)
 *  - 'downloaded' -> fez download e abriu o WhatsApp com texto (arquivo não incluso automaticamente)
 */
export async function sharePdf(file: File, text: string) {
  const title = file.name.replace(/\.pdf$/i, '')

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    'share' in navigator &&
    'canShare' in navigator &&
    // alguns browsers precisam explicitamente do campo files, type e name
    (navigator as any).canShare?.({ files: [file] }) === true

  // Android + Chrome/Edge + WhatsApp instalado: anexa o arquivo
  if (canShareFiles) {
    try {
      await (navigator as any).share({
        files: [file],
        text,
        title
      })
      return 'shared'
    } catch {
      // usuário cancelou ou app rejeitou — cai no fallback
    }
  }

  // Fallback universal: baixa o PDF e abre WhatsApp com a mensagem
  // iOS Safari NÃO suporta share com files via Web Share; melhor baixar e abrir o texto.
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)

  const encoded = encodeURIComponent(`${text} Anexe o PDF baixado.`)

  // mobile sem files -> app
  if (isMobileUA()) {
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank')
  } else {
    // desktop -> web
    window.open(`https://web.whatsapp.com/send?text=${encoded}`, '_blank')
  }

  return 'downloaded'
}
