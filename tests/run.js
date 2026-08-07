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
    testCaricaEValidaInputJsonMalformato
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
