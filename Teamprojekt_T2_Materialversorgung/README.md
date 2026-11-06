# Team 2 – Materialversorgung

Ausführbares Prozessmodell für den Teamauftrag 2 „Ausgewählte Verbrauchsprodukte rechtzeitig und kontrolliert nachversorgen“.
Für **Camunda 7 / CIB seven** (Modeler: Camunda 7.24). Stand 6. November 2026, **Version 2, Entwurf**: noch nicht auf CIB seven getestet und noch nicht vom Team bestätigt.

## Aufbau: Prozess, Regeln und Dienste getrennt

| Schicht | Inhalt | Dateien |
|---|---|---|
| **Prozess** | Ablauf, Wartezustände, Fristen, menschliche Aufgaben. Keine Programmlogik im Modell. | `T2_Materialversorgung.bpmn`, `T2_Kundenentscheidung_einholen.bpmn` |
| **Regeln und Konfiguration** | Versorgungsprofil je Produkt und Berechtigungsgrenzen, änderbar ohne Code (Projekthandbuch 5.6) | `T2_Versorgungsprofil.dmn`, `T2_Berechtigungsregel.dmn` |
| **Dienste** | Berechnungen und Kontakte zu Lieferant, Team 1 und Team 3 als **External Tasks**. Vorerst ein Simulator, später austauschbar, ohne das BPMN-Modell zu ändern (Teamauftrag 7.1) | `simulator/` |

## Hauptprozess

**Lanes:** Pflegende Person · Pflege-Backoffice (Prozess) · Menschliche Prüfstelle.
**Externe Teilnehmer (alle SIMULIERT):** Pflege-App und Prüfplaner, Lieferant, Team 3, Team 1.

| Nr. (Auftrag) | Im Modell |
|---|---|
| Prozessbeginn | 3 Nachrichten-Startereignisse: Bestandsprüfung fällig, Bestandsmeldung eingegangen, Schwellenwert unterschritten |
| 1 Bestand | „Vorgang eröffnen“ → „Versorgungsprofil laden“ (DMN) → bei Bedarf „Aktuellen Bestand melden“ |
| 2 Reichweite | „Verbrauch und Reichweite berechnen“ |
| 3 Bedarf | Gateway „Reicht der Bestand bis Prüfung + Lieferzeit?“ → sonst nächste Prüfung terminieren |
| 4 Vorschlag | „Produkt, Menge und Lieferant vorschlagen“ (ganze Packungen) |
| 5 Abweichungen | „Abweichungen prüfen“ (Produkt, Lieferant, Verbrauch, Menge) |
| 6 Berechtigung | „Berechtigung prüfen“ (DMN, gemeinsamer Dienst): AUTOMATISCH / KUNDENFREIGABE / PRUEFSTELLE |
| 7 Kundenentscheidung | Call Activity „Kundenentscheidung einholen“ |
| 8 Bestellung | „Bestellung simuliert übermitteln“ |
| 9 Lieferung überwachen | Ereignisbasiertes Gateway (bestätigt / nicht lieferbar / Frist) und „Auf Zustellmeldung warten“ |
| 10 Lieferung bestätigen | „Lieferung prüfen und bestätigen“ → bei Abweichung „Lieferabweichung klären“ |
| 11 Fortschreiben | „Bestand und Verbrauch fortschreiben“ |
| 12 Beleg und Abschluss | „Liefernachweis an Team 1 übergeben“ → Nachrichten-Endereignis „Kunde informiert“ |

**Ausnahmen (Teamauftrag Abschnitt 5):**

| Situation | Umsetzung |
|---|---|
| Bestand nicht gemeldet | nicht unterbrechender Timer (Erinnerungen) + unterbrechender Timer → Ende „Abgebrochen“, Kunde wird informiert |
| Verbrauch deutlich verändert | Abweichung mit Folgen → Kundenfreigabe, keine stille Mengenerhöhung |
| Preisgrenze überschritten | DMN: Bestellung über 40 EUR → Kundenfreigabe mit Mehrkosten im Freigabetext |
| Produkt nicht verfügbar | Nachricht „Nicht lieferbar“ → nur hinterlegte Ersatzoption → erneute Prüfung; Ersatz auch nicht lieferbar → Prüfstelle |
| Lieferant antwortet nicht | Timer am ereignisbasierten Gateway → Nachfassen über Team 3 (max. `maxNachfassen`) → Prüfstelle → Alternativlieferant oder Ende |
| Teil- oder Falschlieferung | Abweichung erfassen, an Lieferanten melden, Prüfstelle klärt (Nachlieferung / Teilmenge / Übergabe) |
| Kunde lehnt ab oder verschiebt | keine Bestellung, Kunde wird über das Reichweitenrisiko informiert |
| Lieferung bleibt unbestätigt | nur Erinnerungen, **kein** automatischer erfolgreicher Abschluss |

