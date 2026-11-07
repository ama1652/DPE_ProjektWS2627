# Team 2 Materialversorgung – Review des BPMN-Entwurfs für Samstag

Nov 6, 2026 · @amaroviccc

Der Entwurf (Commit `6819881`, 6. Nov.) ist ausführlich und deckt die Ausnahmen aus Abschnitt 5 des Teamauftrags weitgehend ab. Vier Fehler im Token-Ablauf und Stiehls Stil- und Technikvorgaben sollten wir aber vor dem Weitermodellieren klären. Hier steht nur, was geändert oder entschieden werden sollte.

**Geprüft:** `T2_Materialversorgung.bpmn`, `T2_Kundenentscheidung_einholen.bpmn`, beide DMN-Tabellen und `simulator/handlers.js`.

**Grundlage:**

- Teamauftrag 2 und gemeinsames Projekthandbuch aus dem Kick-off
- Stiehls Foliensatz *04 BPMN Best Practices* (23 Stilregeln) und *07 Prozessgesteuerter Ansatz*
- Stiehls Projektvorgaben aus WS 25/26. Die aktuellen Bewertungskriterien liegen uns noch nicht vor.

**Priorität:** **A** = Ablauf falsch oder hängt, vor allem anderen beheben. **B** = verstößt gegen Stiehls Vorgaben. **C** = Feinschliff.

## Token-Logik

Deadlocks kann es nicht geben: Das Modell hat nur XOR- und ereignisbasierte Gateways, und jedes XOR hat einen Default-Fluss. Die Probleme liegen woanders. Nachrichten gehen beim Warten verloren, eine Schleife hängt am Simulator, manche Vorgänge bleiben ewig offen, und für ein Produkt können zwei Vorgänge parallel laufen.

### A1 – Nachrichten gehen während des Nachfassens verloren

- **Ablauf:** Das ereignisbasierte Gateway wartet nur, solange das Token *auf ihm* liegt. Nach dem Timer liegt das Token bei „Nachfassen“ (External Task). Kommt in diesem Moment die Bestätigung oder „nicht lieferbar“, wartet nichts darauf. CIB seven lehnt die Nachricht ab (HTTP 400), sie ist weg.
- **Weitere Lücken:**
  - Nach der Bestätigung kann der Lieferant nicht mehr „nicht lieferbar“ melden.
  - Eine Zustellmeldung, die vor der Bestätigung kommt, geht ebenfalls verloren.
- **Änderung (Muster A20 aus Stiehls Advanced-Folien):**
  - Empfangsaufgabe „Auf Bestellbestätigung warten“ mit drei Boundary-Events: *nicht unterbrechendem* Timer (Nachfassen, Zyklus `R{max}`), unterbrechendem Timer (endgültige Frist) und unterbrechender Nachricht „Nicht lieferbar“.
  - Das Warten bleibt so aktiv, während nachgefasst wird.
  - Alternative: eingebetteter Teilprozess „Lieferung überwachen“ mit Ereignis-Teilprozessen (A21/A22).

### A2 – Die Schleifenzahl hängt am Simulator, nicht am Prozess

- **Ablauf:** Die Bedingung `anzahlNachfassen < maxNachfassen` beendet die Nachfass-Schleife. Hochgezählt wird aber nur im Simulator-Handler für das Team-3-Topic `t3-nachfassen`.
- **Fehler:** Liefert Team 3 später den echten Dienst, zählt niemand mehr. Die Schleife läuft dann endlos oder bricht mit einem Fehler ab.
- **Änderung:** Im Modell zählen, mit einem `take`-Listener am Fluss zu „Nachfassen“. Dasselbe gilt für alles, was ein Gateway auswertet und nicht fachlich vom Dienst kommt.

### A3 – Manche Vorgänge bleiben unbemerkt offen (Projekthandbuch 5.4)

- **„Lieferung prüfen und bestätigen“:** nur 3 nicht unterbrechende Erinnerungen (`R3/P2D`). Danach liegt die Aufgabe für immer offen. Änderung: unterbrechender Timer → Prüfstelle oder Ende „Übergeben: Lieferung unbestätigt“. Das hält die Regel „nie automatisch erfolgreich“ weiterhin ein.
- **„Grenzfall prüfen“, „Ausbleibende Lieferantenantwort klären“, „Lieferabweichung klären“:** keine Frist. Teamauftrag 5.1 verlangt „gegebenenfalls eine Frist“. Änderung: Frist plus Eskalation, Werte aus der DMN wie die übrigen Fristen.

