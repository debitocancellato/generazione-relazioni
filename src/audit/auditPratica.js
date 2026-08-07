/**
 * Modulo di audit pratica.
 *
 * Ogni funzione "rileva*" è pura: prende i dati grezzi (vedi auditInput.schema.json)
 * e ritorna un array di segnalazioni (eventualmente vuoto). eseguiAudit() le combina.
 *
 * Una segnalazione ha forma:
 * {
 *   id: string,                    // identificativo stabile del tipo di segnalazione
 *   livello: 'info'|'attenzione'|'critico',
 *   categoria: string,
 *   messaggio: string,             // spiegazione per l'utente/professionista
 *   sezioniRelazione: string[],    // quali sezioni della relazione questa segnalazione alimenta
 *   suggerimento: string           // azione consigliata (es. quale documento caricare, cosa valutare)
 * }
 */

function rilevaImpreseCessate(dati) {
  const imprese = dati.impreseStoriche || [];
  return imprese
    .filter(i => i.statoImpresa === "cessata" || i.statoImpresa === "cancellata")
    .map(i => ({
      id: "impresa-cessata",
      livello: "attenzione",
      categoria: "storia-imprenditoriale",
      messaggio: `Rilevata impresa "${i.denominazione || "non specificata"}" cessata` +
        (i.dataCessazioneAttivita ? ` in data ${i.dataCessazioneAttivita}` : "") +
        `. Possibile origine di debiti tributari/previdenziali pregressi riconducibili all'attività d'impresa.`,
      sezioniRelazione: ["causeIndebitamento", "storiaPregressaRilevante"],
      suggerimento: "Verificare se esistono posizioni debitorie (AdER, INPS) risalenti al periodo di attività " +
        "dell'impresa, per collegarle esplicitamente nella narrazione delle cause dell'indebitamento."
    }));
}

function rilevaProcedureConcorsualiPregresse(dati) {
  const procedure = dati.procedureConcorsualiPregresse || [];
  return procedure.map(p => ({
    id: "procedura-concorsuale-pregressa",
    livello: "attenzione",
    categoria: "storia-imprenditoriale",
    messaggio: `Rilevata procedura di ${p.tipo || "natura concorsuale"} pregressa` +
      (p.tribunale ? ` (${p.tribunale}${p.numeroSentenza ? ", sent. " + p.numeroSentenza : ""})` : "") +
      (p.dataChiusura ? `, chiusa il ${p.dataChiusura}` : "") + ".",
    sezioniRelazione: ["storiaPregressaRilevante"],
    suggerimento: "Ricostruire il periodo di pendenza della procedura (es. regime di spossessamento ex art. 42 L.F. " +
      "se fallimento) e il periodo successivo, distinguendo le due fasi nel resoconto di solvibilità."
  }));
}

function rilevaCointestazioni(dati) {
  const creditori = dati.creditori || [];
  return creditori
    .filter(c => Array.isArray(c.cointestatari) && c.cointestatari.length > 0)
    .map(c => ({
      id: "debito-cointestato",
      livello: "attenzione",
      categoria: "procedura-congiunta",
      messaggio: `Il debito verso "${c.nome || "creditore non specificato"}" (${c.tipologia || "tipologia non specificata"}) ` +
        `risulta cointestato con: ${c.cointestatari.join(", ")}.`,
      sezioniRelazione: ["situazioneDebitoria"],
      suggerimento: "Valutare con il professionista se la presenza di debiti cointestati con altri soggetti " +
        "debba orientare verso una procedura familiare congiunta (art. 66 CCII) anziché una procedura individuale."
    }));
}

function rilevaGaranzieReali(dati) {
  const creditori = dati.creditori || [];
  return creditori
    .filter(c => c.garanziaReale === true)
    .map(c => ({
      id: "credito-con-garanzia-reale",
      livello: "info",
      categoria: "patrimonio",
      messaggio: `Il debito verso "${c.nome || "creditore non specificato"}" è assistito da garanzia reale ` +
        `(es. ipoteca). Se il debitore intende continuare a pagarlo regolarmente, può valutarsi la sua esclusione ` +
        `dalla massa liquidatoria.`,
      sezioniRelazione: ["beniEsclusiDallaLiquidazione"],
      suggerimento: "Chiedere al debitore se intende proporre di tenere questo debito fuori dalla procedura, " +
        "continuando i pagamenti regolari."
    }));
}

function rilevaRateizzazioniAttive(dati) {
  const creditori = dati.creditori || [];
  return creditori
    .filter(c => c.rateizzazioneAttiva === true)
    .map(c => ({
      id: "rateizzazione-attiva",
      livello: "info",
      categoria: "situazione-debitoria",
      messaggio: `Il debito verso "${c.nome || "creditore non specificato"}" risulta già oggetto di un piano di ` +
        `rateizzazione attivo.`,
      sezioniRelazione: ["situazioneDebitoria"],
      suggerimento: "Verificare se la rateizzazione in corso debba essere superata dalla procedura o se vada " +
        "mantenuta/riconsiderata nella proposta."
    }));
}

