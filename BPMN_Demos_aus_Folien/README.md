# BPMN-Demos aus den Folien (Einführung, Advanced BPMN, Listener und Variablen)

Erstellt von Claude am 1. November 2026 als **Lern- und Spielwiese** zu `05_BPMN_Einführung.pdf` und `06_Advanced_BPMN.pdf` (Dateien E.. und A..) sowie zu den Foliensätzen `03_CallByRef-CallByValue`, `04_Sichtbarkeit_von_Variablen` und `08b_Kollaborative_Prozesse` aus den Unterlagen des Vorjahres (Dateien L..) sowie zu `02_CIB_seven`, `05b_Serviceaufrufe`, `06_Microservices`, `08a`, `09_Integration` und `10_Eventing` (Dateien C.., dazu `C06_Temperatur_Kritikalitaet.dmn`). **Kurze Erklärungen zu jeder Demo stehen in `ERKLAERUNGEN.md`.**
Die Originalfolien wurden nicht verändert. Alle Modelle sind **Nachbauten der Folienbeispiele (eigene Umsetzung)**, keine Dateien des Dozenten.

## Ehrlicher Prüfstand

- **Geprüft:** Alle 44 BPMN-Dateien wurden mit einem eigenen Prüfskript kontrolliert. Es prüft gültiges XML, eindeutige IDs, Verweise, Diagramm-Vollständigkeit und Erreichbarkeit sowie bekannte Camunda-7-Regeln (Bedingungen an Gateways, Implementierung von Service/Send Tasks, Nachrichten, Timer, Kompensation).
  - Ergebnis: 0 Fehler.
  - Jedes Diagramm wurde außerdem als Bild gerendert und mit der Folie verglichen.
- **Auf deinem CIB seven 2.2.0 getestet (1. November 2026, per REST über den Browser):**
  - Alle beim ersten Hochladen angenommenen Demos wurden durchgespielt. Dabei wurden Aufgaben erledigt, Nachrichten, Fehler und Eskalationen ausgelöst und Timer sofort ausgeführt.
  - Ergebnis: Alle verhalten sich wie in `ERKLAERUNGEN.md` beschrieben, einschließlich Kompensation (A23–A25), Listenern und Variablen-Scopes (L01–L05), JavaScript/Spin (L05) und HTTP-Connector (C02).
  - **C03** und **C05** brechen erwartungsgemäß mit `HTCL-02007 Unable to execute HTTP request` ab, solange der Order-Service (Port 8088) bzw. ActiveMQ (Port 8161) nicht läuft.
  - Beim ersten Hochladen abgelehnt und inzwischen korrigiert: E26, E28, E29, L06 (Reihenfolge im XML), A29 (CIB seven erlaubt kein normales Startereignis plus Timer-Start in einem Prozess) und die DMN-Datei (`camunda:historyTimeToLive` fehlte). Die Korrekturen müssen noch einmal hochgeladen und getestet werden.
- Alle Modelle sind für **Camunda 7** angelegt, wie in der Kursvorgabe (Modeler zeigt „Camunda 7.24“).

## So startest du (einmalig)

1. Docker Desktop starten. Der Container `cibseven` muss laufen. Prüfen: http://localhost:8080/webapp/ öffnet sich.
2. Terminal in diesem Ordner öffnen (Finder → Ordner → Rechtsklick → „Neues Terminal beim Ordner“).
3. `bash dpe-demo.sh check` → muss die Engine anzeigen.
4. `bash dpe-demo.sh deploy` → lädt alle 44 BPMN-Dateien und die DMN-Datei hoch. Erwartet: „Erfolgreich: 45“.
   - Alternative ohne Terminal: jede Datei im Camunda Modeler öffnen → Raketen-Symbol „Deploy“ → Endpoint `http://localhost:8080/engine-rest`.
5. Im Browser als **demo / demo** anmelden.
   - Alle Benutzeraufgaben sind dem Benutzer `demo` zugewiesen.
   - Starten: Tasklist → „Prozess starten“.
   - Zuschauen, wo das Token steht: Cockpit.

## Was die Tasklist nicht kann – dafür gibt es `dpe-demo.sh`

| Was | Befehl |
|---|---|
| offene Aufgaben mit ID anzeigen | `bash dpe-demo.sh tasks` |
| Nachricht schicken (Rolle des Partners / Service Providers spielen) | `bash dpe-demo.sh msg <Nachrichtenname> <instanzId>` |
| Fehler an einer Aufgabe werfen | `bash dpe-demo.sh error <taskId> <CODE>` |
| Eskalation an einer Aufgabe werfen | `bash dpe-demo.sh escalate <taskId> <CODE>` |
| sehen, wo eine Instanz steht | `bash dpe-demo.sh where <instanzId>` |
| hängende Instanz (Deadlock) löschen | `bash dpe-demo.sh abbrechen <instanzId>` |

## Listener-Demos (L01–L06) – das Wichtigste zuerst

- **L01 Call by Reference:** drei Wege zu lokalen Teilprozess-Variablen – Input Mapping, Execution Listener am Startereignis, Task Listener an der Benutzeraufgabe. Die Werte und Ausdrücke sind von den Folien übernommen.
- **L02 Call by Value:** In-/Out-Mapping an der Call Activity. Feld2 bleibt im Hauptprozess unverändert.
- **L03 Verschachtelte Teilprozesse:** Execution Listener mit `setVariableLocal` auf 4 Ebenen plus Output Mappings. Beantwortet die Folienfragen „In welchem Scope landet die Variable?“.
- **L04 Executions:** globale und lokale Variablen auf parallelen Executions, dazu eine Task-lokale Variable, die eine globale überschattet.
- **L05 Kollaborative Prozesse:** JavaScript-Execution-Listener (end) und Nachrichtenkorrelation mit `processInstanceVariableEquals`. Den Bestellprozess 2x mit demselben Produkt starten.
  - Kleine Korrektur gegenüber Folie 11: Die Skriptvariable heißt `neueOrder` statt `order`, damit sie nicht mit der Prozessvariablen `order` kollidiert.
- **L06 Listener-Rundgang (eigene Ergänzung):** protokolliert, in welcher Reihenfolge die Listener feuern:
  - Execution Listener: start, end, take
  - Task Listener: create, assignment, complete, timeout, delete

**Wo du die Listener im Modeler findest:** Element anklicken → rechte Leiste → Bereich „Execution listeners“ bzw. „Task listeners“. Input-/Output-Mappings stehen unter „Inputs“/„Outputs“, die In/Out-Mappings der Call Activity unter „In mappings“/„Out mappings“.

**Hinweis zu den Vorlagen:** Die Dateien `Kollaborativer_Prozess_01/02.bpmn` im Ordner deines Kumpels weichen von den Folien ab:
- In 01 setzt das Listener-Skript die Variable `order` nicht.
- In 02 steht JavaScript im Feld für Ausdrücke (Expression) statt im Skriptfeld.

