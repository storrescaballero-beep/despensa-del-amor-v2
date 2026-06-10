import { NextRequest, NextResponse } from 'next/server'

const SUPERMERCADOS: Record<string, { nombre: string, searchUrl: string, logo: string }> = {
  mercadona: {
    nombre: 'Mercadona',
    logo: '🟢',
    searchUrl: 'https://tienda.mercadona.es/search-results?query='
  },
  carrefour: {
    nombre: 'Carrefour',
    logo: '🔵',
    searchUrl: 'https://www.carrefour.es/search?q='
  },
  dia: {
    nombre: 'Día',
    logo: '🔴',
    searchUrl: 'https://www.dia.es/search?q='
  },
  alcampo: {
    nombre: 'Alcampo',
    logo: '🟡',
    searchUrl: 'https://www.alcampo.es/compra-online/search?q='
  },
  elcorteingles: {
    nombre: 'El Corte Inglés',
    logo: '🟤',
    searchUrl: 'https://www.elcorteingles.es/supermercado/search?term='
  }
}

export async function POST(req: NextRequest) {
  const { items, supermercado } = await req.json()

  const super_info = SUPERMERCADOS[supermercado] || SUPERMERCADOS.mercadona

  const productos = items.map((item: any) => {
    // Clean product name - remove quantity suffix (e.g. "Pollo — 330g" -> "Pollo")
    const nombre = item.name.split('—')[0].trim()
    const query = encodeURIComponent(nombre)
    return {
      id: item.id,
      nombre,
      cantidad: item.name.includes('—') ? item.name.split('—')[1]?.trim() : `x${item.quantity}`,
      categoria: item.category,
      url: super_info.searchUrl + query,
      done: item.done
    }
  })

  return NextResponse.json({
    supermercado: super_info,
    productos,
    total: productos.length
  })
}
