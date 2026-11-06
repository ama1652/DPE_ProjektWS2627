# Team 2 – Materialversorgung: erstes ausführbares BPMN-Modell

Erster Entwurf (Stand 6. November 2026) für den Teamauftrag 2 „Ausgewählte Verbrauchsprodukte rechtzeitig und kontrolliert nachversorgen“.
Angelegt für **Camunda 7 / CIB seven** (Modeler: Camunda 7.24). Status: **Entwurf, noch nicht auf CIB seven getestet.**

## Dateien

| Datei | Inhalt |
|---|---|
| `T2_Materialversorgung.bpmn` | Hauptprozess (Prozess-Key `T2_Materialversorgung`), alle 12 Schritte aus Teamauftrag Abschnitt 4 und alle 8 Ausnahmen aus Abschnitt 5 |
| `T2_Kundenentscheidung_einholen.bpmn` | Gemeinsame Funktion „Kundenentscheidung einholen“ (Key `T2_Kundenentscheidung_einholen`), per Call Activity auch für Team 1 und 3 nutzbar |
| `T2_Berechtigungsregel.dmn` | DMN-Tabelle „Berechtigungsregel anwenden“ (Key `T2_Berechtigungsregel`, Hit Policy FIRST) |

## Aufbau des Hauptprozesses

**Lanes:** Pflegende Person · Pflege-Backoffice (Prozess) · Menschliche Prüfstelle.
**Externe Teilnehmer (zugeklappte Pools, alle SIMULIERT):** Pflege-App und Prüfplaner, Lieferant, Team 3, Team 1.

| Nr. (Auftrag) | Im Modell |
|---|---|
| Prozessbeginn | 3 Nachrichten-Startereignisse: Bestandsprüfung fällig, Bestandsmeldung eingegangen, Schwellenwert unterschritten |
| 1 Bestand prüfen | „Aktuellen Bestand melden“ (nur wenn kein Bestand mitgeliefert wurde) |
| 2 Reichweite | Script „Verbrauch und Reichweite berechnen“ |
| 3 Bedarf | Gateway „Reicht der Bestand bis Prüfung + Lieferzeit?“ → sonst nächste Prüfung terminieren |
| 4 Vorschlag | Script „Produkt, Menge und Lieferant vorschlagen“ (auf ganze Packungen gerundet) |
| 5 Abweichungen | Script „Abweichungen prüfen“ (Preis, Produkt, Lieferant, Verbrauch, Menge) |
| 6 Berechtigungsregel | Business Rule Task → DMN: AUTOMATISCH / KUNDENFREIGABE / PRUEFSTELLE |
| 7 Kundenentscheidung | Call Activity „Kundenentscheidung einholen“ |
| 8 Bestellung | Send Task „Bestellung simuliert übermitteln“ |
| 9 Lieferung überwachen | Ereignisbasiertes Gateway (bestätigt / nicht lieferbar / Frist) und Receive Task „Auf Zustellmeldung warten“ |
| 10 Lieferung bestätigen | „Lieferung prüfen und bestätigen“ → bei Abweichung „Lieferabweichung klären“ (Prüfstelle) |
| 11 Fortschreiben | Script „Bestand und Verbrauch fortschreiben“ |
| 12 Beleg und Abschluss | Send Task an Team 1, Kunden informieren, Endereignis |

**Ausnahmen (Abschnitt 5):**

