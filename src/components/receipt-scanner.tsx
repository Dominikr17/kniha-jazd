'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Loader2, X, Check } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { ReceiptScanResult, FUEL_COUNTRIES } from '@/types'

export type { ReceiptScanResult }

interface ReceiptScannerProps {
  onScan: (result: ReceiptScanResult) => void
  disabled?: boolean
}

const MAX_IMAGE_WIDTH = 1600
const JPEG_QUALITY = 0.8

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    const reader = new FileReader()

    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Zmenšenie ak je obrázok príliš veľký
        if (width > MAX_IMAGE_WIDTH) {
          height = (height * MAX_IMAGE_WIDTH) / width
          width = MAX_IMAGE_WIDTH
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        const compressedBase64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
        resolve(compressedBase64)
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function ReceiptScanner({ onScan, disabled }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const processSelectedFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Vyberte obrázok')
      return
    }

    setIsScanning(true)
    setScanResult(null)

    try {
      const compressedImage = await compressImage(selectedFile)
      setImagePreview(compressedImage)

      const response = await fetch('/api/ocr/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressedImage }),
      })

      const responseData = await response.json()

      if (!responseData.success) {
        toast.error(responseData.error || 'Nepodarilo sa načítať údaje z bloku')
        return
      }

      const extractedData = responseData.data as ReceiptScanResult
      setScanResult(extractedData)

      const recognizedFieldsCount = [
        extractedData.liters,
        extractedData.pricePerLiter,
        extractedData.gasStation,
      ].filter(Boolean).length

      if (recognizedFieldsCount === 0) {
        toast.warning('Nepodarilo sa rozpoznať žiadne údaje z bloku')
      } else {
        const suffix = recognizedFieldsCount === 1 ? 'údaj' : recognizedFieldsCount < 5 ? 'údaje' : 'údajov'
        toast.success(`Rozpoznané ${recognizedFieldsCount} ${suffix}`)
      }
    } catch (error) {
      console.error('Scan error:', error)
      toast.error('Chyba pri skenovaní bloku')
    } finally {
      setIsScanning(false)
    }

    event.target.value = ''
  }

  const confirmAndApplyResult = () => {
    if (scanResult) {
      onScan(scanResult)
      resetScanner()
    }
  }

  const resetScanner = () => {
    setImagePreview(null)
    setScanResult(null)
  }

  const hasAnyRecognizedData = scanResult && (
    scanResult.liters ||
    scanResult.pricePerLiter ||
    scanResult.gasStation ||
    scanResult.date ||
    scanResult.country
  )

  const formatDateForDisplay = (isoDate: string): string => {
    return isoDate.split('-').reverse().join('.')
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={processSelectedFile}
        className="hidden"
        disabled={disabled || isScanning}
      />

      {!imagePreview ? (
        <Button
          type="button"
          variant="outline"
          onClick={openFilePicker}
          disabled={disabled || isScanning}
          className="w-full sm:w-auto"
        >
          <Camera className="mr-2 h-4 w-4" />
          Odfotiť blok
        </Button>
      ) : (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <div className="flex items-start gap-4">
            <div className="relative w-24 h-32 rounded overflow-hidden border bg-white shrink-0">
              <Image
                src={imagePreview}
                alt="Náhľad bloku"
                fill
                className="object-contain"
              />
            </div>

            <div className="flex-1 min-w-0">
              {isScanning ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Načítavam údaje z bloku...</span>
                </div>
              ) : scanResult ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Rozpoznané údaje:</p>
                  {scanResult.gasStation && (
                    <p>Stanica: <span className="font-medium">{scanResult.gasStation}</span></p>
                  )}
                  {scanResult.country && (
                    <p>Krajina: <span className="font-medium">{FUEL_COUNTRIES[scanResult.country].name}</span></p>
                  )}
                  {scanResult.date && (
                    <p>Dátum: <span className="font-medium">{formatDateForDisplay(scanResult.date)}</span></p>
                  )}
                  {scanResult.liters && (
                    <p>Litre: <span className="font-medium">{scanResult.liters} L</span></p>
                  )}
                  {scanResult.pricePerLiter && (
                    <p>Cena/L: <span className="font-medium">{scanResult.pricePerLiter} €</span></p>
                  )}
                  {scanResult.totalPrice && (
                    <p>Suma: <span className="font-medium">{scanResult.totalPrice} €</span></p>
                  )}
                  {!hasAnyRecognizedData && (
                    <p className="text-muted-foreground">Žiadne údaje sa nepodarilo rozpoznať</p>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {!isScanning && (
            <div className="flex flex-wrap gap-2">
              {hasAnyRecognizedData && (
                <Button
                  type="button"
                  size="sm"
                  onClick={confirmAndApplyResult}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Použiť
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetScanner}
              >
                <X className="mr-2 h-4 w-4" />
                Zrušiť
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={openFilePicker}
              >
                <Camera className="mr-2 h-4 w-4" />
                Znova
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
