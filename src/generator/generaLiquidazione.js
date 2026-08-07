const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, HeadingLevel } = require("docx");
const {
  buildTable,
  heading1,
  heading2,
  tableCaption,
  bodyText,
  spacer,
  formatEuro
} = require("./docxHelpers");
const { validaDatiLiquidazione, controlliDiCoerenza } = require("./validate");

/**
 * Genera i Paragraph/Table della sezione "Attività svolte".
 */
function sezioneAttivitaSvolte(dati) {
  return [
    heading1("Attività svolte"),
    ...bodyText(
      `In data ${dati.pratica.dataNominaOCC} il sottoscritto ${dati.pratica.nomeOCC} è stato nominato ` +
      `Organismo di Composizione della Crisi nell'ambito della procedura di Liquidazione controllata ` +
      `promossa dal Sig./Sig.ra ${dati.debitore.nomeCompleto} (C.F. ${dati.debitore.codiceFiscale}), ` +
      `iscritta al R.G. n. ${dati.pratica.numeroRG} presso il Tribunale di ${dati.pratica.tribunale}. ` +
      `Sono stati acquisiti ed esaminati i documenti prodotti dal debitore a corredo della domanda, ` +
      `sulla base dei quali è stata redatta la presente relazione.`
    )
  ];
}

function sezioneDatiAnagrafici(dati) {
  const nf = dati.nucleoFamiliare;
  return [
    heading1("Dati anagrafici del Debitore e informazioni circa la situazione familiare"),
    ...bodyText(
      `${dati.debitore.nomeCompleto}, C.F. ${dati.debitore.codiceFiscale}, residente in ${dati.debitore.residenza}, ` +
      `${dati.debitore.statoCivile || "stato civile non specificato"}, di professione ${dati.debitore.professione}.`
    ),
    ...bodyText(
      `Il nucleo familiare è composto da ${nf.numeroComponenti} persone: ${nf.composizione}.`
    )
  ];
}

function sezioneSituazioneDebitoria(dati) {
  const sd = dati.situazioneDebitoria;

  const totaleResiduo = sd.debitoResiduoTotale;
  const riassuntoRows = sd.riassuntoPerTipologia.map(r => ({
    ...r,
    percTot: totaleResiduo ? (r.importoResiduo / totaleResiduo) * 100 : 0
  }));

  const content = [
    heading2("Situazione debitoria"),
    tableCaption("Tabella 2: Riassunto situazione debitoria"),
    buildTable(
      [
        { key: "tipologia", label: "Tipologia debito", widthPct: 55 },
        { key: "importoResiduo", label: "Debito residuo", widthPct: 25, format: "euro", align: "right" },
        { key: "percTot", label: "% Tot.", widthPct: 20, format: "percent", align: "right" }
      ],
      riassuntoRows
    ),
    spacer(),
    ...bodyText(
      `Il debito residuo totale accertato è pari a € ${formatEuro(totaleResiduo)}` +
      (sd.noteDebitoResiduo ? `, ${sd.noteDebitoResiduo}.` : ".")
    ),
    tableCaption("Tabella 3: Dettaglio situazione debitoria"),
    buildTable(
      [
        { key: "tipologia", label: "Tipologia debito", widthPct: 50 },
        { key: "creditore", label: "Creditore", widthPct: 50 }
      ],
      sd.dettaglioPerCreditore
    ),
    spacer(),
    heading2("Indicazione della eventuale esistenza di atti del Debitore impugnati dai creditori"),
    ...bodyText(dati.attiImpugnati || "Non risultano atti del Debitore impugnati dai creditori.")
  ];

  return content;
}

function sezioneCauseIndebitamento(dati) {
  return [
    heading1("Cause dell'indebitamento e diligenza impiegata dal debitore nell'assumere le obbligazioni"),
    ...bodyText(dati.causeIndebitamento)
  ];
}

function sezioneApportoTerziEBeniEsclusi(dati) {
  const content = [];

  if (dati.apportoTerzi) {
    const at = dati.apportoTerzi;
    content.push(
      heading1("Apporto di finanza esterna"),
      ...bodyText(
        `La proposta prevede l'apporto di € ${formatEuro(at.importo)} quale finanza esterna, ` +
        `${at.provenienza || "messa a disposizione da terzi"}, da versare ${at.tempistica || "secondo le tempistiche indicate nel piano"}. ` +
        (at.motivazione || "L'ammissibilità dell'apporto di finanza esterna nell'ambito della liquidazione controllata trova " +
          "riscontro in plurimi precedenti di merito (cfr. Trib. Arezzo; Trib. Parma, sent. 49/2023), che ne riconoscono la " +
          "compatibilità con l'unico requisito espressamente richiesto dall'art. 268, comma 3, CCII. Si dà atto che sul punto " +
          "sussistono in giurisprudenza orientamenti non del tutto uniformi, la cui valutazione è rimessa al Tribunale adito.")
      )
    );
  }

  if (dati.beniEsclusiDallaLiquidazione && dati.beniEsclusiDallaLiquidazione.length > 0) {
    content.push(
      heading1("Beni esclusi dalla liquidazione"),
      ...dati.beniEsclusiDallaLiquidazione.flatMap(bene =>
        bodyText(`${bene.descrizione}: ${bene.motivazione}`)
      )
    );
  }

  return content;
}