function rilevaCreditoreErarialePrevalente(dati) {
  const creditori = dati.creditori || [];
  const totale = creditori.reduce((acc, c) => acc + (c.importoResiduo || 0), 0);
  if (totale === 0) return [];

  const totaleErariale = creditori
    .filter(c => ["tributario", "previdenziale"].includes((c.tipologia || "").toLowerCase()))
    .reduce((acc, c) => acc + (c.importoResiduo || 0), 0);

  const quota = totaleErariale / totale;
  if (quota < 0.5) return [];

  return [{
    id: "creditore-erariale-prevalente",
    livello: "attenzione",
    categoria: "situazione-debitoria",
    messaggio: `Il debito tributario/previdenziale rappresenta il ${(quota * 100).toFixed(1)}% del totale ` +
      `(€ ${totaleErariale.toFixed(2)} su € ${totale.toFixed(2)}).`,
    sezioniRelazione: ["situazioneDebitoria", "propostaConcordataria"],
    suggerimento: "Se la procedura prevista è un concordato minore, valutare se predisporre l'istanza di " +
      "Cram Down (art. 80, comma 3, CCII) nel caso l'Erario non aderisca alla proposta."
  }];
}

function rilevaDatiMancanti(dati) {
  const segnalazioni = [];

  if (!dati.patrimonio || dati.patrimonio.valoreImmobiliareNoto !== true) {
    segnalazioni.push({
      id: "dato-mancante-patrimonio-immobiliare",
      livello: "critico",
      categoria: "dati-mancanti",
      messaggio: "Non risulta noto il valore del patrimonio immobiliare del debitore.",
      sezioniRelazione: ["patrimonio"],
      suggerimento: "Caricare perizia di stima o, in assenza, visura catastale + valutazione OMI di riferimento."
    });
  }

  const redditi = dati.redditi || [];
  if (redditi.length < 2) {
    segnalazioni.push({
      id: "dato-mancante-serie-storica-redditi",
      livello: "attenzione",
      categoria: "dati-mancanti",
      messaggio: `Disponibile serie storica redditi per solo ${redditi.length} anno/i (idealmente servono 5-6 anni).`,
      sezioniRelazione: ["redditi"],
      suggerimento: "Caricare CU/dichiarazioni dei redditi degli anni precedenti per completare la Tabella 5."
    });
  }

  if (!dati.creditori || dati.creditori.length === 0) {
    segnalazioni.push({
      id: "dato-mancante-elenco-creditori",
      livello: "critico",
      categoria: "dati-mancanti",
      messaggio: "Non risulta ancora presente alcun creditore nei dati acquisiti.",
      sezioniRelazione: ["situazioneDebitoria"],
      suggerimento: "Caricare cartelle esattoriali, contratti di finanziamento, estratti conto per ricostruire " +
        "l'elenco creditori completo."
    });
  }

  if (!dati.nucleoFamiliare || dati.nucleoFamiliare.numeroComponenti === undefined) {
    segnalazioni.push({
      id: "dato-mancante-nucleo-familiare",
      livello: "critico",
      categoria: "dati-mancanti",
      messaggio: "Non risulta nota la composizione del nucleo familiare.",
      sezioniRelazione: ["nucleoFamiliare"],
      suggerimento: "Caricare il certificato di stato di famiglia."
    });
  }

  return segnalazioni;
}

/** Registro di tutti i detector. Aggiungere qui nuovi controlli in futuro. */
const DETECTORS = [
  rilevaImpreseCessate,
  rilevaProcedureConcorsualiPregresse,
  rilevaCointestazioni,
  rilevaGaranzieReali,
  rilevaRateizzazioniAttive,
  rilevaCreditoreErarialePrevalente,
  rilevaDatiMancanti
];

/**
 * Esegue tutti i detector sui dati grezzi e ritorna l'elenco combinato di segnalazioni,
 * ordinato per livello di gravità (critico > attenzione > info).
 */
function eseguiAudit(dati) {
  const ordineLivello = { critico: 0, attenzione: 1, info: 2 };
  const segnalazioni = DETECTORS.flatMap(detector => detector(dati || {}));
  return segnalazioni.sort((a, b) => ordineLivello[a.livello] - ordineLivello[b.livello]);
}

/** Raggruppa le segnalazioni per sezione della relazione a cui sono collegate. */
function raggruppaPerSezione(segnalazioni) {
  const gruppi = {};
  for (const s of segnalazioni) {
    for (const sezione of s.sezioniRelazione) {
      if (!gruppi[sezione]) gruppi[sezione] = [];
      gruppi[sezione].push(s);
    }
  }
  return gruppi;
}

module.exports = {
  eseguiAudit,
  raggruppaPerSezione,
  // esportate singolarmente per testabilità puntuale
  rilevaImpreseCessate,
  rilevaProcedureConcorsualiPregresse,
  rilevaCointestazioni,
  rilevaGaranzieReali,
  rilevaRateizzazioniAttive,
  rilevaCreditoreErarialePrevalente,
  rilevaDatiMancanti
};
