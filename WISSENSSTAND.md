# Wissensstand – Team 2 (Materialversorgung)

Laufende Mitschrift für unser DPE-Projekt bei Prof. Stiehl. Ziel: Jeder von uns vieren kann am Ende zu JEDEM Teil des Projekts Rückfragen beantworten – egal ob zu einer Code-Zeile, einem BPMN-Modell oder dem Token-Verhalten bei einem bestimmten Event. Diese Datei ist das Gedächtnis dafür.

## Wie wir diese Datei pflegen

- **Ein neuer Abschnitt pro Woche**, direkt nach dem Wochenend-Review eingetragen (bevor nach `main` gemergt wird).
- **Nichts löschen, nur ergänzen** – alte Einträge bleiben stehen, auch wenn sich später was ändert (dann als "Update" in der aktuellen Woche vermerken, nicht die alte Zeile überschreiben).
- **Immer das Warum, nicht nur das Was.** "E28 nutzt ein inklusives Gateway" reicht nicht – dazu, warum nicht exklusiv/parallel, und was mit dem Token passiert, wenn nur ein Pfad durchläuft.
- **Verständlich für alle vier**, nicht nur für die Person, die es gebaut hat. Prof. Stiehl kann jeden von uns zu jedem Teil fragen, nicht nur den "Zuständigen".
- **Jeder Eintrag mit Kürzel/Name**, wer das geschrieben bzw. modelliert hat – nicht aus Kontrolle, sondern damit man bei Rückfragen weiß, wen man fragen kann.
- **Branch-Infos mit aufnehmen**: auf welchem Branch etwas entstanden ist, ob/wann es nach `main` gemerged wurde.
- **Offene Fragen immer mit aufschreiben**, auch wenn sie noch ungeklärt sind – besser eine Frage dokumentiert als am Montag überrascht zu werden.
- **Technische Begriffe kurz erklären**, so dass man beim späteren Nachlesen (auch Wochen danach) nicht erst wieder nachschlagen muss, was z. B. ein "Ereignisbasiertes Gateway" oder "Call-by-Reference" bedeutet.

## Was in jeden Wochen-Abschnitt gehört

1. **Datum / Woche** + wer anwesend war
2. **Vorlesungsinhalte dieser Woche** – welche Folien/Themen wurden behandelt (mit Foliennummer, falls möglich)
3. **Neue oder geänderte Modelle/Code** – Dateiname, Zweck, auf welchem Branch, Status (Entwurf / im Review / gemerged)
4. **Wichtige Konzepte dahinter** – alles, was bei einer Rückfrage erklärt werden müsste (z. B. Token-Semantik, Gateway-Verhalten, Fehler-/Eskalationslogik, warum ein Teilprozess ausgelagert wurde)
5. **Entscheidungen & Begründung** – wo wir zwischen Alternativen gewählt haben und warum
6. **Offene Fragen / noch zu klären**
7. **Nächste Schritte** für die kommende Woche

---

## Woche 0 – Stand vor Projektbeginn (bis 2. November 2026)

**Anwesend/Beteiligt:** gesamtes Team 2

**Vorlesungsinhalte bisher:** BPMN Einführung, Advanced BPMN, BPMN Best Practices (Themen 00–03), jeweils montags 9:55–13:05 Uhr.

**Modelle/Ergebnisse:**
- 44 BPMN-Demos + 1 DMN-Entscheidungstabelle aus den Foliensätzen nachgebaut und in CIB seven importiert/getestet (Kategorien: E = Einführung, A = Advanced, L = Listener/Variablen, C = CIB-seven-Services/Messaging/Eventing)
- Liegen im Repo unter `BPMN_Demos_aus_Folien/`, Status: fertig modelliert und per REST getestet, NICHT Teil des eigentlichen Teamprojekts (nur Lernbegleitung/Übung)
- Branch: direkt auf `main` (vor Einführung der Branch-Konvention)

**Wichtige Konzepte (Beispiele, die abgefragt werden könnten):**
- ODER-Join (inklusives Gateway, Demo E28): öffnet nur korrekt, wenn die Reihenfolge der eingehenden Pfade stimmt – Eigenheit der CIB-seven-Engine, nicht allgemeines BPMN-Verhalten
- (weitere Konzepte aus den Demos: siehe `BPMN_Demos_aus_Folien/ERKLAERUNGEN.md` – dort stehen Stichpunkt-Erklärungen zu jeder einzelnen Demo)

**Entscheidungen & Begründung:**
- Originalunterlagen (Foliensätze als PDF, fremde Unterlagen) bewusst NICHT ins Repo gelegt (Urheberrecht, Dateigröße) – nur die eigenen Arbeitsergebnisse und die Kickoff-Dokumente von Prof. Stiehl

**Offene Fragen / noch zu klären:**
- Aktuelle Projektvorgaben/Bewertungskriterien für dieses Semester noch aus Moodle holen (bisher liegt nur die Fassung WS 25/26 eines Kommilitonen vor)
- C03 (REST Order Quarkus) und C05 (Messaging ActiveMQ) brauchen noch den Order-Service bzw. eine laufende ActiveMQ-Instanz zum vollständigen Testen

**Nächste Schritte:**
- Branch-Konvention `feature/<name>/<thema>` ab jetzt nutzen
- Mit Phase 0 des eigentlichen Teamprojekts (Materialversorgung) laut Arbeitsauftrag starten
- Erste eigene Modellierung(en) fürs Teamprojekt für das kommende Wochenend-Review vorbereiten

---

## Woche 1 – [Datum einfügen]

**Anwesend:**

**Vorlesungsinhalte dieser Woche:**

**Neue/geänderte Modelle:**

**Wichtige Konzepte dahinter:**

**Entscheidungen & Begründung:**

**Offene Fragen / noch zu klären:**

**Nächste Schritte:**