function sezioneStoriaPregressa(dati) {
  // SEZIONE CONDIZIONALE: generata solo se dati.storiaPregressaRilevante è valorizzato
  if (!dati.storiaPregressaRilevante) return [];
  const sp = dati.storiaPregressaRilevante;
  return [
    heading1("Resoconto sulla solvibilità del Debitore negli ultimi 5 anni"),
    ...bodyText(sp.descrizione),
    ...(sp.riferimentiProcedurali ? bodyText(sp.riferimentiProcedurali) : [])
  ];
}

function sezionePatrimonioReddituale(dati) {
  const p = dati.patrimonio;
  const valoreComplessivo = (p.valoreImmobiliare || 0) + (p.valoreMobiliare || 0);
  const valoreNettoPrimaCasa = valoreComplessivo - (p.valorePrimaCasa || 0);

  const r = dati.redditi;
  const s = dati.spese;

  const totaleReddito =
    (r.annoCorrente.redditoNettoMedioMensileDebitore || 0) +
    (r.annoCorrente.redditoNettoMedioMensileConiuge || 0) +
    (r.annoCorrente.ulterioreRedditoNettoMedioMensile || 0);

  const totaleSpese = s.voci.reduce((acc, v) => acc + (v.importo || 0), 0);
  const rapportoRataReddito = totaleReddito > 0 ? ((totaleReddito - totaleSpese) / totaleReddito) * 100 : 0;

  // Tabella 5: serie storica - anni come colonne
  const anni = r.serieStorica.map(x => x.anno);
  const larghezzaColonnaAnno = anni.length > 0 ? 70 / anni.length : 70;
  const serieStoricaTable = buildTable(
    [
      { key: "label", label: "Descrizione", widthPct: 30 },
      ...anni.map(a => ({ key: `y${a}`, label: `Anno ${a}`, widthPct: larghezzaColonnaAnno, format: "euro", align: "right" }))
    ],
    [
      Object.assign(
        { label: `Debitore: ${dati.debitore.nomeCompleto}` },
        Object.fromEntries(r.serieStorica.map(x => [`y${x.anno}`, x.redditoDebitore]))
      ),
      Object.assign(
        { label: "Altro Reddito" },
        Object.fromEntries(r.serieStorica.map(x => [`y${x.anno}`, x.altroReddito || 0]))
      )
    ]
  );

  return [
    heading2("Situazione patrimoniale e reddituale del debitore"),
    tableCaption("Tabella 4: Valore stimato del patrimonio del Debitore"),
    buildTable(
      [
        { key: "label", label: "", widthPct: 60 },
        { key: "valore", label: "", widthPct: 40, format: "euro", align: "right" }
      ],
      [
        { label: "Valore stimato del patrimonio immobiliare", valore: p.valoreImmobiliare },
        { label: "Valore stimato del patrimonio mobiliare", valore: p.valoreMobiliare },
        { label: "Valore complessivo del patrimonio", valore: valoreComplessivo },
        { label: "Valore immobile prima casa", valore: p.valorePrimaCasa },
        { label: "Valore patrimonio al netto della prima casa", valore: valoreNettoPrimaCasa }
      ]
    ),
    spacer(),
    tableCaption("Tabella 5: Serie storica dati reddituali personali"),
    serieStoricaTable,
    spacer(),
    tableCaption("Tabella 6: Dati Reddituali Debitore"),
    buildTable(
      [
        { key: "label", label: "Dati reddituali debitore", widthPct: 65 },
        { key: "valore", label: "", widthPct: 35, format: "euro", align: "right" }
      ],
      [
        { label: "Reddito netto medio mensile debitore", valore: r.annoCorrente.redditoNettoMedioMensileDebitore },
        { label: "Reddito netto medio mensile coniuge", valore: r.annoCorrente.redditoNettoMedioMensileConiuge || 0 },
        { label: "Ulteriore reddito netto medio mensile", valore: r.annoCorrente.ulterioreRedditoNettoMedioMensile || 0 },
        { label: "A) Totale Reddito netto medio Mensile", valore: totaleReddito }
      ]
    ),
    spacer(),
    tableCaption("Tabella 7: Spese medie mensili nucleo familiare Debitore"),
    buildTable(
      [
        { key: "descrizione", label: "Voce di spesa", widthPct: 60 },
        { key: "importo", label: "Importo", widthPct: 40, format: "euro", align: "right" }
      ],
      [...s.voci, { descrizione: "B) Totale Spese medie Mensili", importo: totaleSpese }]
    ),
    spacer(),
    ...bodyText(
      "In adempimento a quanto previsto dall'art. 268 del Codice della Crisi d'Impresa e dell'Insolvenza (CCII), " +
      `si procede alla quantificazione delle somme da escludere dalla liquidazione, in quanto necessarie al ` +
      `dignitoso mantenimento del debitore e del suo nucleo familiare, composto da ${dati.nucleoFamiliare.numeroComponenti} persone.`
    ),
    tableCaption("Tabella 8: Rapporto Rata Reddito Attuale"),
    buildTable(
      [
        { key: "label", label: "", widthPct: 70 },
        { key: "valore", label: "", widthPct: 30, format: "percent", align: "right" }
      ],
      [{ label: "Capacità reddituale residua rispetto al reddito disponibile", valore: rapportoRataReddito }]
    )
  ];
}

