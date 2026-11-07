'use strict';
// Automatisierte Tests der simulierten Dienste: node --test
const test = require('node:test');
const assert = require('node:assert');
const { handlers } = require('../handlers');

// Produktprofil wie in T2_Produktprofil.dmn (Produkt TP-M)
const profilM = {
  produkt: 'Inkontinenzmaterial Testprodukt M', ersatzprodukt: 'Inkontinenzmaterial Testprodukt M, Variante B',
  lieferant: 'Versorgungsdienst Beispiel (SIMULIERT)', alternativLieferant: 'Versorgungsdienst Alternativ (SIMULIERT)',
  packungsgroesse: 30, zielbestand: 120, verbrauchProTag: 4, lieferzeitTage: 3, tageBisNaechstePruefung: 7,
  stueckpreis: 0.45, stueckpreisAlternativ: 0.5, stueckpreisErsatz: 0.48, betragsgrenze: 40, maxBestellmenge: 150, schwelleVerbrauchssprung: 0.3,
};
const task = (activityId = 'X') => ({ activityId, processInstanceId: 'abcdef123456', businessKey: null });

function bisAbweichung(start) {
  let v = { ...profilM, ...start };
  v = { ...v, ...handlers['t2-vorgang-eroeffnen'](v, task()) };
  v = { ...v, ...handlers['t2-reichweite-berechnen'](v, task()) };
  v = { ...v, ...handlers['t2-vorschlag-erstellen'](v, task()) };
  return { ...v, ...handlers['t2-abweichungen-pruefen'](v, task()) };
}

test('Beispieldurchlauf: Bestand 20 ergibt 120 Stück für 54 EUR ohne Profilabweichung', () => {
  const v = bisAbweichung({ bestand: 20 });
  assert.strictEqual(v.reichweiteTage, 5);
  assert.strictEqual(v.nachversorgungNoetig, true);
  assert.strictEqual(v.bestellmenge, 120);
  assert.strictEqual(v.preisGesamt, 54);
  assert.strictEqual(v.abweichungMitFolgen, false);
  assert.strictEqual(v.fallUngeklaert, false);
  assert.strictEqual(v.handlungsart, 'BESTELLUNG');
  assert.strictEqual(v.vorgangId, 'VG-T2-abcdef12');
});

test('Kein Bedarf bei Bestand 100', () => {
  let v = { ...profilM, bestand: 100 };
  v = { ...v, ...handlers['t2-reichweite-berechnen'](v, task()) };
  assert.strictEqual(v.reichweiteTage, 25);
  assert.strictEqual(v.nachversorgungNoetig, false);
});

test('Verbrauchssprung wird als Abweichung mit Folgen erkannt', () => {
  const v = bisAbweichung({ bestand: 20, verbrauchBeobachtetProTag: 7 });
  assert.strictEqual(v.abweichungMitFolgen, true);
  assert.match(v.abweichungen, /Verbrauch deutlich verändert/);
});

test('Nicht lieferbar: erst Ersatzoption, beim zweiten Mal ungeklärt', () => {
  let v = bisAbweichung({ bestand: 20 });
  v = { ...v, produktVerfuegbar: false };
  v = { ...v, ...handlers['t2-abweichungen-pruefen'](v, task()) };
  assert.strictEqual(v.aktuellesProdukt, profilM.ersatzprodukt);
  assert.strictEqual(v.abweichungMitFolgen, true);
  assert.strictEqual(v.fallUngeklaert, false);
  v = { ...v, produktVerfuegbar: false };
  v = { ...v, ...handlers['t2-abweichungen-pruefen'](v, task()) };
  assert.strictEqual(v.fallUngeklaert, true);
});

test('Änderungswunsch wird auf ganze Packungen gerundet', () => {
  let v = { ...profilM, bestand: 20, gewuenschteMenge: 50 };
  v = { ...v, ...handlers['t2-vorschlag-erstellen'](v, task()) };
  assert.strictEqual(v.bestellmenge, 60);
  assert.strictEqual(v.gewuenschteMenge, null);
});

