# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Kniha jázd - Projektové inštrukcie

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
- **OCR:** Anthropic Claude Vision API (claude-sonnet-4)

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
│   │       ├── phm/           # Zoznam tankovaní, nové tankovanie
│   │       └── statistiky/    # Moje štatistiky - prehľad jázd a spotreby
│   ├── api/driver/            # API pre vodičov (login/logout/me/vehicles)
│   ├── api/pin/               # API pre PIN overenie
│   └── auth/callback/         # Auth callback
├── components/
│   ├── ui/                    # shadcn komponenty
│   ├── layout/                # Sidebar komponenty
│   │   ├── app-sidebar.tsx    # Admin sidebar
│   │   └── driver-sidebar.tsx # Vodičovský sidebar
│   ├── delete-button.tsx      # Generický DeleteButton pre mazanie záznamov
│   ├── trip-form-fields.tsx   # Zdieľané polia formulárov jázd
│   ├── route-combobox.tsx     # Autocomplete pre trasy (Odkiaľ/Kam)
│   ├── receipt-scanner.tsx    # OCR skenovanie pokladničných blokov
│   ├── pwa-register.tsx       # Registrácia Service Workera
│   └── pwa-install-prompt.tsx # Inštalačný prompt pre PWA
├── lib/
│   ├── supabase/              # Supabase klienty (client, server, middleware)
│   ├── cities.ts              # Zoznam miest SK + zahraničie (autocomplete)
│   └── driver-session.ts      # Helper pre vodičovské cookie
├── types/                     # TypeScript typy
└── proxy.ts              # Auth middleware
```

## Databázové tabuľky
- `drivers` - Vodiči (+ `position` - funkcia/pracovná pozícia)
- `vehicles` - Vozidlá (+ `responsible_driver_id`, `rated_consumption`, `tank_capacity`)
- `driver_vehicles` - Priradenie vozidiel vodičom (M:N väzba)
- `vehicle_documents` - Dokumenty vozidiel
- `vehicle_inspections` - STK/EK kontroly
- `vehicle_vignettes` - Diaľničné známky
- `trips` - Jazdy (auto-číslovanie, + `trip_type`: sluzobna/sukromna, `visit_place`: miesto návštevy)
- `fuel_records` - Tankovanie PHM (+ `country`, `price_without_vat`, `payment_method`, `full_tank`, `odometer` voliteľný, cudzia mena: `original_currency`, `original_total_price`, `eur_confirmed`)
- `fuel_inventory` - Referenčné body stavu nádrže (pre automatický výpočet zásob PHM)
- `audit_logs` - Žurnál aktivít (logovanie INSERT/UPDATE/DELETE)
- `monthly_reports` - Mesačné výkazy PHM (zásoby, tachometer, status workflow)
- `business_trips` - Služobné cesty (cestovné príkazy, status workflow, `visit_place`: miesto návštevy)
- `border_crossings` - Prechody hraníc (FK na business_trips)
- `trip_allowances` - Denné stravné
- `trip_expenses` - Výdavky služobných ciest
- `business_trip_trips` - Väzba služobná cesta ↔ jazda (M:N)

## Dôležité súbory
- `src/lib/utils.ts` - Utility funkcie (cn, calculateTripDistance, resolvePurpose, calculateFuelPrice)
- `src/lib/supabase/server.ts` - Server-side Supabase klient
- `src/lib/supabase/client.ts` - Client-side Supabase klient
- `src/proxy.ts` - Auth middleware (IP whitelist, PIN, bezpečnostné hlavičky)
- `src/lib/driver-session.ts` - Helper pre vodičovské cookie
- `src/lib/report-utils.ts` - Helper pre dátumové rozsahy a validáciu URL parametrov
- `src/lib/report-calculations.ts` - Kalkulačné funkcie pre reporty (spotreba, náklady, agregácie)
- `src/components/delete-button.tsx` - Generický DeleteButton (trips, fuel_records, drivers, vehicles, fuel_inventory)
- `src/components/trip-form-fields.tsx` - Zdieľané formulárové polia pre všetky 4 formuláre jázd (vozidlo, vodič, dátum, trasa, tachometer, účel, poznámky)
- `src/components/route-combobox.tsx` - Autocomplete pre trasy (SK mestá + zahraničné s alt názvami)
- `src/lib/cities.ts` - Zoznam miest: SK (~120) + CZ/PL/HU/AT/DE (~100), slovenské názvy s originálnymi aliasmi
- `src/components/layout/driver-sidebar.tsx` - Vodičovský bočný panel
- `src/lib/driver-vehicles.ts` - Helper pre priradenie vozidiel vodičom
- `src/lib/driver-stats.ts` - Helper pre štatistiky vodiča (km, spotreba, mesačné agregácie)
- `src/lib/audit-logger.ts` - Helper pre logovanie aktivít (audit log)
- `src/lib/monthly-report.ts` - Helper pre mesačné výkazy PHM
- `src/lib/monthly-report-pdf.ts` - PDF export mesačných výkazov
- `src/lib/monthly-report-excel.ts` - Excel export mesačných výkazov
- `src/lib/fuel-stock-calculator.ts` - Automatický výpočet stavu nádrže
- `src/lib/email.ts` - Email notifikácie cez Resend (cudzia mena)
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
- **Formát mena:** Priezvisko Meno (napr. Novák Ján)
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
- `FUEL_CURRENCIES` - Podporované meny pre tankovanie (EUR, CZK, PLN, HUF)
- `COUNTRY_CURRENCY_MAP` - Mapovanie krajín na meny

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
| Externá IP | Vyžaduje PIN (cookie platí 8 hodín) |
| Admin sekcia | Supabase Auth (email + heslo) |

### Bezpečnostné opatrenia
| Opatrenie | Popis |
|-----------|-------|
| **Rate limiting** | PIN: max 5 pokusov, potom 15 min blok |
| **PIN session expirácia** | Cookie vyprší po 8 hodinách |
| **PIN timing-safe** | Porovnanie PINu cez `crypto.timingSafeEqual` (ochrana pred timing attack) |
| **Podpísané cookies** | Driver session používa HMAC SHA256 podpis |
| **Open redirect ochrana** | Validácia redirect URL len na interné cesty |
| **Admin API autorizácia** | Všetky admin API routes overujú Supabase Auth (vrátane fuel-inventory, pending-count) |
| **Ownership validácia** | Vodič môže mazať/upravovať len svoje záznamy |
| **Časový limit** | Vodič môže upraviť/vymazať jazdu/tankovanie len do 15 minút od vytvorenia |
| **Backend validácia** | Časový limit a ownership sa overujú aj na backende (nie len frontend) |
| **HTTP hlavičky** | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, CSP |
| **Input validácia** | UUID formát, rozsahy čísel, enum hodnôt, formát dátumov, dĺžka reťazcov |
| **Povinné env premenné** | DRIVER_SESSION_SECRET musí byť nastavený (žiadny fallback) |

### Environment variables
| Premenná | Popis |
|----------|-------|
| `ALLOWED_IPS` | Čiarkou oddelené povolené IP adresy |
| `APP_PIN` | PIN kód pre externý prístup |
| `DRIVER_SESSION_SECRET` | 64-char hex kľúč pre podpisovanie cookies |
| `RESEND_API_KEY` | API kľúč pre Resend (email notifikácie) |
| `NOTIFICATION_EMAIL` | Email príjemca pre notifikácie o cudzej mene |
| `NEXT_PUBLIC_APP_URL` | URL aplikácie pre linky v emailoch |
| `ANTHROPIC_API_KEY` | API kľúč pre Claude Vision OCR |

### Bezpečnostné súbory
- `src/proxy.ts` - IP + PIN kontrola, bezpečnostné hlavičky
- `src/app/pin/page.tsx` - PIN stránka s validáciou redirect
- `src/app/api/pin/verify/route.ts` - Rate limiting, timing-safe overenie PINu
- `src/lib/driver-session.ts` - Podpísané driver cookies (HMAC)
- `src/lib/report-utils.ts` - Validácia URL parametrov (isValidPeriod, isValidUUID, safeParseDate)
- `src/components/delete-button.tsx` - Ownership validácia
- `next.config.ts` - HTTP bezpečnostné hlavičky (HSTS, CSP, X-Frame-Options, ...)

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

## Vodičovská navigácia
Bočný panel pre vodičov (`driver-sidebar.tsx`) s vylepšeným vizuálnym štýlom.

**Položky menu (podľa frekvencie použitia):**
1. Moje jazdy (`/vodic/jazdy`)
2. Moje tankovania (`/vodic/phm`)
3. Moje vozidlá (`/vodic/vozidla`)
4. Moje štatistiky (`/vodic/statistiky`)

**Vizuálny štýl:**
- Zaoblené rohy (`rounded-xl`)
- Gradient pozadie aktívnej položky (žltá `#FFC72C`)
- Väčšie ikony a padding pre dotykateľnosť na mobile
- Smooth animácie pri hover a kliknutí
- Automatické zatvorenie menu na mobile po výbere položky

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