| Situation | Umsetzung |
|---|---|
| Bestand nicht gemeldet | nicht unterbrechender Timer (Erinnerungen) + unterbrechender Timer → Ende „Abgebrochen“ |
| Verbrauch deutlich verändert | DMN → Kundenfreigabe, keine stille Mengenerhöhung |
| Preisgrenze überschritten | DMN → Kundenfreigabe mit Mehrkosten im Freigabetext |
| Produkt nicht verfügbar | Nachricht „Nicht lieferbar“ → nur hinterlegte Ersatzoption → erneute Prüfung; ist auch die Ersatzoption nicht lieferbar → Prüfstelle |
| Lieferant antwortet nicht | Timer am ereignisbasierten Gateway → Nachfassen über Team 3 (max. `maxNachfassen`) → Prüfstelle → Alternativlieferant oder Ende |
| Teil- oder Falschlieferung | Abweichung erfassen, an Lieferanten melden, Prüfstelle klärt (Nachlieferung / Teilmenge / Übergabe) |
| Kunde lehnt ab oder verschiebt | keine Bestellung, Reichweitenrisiko wird dem Kunden angezeigt |
| Lieferung bleibt unbestätigt | nur Erinnerungen, **kein** automatischer erfolgreicher Abschluss |

**Zustände:** Jede Station setzt `vorgangsstatus` (Zustände aus Projekthandbuch 7.2) und `letztesEreignis` (Ereignisse aus 7.3). Jedes Endereignis setzt zusätzlich `ergebnis`.

## Testen auf CIB seven

Voraussetzung wie bei den Demos: Container `cibseven` läuft, Anmeldung **demo / demo**. Alle Benutzeraufgaben sind `demo` zugewiesen.

```bash
cd Teamprojekt_T2_Materialversorgung
H=../BPMN_Demos_aus_Folien/dpe-demo.sh
bash $H deploy T2_Berechtigungsregel.dmn T2_Kundenentscheidung_einholen.bpmn T2_Materialversorgung.bpmn
```

### Testfall 1: Gemeinsamer Beispieldurchlauf (Teamauftrag Abschnitt 9)

```bash
# 1. Bestand 20 melden; Bestätigungsfrist für den Test auf 1 Minute verkürzen
bash $H msg MV_Bestandsmeldung_eingegangen '' '{"bestand":{"value":20,"type":"Long"},"fristBestaetigungLieferant":{"value":"PT1M","type":"String"}}'
bash $H instances T2_Materialversorgung      # Instanz-ID merken
```

2. Erwartung: Reichweite 5 Tage < 10 Tage → Vorschlag 120 Stück für 54 EUR > Preisgrenze 40 EUR → Kundenfreigabe.
   Tasklist „Über Freigabe entscheiden“ → **Freigeben**.
3. 1 Minute warten (oder in Cockpit den Timer sofort ausführen) → Nachfassen über Team 3, Token wartet wieder am Gateway.
4. `bash $H msg MV_Bestellbestaetigung <instanzId>`
5. `bash $H msg MV_Zustellung_gemeldet <instanzId>`
6. Tasklist „Lieferung prüfen und bestätigen“ → **Richtig und vollständig**.
7. `bash $H vars <instanzId>` → `vorgangsstatus = Erfolgreich abgeschlossen`, `bestand = 140`, `anzahlNachfassen = 1`.

### Weitere Testfälle

| Fall | Start (Variablen als JSON) | Erwartung |
|---|---|---|
| Kein Bedarf | `MV_Bestandsmeldung_eingegangen` mit `bestand` 100 | Ende „Kein Bedarf: nächste Prüfung terminiert“ |
| Automatisch | `bestand` 20, `preisgrenze` 100 (Double) | keine Freigabe, direkt Bestellung |
| Geplante Prüfung | `MV_Bestandspruefung_faellig` ohne Variablen | Aufgabe „Aktuellen Bestand melden“ |
| Bestand nicht gemeldet | wie oben + `fristBestandsmeldung` "PT1M" | nach 1 Minute Ende „Abgebrochen“ |
| Verbrauchssprung | `bestand` 20, `preisgrenze` 100, `verbrauchBeobachtetProTag` 7 | Kundenfreigabe mit Hinweis auf Verbrauch |
| Nicht lieferbar | nach Bestellung `msg MV_Nicht_lieferbar <id>` | Ersatzprodukt, erneut Kundenfreigabe; zweites Mal → Aufgabe „Grenzfall prüfen“ |
| Kunde lehnt ab | bei der Freigabe **Ablehnen** | Ende „Bestellung nicht ausgelöst“ |
| Änderung | bei der Freigabe **Ändern** + Menge 60 | neuer Vorschlag 60 Stück (27 EUR) → automatisch |
| Lieferant schweigt | `fristBestaetigungLieferant` "PT1M", `maxNachfassen` 0 (Long) | Aufgabe „Ausbleibende Lieferantenantwort klären“ |
| Teillieferung | bei Lieferbestätigung **Nur teilweise** + Menge 60 | Aufgabe „Lieferabweichung klären“ → „Teilmenge übernehmen“ → Bestand 80 |

