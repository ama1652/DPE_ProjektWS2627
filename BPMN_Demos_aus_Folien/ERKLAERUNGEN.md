# Erklärungen zu allen Demos

> **Status:**
> - Diese Erklärungen sind eine **Vorbereitung anhand der Folien** (eigene Erklärung von Claude). Sie sind keine Vorlesungsmitschrift.
> - „Merke“ ist jeweils eine eigene Kurzfassung und **kein** Prüfungshinweis des Dozenten.
> - Folienangaben: **E** = `05_BPMN_Einführung`, **A** = `06_Advanced_BPMN`. Die anderen Nummern (02, 03, 04, 05b, 06, 08a, 08b, 09, 10) sind die Foliensätze aus dem Ordner deines Kumpels.

## So nutzt du jede Demo

- **Tasklist** (als demo/demo):
  - Prozesse starten
  - Aufgaben erledigen
- **Cockpit:**
  - sehen, wo das Token steht (blaue Zahl am Element)
  - Variablen ansehen, Spalte **Scope** = in welcher „Ablage“ die Variable liegt
- **`bash dpe-demo.sh`** für alles, was die Tasklist nicht kann:
  - `tasks` (Aufgaben-IDs), `msg` (Nachricht schicken), `error` / `escalate` (Fehler oder Eskalation auslösen)
  - `where` (wo steht die Instanz?), `vars` (Variablen), `abbrechen`

---

## Grundbegriffe in einem Satz

- **Token:** gedachte Marke, die durch das Modell wandert. Wo ein Token liegt, „passiert gerade etwas“.
- **Prozessinstanz:** ein konkreter Durchlauf eines Modells (z. B. „Antrag Nr. 17“).
- **Execution:** die Ablage der Engine für einen Ausführungspfad. Parallele Pfade, Teilprozesse und Mehrfachinstanzen bekommen eigene Executions. Zusammen bilden sie einen Baum.
- **Scope:** Sichtbarkeitsbereich von Variablen.
  - Innen sieht außen.
  - Außen sieht innen **nicht**.
- **`setVariable`:** sucht die Variable von innen nach außen, überschreibt den ersten Treffer, sonst legt es sie ganz außen an.
- **`setVariableLocal`:** legt die Variable immer im aktuellen Scope an.
- **Execution Listener:** Code oder Ausdruck, der bei `start`/`end` eines Elements oder bei `take` eines Sequenzflusses läuft.
- **Task Listener:** Code oder Ausdruck an einer Benutzeraufgabe bei `create`, `assignment`, `complete`, `delete`, `update` oder `timeout`.
- **Input-/Output-Mapping:** kopiert Werte beim Betreten oder Verlassen eines Elements in lokale Variablen bzw. zurück.
- **In-/Out-Mapping (Call Activity):** kopiert Variablen in einen eigenständigen aufgerufenen Prozess und zurück. Das ist **Call by Value**.
- **Nachrichtenkorrelation:** Die Engine ordnet eine eingehende Nachricht einer wartenden Instanz zu oder startet eine neue.
- **HTTP-Connector:** Serviceaufgabe ohne eigenen Java-Code ruft eine URL auf. `${response}` ist die Antwort.
- **Spin `S(...)`:** macht aus JSON-Text ein Objekt, z. B. `S(text).prop("id").numberValue()`.

---

## E – Einführung BPMN

### E06 Investitionsfreigabe (E F. 6)
- **Worum:** erstes vollständiges Prozessbeispiel mit Pool, Lanes und Rollen.
- **Ablauf:**
  - Antrag erfassen → genehmigen → XOR „Approved?“.
  - Ja: Service Task legt die Bestellung an.
  - Nein: zurück zum Antragsteller (Schleife).
- **Ausprobieren:**
  - einmal „Genehmigt“ abhaken
  - einmal nicht → die Aufgabe kommt erneut zum Antragsteller
- **Merke:** Die Entscheidung trifft die **Aufgabe** davor. Das Gateway leitet nur weiter.

