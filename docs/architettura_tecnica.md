# Architettura tecnica — Tool Generazione Relazioni OCC

## Visione d'insieme

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐     ┌──────────────┐
│   PRATICA    │────▶│   DOCUMENTI       │────▶│   DATI STRUTTURATI │────▶│  RELAZIONE   │
│ (debitore,   │     │ (upload + estraz.)│     │  (Supabase tables) │     │  (Word, .docx)│
│  procedura)  │     └──────────────────┘     └───────────────────┘     └──────────────┘
└─────────────┘              │                          │                        ▲
                              │                          │                        │
                       ┌──────▼──────┐          ┌────────▼────────┐    ┌─────────┴────────┐
                       │ OCR + regole │          │  Review umano    │    │  RAG normativo    │
                       │ (AdER, ecc.) │          │  (validazione    │    │  (CCII + corrett. │
                       │ + AI (resto) │          │  prof. prima     │    │  + circolari,     │
                       └─────────────┘          │  di generare)    │    │  pgvector)        │
                                                  └─────────────────┘    └───────────────────┘
```

## Componenti

### 1. Gestione pratica (già in parte esistente nel dashboard)
- Creazione pratica → nome/i debitore/i, procedura selezionata (o "da determinare")
- Stato pratica (raccolta documenti → dati validati → relazione generata → depositata)

### 2. Upload + estrazione documenti
Due percorsi paralleli, in base al tipo di documento:

**Percorso A — Documenti standardizzati** (cartelle esattoriali AdER, visure camerali/catastali in formato omogeneo)
- OCR (se scansionati) → parsing con regole fisse (regex/template per campo: numero cartella, importo, tributo, ente, anno)
- Alta affidabilità, basso costo per documento, ma copre solo i tipi di documento davvero standard

**Percorso B — Documenti eterogenei** (estratti conto, buste paga, contratti di finanziamento, sentenze, CU/730)
- Estrazione via Claude (API, come già previsto dal Claudeception in Artifacts) con prompt specifico per tipo di documento, output in JSON strutturato secondo lo schema dati
- Qui serve un passaggio di **classificazione automatica del documento** (che tipo è?) prima di scegliere il prompt di estrazione giusto

**Punto critico**: qualunque sia il percorso, i dati estratti **non vanno mai in relazione automaticamente** — passano sempre da una schermata di validazione dove il professionista conferma/corregge prima che alimentino la relazione. Questo è essenziale sia per l'affidabilità (l'estrazione può sbagliare) sia per la responsabilità professionale dell'atto.

### 3. Modello dati (Supabase / Postgres)
Basato sul "nucleo comune" identificato nello schema delle relazioni:
- `pratiche` (id, procedura, stato, debitori collegati)
- `debitori` (anagrafica, nucleo familiare)
- `creditori` (denominazione, PEC, tipologia credito)
- `posizioni_debitorie` (creditore, importo, tipologia, procedura di origine)
- `patrimonio` (immobiliare/mobiliare, descrizione, valore stimato)
- `redditi` (serie storica per anno, per componente nucleo)
- `spese_sostentamento` (voce, importo mensile)
- `documenti` (file caricato, tipo, stato estrazione, dati estratti grezzi)
- Tabelle specifiche procedura (es. `piano_riparto` per liquidazione, `classi_creditori` per concordato minore) collegate via `pratica_id`

### 4. Layer normativo (RAG su CCII)
- Testi CCII + correttivi + circolari → chunking per articolo/comma → embeddings → **pgvector su Supabase** (già disponibile nel tuo stack, non serve un altro servizio)
- Quando si genera una sezione argomentativa (es. "cause dell'indebitamento", art. 76 co.2 lett. a), il motore recupera gli articoli pertinenti + eventualmente lo stile delle stesse sezioni nelle 8 relazioni approvate (few-shot) e li passa a Claude insieme ai dati della pratica
- Aggiornabile nel tempo: se esce un correttivo, si ri-processano solo i testi nuovi, senza toccare il codice

### 5. Motore di generazione
Due modalità, coerenti con la distinzione emersa nell'analisi:
- **Compilazione diretta**: dati strutturati → tabelle Word (le ~10-14 tabelle numeriche per relazione). Meccanico, deterministico, uso della skill docx per generare il file.
- **Generazione argomentata**: dati + norma recuperata dal RAG + esempi dalle relazioni approvate → testo narrativo (Claude via API). Qui il professionista rivede sempre prima del deposito — il tool è un acceleratore della bozza, non un sostituto della revisione professionale.
- Assemblaggio finale: sezioni fisse + sezioni condizionali attivate secondo le regole nello schema (es. Cram Down si attiva solo se manca l'adesione dell'Erario) → file .docx

---

## Fasi di sviluppo consigliate (una alla volta, ciascuna validata prima di procedere)

Coerente con l'approccio che hai già seguito finora — ogni fase deve produrre qualcosa di utilizzabile e testabile da solo, non un pezzo di un sistema che funziona solo a fine percorso.

**Fase 0 — Dashboard dinamica** *(già in corso)*
Completare il collegamento dashboard → dati reali, come da tuo piano attuale. Non tocca questo tool.

**Fase 1 — Compilazione manuale + generazione Word**
Il professionista inserisce i dati a mano (form strutturato, non upload/estrazione) → il sistema genera la relazione Word con le tabelle compilate e le sezioni fisse. Le sezioni argomentative restano da scrivere a mano in questa fase, oppure generate con un prompt semplice senza RAG normativo.
→ **Valore immediato**: elimina già gran parte del lavoro di formattazione/impaginazione, anche senza automazione dell'estrazione. Testabile subito su una pratica reale.

**Fase 2 — Estrazione documenti (percorso A, standardizzati)**
Aggiungere OCR + parsing per cartelle AdER (il tipo di documento più frequente e più standardizzato — hai già esperienza diretta da CartellManager).
→ Riduce il tempo di inserimento manuale sulla parte più ripetitiva.

**Fase 3 — Estrazione documenti (percorso B, AI)**
Estrazione via Claude per documenti eterogenei (estratti conto, buste paga, contratti).

**Fase 4 — RAG normativo + generazione argomentata**
Solo qui si aggiunge il layer CCII e la generazione assistita delle sezioni narrative, quando il resto della pipeline è già validato e in uso reale.

**Fase 5 — Sezioni condizionali intelligenti**
Il sistema propone automaticamente quali sezioni condizionali attivare in base ai dati (es. rileva un fallimento pregresso dai documenti → suggerisce di attivare la sezione "Resoconto solvibilità 5 anni").

---

## Nota su costi/complessità

Le fasi 2-4 comportano chiamate API (OCR + Claude) per ogni documento/sezione — vale la pena, quando ci arrivi, definire un modello di costo per pratica da riflettere nei crediti consumabili del pricing (che hai già previsto nel modello a due livelli abbonamento + crediti).