Für L05 habe ich deshalb die Folien als Vorlage genommen.

## C-Demos (C01–C06): Voraussetzungen

| Demo | läuft sofort? | braucht zusätzlich |
|---|---|---|
| C01 REST-API | ja | – (optional Postman) |
| C02 HTTP-Connector | ja, wenn der Docker-Container ins Internet darf | Internet (api.adviceslip.com) |
| C03 Order-Service | **nein** | eigener Quarkus-Order-Service auf Port 8088 (Code-Demo aus 06) |
| C04 Kollaborativ Einstieg | ja | – |
| C05 Messaging | **nein** | ActiveMQ Classic auf Port 8161 (admin/admin) |
| C06 Temperatur-Alert | ja (Start per `msg`) | für den echten Ablauf: Esper + Camel (Code-Demo aus 10) |

Wenn der HTTP-Connector oder JavaScript in deinem CIB seven fehlen sollte, zeigt sich das beim Ausführen als Incident im Cockpit. Dann bitte die Fehlermeldung schicken.

## Bewusste Abweichungen von den Folien (damit man damit spielen kann)

- **„(System-Simulation)“:** Einige Aufgaben sind auf der Folie automatische Service Tasks (Zahnrad). Hier sind sie Benutzeraufgaben, damit der Prozess dort wartet und du Zeit hast, Nachrichten, Fehler oder Eskalationen auszulösen.
- **Kürzere Zeiten:** Timer laufen in Sekunden oder Minuten statt Tagen. Die Originalangabe steht jeweils im Namen.
- **Nur Ansicht (`isExecutable=false`):** Diese Elemente kann Camunda 7 / CIB seven nicht ausführen:
  - Complex Gateway (E29 A)
  - Standard-Schleifenmarker (E26 C)
  - Ad-hoc-Teilprozess (A26)
  - instanziierende ereignisbasierte Gateways (A29 B/C)

  Wo es sinnvoll ist, liegt daneben eine ausführbare Alternative.
- **Kleine Ergänzungen:** End-Ereignisse und Nachrichten-Endereignisse sind ergänzt, wo die Folie nur einen Ausschnitt zeigt. Das Beispiel E19 sendet echte Nachrichten zwischen den Pools.
- **Notizen:** Sätze wie „laut Notizen“ beziehen sich auf die handschriftlichen Notizen eines Kommilitonen aus dem Vorjahr. Sie sind **nicht** als Aussagen des Dozenten belegt.

## Übersicht aller Dateien

| Datei | Folie | Prozess-Keys |
|---|---|---|
| `E06_Investitionsfreigabe.bpmn` | Einführung F. 6 | `E06_InvestmentApproval` |
| `E19_Orchestrierung_Kollaboration.bpmn` | Einführung F. 19 | `E19_Pool2`, `E19_Pool1`, `E19_PoolMitLanes` |
| `E20_E21_Token_Semantik.bpmn` | Einführung F. 20–21 | `E20_Token`, `E21_Token` |
| `E23_Datenobjekte_CallActivity.bpmn` | Einführung F. 22–23 | `E23_MasterDataProcess`, `E23_MasterDataReview` |
| `E25_Datenobjekte_Eingebettet.bpmn` | Einführung F. 24–25 | `E25_MasterDataProcess` |
| `E26_Schleifen.bpmn` | Einführung F. 26 | `E26_A_PruefungVorher`, `E26_B_PruefungNachher`, `E26_C_StandardLoop` (nur Ansicht), `E26_D_Mehrfachinstanz`, `E26_E_Mehrfachinstanz` |
| `E27_Inklusives_Gateway_Tourist.bpmn` | Einführung F. 27 | `E27_TouristInfo` |
| `E28_Inklusives_Zusammenfuehren.bpmn` | Einführung F. 28 | `E28_InklusiverJoin` |
| `E29_Komplexes_Gateway.bpmn` | Einführung F. 29 | `E29_A_Original` (nur Ansicht), `E29_B_DreiVonFuenf` |
| `E30_E31_Default_und_Conditional_Flow.bpmn` | Einführung F. 30–31 | `E30_A_DefaultFlow`, `E30_B_DefaultFlow`, `E31_ConditionalFlow` |
| `E32_Was_ist_falsch_Deadlock.bpmn` | Einführung F. 32 | `E32_A_Deadlock`, `E32_B_Korrigiert` |
| `A04_Angeheftete_Ereignisse.bpmn` | Advanced F. 4 | `A04_BoundaryEvents` |
| `A05_Ereignis_Teilprozess.bpmn` | Advanced F. 5 | `A05_EventSubprocess` |
| `A08_Link_Ereignisse.bpmn` | Advanced F. 8–9 | `A08_A_Schleife`, `A08_B_Link` |
| `A10_A11_Parallelitaet_Deadlock.bpmn` | Advanced F. 10–11 | `A10_Parallel`, `A11_B_Deadlock`, `A11_C_Inklusiv` |
| `A12_Inklusives_Gateway_Default.bpmn` | Advanced F. 12 | `A12_A_Immer`, `A12_B_Default` |
| `A13_Nicht_unterbrechende_Ereignisse.bpmn` | Advanced F. 13 | `A13_A_AnAufgaben`, `A13_B_AmTeilprozess` |
| `A14_Parallel_Ereignis_Teilprozess.bpmn` | Advanced F. 14 | `A14_EventSubprocess` |
| `A15_Zusammenfuehren_mit_ODER.bpmn` | Advanced F. 15 | `A15_OderMerge` |
| `A16_Fehlerbehandlung.bpmn` | Advanced F. 16 | `A16_ErrorHandling` |
| `A17_Eskalation.bpmn` | Advanced F. 17 | `A17_Escalation` |
| `A18_Timeout_Ereignisbasiertes_Gateway.bpmn` | Advanced F. 18 | `A18_ServiceContract` |
| `A19_Timeout_unterbrechend.bpmn` | Advanced F. 19 | `A19_ServiceContract` |
| `A20_Timeout_nicht_unterbrechend.bpmn` | Advanced F. 20 | `A20_ServiceContract` |
| `A21_Timeout_Teilprozess.bpmn` | Advanced F. 21 | `A21_ServiceContract` |
| `A22_Timeout_Ereignis_Teilprozesse.bpmn` | Advanced F. 22 | `A22_ServiceContract` |
| `A23_Transaktion.bpmn` | Advanced F. 23 | `A23_ServiceContract` |
| `A24_Transaktion_extern_zurueckrollen.bpmn` | Advanced F. 24 | `A24_ServiceContract` |
| `A25_Kompensation_im_Teilprozess.bpmn` | Advanced F. 25 | `A25_ServiceContract` |
| `A26_AdHoc_Teilprozess.bpmn` | Advanced F. 26 | `A26_AdHoc` (nur Ansicht) |
| `A28_Gruppe_und_Datenspeicher.bpmn` | Advanced F. 28 | `A28_Kunde`, `A28_CustomerService` |
| `A29_Prozesse_starten.bpmn` | Advanced F. 29 | `A29_O_Original` (nur Ansicht), `A29_A_MehrereStarts`, `A29_B_EventGwExklusiv` (nur Ansicht), `A29_C_EventGwParallel` (nur Ansicht) |
| `L01_CallByReference_Listener.bpmn` | 03 CallByRef F. 6–19 | `L01_VarSichtbarkeitProzess1` |
| `L02_CallByValue_InOutMapping.bpmn` | 03 CallByValue F. 21–32 | `L02_VarSichtbarkeitProzess2`, `L02_VarSichtbarkeitUnterprozess2` |
| `L03_Verschachtelte_Teilprozesse_Sichtbarkeit.bpmn` | 04 Sichtbarkeit F. 9–21 | `L03_VerschachtelteTeilprozesse` |
| `L04_Executions_parallel_lokal.bpmn` | 04 Sichtbarkeit F. 3–8 | `L04_Executions` |
| `L05_Kollaborativ_Aggregator.bpmn` | 08b Kollaborative Prozesse F. 3–13 | `L05_Bestellprozess`, `L05_Aggregator` |
| `L06_Listener_Rundgang.bpmn` | eigene Ergänzung (Listener-Ereignisse) | `L06_ListenerRundgang` |
| `C01_REST_API_Investment_Approval.bpmn` | 02 CIB seven F. 14–21 | `investmentApprovalProcess_ProcessId` |
| `C02_HTTP_Connector_Advice.bpmn` | 05b Serviceaufrufe F. 3–11 | `advice-of-the-day` |
| `C03_REST_Order_Quarkus.bpmn` | 06 Microservices F. 53–60 | `order-process-quarkus` |
| `C04_Kollaborativ_Einstieg.bpmn` | 08a Kollaborative Prozesse F. 3–6 | `C04_Sender`, `C04_Empfaenger` |
| `C05_Messaging_ActiveMQ.bpmn` | 09 Integration F. 19–22 | `C05_SendToTargetSystems` |
| `C06_Eventing_Temperatur_Alert.bpmn` | 10 Eventing F. 31–39 | `C06_TemperatureAlertProcess` |