## Vodičovská sekcia - Moje štatistiky
Stránka `/vodic/statistiky` zobrazuje vodičovi prehľad vlastných jázd a spotreby.

**Funkcie:**
- Filter obdobia (tento mesiac, tento rok, posledných 12 mesiacov)
- KPI karty: celkové km, počet jázd, priemerná spotreba, km na jazdu
- Graf kilometrov v čase (Recharts BarChart)
- Spotreba podľa vozidla s porovnaním s normou (+20% tolerancia)
- Posledných 5 jázd s odkazom na všetky

**Status spotreby:**
| Status | Význam | Podmienka |
|--------|--------|-----------|
| V norme | Spotreba OK | <= normovaná spotreba |
| Mierne vyššia | Varovanie | > norma, <= norma + 20% |
| Prekročená norma | Prekročenie | > norma + 20% |

**Súbory:**
- `src/app/vodic/(dashboard)/statistiky/page.tsx` - Hlavná stránka
- `src/app/vodic/(dashboard)/statistiky/components/period-filter.tsx` - Filter obdobia
- `src/app/vodic/(dashboard)/statistiky/components/stats-cards.tsx` - KPI karty
- `src/app/vodic/(dashboard)/statistiky/components/km-chart.tsx` - Graf km v čase
- `src/app/vodic/(dashboard)/statistiky/components/consumption-by-vehicle.tsx` - Spotreba podľa vozidla
- `src/app/vodic/(dashboard)/statistiky/components/recent-trips.tsx` - Posledné jazdy
- `src/lib/driver-stats.ts` - Helper funkcie pre štatistiky (`getDriverStats`, `getMonthlyKm`, `getConsumptionByVehicle`, `getRecentTrips`)