Variablen-Format für `dpe-demo.sh`: `'{"bestand":{"value":20,"type":"Long"},"preisgrenze":{"value":100.0,"type":"Double"}}'`

## Konfigurierbare Werte (Projektannahmen)

Alle Werte stehen im Script „Vorgang eröffnen und Versorgungsprofil laden“ und werden nur gesetzt, wenn sie beim Start nicht mitgegeben wurden.

| Variable | Standard | Bedeutung |
|---|---|---|
| `packungsgroesse` / `zielbestand` | 30 / 120 | Bestellmenge = Fehlmenge bis Zielbestand, auf Packungen gerundet |
| `verbrauchProTag` / `verbrauchBeobachtetProTag` | 4 / 4 | Annahme und beobachteter Verbrauch |
| `schwelleVerbrauchssprung` | 0.3 | ab 30 % Abweichung gilt der Verbrauch als deutlich verändert |
| `lieferzeitTage` / `tageBisNaechstePruefung` | 3 / 7 | Bedarf, wenn Reichweite ≤ 10 Tage |
| `stueckpreis` / `stueckpreisAlternativ` / `preisgrenze` | 0.45 / 0.50 / 40 | Preis pro Stück und Freigabegrenze in EUR |
| `maxBestellmenge` | 150 | höhere Mengen brauchen eine Freigabe |
| `erinnerungszyklus` / `fristBestandsmeldung` / `fristKundenentscheidung` | R2/P1D / P3D / P3D | Erinnerungen und Fristen für den Kunden |
| `fristBestaetigungLieferant` / `maxNachfassen` | PT48H / 2 | Warten auf den Lieferanten |
| `mahnzyklusLieferung` / `fristLieferungEndgueltig` | R2/P2D / P10D | Warten auf die Zustellung |
| `erinnerungszyklusLieferbestaetigung` | R3/P2D | Erinnerungen an die Lieferbestätigung |

## Entscheidungen (für das Entscheidungsprotokoll)

1. **Kundenentscheidung als eigener Prozess (Call Activity, Call by Value):** Team 2 muss die Freigabefunktion auch Team 1 und 3 anbieten (Teamauftrag 2.2). Eingaben und Ausgaben sind ausdrücklich gemappt, damit andere Teams sie ohne unsere Variablen nutzen können.
2. **Berechtigungsregel als DMN:** Grenzen sollen konfigurierbar bleiben (Teamauftrag 6.1). Änderungen an Regeln brauchen kein neues Prozessmodell.
3. **Erinnerungen per nicht unterbrechendem Timer, Abbruch per unterbrechendem Timer:** Die Aufgabe bleibt offen, während erinnert wird; erst die endgültige Frist beendet den Wartezustand.
4. **Keine Antwort ist keine Freigabe:** Läuft die Entscheidungsfrist ab, wird `KEINE_ANTWORT` gesetzt und nicht bestellt.
5. **Lieferbestätigung ohne endgültige Frist:** Der Vorgang darf laut Auftrag nicht automatisch erfolgreich schließen; er bleibt sichtbar „Wartet auf Kunde“ mit Erinnerungen.
6. **Änderungswunsch innerhalb der Grenzen:** Die vom Kunden gewünschte Menge gilt als von ihm gewollt; liegt sie innerhalb der Grenzen, wird ohne zweite Freigabe bestellt.
7. **Simulation:** Send Tasks verwenden vorerst `${true}` und setzen nur Status-Variablen, damit das Modell ohne weitere Komponenten läuft. Achtung: Für echte Dienste muss die Implementierung dieser Tasks noch umgestellt werden (siehe Offene Punkte), der Ablauf selbst bleibt gleich.
8. **Freigabe mit Gültigkeit:** Jede Freigabeanforderung trägt Handlung, Begründung, Folgen und Gültigkeit (Teamauftrag Abschnitt 7). Für Bestellungen gilt die Freigabe bis zum voraussichtlichen Ende des Vorrats.