## Details und was du ausprobieren kannst

### E06_Investitionsfreigabe.bpmn  (Einführung F. 6)

- **Investment Approval Process** – Prozess-Key `E06_InvestmentApproval`
  - Folie 6 (Einführung). Antrag erfassen -> genehmigen -> bei Ja Bestellung anlegen, bei Nein zurück zum Antragsteller.
- Nachrichten: `E06_Investitionsantrag`

### E19_Orchestrierung_Kollaboration.bpmn  (Einführung F. 19)

- **Pool 2** – Prozess-Key `E19_Pool2`
  - Folie 19: Wird per Nachricht aus Pool 1 gestartet. Nach der User Task antwortet Pool 2 per Nachricht.
- **Pool 1** – Prozess-Key `E19_Pool1`
  - Folie 19: HIER STARTEN. Pool 1 schickt eine Nachricht an Pool 2 und wartet auf zwei Antworten.
- **Pool (mit Lanes)** – Prozess-Key `E19_PoolMitLanes`
  - Folie 19 rechts oben: ein Pool mit zwei Lanes (Rollen). Sequenzfluss darf Lane-Grenzen überqueren, aber nie Pool-Grenzen.
- Nachrichten: `E19_Anfrage`, `E19_Antwort`, `E19_Ergebnis`, `E19_LaneDemo`, `E19_LaneFertig`

### E20_E21_Token_Semantik.bpmn  (Einführung F. 20–21)

- **Folie 20: paralleles Zusammenführen** – Prozess-Key `E20_Token`
  - Folie 20: Das parallele Gateway wartet auf beide Token und führt sie zu EINEM zusammen -> Task 4 läuft 1x (Variable anzahlTask4 = 1).
- **Folie 21: exklusives Zusammenführen (Achtung!)** – Prozess-Key `E21_Token`
  - Folie 21: Das exklusive Gateway ist 'dumm' und lässt jedes ankommende Token sofort durch -> Task 4 läuft 2x (Variable anzahlTask4 = 2). Prüfe es im Cockpit unter Variablen/Historie.

### E23_Datenobjekte_CallActivity.bpmn  (Einführung F. 22–23)

- **Master Data Process** – Prozess-Key `E23_MasterDataProcess`
  - Folie 23 – HIER STARTEN. Die Call Activity ruft einen eigenständigen, wiederverwendbaren Prozess auf. Daten werden als KOPIE übergeben (camunda:in) und nur ausdrücklich zurückgegeben (camunda:out = korrigierterNachname). Ändert der Kindprozess 'nachname', bleibt der Wert im Elternprozess unverändert.
- **Master Data Review Process** – Prozess-Key `E23_MasterDataReview`
  - Folie 23 unten: aufgerufener (globaler) Teilprozess. Nicht direkt starten – er wird von der Call Activity aufgerufen.

### E25_Datenobjekte_Eingebettet.bpmn  (Einführung F. 24–25)

- **Master Data Process** – Prozess-Key `E25_MasterDataProcess`
  - Folien 24/25: Eingebetteter Teilprozess. Er sieht die Daten des Elternprozesses direkt (Call by Reference). Änderst du 'nachname' im Teilprozess, ist die Änderung danach auch im Elternprozess sichtbar. Nachteil laut Folie: eingebettete Teilprozesse sind nicht wiederverwendbar.

### E26_Schleifen.bpmn  (Einführung F. 26)

- **A: Schleife mit Prüfung VORHER (XOR)** – Prozess-Key `E26_A_PruefungVorher`
  - Folie 26 oben links: Das Gateway prüft VOR der Aufgabe. Ist 'fertig' schon beim Start true, wird 'Do Something' nie ausgeführt.
- **B: Schleife mit Prüfung NACHHER (XOR)** – Prozess-Key `E26_B_PruefungNachher`
  - Folie 26 oben rechts: Die Aufgabe läuft mindestens einmal, erst danach wird geprüft.
- **C: Standard-Schleifenmarker (nur Ansicht, in Camunda 7 nicht ausführbar)** – Prozess-Key `E26_C_StandardLoop` – *nur Ansicht*
  - Folie 26 Mitte links: Schleifenmarker an der Aktivität. Camunda 7 / CIB seven führen den Standard-Loop NICHT aus – deshalb hier nicht ausführbar. In der Praxis: Variante A oder B verwenden.