## Pri úpravách
1. Typy definuj v `src/types/index.ts`
2. Admin stránky vytváraj v `src/app/admin/`
3. Vodičovské stránky vytváraj v `src/app/vodic/(dashboard)/`
4. Pre formuláre používaj shadcn komponenty + react-hook-form
5. Server komponenty používaj pre načítanie dát
6. Client komponenty ('use client') pre interaktívne časti
7. Toast notifikácie cez `sonner` (`toast.success()`, `toast.error()`)
8. Pre mazanie záznamov používaj generický `<DeleteButton>` z `@/components/delete-button`
9. Pre formuláre jázd používaj zdieľaný `<TripFormFields>` z `@/components/trip-form-fields` — každý formulár si ponecháva vlastný state a submit logiku
10. Pre formuláre tankovania používaj zdieľaný `<FuelFormFields>` z `@/components/fuel-form-fields`
11. Utility funkcie pridávaj do `src/lib/utils.ts`
12. V `.map()` callbackoch používaj výstižné názvy premenných (vehicle, driver, trip - nie v, d, t)
13. Pri redirecte z POST API route používaj **303 status** (`NextResponse.redirect(url, 303)`), aby sa zmenila metóda na GET
14. **NIKDY nepoužívať `toISOString().split('T')[0]`** na lokálne dátumy — použiť `getLocalDateString()` z `@/lib/utils`
15. **Pred štylovaním nových komponentov** vždy overiť existujúce vzory (`grep` na podobné prvky) a dodržať zavedené konvencie (napr. h1 nadpisy bez farieb, `text-muted-foreground` pre popisy)
16. **Každý API route handler musí mať try/catch** obalujúci celú logiku vrátane auth checkov
17. **Každý `[id]` route handler musí validovať UUID** cez `isValidUUID()` z `@/lib/report-utils` hneď na začiatku
18. **GET/PDF endpointy musia overovať autorizáciu** — admin (`supabase.auth.getUser()`) alebo vlastník (`getDriverSession()` + ownership check)
19. **Supabase child inserty musia mať error check** — destructure `{ error }` a vrátiť 500 pri chybe
20. **Client fetch failures musia redirectovať** — pri chýbajúcom driverId redirect na `/vodic` s toast
21. **OCR endpoint**: limit veľkosti (5MB, status 413), generická error message (bez interných detailov)
22. **Validácia parametrov stránok**: `isValidUUID()` + `parseInt()` s range check + `notFound()` pre neplatné
23. **Responzívne headery stránok**: vždy `flex flex-col sm:flex-row sm:items-center justify-between gap-4` (nie `flex items-center justify-between` — na mobile sa nadpis a tlačidlá musia stackovať pod seba)

