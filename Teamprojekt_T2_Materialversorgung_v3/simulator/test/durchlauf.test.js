'use strict';
// Fachliche Durchläufe durch das Modell ohne Engine (vereinfacht): node --test
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { durchlauf } = require('../pruefung/token-durchlauf');

const DIR = path.join(__dirname, '..', '..');
const SCHNELL20 = { produktId: 'TP-SCHNELL', pflegehaushaltId: 'PH-0001', bestand: 20 };
const lauf = (start, vars, fall) => {
  const r = durchlauf(DIR, start, vars, fall);
  assert.deepStrictEqual(r.ungenutzt, [], 'nicht verbrauchte Fall-Schritte: ' + r.ungenutzt.join(', '));
  return r;
};

test('Leitgeschichte: Freigabe, einmal nachfassen, Versand, korrekte Lieferung', () => {
  const r = lauf('S_Meldung', SCHNELL20, {
    aufgabe: { KE_Entscheiden: [{ entscheidung: 'FREIGEGEBEN' }], U_Lieferung: [{ lieferErgebnis: 'KORREKT' }] },
    nachricht: { RT_Bestaetigung: ['B_Nachfassen', 'normal'], RT_Zustellung: ['B_Versand', 'normal'] },
  });
  assert.strictEqual(r.ende, 'E_Erfolg');
  assert.strictEqual(r.vars.vorgangsstatus, 'Erfolgreich abgeschlossen');
  assert.strictEqual(r.vars.bestand, 140);
  assert.strictEqual(r.vars.anzahlNachfassen, 1);
  assert.strictEqual(r.vars.versandGemeldet, true);
  assert.strictEqual(r.vars.preisGesamt, 54);
  assert.ok(r.businessKey, 'Business Key gesetzt');
});

test('A4: zweiter Vorgang für dasselbe Produkt endet sofort', () => {
  const r = lauf('S_Meldung', SCHNELL20, { laufendeVorgaenge: 1 });
  assert.strictEqual(r.ende, 'E_Doppelt');
});

test('Kein Bedarf: nächste Prüfung terminiert', () => {
  const r = lauf('S_Meldung', { produktId: 'TP-M', bestand: 100 }, {});
  assert.strictEqual(r.ende, 'E_Termin');
  assert.strictEqual(r.vars.terminAnlass, 'KEIN_BEDARF');
});

test('Automatisch unter der Preisgrenze (TP-HS, 24 EUR), Zustellung vor der Bestätigung', () => {
  const r = lauf('S_Meldung', { produktId: 'TP-HS', bestand: 50 }, {
    aufgabe: { U_Lieferung: [{ lieferErgebnis: 'KORREKT' }] },
    nachricht: { RT_Bestaetigung: ['B_ZustellungFrueh'] },
  });
  assert.strictEqual(r.vars.freigabeweg, 'AUTOMATISCH');
  assert.strictEqual(r.ende, 'E_Erfolg');
  assert.ok(!r.spur.includes('Kundenentscheidung einholen'));
});

test('Nicht lieferbar: Ersatzprodukt, neue Freigabe, dann Lieferung', () => {
  const r = lauf('S_Meldung', { produktId: 'TP-HS', bestand: 50 }, {
    aufgabe: { KE_Entscheiden: [{ entscheidung: 'FREIGEGEBEN' }], U_Lieferung: [{ lieferErgebnis: 'KORREKT' }] },
    nachricht: { RT_Bestaetigung: ['B_NichtLieferbar', 'normal'], RT_Zustellung: ['normal'] },
  });
  assert.strictEqual(r.vars.aktuellesProdukt, 'Einmalhandschuhe Testprodukt Größe M, andere Marke');
  assert.strictEqual(r.ende, 'E_Erfolg');
});

test('Keine Antwort des Kunden ist keine Freigabe', () => {
  const r = lauf('S_Meldung', SCHNELL20, { aufgabe: { KE_Entscheiden: ['KE_B_Frist'] } });
  assert.strictEqual(r.ende, 'E_KeineAntwortK');
  assert.strictEqual(r.vars.entscheidung, 'KEINE_ANTWORT');
});

test('Aufschub: frühere Prüfung, keine Bestellung', () => {
  const r = lauf('S_Meldung', SCHNELL20, { aufgabe: { KE_Entscheiden: [{ entscheidung: 'AUFSCHUB' }] } });
  assert.strictEqual(r.ende, 'E_Termin');
  assert.strictEqual(r.vars.terminAnlass, 'AUFSCHUB');
  assert.strictEqual(r.vars.vorgangsstatus, 'Erfolglos abgeschlossen');
});

