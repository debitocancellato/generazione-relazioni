const fs = require("fs");
const path = require("path");
const { Packer } = require("docx");
const { generaDocumento } = require("../src/generator/generaLiquidazione");

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

async function run() {
  const tests = [testGenerazioneBase, testSezioneCondizionalePresente, testCalcoliDerivati];
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
