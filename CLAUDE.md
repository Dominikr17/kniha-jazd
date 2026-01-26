# Kniha jázd - Projektové inštrukcie pre Claude

## Prehľad projektu
Elektronická kniha jázd pre správu vozidlového parku firmy ZVL SLOVAKIA. Zákonná kniha jázd platná od 1.1.2026.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Jazyk:** TypeScript
- **Styling:** Tailwind CSS v4
- **Komponenty:** shadcn/ui
- **Databáza:** Supabase (PostgreSQL)
- **Autentifikácia:** Supabase Auth
- **Grafy:** Recharts
- **Export:** jsPDF, xlsx

## Štruktúra projektu
```
src/
├── app/
│   ├── (auth)/login/          # Prihlásenie
│   ├── (dashboard)/           # Hlavný layout s sidebar
│   │   ├── page.tsx           # Dashboard
│   │   ├── vozidla/           # Správa vozidiel
│   │   ├── vodici/            # Správa vodičov
│   │   ├── jazdy/             # Kniha jázd
│   │   ├── phm/               # Tankovanie PHM
│   │   └── reporty/           # Reporty a grafy
│   └── auth/callback/         # Auth callback
├── components/
│   ├── ui/                    # shadcn komponenty
│   └── layout/                # Sidebar, header
├── lib/
│   └── supabase/              # Supabase klienty (client, server, middleware)
├── types/                     # TypeScript typy
└── middleware.ts              # Auth middleware
```

## Databázové tabuľky
- `drivers` - Vodiči
- `vehicles` - Vozidlá
- `vehicle_documents` - Dokumenty vozidiel
- `vehicle_inspections` - STK/EK kontroly
- `vehicle_vignettes` - Diaľničné známky
- `trips` - Jazdy (auto-číslovanie cez sekvenciu)
- `fuel_records` - Tankovanie PHM

## Dôležité súbory
- `src/lib/supabase/server.ts` - Server-side Supabase klient
- `src/lib/supabase/client.ts` - Client-side Supabase klient
- `src/types/index.ts` - Všetky TypeScript typy a konstanty
- `supabase/full_migration.sql` - Kompletná DB migrácia

## Konvencie
- **Jazyk UI:** Slovenčina
- **Dátumový formát:** d.M.yyyy (slovenský)
- **Mena:** EUR
- **Mobile-first:** Responzívny dizajn pre vodičov na mobile

## Príkazy
```bash
npm run dev      # Spustenie dev servera
npm run build    # Build produkcie
npm run lint     # ESLint
```

## Supabase
- **Projekt:** kniha-jazd
- **RLS:** Všetky tabuľky majú RLS, prístup pre authenticated používateľov
- **Storage:** Zatiaľ nepoužité (pripravené pre dokumenty)

## Pri úpravách
1. Typy definuj v `src/types/index.ts`
2. Nové stránky vytváraj v príslušnom priečinku `(dashboard)/`
3. Pre formuláre používaj shadcn komponenty + react-hook-form
4. Server komponenty používaj pre načítanie dát
5. Client komponenty ('use client') pre interaktívne časti
6. Toast notifikácie cez `sonner` (`toast.success()`, `toast.error()`)

## TODO / Plánované vylepšenia
- [ ] Upload dokumentov (Supabase Storage)
- [ ] Stránkovanie v tabuľkách
- [ ] Vyhľadávanie
- [ ] Email notifikácie pre termíny
- [ ] PWA pre offline použitie