### E19 Orchestrierung und Kollaboration (E F. 19)
- **Worum:**
  - Sequenzfluss nur **innerhalb** eines Pools (Orchestrierung)
  - Nachrichtenfluss nur **zwischen** Pools (Kollaboration)
- **Ablauf:**
  - Pool 1 startet Pool 2 per Nachricht.
  - Pool 2 antwortet zweimal.
  - Der dritte Pool zeigt Lanes = Rollen.
- **Ausprobieren:**
  - `E19_Pool1` starten, dann die User Task von Pool 2 erledigen
  - im Cockpit beide Instanzen beobachten
- **Merke:** Lanes darf ein Sequenzfluss überqueren, Pool-Grenzen nie.

### E20/E21 Token-Semantik (E F. 20–21)
- **Worum:** Wie verhalten sich Gateways beim Zusammenführen?
- **Ablauf:**
  - Beide Varianten teilen parallel auf.
  - E20 führt parallel zusammen (+), E21 exklusiv (X).
- **Ausprobieren:** In beiden Prozessen die Variable `anzahlTask4` ansehen:
  - E20: 1
  - E21: **2**
- **Merke:**
  - Das XOR-Gateway ist „dumm“ und lässt jedes Token sofort durch.
  - Paralleles Aufteilen immer parallel zusammenführen.

### E23 Datenobjekte und Call Activity (E F. 22–23)
- **Worum:** **Call by Value**. Der aufgerufene Prozess bekommt eine **Kopie** der Daten.
- **Ablauf:** Nachname (mit Tippfehler) erfassen → Review-Prozess per Call Activity → zurück kommt nur `korrigierterNachname`.
- **Ausprobieren:**
  - Im Kindprozess `nachname` ändern.
  - Im Elternprozess bleibt `nachname` alt.
- **Merke:**
  - Die Call Activity hat einen dicken Rand und ist wiederverwendbar.
  - Daten fließen nur über In-/Out-Mappings.

### E25 Eingebetteter Teilprozess (E F. 24–25)
- **Worum:** **Call by Reference**. Der eingebettete Teilprozess arbeitet direkt auf den Daten des Elternprozesses.
- **Ausprobieren:** `nachname` im Teilprozess ändern → danach ist er auch außen geändert.
- **Merke:** Ein eingebetteter Teilprozess ist nicht wiederverwendbar, sieht aber alle Elternvariablen.

### E26 Schleifen (E F. 26)
- **Worum:** fünf Varianten der Wiederholung.
- **Varianten:**
  - **A:** XOR prüft vorher (die Aufgabe läuft eventuell nie).
  - **B:** XOR prüft nachher (läuft mindestens einmal).
  - **C:** Standard-Loop-Marker. Nur Ansicht, CIB seven führt ihn nicht aus.
  - **D:** Mehrfachinstanz sequenziell (≡).
  - **E:** Mehrfachinstanz parallel (|||).
- **Ausprobieren:**
  - D: Die 3 Aufgaben erscheinen nacheinander.
  - E: Alle 3 sind sofort da.
- **Merke:** Mehrfachinstanz = „für jedes Element einer Liste“. Die Linien zeigen sequenziell oder parallel.

### E27 Inklusives Gateway – Tourist (E F. 27)
- **Worum:** Das ODER-Gateway nimmt **jeden** Pfad, dessen Bedingung stimmt (1 bis alle).
- **Ausprobieren:** Beim Start z. B. City Map + Event Guide ankreuzen → genau 2 Aufgaben erscheinen.
- **Merke:**
  - Das zusammenführende ODER-Gateway wartet genau auf die gestarteten Pfade.
  - Mindestens eine Bedingung muss wahr sein, sonst gibt es einen Fehler.

### E28 Wann läuft das ODER-Gateway weiter? (E F. 28)
- **Worum:** Das inklusive Zusammenführen ist „intelligent“. Es wartet nur auf Token, die noch ankommen **können**.
- **Ausprobieren:**
  - Option 1 + 2 wählen.
  - Bei „Do Something 2“ die 2. Frage mit **Nein** beantworten.
  - Ergebnis: Das Token endet in End 2, und „Do Something 3“ startet trotzdem.