## Automatický výpočet stavu nádrže
Systém automaticky počíta zásoby PHM v mesačných výkazoch na základe:
- **Referenčné body** (`fuel_inventory`): počiatočný stav, tankovanie do plna, manuálna korekcia
- **Vzorec**: `Stav = Posledný ref. bod + Natankované - (Najazdené km × Normovaná spotreba × 1.2 / 100)`
- **Potrebné údaje na vozidle**: `tank_capacity` (objem nádrže), `rated_consumption` (normovaná spotreba)
- **Checkbox "Plná nádrž"** pri tankovaní vytvorí referenčný bod s kapacitou nádrže

### Správa palivových zásob v detaile vozidla
V admin sekcii → Vozidlá → Detail vozidla → záložka **"Palivové zásoby"**:
- Pridanie počiatočného stavu nádrže (dátum + litre + poznámka)
- Zobrazenie histórie referenčných bodov (initial, full_tank, manual_correction)
- Mazanie záznamov

**Súbory:**
- `src/app/admin/vozidla/[id]/fuel-inventory-section.tsx` - UI komponent
- `src/app/api/fuel-inventory/initial/route.ts` - POST API pre pridanie
- `src/app/api/fuel-inventory/[id]/route.ts` - DELETE API pre mazanie

## Tankovanie v cudzej mene
Podpora pre tankovanie v CZ, PL, HU s následným doplnením EUR sumy ekonomickým oddelením.

### Workflow
1. Vodič tankuje v zahraničí → zadá sumu v lokálnej mene (CZK, PLN, HUF)
2. Systém automaticky odošle email notifikáciu ekonomickému oddeleniu
3. Po príchode bankového výpisu (do 3 dní) kolegyňa doplní EUR sumu
4. Záznam sa označí ako potvrdený (`eur_confirmed = true`)

### Mapovanie krajín na meny
| Krajina | Mena |
|---------|------|
| SK, AT, DE | EUR |
| CZ | CZK |
| PL | PLN |
| HU | HUF |
| other | výber meny |

### Súbory
- `src/app/vodic/(dashboard)/phm/nova/page.tsx` - Vodičovský formulár s podporou cudzej meny
- `src/app/admin/phm/nova/page.tsx` - Admin formulár (možnosť zadať EUR sumu priamo)
- `src/app/admin/phm/potvrdenie/page.tsx` - Zoznam čakajúcich tankovaní
- `src/app/admin/phm/potvrdenie/confirm-eur-form.tsx` - Formulár pre doplnenie EUR
- `src/app/api/fuel-records/confirm-eur/route.ts` - API pre potvrdenie EUR sumy
- `src/app/api/fuel-records/pending-count/route.ts` - API pre počet čakajúcich

## OCR skenovanie pokladničných blokov
Vodič môže odfotiť pokladničný blok pri tankovaní a automaticky predvyplniť údaje pomocou Claude Vision API.