- **D: Mehrfachinstanz SEQUENZIELL (≡)** – Prozess-Key `E26_D_Mehrfachinstanz`
  - Folie 26: Die Aufgabe wird für jedes Element einer Liste ausgeführt – nacheinander (Instanz 2 erscheint erst nach Abschluss von Instanz 1). Vereinfachung: Statt einer echten Liste wird hier fest 3x ausgeführt (loopCardinality).
- **E: Mehrfachinstanz PARALLEL (|||)** – Prozess-Key `E26_E_Mehrfachinstanz`
  - Folie 26: Die Aufgabe wird für jedes Element einer Liste ausgeführt – gleichzeitig (alle 3 Aufgaben stehen sofort in der Tasklist). Vereinfachung: Statt einer echten Liste wird hier fest 3x ausgeführt (loopCardinality).

### E27_Inklusives_Gateway_Tourist.bpmn  (Einführung F. 27)

- **Touristen-Information** – Prozess-Key `E27_TouristInfo`
  - Folie 27: Das inklusive (ODER-)Gateway nimmt JEDEN Pfad, dessen Bedingung wahr ist (1 bis 5 Pfade). Das zusammenführende ODER-Gateway wartet genau auf diese Pfade. Mindestens eine Option ankreuzen!
- Nachrichten: `E27_Antwort`, `E27_TouristenAnfrage`

### E28_Inklusives_Zusammenfuehren.bpmn  (Einführung F. 28)

- **Inclusive Join** – Prozess-Key `E28_InklusiverJoin`
  - Folie 28: Wann läuft es am zusammenführenden ODER-Gateway weiter? Es wartet nur auf Token, die noch ankommen KÖNNEN. Probiere: Option 1 + Option 2 wählen, dann bei 'Do Something 2' die zweite Frage mit NEIN beantworten -> das Token endet in End 2 und das ODER-Gateway lässt das Token von oben weiter.

### E29_Komplexes_Gateway.bpmn  (Einführung F. 29)

- **A: Original der Folie (Complex Gateway – nur Ansicht)** – Prozess-Key `E29_A_Original` – *nur Ansicht*
  - Folie 29: Das komplexe Gateway läuft weiter, sobald 3 von 5 Antworten da sind. Camunda 7 / CIB seven unterstützen das Complex Gateway NICHT – deshalb nur zur Ansicht. Ausführbare Alternative: Pool B.
- **B: Ausführbare Alternative – Mehrfachinstanz mit Abschlussbedingung** – Prozess-Key `E29_B_DreiVonFuenf`
  - Ausführbarer Ersatz für Folie 29: Der Teilprozess läuft 5x parallel (je Person einmal). Abschlussbedingung: ${nrOfCompletedInstances >= 3}. Sobald du 3 der 5 Aufgaben 'Antwort erfassen' erledigt hast, werden die 2 übrigen automatisch abgebrochen und 'Decide Based on Responses' erscheint.
- Nachrichten: `E29_Antwort`

### E30_E31_Default_und_Conditional_Flow.bpmn  (Einführung F. 30–31)

- **A: XOR mit Marker (X) und Default Flow – Folie 30 links** – Prozess-Key `E30_A_DefaultFlow`
  - Folie 30: Genau EIN Pfad wird genommen. Trifft keine Bedingung zu, greift der Default Flow (Schrägstrich) -> Task 4. Ohne Default Flow würde der Prozess mit einem Fehler stehen bleiben.
- **B: XOR ohne Marker (gleiche Bedeutung, laut Notizen nicht verwenden) – Folie 30 rechts** – Prozess-Key `E30_B_DefaultFlow`
  - Folie 30: Genau EIN Pfad wird genommen. Trifft keine Bedingung zu, greift der Default Flow (Schrägstrich) -> Task 4. Ohne Default Flow würde der Prozess mit einem Fehler stehen bleiben.
- **C: Conditional Flow direkt an der Aufgabe – Folie 31** – Prozess-Key `E31_ConditionalFlow`
  - Folie 31: Bedingte Flüsse direkt an der Aufgabe (kleine Raute). Verhalten wie ein INKLUSIVES Gateway: jeder Fluss mit wahrer Bedingung wird genommen. Laut Notizen in der Vorlesung nicht verwenden. Hier sind die Bedingungen überschneidungsfrei; Task 4 ist der Default Flow.

### E32_Was_ist_falsch_Deadlock.bpmn  (Einführung F. 32)

- **A: Modell der Folie (DEADLOCK)** – Prozess-Key `E32_A_Deadlock`
  - Folie 32: Fehler! Das erste parallele Gateway hat 2 eingehende Pfeile (von 'Enter Change Order' und von der Schleife). Ein paralleles Gateway wartet auf ALLE eingehenden Token – das Schleifen-Token kommt am Anfang nie -> Deadlock. Im Cockpit siehst du: die Instanz hängt dauerhaft vor dem Gateway.
- **B: Korrigierte Version** – Prozess-Key `E32_B_Korrigiert`
  - Korrektur: Zuerst ein EXKLUSIVES Gateway zum Zusammenführen (Anfang + Schleife), danach das parallele Gateway zum Aufteilen.
- Nachrichten: `E32_A_Aenderung`, `E32_B_Aenderung`

### A04_Angeheftete_Ereignisse.bpmn  (Advanced F. 4)

- **Travel Booking – Boundary Events** – Prozess-Key `A04_BoundaryEvents`
  - Folie 4: Angeheftete Ereignisse sind nur aktiv, solange ein Token auf der Aufgabe liegt. Timer (gestrichelt = NICHT unterbrechend, Demo: 1 Minute statt 1 Tag) erzeugt zusätzlich 'Check delay'. Eskalation 'Not available' (durchgezogen = unterbrechend) bricht die Buchung ab -> 'Inform customer'. Auslösen: ./dpe-demo.sh escalate <taskId> NOT_AVAILABLE
- Eskalationscodes: `NOT_AVAILABLE`

### A05_Ereignis_Teilprozess.bpmn  (Advanced F. 5)

- **Travel Booking – Event Subprocesses** – Prozess-Key `A05_EventSubprocess`
  - Folie 5: Ereignis-Teilprozesse (gepunkteter Rand) sind während der GESAMTEN Laufzeit ihres Prozesses aktiv – nicht nur während einer Aufgabe wie in Folie 4. 'Delay Subprocess' startet nicht unterbrechend nach 2 Min (statt 5 Tagen). 'Not available Subprocess' startet unterbrechend bei Eskalation NOT_AVAILABLE (./dpe-demo.sh escalate <taskId> NOT_AVAILABLE).
- Eskalationscodes: `NOT_AVAILABLE`

### A08_Link_Ereignisse.bpmn  (Advanced F. 8–9)