- **Merke:** Das ist der Unterschied zum parallelen Join, der auf alle wartet.

### E29 Komplexes Gateway (E F. 29)
- **Worum:** „Weiter, sobald 3 von 5 Antworten da sind.“
- **Varianten:**
  - **A:** Original mit Complex Gateway. Nur Ansicht, in CIB seven nicht ausführbar.
  - **B:** ausführbare Alternative mit Mehrfachinstanz und Abschlussbedingung `${nrOfCompletedInstances >= 3}`.
- **Ausprobieren (B):** 3 der 5 Aufgaben „Antwort erfassen“ erledigen → die 2 übrigen verschwinden.

### E30/E31 Default Flow und Conditional Flow (E F. 30–31)
- **Worum:** Was passiert, wenn keine Bedingung passt?
- **Varianten:**
  - **A/B:** Der Default Flow (Schrägstrich) greift. Hier ist das Task 4, z. B. bei x = 150 000.
  - **C:** Bedingte Flüsse direkt an der Aufgabe verhalten sich **inklusiv**.
- **Ausprobieren:** verschiedene Werte für x: 5 000 / 20 000 / 70 000 / 150 000.
- **Merke:** Der Default Flow verhindert, dass der Prozess hängen bleibt.

### E32 Was ist falsch? – Deadlock (E F. 32)
- **Worum:** typischer Modellierungsfehler.
- **Ablauf (A):** Das erste **parallele** Gateway hat 2 Eingänge (Start + Schleife). Es wartet auf beide, aber das Schleifen-Token kommt nie.
- **Ausprobieren:** A starten → nach „Enter Change Order“ steht die Instanz im Cockpit fest. B (korrigiert) läuft durch.
- **Merke:** Zusammenführen von Alternativen = XOR. Aufteilen auf Parallelität = AND, danach.

---

## A – Advanced BPMN

### A04 Angeheftete Ereignisse (A F. 4)
- **Worum:** Ein Boundary Event ist nur aktiv, **solange das Token auf der Aufgabe liegt**.
- **Arten:**
  - Durchgezogener Rand = **unterbrechend**: Das Token wird zerstört und ein neues startet.
  - Gestrichelter Rand = **nicht unterbrechend**: zusätzliches Token, also Parallelität.
- **Ausprobieren:**
  - 1 Min warten → „Check delay“ erscheint **zusätzlich**.
  - `escalate <taskId> NOT_AVAILABLE` an Hotel oder Mietwagen → die Buchung wird abgebrochen.

### A05 Ereignis-Teilprozess (A F. 5)
- **Worum:** Ein Ereignis-Teilprozess (gepunkteter Rahmen) ist während der **ganzen** Laufzeit seines Prozesses aktiv.
- **Ausprobieren:** Eskalation `NOT_AVAILABLE` bei **irgendeiner** Buchung. Der Delay-Timer läuft ab Prozessstart.
- **Merke:** Anders als in A04 wird der Timer nicht pro Aufgabe gestartet, sondern mit dem Prozess.

### A08 Link-Ereignisse (A F. 8–9)
- **Worum:** ein „Sprung zu Label A“ statt eines langen Pfeils, nur innerhalb derselben Ebene.
- **Ausprobieren:** Bei „Step 6“ Approved = nein → es geht wieder vorne los.
- **Merke:**
  - Schwarzes Link-Ereignis = werfen, weißes = fangen.
  - Nie über eine Teilprozessgrenze springen (Folie 9).

### A10/A11 Parallelität und Deadlock (A F. 10–11)
- **Worum:** Parallel nur ohne Abhängigkeiten. Ein XOR **innerhalb** eines parallelen Zweigs kann einen Deadlock erzeugen.
- **Ausprobieren:**
  - Mit „Compliance ok“ hängt B (AND-Join mit 3 Eingängen, aber nur 2 Token).
  - C (ODER-Join) läuft durch.

### A12 Inklusives Gateway: „immer“ vs. Default (A F. 12)
- **Varianten:**
  - **A:** Pfad ohne Bedingung → läuft **immer**.
  - **B:** Default-Pfad → läuft nur, wenn **nichts anderes** passt.
