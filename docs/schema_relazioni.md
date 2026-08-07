# Schema modulare delle Relazioni OCC — DebitoCancellato

Basato sull'analisi di 8 relazioni approvate dal Tribunale:
- **Liquidazione controllata** (5): Zambrano, Iervolino, Iuliano, Ruggiero Antonio, Russo Gennaro
- **Concordato minore** (2): Boccia, Milito (Geometra)
- **Piano del consumatore** (1): Bonagura/Bellusci

Legenda: 🟩 FISSA (sempre presente) · 🟨 CONDIZIONALE (presente solo in certe condizioni) · 🔵 VARIABILE (dato che cambia per pratica)

---

## 1. LIQUIDAZIONE CONTROLLATA (art. 268 e ss. CCII)

Procedura più standardizzata delle tre — struttura quasi identica nei 5 casi analizzati.

### 1.1 Attività svolte 🟩
Boilerplate procedurale (nomina OCC, documenti richiesti al debitore, data incarico). Cambia pochissimo tra pratiche.
- Variabili: 🔵 nome debitore, 🔵 data nomina OCC, 🔵 numero R.G.

### 1.2 Dati anagrafici del Debitore e situazione familiare 🟩
- Variabili: 🔵 nome/cognome, 🔵 C.F., 🔵 residenza, 🔵 stato civile, 🔵 composizione nucleo familiare (numero componenti, età figli), 🔵 professione/occupazione
- **Fonte documento**: carta d'identità, stato di famiglia, C.F.

### 1.3 Esposizione della situazione del Debitore 🟩

**1.3.1 Situazione debitoria** 🟩
- Tabella 2 — Riassunto per tipologia debito: 🔵 tipologia (mutui chirografari / tributi / finanziamenti consumo / contributi / retribuzioni professionisti / altro), 🔵 importo residuo, 🔵 % sul totale
- Grafico 1 — Distribuzione debitoria (derivato automaticamente da Tab.2)
- Tabella 3 — Dettaglio per creditore: 🔵 tipologia debito, 🔵 nome creditore, 🔵 numero progressivo
- **Fonte documento**: estratti conto, cartelle esattoriali AdER, contratti di finanziamento, decreti ingiuntivi

**1.3.2 Atti impugnati dai creditori** 🟩 (spesso "nessuno rilevato")
- Variabile: 🔵 presenza/assenza di contenziosi pendenti

**1.3.3 Situazione patrimoniale e reddituale** 🟩
- Tabella 4 — Patrimonio: 🔵 valore immobiliare, 🔵 valore mobiliare, 🔵 valore totale, 🔵 valore prima casa, 🔵 valore netto prima casa
- Tabella 5 — Serie storica redditi (6 anni): 🔵 reddito annuo per anno, per ciascun componente
- Tabella 6 — Redditi anno corrente: 🔵 reddito netto medio mensile debitore, 🔵 coniuge, 🔵 altri redditi, 🔵 totale (A)
- Tabella 7 — Spese mensili nucleo familiare: 🔵 voci di spesa (alimentari, abbigliamento, utenze, trasporti, telefonia, sanità...), 🔵 totale (B) — **riferimento normativo: art. 268 CCII** (quantificazione somme escluse dalla liquidazione per mantenimento dignitoso)
- Tabella 8 — Rapporto Rata/Reddito: derivato da A e B
- **Fonte documento**: CU/730/Redditi ultimi 6 anni, buste paga, estratti conto, ISEE

### 1.4 Resoconto sulla solvibilità ultimi 5 anni 🟨 CONDIZIONALE
Presente solo quando c'è una storia pregressa rilevante da spiegare (es. fallimento di società, cessazione attività d'impresa, periodo di "spossessamento" fallimentare). **Attivare quando**: dai documenti risulta un fallimento/liquidazione societaria pregressa, o comunque un evento che spiega un salto nella capacità reddituale.
- Contenuto tipicamente narrativo con riferimenti a sentenze (🔵 numero sentenza, 🔵 tribunale, 🔵 date chiusura procedura)
- Possibile citazione **art. 42 L.F.** (spossessamento fallimentare) se pertinente

