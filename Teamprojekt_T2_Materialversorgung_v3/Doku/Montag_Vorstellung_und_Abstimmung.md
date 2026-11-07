# Montag: Vorstellung und Abstimmung mit Team 1 und Team 3

Stand 7. November 2026. Grundlage: Projekthandbuch (Kapitel 7, 8, 16), Integrationspaket (Kapitel 3, 4, Vorlagen A und J), Teamauftrag 2, Amars Review.

## 1. Ablauf am Montag

| Wann | Was | Wer |
|---|---|---|
| vorher (Sonntag) | Modell v3 gemeinsam durchgehen, Rollen festlegen (Vorlage A), Probelauf der Vorstellung mit Stoppuhr | alle 4 |
| Vorstellung | BPMN-Modell zeigen (ca. 8 Minuten) | alle 4, eine Person bedient den Modeler |
| danach | Abstimmung mit Team 1 und 3 (Abschnitt 3) | Integrationsperson führt, alle notieren |
| Ende | Fragen an Prof. Stiehl (Abschnitt 4) | wer die Rolle Prozess hat |

## 2. Vorstellung zu viert

**Grundsatz:** Jede Person stellt einen Teilprozess vor. So sieht man, dass alle das ganze Modell verstehen (Stiehls Vorgabe: jeder muss alles erklären können). Eine Person bedient den Camunda Modeler, die anderen sprechen.

| Person | Teil | Kernaussagen (je ca. 2 Minuten) |
|---|---|---|
| 1 | **Einstieg und oberste Ebene, Teilprozess 1 „Bedarf ermitteln“** | Ziel: Material geht nicht aus. Pools: App, Lieferant, Team 1, Team 3. Oberste Ebene hat 9 Aktivitäten, Teilprozesse aufklappbar (Stilregel 2). 3 Auslöser. Doppelte Vorgänge werden erkannt. Profil und Fristen aus DMN, Bestand fehlt: erinnern, erneut anfragen, sonst Abbruch. Reichweite gegen Prüfung + Lieferzeit. |
| 2 | **Teilprozess 2 „Bestellung vorschlagen und freigeben“ und gemeinsame Funktion** | Vorschlag auf ganze Packungen, Abweichungen (Preis, Produkt, Lieferant, Verbrauch). Berechtigungsregel als DMN: automatisch bis zur Preisgrenze, sonst Kunde, unklare Fälle Prüfstelle. Kundenentscheidung als gemeinsame Funktion für alle Teams, 5 Ergebnisse, keine Antwort ist nie Freigabe. |
| 3 | **Teilprozess 3 „Bestellung abwickeln“** | Bestellung simuliert. Warten auf Bestätigung mit nicht unterbrechendem Timer: Nachfassen über Team 3, während das Warten aktiv bleibt (Fehler aus dem Review behoben). Nicht lieferbar oder Alternativlieferant: neue Auswahl. Endgültige Frist: Prüfstelle. |
| 4 | **Teilprozess 4 „Lieferung überwachen und prüfen“, Abschluss, Ausblick** | Versand, Zustellung, Mahnen über Team 3. Kunde bestätigt die Lieferung, sonst nie automatisch erfolgreich. Abweichung: erfassen, Lieferant informieren, klären. Bestand fortschreiben, Nachweis an Team 1. Ausblick: Technikfrage, Abstimmung mit Team 1 und 3, Test auf CIB seven. |

**Tipps für die Vorstellung**
- Mit der obersten Ebene beginnen und erst dann aufklappen. Nicht in jedes Detail gehen, sondern pro Teilprozess den Normalfall und eine Ausnahme zeigen.
- Begriffe aus Stiehls Folien benutzen: Label-Matching, nicht unterbrechendes Ereignis, Call Activity, Fachprozess und Integration (orange).
- Offen sagen, was noch fehlt: Technik (Java/Quarkus/Camel?), Abstimmung mit den anderen Teams, Test auf der Engine. Das zeigt, dass ihr den Stand kennt.
- Camunda Modeler vorher öffnen, beide Dateien in Tabs, Fenster groß, rechtes Panel zu. Nichts speichern.
- Falls der Beamer schlecht ist: die Bilder aus `bilder/` als Rückfall bereithalten.

## 3. Abstimmung mit Team 1 und Team 3

Das Handbuch verlangt diese Punkte zu Beginn (Kapitel 8.1 und 16). Ziel für Montag: **erste Vorschläge austauschen und Verantwortliche festlegen**, nicht alles fertig entscheiden.

### 3.1 Organisation

| Punkt | Unser Vorschlag | Entscheiden |
|---|---|---|
| Integrationskreis | je Team eine Person, kurzer Termin pro Woche | Personen benennen |
| Gemeinsames Repo | neue GitHub-Organisation, ein Repo, Struktur nach Integrationspaket 4.2 (Abschnitt 5) | wer legt an, wer ist Admin |
| Entscheidungsprotokoll | `docs/entscheidungen/` im gemeinsamen Repo, ein Eintrag pro Entscheidung | Format bestätigen |
| Aufgabenbrett | GitHub Projects mit Spalten Eingang, Bereit, In Arbeit, Blockiert, Erledigt | ja/nein |
| Rhythmus | Wochenstatus (Vorlage B), gemeinsamer Probelauf alle 2 Wochen | Termin |

### 3.2 Gemeinsame Begriffe und Kennungen

