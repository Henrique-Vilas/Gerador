# Gerador de Escala Mensal

SPA em Vue 3 + Vite com Tailwind, html2canvas + jsPDF e integração com WhatsApp via Web Share API e fallbacks.

## Rodar

```bash
npm install
npm run dev
```

## Funcionalidades
- Cadastro dinâmico de funcionários (nome + cor), 1–20
- Persistência em localStorage (nomes, cores, quantidade, mês, ano)
- Geração rotativa da escala do mês
- Edição inline por linha com confirmação e opções
- Exportar PDF preservando cores (título em preto forçado)
- Compartilhar por WhatsApp: Web Share API com `files` quando suportado; caso contrário, baixa o PDF e abre WhatsApp (Web/Mobile) com mensagem pré-preenchida
- UI responsiva, card central, acessibilidade básica

## Observações
- O PDF é gerado a partir do bloco de tabela. Para nitidez, usamos `scale: 2` no html2canvas e paginamos automaticamente se o mês estourar uma página A4.
- No compartilhamento, se `navigator.canShare({ files })` não estiver disponível, o app baixa o PDF automaticamente e abre WhatsApp com texto pronto. Você deverá anexar manualmente o arquivo baixado.
- "Escala" e o título da página são forçados a preto durante a captura do PDF ao adicionar a classe `html.pdf-export`.