### A4 – Zwei Vorgänge für dasselbe Produkt möglich

- **Ablauf:** Jede der drei Startnachrichten erzeugt eine neue Instanz. Kommt eine Bestandsmeldung, während für das Produkt schon ein Vorgang läuft, entstehen zwei Instanzen, die womöglich beide bestellen.
- **Bezug:** Das ist Stiehls Thema *Process Instance/Activity Alignment* (Best Practices, Folie 18 ff.).
- **Änderung (zur Wahl):**
  - in „Vorgang eröffnen“ auf einen laufenden Vorgang prüfen und mit „Bereits in Bearbeitung“ enden;
  - oder die Meldung per Nachricht an den laufenden Vorgang weitergeben, über einen nicht unterbrechenden Ereignis-Teilprozess.

### B1 – Verbleibende Token beim Abbruch

- **Was passiert:** Die nicht unterbrechenden Timer erzeugen zusätzliche Token für Erinnerungen und Mahnungen. Ein unterbrechender Timer bricht nur *seine* Aufgabe ab, nicht ein Erinnerungs-Token, das schon losgelaufen ist.
- **Folge heute:** Harmlos, denn diese Token enden selbst. Allerdings kann nach dem Abbruch noch eine Erinnerung verschickt werden. Hängt die Benachrichtigung (Incident), bleibt die Instanz aktiv, obwohl `vorgangsstatus = Abgebrochen` gesetzt ist.
- **Änderung (Muster A21):**
  - Aufgabe und Erinnerungen in einen eingebetteten Teilprozess legen, den Timer an den Teilprozess hängen. Ein unterbrechendes Ereignis am Teilprozess beendet alle Token darin.
  - Alternativ: Terminate-Endereignis an den Abbruch-Enden.

## Stiehls BPMN-Stilregeln

Die größte Abweichung betrifft Regel 2: Der Hauptprozess hat 21 Aktivitäten flach auf einer Ebene, Stiehl verlangt höchstens 10 pro Ebene und einen hierarchischen Aufbau. Laut Projektvorgaben WS 25/26 sind seine Best Practices „zwingend anzuwenden“. Nummern = Regelnummern aus *04 BPMN Best Practices*.

| Prio | Regel | Befund im Entwurf | Änderung |
| --- | --- | --- | --- |
| B | 2 – hierarchisch, max. 10 Aktivitäten pro Ebene | 21 Aktivitäten auf einer Ebene, keine Teilprozesse | Oberste Ebene mit etwa 5 Teilprozessen, z. B. *Bedarfsermittlung*, *Bestellfreigabe*, *Bestellabwicklung*, *Lieferabwicklung*, *Vorgangsabschluss*; jeder als eigene Ebene aufklappen |
| B | 10–12 – Endzustände des Teilprozesses passen zu den Ausgängen des folgenden Gateways (Label-Matching) | „Kundenentscheidung einholen“ hat ein Ende („Entscheidung dokumentiert“), dahinter liegen 3 Ausgänge, fachlich gibt es 5 Ergebnisse | Im aufgerufenen Prozess 5 Endereignisse (Freigegeben, Abgelehnt, Änderung gewünscht, Aufschub, Keine Antwort); Gateway-Ausgänge gleich benennen, keinen Sammel-Default |
| B | 19 – Alternativen nicht mit XOR zusammenführen, außer in ein weiteres Gateway | 10 XOR-Merges vor Aufgaben oder Endereignissen (`J_Start`, `J_Bestand`, `J_Vorschlag`, `J_Pruefen`, `J_Kunde`, `J_Bestellen`, `J_Lieferung`, `J_Klaerung`, `J_Fortschreiben`, `KE_Join`) | Flüsse direkt an die Aufgabe führen; `J_Warten` vor dem Ereignis-Gateway darf bleiben |
| B | 13–15 – alle Nachrichtenflüsse zeichnen und beschriften | 15 von 17 Nachrichtenflüssen ohne Beschriftung | Mit dem Nachrichtennamen beschriften (z. B. „Bestellbestätigung“) |
| C | 7 – ein Endereignis je Endzustand des Prozesses | „An Bestandsmeldung erinnert“, „An Lieferbestätigung erinnert“ und „Mahnung versandt“ sehen aus wie Endzustände des Vorgangs | Nach B1 im Teilprozess verstecken oder neutral benennen („Erinnerung versandt“) |
| C | Lanes = Rollen (Regel 5) | Alle Benutzeraufgaben `assignee=demo`, die Lanes haben keine Wirkung | `candidateGroups` je Lane (z. B. `pflegende-person`, `pruefstelle`) mit den eingerichteten Benutzern kermit und fozzie |
| C | Pools nur für Kommunikationspartner | Im Kindprozess ein Pool „Aufrufender Prozess“ ohne Nachrichtenfluss | Pool entfernen; eine Call Activity ist kein Nachrichtenaustausch |

