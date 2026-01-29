import { redirect } from 'next/navigation'

export default function SelectDriverPage() {
  // Výber vodiča je teraz na hlavnej stránke
  redirect('/')
}
