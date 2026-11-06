'use strict';
// Fachliche Logik der simulierten Dienste von Team 2 (SIMULIERT).
// Jeder Handler bekommt die Prozessvariablen als einfaches Objekt und gibt die neuen Variablen zurueck.
// Das BPMN-Modell kennt nur die Topics. Ein echter Dienst kann einen Handler ersetzen,
// ohne dass das Prozessmodell geaendert werden muss.

function datumInTagen(tage) {
  const d = new Date();
  d.setDate(d.getDate() + Number(tage));
  return d.toISOString().substring(0, 10);
}

function hat(v, name) {
  return v[name] !== undefined && v[name] !== null && v[name] !== '';
}

function rund2(x) {
  return Math.round(x * 100) / 100;
}

const handlers = {
  // Dienst von Team 1 (Vorgangsakte), hier SIMULIERT
  't2-vorgang-eroeffnen': (v, task) => ({
    pflegehaushaltId: hat(v, 'pflegehaushaltId') ? v.pflegehaushaltId : 'PH-0001',
    produktId: hat(v, 'produktId') ? v.produktId : 'TP-M',
    vorgangId: task.businessKey || 'VG-T2-' + String(task.processInstanceId).substring(0, 8),
    ausloeser: hat(v, 'ausloeser') ? v.ausloeser : 'unbekannt',
    bestandBekannt: hat(v, 'bestand'),
    produktVerfuegbar: hat(v, 'produktVerfuegbar') ? v.produktVerfuegbar : true,
    anzahlNachfassen: 0,
    istSimulation: true,
    vorgangsstatus: 'In Bearbeitung',
    letztesEreignis: 'Vorgang eröffnet',
  }),

  // Reichweite = Bestand / Verbrauch pro Tag. Keine medizinische Bewertung.
  't2-reichweite-berechnen': (v) => {
    // Fehlende Werte nicht still durchrechnen: Fehler wird als Incident im Cockpit sichtbar
    if (!hat(v, 'bestand') || !hat(v, 'verbrauchProTag')) {
      throw new Error('Bestand oder Versorgungsprofil fehlt (unbekannte produktId ' + v.produktId + '?)');
    }
    const verbrauch = Number(v.verbrauchProTag);
    const reichweite = verbrauch > 0 ? Math.floor(Number(v.bestand) / verbrauch) : 9999;
    const benoetigt = Number(v.tageBisNaechstePruefung) + Number(v.lieferzeitTage);
    return {
      reichweiteTage: reichweite,
      benoetigteReichweiteTage: benoetigt,
      voraussichtlicheUnterschreitung: datumInTagen(reichweite),
      nachversorgungNoetig: reichweite <= benoetigt,
    };
  },

  't2-pruefung-terminieren': (v) => ({
    naechstePruefungAm: datumInTagen(v.tageBisNaechstePruefung),
  }),

  // Menge = Fehlmenge bis Zielbestand, auf ganze Packungen gerundet; Kundenwunsch hat Vorrang.
  't2-vorschlag-erstellen': (v) => {
    const packung = Number(v.packungsgroesse);
    let menge = Math.ceil(Math.max(Number(v.zielbestand) - Number(v.bestand), 0) / packung) * packung;
    if (hat(v, 'gewuenschteMenge') && Number(v.gewuenschteMenge) > 0) {
      menge = Math.ceil(Number(v.gewuenschteMenge) / packung) * packung;
    }
    return {
      bestellmenge: menge,
      gewuenschteMenge: null,
      aktuellesProdukt: hat(v, 'aktuellesProdukt') ? v.aktuellesProdukt : v.produkt,
      aktuellerLieferant: hat(v, 'aktuellerLieferant') ? v.aktuellerLieferant : v.lieferant,
    };
  },

  // Bewertet Abweichungen gegenueber dem Versorgungsprofil und bereitet die Freigabeanforderung vor.
  // Ob automatisch bestellt werden darf, entscheidet danach die DMN-Tabelle T2_Berechtigungspruefung.
  't2-abweichungen-pruefen': (v) => {
    const hinweise = [];
    let produkt = v.aktuellesProdukt;
    let verfuegbar = v.produktVerfuegbar !== false;
    let ungeklaert = false;
    if (!verfuegbar) {
      if (produkt === v.produkt && hat(v, 'ersatzprodukt')) {
        produkt = v.ersatzprodukt; // nur hinterlegte Ersatzoption, kein medizinischer Ersatz
        verfuegbar = true;
      } else {
        ungeklaert = true;
        hinweise.push('Weder bevorzugtes Produkt noch hinterlegte Ersatzoption lieferbar');
      }
    }
    const produktWechsel = produkt !== v.produkt;
    if (produktWechsel) hinweise.push('Hinterlegte Ersatzoption statt bevorzugtem Produkt: ' + produkt);
    const lieferantWechsel = v.aktuellerLieferant !== v.lieferant;
    if (lieferantWechsel) hinweise.push('Anderer Lieferant: ' + v.aktuellerLieferant);
    const preis = lieferantWechsel ? Number(v.stueckpreisAlternativ) : Number(v.stueckpreis);
    const gesamt = rund2(Number(v.bestellmenge) * preis);
    const annahme = Number(v.verbrauchProTag);
    const beobachtet = hat(v, 'verbrauchBeobachtetProTag') ? Number(v.verbrauchBeobachtetProTag) : annahme;
    const sprung = annahme > 0 && Math.abs(beobachtet - annahme) / annahme > Number(v.schwelleVerbrauchssprung);
    if (sprung) hinweise.push('Verbrauch deutlich verändert: beobachtet ' + beobachtet + ' statt ' + annahme + ' pro Tag (keine stille Mengenerhöhung)');
    const mengeUeber = Number(v.bestellmenge) > Number(v.maxBestellmenge);
    if (mengeUeber) hinweise.push('Menge ' + v.bestellmenge + ' liegt über der Höchstmenge ' + v.maxBestellmenge);
    const abweichungen = hinweise.length ? hinweise.join('; ') : 'keine';
    return {
      aktuellesProdukt: produkt,
      produktVerfuegbar: verfuegbar,
      stueckpreisAktuell: preis,
      preisGesamt: gesamt,
      betrag: gesamt,
      handlungsart: 'BESTELLUNG',
      fallUngeklaert: ungeklaert,
      abweichungMitFolgen: produktWechsel || lieferantWechsel || sprung || mengeUeber,
      abweichungen,
      freigabeHandlung: 'Bestellung von ' + v.bestellmenge + ' Stück ' + produkt + ' bei ' + v.aktuellerLieferant + ' für ' + gesamt + ' EUR',
      freigabeBegruendung: 'Bestand reicht voraussichtlich nur ' + v.reichweiteTage + ' Tage (bis ' + v.voraussichtlicheUnterschreitung + '). Abweichungen: ' + abweichungen + '.',
      freigabeFolgen: 'Freigabe: Bestellung wird simuliert ausgelöst. Ablehnung oder Aufschub: keine Bestellung, Vorrat endet voraussichtlich am ' + v.voraussichtlicheUnterschreitung + '.',
      freigabeGueltigBis: v.voraussichtlicheUnterschreitung,
    };
  },

  // Gemeinsamer Dienst fuer alle Teams: Benachrichtigung an den Kunden (SIMULIERT: nur protokolliert)
  't2-benachrichtigung-senden': (v, task) => {
    const texte = {
      E_ErinnBestand: () => 'Bitte melden Sie den aktuellen Bestand von ' + v.produkt + '.',
      E_KeinBestand: () => 'Ohne Bestandsmeldung wurde die Nachversorgung von ' + v.produkt + ' beendet.',
      E_KeinBedarf: () => 'Ihr Vorrat reicht ca. ' + v.reichweiteTage + ' Tage. Nächste Prüfung am ' + v.naechstePruefungAm + '.',
      E_Abgelehnt: () => 'Keine Bestellung ausgelöst (' + v.entscheidung + '). Achtung: Der Vorrat reicht voraussichtlich nur bis ' + v.voraussichtlicheUnterschreitung + '.',
      E_ErinnLief: () => 'Bitte bestätigen Sie, ob die Lieferung richtig angekommen ist.',
      E_Erfolg: () => 'Lieferung bestätigt. Neuer Bestand: ' + v.bestand + ', reicht ca. ' + v.reichweiteTage + ' Tage. Nächste Prüfung am ' + v.naechstePruefungAm + '.',
      KE_Benachr: () => 'Bitte entscheiden Sie bis ' + v.freigabeGueltigBis + ': ' + v.freigabeHandlung,
      KE_Erinn: () => 'Erinnerung: Ihre Entscheidung zu „' + v.freigabeHandlung + '“ steht noch aus.',
    };
    const text = (texte[task.activityId] || (() => 'Statusänderung im Vorgang ' + v.vorgangId))();
    const anzahl = hat(v, 'anzahlBenachrichtigungen') ? Number(v.anzahlBenachrichtigungen) + 1 : 1;
    return {
      letzteBenachrichtigung: text,
      anzahlBenachrichtigungen: anzahl,
      letztesEreignis: 'Nachricht versandt',
    };
  },

  // Simulierter Lieferdienst: nimmt die Bestellung entgegen
  't2-bestellung-uebermitteln': (v) => ({
    bestellId: 'BE-SIM-' + String(v.vorgangId).slice(-6),
    bestellstatus: 'Übermittelt (SIMULIERT)',
    letztesEreignis: 'Bestellung ausgelöst',
  }),

  // Baustein von Team 3 (Nachfassen bzw. Mahnen), hier SIMULIERT
  't3-nachfassen': (v, task) => (task.activityId === 'ST_Nachfassen'
    ? { anzahlNachfassen: Number(v.anzahlNachfassen || 0) + 1, letztesEreignis: 'Nachricht versandt (Nachfassen)' }
    : { anzahlMahnungen: Number(v.anzahlMahnungen || 0) + 1, letztesEreignis: 'Nachricht versandt (Mahnung)' }),

  // Baustein von Team 3 (Gegenstelle kontaktieren), hier SIMULIERT
  't3-gegenstelle-kontaktieren': () => ({ letztesEreignis: 'Nachricht versandt (Beanstandung)' }),

  't2-lieferabweichung-erfassen': (v) => ({
    lieferabweichung: v.lieferErgebnis + (hat(v, 'gelieferteMenge') ? ' (geliefert: ' + v.gelieferteMenge + ' von ' + v.bestellmenge + ')' : ''),
    vorgangsstatus: 'Klärung erforderlich',
    letztesEreignis: 'Lieferung beanstandet',
  }),

  // Bestand erst nach bestaetigtem Ergebnis fortschreiben
  't2-bestand-fortschreiben': (v) => {
    const zugang = hat(v, 'gelieferteMenge') ? Number(v.gelieferteMenge) : Number(v.bestellmenge);
    const neu = Number(v.bestand) + zugang;
    const verbrauch = Number(v.verbrauchProTag);
    return {
      bestand: neu,
      reichweiteTage: verbrauch > 0 ? Math.floor(neu / verbrauch) : 9999,
      naechstePruefungAm: datumInTagen(v.tageBisNaechstePruefung),
      letztesEreignis: 'Lieferung bestätigt',
    };
  },

  // Uebergabe an Team 1 (Liefernachweis), hier SIMULIERT
  't1-nachweis-uebergeben': (v) => ({
    dokumentId: 'DK-SIM-' + String(v.vorgangId).slice(-6),
    belegStatus: 'An Team 1 übergeben (SIMULIERT)',
    letztesEreignis: 'Rechnung oder Nachweis übergeben',
  }),

  // Gemeinsame Freigabefunktion: Anforderung anlegen
  't2-freigabe-anlegen': (v, task) => ({
    freigabeId: 'FR-SIM-' + String(task.processInstanceId).substring(0, 8),
    freigabeAngefordertAm: new Date().toISOString(),
    vorgangsstatus: 'Wartet auf Kunde',
    letztesEreignis: 'Kundenentscheidung angefordert',
  }),

  // Gemeinsame Freigabefunktion: Entscheidung dokumentieren. Keine Antwort ist keine Freigabe.
  't2-freigabe-dokumentieren': (v, task) => {
    const keineAntwort = task.activityId === 'KE_Keine';
    const entscheidung = keineAntwort ? 'KEINE_ANTWORT' : v.entscheidung;
    return {
      entscheidung,
      entscheidungKommentar: keineAntwort ? 'Frist abgelaufen ohne Rückmeldung' : (v.entscheidungKommentar || ''),
      entschiedenAm: new Date().toISOString(),
      letztesEreignis: entscheidung === 'FREIGEGEBEN' ? 'Freigabe erteilt' : 'Freigabe verweigert oder zurückgegeben',
    };
  },
};

module.exports = { handlers, datumInTagen };