## Prozessgesteuerter Ansatz und Technik

Der Node.js-Simulator mit External Tasks passt nicht zu Stiehls Technik-Vorgaben, das Modell selbst bietet aber die richtigen Andockstellen. Laut Projektvorgaben WS 25/26 ist der Stack fest: Java 17, Quarkus, CIB seven, ActiveMQ, Camel, Esper. Andere Frameworks müssen mit Stiehl abgesprochen werden. External Tasks kommen in keinem der Foliensätze aus WS 25/26 vor, geprüft per Volltextsuche über alle PDFs.

**Vorbehalt:** Laut Teamauftrag wurden die aktuellen Bewertungskriterien zu Semesterbeginn erläutert. Uns liegt nur die Fassung aus WS 25/26 vor. Vor einem Umbau sollte jemand die aktuelle Fassung aus Moodle oder der ersten Vorlesung besorgen.

| Prio | Stelle im Modell | Stiehls Vorgabe | Änderung |
| --- | --- | --- | --- |
| B | Rechnende Service-Tasks (Reichweite, Vorschlag, Abweichungen, Fortschreiben, Termin, Vorgang eröffnen) als External Task mit Node-Handler | *07*, Fall 1: eigene Funktion = Service-Task, die einen eigenen REST- oder SOAP-Microservice aufruft; laut Vorgaben 25/26 mit Persistenz | Quarkus-Service mit Datenbank (Bestand, Profil, Bestellungen). Oder External Tasks bei Stiehl ausdrücklich absegnen lassen |
| B | „Bestellung übermitteln“ + Warten auf Bestätigung oder Zustellung | *07*, Fall 3: Sende- und Empfangsaufgabe über Queue und Camel. Vorgaben 25/26 verlangen genau das: Sende-Aufgabe → JMS-Queue, Camel mit Content-Based Routing und XML/JSON-Umwandlung, Rückweg über Camel an ein Nachrichten-Zwischenereignis | Die Modellstruktur passt schon. Statt Node-Topic: ActiveMQ-Queue `T2_Bestellung_Lieferant` und Camel-Routen hin und zurück |
| B | Startereignis „Schwellenwert unterschritten“ | Eventing aus Foliensatz 10 (Esper → Queue → Camel → Prozessstart, wie Demo C06) | Esper erkennt die Unterschreitung aus den Bestandsmeldungen und startet den Vorgang. Damit ist die Eventing-Pflicht erfüllt |
| B | Übergaben an Team 1 und Team 3 | *07*, Fall 2: ohne Rückantwort → Sende-Aufgabe über Queue | Mit den anderen Teams Queues nach Stiehls Namensschema `Sender_Nachricht_Empfänger` vereinbaren |
| B | Kein Element eingefärbt | *07*: den Übergang vom Fach- zum Integrationsprozess farblich kennzeichnen | Sende- und Empfangsaufgaben zur Integration farbig markieren |
| B | Code ohne Verantwortliche und ohne KI-Kennzeichnung | Vorgaben 25/26: jeder Code-Anteil mit Namen der verantwortlichen Person; KI-Code kennzeichnen, bei überwiegendem KI-Anteil die KI als Hauptautor nennen; jedes Mitglied muss **alles** erklären können | Aufteilung festlegen und Kommentare im Code nachziehen |

## Fachliche Lücken gegenüber dem Teamauftrag

Fünf Punkte widersprechen dem Wortlaut von Teamauftrag 2 oder lassen ihn offen. Sie brauchen jeweils eine Team-Entscheidung, bevor modelliert wird.

