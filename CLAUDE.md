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
- **PWA:** Service Worker, Web App Manifest

## Štruktúra projektu
```
src/
├── app/
│   ├── page.tsx               # Vstupná stránka (výber vodiča)
│   ├── pin/                   # PIN stránka pre externý prístup
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
│   ├── vodic/                 # Vodičovská sekcia (IP whitelist alebo PIN)
│   │   ├── page.tsx           # Redirect na hlavnú stránku
│   │   ├── driver-select.tsx  # Combobox s vyhľadávaním vodičov
│   │   └── (dashboard)/       # Vodičov dashboard
│   │       ├── vozidla/       # Moje vozidlá - prehľad termínov
│   │       ├── jazdy/         # Zoznam jázd, nová jazda, úprava
│   │       └── phm/           # Zoznam tankovaní, nové tankovanie
│   ├── api/driver/            # API pre vodičov (login/logout/me/vehicles)
│   ├── api/pin/               # API pre PIN overenie
│   └── auth/callback/         # Auth callback
├── components/
│   ├── ui/                    # shadcn komponenty
│   ├── layout/                # Sidebar komponenty
│   │   ├── app-sidebar.tsx    # Admin sidebar
│   │   └── driver-sidebar.tsx # Vodičovský sidebar
│   ├── delete-button.tsx      # Generický DeleteButton pre mazanie záznamov
│   ├── pwa-register.tsx       # Registrácia Service Workera
│   └── pwa-install-prompt.tsx # Inštalačný prompt pre PWA
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
- `src/components/layout/driver-sidebar.tsx` - Vodičovský bočný panel
- `src/lib/driver-vehicles.ts` - Helper pre priradenie vozidiel vodičom
- `src/lib/audit-logger.ts` - Helper pre logovanie aktivít (audit log)
- `src/lib/monthly-report.ts` - Helper pre mesačné výkazy PHM
- `src/lib/monthly-report-pdf.ts` - PDF export mesačných výkazov
- `src/lib/monthly-report-excel.ts` - Excel export mesačných výkazov
- `src/lib/fuel-stock-calculator.ts` - Automatický výpočet stavu nádrže
- `src/types/index.ts` - Všetky TypeScript typy a konstanty
- `supabase/full_migration.sql` - Kompletná DB migrácia
- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service Worker pre offline podporu

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
  - `driver_vehicles`, `vehicle_inspections`, `vehicle_vignettes` - verejné čítanie
  - Ostatné tabuľky - prístup len pre authenticated používateľov
- **Storage:** Zatiaľ nepoužité (pripravené pre dokumenty)

## Bezpečnosť

### Prístupová kontrola
| Situácia | Prístup |
|----------|---------|
| Firemná IP (ALLOWED_IPS) | Priamy prístup bez overenia |
| Externá IP | Vyžaduje PIN (session cookie - platí do zatvorenia prehliadača) |
| Admin sekcia | Supabase Auth (email + heslo) |

### Bezpečnostné opatrenia
| Opatrenie | Popis |
|-----------|-------|
| **Rate limiting** | PIN: max 5 pokusov, potom 15 min blok |
| **Podpísané cookies** | Driver session používa HMAC SHA256 podpis |
| **Open redirect ochrana** | Validácia redirect URL len na interné cesty |
| **Admin API autorizácia** | Všetky admin API routes overujú Supabase Auth |
| **Ownership validácia** | Vodič môže mazať len svoje záznamy |
| **HTTP hlavičky** | X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| **Input validácia** | Kontrola rozsahov a enum hodnôt |

### Environment variables
| Premenná | Popis |
|----------|-------|
| `ALLOWED_IPS` | Čiarkou oddelené povolené IP adresy |
| `APP_PIN` | PIN kód pre externý prístup |
| `DRIVER_SESSION_SECRET` | 64-char hex kľúč pre podpisovanie cookies |

### Bezpečnostné súbory
- `src/middleware.ts` - IP + PIN kontrola, bezpečnostné hlavičky
- `src/app/pin/page.tsx` - PIN stránka s validáciou redirect
- `src/app/api/pin/verify/route.ts` - Rate limiting, overenie PINu
- `src/lib/driver-session.ts` - Podpísané driver cookies (HMAC)
- `src/components/delete-button.tsx` - Ownership validácia
- `next.config.ts` - HTTP bezpečnostné hlavičky

## Prístupové role
| Rola | Prístup | Funkcie |
|------|---------|---------|
| **Admin** | Email + heslo (`/login`) | Všetko (vodiči, vozidlá, STK, diaľničné známky, reporty, žurnál, priradenie vozidiel) |
| **Vodič** | Výber mena na hlavnej stránke | Evidencia jázd a tankovania len pre priradené vozidlá |

## Priradenie vozidiel vodičom
- Admin priraďuje vozidlá vodičom v sekcii Vodiči (`/admin/vodici`)
- Vodič vidí a môže zadávať údaje len pre priradené vozidlá
- Ak má vodič len jedno priradené vozidlo, je automaticky predvyplnené vo formulároch
- Vodič bez priradených vozidiel vidí upozornenie a nemôže zadávať jazdy/tankovania

## Vodičovská sekcia - Moje vozidlá
Stránka `/vodic/vozidla` zobrazuje vodičovi prehľad priradených vozidiel:

**Zobrazené informácie:**
- Názov a EČV vozidla
- Aktuálny stav tachometra
- STK, EK, diaľničné známky s farebným indikátorom

**Farebné indikátory:**
| Farba | Význam | Podmienka |
|-------|--------|-----------|
| 🟢 Zelená | OK | Platnosť > 30 dní |
| 🟡 Žltá | Blíži sa | Platnosť 7-30 dní |
| 🔴 Červená | Kritické | Platnosť < 7 dní alebo expirované |
| ⚪ Šedá | Nezadané | Nemá záznam |

**Súbory:**
- `src/app/vodic/(dashboard)/vozidla/page.tsx` - Hlavná stránka
- `src/app/vodic/(dashboard)/vozidla/components/vehicle-card.tsx` - Karta vozidla
- `src/app/vodic/(dashboard)/vozidla/components/status-badge.tsx` - Badge pre termíny
- `src/lib/driver-vehicles.ts` - Helper `getVehiclesWithDetails()`

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

## PWA (Progressive Web App)
Aplikácia podporuje inštaláciu na mobil:

**Android:**
- Automatický inštalačný prompt sa zobrazí pri návšteve
- Používateľ klikne "Nainštalovať" → ikona na ploche

**iOS:**
- Safari → Zdieľať → Pridať na plochu
- Automatický prompt nie je podporovaný (Apple obmedzenie)

**Súbory:**
- `public/manifest.json` - Popis aplikácie
- `public/sw.js` - Service Worker (offline cache)
- `public/icons/` - Ikony 192x192 a 512x512
- `src/components/pwa-register.tsx` - Registrácia SW
- `src/components/pwa-install-prompt.tsx` - Inštalačný prompt

## TODO / Plánované vylepšenia
- [ ] Upload dokumentov (Supabase Storage)
- [ ] Stránkovanie v tabuľkách
- [x] Vyhľadávanie a zoraďovanie v zozname vodičov
- [ ] Email notifikácie pre termíny
- [x] PWA pre offline použitie
