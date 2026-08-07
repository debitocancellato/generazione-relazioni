const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const schemaPath = path.join(__dirname, "..", "schema", "liquidazioneControllata.schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
const validateFn = ajv.compile(schema);

/**
 * Traduce gli errori grezzi di ajv in messaggi comprensibili in italiano,
 * riferiti al percorso del campo nel JSON.
 */
function traduciErrore(err) {
  const campo = (err.instancePath || "(radice)").replace(/^\//, "").replace(/\//g, " → ") || "(radice del documento)";

  switch (err.keyword) {
    case "required":
      return `Manca il campo obbligatorio "${err.params.missingProperty}" in "${campo}"`;
    case "type":
      return `Il campo "${campo}" dovrebbe essere di tipo ${err.params.type}, valore fornito non valido`;
    case "format":
      return `Il campo "${campo}" non rispetta il formato atteso (${err.params.format})`;
    case "pattern":
      return `Il campo "${campo}" non rispetta il formato atteso (es. data in formato GG/MM/AAAA)`;
    case "enum":
      return `Il campo "${campo}" deve essere uno tra: ${err.params.allowedValues.join(", ")}`;
    case "minItems":
      return `Il campo "${campo}" deve contenere almeno ${err.params.limit} elemento/i`;
    default:
      return `Errore su "${campo}": ${err.message}`;
  }
}

/**
 * Valida i dati di una pratica di Liquidazione controllata contro lo schema.
 * Ritorna { valid: boolean, errors: string[] }
 */
function validaDatiLiquidazione(dati) {
  const valid = validateFn(dati);
  if (valid) return { valid: true, errors: [] };

  const errors = (validateFn.errors || []).map(traduciErrore);
  // dedup mantenendo ordine
  const unique = [...new Set(errors)];
  return { valid: false, errors: unique };
}

/**
 * Controlli aggiuntivi "di buon senso" oltre allo schema formale:
 * coerenze numeriche che ajv non può esprimere facilmente.
 */
function controlliDiCoerenza(dati) {
  const warnings = [];

  if (dati.situazioneDebitoria) {
    const sommaRiassunto = (dati.situazioneDebitoria.riassuntoPerTipologia || [])
      .reduce((acc, r) => acc + (r.importoResiduo || 0), 0);
    const totale = dati.situazioneDebitoria.debitoResiduoTotale;
    if (typeof totale === "number" && Math.abs(sommaRiassunto - totale) > 0.01) {
      warnings.push(
        `ATTENZIONE: la somma delle voci in "riassuntoPerTipologia" (${sommaRiassunto.toFixed(2)}) ` +
        `non coincide con "debitoResiduoTotale" (${totale.toFixed(2)}) — verificare i dati.`
      );
    }
  }

  if (dati.pianoRiparto && Array.isArray(dati.pianoRiparto.quadroRiassuntivoRiparto)) {
    dati.pianoRiparto.quadroRiassuntivoRiparto.forEach((r, i) => {
      if (r.creditoSoddisfatto > r.totaleCredito) {
        warnings.push(
          `ATTENZIONE: in "quadroRiassuntivoRiparto[${i}]" (${r.categoria || "categoria non indicata"}), ` +
          `il credito soddisfatto (${r.creditoSoddisfatto}) supera il totale credito (${r.totaleCredito}).`
        );
      }
    });
  }

  return warnings;
}

module.exports = { validaDatiLiquidazione, controlliDiCoerenza };