| Prio | Teamauftrag | Im Entwurf | Vorschlag |
| --- | --- | --- | --- |
| B | Abschnitt 5: Teil- oder Falschlieferung → „Status offen halten“ | „Teilmenge übernehmen“ endet als *Erfolgreich abgeschlossen* | Eigenes Ende „Teilweise geliefert“ oder Restmenge nachbestellen |
| B | Abschnitt 4, Schritt 9 und 3.1: Lieferant meldet Verfügbarkeit, **Versand** und Lieferung | Keine Versandmeldung im Modell | Nachricht „Versand gemeldet“ beim Warten auf Zustellung ergänzen (nicht unterbrechend, setzt den Status) |
| B | Abschnitt 4, Schritt 12: Ergebnis wird dem Kunden angezeigt | „Übergeben: Grenzfall“, „Erfolglos: Lieferant antwortet nicht“ und „Übergeben: Lieferabweichung offen“ benachrichtigen den Kunden nicht | Auch diese Enden als Nachrichten-Endereignis an die App |
| C | Abschnitt 5: Kunde verschiebt → keine Bestellung, Reichweitenrisiko zeigen | Aufschub endet wie eine Ablehnung als *Erfolglos abgeschlossen* | Aufschub → „Nächste Prüfung terminieren“ mit kürzerer Frist |
| C | Abschnitt 5: Preisgrenze überschritten → Freigabe mit Mehrkosten **oder alternative Auswahl**; Abschnitt 9: Preisgrenze je Testprodukt hinterlegt | Grenze 40 EUR global in der Regel-Tabelle, Kunde kann nur die Menge ändern | Preisgrenze ins Versorgungsprofil; in der Entscheidung Ersatzprodukt oder Alternativlieferant anbieten |

Offen ist außerdem, wer die nächste Prüfung startet. „Nächste Prüfung terminieren“ berechnet nur ein Datum. Den Start übernimmt ein simulierter „Prüfplaner“, den es nirgends gibt. Ein Timer-Startereignis wäre die Alternative.

## DMN-Tabellen

Beide Tabellen funktionieren. Zu ändern sind Kennzeichnung und Zuschnitt.

- **B – Projektannahmen kennzeichnen:** Teamauftrag 6.1 verlangt für jede Fachregel eine Quelle oder die Kennzeichnung „Projektannahme“. Betroffen sind die 40-EUR-Grenze, die Schwelle für den Verbrauchssprung (30 %) und alle Fristen. In beiden Tabellen eine Annotationsspalte „Quelle“ ergänzen.
- **C – Versorgungsprofil aufteilen:** 21 Ausgaben in einer Tabelle sind eher eine Konfigurationsliste als eine Entscheidung. Produktdaten (Packung, Zielbestand, Preis) und Fristen in zwei Tabellen trennen. Dann lässt sich jede Seite einzeln erklären und ändern.
- **C – Preis des Ersatzprodukts:** Das Profil hat keinen eigenen Preis für das Ersatzprodukt. Nach „nicht lieferbar“ wird mit dem Preis des Originals gerechnet. `stueckpreisErsatz` ergänzen.
- **C – Gültigkeit der Freigabe:** `freigabeGueltigBis` wird an die Kundenentscheidung übergeben, aber nirgends geprüft. Entweder prüfen oder entfernen.

## Testlauf auf CIB seven

Die vier Dateien lassen sich auf CIB seven 2.2 deployen, und die Leitgeschichte läuft wie in der README beschrieben. A1 und A4 ließen sich auf der Engine nachstellen. Die Dienste liefen mit dem unveränderten `handlers.js` aus dem Repo, aufgerufen aus dem Browser statt über Node.

| Fall | Ergebnis |
| --- | --- |
| Leitgeschichte (TP-SCHNELL, Bestand 20) | Wie erwartet: 54 EUR → Kundenfreigabe, 1× nachgefasst, Bestand 140, *Erfolgreich abgeschlossen* |
| Nicht lieferbar (TP-HS, Bestand 50) | Korrekt: Wechsel auf das Ersatzprodukt, danach Kundenfreigabe |
| Bestätigung während des Nachfassens (A1) | **Fehler bestätigt:** Token liegt bei „Nachfassen“, kein Nachrichten-Abo aktiv, CIB seven antwortet HTTP 400 `MismatchingMessageCorrelationException`. Die Nachricht ist verloren |
| Zweite Bestandsmeldung für TP-HS (A4) | **Fehler bestätigt:** zweite Instanz bestellt automatisch, während die erste noch auf die Kundenfreigabe wartet |

