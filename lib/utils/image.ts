/**
 * Utilitários de manipulação de imagem do lado do cliente.
 *
 * Usado no upload de fotos de produto: antes de enviar pro Supabase Storage,
 * a imagem é redimensionada e convertida para JPEG, economizando banda e
 * armazenamento. Tudo acontece no browser via <canvas> — zero round-trip extra.
 */

/**
 * Redimensiona uma imagem mantendo proporção e a comprime como JPEG.
 *
 * @param file     Arquivo original (selecionado pelo input do usuário).
 * @param maxSide  Maior dimensão (largura ou altura) após o resize, em pixels.
 *                 Padrão 1200px — equilíbrio entre nitidez no retina e tamanho de arquivo.
 * @param quality  Qualidade JPEG de 0 a 1. Padrão 0.82 — bom para fotos de bolo
 *                 sem artefatos visíveis e ~70% menor que 0.95.
 *
 * @returns Blob JPEG já redimensionado e comprimido, pronto para upload.
 */
export async function resizeAndCompress(file: File, maxSide = 1200, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // Object URL temporário — precisamos revogar depois para liberar memória.
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const { width, height } = img

      // Calcula o fator de escala. Math.min(1, ...) garante que não fazemos
      // UPSCALE se a imagem original já é menor que maxSide (não geramos
      // pixels que não existem).
      const scale = Math.min(1, maxSide / Math.max(width, height))

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context unavailable'))
        return
      }

      // Desenha a imagem já redimensionada e exporta como JPEG.
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Image compression failed'))
        },
        'image/jpeg',
        quality,
      )
    }

    img.onerror = () => {
      // Mesmo no erro precisamos revogar o objectUrl para não vazar memória.
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

/**
 * Extrai o caminho relativo dentro do bucket a partir de uma URL pública
 * do Supabase Storage.
 *
 * Exemplo:
 *   publicUrl = "https://xyz.supabase.co/storage/v1/object/public/product-images/abc.jpg"
 *   bucket    = "product-images"
 *   retorno   = "abc.jpg"
 *
 * Usado quando precisamos DELETAR um arquivo antigo a partir da URL salva
 * no banco — o método storage.from(bucket).remove() exige o caminho, não a URL.
 *
 * @returns o caminho dentro do bucket, ou null se a URL não bater com o padrão esperado.
 */
export function extractStoragePath(publicUrl: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`
  const idx = publicUrl.indexOf(marker)
  return idx !== -1 ? publicUrl.slice(idx + marker.length) : null
}
