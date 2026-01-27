# Kniha jázd - Projektové inštrukcie pre Claude

## Prehľad projektu
Elektronická kniha jázd pre správu vozového parku firmy ZVL SLOVAKIA. Zákonná kniha jázd platná od 1.1.2026.

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
│   ├── page.tsx               # Vstupná stránka (výber: Admin/Vodič)
│   ├── (auth)/login/          # Prihlásenie admina
│   ├── admin/                 # Admin sekcia (vyžaduje prihlásenie)
│   │   ├── page.tsx           # Admin dashboard (s časovým filtrom)
│   │   ├── period-filter.tsx  # Filter obdobia (týždeň/mesiac/rok)
│   │   ├── vozidla/           # Správa vozidiel
│   │   ├── vodici/            # Správa vodičov
│   │   ├── jazdy/             # Kniha jázd
│   │   ├── phm/               # Tankovanie PHM
│   │   ├── reporty/           # Reporty a grafy
│   │   └── zurnal/            # Žurnál aktivít (audit log)
│   ├── vodic/                 # Vodičovská sekcia (bez prihlásenia)
│   │   ├── page.tsx           # Výber vodiča
│   │   ├── driver-select.tsx  # Combobox s vyhľadávaním vodičov
│   │   └── (dashboard)/       # Vodičov dashboard
│   │       ├── jazdy/         # Zoznam jázd, nová jazda, úprava
│   │       └── phm/nova/      # Nové tankovanie
│   ├── api/driver/            # API pre vodičov (login/logout cookie)
│   └── auth/callback/         # Auth callback
├── components/
│   ├── ui/                    # shadcn komponenty
│   └── layout/                # Sidebar, header
├── lib/
│   ├── supabase/              # Supabase klienty (client, server, middleware)
│   └── driver-session.ts      # Helper pre vodičovské cookie
├── types/                     # TypeScript typy
└── middleware.ts              # Auth middleware
```

## Databázové tabuľky
- `drivers` - Vodiči
- `vehicles` - Vozidlá (+ `responsible_driver_id` - zodpovedný vodič)
- `vehicle_documents` - Dokumenty vozidiel
- `vehicle_inspections` - STK/EK kontroly
- `vehicle_vignettes` - Diaľničné známky
- `trips` - Jazdy (auto-číslovanie, + `trip_type`: sluzobna/sukromna)
- `fuel_records` - Tankovanie PHM (+ `country`, `price_without_vat`, `payment_method`)
- `audit_logs` - Žurnál aktivít (logovanie INSERT/UPDATE/DELETE)

## Dôležité súbory
- `src/lib/supabase/server.ts` - Server-side Supabase klient
- `src/lib/supabase/client.ts` - Client-side Supabase klient
- `src/lib/supabase/middleware.ts` - Auth middleware (verejné/chránené cesty)
- `src/lib/driver-session.ts` - Helper pre vodičovské cookie
- `src/lib/audit-logger.ts` - Helper pre logovanie aktivít (audit log)
- `src/types/index.ts` - Všetky TypeScript typy a konstanty
- `supabase/full_migration.sql` - Kompletná DB migrácia

## Firemné farby a branding
- **Modrá:** #004B87 (Pantone 2945C) - primárna farba
- **Žltá:** #FFC72C (Pantone 123C) - accent farba
- **Logo:** `public/logo.svg` (SVG pre ostré zobrazenie)

## Konvencie
- **Jazyk UI:** Slovenčina
- **Dátumový formát:** d.M.yyyy (slovenský)
- **Mena:** EUR
- **Mobile-first:** Responzívny dizajn pre vodičov na mobile

## Konštanty (src/types/index.ts)
- `TRIP_TYPES` - Typy jázd (sluzobna, sukromna)
- `FUEL_COUNTRIES` - Krajiny tankovania s DPH sadzbami (SK, CZ, PL, AT, HU, DE, other)
- `PAYMENT_METHODS` - Spôsoby platby (company_card, cash, advance, invoice)
- `FUEL_TYPES` - Typy paliva (benzin, nafta, lpg, elektro, hybrid)
- `TRIP_PURPOSES` - Účely cesty
- `VIGNETTE_COUNTRIES` - Krajiny pre diaľničné známky
- `AUDIT_TABLES` - Názvy tabuliek pre audit log
- `AUDIT_OPERATIONS` - Typy operácií (INSERT, UPDATE, DELETE)

## Príkazy
```bash
npm run dev      # Spustenie dev servera
npm run build    # Build produkcie
npm run lint     # ESLint
```

## Supabase
- **Projekt:** kniha-jazd
- **RLS politiky:**
  - `drivers`, `vehicles` - verejné čítanie (SELECT)
  - `trips`, `fuel_records` - verejné čítanie, vkladanie, úprava, mazanie
  - Ostatné tabuľky - prístup len pre authenticated používateľov
- **Storage:** Zatiaľ nepoužité (pripravené pre dokumenty)

## Prístupové role
| Rola | Prístup | Funkcie |
|------|---------|---------|
| **Admin** | Email + heslo (`/login`) | Všetko (vodiči, vozidlá, STK, diaľničné známky, reporty, žurnál) |
| **Vodič** | Výber mena (`/vodic`) | Len evidencia jázd a tankovania |

## Pri úpravách
1. Typy definuj v `src/types/index.ts`
2. Admin stránky vytváraj v `src/app/admin/`
3. Vodičovské stránky vytváraj v `src/app/vodic/(dashboard)/`
4. Pre formuláre používaj shadcn komponenty + react-hook-form
5. Server komponenty používaj pre načítanie dát
6. Client komponenty ('use client') pre interaktívne časti
7. Toast notifikácie cez `sonner` (`toast.success()`, `toast.error()`)

## TODO / Plánované vylepšenia
- [ ] Upload dokumentov (Supabase Storage)
- [ ] Stránkovanie v tabuľkách
- [ ] Vyhľadávanie
- [ ] Email notifikácie pre termíny
- [ ] PWA pre offline použitie