Nicht getestet: A3, weil die Fristen dort Tage dauern, sowie Teillieferung und Klärungswege. Zwei Testinstanzen für TP-HS laufen noch im Cockpit und können dort gelöscht werden.

## Fundstellen je Modell

Die Tabellen nennen die Elemente so, wie sie im Camunda Modeler beschriftet sind. Mit Cmd+F findet der Modeler ein Element über seinen Namen. Unbeschriftete XOR-Rauten werden über das nachfolgende Element beschrieben.

### T2\_Materialversorgung.bpmn

| Punkt | Wo im Modell | Worauf achten |
| --- | --- | --- |
| A1 | Ereignisbasiertes Gateway „Antwort des Lieferanten?“ → Timer „Bestätigungsfrist abgelaufen“ → Gateway „Nachfassen noch möglich?“ → „Beim Lieferanten nachfassen (über Team 3)“ → zurück | Solange das Token beim Nachfassen liegt, wartet kein Ereignis auf „Bestellung bestätigt“ oder „Nicht lieferbar gemeldet“ |
| A1 | „Bestellung bestätigt“ → Empfangsaufgabe „Auf Zustellmeldung warten“ | Danach kein Weg mehr für „nicht lieferbar“; eine Zustellmeldung vor der Bestätigung geht verloren |
| A2 | Gateway „Nachfassen noch möglich?“, Fluss „ja“ (Bedingung `anzahlNachfassen < maxNachfassen`) | Kein Listener am Fluss zählt hoch; gezählt wird nur in `simulator/handlers.js`, Topic `t3-nachfassen` |
| A3 | Benutzeraufgabe „Lieferung prüfen und bestätigen“ | Nur der gestrichelte Timer „Erinnerung fällig“ (3×), kein unterbrechender Timer |
| A3 | „Grenzfall prüfen“, „Ausbleibende Lieferantenantwort klären“, „Lieferabweichung klären“ (Lane Menschliche Prüfstelle) | Kein Timer am Rand |
| A4 | Die drei Startereignisse ganz links → „Vorgang eröffnen“ | Keine Prüfung auf einen laufenden Vorgang für dasselbe Produkt |
| B1 | „Aktuellen Bestand melden“ mit „Erinnerung fällig“ (gestrichelt) und „Meldefrist abgelaufen“; „Auf Zustellmeldung warten“ mit „Lieferfrist überschritten“ und „Lieferung endgültig ausgeblieben“ | Unterbrechender Timer bricht nur die Aufgabe ab, nicht schon gestartete Erinnerungs- oder Mahn-Token |
| Regel 2 | Ganzes Diagramm | 21 Aktivitäten auf einer Ebene |
| Regel 10–12 | Call Activity „Kundenentscheidung einholen“ → Gateway „Entscheidung des Kunden?“ | 3 Ausgänge, einer davon Sammel-Default „abgelehnt, Aufschub, keine Antwort“ |
| Regel 19 | Unbeschriftete XOR-Rauten direkt vor: „Vorgang eröffnen“, „Verbrauch und Reichweite berechnen“, „Produkt, Menge und Lieferant vorschlagen“, „Abweichungen prüfen“, „Kundenentscheidung einholen“, „Bestellung simuliert übermitteln“, „Auf Zustellmeldung warten“, „Lieferabweichung klären“, „Bestand und Verbrauch fortschreiben“ | Zusammenführende XOR vor einer Aufgabe |
| Regel 7 | Endereignisse „An Bestandsmeldung erinnert“, „An Lieferbestätigung erinnert“, „Mahnung versandt“ | Sehen aus wie Endzustände des Vorgangs |
| Regel 13–15 | Gestrichelte Nachrichtenpfeile zu den Pools App, Lieferant, Team 3, Team 1 | Nur „Bestellung“ und „Liefernachweis“ sind beschriftet |
| Lanes | Alle Benutzeraufgaben, Eigenschaften → User assignment | Überall `assignee = demo` |
| Technik | Alle Service- und Sendeaufgaben, Eigenschaften → Implementation | Typ External mit Topic `t2-…`/`t3-…`/`t1-…` |
| Teillieferung | Gateway „Klärungsergebnis?“, Fluss „Teilmenge übernehmen“ | Führt zum Ende „Kunde informiert: Lieferung bestätigt“ (Erfolgreich abgeschlossen) |
| Versand | Um „Auf Zustellmeldung warten“ | Keine Nachricht „Versand gemeldet“ |
| Enden ohne Info | „Übergeben: Grenzfall nicht lösbar“, „Erfolglos: Lieferant antwortet nicht“, „Übergeben: Lieferabweichung offen“ | Einfache Endereignisse, kein Nachrichtenpfeil zur App |
| Aufschub | Gateway „Entscheidung des Kunden?“ → „Kunde informiert: keine Bestellung“ | Aufschub landet im Default wie Ablehnung |
| Nächste Prüfung | „Nächste Prüfung terminieren“ → „Kunde informiert: kein Bedarf“ | Berechnet nur ein Datum, nichts startet später den Vorgang |