### Workflow
1. Vodič klikne "Odfotiť blok" vo formulári tankovania
2. Odfotí pokladničný blok (kamera mobilného zariadenia alebo výber súboru)
3. Systém pošle obrázok na Claude Vision API (claude-sonnet-4)
4. Rozpoznané údaje sa zobrazia s náhľadom fotky
5. Vodič klikne "Použiť" pre predvyplnenie formulára

### Rozpoznávané údaje
| Údaj | Popis |
|------|-------|
| `liters` | Množstvo paliva v litroch |
| `pricePerLiter` | Cena za liter |
| `totalPrice` | Celková suma (len pre kontrolu) |
| `gasStation` | Názov čerpacej stanice |
| `date` | Dátum tankovania (formát YYYY-MM-DD) |
| `country` | Krajina tankovania (SK, CZ, PL, AT, HU, DE, other) |

### Súbory
- `src/app/api/ocr/receipt/route.ts` - API endpoint pre OCR (Claude Vision)
- `src/components/receipt-scanner.tsx` - UI komponent pre fotenie a náhľad
- `src/types/index.ts` - Typ `ReceiptScanResult`

### Admin UI (tankovanie v cudzej mene)
- Badge v sidebar pri položke "Tankovanie PHM" zobrazuje počet čakajúcich
- Tlačidlo "Čaká na EUR" v zozname tankovaní odkaz na stránku potvrdenia
- V tabuľke tankovaní badge "Čaká" pre nepotvrdené záznamy

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

## Reporty (`/admin/reporty`)
Stránka s analýzami a prehľadmi vozového parku.

### Globálne filtre
- **Obdobie**: Tento mesiac, minulý mesiac, štvrťrok, rok, vlastné obdobie
- **Vozidlo**: Filtrovanie podľa konkrétneho vozidla
- **Vodič**: Filtrovanie podľa konkrétneho vodiča
- Filtre sa ukladajú do URL parametrov (zdieľateľné linky)

### Taby
| Tab | Obsah |
|-----|-------|
| **Porovnanie vozidiel** | Zoraditeľná tabuľka s farebnými min/max indikátormi, grafy km a nákladov |
| **Mesačný prehľad** | MoM porovnanie, grafy za 12 mesiacov, priemerná spotreba v čase |
| **Spotreba paliva** | Porovnanie s normou (+20% tolerancia), trend spotreby, hodnotenie |
| **Náklady** | KPI karty, pie chart podľa vozidla/platby, náklady v čase |
| **Vodiči** | Štatistiky vodičov, top 10 podľa km, zoraditeľná tabuľka |

### Súbory
- `src/app/admin/reporty/page.tsx` - Hlavná stránka s filtrami
- `src/app/admin/reporty/components/filter-panel.tsx` - Filtračný panel
- `src/app/admin/reporty/components/sortable-table.tsx` - Zdieľané komponenty pre zoraditeľné tabuľky
- `src/app/admin/reporty/components/vehicle-comparison-table.tsx` - Tabuľka porovnania vozidiel
- `src/app/admin/reporty/components/comparison-card.tsx` - Karta pre MoM porovnanie
- `src/app/admin/reporty/components/costs-tab.tsx` - Tab nákladov
- `src/app/admin/reporty/components/drivers-tab.tsx` - Tab vodičov

### Bezpečnosť reportov
- Validácia URL parametrov (period, vehicle, driver, from, to)
- UUID validácia pre vehicle a driver ID
- Bezpečné parsovanie dátumov s try/catch
- Prístup len pre prihlásených adminov (Supabase Auth)

## Služobné cesty (cestovné príkazy)
Modul pre evidenciu služobných ciest s vyúčtovaním stravného a výdavkov.

### Databázové tabuľky
- `business_trips` - Hlavička SC (trip_number, driver_id, visit_place, status workflow, sumy)
- `border_crossings` - Prechody hraníc (FK na business_trips, ON DELETE CASCADE)
- `trip_allowances` - Denné stravné po dňoch
- `trip_expenses` - Výdavky (ubytovanie, parkovné, mýto...)
- `business_trip_trips` - M:N väzba na existujúce jazdy (trips)

### Status workflow
`draft` → `submitted` → `approved` → `paid`
`submitted` → `rejected` → `draft` (vodič opraví a odošle znova)