function sezionePianoRiparto(dati) {
  const pr = dati.pianoRiparto;

  const anni = pr.cronoprogramma.map(x => x.anno);
  const larghezzaColonnaAnnoRiparto = anni.length > 0 ? 60 / anni.length : 60;
  const cronoTable = buildTable(
    [
      { key: "label", label: "", widthPct: 40 },
      ...anni.map(a => ({ key: `y${a}`, label: `${["I", "II", "III", "IV", "V"][a - 1] || a} Anno`, widthPct: larghezzaColonnaAnnoRiparto, format: "euro", align: "right" }))
    ],
    [
      Object.assign({ label: "Vendita Immobili" }, Object.fromEntries(pr.cronoprogramma.map(x => [`y${x.anno}`, x.venditaImmobili]))),
      Object.assign({ label: "Vendita Mobili" }, Object.fromEntries(pr.cronoprogramma.map(x => [`y${x.anno}`, x.venditaMobili]))),
      Object.assign({ label: "Reddito a disposizione della procedura" }, Object.fromEntries(pr.cronoprogramma.map(x => [`y${x.anno}`, x.redditoADisposizione]))),
      Object.assign(
        { label: "Totale somme a disposizione" },
        Object.fromEntries(pr.cronoprogramma.map(x => [`y${x.anno}`, x.venditaImmobili + x.venditaMobili + x.redditoADisposizione]))
      )
    ]
  );

  const totaleSpesePrededucibili = pr.spesePrededucibili.reduce((a, v) => a + v.importo, 0);

  const content = [
    heading1("Proposta di Liquidazione e Piano di Riparto"),
    ...bodyText(
      "Sulla base delle informazioni acquisite, in relazione alla situazione debitoria, al patrimonio immobiliare " +
      "e mobiliare del debitore e alla capacità reddituale dello stesso, si riporta di seguito una proposta di " +
      "Piano di Liquidazione, al fine di evidenziare la fattibilità dello stesso."
    ),
    tableCaption("Tabella 9: Cronoprogramma liquidazione"),
    cronoTable,
    spacer()
  ];

  if (dati.patrimonio.elencoImmobili && dati.patrimonio.elencoImmobili.length) {
    content.push(
      tableCaption("Tabella 10: Liquidazione patrimonio immobiliare"),
      buildTable(
        [
          { key: "descrizione", label: "Descrizione", widthPct: 50 },
          { key: "valoreRealizzo", label: "Valore di realizzo", widthPct: 25, format: "euro", align: "right" },
          { key: "dataVenditaStimata", label: "Data Vendita", widthPct: 25 }
        ],
        dati.patrimonio.elencoImmobili
      ),
      spacer()
    );
  }

  if (dati.patrimonio.elencoMobili && dati.patrimonio.elencoMobili.length) {
    content.push(
      tableCaption("Tabella 11: Liquidazione patrimonio mobiliare"),
      buildTable(
        [
          { key: "descrizione", label: "Descrizione", widthPct: 50 },
          { key: "valoreRealizzo", label: "Valore di realizzo", widthPct: 25, format: "euro", align: "right" },
          { key: "dataVenditaStimata", label: "Data Vendita", widthPct: 25 }
        ],
        dati.patrimonio.elencoMobili
      ),
      spacer()
    );
  }

  content.push(
    tableCaption("Tabella 12: Spese prededucibili procedura"),
    buildTable(
      [
        { key: "descrizione", label: "Descrizione spesa", widthPct: 45 },
        { key: "importo", label: "Importo", widthPct: 30, format: "euro", align: "right" },
        { key: "data", label: "Data", widthPct: 25 }
      ],
      pr.spesePrededucibili
    ),
    spacer(),
    ...bodyText(`Il totale delle spese relative alla procedura di liquidazione sarebbe pari ad € ${formatEuro(totaleSpesePrededucibili)}.`),
    tableCaption("Tabella 13: Quadro riassuntivo riparto"),
    buildTable(
      [
        { key: "categoria", label: "", widthPct: 30 },
        { key: "totaleCredito", label: "Totale Credito", widthPct: 20, format: "euro", align: "right" },
        { key: "creditoSoddisfatto", label: "Credito Soddisfatto", widthPct: 20, format: "euro", align: "right" },
        { key: "percentualeSoddisfazione", label: "% Soddisfazione", widthPct: 15, format: "percent", align: "right" },
        { key: "liquidatoPrivilegiato", label: "Liq. privilegiato", widthPct: 15, format: "euro", align: "right" }
      ],
      pr.quadroRiassuntivoRiparto
    )
  );

  return content;
}