- **A: Schleife mit langem Rückfluss** – Prozess-Key `A08_A_Schleife`
  - Folie 8: Link-Ereignisse ersetzen einen langen Sequenzfluss innerhalb DESSELBEN Prozesses (wie 'springe zu Label A'). Schwarzes Link-Ereignis = werfen, weißes = fangen. Folie 9: Link darf NICHT die Grenze eines Teilprozesses überspringen. Step 6 ist hier eine Benutzeraufgabe, damit du 'Approved?' beantworten kannst (sonst Endlosschleife).
- **B: Gleiche Schleife mit Link-Ereignissen ('Label A')** – Prozess-Key `A08_B_Link`
  - Folie 8: Link-Ereignisse ersetzen einen langen Sequenzfluss innerhalb DESSELBEN Prozesses (wie 'springe zu Label A'). Schwarzes Link-Ereignis = werfen, weißes = fangen. Folie 9: Link darf NICHT die Grenze eines Teilprozesses überspringen. Step 6 ist hier eine Benutzeraufgabe, damit du 'Approved?' beantworten kannst (sonst Endlosschleife).

### A10_A11_Parallelitaet_Deadlock.bpmn  (Advanced F. 10–11)

- **A: Folie 10 – parallele Verarbeitung** – Prozess-Key `A10_Parallel`
  - Folie 10: Keine Abhängigkeiten zwischen den Aktivitäten -> paralleles Gateway. Immer paarweise: AND aufteilen, AND zusammenführen. Hier als Benutzeraufgaben, damit du die 3 parallelen Aufgaben gleichzeitig in der Tasklist siehst.
- **B: Folie 11 oben – DEADLOCK mit parallelem Join** – Prozess-Key `A11_B_Deadlock`
  - Folie 11 oben: Wählst du 'Compliance ok', kommen nur 2 von 3 Token am parallelen Join an -> Deadlock, die Instanz hängt.
- **C: Folie 11 unten – Lösung mit inklusivem Join** – Prozess-Key `A11_C_Inklusiv`
  - Folie 11 unten: Das inklusive Gateway erkennt, dass von 'Modify contract' kein Token mehr kommen kann, und läuft weiter.

### A12_Inklusives_Gateway_Default.bpmn  (Advanced F. 12)

- **A: Pfad ohne Bedingung = IMMER** – Prozess-Key `A12_A_Immer`
  - Folie 12 links: Ein Pfad ohne Bedingung wird beim inklusiven Gateway IMMER genommen -> System 2 läuft immer.
- **B: Default-Pfad = nur wenn nichts anderes passt** – Prozess-Key `A12_B_Default`
  - Folie 12 rechts: Der Default-Pfad (Schrägstrich) wird nur genommen, wenn KEINE andere Bedingung zutrifft (z. B. Kunden-ID 1000000).

### A13_Nicht_unterbrechende_Ereignisse.bpmn  (Advanced F. 13)

- **A: Ereignis an jeder einzelnen Aufgabe** – Prozess-Key `A13_A_AnAufgaben`
  - Folie 13 oben: Nicht unterbrechende Nachrichtenereignisse (gestrichelt). Während eine Buchung läuft, kann eine Kreditkartenänderung eintreffen; die Buchung läuft weiter UND 'Update Credit Card Data' startet parallel. Auslösen: ./dpe-demo.sh msg A13_Kreditkarte <processInstanceId>
- **B: Ereignis am Teilprozess** – Prozess-Key `A13_B_AmTeilprozess`
  - Folie 13 unten: Das Ereignis hängt am ganzen Teilprozess und ist aktiv, solange irgendeine Buchung läuft. Auslösen: ./dpe-demo.sh msg A13_KreditkarteSub <processInstanceId>
- Nachrichten: `A13_Kreditkarte`, `A13_KreditkarteSub`

### A14_Parallel_Ereignis_Teilprozess.bpmn  (Advanced F. 14)

- **Travel Booking mit Ereignis-Teilprozess** – Prozess-Key `A14_EventSubprocess`
  - Folie 14: Achtung – 'Charge Credit Card' startet erst, wenn der Teilprozess UND ein gestarteter Ereignis-Teilprozess fertig sind. Probiere: Nachricht senden (./dpe-demo.sh msg A14_Kreditkarte <processInstanceId>), dann alle Buchungen erledigen – 'Charge Credit Card' wartet, bis du auch 'Update Credit Card Data' erledigt hast.
- Nachrichten: `A14_Kreditkarte`

### A15_Zusammenfuehren_mit_ODER.bpmn  (Advanced F. 15)

- **Travel Booking – Zusammenführen mit ODER-Gateway** – Prozess-Key `A15_OderMerge`
  - Folie 15: Bei NICHT unterbrechenden Ereignissen den Ausnahmepfad mit einem inklusiven (ODER-)Gateway zurückführen. Kommt keine Nachricht, läuft es direkt weiter; kommt eine, wartet das ODER-Gateway auch auf diesen Pfad. Auslösen: ./dpe-demo.sh msg A15_Kreditkarte <processInstanceId>
- Nachrichten: `A15_Kreditkarte`

### A16_Fehlerbehandlung.bpmn  (Advanced F. 16)

- **Travel Booking – Error Handling** – Prozess-Key `A16_ErrorHandling`
  - Folie 16: An einen Teilprozess können beliebig viele Ereignisse angeheftet werden. Zeitüberschreitung (Demo 2 Min) oder technischer Fehler -> IT-Expert; fachliche Eskalation -> Business Expert. Auslösen, während 'Send Booking Data' offen ist: ./dpe-demo.sh error <taskId> TECH_FEHLER bzw. ./dpe-demo.sh escalate <taskId> FACHPROBLEM. Bestätigung: ./dpe-demo.sh msg A16_Bestaetigung <processInstanceId>
- Nachrichten: `A16_Bestaetigung`
- Fehlercodes: `TECH_FEHLER`
- Eskalationscodes: `FACHPROBLEM`

### A17_Eskalation.bpmn  (Advanced F. 17)

- **Travel Booking – Escalation** – Prozess-Key `A17_Escalation`
  - Folie 17: Eskalationen für die Kommunikation zwischen Kind- und Elternprozess. Jede Buchung kann mit ./dpe-demo.sh escalate <taskId> NICHT_BUCHBAR scheitern; der Teilprozess wirft dann eine EIGENE Eskalation (FEHLER_FLUG / FEHLER_HOTEL / FEHLER_MIETWAGEN), und der Elternprozess startet die passende Fehlerbehandlung.
- Eskalationscodes: `FEHLER_FLUG`, `FEHLER_HOTEL`, `FEHLER_MIETWAGEN`, `NICHT_BUCHBAR`

### A18_Timeout_Ereignisbasiertes_Gateway.bpmn  (Advanced F. 18)