**Zustände:** Jede Station setzt `vorgangsstatus` (Zustände aus Projekthandbuch 7.2) und `letztesEreignis` (Ereignisse aus 7.3). Jedes Endereignis setzt `ergebnis`.

## Gemeinsame Funktionen für Team 1 und Team 3

| Funktion | So nutzen andere Teams sie |
|---|---|
| **Kundenentscheidung einholen** | Call Activity auf `T2_Kundenentscheidung_einholen`. Eingaben: `freigabeHandlung`, `freigabeBegruendung`, `freigabeFolgen`, `freigabeGueltigBis`, `fristKundenentscheidung`, `erinnerungszyklus`. Ausgabe: `entscheidung` (FREIGEGEBEN, ABGELEHNT, AENDERUNG, AUFSCHUB, KEINE_ANTWORT). Keine Antwort ist keine Freigabe. |
| **Berechtigung prüfen** | Business Rule Task auf `T2_Berechtigungsregel`. Eingaben (alle setzen, notfalls `null`): `handlungsart` (BESTELLUNG, EINREICHUNG, ERSATZVERSORGUNG), `betrag`, `fallUngeklaert`, `abweichungMitFolgen`. Ausgabe: `freigabeweg`, `begruendung`. |
| **Kunden informieren** | Nachrichten-End- oder Zwischenereignis mit External Task, Topic `t2-benachrichtigung-senden`. |

## Dienste (Topics)

| Topic | Aufgabe | Liefert später |
|---|---|---|
| `t2-vorgang-eroeffnen` | Vorgangskennung vergeben | Team 1 (Vorgangsakte) |
| `t2-reichweite-berechnen`, `t2-pruefung-terminieren`, `t2-vorschlag-erstellen`, `t2-abweichungen-pruefen`, `t2-lieferabweichung-erfassen`, `t2-bestand-fortschreiben` | Fachlogik Materialversorgung | Team 2 |
| `t2-bestellung-uebermitteln` | Bestellung an den Lieferanten | Lieferdienst |
| `t2-benachrichtigung-senden` | Kunden über die App informieren | Team 2 (gemeinsam) |
| `t2-freigabe-anlegen`, `t2-freigabe-dokumentieren` | Freigaben verwalten | Team 2 (gemeinsam) |
| `t3-nachfassen`, `t3-gegenstelle-kontaktieren` | Nachfassen, Mahnen, Beanstandung | Team 3 |
| `t1-nachweis-uebergeben` | Liefernachweis übergeben | Team 1 |

Die Fachlogik steht in `simulator/handlers.js`. Wer einen Dienst echt umsetzt, holt dasselbe Topic ab und schaltet den Simulator für dieses Topic ab.

## Testprodukte (Versorgungsprofil, alle Werte Projektannahmen)

| produktId | Produkt | Zielbestand / Packung | Verbrauch pro Tag | Fristen |
|---|---|---|---|---|
| `TP-M` | Inkontinenzmaterial Testprodukt M (Leitgeschichte) | 120 / 30 | 4 | normal (z. B. Lieferantenbestätigung 48 h) |
| `TP-HS` | Einmalhandschuhe Testprodukt Größe M | 300 / 100 | 10 | normal |
| `TP-SCHNELL` | wie TP-M, **nur für Tests** | 120 / 30 | 4 | kurz (Lieferantenbestätigung 1 min, Entscheidung 2 min) |

Grenzen in `T2_Berechtigungsregel.dmn`: Bestellungen bis 40 EUR automatisch, darüber Kundenfreigabe.

## Starten und testen