test('Änderung: Kunde wählt den Alternativlieferanten, danach Freigabe', () => {
  const r = lauf('S_Meldung', SCHNELL20, {
    aufgabe: {
      KE_Entscheiden: [{ entscheidung: 'AENDERUNG', gewuenschteAlternative: 'ALTERNATIVLIEFERANT' }, { entscheidung: 'FREIGEGEBEN' }],
      U_Lieferung: [{ lieferErgebnis: 'KORREKT' }],
    },
    nachricht: { RT_Bestaetigung: ['normal'], RT_Zustellung: ['normal'] },
  });
  assert.strictEqual(r.vars.aktuellerLieferant, 'Versorgungsdienst Alternativ (SIMULIERT)');
  assert.strictEqual(r.ende, 'E_Erfolg');
});

test('Teillieferung: Teilmenge übernommen, Restmenge offen', () => {
  const r = lauf('S_Meldung', SCHNELL20, {
    aufgabe: {
      KE_Entscheiden: [{ entscheidung: 'FREIGEGEBEN' }],
      U_Lieferung: [{ lieferErgebnis: 'TEILLIEFERUNG', gelieferteMenge: 60 }],
      U_Klaerung: [{ klaerErgebnis: 'TEILMENGE_UEBERNEHMEN', gelieferteMenge: 60, pruefNotiz: 'Rest nicht lieferbar' }],
    },
    nachricht: { RT_Bestaetigung: ['normal'], RT_Zustellung: ['normal'] },
  });
  assert.strictEqual(r.ende, 'E_Rest');
  assert.strictEqual(r.vars.bestand, 80);
});

test('Lieferung bleibt unbestätigt: übergeben, nie automatisch erfolgreich', () => {
  const r = lauf('S_Meldung', SCHNELL20, {
    aufgabe: { KE_Entscheiden: [{ entscheidung: 'FREIGEGEBEN' }], U_Lieferung: ['SP_Bestaetigen_Erinn', 'B_FristLiefBest'] },
    nachricht: { RT_Bestaetigung: ['normal'], RT_Zustellung: ['normal'] },
  });
  assert.strictEqual(r.ende, 'E_UnbestTop');
  assert.strictEqual(r.vars.vorgangsstatus, 'Übergeben');
});

test('Bestand nicht gemeldet: erinnern, erneut anfragen, dann Abbruch', () => {
  const r = lauf('S_Pruefung', { produktId: 'TP-SCHNELL' }, {
    aufgabe: { U_Bestand: ['SP_Melden_Erinn', 'B_FristBestand', 'B_FristBestand'] },
  });
  assert.strictEqual(r.ende, 'E_KeinBestand');
  assert.strictEqual(r.vars.anzahlAnfragen, 2);
});

test('Lieferant antwortet nicht: Prüfstelle wählt Alternativlieferant', () => {
  const r = lauf('S_Meldung', SCHNELL20, {
    aufgabe: {
      KE_Entscheiden: [{ entscheidung: 'FREIGEGEBEN' }, { entscheidung: 'FREIGEGEBEN' }],
      U_LiefAntwort: [{ lieferantErgebnis: 'ALTERNATIVLIEFERANT', pruefNotiz: 'keine Antwort' }],
      U_Lieferung: [{ lieferErgebnis: 'KORREKT' }],
    },
    nachricht: { RT_Bestaetigung: ['B_Nachfassen', 'B_Endgueltig', 'normal'], RT_Zustellung: ['normal'] },
  });
  assert.strictEqual(r.vars.aktuellerLieferant, 'Versorgungsdienst Alternativ (SIMULIERT)');
  assert.strictEqual(r.ende, 'E_Erfolg');
});

test('Grenzfall: Ersatz auch nicht lieferbar, Prüfstelle übergibt', () => {
  const r = lauf('S_Meldung', { produktId: 'TP-HS', bestand: 50 }, {
    aufgabe: {
      KE_Entscheiden: [{ entscheidung: 'FREIGEGEBEN' }],
      U_Grenzfall: [{ pruefErgebnis: 'UEBERGEBEN', pruefNotiz: 'kein Ersatz' }],
    },
    nachricht: { RT_Bestaetigung: ['B_NichtLieferbar', 'B_NichtLieferbar'] },
  });
  assert.strictEqual(r.ende, 'E_Grenzfall');
});