- **Service Contract Implementation Layer** – Prozess-Key `A18_ServiceContract`
  - Folie 18: Das ereignisbasierte Gateway wartet auf das, was ZUERST passiert: Antwort des Service Providers oder Ablauf von 15 Sekunden. Nach diesem Gateway dürfen nur Ereignisse (oder Receive Tasks) folgen. Starten: ./dpe-demo.sh start A18_ServiceContract, dann innerhalb von 15 s: ./dpe-demo.sh msg A18_Antwort <processInstanceId>
- Nachrichten: `A18_AnProvider`, `A18_Antwort`, `A18_Error`, `A18_Response`, `A18_ServiceRequest`

### A19_Timeout_unterbrechend.bpmn  (Advanced F. 19)

- **Service Contract Implementation Layer** – Prozess-Key `A19_ServiceContract`
  - Folie 19: Unterbrechender Timer – nach 15 s wird das Warten abgebrochen und eine Fehlermeldung geschickt. Starten: ./dpe-demo.sh start A19_ServiceContract; Antwort: ./dpe-demo.sh msg A19_Antwort <processInstanceId>
- Nachrichten: `A19_Antwort`, `A19_Error`, `A19_Response`, `A19_ServiceRequest`

### A20_Timeout_nicht_unterbrechend.bpmn  (Advanced F. 20)

- **Service Contract Implementation Layer** – Prozess-Key `A20_ServiceContract`
  - Folie 20: NICHT unterbrechender Timer – nach 15 s startet zusätzlich 'Analyze Delay', das Warten auf die Antwort geht weiter. Starten: ./dpe-demo.sh start A20_ServiceContract; Antwort: ./dpe-demo.sh msg A20_Antwort <processInstanceId>
- Nachrichten: `A20_Antwort`, `A20_Response`, `A20_ServiceRequest`

### A21_Timeout_Teilprozess.bpmn  (Advanced F. 21)

- **Service Contract Implementation Layer** – Prozess-Key `A21_ServiceContract`
  - Folie 21: Zwei Zeitüberwachungen: innen 15 s nicht unterbrechend (-> Analyze Delay), außen am Teilprozess max. 5 Minuten (Demo: 2 Min) unterbrechend -> Fehlermeldung. Der äußere Timer überwacht den GANZEN Teilprozess. Antwort: ./dpe-demo.sh msg A21_Antwort <processInstanceId>
- Nachrichten: `A21_Antwort`, `A21_Error`, `A21_Response`, `A21_ServiceRequest`

### A22_Timeout_Ereignis_Teilprozesse.bpmn  (Advanced F. 22)

- **Service Contract Implementation Layer** – Prozess-Key `A22_ServiceContract`
  - Folie 22: Drei Ereignis-Teilprozesse überwachen den Teilprozess zeitlich: nach 1 und 2 Min (statt 5/10) nicht unterbrechend 'Analyze Delay', nach 3 Min (statt 15) unterbrechend ein Fehler-Endereignis -> außen Fehlermeldung. Antwort: ./dpe-demo.sh msg A22_Antwort <processInstanceId>
- Nachrichten: `A22_Antwort`, `A22_Error`, `A22_Response`, `A22_ServiceRequest`
- Fehlercodes: `TIMEOUT`

### A23_Transaktion.bpmn  (Advanced F. 23)

- **Service Contract Implementation Layer** – Prozess-Key `A23_ServiceContract`
  - Folie 23: Transaktion = alle Schritte gelingen gemeinsam oder keiner. Schlägt eine Buchung fehl (./dpe-demo.sh error <taskId> BUCHUNG_FEHLGESCHLAGEN), läuft der Fehler zum Cancel End Event (2). Die Engine geht rückwärts durch ihr Protokoll und führt die Kompensationsaufgaben (5) der bereits erledigten Schritte aus (sie erscheinen in deiner Tasklist). Danach greift das Cancel Boundary Event (3) -> Fehlermeldung.
- Nachrichten: `A23_Error`, `A23_Response`, `A23_ServiceRequest`
- Fehlercodes: `BUCHUNG_FEHLGESCHLAGEN`

### A24_Transaktion_extern_zurueckrollen.bpmn  (Advanced F. 24)

- **Service Contract Implementation Layer** – Prozess-Key `A24_ServiceContract`
  - Folie 24: Nachträgliches Kompensieren. Die Transaktion ist schon erfolgreich beendet; erst 'Check Result' entscheidet, dass das Ergebnis nicht passt (Result ok? = Nein). Das Kompensations-Zwischenereignis rollt die ABGESCHLOSSENE Transaktion zurück – die Engine bewahrt dafür ihr Logbuch auf.
- Nachrichten: `A24_Error`, `A24_Response`, `A24_ServiceRequest`
- Fehlercodes: `BUCHUNG_FEHLGESCHLAGEN`

### A25_Kompensation_im_Teilprozess.bpmn  (Advanced F. 25)

- **Service Contract Implementation Layer** – Prozess-Key `A25_ServiceContract`
  - Folie 25: Kompensation in einem NORMALEN Teilprozess (ohne Transaktion). (1) Während der Ausführung: Fehler ERROR_1 an Service 3 auslösen (./dpe-demo.sh error <taskId> ERROR_1) -> Ereignis-Teilprozess kompensiert Service 2 und 1 rückwärts und wirft ERROR_2 -> außen Fehlermeldung. (2) Nach Abschluss: bei der 'Follow-Up Task' Fehler FOLLOWUP_FEHLER auslösen -> Rollback des ganzen Teilprozesses (Ereignis-Teilprozess 'Compensation Handling after Sub-Process Finalization' kompensiert 3, 2, 1).
- Nachrichten: `A25_Error`, `A25_Response`, `A25_ServiceRequest`
- Fehlercodes: `ERROR_1`, `ERROR_2`, `FOLLOWUP_FEHLER`

### A26_AdHoc_Teilprozess.bpmn  (Advanced F. 26)

- **Ad-hoc Subprocess (nur Ansicht)** – Prozess-Key `A26_AdHoc` – *nur Ansicht*
  - Folie 26: Ad-hoc-Teilprozess (Tilde-Marker). Reihenfolge nicht vorab festgelegt; Aktivitäten ohne eingehenden Fluss sind sofort verfügbar. Attribute: ordering (Sequential/Parallel), completionCondition, cancelRemainingInstances. Camunda 7 / CIB seven führen Ad-hoc-Teilprozesse NICHT aus – nur zur Ansicht.

### A28_Gruppe_und_Datenspeicher.bpmn  (Advanced F. 28)

- **Customer (extern)** – Prozess-Key `A28_Kunde`
  - HIER STARTEN: Der Kunde erfasst eine Beschwerde; die Nachricht startet den Customer Service Care Process.