### T2\_Kundenentscheidung\_einholen.bpmn

| Punkt | Wo im Modell | Worauf achten |
| --- | --- | --- |
| Regel 10–12 | Einziges Ende „Entscheidung dokumentiert“ | 5 mögliche Ergebnisse, aber nur 1 Endereignis |
| Regel 19 | Unbeschriftete XOR-Raute vor „Entscheidung dokumentiert“ | Zusammenführende XOR vor einem Endereignis |
| B1 / Regel 7 | „Über Freigabe entscheiden“ mit „Erinnerung fällig“ und „Entscheidungsfrist abgelaufen“; Ende „An offene Freigabe erinnert“ | Gleiches Muster wie oben |
| Pools | Pool „Aufrufender Prozess (Team 1, 2 oder 3) per Call Activity“ | Ohne Nachrichtenfluss |
| DMN C | Formular von „Über Freigabe entscheiden“, Feld `freigabeGueltigBis` | Wird angezeigt, aber nirgends geprüft |

### DMN-Tabellen und Simulator

| Datei | Wo | Worauf achten |
| --- | --- | --- |
| `T2_Berechtigungsregel.dmn` | Regeln 3 und 4 (`<= 40`, `> 40`) | Keine Spalte „Quelle“ bzw. „Projektannahme“ |
| `T2_Versorgungsprofil.dmn` | Ganze Tabelle | 21 Ausgabespalten; kein Preis für das Ersatzprodukt |
| `simulator/handlers.js` | `t3-nachfassen` | Zähler für A2 |
| `simulator/handlers.js` | `t2-abweichungen-pruefen`, Zeile mit `stueckpreis` | Ersatzprodukt wird mit dem Originalpreis gerechnet |

## Vorschlag für Samstag

Zuerst die Technik und die Hierarchie entscheiden, denn beides bestimmt, wie jede einzelne Korrektur aussieht.

1. **Vorgaben klären:** Hat jemand die aktuellen Bewertungskriterien von Semesterbeginn? Gelten Quarkus, ActiveMQ, Camel und Esper wieder als Pflicht? Falls unklar: Stiehl vor dem Umbau per Mail fragen, ob External Tasks zulässig sind.
2. **Oberste Ebene festlegen (Stilregel 2):** die etwa 5 Teilprozesse und ihre Endzustände. Die Fixes zu A1, A3 und B1 werden in Teilprozessen deutlich einfacher, weil ein Timer am Teilprozess alles darin abbricht.
3. **A1 bis A4 durchgehen** und je Punkt die Änderung beschließen.
4. **Fachliche Entscheidungen treffen:** Teillieferung, Aufschub, Preisgrenze, Start der nächsten Prüfung.
5. **Code-Verantwortung aufteilen**, zum Beispiel je eine Person für Prozessmodell und DMN, Quarkus-Dienste, Camel/ActiveMQ und Esper. Jeder muss am Ende alles erklären können.
6. **Mit Team 1 und 3** Queue- und Nachrichtennamen sowie die Kennungen abstimmen (offene Punkte der README).

- [ ] Aktuelle Bewertungskriterien besorgen
- [ ] Struktur der obersten Ebene beschließen
- [ ] A1–A4 entschieden
- [ ] Aufteilung der Code-Anteile festgelegt