test('Alternativlieferant ändert Preis und gilt als Abweichung', () => {
  const v = bisAbweichung({ bestand: 20, aktuellerLieferant: profilM.alternativLieferant });
  assert.strictEqual(v.preisGesamt, 60);
  assert.strictEqual(v.abweichungMitFolgen, true);
});

test('Bestand wird mit gelieferter Teilmenge fortgeschrieben', () => {
  const v = { ...profilM, bestand: 20, bestellmenge: 120, gelieferteMenge: 60 };
  assert.strictEqual(handlers['t2-bestand-fortschreiben'](v, task()).bestand, 80);
  assert.strictEqual(handlers['t2-bestand-fortschreiben']({ ...v, gelieferteMenge: null }, task()).bestand, 140);
});

test('Keine Antwort ist keine Freigabe', () => {
  const r = handlers['t2-freigabe-dokumentieren']({ entscheidung: 'FREIGEGEBEN' }, task('KE_Keine'));
  assert.strictEqual(r.entscheidung, 'KEINE_ANTWORT');
});

test('Nachfassen zählt nicht im Dienst (der Prozess zählt selbst), Mahnen schon', () => {
  assert.strictEqual(handlers['t3-nachfassen']({ anzahlNachfassen: 1 }, task('ST_Nachfassen')).anzahlNachfassen, undefined);
  assert.strictEqual(handlers['t3-mahnen']({ anzahlMahnungen: 1 }, task('ST_Mahnen')).anzahlMahnungen, 2);
});

test('Zweiter Vorgang für dasselbe Produkt wird erkannt (A4)', () => {
  assert.strictEqual(handlers['t2-vorgang-eroeffnen']({ produktId: 'TP-M' }, { ...task(), laufendeVorgaenge: 1 }).vorgangBereitsOffen, true);
  const v = handlers['t2-vorgang-eroeffnen']({ produktId: 'TP-M' }, task());
  assert.strictEqual(v.vorgangBereitsOffen, false);
  assert.strictEqual(v.anzahlAnfragen, 1);
  assert.strictEqual(v.zustellungGemeldet, false);
});

test('Alternative Auswahl des Kunden: Ersatzprodukt mit eigenem Preis', () => {
  let v = { ...profilM, bestand: 20, gewuenschteAlternative: 'ERSATZPRODUKT', reichweiteTage: 5 };
  v = { ...v, ...handlers['t2-vorschlag-erstellen'](v, task()) };
  assert.strictEqual(v.aktuellesProdukt, profilM.ersatzprodukt);
  assert.strictEqual(v.gewuenschteAlternative, null);
  v = { ...v, ...handlers['t2-abweichungen-pruefen'](v, task()) };
  assert.strictEqual(v.preisGesamt, 57.6);
  assert.strictEqual(v.abweichungMitFolgen, true);
});

test('Aufschub: nächste Prüfung früher, Text nennt das Reichweitenrisiko', () => {
  const v = { ...profilM, reichweiteTage: 5, terminAnlass: 'AUFSCHUB', voraussichtlicheUnterschreitung: '2026-11-12' };
  const t = handlers['t2-pruefung-terminieren'](v, task());
  assert.strictEqual(t.tageBisPruefung, 2);
  const n = handlers['t2-benachrichtigung-senden']({ ...v, ...t }, task('E_Termin'));
  assert.match(n.letzteBenachrichtigung, /verschoben/);
  assert.match(n.letzteBenachrichtigung, /2026-11-12/);
});

test('Benachrichtigung hat für jedes Endereignis einen eigenen Text', () => {
  const r = handlers['t2-benachrichtigung-senden']({ reichweiteTage: 25, naechstePruefungAm: '2026-11-13', terminAnlass: 'KEIN_BEDARF' }, task('E_Termin'));
  assert.match(r.letzteBenachrichtigung, /25 Tage/);
  assert.strictEqual(r.anzahlBenachrichtigungen, 1);
});

test('Unbekanntes Produkt führt zu einem sichtbaren Fehler statt zu einem falschen Ergebnis', () => {
  assert.throws(() => handlers['t2-reichweite-berechnen']({ bestand: 20, produktId: 'GIBTSNICHT' }, task()), /Versorgungsprofil fehlt/);
});