- **Customer Service Care Process** – Prozess-Key `A28_CustomerService`
  - Folie 28: Gruppe (gestrichelter Rahmen 'Decision-Loop') hebt Elemente optisch hervor und bewirkt NICHTS. Datenspeicher (Zylinder) überlebt das Prozessende – im Gegensatz zu Datenobjekten. Bei 'Decide on Complaint': 'ja' -> Update Order UND Review Decision (inklusives Gateway), 'nein' -> nur Review, 'experte' -> Evaluate Complaint und zurück.
- Nachrichten: `A28_Beschwerde`

### A29_Prozesse_starten.bpmn  (Advanced F. 29)

- **Original: drei Startereignisse (nur Ansicht – so in CIB seven nicht ausführbar)** – Prozess-Key `A29_O_Original` – *nur Ansicht*
  - Folie 29 oben: normales, Nachrichten- und Timer-Startereignis in EINEM Prozess. CIB seven lehnt das beim Hochladen ab (ENGINE-09005: 'multiple none start events or timer start events not supported'). Ausführbare Variante: Pool A.
- **A: Normaler Start + Nachrichtenstart (ausführbar)** – Prozess-Key `A29_A_MehrereStarts`
  - Ausführbare Variante von Folie 29 oben: Ein Prozess darf in CIB seven ein normales Startereignis und beliebig viele Nachrichten-Startereignisse haben, aber NICHT zusätzlich einen Timer-Start. Jeder Start erzeugt eine eigene Instanz: Tasklist/REST oder ./dpe-demo.sh msg A29_ReportAnfrage. Der Timer-Start bräuchte einen eigenen Prozess.
- **B: Instanziierendes ereignisbasiertes Gateway – exklusiv (nur Ansicht)** – Prozess-Key `A29_B_EventGwExklusiv` – *nur Ansicht*
  - Folie 29 Mitte: Wartet auf das erste Ereignis, nur dieser Pfad startet. In Camunda 7 nicht ausführbar.
- **C: Instanziierendes ereignisbasiertes Gateway – parallel (nur Ansicht)** – Prozess-Key `A29_C_EventGwParallel` – *nur Ansicht*
  - Folie 29 unten: ALLE Ereignisse müssen eintreffen, bevor es weitergeht. In Camunda 7 nicht ausführbar.
- Nachrichten: `A29_ReportAnfrage`

### L01_CallByReference_Listener.bpmn  (03 CallByRef F. 6–19)

- **Var Sichtbarkeit Prozess 1** – Prozess-Key `L01_VarSichtbarkeitProzess1`
  - 03 Call by Ref/Value, Folien 6–19. Eingebetteter Teilprozess = Call by Reference: Er greift direkt auf Feld1 des Hauptprozesses zu. Drei Wege, LOKALE Teilprozess-Variablen anzulegen: (1) Input Mapping am Teilprozess (lokaleSubprozessVar1 = ${Feld1}), (2) Execution Listener 'start' am Startereignis des Teilprozesses (lokaleSubprozessVar2), (3) Task Listener 'create' an der Benutzeraufgabe (lokaleSubprozessVar3). Ausprobieren: In 'Eingabe in Subprozess 1' alle Felder ändern. Danach in 'Ausgabe Prozess 1' bzw. im Cockpit: Feld1 ist im Hauptprozess GEÄNDERT (by reference), die drei lokalen Variablen sind nach Ende des Teilprozesses weg.

### L02_CallByValue_InOutMapping.bpmn  (03 CallByValue F. 21–32)

- **Var Sichtbarkeit Prozess 2** – Prozess-Key `L02_VarSichtbarkeitProzess2`
  - 03 Call by Ref/Value, Folien 21–32. HIER STARTEN. Die Call Activity ruft einen eigenständigen Prozess auf. In-Mapping: Feld2 (Hauptprozess) -> Feld2 (Teilprozess) als KOPIE. Out-Mapping: Feld2_Subprozess -> Feld2AusSubprozess. Ausprobieren: Im Teilprozess Feld2 ändern ('Feld 2 im TP neu'). Ergebnis in 'Ausgabe Prozess 2': Feld2 ist UNVERÄNDERT, nur Feld2AusSubprozess kam über das Out-Mapping zurück.
- **Var Sichtbarkeit Unterprozess 2** – Prozess-Key `L02_VarSichtbarkeitUnterprozess2`
  - Aufgerufener Prozess – nicht direkt starten. Er kennt nur, was per In-Mapping kopiert wurde.

### L03_Verschachtelte_Teilprozesse_Sichtbarkeit.bpmn  (04 Sichtbarkeit F. 9–21)

- **Verschachtelte Teilprozesse - Prozessebene 0** – Prozess-Key `L03_VerschachtelteTeilprozesse`
  - 04 Sichtbarkeit von Variablen, Folien 9–21. Auf jeder Ebene setzt ein Execution Listener (start) eine LOKALE Variable. Ebene 1 legt zusätzlich ebene1SchattenVar an. Fragen der Folien zum Ausprobieren: (1) In welchem Scope landet das neue Formularfeld dateneingabeVar? -> ganz oben (Prozessebene 0), weil setVariable() von innen nach außen sucht und spätestens im äußersten Scope anlegt. (2) Wo landet ebene3outputMappingVar? -> ebenfalls ganz oben. (3) ebene1SchattenVar wird auf Ebene 1 gefunden und dort überschrieben. Nach jeder Ebene sind deren lokale Variablen weg – vergleiche die 'Datenanzeige'-Aufgaben und das Cockpit (Spalte Scope).

### L04_Executions_parallel_lokal.bpmn  (04 Sichtbarkeit F. 3–8)

- **Executions und lokale Variablen** – Prozess-Key `L04_Executions`
  - 04 Sichtbarkeit, Folien 3–8. Am parallelen Gateway erzeugt die Engine für jeden Pfad eine eigene Execution. Prozessstart: customer='Kermit' (global, Execution 1 = Prozessinstanz). Execution Listener (start) setzen LOKAL worker='Fozzie' bzw. worker='Gonzo' auf den beiden parallelen Executions – gleicher Name, kein Konflikt. Task Listener (create) an 'receive payment' setzt eine TASK-lokale Variable customer='Hugo', die 'Kermit' dort überschattet (Folie 7). Im Cockpit während beide Aufgaben offen sind die Spalte Scope ansehen; in 'archive order' ist nur noch customer='Kermit' übrig.

### L05_Kollaborativ_Aggregator.bpmn  (08b Kollaborative Prozesse F. 3–13)

- **Bestellprozess** – Prozess-Key `L05_Bestellprozess`
  - 08b Kollaborative Prozesse, Folien 3–13. HIER STARTEN (2x mit demselben Produkt). 'Verify Data' hat einen Execution Listener (end, JavaScript), der product/quantity/comment als JSON-Objekt 'order' ablegt. Der Send Task korreliert die Nachricht NewOrderMessage über processInstanceVariableEquals('product', product): Beim ERSTEN Mal wartet noch kein Aggregator für dieses Produkt -> neue Aggregator-Instanz über das Nachrichten-Startereignis. Beim ZWEITEN Mal mit demselben Produkt wird die wartende Instanz fortgesetzt. Ein anderes Produkt startet einen eigenen Aggregator.