### 1.5 Proposta di Liquidazione e Piano di Riparto 🟩
- Tabella 9 — Cronoprogramma liquidazione (3 anni): 🔵 vendita immobili, 🔵 vendita mobili, 🔵 reddito a disposizione, per anno
- Tabella 10 — Liquidazione patrimonio immobiliare: 🔵 descrizione bene, 🔵 valore di realizzo, 🔵 data vendita stimata
- Tabella 11 — Liquidazione patrimonio mobiliare (registrato/non registrato): stessi campi
- Tabella 12 — Spese prededucibili: 🔵 descrizione spesa (tipicamente compenso OCC), 🔵 importo, 🔵 data
- Tabella 13 — Quadro riassuntivo riparto: 🔵 categoria credito (prededucibile/privilegiato immobiliare/privilegiato mobiliare/chirografario), 🔵 totale credito, 🔵 credito soddisfatto, 🔵 % soddisfazione
- Grafico 2 — Prospetto riparto (derivato)
- **Fonte documento**: perizie di stima beni, visure immobiliari/mobiliari, calcolo compenso OCC (D.M. 202/2014)

### 1.6 Giudizio su completezza/attendibilità documentazione 🟩
Sezione argomentativa — valuta se la documentazione depositata è sufficiente e coerente.

### 1.7 Conclusioni 🟩
Riepilogo + richiesta di omologa.

### 1.8 Allegati 🟩
- Allegato A: Elenco analitico patrimonio immobiliare
- Allegato B: Elenco analitico patrimonio mobiliare registrato
- Allegato C: Elenco analitico patrimonio mobiliare non registrato
- Allegato D: Elenco creditori (con PEC)
- Allegato E: Dati relativi alla situazione debitoria
- Allegato F: Dettaglio progetto riparto

---

## 2. CONCORDATO MINORE (art. 74-80 CCII)

Meno esempi (2) ma pattern normativo molto puntuale — ogni sezione è ancorata a un comma specifico dell'art. 76 CCII.

### 2.1 Premessa e scopo dell'incarico 🟩
Boilerplate nomina.

### 2.2 Condizioni preliminari di ammissibilità 🟨
Presente esplicitamente in 1 caso su 2 (Milito) — verifica requisiti soggettivi/oggettivi. **Consigliato renderla fissa**, è un controllo che va sempre fatto anche se non sempre esplicitato come sezione a sé.

### 2.3 Informazioni su debitore e nucleo familiare 🟩
Stessi campi della liquidazione (1.2).

### 2.4 Esposizione situazione debitoria del ricorrente 🟩

**2.4.1 Cause dell'indebitamento e diligenza del debitore** 🟩 — **art. 76, co.2, lett. a) CCII**
Sezione narrativa: 🔵 racconto delle cause (perdita lavoro, malattia, crisi impresa, ecc.), argomentata per dimostrare la "diligenza" richiesta dalla norma (cioè che il debitore non ha contratto debiti in modo negligente/fraudolento).

**2.4.2 Composizione del debito e ragioni dell'incapacità di adempiere** 🟩 — **art. 76, co.2, lett. b) CCII**
- Tabella Elenco Creditori: 🔵 denominazione/ragione sociale, 🔵 PEC
- Tabella 2 — Riassunto situazione debitoria (stessa struttura di 1.3.1)
- **Fonte documento**: visure, PEC creditori (necessarie per le comunicazioni di procedura)

**2.4.3 Atti impugnati dai creditori** 🟩

**2.4.4 Resoconto solvibilità 5 anni, redditi, patrimonio, spese sostentamento** 🟩
- 9.2 Spese di sostentamento familiare
- 9.3 Patrimonio (immobiliare, liquidità/conti correnti, titoli/partecipazioni)
- Stessa granularità della liquidazione (Tab.4-8)

**2.4.5 Costi della Procedura** 🟩 — **art. 76, co.2, lett. e) CCII**
- Variabili: 🔵 compenso OCC (calcolato secondo D.M. 202/2014), 🔵 numero rate, 🔵 importo rata

### 2.5 Esposizione e contenuto della proposta concordataria 🟩

**2.5.1 Percentuali, modalità e tempi di soddisfacimento** 🟩
- 🔵 somma complessiva offerta, 🔵 durata piano (mesi), 🔵 struttura rate (quante e di che importo, cosa pagano)

**2.5.2 Determinazione % soddisfazione per creditore + confronto con ipotesi liquidatoria** 🟩
- Tabella di soddisfo (ipotesi omologa): 🔵 creditore, 🔵 quota privilegiata/chirografaria, 🔵 % soddisfo, 🔵 importo offerto — ripetuta per ciascun creditore
- Tabella di soddisfo (ipotesi liquidatoria): stesso schema, per il confronto di convenienza richiesto dalla norma
- Possibili classi separate (es. **art. 74, co.3 CCII** per crediti in classe distinta)

