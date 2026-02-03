import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ReceiptScanResult } from '@/types'

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

const OCR_PROMPT = `Analyzuj tento pokladničný blok z čerpacej stanice a extrahuj nasledujúce údaje:
1. Množstvo paliva v litroch (hľadaj hodnoty ako "XX.XX L" alebo "XX,XX l")
2. Cena za liter (hľadaj "€/l", "EUR/l" alebo podobné)
3. Celková suma (hľadaj "SUMA", "TOTAL", "CELKOM" alebo podobné)
4. Názov čerpacej stanice (Shell, OMV, Slovnaft, Orlen, MOL, Doppler, atď.)
5. Dátum tankovania (hľadaj "Datum", "Date", "Dátum" alebo podobné)
6. Krajinu tankovania - urči podľa adresy, meny, jazyka na bloku alebo názvu stanice:
   - SK (Slovensko) - slovenčina, Slovnaft, €
   - CZ (Česko) - čeština, Benzina, MOL, Kč/CZK
   - PL (Poľsko) - poľština, Orlen, PKN, zł/PLN
   - AT (Rakúsko) - nemčina, OMV, €, adresy s "A-"
   - HU (Maďarsko) - maďarčina, MOL, Ft/HUF
   - DE (Nemecko) - nemčina, Aral, €, adresy s "D-"
   - other (iná krajina)

DÔLEŽITÉ: Odpoveď vráť VÝHRADNE ako JSON objekt bez žiadneho ďalšieho textu:
{
  "liters": <číslo alebo null>,
  "pricePerLiter": <číslo alebo null>,
  "totalPrice": <číslo alebo null>,
  "gasStation": <string alebo null>,
  "date": <string vo formáte YYYY-MM-DD alebo null>,
  "country": <"SK"|"CZ"|"PL"|"AT"|"HU"|"DE"|"other" alebo null>
}

Ak hodnotu nenájdeš, použi null. Čísla vráť ako desatinné čísla (použij bodku ako oddeľovač). Dátum vždy preveď do formátu YYYY-MM-DD.`

function createAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }
  return new Anthropic({ apiKey })
}

function detectMediaType(dataUrl: string): ImageMediaType {
  if (dataUrl.startsWith('data:image/png')) return 'image/png'
  if (dataUrl.startsWith('data:image/webp')) return 'image/webp'
  if (dataUrl.startsWith('data:image/gif')) return 'image/gif'
  return 'image/jpeg'
}

function extractBase64Data(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/\w+;base64,/, '')
}

function parseOcrResponse(responseText: string): ReceiptScanResult {
  let cleanedJson = responseText.trim()

  // Odstránenie markdown blokov
  if (cleanedJson.startsWith('```json')) {
    cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  } else if (cleanedJson.startsWith('```')) {
    cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/\s*```$/, '')
  }

  // Extrakcia JSON objektu z textu
  const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    cleanedJson = jsonMatch[0]
  }

  return JSON.parse(cleanedJson)
}

function sanitizeResult(data: ReceiptScanResult): ReceiptScanResult {
  return {
    liters: data.liters ?? undefined,
    pricePerLiter: data.pricePerLiter ?? undefined,
    totalPrice: data.totalPrice ?? undefined,
    gasStation: data.gasStation ?? undefined,
    date: data.date ?? undefined,
    country: data.country ?? undefined,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { image: imageDataUrl } = await request.json()

    if (!imageDataUrl) {
      return NextResponse.json(
        { success: false, error: 'Chýba obrázok' },
        { status: 400 }
      )
    }

    const mediaType = detectMediaType(imageDataUrl)
    const imageBase64 = extractBase64Data(imageDataUrl)

    const anthropic = createAnthropicClient()
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: OCR_PROMPT,
            },
          ],
        },
      ],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json(
        { success: false, error: 'Nepodarilo sa analyzovať obrázok' },
        { status: 500 }
      )
    }

    try {
      const parsedData = parseOcrResponse(textBlock.text)
      return NextResponse.json({
        success: true,
        data: sanitizeResult(parsedData),
      })
    } catch {
      console.error('Failed to parse OCR response:', textBlock.text)
      return NextResponse.json({
        success: true,
        data: {},
      })
    }
  } catch (error) {
    console.error('OCR error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('OCR error details:', errorMessage)
    return NextResponse.json(
      { success: false, error: `Chyba pri spracovaní obrázka: ${errorMessage}` },
      { status: 500 }
    )
  }
}