function sezioneGiudizioEConclusioni(dati) {
  const attestazione = dati.attestazioneArt268 ||
    "Sulla base dell'analisi svolta sulla situazione patrimoniale e reddituale del debitore, si attesta che non risulta " +
    "possibile acquisire ulteriore attivo da distribuire ai creditori, neppure mediante l'esercizio di azioni giudiziarie " +
    "(art. 268, comma 3, quarto periodo, CCII).";

  return [
    heading1("Giudizio sulla completezza e attendibilità della documentazione depositata dal Debitore a corredo della proposta"),
    ...bodyText(dati.giudizioAttendibilita),
    heading1("Attestazione ex art. 268, comma 3, CCII"),
    ...bodyText(attestazione),
    heading1("Conclusioni"),
    ...bodyText(dati.conclusioni)
  ];
}

/**
 * Genera l'intero documento a partire dai dati della pratica.
 * Assembla sezioni fisse + sezione condizionale "storia pregressa" solo se presente nei dati.
 */
function generaDocumento(dati) {
  const children = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      text: `Relazione OCC — Liquidazione Controllata`
    }),
    new Paragraph({
      text: `${dati.debitore.nomeCompleto} — R.G. n. ${dati.pratica.numeroRG} — Tribunale di ${dati.pratica.tribunale}`
    }),
    spacer(),
    ...sezioneAttivitaSvolte(dati),
    ...sezioneDatiAnagrafici(dati),
    ...sezioneCauseIndebitamento(dati),
    heading1("Esposizione della situazione del Debitore"),
    ...sezioneSituazioneDebitoria(dati),
    ...sezionePatrimonioReddituale(dati),
    ...sezioneStoriaPregressa(dati), // condizionale
    ...sezionePianoRiparto(dati),
    ...sezioneApportoTerziEBeniEsclusi(dati),
    ...sezioneGiudizioEConclusioni(dati)
  ];

  return new Document({
    sections: [{ properties: {}, children }]
  });
}

/**
 * Legge e valida il file JSON di input. Lancia errori con messaggi chiari in italiano
 * per ognuno dei modi in cui l'input può essere malformato.
 */
function caricaEValidaInput(inputPath) {
  const resolved = path.resolve(inputPath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`File non trovato: ${resolved}`);
  }

  let raw;
  try {
    raw = fs.readFileSync(resolved, "utf-8");
  } catch (e) {
    throw new Error(`Impossibile leggere il file ${resolved}: ${e.message}`);
  }

  let dati;
  try {
    dati = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Il file ${resolved} non è un JSON valido: ${e.message}`);
  }

  const { valid, errors } = validaDatiLiquidazione(dati);
  if (!valid) {
    const elenco = errors.map(e => `  - ${e}`).join("\n");
    throw new Error(`I dati non rispettano lo schema atteso:\n${elenco}`);
  }

  const warnings = controlliDiCoerenza(dati);
  if (warnings.length > 0) {
    warnings.forEach(w => console.warn(w));
  }

  return dati;
}

async function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error("Uso: node generaLiquidazione.js <input.json> <output.docx>");
    process.exit(1);
  }

  let dati;
  try {
    dati = caricaEValidaInput(inputPath);
  } catch (e) {
    console.error(`\nErrore nei dati di input:\n${e.message}\n`);
    process.exit(1);
  }

  let buffer;
  try {
    const doc = generaDocumento(dati);
    buffer = await Packer.toBuffer(doc);
  } catch (e) {
    console.error(`\nErrore durante la generazione del documento Word: ${e.message}\n`);
    process.exit(1);
  }

  try {
    fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
    fs.writeFileSync(path.resolve(outputPath), buffer);
  } catch (e) {
    console.error(`\nErrore nel salvataggio del file di output: ${e.message}\n`);
    process.exit(1);
  }

  console.log(`Relazione generata: ${outputPath}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error(`\nErrore imprevisto: ${err.message}\n`);
    process.exit(1);
  });
}

module.exports = { generaDocumento, caricaEValidaInput };