**2.5.3 Cram Down erariale/previdenziale** 🟨 CONDIZIONALE — **art. 80, co.3 CCII**
**Attivare quando**: l'Erario (Agenzia Entrate/Riscossione) o gli enti previdenziali non aderiscono alla proposta ma il piano è comunque più conveniente dell'alternativa liquidatoria. Richiede: 🔵 % crediti erariali/previdenziali sul totale voti, 🔵 dimostrazione maggioranza raggiunta nelle altre classi, 🔵 dimostrazione convenienza rispetto a liquidazione.

**2.5.4 Valutazione merito creditizio** 🟩 — **art. 76, co.3 CCII**
Verifica se i finanziatori hanno valutato il merito creditizio del debitore prima di erogare — rilevante per l'eventuale riduzione/esclusione di crediti concessi in violazione di questo dovere.

### 2.6 Conclusioni 🟩

### 2.7 Allegati 🟩
- Allegato A: Patrimonio immobiliare
- Allegato E: Compensi e spese OCC
- Allegato F: Conto economico previsionale
- Allegato G: Piani di rimborso analitici

---

## 3. PIANO DEL CONSUMATORE (art. 67-73 CCII)

⚠️ Un solo esempio disponibile (caso a due debitori, procedura familiare congiunta) — pattern da **validare con la prossima relazione reale** prima di irrigidirlo. Struttura numerata, stile leggermente diverso dalle altre due (più simile a un atto tecnico che a una relazione narrativa).

### 3.1 Requisiti di ammissibilità — distinzione masse, responsabilità patrimoniale 🟩 — **art. 66, co.3 CCII** (per procedure familiari con più debitori)
- 🔵 se procedura congiunta: distinzione tra massa attiva/passiva individuale e familiare
- Requisiti oggettivi di ammissibilità (soglie, assenza di cause ostative)

### 3.2 Situazione debitoria — masse passive 🟩
- Se più debitori: sezione per ciascun debitore + creditore (es. 5.1, 5.2 nel caso analizzato)
- 🔵 sintesi masse passive individuali e familiare

### 3.3 Stato di sovraindebitamento e solvibilità 🟩
Sezione argomentativa che dimostra lo stato di sovraindebitamento (equivalente concettualmente al "resoconto solvibilità" delle altre due procedure, ma qui è sempre presente e strutturale, non condizionale).

### 3.4 Trattamento dei singoli creditori 🟩
- Una sotto-sezione per ciascun creditore rilevante (es. creditore ipotecario, debiti fiscali/locali)
- 🔵 proposta di trattamento per ciascuno, 🔵 sintesi trattamento crediti erariali/locali

### 3.5 Durata, sostenibilità e convenienza del piano 🟩
- 🔵 durata (mesi/anni)
- Convenienza rispetto alla liquidazione (stesso confronto richiesto nel concordato minore)

### 3.6 Procedimento, misure protettive ed esecuzione del piano 🟩
- 🔵 richiesta di misure protettive al Tribunale (sospensione azioni esecutive)

### 3.7 Conclusioni e richieste finali 🟩

---

## Osservazioni trasversali per la progettazione del tool

1. **Le 3 procedure condividono un nucleo comune di dati** (anagrafica, situazione debitoria, patrimonio, redditi, spese, creditori con PEC) — questo nucleo può essere un unico modulo dati riusabile, alimentato una volta sola per pratica, che poi confluisce nella relazione qualunque sia la procedura scelta.

2. **Le sezioni condizionali sono un elemento chiave**: il tool non deve generare un documento fisso, ma un albero di sezioni dove alcune si attivano in base a condizioni derivate dai dati (es. "c'è un fallimento pregresso?" → attiva 1.4; "l'Erario ha aderito?" → se no, attiva 2.5.3 Cram Down).

3. **Le tabelle numeriche sono il punto a più alto ROI per l'automazione**: sono ~10-14 per relazione, hanno schema fisso, e i dati sorgente (buste paga, estratti conto, cartelle AdER, visure) sono già quelli che il cliente carica in fase di raccolta documentale — qui l'estrazione automatica fa risparmiare più tempo.

4. **Le sezioni narrative-argomentative** (cause indebitamento, giudizio di attendibilità, valutazione convenienza, Cram Down) richiedono ragionamento giuridico sui dati, non compilazione — è qui che serve il layer RAG sul CCII: il modello deve poter citare l'articolo pertinente e argomentare nello stile delle relazioni approvate, non solo riempire un placeholder.

5. **Rischio da presidiare**: il Piano del consumatore ha un solo esempio. Prima di costruire il template rigido per questa procedura, sarebbe utile o (a) recuperare almeno un'altra relazione approvata di questo tipo, o (b) partire comunque ma segnalare nel tool che questo template è "in validazione" finché non viene confermato su più casi reali.