| Punkt | Unser Vorschlag |
|---|---|
| Kennung Pflegehaushalt | `PH-0001` (Testhaushalt) |
| Kennung Vorgang | `VG-T<Team>-<Nummer>`, wird als Business Key der Prozessinstanz gesetzt |
| Kennung Dokument | `DK-<Nummer>` (vergibt Team 1) |
| Vorgangszustände | genau die 11 aus Projekthandbuch 7.2, als Variable `vorgangsstatus` |
| Ereignisse | die Namen aus Handbuch 7.3 als Variable `letztesEreignis` |
| Nachrichtenformat | jede Nachricht mit `pflegehaushaltId`, `vorgangId`, Zeitpunkt, Absender, Inhalt, Fehlerantwort (Teamauftrag 7) |
| Namen | Prozess-IDs `T1_…`, `T2_…`, `T3_…`; Nachrichten bzw. Queues nach Stiehls Schema `Sender_Nachricht_Empfänger` |

### 3.3 Schnittstellen von Team 2

| Mit | Was | Frage an das Team |
|---|---|---|
| Team 1 | wir übergeben den **Liefernachweis** (`t1-nachweis-uebergeben`) | Welche Felder braucht ihr? Bekommen wir eine Dokument-ID zurück? |
| Team 1 | wir nutzen **Vorgang eröffnen** und die Vorgangsübersicht | Wer vergibt die Vorgangskennung? Gibt es eine Abfrage „läuft schon ein Vorgang?“ |
| Team 1 | Prüfplaner | Startet die App bzw. Team 1 die nächste Bestandsprüfung zum Termin? |
| Team 3 | wir nutzen **Nachfassen**, **Mahnen**, **Gegenstelle kontaktieren** | Bietet ihr das als Dienst oder als Teilprozess an? Welche Rückmeldung gibt es (gesendet, Antwort, Frist)? |
| Team 3 | Lieferantenantworten | Kommen Bestätigung, Versand, Zustellung, nicht lieferbar über euch oder direkt zu uns? |
| alle | wir bieten **Kundenentscheidung einholen**, **Benachrichtigung**, **Berechtigungsprüfung** an | Wollt ihr die nutzen? Reichen die Ergebnisse? |

**Achtung beim Freigabe-Teilprozess:** Das Handbuch (7.4) nennt als Ergebnis „freigegeben, abgelehnt oder zur Änderung zurückgegeben“. Wir haben zusätzlich „Aufgeschoben“ und „Keine Antwort“. Das müssen die anderen Teams bestätigen.

**Achtung bei Team 3:** Laut Handbuch 7.4 sind „Gegenstelle kontaktieren“, „Auf Antwort warten“ und „Nachfassen“ wiederverwendbare Teilprozesse. Wahrscheinlich liefert Team 3 diese. Dann ersetzen wir unsere Topics `t3-…` durch deren Teilprozess oder Dienst.

### 3.4 Technik

Gemeinsam festlegen, bevor jemand Code schreibt: External Tasks (bei uns jetzt) oder Java 17, Quarkus, ActiveMQ, Camel, Esper (Vorgaben WS 25/26). Gemeinsame lokale Startanleitung (Integrationspaket 4.1).

## 4. Fragen an Prof. Stiehl

1. Gelten dieses Semester wieder Quarkus, ActiveMQ, Camel und Esper als Pflicht, oder sind External Tasks erlaubt?
2. Gibt es die aktuellen Bewertungskriterien schriftlich?
3. Sollen Lanes zusätzlich zu Kandidatengruppen modelliert werden?
4. Wie detailliert soll das Modell zum nächsten Termin sein (oberste Ebene oder ausführbar)?

## 5. Gemeinsames Git-Projekt anlegen (Schritt für Schritt)

1. Eine Person legt auf GitHub eine **Organisation** an (z. B. `pflege-backoffice-mvp`, kostenlos). Je Team eine Person wird Owner.
2. Repo `pflege-backoffice-mvp` anlegen, **privat** bis zur Veröffentlichung, mit `README.md` und **MIT-Lizenz** (beim Anlegen „Add a license: MIT“ wählen).
3. Struktur nach Integrationspaket 4.2 anlegen:
   ```
   LICENSE
   README.md
   docs/entscheidungen/
   docs/schnittstellen/
   docs/architektur/
   prozesse/team1/  prozesse/team2/  prozesse/team3/
   anwendung/
   testdaten/
   tests/integration/
   lizenzen/
   ```
4. Alle 12 Personen einladen (Settings, Collaborators bzw. Teams in der Organisation).
5. Regel für `main`: Änderungen nur über Pull Request mit einem Review (Settings, Branches, Branch protection).
6. Unseren Ordner `Teamprojekt_T2_Materialversorgung_v3` nach `prozesse/team2/` übernehmen. Amars Repo bleibt unser Team-Lernrepo und wird auf privat gestellt.
7. Für Claude: Damit Claude direkt pushen kann, die Claude-GitHub-App für die neue Organisation installieren (github.com/apps/claude).

**Vorlage Entscheidungsprotokoll** (`docs/entscheidungen/0001-titel.md`)

```markdown
# 0001 Titel der Entscheidung
Datum: 2026-11-09 · Betroffene Teams: 1, 2, 3 · Status: vorgeschlagen | beschlossen
## Entscheidung
## Begründung
## Offene Folgen
```

## 6. Checkliste bis Montag

- [ ] Modell v3 gemeinsam durchgehen, offene Entscheidungen aus der README besprechen
- [ ] Rollen festlegen (Prozess und Fachlichkeit, Technische Umsetzung, Integration, Test und Dokumentation) und Vorlage A ausfüllen
- [ ] Integrationsperson benennen
- [ ] Aufteilung der Vorstellung festlegen und einmal proben
- [ ] Camunda Modeler auf dem Vorführ-Laptop testen
- [ ] Amars Repo auf privat stellen (nur Amar kann das)
- [ ] Vorschläge aus Abschnitt 3 ausdrucken oder auf dem Handy bereithalten
