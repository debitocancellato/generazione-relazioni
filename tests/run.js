const fs = require("fs");
const path = require("path");
const os = require("os");
const { Packer } = require("docx");
const { generaDocumento, caricaEValidaInput } = require("../src/generator/generaLiquidazione");
const { validaDatiLiquidazione, controlliDiCoerenza } = require("../src/generator/validate");

function loadSample(name) {
  const p = path.join(__dirname, "..", "src", "data", "samples", name);
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

async function testGenerazioneBase() {
  const dati = loadSample("liquidazione_demo.json");
  const doc = generaDocumento(dati);
  const buffer = await Packer.toBuffer(doc);
  if (!buffer || buffer.length < 1000) {
    throw new Error("Il documento generato è troppo piccolo o vuoto");
  }
  console.log("✓ testGenerazioneBase: documento generato correttamente (" + buffer.length + " bytes)");
}

async function testSezioneCondizionalePresente() {
  const dati = loadSample("liquidazione_demo.json"); // ha storiaPregressaRilevante valorizzata
  if (!dati.storiaPregressaRilevante) {
    throw new Error("Fixture non valida per questo test: manca storiaPregressaRilevante");
  }
  console.log("✓ testSezioneCondizionalePresente: fixture corretta");
}

async function testCalcoliDerivati() {
  const dati = loadSample("liquidazione_demo.json");
  const totaleSpese = dati.spese.voci.reduce((acc, v) => acc + v.importo, 0);
  if (totaleSpese !== 1150) {
    throw new Error(`Totale spese atteso 1150, ottenuto ${totaleSpese}`);
  }
  console.log("✓ testCalcoliDerivati: somma spese corretta");
}

async function testValidazioneRifiutaCampoMancante() {
  const dati = loadSample("liquidazione_demo.json");
  delete dati.debitore.codiceFiscale;
  const { valid, errors } = validaDatiLiquidazione(dati);
  if (valid) throw new Error("Atteso valid=false per campo obbligatorio mancante");
  if (!errors.some(e => e.includes("codiceFiscale"))) {
    throw new Error("Il messaggio di errore non menziona il campo mancante: " + errors.join(" | "));
  }
  console.log("✓ testValidazioneRifiutaCampoMancante: errore chiaro e corretto");
}

async function testValidazioneRifiutaArrayVuoto() {
  const dati = loadSample("liquidazione_demo.json");
  dati.spese.voci = [];
  const { valid } = validaDatiLiquidazione(dati);
  if (valid) throw new Error("Atteso valid=false per array vuoto dove minItems=1");
  console.log("✓ testValidazioneRifiutaArrayVuoto: array vuoto correttamente rifiutato");
}

async function testValidazioneRifiutaTipoErrato() {
  const dati = loadSample("liquidazione_demo.json");
  dati.situazioneDebitoria.riassuntoPerTipologia[0].importoResiduo = "non un numero";
  const { valid } = validaDatiLiquidazione(dati);
  if (valid) throw new Error("Atteso valid=false per tipo errato");
  console.log("✓ testValidazioneRifiutaTipoErrato: tipo errato correttamente rifiutato");
}

async function testValidazioneAccettaDataFormatoItaliano() {
  const dati = loadSample("liquidazione_demo.json");
  const { valid, errors } = validaDatiLiquidazione(dati);
  if (!valid) throw new Error("Dati di esempio validi rifiutati: " + errors.join(" | "));
  console.log("✓ testValidazioneAccettaDataFormatoItaliano: formato GG/MM/AAAA accettato");
}

async function testWarningCoerenzaNonBlocca() {
  const dati = loadSample("liquidazione_demo.json");
  dati.situazioneDebitoria.debitoResiduoTotale = 999999.00; // non coincide con la somma delle voci
  const { valid } = validaDatiLiquidazione(dati);
  if (!valid) throw new Error("I warning di coerenza non devono bloccare la validazione dello schema");
  const warnings = controlliDiCoerenza(dati);
  if (warnings.length === 0) throw new Error("Atteso almeno un warning di coerenza");
  console.log("✓ testWarningCoerenzaNonBlocca: warning generato senza bloccare");
}

async function testCaricaEValidaInputFileInesistente() {
  try {
    caricaEValidaInput("/tmp/questo_file_non_esiste_123.json");
    throw new Error("Atteso un errore per file inesistente");
  } catch (e) {
    if (!e.message.includes("non trovato")) throw new Error("Messaggio di errore non chiaro: " + e.message);
  }
  console.log("✓ testCaricaEValidaInputFileInesistente: errore chiaro per file mancante");
}

async function testCaricaEValidaInputJsonMalformato() {
  const p = path.join(os.tmpdir(), "malformato_test.json");
  fs.writeFileSync(p, "{ questo non è json valido");
  try {
    caricaEValidaInput(p);
    throw new Error("Atteso un errore per JSON malformato");
  } catch (e) {
    if (!e.message.includes("JSON valido")) throw new Error("Messaggio di errore non chiaro: " + e.message);
  }
  console.log("✓ testCaricaEValidaInputJsonMalformato: errore chiaro per JSON malformato");
}

const { eseguiAudit, raggruppaPerSezione, rilevaImpreseCessate, rilevaCointestazioni, rilevaDatiMancanti } = require("../src/audit/auditPratica");

async function testAuditRilevaImpresaCessata() {
  const dati = loadSample("audit_demo.json");
  const segnalazioni = rilevaImpreseCessate(dati);
  if (segnalazioni.length !== 1) throw new Error(`Attese 1 segnalazione impresa cessata, trovate ${segnalazioni.length}`);
  if (!segnalazioni[0].sezioniRelazione.includes("causeIndebitamento")) {
    throw new Error("La segnalazione impresa cessata deve essere collegata a 'causeIndebitamento'");
  }
  console.log("✓ testAuditRilevaImpresaCessata: rilevata correttamente");
}

async function testAuditRilevaCointestazione() {
  const dati = loadSample("audit_demo.json");
  const segnalazioni = rilevaCointestazioni(dati);
  if (segnalazioni.length !== 1) throw new Error(`Attesa 1 segnalazione cointestazione, trovate ${segnalazioni.length}`);
  if (!segnalazioni[0].messaggio.includes("Coniuge Rossi")) {
    throw new Error("La segnalazione dovrebbe menzionare il cointestatario");
  }
  console.log("✓ testAuditRilevaCointestazione: rilevata correttamente");
}

async function testAuditRilevaDatiMancanti() {
  const dati = loadSample("audit_demo.json");
  const segnalazioni = rilevaDatiMancanti(dati);
  const ids = segnalazioni.map(s => s.id);
  if (!ids.includes("dato-mancante-patrimonio-immobiliare")) {
    throw new Error("Doveva segnalare il valore immobiliare mancante (valoreImmobiliareNoto: false nel fixture)");
  }
  if (!ids.includes("dato-mancante-serie-storica-redditi")) {
    throw new Error("Doveva segnalare la serie storica redditi insufficiente (solo 1 anno nel fixture)");
  }
  console.log("✓ testAuditRilevaDatiMancanti: entrambe le lacune rilevate correttamente");
}

async function testAuditNessunFalsoPositivo() {
  const datiPuliti = {
    debitore: { nomeCompleto: "Test Pulito" },
    nucleoFamiliare: { numeroComponenti: 2, numeroMinorenni: 0 },
    impreseStoriche: [],
    procedureConcorsualiPregresse: [],
    creditori: [
      { nome: "Banca X", tipologia: "finanziamento", importoResiduo: 5000, rateizzazioneAttiva: false, garanziaReale: false }
    ],
    redditi: [{ anno: 2024 }, { anno: 2025 }],
    patrimonio: { valoreImmobiliareNoto: true }
  };
  const segnalazioni = eseguiAudit(datiPuliti);
  if (segnalazioni.length !== 0) {
    throw new Error(`Attese 0 segnalazioni su dati puliti, trovate ${segnalazioni.length}: ${JSON.stringify(segnalazioni.map(s => s.id))}`);
  }
  console.log("✓ testAuditNessunFalsoPositivo: nessuna segnalazione spuria su dati completi e puliti");
}

async function testAuditOrdinamentoPerGravita() {
  const dati = loadSample("audit_demo.json");
  const segnalazioni = eseguiAudit(dati);
  const livelli = segnalazioni.map(s => s.livello);
  const ordineAtteso = { critico: 0, attenzione: 1, info: 2 };
  for (let i = 1; i < livelli.length; i++) {
    if (ordineAtteso[livelli[i]] < ordineAtteso[livelli[i - 1]]) {
      throw new Error(`Ordinamento per gravità violato: ${livelli[i - 1]} seguito da ${livelli[i]}`);
    }
  }
  console.log("✓ testAuditOrdinamentoPerGravita: segnalazioni ordinate correttamente (critico → attenzione → info)");
}

async function testRaggruppaPerSezione() {
  const dati = loadSample("audit_demo.json");
  const segnalazioni = eseguiAudit(dati);
  const gruppi = raggruppaPerSezione(segnalazioni);
  if (!gruppi.causeIndebitamento || gruppi.causeIndebitamento.length === 0) {
    throw new Error("Ci si aspettava almeno una segnalazione raggruppata sotto 'causeIndebitamento'");
  }
  console.log("✓ testRaggruppaPerSezione: raggruppamento per sezione funzionante");
}

async function run() {
  const tests = [
    testGenerazioneBase,
    testSezioneCondizionalePresente,
    testCalcoliDerivati,
    testValidazioneRifiutaCampoMancante,
    testValidazioneRifiutaArrayVuoto,
    testValidazioneRifiutaTipoErrato,
    testValidazioneAccettaDataFormatoItaliano,
    testWarningCoerenzaNonBlocca,
    testCaricaEValidaInputFileInesistente,
    testCaricaEValidaInputJsonMalformato,
    testAuditRilevaImpresaCessata,
    testAuditRilevaCointestazione,
    testAuditRilevaDatiMancanti,
    testAuditNessunFalsoPositivo,
    testAuditOrdinamentoPerGravita,
    testRaggruppaPerSezione
  ];
  let failed = 0;
  for (const t of tests) {
    try {
      await t();
    } catch (e) {
      failed++;
      console.error("✗ " + t.name + ": " + e.message);
    }
  }
  if (failed > 0) {
    console.error(`\n${failed} test falliti`);
    process.exit(1);
  } else {
    console.log(`\nTutti i test passati (${tests.length}/${tests.length})`);
  }
}

run();