## Nachrichten-Korrelation

Der Prozess setzt beim Start den **Business Key = Vorgangskennung** (`vorgangId`, z. B. `VG-T2-…`). Alle späteren Nachrichten (`MV_Bestellbestaetigung`, `MV_Nicht_lieferbar`, `MV_Zustellung_gemeldet`) werden über diesen Business Key der richtigen Instanz zugeordnet:

```bash
curl -u demo:demo -H "Content-Type: application/json" -X POST http://localhost:8080/engine-rest/message \
  -d '{"messageName":"MV_Bestellbestaetigung","businessKey":"VG-T2-xxxxxxxx"}'
```

Für Tests reicht weiterhin `dpe-demo.sh msg <Name> <instanzId>`.

## Offene Punkte

**Vor der Abgabe nötig:**
- Auf CIB seven deployen und alle Testfälle durchspielen (bisher nur statisch geprüft, siehe unten).
- Simulierte Dienste austauschbar machen: Send Tasks und die rechnenden Script Tasks auf **Service Tasks mit External Tasks** (z. B. Topic `t2-bestellung`) oder REST-Aufrufe an einen kleinen Simulationsdienst umstellen. Dann kann später der echte Dienst den Simulator ersetzen, ohne das BPMN-Modell zu ändern. Das entspricht auch der Trennung von Prozess- und Dienstschicht aus der Vorlesung.
- Grenzen und Versorgungsprofil (Preisgrenze, Zielbestand, Fristen) aus dem Script herausnehmen und konfigurierbar ablegen, z. B. als DMN-Tabelle „Versorgungsprofil“ oder Konfigurationsdatei (Projekthandbuch 5.6).
- Gemeinsame Funktionen für alle Teams vervollständigen: „Kunden informieren“ (Benachrichtigung) als eigener aufrufbarer Prozess und eine **allgemeine** Berechtigungsprüfung, die nicht nur auf Bestellungen zugeschnitten ist (Teamauftrag 2.2).
- 2 bis 3 Testprodukte im Versorgungsprofil festlegen (bisher nur „Testprodukt M“; je Produkt ein Vorgang).

**Mit Team 1 und 3 abstimmen (Integrationskreis):**
- Kennungsformat (`PH-0001`, `VG-T2-…`) und Nachrichtennamen.
- Ereignisrahmen (ereignisId, korrelationsId, schemaVersion) für die Übergaben an Team 1 und 3.
- Nachfassen und Mahnen über die Bausteine von Team 3 statt eigener Send Tasks.

**Im Team entscheiden:**
- Ob die Prüfstelle eine eigene Gruppe (z. B. `pruefstelle`) statt Benutzer `demo` bekommt.
- Ob nach „Kunde entscheidet“ durch die Prüfstelle bei ungeklärtem Produkt überhaupt bestellt werden darf.
- Formulare später durch eigene Oberflächen ersetzen (Teamauftrag Abschnitt 8).

## Bisherige Prüfung

- Gültiges XML, keine Warnungen beim Einlesen mit `bpmn-moddle`/`dmn-moddle` (inkl. Camunda-Erweiterungen).
- `bpmnlint` mit Regeln `recommended` und `camunda-compat` für Camunda Platform 7.24: 0 Fehler, 0 Warnungen.
- Alle 16 JavaScript-Skripte syntaktisch geprüft; Rechenlogik mit den Testfällen oben in Node.js nachgespielt.
- **Nicht** geprüft: tatsächliche Ausführung auf CIB seven.