- **Ausprobieren:** Kunden-ID 123456 in A und in B. B zusätzlich mit 1000000.

### A13 Nicht unterbrechende Ereignisse (A F. 13)
- **Worum:** Eine Kreditkartenänderung kommt während der Buchung, und beides läuft parallel.
- **Ausprobieren:** `msg A13_Kreditkarte <instanzId>` (A) bzw. `msg A13_KreditkarteSub <instanzId>` (B).
- **Merke:**
  - A: Ereignis an jeder Aufgabe.
  - B: einmal am Teilprozess, was kürzer ist.

### A14 Parallel per Ereignis-Teilprozess (A F. 14)
- **Achtung laut Folie:** „Charge Credit Card“ startet erst, wenn Teilprozess **und** gestarteter Ereignis-Teilprozess fertig sind.
- **Ausprobieren:** `msg A14_Kreditkarte <instanzId>`, dann die Buchungen erledigen → es wartet auf „Update Credit Card Data“.

### A15 Zusammenführen mit ODER (A F. 15)
- **Worum:** Ausnahmepfade nicht unterbrechender Ereignisse mit einem **ODER**-Gateway zurückführen.
- **Ausprobieren:**
  - ohne Nachricht → läuft direkt durch
  - mit Nachricht → wartet auch auf „Update Credit Card Data“

### A16 Fehlerbehandlung (A F. 16)
- **Worum:** mehrere Ereignisse an einem Teilprozess.
- **Ausprobieren:** An „Send Booking Data“ eines davon auslösen:
  - `error … TECH_FEHLER` → IT-Experte
  - `escalate … FACHPROBLEM` → Business-Experte
  - 2 Min warten → IT-Experte
- **Merke (Vorjahresnotiz):** Error = technisch/katastrophal, Escalation = fachliche Ausnahme.

### A17 Eskalation Kind → Eltern (A F. 17)
- **Worum:** Der Teilprozess meldet über **eigene** Eskalationscodes nach außen, **welche** Buchung scheiterte.
- **Ausprobieren:** `escalate <taskId> NICHT_BUCHBAR` an einer Buchung → die passende „Error Handling“-Aufgabe erscheint.

### A18–A22 Timeout-Muster (A F. 18–22)
- **A18 ereignisbasiertes Gateway:** Was zuerst kommt, gewinnt: Antwort oder 15 s. Danach dürfen nur Ereignisse oder Receive Tasks folgen.
- **A19 unterbrechender Timer:** Nach 15 s wird das Warten abgebrochen → Fehlermeldung.
- **A20 nicht unterbrechender Timer:** Nach 15 s startet zusätzlich „Analyze Delay“, das Warten läuft weiter.
- **A21 Timer am Teilprozess:** überwacht den **ganzen** Teilprozess (2 Min), innen zusätzlich 15 s.
- **A22 Ereignis-Teilprozesse:** gestaffelt nach 1 und 2 Min (Hinweis), nach 3 Min Abbruch über einen Fehler.
- **Ausprobieren:** jeweils starten; dann `msg <Name>_Antwort <instanzId>` schicken oder warten.

### A23 Transaktion (A F. 23)
- **Worum:** Alles oder nichts. Bei einem Fehler macht die Engine erledigte Schritte über **Kompensation** rückgängig.
- **Ausprobieren:**
  - Flug und Hotel erledigen.
  - Bei „Book Rental Car“: `error <taskId> BUCHUNG_FEHLGESCHLAGEN`.
  - Ergebnis: „Compensation Book Hotel“ und „… Flight“ erscheinen (rückwärts), danach Fehlermeldung.
- **Merke:** Die Engine geht rückwärts durch ihr Protokoll. Eine Transaktion ist aufwendig, deshalb nur, wo nötig.

### A24 Nachträgliches Zurückrollen (A F. 24)
- **Worum:** Die Transaktion ist schon fertig, erst „Check Result“ sagt Nein → Kompensation von außen.
- **Ausprobieren:** alles erledigen, bei „Check Result“ „Result ok?“ abwählen.

