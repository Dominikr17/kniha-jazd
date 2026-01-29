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
│   │   ├── vykazy/            # Mesačné výkazy PHM
│   │   ├── reporty/           # Reporty a grafy
│   │   └── zurnal/            # Žurnál aktivít (audit log)
│   ├── vodic/                 # Vodičovská sekcia (bez prihlásenia)
│   │   ├── page.tsx           # Výber vodiča
│   │   ├── driver-select.tsx  # Combobox s vyhľadávaním vodičov
│   │   └── (dashboard)/       # Vodičov dashboard
│   │       ├── jazdy/         # Zoznam jázd, nová jazda, úprava
│   │       └── phm/           # Zoznam tankovaní, nové tankovanie
│   ├── api/driver/            # API pre vodičov (login/logout/me/vehicles)
│   └── auth/callback/         # Auth callback
├── components/
│   ├── ui/                    # shadcn komponenty
│   ├── layout/                # Sidebar, header
│   └── delete-button.tsx      # Generický DeleteButton pre mazanie záznamov
├── lib/
│   ├── supabase/              # Supabase klienty (client, server, middleware)
│   └── driver-session.ts      # Helper pre vodičovské cookie
├── types/                     # TypeScript typy
└── middleware.ts              # Auth middleware
```

## Databázové tabuľky
- `drivers` - Vodiči (+ `position` - funkcia/pracovná pozícia)
- `vehicles` - Vozidlá (+ `responsible_driver_id`, `rated_consumption`, `tank_capacity`)
- `driver_vehicles` - Priradenie vozidiel vodičom (M:N väzba)
- `vehicle_documents` - Dokumenty vozidiel
- `vehicle_inspections` - STK/EK kontroly
- `vehicle_vignettes` - Diaľničné známky
- `trips` - Jazdy (auto-číslovanie, + `trip_type`: sluzobna/sukromna)
- `fuel_records` - Tankovanie PHM (+ `country`, `price_without_vat`, `payment_method`, `full_tank`, `odometer` voliteľný)
- `fuel_inventory` - Referenčné body stavu nádrže (pre automatický výpočet zásob PHM)
- `audit_logs` - Žurnál aktivít (logovanie INSERT/UPDATE/DELETE)
- `monthly_reports` - Mesačné výkazy PHM (zásoby, tachometer, status workflow)

## Dôležité súbory
- `src/lib/utils.ts` - Utility funkcie (cn, calculateTripDistance, resolvePurpose, calculateFuelPrice)
- `src/lib/supabase/server.ts` - Server-side Supabase klient
- `src/lib/supabase/client.ts` - Client-side Supabase klient
- `src/lib/supabase/middleware.ts` - Auth middleware (verejné/chránené cesty)
- `src/lib/driver-session.ts` - Helper pre vodičovské cookie
- `src/components/delete-button.tsx` - Generický DeleteButton (trips, fuel_records, drivers, vehicles)
- `src/lib/driver-vehicles.ts` - Helper pre priradenie vozidiel vodičom
- `src/lib/audit-logger.ts` - Helper pre logovanie aktivít (audit log)
- `src/lib/monthly-report.ts` - Helper pre mesačné výkazy PHM
- `src/lib/monthly-report-pdf.ts` - PDF export mesačných výkazov
- `src/lib/monthly-report-excel.ts` - Excel export mesačných výkazov
- `src/lib/fuel-stock-calculator.ts` - Automatický výpočet stavu nádrže
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
- `DRIVER_EDIT_TIME_LIMIT_MINUTES` - Časový limit na úpravu jazdy vodičom (15 minút)
- `MONTHS_SK` - Názvy mesiacov po slovensky
- `REPORT_STATUS` - Stavy mesačného výkazu (draft, submitted, approved)

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
  - `trips`, `fuel_records`, `fuel_inventory`, `monthly_reports` - verejné čítanie, vkladanie, úprava, mazanie
  - `driver_vehicles` - verejné čítanie, vkladanie, mazanie
  - Ostatné tabuľky - prístup len pre authenticated používateľov
- **Storage:** Zatiaľ nepoužité (pripravené pre dokumenty)

## Prístupové role
| Rola | Prístup | Funkcie |
|------|---------|---------|
| **Admin** | Email + heslo (`/login`) | Všetko (vodiči, vozidlá, STK, diaľničné známky, reporty, žurnál, priradenie vozidiel) |
| **Vodič** | Výber mena (`/vodic`) | Evidencia jázd a tankovania len pre priradené vozidlá |

## Priradenie vozidiel vodičom
- Admin priraďuje vozidlá vodičom v sekcii Vodiči (`/admin/vodici`)
- Vodič vidí a môže zadávať údaje len pre priradené vozidlá
- Ak má vodič len jedno priradené vozidlo, je automaticky predvyplnené vo formulároch
- Vodič bez priradených vozidiel vidí upozornenie a nemôže zadávať jazdy/tankovania

## Pri úpravách
1. Typy definuj v `src/types/index.ts`
2. Admin stránky vytváraj v `src/app/admin/`
3. Vodičovské stránky vytváraj v `src/app/vodic/(dashboard)/`
4. Pre formuláre používaj shadcn komponenty + react-hook-form
5. Server komponenty používaj pre načítanie dát
6. Client komponenty ('use client') pre interaktívne časti
7. Toast notifikácie cez `sonner` (`toast.success()`, `toast.error()`)
8. Pre mazanie záznamov používaj generický `<DeleteButton>` z `@/components/delete-button`
9. Utility funkcie pridávaj do `src/lib/utils.ts`
10. V `.map()` callbackoch používaj výstižné názvy premenných (vehicle, driver, trip - nie v, d, t)

## Automatický výpočet stavu nádrže
Systém automaticky počíta zásoby PHM v mesačných výkazoch na základe:
- **Referenčné body** (`fuel_inventory`): počiatočný stav, tankovanie do plna, manuálna korekcia
- **Vzorec**: `Stav = Posledný ref. bod + Natankované - (Najazdené km × Normovaná spotreba × 1.2 / 100)`
- **Potrebné údaje na vozidle**: `tank_capacity` (objem nádrže), `rated_consumption` (normovaná spotreba)
- **Checkbox "Plná nádrž"** pri tankovaní vytvorí referenčný bod s kapacitou nádrže

## TODO / Plánované vylepšenia
- [ ] Upload dokumentov (Supabase Storage)
- [ ] Stránkovanie v tabuľkách
- [x] Vyhľadávanie a zoraďovanie v zozname vodičov
- [ ] Email notifikácie pre termíny
- [ ] PWA pre offline použitie
