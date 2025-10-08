import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/** Ativa classe global durante a captura (CSS do modo PDF) */
export function withPdfExportClass<T>(cb: () => Promise<T>): Promise<T> {
  document.documentElement.classList.add('pdf-export')
  return cb().finally(() => document.documentElement.classList.remove('pdf-export'))
}

/** Clona o container e mostra apenas as linhas desejadas (índices do tbody) */
function buildPagedClone(el: HTMLElement, startIdx: number, endIdxExclusive: number): HTMLElement {
  const clone = el.cloneNode(true) as HTMLElement
  clone.style.position = 'fixed'
  clone.style.left = '-10000px'
  clone.style.top = '0'
  clone.style.width = getComputedStyle(el).width
  document.body.appendChild(clone)

  // desliga sticky no clone
  clone.querySelectorAll('thead').forEach(th => {
    (th as HTMLElement).style.position = 'static'
  })

  // oculta linhas fora do intervalo
  clone.querySelectorAll('tbody').forEach(tbody => {
    const rows = Array.from(tbody.querySelectorAll('tr'))
    rows.forEach((tr, i) => {
      if (i < startIdx || i >= endIdxExclusive) {
        (tr as HTMLElement).style.display = 'none'
      }
    })
  })

  return clone
}

async function capture(el: HTMLElement) {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    scrollX: 0,
    scrollY: 0,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  })
  return canvas
}

export async function exportElementToPdf(el: HTMLElement, fileName: string) {
  // PDF A4 retrato
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10
  const maxW = pageWidth - margin * 2
  const maxH = pageHeight - margin * 2

  // Página 1: linhas 0..14 (15 dias). Página 2: 15..fim.
  const page1 = buildPagedClone(el, 0, 15)
  const c1 = await capture(page1)
  document.body.removeChild(page1)

  const page2 = buildPagedClone(el, 15, 10_000)
  const c2 = await capture(page2)
  document.body.removeChild(page2)

  const drawCanvas = (canvas: HTMLCanvasElement, first: boolean) => {
    let drawW = maxW
    let drawH = (canvas.height * drawW) / canvas.width
    if (drawH > maxH) {
      drawH = maxH
      drawW = (canvas.width * maxH) / canvas.height
    }
    const img = canvas.toDataURL('image/png')
    if (!first) pdf.addPage()
    pdf.addImage(img, 'PNG', margin, margin, drawW, drawH)
  }

  drawCanvas(c1, true)
  drawCanvas(c2, false)

  // Header "EscalaFácil" em TODAS as páginas
  pdf.setFontSize(9)
  pdf.setTextColor(0, 0, 0)
  const stamp = new Date().toLocaleString('pt-BR')
  const total = pdf.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i)
    pdf.text('EscalaFácil', margin, 6)
    pdf.text(`Gerado em: ${stamp}`, pageWidth - margin, 6, { align: 'right' })
  }

  return pdf
}