### A25 Kompensation im normalen Teilprozess (A F. 25)
- **Worum:** Kompensation ohne Transaktion, gesteuert über Ereignis-Teilprozesse.
- **Ausprobieren:**
  - `error … ERROR_1` an Service 3 → kompensiert 2 und 1.
  - Alternativ: `error … FOLLOWUP_FEHLER` an „Follow-Up Task“ → Rollback von 3, 2, 1.
- **Hinweis:** Am ehesten möglich, dass CIB seven hier etwas ablehnt. Dann die Meldung an Claude schicken.

### A26 Ad-hoc-Teilprozess (A F. 26) – nur Ansicht
- **Worum:** Die Reihenfolge ist offen, das Ziel ist definiert (z. B. Kfz-Schadensfall). In CIB seven nicht ausführbar.

### A28 Gruppe und Datenspeicher (A F. 28)
- **Worum:**
  - Gruppe = nur optische Klammer, bewirkt nichts.
  - Datenspeicher = Daten, die das Prozessende überleben.
- **Ausprobieren:** `A28_Kunde` starten → Beschwerde → beim Account Manager „ja“, „nein“ oder „experte“ wählen.

### A29 Prozesse starten (A F. 29)
- **Worum:** Ein Prozess kann mehrere Startereignisse haben: normal, Nachricht, Timer. Jedes startet eine eigene Instanz.
- **Ausprobieren:** A normal starten und per `msg A29_ReportAnfrage`. B und C (instanziierende Event-Gateways) sind nur Ansicht.
- **Vorjahresnotiz:** „Start sollte immer EIN Ereignis haben.“

---

## L – Listener, Mappings, Sichtbarkeit (03, 04, 08b)

### L01 Call by Reference mit Listenern (03 F. 6–19)
- **Worum:** drei Wege, eine **lokale** Variable im eingebetteten Teilprozess anzulegen:
  1. **Input Mapping** am Teilprozess: `lokaleSubprozessVar1 = ${Feld1}`
  2. **Execution Listener** (`start`) am Startereignis: `setVariableLocal("lokaleSubprozessVar2", …)`
  3. **Task Listener** (`create`) an der Benutzeraufgabe: `setVariableLocal("lokaleSubprozessVar3", …)`
- **Ausprobieren:**
  - In „Eingabe in Subprozess 1“ alles ändern.
  - Danach ist Feld1 **auch außen** geändert (by reference), die lokalen Variablen sind weg.
- **Merke:** Formularfelder ohne Default zeigen automatisch vorhandene Variablen an.

### L02 Call by Value (03 F. 21–32)
- **Worum:** Die Call Activity kopiert mit **In-Mapping** Feld2 → Feld2. Mit **Out-Mapping** kommt Feld2_Subprozess → Feld2AusSubprozess zurück.
- **Ausprobieren:** Im Teilprozess Feld2 ändern → außen bleibt Feld2 **unverändert**.
- **Merke:**
  - Source = Name im abgebenden Prozess, Target = Name im empfangenden.
  - Der aufgerufene Prozess ist wiederverwendbar und von außen entkoppelt.

### L03 Verschachtelte Teilprozesse (04 F. 9–21)
- **Worum:** Sichtbarkeit über 4 Ebenen. Jede Ebene legt per Execution Listener eine lokale Variable an.
- **Folienfragen und Antworten:**
  - Wo landet das neue Formularfeld `dateneingabeVar`? → ganz **außen** (Ebene 0), weil `setVariable` es nirgends findet.
  - Wo landet `ebene3outputMappingVar` (Output Mapping)? → ebenfalls ganz außen.
  - `ebene1SchattenVar` wird auf Ebene 1 **gefunden** und dort überschrieben.
- **Ausprobieren:** Nach jeder „Datenanzeige“ im Cockpit die Spalte Scope vergleichen. Die Variablen innerer Ebenen verschwinden nacheinander.

