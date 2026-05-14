---
title: "Market Intelligence Hub — Catalogo KPI"
subtitle: "Cosa misurano, da dove arrivano i dati, quali agenti li alimentano"
author: "EY for Prysmian Group"
date: "May 2026"
toc: true
toc-depth: 3
---

# 1. Come leggere questo documento

Questo documento è il **dizionario operativo dei KPI** mostrati nell'applicazione. È pensato per chi *non* è specialista del dominio cavi/marketing intelligence e vuole capire, per ogni numero a video:

1. **Cosa misura** in termini semplici
2. **Perché è rilevante** per un produttore di cavi come Prysmian
3. **Come si calcola** (formula o regola)
4. **Da dove arrivano i dati**:
   - **Sorgenti interne** Prysmian (SAP, Salesforce, master data, input manuali)
   - **Sorgenti esterne** raccolte da uno dei **6 agenti AI**
5. **Sorgenti potenziali concrete** (testate, pubblicazioni, dataset, API)
6. **Frequenza di aggiornamento** raccomandata
7. **Dove appare nell'app**

---

# 2. Glossario di base (per il non specialista)

Prima di entrare nei KPI, alcuni termini ricorrenti:

| Termine | Significato semplice |
|---|---|
| **BU (Business Unit)** | Divisione di Prysmian. Le principali nell'app: I&C (Industrial & Construction), Power Grid (rete elettrica), Digital Solutions (fibra/dati), Railway, Wind onshore, Solar |
| **MV / HV / LV** | Tipi di cavo per tensione: Low Voltage (basso voltaggio, edilizia residenziale), Medium Voltage (distribuzione locale), High Voltage (trasmissione lunghe distanze). Servono in mercati diversi |
| **OPT** | Cavi a fibra ottica (telecomunicazioni, datacenter) |
| **HVDC** | High Voltage Direct Current — cavi per trasmissione AD alta tensione in corrente continua. Mercato premium (interconnessioni paese-paese, eolico offshore) |
| **CPR (Cca-rated)** | Certificazione UE obbligatoria per cavi installati in edifici (resistenza al fuoco) |
| **LSZH** | Low Smoke Zero Halogen — cavi a basso fumo, obbligatori in edifici pubblici |
| **Customer / Account** | Cliente B2B di Prysmian (un'utility, un EPC, un costruttore, un hyperscaler) |
| **Owner (di progetto)** | Soggetto che commissiona o possiede un progetto (es. mining: Anglo American; data center: Microsoft) |
| **CAPEX** | Spesa in conto capitale — quanti soldi investe il cliente nel progetto totale. Indica la dimensione |
| **MW (megawatt)** | Capacità di un impianto energetico. 1 MW ≈ ~1.000 case |
| **GW (gigawatt)** | 1.000 MW |
| **MoM / YoY** | Month-over-Month / Year-over-Year — variazioni vs mese o anno precedente |
| **YTD** | Year-To-Date — totale da gennaio |
| **z-score** | Quanto un valore si discosta dalla sua media storica (deviazioni standard) |
| **SoW (Share of Wallet)** | Quota del budget totale di un cliente che spende con Noi. *SoW = Mie vendite / Spesa totale del cliente* |
| **White space** | Mercato non ancora preso = Spesa totale del cliente − Mie vendite |
| **Pipeline** | Insieme dei progetti tracciati (sia opportunità future che progetti attivi) |
| **Hyperscaler** | I grandi operatori cloud (Microsoft, Google, Amazon/AWS, Meta, Equinix, Digital Realty, Oracle). Sono clienti chiave per i datacenter |
| **PMI** | Purchasing Managers' Index — indicatore mensile sentiment industriale. > 50 = espansione, < 50 = contrazione |
| **EPC** | Engineering, Procurement & Construction — aziende che progettano e costruiscono impianti chiavi-in-mano (clienti tipici nei rinnovabili) |
| **TSO / DSO** | Transmission / Distribution System Operator — gestori della rete elettrica. Es. Terna (IT), TenneT (NL+DE), EDF (FR), Iberdrola (ES) |
| **EU AI Act** | Regolamento UE che obbliga sistemi AI ad alto rischio (incluso enterprise decision support) a fornire trail di evidenza e human oversight |

---

# 3. Mappa delle sorgenti dati

Ogni KPI ricade in una di queste 4 categorie di sorgente:

| Sorgente | Cos'è | Esempi |
|---|---|---|
| **INT-SAP** | Dati transazionali interni Prysmian dal sistema ERP SAP | Ordini, fatture, prezzi listino, master materiali, scorte, piante |
| **INT-SFDC** | Dati di relazione cliente dal CRM Salesforce | Account, opportunità, contatti, attività, pipeline commerciale |
| **INT-MAN** | Input manuali strutturati di MI / BU | Liste customer/competitor strategici, soglie alert, mappatura BU |
| **EXT-AGENT-X** | Dato raccolto dall'agente X (1 dei 6) da sorgenti pubbliche/abbonate | News, progetti, KPI macro, segnali competitivi |

I **6 agenti AI**, da brief Prysmian:

| ID | Nome | Cosa fa |
|---|---|---|
| **A1** | Project Scouting | Monitora progetti mining / grid / data center / BESS / rinnovabili |
| **A2** | News Finder | Cerca news rilevanti per la newsletter interna |
| **A3** | Micro/Macro KPI Alerts | Monitora soglie su KPI macro (per BU) e alerta sulle deviazioni |
| **A4** | Market Trends & Tech Swift Finder | Rileva trend tecnologici emergenti |
| **A5** | Customer Monitoring | Traccia segnali su clienti chiave |
| **A6** | Competitor Monitoring | Traccia mosse competitive |

Nei KPI sotto, "Fonte" è codificata con queste sigle. Se un KPI ha più sorgenti, sono elencate in ordine di priorità.

---

# 4. Le 6 categorie di KPI

Per chiarezza il documento divide i KPI in 6 famiglie funzionali:

| Categoria | Dove appare | Chi alimenta |
|---|---|---|
| **A. KPI commerciali interni** | Country ID, drill-down SF | INT-SFDC + INT-SAP |
| **B. KPI prodotto / industriali** | Drill-down SAP, Country ID (Sales by Product) | INT-SAP |
| **C. KPI pipeline progetti** | Projects list, Compare, Project detail | EXT-A1 + INT-MAN |
| **D. KPI macro/economici** | Market Trends, dashboard Country | EXT-A3 |
| **E. KPI competitivi & news** | Trends ("Competitive moves"), Alerts, News | EXT-A6 + EXT-A2 + EXT-A5 |
| **F. KPI di sistema / AI** | Dashboard, Review Queue, Agents | derivati interni |

I prossimi capitoli (5–10) sono il dizionario per categoria.

---

# 5. Categoria A — KPI commerciali interni

> **Definizione di famiglia**: misurano la posizione attuale di Prysmian come venditore in un dato paese e segmento. Rispondono alla domanda *"chi compra da noi, quanto, di cosa?"*. Sono i KPI che oggi vivono nei file Excel della MI e che il Hub deve consolidare.

## 5.1 Sales by Customer (Vendite per cliente)

**Cosa misura.** Il fatturato di Prysmian con ciascun cliente in un dato paese e periodo. La tabella ranking i clienti da chi compra di più a chi compra di meno.

**Perché è rilevante.** È la base di ogni strategia commerciale: chi sono i miei top 5 clienti? Qual è la dipendenza da un singolo cliente? Dove si concentra il fatturato?

**Calcolo.**
```
sales_by_customer[c] = Σ fatture(c) nel periodo selezionato, in EUR
ranking = ordinamento desc per valore
share_% = sales_by_customer[c] / Σ tutte le vendite
```

**Fonte dati.** **INT-SAP** (transazioni di vendita). In assenza di SAP integration, fallback **INT-MAN** (file Excel BU).

**Frequenza.** Mensile (idealmente settimanale).

**Dove appare nell'app.** Country ID → Quadrant 1 "Sales by Customer".

**Note Phase 1.** L'integrazione SAP via `BAPI_SALES_GET` o estrazione da BW (Business Warehouse) è il path standard. Necessario consolidare la valuta (EUR equivalente).

---

## 5.2 Sales by Product (Vendite per prodotto)

**Cosa misura.** Il fatturato per linea di prodotto (es. MV cables, HV submarine, fibra ottica) in un dato paese.

**Perché è rilevante.** Indica il mix prodotto. Spostamenti del mix segnalano trend (es. crescita HV → si sta vincendo nel grid; crescita LSZH → mercato edilizia in espansione).

**Calcolo.**
```
sales_by_product[p] = Σ fatture(p) nel periodo
share_% = sales_by_product[p] / Σ tutte le vendite
```

**Fonte dati.** **INT-SAP** (codici materiale aggregati a livello prodotto/famiglia tramite material group).

**Frequenza.** Mensile.

**Dove appare nell'app.** Country ID → Quadrant 2 "Sales by Product".

**Note.** I "Product 1, 2, 3" mostrati nel demo corrispondono a famiglie SAP `material_group` (es. CBL-MV-EU, CBL-HV-EU). Phase 1 richiede mapping family→display name curato dalla MI.

---

## 5.3 Market Value by Customer (Valore di mercato per cliente)

**Cosa misura.** **Quanto spende totalmente** un dato cliente per cavi/soluzioni Prysmian-comparable in un anno, da TUTTI i fornitori (incluso Prysmian e i competitor).

**Perché è rilevante.** È il dato più strategico ma anche il più difficile. Dice quanto budget *potresti* prendere se non avessi competitor. **Senza questo dato non puoi calcolare la Share of Wallet.**

**Calcolo.** Non è un dato che SAP/Salesforce hanno nativamente. Si stima per triangolazione:
```
market_value(c) = ricavi pubblici del cliente *
                  intensità procurement-cavi del settore *
                  share geografica del cliente nel paese
```

**Fonte dati.** Mix:
- **INT-MAN** (stima MI team da bilanci pubblici e report di settore) — *fonte primaria oggi*
- **EXT-A5 (Customer Monitoring)** — può arricchire la stima leggendo annual report, capital markets day, MD&A sections
- Eventuali abbonamenti a database: CRU, Wood Mackenzie, BloombergNEF, Bain reports

**Frequenza.** Annuale (con refresh trimestrale se l'agente trova segnali rilevanti).

**Dove appare nell'app.** Country ID → Quadrant 4 "Market Value by Customer".

**Note Phase 1.** Il Customer Monitoring agent (A5) deve estrarre da:
- Bilanci consolidati (10-K SEC, 20-F, EU CONSOB filings)
- Press release di gare vinte (per stimare il run-rate)
- Annunci CAPEX per stimare la spesa procurement legata

Senza agente, l'unica fonte affidabile è il MI team che mantiene il file con queste stime.

---

## 5.4 Share of Wallet (SoW) — quota portafoglio cliente

**Cosa misura.** Quale percentuale della spesa cavi-comparable di un cliente Prysmian intercetta.

**Perché è rilevante.** È il KPI che dice se sto crescendo *all'interno* di un cliente esistente o se sto perdendo terreno verso i competitor. Una SoW del 30% su un cliente da 1M€ vale più di una SoW del 90% su un cliente da 100k€ — il **white space** è dove si gioca la crescita.

**Calcolo.**
```
sow(c)         = sales_by_customer(c) / market_value(c)
white_space(c) = max(0, market_value(c) - sales_by_customer(c))
sow_band(c)    = "low" if <40%, "mid" if 40-70%, "high" if ≥70%
```

**Fonte dati.** Derivato: combina 5.1 (interno SAP) e 5.3 (stima MI + agente A5).

**Frequenza.** Coerente con il più lento dei due input (annuale, refresh trimestrale).

**Dove appare nell'app.**
- Country ID → Quadrant 4bis "Share of Wallet"
- AI Country Insight (banner narrativo)
- Drill-down customer modal

**Azioni che innesca.**
- SoW < 40% → "share-shift initiative" → spostare quota da un competitor
- SoW 40-69% → "cross-sell" → vendere prodotti adiacenti
- SoW ≥ 70% → "defend & protect margin" → blindare con contratti pluriennali

---

## 5.5 Total Share of Wallet (cluster country)

**Cosa misura.** SoW aggregata sui clienti tracciati in un paese.

**Calcolo.**
```
total_sow = Σ sales_by_customer / Σ market_value_by_customer
```

**Fonte.** Derivato da 5.4.

**Dove appare.** Country ID → tile "Total share of wallet" (default 58% su Italy demo).

---

## 5.6 Account Tier (Tier strategico cliente)

**Cosa misura.** Una classificazione del cliente in 3 fasce di importanza strategica.

| Tier | Significato |
|---|---|
| Tier 1 · Strategic | Account chiave per business e relazione (es. utility nazionale) |
| Tier 1 · Key | Top 20 account del paese |
| Tier 2 · Growth | Account a crescita, opportunità futura |

**Fonte dati.** **INT-SFDC** (`Account.Tier__c` o equivalente custom field). Curato dal Key Account Manager.

**Dove appare.** Drill-down Salesforce → highlight strip + "Customer tier" badge.

---

## 5.7 Open Opportunities (Opportunità aperte)

**Cosa misura.** Numero di trattative commerciali in corso (non chiuse) con un cliente.

**Perché è rilevante.** Indica il pipeline commerciale futuro. Pochi open opps = relazione "spenta".

**Fonte dati.** **INT-SFDC** (`Opportunity.StageName` ≠ 'Closed Won' AND ≠ 'Closed Lost').

**Dove appare.** Drill-down SF → panel "Prysmian relationship" + tabella "Open opportunities" con Stage / Amount / Close Date.

---

## 5.8 Closed/Won YTD (Vinte da inizio anno)

**Cosa misura.** Numero di opportunità chiuse vincendole nell'anno corrente.

**Calcolo.**
```
won_ytd(c) = | Opportunity WHERE Account=c
              AND StageName='Closed Won'
              AND CloseDate >= 1 Jan anno corrente |
```

**Fonte.** **INT-SFDC**.

**Dove appare.** Drill-down SF.

---

## 5.9 Last Activity (Ultima attività)

**Cosa misura.** Giorni dall'ultima interazione registrata con il cliente (visita, call, mail tracciata).

**Perché è rilevante.** > 30 giorni di silenzio su un Tier 1 è un campanello d'allarme.

**Fonte.** **INT-SFDC** (`Account.LastActivityDate`).

**Dove appare.** Drill-down SF.

---

## 5.10 Customer Since (Cliente dal)

**Cosa misura.** Anno di inizio rapporto.

**Fonte.** **INT-SFDC** (`Account.SinceDate__c`) o data prima fattura **INT-SAP**.

**Dove appare.** Drill-down SF → highlight strip.

---

## 5.11 Annual Revenue (cliente)

**Cosa misura.** Fatturato totale del cliente (suo, non da Prysmian).

**Fonte.** **INT-SFDC** (campo `AnnualRevenue` arricchito da provider tipo Dun & Bradstreet o ZoomInfo) **+ EXT-A5** che può aggiornare leggendo annual report.

**Dove appare.** Drill-down SF → panel "Account information".

---

## 5.12 Employees (cliente)

**Cosa misura.** Numero dipendenti del cliente.

**Fonte.** **INT-SFDC** (D&B/ZoomInfo enrichment) **+ EXT-A5**.

---

# 6. Categoria B — KPI prodotto / industriali (SAP-side)

> **Definizione di famiglia**: misurano la dimensione "supply side" — cosa produciamo, in quali stabilimenti, a che prezzo, con che stock. Sono fondamentalmente master data SAP.

## 6.1 Material Number (Codice materiale)

**Cosa misura.** ID univoco del materiale nel sistema SAP. Formato Prysmian: `PRY-{tipo}-{numero}` (es. `PRY-MV-45489`).

**Fonte.** **INT-SAP** (master data MARA).

**Dove appare.** Drill-down SAP → header.

---

## 6.2 Material Type

**Cosa misura.** Classificazione SAP del materiale:

| Codice | Significato |
|---|---|
| FERT | Finished good (prodotto finito) |
| HALB | Semi-finished (semilavorato) |
| ROH | Raw material (materia prima — es. rame, polietilene) |

**Fonte.** **INT-SAP** (campo `MARA-MTART`).

**Dove appare.** Drill-down SAP → badge "Material type".

---

## 6.3 Material Group

**Cosa misura.** Famiglia merceologica (mapping a livello commerciale). Es. CBL-MV-EU (cavi MV Europa), OPT-FBR-EU (fibra ottica Europa).

**Fonte.** **INT-SAP** (`MARA-MATKL`).

**Dove appare.** Drill-down SAP → metadata strip + Basic data 1.

---

## 6.4 Base Unit of Measure (UoM)

**Cosa misura.** Unità in cui si vende il materiale. Per cavi tipicamente `KM` (chilometri), per accessori `M` (metri) o `KG`.

**Fonte.** **INT-SAP** (`MARA-MEINS`).

---

## 6.5 Standard Price

**Cosa misura.** Prezzo di listino EUR / unità.

**Fonte.** **INT-SAP** (`MBEW-STPRS`).

**Dove appare.** Drill-down SAP → Sales: sales org. data → "Standard price".

---

## 6.6 Moving Average Price

**Cosa misura.** Prezzo medio mobile effettivo (riflette costi reali recenti).

**Perché è rilevante.** Confronto con `Standard Price` rivela compressione/espansione margine.

**Fonte.** **INT-SAP** (`MBEW-VERPR`).

---

## 6.7 Stock per plant

**Cosa misura.** Giacenza di materiale per stabilimento.

**Fonte.** **INT-SAP** (`MARD-LABST` somma per plant).

**Dove appare.** Drill-down SAP → tabella "Plants & storage".

**Plants tipici Italia.** IT01 Pignataro Maggiore · IT02 Battipaglia · IT05 Livorno. Per altri paesi: DE01 Berlin, FR01 Calais, ecc.

---

## 6.8 Lead Time

**Cosa misura.** Giorni medi tra ordine cliente e disponibilità materiale.

**Fonte.** **INT-SAP** (`MARC-PLIFZ` planned delivery time per plant).

---

## 6.9 Volume YTD

**Cosa misura.** Volume venduto (in unità base, es. KM) da inizio anno per materiale.

**Calcolo.**
```
volume_ytd(m) = Σ ordini chiusi (m, current year) in MARC-LABST UoM
```

**Fonte.** **INT-SAP** (joining MARD/VBAK).

**Dove appare.** Drill-down SAP → MI Hub link tile.

---

## 6.10 Sales Org / Distribution Channel

**Cosa misura.** Struttura commerciale SAP. Es. `IT00 — Prysmian Italia · 10 — Direct sales`.

**Fonte.** **INT-SAP** (`KNVV-VKORG / VTWEG`).

---

# 7. Categoria C — KPI pipeline progetti (project intelligence)

> **Definizione di famiglia**: monitorano i progetti esterni (mining, grid, datacenter, rinnovabili) che generano domanda futura di cavi. È **il radar dell'opportunità futura**: ogni progetto è un potenziale ordine 1-5 anni dopo.

## 7.1 Project (anagrafica progetto)

**Cosa misura.** Un record per ciascun progetto tracciato.

**Attributi chiave.**
- `name` — nome progetto (es. "Quebec Lithium Expansion")
- `owner` — chi lo finanzia/possiede (es. "Elevra")
- `country` — dove si svolge
- `project_type` — `copper` / `lithium` / `data_center` / `wind` / `solar` / `BESS` / `grid`
- `status` — `planning` / `construction` / `operational` / `cancelled`

**Fonte dati.** **EXT-A1 Project Scouting agent**.

**Sorgenti pubbliche tipiche dell'agente:**
- **mining.com** (RSS giornaliero)
- **S&P Global Market Intelligence** (mining database — abbonamento)
- **Reuters mining/energy feed**
- **BNEF (BloombergNEF) press releases**
- **Wood Mackenzie** (consultancy reports — abbonamento)
- **Datacenter Knowledge / DC Byte** (datacenter database)
- **Wind/Solar databases** (EWEA, SolarPower Europe, IRENA)
- **BESS databases** (Energy Storage News, Wood Mackenzie ESS)
- **EU-projects portals** (ENTSO-E TYNDP per grid)
- **Press release ufficiali degli owner** (es. Anglo American, Microsoft)

**Frequenza.** Continuo (ogni 6h refresh).

**Dove appare.** Projects list, Project detail, Compare, Country ID side panel.

---

## 7.2 CAPEX estimate (Stima investimento)

**Cosa misura.** Quanti dollari (in milioni) investe l'owner totalmente nel progetto.

**Perché è rilevante.** Proxy della dimensione del progetto. CAPEX alto → progetto rilevante → cable demand significativa.

**Fonte.** **EXT-A1** estrae dalla press release/articolo. Se non disponibile pubblicamente, lascia null.

**Sorgenti.** Stesso pool di A1.

**Conversione valuta.** Sempre normalizzato a USD (FX al momento di pubblicazione).

**Dove appare.** Projects list (colonna), Project detail KPI tile, Compare, AI Insight project.

---

## 7.3 Capacity (Capacità impianto)

**Cosa misura.** Per progetti energetici, la capacità in MW. Per mining, talvolta espressa come `production kt/year`.

**Fonte.** **EXT-A1**.

**Dove appare.** Projects list, Project detail.

**Esempio.** Un parco eolico da 250 MW.

---

## 7.4 Cable Demand Estimate (Stima domanda cavi) ⭐

**Cosa misura.** Stima dei chilometri di cavo che il progetto richiederà nel suo ciclo di vita. **Calcolato, non rilevato.**

**Perché è rilevante.** È il KPI più importante per Prysmian — collega un progetto esterno alla propria opportunità commerciale.

**Calcolo (formula intensità).**
```
INTENSITY = {
  copper      → 0.08 km / kt anno produzione
  lithium     → 0.06 km / kt anno
  nickel      → 0.07 km / kt anno
  data_center → 0.40 km / MW capacità
  wind        → 1.20 km / MW
  solar       → 0.50 km / MW
  BESS        → 0.30 km / MW
  grid        → 2.00 km / MW
}

cable_km = capacity * INTENSITY[project_type]
```

**Fonte.** Derivato da 7.3 + tabella intensità. La tabella è **INT-MAN** (curata dal team R&D Prysmian, aggiornabile come *data* non *code*).

**Dove appare.** Projects list, Project detail KPI tile, Compare row, AI Insight project, Country ID news/alerts panel.

---

## 7.5 Project Status

**Cosa misura.** Stadio del ciclo di vita: planning / construction / operational / cancelled.

**Importanza commerciale.**
- `planning` → opportunità futura (1-3 anni)
- `construction` → ordine cavi imminente (mesi)
- `operational` → opportunità di refresh / espansione
- `cancelled` → rimuovi dalla pipeline

**Fonte.** **EXT-A1** estrae e normalizza i termini variabili degli articoli.

---

## 7.6 Start Year / End Year (Anni vita)

**Cosa misura.** Anno previsto di inizio operations e fine ciclo di vita.

**Fonte.** **EXT-A1**.

**Dove appare.** Projects list, Project detail, timeline auto-built.

---

## 7.7 Flagged of Interest (Flag strategico) ⭐

**Cosa misura.** Bool: il progetto è di interesse strategico per Prysmian?

**Regola.**
```
flagged = (
  cable_demand_km >= 100
  AND country in [paesi prioritari Prysmian]
  AND status in {planning, construction}
)
OR
  LLM_judgment(name+owner+description) == "strategic"
```

**Fonte.**
- Regola: **EXT-A1** + **INT-MAN** (lista paesi prioritari).
- Judgment AI: **EXT-A1** (modello Claude Sonnet).

**Dove appare.** Star icon nelle tabelle, badge nel Project detail, filtro "Flagged only", AI Country Insight ("Highest gap…").

---

## 7.8 Total CAPEX Exposure (Esposizione CAPEX totale)

**Cosa misura.** Somma del CAPEX dei progetti filtrati.

**Calcolo.**
```
total_capex = Σ project.capex_estimate_musd
```

**Fonte.** Derivato da 7.2.

**Dove appare.** Projects page AI Insight, Compare row.

---

## 7.9 Total Cable Demand (Domanda totale cavi)

**Cosa misura.** Somma della cable demand dei progetti filtrati.

**Calcolo.**
```
total_cable = Σ project.cable_demand_estimate_km
```

**Dove appare.** Projects page AI Insight, Compare row.

---

## 7.10 Pipeline analytics — Capacity (MW) by country & status

**Cosa misura.** Per ciascun paese, MW totali planning vs construction vs operating.

**Perché è rilevante.** Identifica i mercati con più capacità in arrivo (construction) e con maturità raggiunta (operating).

**Calcolo.**
```
mwByCountry[c] = {
  planning:     Σ MW (status contains 'plan')
  construction: Σ MW (status contains 'constr' or 'build')
  operating:    Σ MW (status contains 'oper')
  total:        Σ MW
}
```

**Fonte.** Derivato da 7.3 + 7.5.

**Dove appare.** Projects page → bar chart "MW by country & status".

---

## 7.11 Top Owners by CAPEX

**Cosa misura.** I primi 6 owner per investimento totale (somma CAPEX dei loro progetti).

**Perché è rilevante.** Indica i clienti potenziali più "grossi" della pipeline. Apri una conversazione commerciale con i top owner.

**Calcolo.**
```
for each owner o:
  count(o) = numero progetti
  capex(o) = Σ capex
  mw(o)    = Σ capacity_mw
  hyper(o) = isHyperscaler(o)
top_owners = sort desc by capex, take 6
```

**Fonte.** Derivato da 7.1 + 7.2.

**Dove appare.** Projects page → tabella "Top owners".

---

## 7.12 Top-3 Owner Concentration

**Cosa misura.** Percentuale di CAPEX totale concentrata sui primi 3 owner.

**Perché è rilevante.** Alta concentrazione = "se perdo i top 3 perdo la pipeline" → rischio commerciale.

**Calcolo.**
```
top3_share = (Σ capex top 3 owner) / total_capex * 100
```

---

## 7.13 Avg Investment per MW

**Cosa misura.** Quanto costa mediamente "1 MW di capacità" nella pipeline. Indice di intensità del mercato.

**Calcolo.**
```
avg_inv_per_mw = total_capex / total_mw
```

---

## 7.14 Avg Project Duration

**Cosa misura.** Anni medi di durata progetto (end_year − start_year).

**Calcolo.**
```
avg_duration = Σ(end_year - start_year) / count(progetti con entrambi gli anni)
```

---

## 7.15 Green Project Share

**Cosa misura.** Quota di progetti "green" (rinnovabili, sustainable) sul totale.

**Identificazione.** Match su keyword nel nome/owner: `green`, `solar`, `renewable`, `heat`, `leed`, `breeam`, `pue`, `sustain`.

**Calcolo.**
```
green_count = | projects WHERE green_match |
green_share = green_count / total * 100
```

**Fonte.** **EXT-A1** (texto del progetto) + **INT-MAN** (keyword set è configurabile).

**Dove appare.** Projects page analytics card.

---

## 7.16 Hyperscaler Projects Count

**Cosa misura.** Quanti progetti hanno come owner uno dei grandi hyperscaler cloud.

**Identificazione.** Match owner contro lista: Microsoft, Google, Amazon/AWS, Meta, Digital Realty, Equinix, Oracle.

**Perché è rilevante.** Mercato datacenter è in boom — gli hyperscaler sono i clienti chiave.

**Fonte.** Derivato da 7.1 + lista **INT-MAN**.

**Dove appare.** Projects page analytics card.

---

## 7.17 Status Breakdown (Donut chart)

**Cosa misura.** Distribuzione progetti per status (Operating / Construction / Planning).

**Calcolo.** Count per categoria.

---

# 8. Categoria D — KPI macro/economici (market context)

> **Definizione di famiglia**: indicatori macro che muovono la domanda *strutturale* di cavi. Servono a contestualizzare i KPI commerciali: se le vendite in Italia calano, è specifico di Prysmian o è il mercato?

## 8.1 GDP (PIL paese)

**Cosa misura.** Prodotto Interno Lordo del paese, in indice o valore corrente.

**Perché è rilevante.** Correlazione moderata con domanda cavi (settori edilizia/industria).

**Fonte.** **EXT-A3 Micro/Macro KPI Alerts**.

**Sorgenti pubbliche.**
- **Eurostat** (`nama_10_gdp`) — gratis, API
- **Istat** (Italia)
- **INSEE** (Francia)
- **Destatis** (Germania)
- **INE** (Spagna)
- **CBS** (Olanda)

**Frequenza.** Trimestrale (con revisioni).

**Dove appare.** Market Trends → indicator card "GDP". Country ID → Macro snapshot tile "GDP trend".

---

## 8.2 Construction Output

**Cosa misura.** Volume produzione del settore costruzioni, indicizzato.

**Perché è rilevante.** **Driver primario** per cavi LV/MV nell'edilizia. Quando l'edilizia rallenta, cala la domanda residenziale e non-residenziale.

**Fonte.** **EXT-A3**.

**Sorgenti pubbliche.**
- **Eurostat** (`sts_copr_m`)
- Istat (it) `Produzione nelle costruzioni`
- ONS (UK)
- Destatis bauproduktion (DE)

**Frequenza.** Mensile.

---

## 8.3 Residential Market Output

**Cosa misura.** Output del segmento edilizia residenziale.

**Perché è rilevante.** Driver per cavi LSZH residenziali, accessori, distribuzione.

**Fonte.** **EXT-A3**.

**Sorgenti.** Same as 8.2, filtrato per `NACE F.41.20 Residential buildings`.

---

## 8.4 Non-Residential Market Output

**Cosa misura.** Output edilizia non-residenziale (uffici, retail, industriale, infrastruttura).

**Perché è rilevante.** Driver per cavi MV/HV in progetti commerciali e datacenter.

**Fonte.** **EXT-A3**. Same sorgenti, NACE F.41.20 (residential) e F.42 (civil engineering) escluso residential.

---

## 8.5 Building Permits YTD (Permessi edilizi)

**Cosa misura.** Numero permessi edilizi rilasciati da inizio anno.

**Perché è rilevante.** **Indicatore leading** — i permessi precedono la costruzione di 6-12 mesi, quindi *anticipano* la domanda di cavi.

**Fonte.** **EXT-A3**.

**Sorgenti.**
- Eurostat `sts_cobp_m`
- Istat permessi di costruire (it)
- Statistics Netherlands (CBS) bouwvergunningen

**Frequenza.** Mensile.

---

## 8.6 PMI (Purchasing Managers' Index)

**Cosa misura.** Sentiment manager acquisti industriali. > 50 espansione, < 50 contrazione.

**Perché è rilevante.** **Leading indicator** classico. Indica se le aziende prevedono di comprare di più o di meno nei prossimi mesi.

**Fonte.** **EXT-A3**.

**Sorgenti pubbliche/abbonate.**
- **S&P Global PMI** (HCOB Eurozone Manufacturing PMI) — la fonte primaria, API a pagamento
- **Trading Economics** (aggregatore con API)
- Report mensili pubblici (con delay)

**Frequenza.** Mensile (1° giorno del mese successivo).

**Dove appare.** Market Trends → indicatore PMI 12 mesi + sparkline.

---

## 8.7 Copper Price (LME)

**Cosa misura.** Prezzo rame al London Metal Exchange (USD/tonne, spot).

**Perché è rilevante.** **Driver di costo diretto** per Prysmian (rame è la materia prima principale). Mosse del rame impattano margine.

**Fonte.** **EXT-A3** (sub-agente commodity).

**Sorgenti.**
- **LME** (London Metal Exchange) — API a pagamento, dati ufficiali
- **Trading Economics** copper futures
- **Bloomberg / Refinitiv** terminal (abbonamento)
- Yahoo Finance (free, ritardato 15 min)

**Frequenza.** Giornaliera (intraday possibile).

**Dove appare.** Market Trends → hero card con area chart + peak indicator + AI annotation.

---

## 8.8 Cable Demand Nowcast (Indice composito) ⭐

**Cosa misura.** Indice 0-100 che combina PMI, permessi e construction output in un singolo segnale di "salute domanda cavi nel paese".

**Calcolo.**
```
nowcast = normalize(0..100) of weighted z-score combination of:
  - last PMI - 50   (deviazione dalla soglia)
  - permits momentum (YoY)
  - construction output growth
```

**Fonte.** Derivato da 8.2 + 8.5 + 8.6.

**Perché è rilevante.** Single number per BU/country team per capire "vado bene o male" senza guardare 3 grafici.

**Dove appare.** Market Trends → hero card "Cable Demand Nowcast".

---

## 8.9 Permits Momentum (YoY)

**Cosa misura.** Variazione anno-su-anno dei permessi YTD.

**Calcolo.**
```
permits_momentum = (permits_current_YTD / permits_same_period_LY - 1) * 100
```

**Fonte.** Derivato da 8.5.

---

## 8.10 Seasonality Index

**Cosa misura.** Indice di stagionalità mensile sulle costruzioni (base 100 = media).

**Significato.** Dicembre/gennaio bassi (~84-88), primavera ed estate alti (~115-118).

**Fonte.** **INT-MAN** (curato dal team data science Prysmian sulla base di storico) — può essere ricalcolato annualmente da serie storica di 8.2.

**Dove appare.** Market Trends → strip stagionalità.

---

## 8.11 Interest Rates / FX rates

**Cosa misura.** Tassi BCE/Fed, cambio EUR/USD/GBP.

**Perché è rilevante.** Tassi alti rallentano l'edilizia. FX impatta la competitività export.

**Fonte.** **EXT-A3**.

**Sorgenti.**
- **ECB Statistical Data Warehouse** (API gratuita)
- **FRED** (Federal Reserve) per US
- **BoE** per UK

**Frequenza.** Giornaliera/mensile.

> *Currently not exposed in the demo UI but planned for Phase 1.*

---

# 9. Categoria E — KPI competitivi & news

> **Definizione di famiglia**: segnali esterni qualitativi sui competitor e sul contesto. Notizie, mosse, eventi che cambiano il quadro competitivo o di business.

## 9.1 News Item (singolo articolo curato)

**Cosa misura.** Un articolo selezionato come rilevante per Prysmian.

**Attributi.**
- `source` (mining.com, S&P Global, Reuters, …)
- `title`, `summary` (2-3 frasi AI-generated)
- `relevance_score` (vedi §9.3)
- `segments` (taxonomy match: copper, EV, …)
- `countries` (NER)
- `published_at`
- `evidence_id` (audit trail)

**Fonte.** **EXT-A2 News Finder agent**.

**Sorgenti pubbliche/abbonate.**
- Riviste settore: **mining.com**, **Cable Industry**, **Recycling Today**, **DataCenter Knowledge**
- Aggregatori: **Google News RSS** per keyword set
- Notiziari finanziari: **Reuters**, **Bloomberg** (abbonamento)
- Riviste tecniche: **IEEE Spectrum**, **EUREL Cable Journal**
- Pubblicazioni industria EU: **Europacable**, **ICF Cable**

**Frequenza.** Ogni 3 ore.

**Dove appare.** News & Reports page, Dashboard "Latest intelligence", Country news panel.

---

## 9.2 Relevance Score (per news)

**Cosa misura.** Punteggio composito 0-1 di quanto la news sia rilevante per Prysmian.

**Calcolo.**
```
relevance = 0.30 * taxonomy_match     (overlap keyword config)
          + 0.25 * geo_relevance       (paese in regions seguite)
          + 0.20 * source_authority    (rank pubblicazione)
          + 0.15 * recency             (decay 30 giorni)
          + 0.10 * embedding_proximity (cosine con topic vector Prysmian)
```

**Fonte.** Calcolato da **EXT-A2** durante extraction.

**Soglie:**
- ≥ 0.85 → high (chip verde)
- 0.65–0.84 → medium (chip blu)
- < 0.65 → low (non surfacato in Review Queue)

**Dove appare.** News page, Review Queue, Alerts.

---

## 9.3 Competitive Moves (Mosse competitor)

**Cosa misura.** Eventi specifici di un competitor: pricing, capacity, partnership, prodotto, M&A.

**Esempi.**
- "Nexans · Capacity · New MV cable line announced — Battipaglia plant" (high intensity)
- "Hellenic Cables · Pricing · Aggressive bids on EDF tenders" (high intensity)
- "Lapp · Product · New CPR Cca-rated LSZH range" (low intensity)

**Tipologie:**
- **Pricing** — variazioni listino
- **Capacity** — nuove linee produttive, espansioni stabilimenti
- **Partnership** — JV, framework agreement
- **Product** — lancio nuovi prodotti/range
- **M&A** — acquisizioni / fusioni
- **Strategic** — riorganizzazioni, dismissioni

**Fonte.** **EXT-A6 Competitor Monitoring** (Phase 2).

**Sorgenti pubbliche.**
- Press release competitor (siti corporate Nexans, NKT, Prysmian, …)
- Investor relations / capital markets day
- Filing SEC/CONSOB
- LinkedIn corporate posts (con scraping etico)
- Riviste settore
- Conference (CIRED, CIGRE)

**Frequenza.** Ogni 6 ore.

**Dove appare.** Market Trends page → tabella "Competitive moves" per paese.

---

## 9.4 Intensity (di mossa competitiva)

**Cosa misura.** Severità della mossa: `high` / `med` / `low`.

**Logica.**
- `high` = impatto diretto sul mercato Prysmian (es. capacità grande, partnership con TSO)
- `med` = significativo ma indiretto
- `low` = informativo

**Fonte.** **EXT-A6** classifica via LLM.

---

## 9.5 Customer Event

**Cosa misura.** Evento su un cliente chiave: vincita progetto, cambio leadership, espansione capacità, annuncio capex.

**Tipologie.**
- Project win (es. "Terna vince tender HVDC")
- Leadership change (nuovo CEO/Procurement Director)
- Capacity expansion (nuovo stabilimento)
- CAPEX announcement (piano investimenti pluriennale)
- Financial event (risultati Q4, M&A)

**Fonte.** **EXT-A5 Customer Monitoring** (Phase 2).

**Sorgenti.**
- Salesforce list (sync nightly) → per sapere QUALI clienti monitorare
- Annual reports / quarterly filings
- Press release cliente
- LinkedIn executives posts
- News rilevanti (dedup con A2)

**Frequenza.** Ogni 6 ore.

**Dove appare (Phase 2).** Alerts inbox tipo `customer`, drill-down customer (panel "Recent events").

---

## 9.6 Policy / Regulatory Event

**Cosa misura.** Programma pubblico, legge, normativa che impatta domanda cavi.

**Esempi reali demo.**
- **Italy**: PNRR Schools 2.0 (€3.9B, impact high) — obbliga CPR Cca
- **Italy**: PNRR Healthcare (€8.7B, impact high)
- **France**: France 2030 — Industry (impact high)
- **Germany**: Stromnetzausbau TenneT/Amprion (HVDC, impact high)
- **Germany**: GEG Building Energy Act 2026 (heat pumps, impact med)
- **Spain**: PERTE Renewables (impact high)
- **Netherlands**: Offshore Wind 2030 (impact high)

**Attributi.**
- `country`, `name`, `segment`, `window` (Q3 2026 – Q2 2027), `impact` (high/med/low), `note`

**Fonte.** **EXT-A3** (per parte numerica/temporale) + **EXT-A2** (per scoperta) + **INT-MAN** (curatura MI).

**Sorgenti pubbliche.**
- Ministeri (sviluppo economico, transizione ecologica)
- EU Commission press releases
- Gazzetta Ufficiale (UE, IT)
- Bundesgesetzblatt (DE)
- Trade press settore costruzioni

**Frequenza.** Settimanale.

**Dove appare.** Market Trends page → tabella "Policies & programs".

---

# 10. Categoria F — KPI alert & AI/system

> **Definizione di famiglia**: alert generati dalle regole + metriche operative dell'AI stessa.

## 10.1 Alert (singolo segnale)

**Cosa misura.** Un evento che ha superato una soglia o una regola.

**Tipi.**
- `kpi` — deviazione KPI (es. permessi YoY < -5%)
- `project` — nuovo progetto flagged
- `news` — news ad alta rilevanza
- `competitor` — mossa competitor

**Severity.**
- `high` (score ≥ 0.85)
- `medium` (0.65–0.84)
- `low` (< 0.65, non surfacato di default)

**Fonte.** Sintesi da gold + agenti A3/A1/A2/A6.

**Dove appare.** Alerts inbox, badge sidebar.

---

## 10.2 Alert Confidence

**Cosa misura.** Confidenza dell'agente nella validità dell'alert.

**Calcolo.** Per alert KPI = confidence della regola; per news = relevance_score; per project = funzione di capex+flagged.

**Fonte.** Derivato.

---

## 10.3 Unread Alerts

**Cosa misura.** Numero alert non letti dall'utente corrente.

**Fonte.** Runtime per-user state.

**Dove appare.** Badge sidebar, dashboard chip.

---

## 10.4 Review Queue Status counts (Draft / Validated / Rejected / Published)

**Cosa misura.** Quanti item AI sono in ciascuno stato del workflow HITL.

**Fonte.** `audit.review_decisions` + count item gold senza decision (= draft).

**Dove appare.** Review Queue stat pills, dashboard.

---

## 10.5 AI Confidence Score (per item)

**Cosa misura.** Quanto l'agente è confidente sul singolo item prodotto.

**Calcolo (Phase 1).**
```
confidence = 0.4 * source_reliability
           + 0.3 * extraction_certainty (LLM self-reported, calibrato)
           + 0.2 * consistency_check (cross-source agreement)
           + 0.1 * recency
```

**Fonte.** Calcolato da agente, scritto in `audit.evidence_metadata`.

---

## 10.6 Avg AI Confidence (dashboard KPI)

**Cosa misura.** Media del confidence score su tutti gli AI outputs di un periodo.

**Calcolo.**
```
avg_confidence = AVG(audit.evidence_metadata.confidence_score) over 7d
```

**Dove appare.** Dashboard → KPI tile "AI confidence" (92% nel demo).

---

## 10.7 Agent Health KPIs (per agent)

| KPI | Cosa misura | Fonte |
|---|---|---|
| **Active agents count** | Quanti agenti running su 6 totali | Derivato |
| **Total runs (7d)** | Esecuzioni totali in 7 giorni | `audit.agent_runs` |
| **Items written back** | Numero output prodotti dagli agenti | `audit.agent_runs.items_produced` somma |
| **Avg feedback score** | % di item validati dalla MI | Derivato da `audit.review_decisions` |
| **Last run latency** | Tempo esecuzione ultima run | `audit.agent_runs.latency_ms` |
| **Last run status** | success / partial / error | idem |
| **Schedule** | Cron string corrente | Config |
| **Runs count** | Totale storico runs | Count audit.agent_runs |

**Dove appare.** Agents Control Center page.

---

## 10.8 Today's AI Brief (banner narrativo)

**Cosa misura.** Sintesi quotidiana in linguaggio naturale.

**Calcolo.** Template che incorpora:
- `newsCount` (count news_curated)
- `projectsTotal` (count mining_projects)
- `flaggedCount` (count flagged projects)
- `draftsCount` (count review_queue draft)
- `highAlerts` (count alerts high severity)
- frase chiusura sul commodity (placeholder)

**Fonte.** Derivato da tutti i counter sopra.

**Dove appare.** Dashboard → hero AI Brief banner.

---

# 11. Riepilogo: matrice sorgenti × KPI (cheat sheet)

| KPI | INT-SAP | INT-SFDC | INT-MAN | EXT-A1 | EXT-A2 | EXT-A3 | EXT-A4 | EXT-A5 | EXT-A6 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Sales by Customer | ●●● | | ○ | | | | | | |
| Sales by Product | ●●● | | ○ | | | | | | |
| Market Value by Customer | | ○ | ●●● | | | | | ●● | |
| Share of Wallet | ●● | ○ | ●●● | | | | | ● | |
| Account Tier | | ●●● | | | | | | | |
| Open Opportunities | | ●●● | | | | | | | |
| Annual Revenue (customer) | | ●● | | | | | | ●● | |
| Material Number / Type / Group | ●●● | | | | | | | | |
| Standard Price / Moving Avg | ●●● | | | | | | | | |
| Stock per plant / Lead time | ●●● | | | | | | | | |
| Volume YTD (material) | ●●● | | | | | | | | |
| Project (anagrafica) | | | ○ | ●●● | | | | | |
| CAPEX estimate | | | | ●●● | | | | | |
| Capacity (MW) | | | | ●●● | | | | | |
| Cable Demand Estimate | | | ●● | ●●● | | | | | |
| Project Status | | | | ●●● | | | | | |
| Flagged of Interest | | | ●● | ●●● | | | | | |
| Pipeline analytics aggregate | | | | ●●● | | | | | |
| Hyperscaler Projects | | | ●● | ●●● | | | | | |
| Green Project Share | | | ●● | ●●● | | | | | |
| GDP | | | | | | ●●● | | | |
| Construction Output | | | | | | ●●● | | | |
| Residential / Non-Residential | | | | | | ●●● | | | |
| Building Permits | | | | | | ●●● | | | |
| PMI | | | | | | ●●● | | | |
| Copper Price | | | | | | ●●● | | | |
| Interest Rates / FX | | | | | | ●●● | | | |
| Cable Demand Nowcast | | | | | | ●●● | | | |
| Seasonality Index | | | ●●● | | | ●● | | | |
| News Item / Relevance Score | | | | | ●●● | | | | |
| Competitive Moves / Intensity | | | | | | | | | ●●● |
| Customer Events | | ●● | | | | | | ●●● | |
| Policy / Regulatory | | | ●● | | ●● | ●●● | | | |
| Tech Trends (Swift) | | | | | | | ●●● | | |
| Alert (KPI) | | | | | | ●●● | | | |
| Alert (Project) | | | | ●●● | | | | | |
| Alert (Competitor) | | | | | | | | | ●●● |
| Alert (Customer) | | | | | | | | ●●● | |
| Alert (News) | | | | | ●●● | | | | |
| AI Confidence (per item) | | | | derivato | derivato | derivato | derivato | derivato | derivato |
| Agent Health (run stats) | | | | derivato | derivato | derivato | derivato | derivato | derivato |
| Review Queue counts | | | | derivato | derivato | derivato | derivato | derivato | derivato |
| Today's AI Brief | | | | derivato | derivato | derivato | derivato | derivato | derivato |

Legenda: ●●● fonte primaria · ●● fonte secondaria/arricchimento · ● fonte di fallback · ○ fonte manuale ammessa solo in assenza di altro

---

# 12. Quanti KPI sono in mano agli agenti vs interni?

**Sintesi numerica** (sulla base della tabella sopra):

| Famiglia | KPI count | Da interno (SAP/SFDC) | Da agenti AI | Misto |
|---|:---:|:---:|:---:|:---:|
| Commerciali (cliente) | 12 | 10 | 0 | 2 (Market Value, Annual Revenue) |
| Prodotto/SAP | 10 | 10 | 0 | 0 |
| Pipeline progetti | 17 | 0 | 15 | 2 (Cable Demand uses A1 + INT-MAN ratios; Flagged uses A1 + INT-MAN priority list) |
| Macro/economici | 10 | 0 | 10 | 0 |
| Competitivi / News | 6 | 0 | 6 | 0 |
| AI / sistema | 8 | 0 | 8 (derivati da audit) | 0 |

**~ 35 KPI su 63 totali (≈ 55%) sono alimentati dai 6 agenti AI**, in particolare:
- A1 Project Scouting alimenta da solo ~ 17 KPI (tutta la pipeline)
- A3 KPI Alerts alimenta ~ 10 KPI (tutto il macro)
- A2 News Finder + A6 Competitor + A5 Customer copertura intelligence qualitativa
- A4 Swift Finder è il più "nicchia" — solo trend tech

I restanti **~28 KPI (45%) richiedono integrazione interna SAP + Salesforce** — è il "necessary plumbing" senza cui il Hub resta solo intelligence esterna.

---

# 13. Roadmap di alimentazione dei KPI

Per onestà di pianificazione, indichiamo il **path realistico** per popolare ciascuna famiglia:

| Famiglia | MVP (demo) | Phase 1 | Phase 2 |
|---|---|---|---|
| Commerciali | Manual seed CSV | SFDC + SAP integration | Real-time |
| Prodotto/SAP | Synthetic deterministic | SAP BAPI batch nightly | SAP real-time event |
| Pipeline progetti | Agent A1 (impl) + seed | A1 production + Eurelectric/GIE feed | + abbonamenti CRU/WoodMac |
| Macro/economici | Hardcoded series | Agent A3 implemented + Eurostat API | + multiple data providers |
| Competitivi | Hardcoded events | Agent A6 implemented | + Bloomberg/Refinitiv |
| News | Agent A2 (impl) | Production scale | + paid feeds |
| AI/system | Live | Live | + cost optimization |

---

# 14. Glossario sorgenti pubbliche e abbonamenti citati

| Sorgente | Tipo | Cosa fornisce | Costo |
|---|---|---|---|
| **Eurostat** | API pubblica | KPI macro EU armonizzati | Gratis |
| **Istat / INSEE / Destatis / INE / CBS** | API pubbliche nazionali | KPI specifici per paese | Gratis |
| **LME** | API pagamento | Prezzi metalli (rame, alluminio) | ~$1k-10k/anno |
| **S&P Global PMI / Market Intelligence** | API abbonamento | PMI mondiale + mining DB | $10k-100k+/anno |
| **BloombergNEF** | Abbonamento | Energy projects DB | $20k+/anno |
| **Wood Mackenzie** | Abbonamento | Mining + energy projects | $50k+/anno |
| **CRU** | Abbonamento | Mining + metals analytics | $30k+/anno |
| **Reuters / Bloomberg terminal** | Abbonamento | News e dati finanziari | $24k/seat/anno (Bberg) |
| **mining.com** | RSS gratis | News mining | Gratis |
| **Trading Economics** | API mista | Aggregatore KPI + commodities | $1k-10k/anno |
| **Google News RSS** | API gratis | Aggregatore news per keyword | Gratis |
| **D&B / ZoomInfo** | Abbonamento | Enrichment account (revenue, employees) | $20k+/anno |
| **Dataminr / Factiva** | Abbonamento | News intelligence real-time | $30k+/anno |
| **DC Byte / Datacenter Knowledge** | Abbonamento + free | DB datacenter | varia |
| **IRENA / IEA** | API gratis | KPI rinnovabili globali | Gratis |
| **ENTSO-E TYNDP** | Gratis | EU grid projects 10-year plan | Gratis |

---

# 15. Cosa fare se un KPI mostra "—" o "Phase 2"?

Nel demo molti KPI sono visibili ma popolati con dati seed o sintetici. La regola di lettura:

| Indicatore visuale | Significato | Cosa serve in Phase 1 |
|---|---|---|
| Badge `P2` o `Phase 2` | KPI definito ma non ancora attivo | implementazione agente o integrazione |
| Stringa `Demo view` in footer | Dati deterministici dal nome | API SAP/Salesforce |
| `seed` come data source | Dati da CSV iniziale | Agent live |
| `live` come data source | Dati prodotti da agente reale | OK, attivo |
| Filtro applicato ma valori invariati | UI del filtro pronta, logica server da implementare | Query filter param |

---

# 16. Sintesi finale per chi ha letto fino qui

In sintesi grossolana, il Hub ha 3 fonti di dati che concorrono a 6 famiglie di KPI:

```
                     ┌──────────────┐
                     │ FONTI INTERNE│
   SAP (ERP) ────────│  - Vendite   │
   Salesforce (CRM)──│  - Materiali │──┐
   Input manuali ────│  - Stime MI  │  │
                     └──────────────┘  │
                                       ▼
                                 ┌───────────┐
                                 │  KPI Hub  │
                                 │ (gold +   │
                                 │  derived) │
                                       ▲
                     ┌──────────────┐  │
                     │ AGENTI AI    │  │
   News web ─────────│ A1 Scouting  │  │
   Macro DB ─────────│ A2 News      │──┘
   Competitor news ──│ A3 KPI       │
   Customer feeds ───│ A4 Swift     │
   Mining DB ────────│ A5 Customer  │
                     │ A6 Competit. │
                     └──────────────┘
```

**Il 45% dei KPI viene dall'interno** (SAP + SFDC) — è la base "ferma" del Hub.
**Il 55% viene dagli agenti AI** — è il valore aggiunto del progetto.
**Le due metà si incontrano nel calcolo** (es. SoW = vendite SAP / mercato stimato dagli agenti) — questa è la fusione che rende il Hub "intelligente".

---

*EY for Prysmian Group — KPI Catalog · May 2026*