### Konštanty a sadzby (src/types/index.ts)
- `BUSINESS_TRIP_STATUS` — stavy SC
- `TRANSPORT_TYPES` — dopravné prostriedky (AUS, AUV, AUS_sluzobne, MOS, MOV, vlak, autobus, lietadlo)
- `EXPENSE_TYPES` — typy výdavkov
- `DOMESTIC_ALLOWANCE_RATES` — tuzemské sadzby (5-12h: 9.30€, 12-18h: 13.80€, nad 18h: 20.60€)
- `ALLOWANCE_DEDUCTION_RATES` — krátenie (raňajky 25%, obed 40%, večera 35%)
- `VEHICLE_AMORTIZATION` — AUV: 0.313 €/km, MOV: 0.090 €/km
- `FOREIGN_ALLOWANCE_RATES` — zahraničné sadzby podľa krajín
- `BORDER_CROSSINGS_SK` — hraničné prechody SR

### Výpočet stravného
- Tuzemská: pod 5h = 0, 5-12h = 9.30€, 12-18h = 13.80€, nad 18h = 20.60€
- Zahraničná: do 6h = 25%, 6-12h = 50%, nad 12h = 100% základnej sadzby
- Krátenie vždy zo základnej 100% sadzby
- Zaokrúhlenie: `Math.ceil(suma * 100) / 100`

### Súbory

**Helper funkcie:**
- `src/lib/business-trip-calculator.ts` - Výpočet stravného, amortizácie, celkovej sumy
- `src/lib/business-trip-pdf.ts` - PDF generovanie (2 strany: vyúčtovanie + cestovný príkaz)

**Vodičovská sekcia:**
- `src/app/vodic/(dashboard)/sluzobne-cesty/page.tsx` - Zoznam SC
- `src/app/vodic/(dashboard)/sluzobne-cesty/nova/page.tsx` - Multi-step formulár (4 kroky)
- `src/app/vodic/(dashboard)/sluzobne-cesty/nova/step-trips-and-type.tsx` - Krok 1: Výber jázd + typ cesty (auto-fill údajov vrátane visit_place)
- `src/app/vodic/(dashboard)/sluzobne-cesty/nova/step-details.tsx` - Krok 2: Review auto-fill údajov + dopravný prostriedok + hranice
- `src/app/vodic/(dashboard)/sluzobne-cesty/nova/step-meals-expenses.tsx` - Krok 3: Stravné a výdavky
- `src/app/vodic/(dashboard)/sluzobne-cesty/nova/step-summary.tsx` - Krok 4: Súhrn
- `src/app/vodic/(dashboard)/sluzobne-cesty/[id]/page.tsx` - Detail SC
- `src/app/vodic/(dashboard)/sluzobne-cesty/[id]/actions.tsx` - Akcie vodiča (odoslať, PDF)

**Admin sekcia:**
- `src/app/admin/sluzobne-cesty/page.tsx` - Zoznam SC s filtrami
- `src/app/admin/sluzobne-cesty/[id]/page.tsx` - Detail SC
- `src/app/admin/sluzobne-cesty/[id]/admin-actions.tsx` - Admin akcie (schváliť, vrátiť, preplatiť, PDF)

**API routes:**
- `POST /api/business-trips` - Vytvorenie SC
- `GET/PUT/DELETE /api/business-trips/[id]` - CRUD
- `POST /api/business-trips/[id]/submit` - draft → submitted
- `POST /api/business-trips/[id]/calculate` - Prepočet stravného
- `GET /api/business-trips/[id]/pdf` - Dáta pre PDF
- `POST /api/business-trips/[id]/approve` - submitted → approved (admin)
- `POST /api/business-trips/[id]/reject` - submitted → rejected (admin)
- `POST /api/business-trips/[id]/mark-paid` - approved → paid (admin)
- `GET /api/business-trips/pending-count` - Počet submitted SC

### Bezpečnosť
- Vodič: ownership validácia (driver_id), len draft môže mazať
- Admin: Supabase Auth pre approve/reject/mark-paid
- Audit log pre všetky operácie