### L04 Executions und lokale Variablen (04 F. 3–8)
- **Worum:** Jeder parallele Pfad hat eine eigene Execution mit eigener Ablage.
- **Ablauf:**
  - `customer = Kermit` liegt global.
  - `worker` liegt pro Pfad lokal: Fozzie bzw. Gonzo.
  - An „receive payment“ überdeckt eine Task-lokale Variable `customer = Hugo` die globale.
- **Ausprobieren:**
  - Cockpit öffnen, während beide Aufgaben offen sind.
  - Danach „archive order“: `worker` ist weg.

### L05 Kollaborative Prozesse – Aggregator (08b F. 3–13)
- **Worum:** Nachrichtenkorrelation über eine Prozessvariable. Dazu verarbeiten JavaScript-Listener die Daten.
- **Ablauf:**
  - „Verify Data“ legt beim **Ende** (`end`-Listener) das JSON-Objekt `order` an.
  - Der Send Task: `createMessageCorrelation("NewOrderMessage").processInstanceVariableEquals("product", product)`.
  - Erste Bestellung zu einem Produkt → **neuer** Aggregator (Startnachricht).
  - Zweite Bestellung mit demselben Produkt → **wartender** Aggregator wird fortgesetzt.
- **Ausprobieren:** Bestellprozess 2x mit „Fahrrad“ → „Store Orders in DB“ mit 2 Bestellungen in `orderList`.
- **Merke:**
  - `correlateWithResult()` setzt **genau eine** Instanz fort oder startet eine; bei Mehrdeutigkeit gibt es eine Ausnahme.
  - `correlateAllWithResult()` bedient alle passenden Instanzen.

### L06 Listener-Rundgang (eigene Ergänzung)
- **Worum:** Reihenfolge der Listener sichtbar machen. Jeder schreibt eine Zeile in `protokoll`.
- **Ausprobieren:**
  - Aufgabe 1 eine Minute offen lassen (`timeout`), dann erledigen.
  - Aufgabe 2 2 Min warten (`delete` durch den Timer) oder erledigen.
- **Merke:**
  - `create` → `assignment` → … → `complete`.
  - Der Execution Listener `end` der Aufgabe kommt **nach** dem Task Listener `complete`.
  - `take` gehört zum Pfeil.

---

## C – CIB seven, Services, Messaging, Eventing

### C01 REST-API (02 CIB seven F. 14–21)
- **Worum:** einen Prozess **von außen** per REST starten (so machen es später Camel und andere Systeme).
- **Ausprobieren:**
  ```
  curl -u demo:demo -H "Content-Type: application/json" \
    -d '{"variables":{"product":{"value":"REST-Product","type":"String"},"quantity":{"value":10,"type":"Long"},"comment":{"value":"10 ok?","type":"String"}}}' \
    http://localhost:8080/engine-rest/process-definition/key/investmentApprovalProcess_ProcessId/start
  ```
  Die Antwort enthält die `id` der Instanz. Danach weiter in der Tasklist.
- **Merke:** Die URL nutzt den **Process ID / Key** aus dem Modell. Die REST-Doku ist unter docs.cibseven.org → Reference → REST API.

### C02 HTTP-Connector (05b F. 3–11)
- **Worum:** Ein Service wird ohne Java-Code direkt aus dem Modell aufgerufen.
- **Konfiguration:**
  - Typ „Connector“, ID `http-connector`
  - Inputs `url` und `method`
  - Output `advice_of_the_day = ${response}`
- **Ausprobieren:** starten → „Check Advice“ zeigt die Antwort und die mit Spin herausgezogenen Felder `id` und `advice`.
- **Merke:** `S(variable).prop("slip").prop("advice").stringValue()` holt ein Feld aus JSON.

### C03 REST-Service aus dem Prozess (06 F. 53–60) – braucht den Order-Service
- **Ablauf:**
  - „Enter order“ baut beim Ende ein JSON `order`.
  - „Create order“ = POST an `host.docker.internal:8088/resources/orders`.
  - Ein `end`-Listener zieht die `id` aus der Antwort.
  - „Read order“ = GET `…/orders/{id}`.
  - „Display order“ zeigt das Ergebnis.