- **Aggregator** – Prozess-Key `L05_Aggregator`
  - Wird nur per Nachricht gestartet. Execution Listener (end) am Startereignis: legt orderList mit der ersten Bestellung an. Execution Listener (end) am Zwischenereignis: hängt jede weitere Bestellung an. Bei orderListLength >= 2 geht es weiter.
- Nachrichten: `NewOrderMessage`

### L06_Listener_Rundgang.bpmn  (eigene Ergänzung (Listener-Ereignisse))

- **Listener-Rundgang** – Prozess-Key `L06_ListenerRundgang`
  - EIGENE ERGÄNZUNG (nicht 1:1 aus den Folien, Grundlage: Folien 03/F. 9–10 und CIB-seven-Dokumentation). Jeder Listener hängt einen Eintrag an die Variable 'protokoll' an. Execution Listener: start/end an Prozess, Aktivität, Gateway, Ereignis; take am Sequenzfluss. Task Listener: create, assignment, complete, timeout (nach 1 Min, bricht NICHT ab), delete (wenn eine Aufgabe von außen beendet wird – hier durch den unterbrechenden Timer nach 2 Min). Ausprobieren: Aufgabe 1 eine Minute offen lassen (timeout), dann erledigen; Aufgabe 2 entweder erledigen oder 2 Min warten (delete). Am Ende zeigt 'Protokoll ansehen' die Reihenfolge.

### C01_REST_API_Investment_Approval.bpmn  (02 CIB seven F. 14–21)

- **Investment Approval Process** – Prozess-Key `investmentApprovalProcess_ProcessId`
  - 02 CIB seven, Folien 14–21. Das Demo-Szenario der Einführung; gestartet wird es auf den Folien per REST-API (Postman): POST http://localhost:8080/engine-rest/process-definition/key/investmentApprovalProcess_ProcessId/start mit Header Content-Type: application/json und Body {"variables": {...}}. Die Antwort enthält die id der neuen Instanz.

### C02_HTTP_Connector_Advice.bpmn  (05b Serviceaufrufe F. 3–11)

- **Advice of the Day** – Prozess-Key `advice-of-the-day`
  - 05b Serviceaufrufe, Folien 3–11. Die Serviceaufgabe ruft per HTTP-Connector (Connector ID http-connector) die öffentliche API https://api.adviceslip.com/advice auf (GET). Connector-Ausgabe: advice_of_the_day = ${response} (der Antworttext). 'Check Advice' zeigt die ganze Antwort und – wie auf Folie 11 – die einzeln mit Spin herausgezogenen Felder slip.id und slip.advice. Voraussetzung: Der CIB-seven-Container hat Internetzugang.

### C03_REST_Order_Quarkus.bpmn  (06 Microservices F. 53–60)

- **Order Process with Quarkus Service Calls** – Prozess-Key `order-process-quarkus`
  - 06 Microservices, Folien 53–60. Der Prozess ruft einen eigenen REST-Service (Quarkus, Port 8088) auf: 'Create order' = POST http://host.docker.internal:8088/resources/orders mit JSON-Payload, 'Read order' = GET .../orders/{id}. host.docker.internal = 'der Mac aus Sicht des Docker-Containers'. VORAUSSETZUNG: Der Quarkus-Order-Service aus 06/F. 41–50 läuft auf Port 8088 – ohne ihn bleibt die Instanz mit einem Incident bei 'Create order' stehen.

### C04_Kollaborativ_Einstieg.bpmn  (08a Kollaborative Prozesse F. 3–6)

- **08 Sender** – Prozess-Key `C04_Sender`
  - 08a Kollaborative Prozesse (Einstieg), Folien 3–6. HIER STARTEN. Der Send Task startet über createMessageCorrelation("auftragsnachricht") den Empfängerprozess und gibt product='Auto' und quantity=1 mit. Alternative laut Folie 6: Empfänger direkt per REST/Postman starten (POST /engine-rest/message).
- **08 Empfänger** – Prozess-Key `C04_Empfaenger`
  - Wird über die Nachricht 'auftragsnachricht' gestartet. Die mitgeschickten Variablen erscheinen im Formular (Default-Werte ${product} und ${quantity}).
- Nachrichten: `auftragsnachricht`

### C05_Messaging_ActiveMQ.bpmn  (09 Integration F. 19–22)

- **Send to Target Systems** – Prozess-Key `C05_SendToTargetSystems`
  - 09 Entwicklung PDA mit Integration, Folien 19–22. Der Send Task nutzt den HTTP-Connector, um eine JSON-Nachricht über die REST-Schnittstelle von ActiveMQ Classic in die Queue PDA_OrderQueue zu legen: POST http://host.docker.internal:8161/api/message/PDA_OrderQueue?type=queue, Header Content-Type und Authorization 'Basic YWRtaW46YWRtaW4=' (= Base64 von admin:admin). Auf der Folie ist das der Schritt NACH der Aggregation (siehe L05); hier vereinfacht als eigener Prozess mit einer eingegebenen Bestellliste. VORAUSSETZUNG: ActiveMQ Classic läuft (Weboberfläche http://localhost:8161, admin/admin).

### C06_Eventing_Temperatur_Alert.bpmn  (10 Eventing F. 31–39)

- **Temperature Alert Process** – Prozess-Key `C06_TemperatureAlertProcess`
  - 10 Entwicklung PDA mit Eventing, Folien 31–39. Esper erkennt eine kritische Temperatur, schreibt einen Alert in eine Queue, Camel liest ihn und startet diesen Prozess per REST mit der Nachricht tempAlertMsg und den Variablen temp1–temp4 (Folie 38). 'Decide on criticality' ist eine Business Rule Task, die die DMN-Tabelle C06_Temperatur_Kritikalitaet.dmn aufruft: Temperature >= 400 -> isCritical = true. Ohne Esper/Camel testen: ./dpe-demo.sh msg tempAlertMsg '' '{"temp1":{"value":380,"type":"Long"},"temp2":{"value":395,"type":"Long"},"temp3":{"value":410,"type":"Long"},"temp4":{"value":420,"type":"Long"}}'
- Nachrichten: `tempAlertMsg`

## Beispiel: kompletter Durchlauf mit A19 (Timeout)

```
bash dpe-demo.sh start A19_ServiceContract
bash dpe-demo.sh instances A19_ServiceContract      # Instanz-ID kopieren
bash dpe-demo.sh msg A19_Antwort <instanzId>        # innerhalb von 15 s -> normale Antwort
# oder 15 s warten -> der Timer bricht ab und das Fehler-Endereignis wird erreicht (im Cockpit sichtbar)
```
