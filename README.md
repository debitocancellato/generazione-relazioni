# Generazione Relazioni OCC — DebitoCancellato

Motore per la generazione automatica delle relazioni OCC (Piano del consumatore, Concordato minore,
Liquidazione controllata, Esdebitazione dell'incapiente) nell'ambito del CCII (Codice della Crisi
d'Impresa e dell'Insolvenza).

## Stato del progetto

**MVP in sviluppo — Fase 1** (vedi `docs/architettura_tecnica.md` per il piano completo a fasi):
compilazione dati strutturati → generazione documento Word, senza ancora estrazione automatica
dei documenti né layer normativo RAG.

Questo repo nasce come motore standalone, sviluppato in collaborazione con Claude (chat), pensato
per essere portato/integrato successivamente in un progetto più ampio con Claude Code (backend,
Supabase, UI).

## Struttura

```
src/
  schema/       -> definizioni JSON Schema dei dati per procedura (liquidazione, concordato minore, piano consumatore)
  generator/     -> motore di generazione dei documenti Word (docx)
  data/samples/  -> dati di esempio (anonimizzati) per test
docs/           -> analisi struttura relazioni + architettura tecnica
tests/          -> test del motore di generazione
```

## Documenti di riferimento

- `docs/schema_relazioni.md` — analisi strutturale delle 8 relazioni approvate dal Tribunale, con
  sezioni fisse/condizionali/variabili per ciascuna procedura
- `docs/architettura_tecnica.md` — architettura tecnica completa e fasi di sviluppo consigliate

## Database

Progetto Supabase dedicato: `debitocancellato-relazioni` (id progetto: `srkxnegosuptostttijc`,
regione eu-west-1). Non ancora popolato di schema/tabelle — verrà definito insieme al modello
dati man mano che l'MVP prende forma.

## Setup locale

```bash
npm install
cp .env.example .env   # compilare con le chiavi reali
npm run genera:liquidazione:demo
```