Voraussetzung wie bei den Demos: Container `cibseven` läuft, Anmeldung **demo / demo**, Node.js 18 oder neuer.

```bash
cd Teamprojekt_T2_Materialversorgung
H=../BPMN_Demos_aus_Folien/dpe-demo.sh
bash $H deploy T2_Versorgungsprofil.dmn T2_Berechtigungsregel.dmn T2_Kundenentscheidung_einholen.bpmn T2_Materialversorgung.bpmn

# zweites Terminal: simulierte Dienste starten (ohne laufen alle Service Tasks auf Warten)
cd simulator && npm start          # Lieferant antwortet per Hand (dpe-demo.sh msg ...)
# oder: npm run start:auto         # Lieferant bestätigt nach dem ersten Nachfassen selbst
```

### Testfall 1: Gemeinsamer Beispieldurchlauf (Teamauftrag Abschnitt 9)

```bash
bash $H msg MV_Bestandsmeldung_eingegangen '' '{"produktId":{"value":"TP-SCHNELL","type":"String"},"bestand":{"value":20,"type":"Long"}}'
bash $H instances T2_Materialversorgung      # Instanz-ID merken
```

1. Erwartung: Reichweite 5 Tage < 10 Tage → 120 Stück für 54 EUR → über 40 EUR → Kundenfreigabe. Tasklist „Über Freigabe entscheiden“ → innerhalb von 2 Minuten **Freigeben** (TP-SCHNELL hat kurze Fristen).
2. Nach 1 Minute ohne Bestätigung → Nachfassen über Team 3, Token wartet wieder am Gateway.
3. `bash $H msg MV_Bestellbestaetigung <instanzId>`, dann `bash $H msg MV_Zustellung_gemeldet <instanzId>` (entfällt mit `npm run start:auto`).
4. Tasklist „Lieferung prüfen und bestätigen“ → **Richtig und vollständig**.
5. `bash $H vars <instanzId>` → `vorgangsstatus = Erfolgreich abgeschlossen`, `bestand = 140`, `anzahlNachfassen = 1`.

### Weitere Testfälle

| Fall | Start (Variablen) | Erwartung |
|---|---|---|
| Kein Bedarf | `produktId` TP-M, `bestand` 100 | Ende „Kunde informiert: kein Bedarf“ |
| Automatisch | `produktId` TP-HS, `bestand` 50 | 300 Stück für 24 EUR, keine Freigabe, direkt Bestellung |
| Geplante Prüfung | `MV_Bestandspruefung_faellig` mit `produktId` TP-SCHNELL | Aufgabe „Aktuellen Bestand melden“; ohne Antwort nach 2 min Ende „Abgebrochen“ |
| Verbrauchssprung | `produktId` TP-HS, `bestand` 50, `verbrauchBeobachtetProTag` 20 | Kundenfreigabe mit Hinweis auf Verbrauch |
| Nicht lieferbar | nach Bestellung `msg MV_Nicht_lieferbar <id>` | Ersatzprodukt, erneut Kundenfreigabe; zweites Mal → „Grenzfall prüfen“ |
| Kunde lehnt ab | bei der Freigabe **Ablehnen** | Ende „Kunde informiert: keine Bestellung“ |
| Änderung | bei der Freigabe **Ändern** + Menge 60 | neuer Vorschlag 60 Stück (27 EUR) → automatisch |
| Lieferant schweigt | `produktId` TP-SCHNELL, keine Nachricht senden | nach 2 × 1 min „Ausbleibende Lieferantenantwort klären“ |
| Teillieferung | bei der Lieferbestätigung **Nur teilweise** + Menge 60 | „Lieferabweichung klären“ → „Teilmenge übernehmen“ → Bestand 80 |
| Unbekanntes Produkt | `produktId` GIBTSNICHT | Incident im Cockpit statt falschem Ergebnis |

Variablen-Format für `dpe-demo.sh`: `'{"bestand":{"value":20,"type":"Long"}}'`

### Nachrichten-Korrelation

„Vorgang eröffnen“ setzt den **Business Key = Vorgangskennung** (`vorgangId`, z. B. `VG-T2-…`). Lieferant, Team 3 und App schicken ihre Nachrichten mit diesem Business Key:

```bash
curl -u demo:demo -H "Content-Type: application/json" -X POST http://localhost:8080/engine-rest/message \
  -d '{"messageName":"MV_Bestellbestaetigung","businessKey":"VG-T2-xxxxxxxx"}'
```

## Entscheidungen (für das Entscheidungsprotokoll)

1. **Prozess ohne Programmlogik:** Alle Berechnungen und Kontakte laufen als External Tasks, die Konfiguration steht in DMN. Grund: Trennung von Prozess- und Dienstschicht; simulierte Dienste sind austauschbar, ohne das Modell zu ändern.
2. **Kundenentscheidung als eigener Prozess (Call Activity, Call by Value):** Team 2 stellt die Freigabefunktion für alle Teams bereit (Teamauftrag 2.2).
3. **Allgemeine Berechtigungsprüfung:** Die DMN-Tabelle kennt Handlungsarten aller Teams und ist nicht nur auf Bestellungen zugeschnitten.
4. **Benachrichtigung als gemeinsamer Dienst:** Nachrichten-Endereignisse mit Topic `t2-benachrichtigung-senden` statt eines eigenen Teilprozesses, weil Benachrichtigen ein einzelner Dienstaufruf ist.
5. **Ein Vorgang je Produkt:** Jede Prozessinstanz versorgt genau ein Produkt aus dem Versorgungsprofil.
6. **Erinnerungen per nicht unterbrechendem Timer, Abbruch per unterbrechendem Timer:** Die Aufgabe bleibt offen, während erinnert wird.
7. **Keine Antwort ist keine Freigabe**, und eine **unbestätigte Lieferung** schließt nie automatisch erfolgreich.
8. **Änderungswunsch innerhalb der Grenzen:** Die vom Kunden gewünschte Menge gilt als von ihm gewollt; liegt sie innerhalb der Grenzen, wird ohne zweite Freigabe bestellt.
9. **Fehler werden sichtbar:** Der Simulator meldet Fehler mit `retries: 0`, dadurch entsteht ein Incident im Cockpit statt eines stillen Fehlers.

## Offene Punkte

**Vor der Abgabe:**
- Auf CIB seven deployen und alle Testfälle durchspielen.
- Alle Entscheidungen oben im Team bestätigen und ins Entscheidungsprotokoll übernehmen.

**Mit Team 1 und 3 abstimmen (Integrationskreis):**
- Kennungsformat (`PH-0001`, `VG-T2-…`), Topic- und Nachrichtennamen.
- Ereignisrahmen (ereignisId, korrelationsId, schemaVersion) für die Übergaben.
- Ob Team 1 und 3 die gemeinsamen Funktionen so nutzen können (Eingaben, Handlungsarten, Grenzen).

**Im Team entscheiden:**
- Grenze 40 EUR und alle Werte im Versorgungsprofil.
- Ob die Prüfstelle eine eigene Gruppe (z. B. `pruefstelle`) statt Benutzer `demo` bekommt.
- Ob nach „Kunde entscheidet“ durch die Prüfstelle bei ungeklärtem Produkt überhaupt bestellt werden darf.
- Ob die Endereignisse der Prüfstelle den Kunden ebenfalls benachrichtigen sollen.
- Formulare später durch eigene Oberflächen ersetzen (Teamauftrag Abschnitt 8).

## Prüfung

```bash
cd simulator
npm test          # 12 automatisierte Tests der Dienste und der REST-Anbindung
npm run pruefen   # Ausführbarkeit für Camunda 7 und Testfälle der DMN-Tabellen
```

- `npm test`: 12 von 12 bestanden.
- `npm run pruefen`: 0 Fehler. Geprüft werden Implementierung jeder Aufgabe, Verweise auf DMN, Call Activity und Nachrichten, Bedingungen an Gateways, alle in Ausdrücken benutzten Variablen und die Zuordnung Topic ↔ Simulator.
- Zusätzlich gültiges XML laut `bpmn-moddle` und `dmn-moddle`, 0 Befunde mit `bpmnlint`.
- **Nicht** geprüft: tatsächliche Ausführung auf CIB seven.

## Lizenz

Selbst erstellte Bestandteile unter der MIT-Lizenz (Projekthandbuch Abschnitt 13). Der Simulator nutzt nur Node.js, keine Fremdbibliotheken.
