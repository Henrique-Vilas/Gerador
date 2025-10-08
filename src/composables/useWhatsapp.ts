export function toWhatsAppMessage(monthLabel: string, year: number) {
  return `Escala de ${monthLabel} de ${year} gerada. Anexe o PDF.`
}

export async function sharePdf(file: File, text: string) {
  const ua = navigator.userAgent
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua)

  const hasShare =
    typeof navigator !== 'undefined' &&
    'share' in navigator &&
    'canShare' in navigator &&
    (navigator as any).canShare?.({ files: [file] })

  // Tenta usar o share nativo (mostra o painel do sistema no Windows/macOS/Android)
  if (hasShare) {
    try {
      await (navigator as any).share({ files: [file], text })
      return 'shared'
    } catch (err) {
      // Usuário cancelou ou o browser resolveu pirraçar. Cai no fallback.
    }
  }

  // Fallback universal: baixa o PDF e abre WhatsApp (Web no desktop, API no mobile)
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)

  const encoded = encodeURIComponent(text)
  const link = isMobile
    ? `https://api.whatsapp.com/send?text=${encoded}`
    : `https://web.whatsapp.com/send?text=${encoded}`

  window.open(link, '_blank')
  return 'downloaded'
}