- **Merke:** `host.docker.internal` = dein Mac aus Sicht des Docker-Containers. `localhost` wäre der Container selbst.
- **Voraussetzung:** Quarkus-REST-Service (Code-Demo, siehe unten) auf Port **8088**.

### C04 Kollaborative Prozesse – Einstieg (08a F. 3–6)
- **Worum:** Ein Prozess startet einen anderen per Nachricht und gibt Daten mit.
- **Ablauf:** Send Task `createMessageCorrelation("auftragsnachricht").setVariable("product","Auto").setVariable("quantity",1)`.
- **Ausprobieren:**
  - `C04_Sender` starten → „Auftrag anzeigen“ zeigt Auto / 1.
  - Alternativ wie auf Folie 6 direkt: `bash dpe-demo.sh msg auftragsnachricht '' '{"product":{"value":"Fahrrad"},"quantity":{"value":2,"type":"Integer"}}'`

### C05 Messaging mit ActiveMQ (09 F. 19–22) – braucht ActiveMQ
- **Worum:** Der Prozess legt eine Nachricht **asynchron** in eine Queue. Die Zielsysteme holen sie sich später.
- **Konfiguration:**
  - HTTP-Connector POST an `host.docker.internal:8161/api/message/PDA_OrderQueue?type=queue`
  - Header `Authorization: Basic YWRtaW46YWRtaW4=` (= Base64 von `admin:admin`)
- **Ausprobieren:** ActiveMQ starten → Prozess starten → in der ActiveMQ-Weboberfläche (`localhost:8161`, Queues) die Nachricht sehen.
- **Merke:** Messaging entkoppelt die Systeme. Der Prozess wartet nicht auf das Zielsystem.

### C06 Eventing – Temperatur-Alert (10 F. 31–39)
- **Worum:** Ereignisverarbeitung erkennt eine kritische Lage und startet daraufhin einen Prozess.
- **Ablauf:**
  - Esper → Queue → Camel → REST `message` mit `tempAlertMsg` und `temp1`–`temp4`.
  - Die Business Rule Task ruft die DMN-Tabelle auf: ≥ 400 → kritisch.
- **Ausprobieren ohne Esper/Camel:** Befehl steht in der README bei C06. Mit 420 → „Work on problem urgently“, mit Werten < 400 → „Work on problem“.
- **Unsicher:** Welche Temperatur die DMN auf der Folie prüft, ist nicht zu sehen. Ich nehme das **Maximum von temp1–temp4** (Projektannahme).

---

## Code-Demos (noch nicht gebaut) – brauchen Java-Projekte

Diese Demos sind keine reinen BPMN-Modelle, sondern eigene Programme:

| Foliensatz | Demo | Was gebaut werden müsste | zusätzliche Software |
|---|---|---|---|
| 05a Services und Persistenz (F. 19–31) | Quarkus-Service mit JPA/Panache | Maven-Projekt mit Entity, Repository, Service | Quarkus, Datenbank (H2 oder MySQL) |
| 06 Microservices (F. 31–40) | SOAP-Webservice (WSDL, Test mit SoapUI) | Quarkus + CXF, Port 8088 | SoapUI (optional) |
| 06 Microservices (F. 41–50) | REST-Webservice `/resources/orders` | Quarkus REST, Port 8088 → **damit läuft C03** | Postman (optional) |
| 09 Integration (F. 23–47) | erstes Camel-Projekt, Camel + ActiveMQ | Maven-Projekt mit Route und Hauptprogramm | **ActiveMQ Classic** → **damit läuft C05** |
| 10 Eventing (F. 31–38) | Esper erkennt kritische Temperatur → Queue → Camel startet C06 | zwei Maven-Projekte (Esper, Camel) | ActiveMQ Classic, Esper |

Die Demos in **07 Prozessgesteuerter Ansatz** (F. 17, 23, 52–53) zeigt der Dozent mit eigenen Systemen. Die Folien enthalten keine nachbaubaren Details. Die IoT-Demo (F. 52–53) entspricht inhaltlich der Kette aus 09 + 10.
