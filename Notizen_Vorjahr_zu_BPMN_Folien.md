# Notizen aus dem Vorjahr zu den BPMN-Folien

> **Herkunft und Status:**
> - Die Zeilen stammen aus den annotierten PDFs eines Kommilitonen (Ordner `DPE/[03] BPMN`, Notizen vermutlich WS 25/26). Sie wurden automatisch per Textvergleich gegen deine Fassung herausgezogen. Deine Originale sind unverändert.
> - Es sind **Mitschriften eines Studierenden, keine belegten Aussagen des Dozenten**. Die Notizen sind teils fragmentiert, und die Reihenfolge innerhalb einer Folie kann durch das Textauslesen vertauscht sein. Rechtschreibung bleibt original.
> - Status für deine Lernunterlagen: **UNSICHERE ZUORDNUNG / Vorjahresnotiz**, bis sie durch eine eigene Vorlesung bestätigt sind.
> - Abgleich: Die Folieninhalte selbst sind in beiden Fassungen identisch. Unterschiedlich sind nur diese Zusatznotizen.

## 05_BPMN_Einführung.pdf (Notizen aus `02_Einführung_BPMN.pdf`, ergänzt um `05_BPMN_Einführung.pdf` des Kumpels)

**Folie 3:** Process Engine ist auch eine Infrastrkturkomponente · lösen nicht direkt · anwendungsprobleme · werkelt im hintergrund -> · Datenbank · nehmen BPMN-Modell und reichern es durch zusätzliche Informationen an · Workflow Management – siehe nächste Folien), und indem sie interne oder externe ITService-Orchestrierung: Aufrufe am System · Systeme über Schnittstellen aufruft (Service-Orchestrierung) Human WF-Manag: Benutzer anstoßen · Diese Aufrufe kann man asuwerten

**Folie 4:** Modell wird übergeben · Zur Laufzeit eine Modellinstanz laufen lassen · Mehrer Instanzen gleichzeitig möglich · PE protokolliert alle Schritte des Prozesses · und ist wichtiges · Ergebnis für Monitoring und Reporting (Betrieb) · rot sollte man in andere Schichten auslagern, PE kann das aber sollte nicht · mit reinmodelliert werden

**Folie 5:** ECHTZEITÜBERWACHUNG DES PROZESSES

**Folie 6:** Lanes repräsentieren Rollen · Pool · Lane 1 · Lane 2 · Lane 3 · Ende · Startereignis · Req: Antragssteller · Apporver: Genehmiger · Mensch: Benutzeraufgabe

**Folie 9:** Auf Fehler überprüfen möglich, wie · bei einer IDE

**Folie 10:** Zusammengeklapper Unterprozess · Abarbeitung unterprozess

**Folie 11:** Prozesse kommuniziert mit Nachrichten mit · ihrer ihrer Umwelt

**Folie 12:** Ausnahmesituationen müssen · abgedeckt / modelliert sein

**Folie 13:** Activity: Aktivität · Gateway: Fluss Fluss wird aufgesplittet · Event: Ereignisse

**Folie 14:** Benutzeraufgabe -> prozess bleibt stehen bis benutzerinteraktion · getätigt wurde · Service Task: Automatische Schritte im System · Marker / Markierung · Geschäftsregelaufgabe · wiederverwendbarer · auch dicker rand · Teilprozess · Teilaktivität · Teilprozess · Call Activity: Wiederverwendbarer Teilprozess -> Dicker Rand Aufrufaktivität · bsp: Validierung Adresse

**Folie 15:** Aufgabe - nicht automatisierbar sind / kein Roboter / nur · Manual Task: Manuelle · Mensch · Business Rule Task: Geschäftsregelaufgabe -> Geschäftsregelengine · logic/calculations z.B Bestimmung Rabatt (if else-> gut in Tabelle) · kleine Berechnungen (Mwst.) · engine can interpret Weniger verwendung hier in vorlesung

**Folie 16:** ausgefüllte symbole bedeuten immer, dass etwas an die · Außenwelt gesendet wird · schwarz -> nach außen gesendet · weiß -> Prozess steht an der stelle und wartet auf eintritt eines · Ereignisses / Nachricht wartet · schwarze senden · weiß empfangen

**Folie 17:** Gateways Verzweigung / Zusammenfügung · exclusiv · DATENBASIERT · Variable erfüllt sie oder · nicht · -> Bedingung · alle ausgehenden pfade · Parallel splitting gateway (also AND gateway): werden beschritten · ohne Bedingung · sobald einer abgeschlossen, geht sofort · weiter, wartet nicht auf anderen pfad · doppelkreis und pentagon · müssen alle pfade · sein, um weiter ·  Waits for all sequence flows to finish abgeschlossen · zu gehn · Exclusive splitting gateway (event-based): EREIGNISBASIERT · Nachrichtenereignis · Zeitereignis · Wartet auf das Eintreffen, welches nach dem Gateway modelliert is · dann wird der jeweilige pfad verfolgt -- NUR EIN PFAD MÖGLICH

**Folie 18:** Start kein Schwarzes Symbol · Ende kein weißes Symbol · Ereignisse · Startereignis, dünner Rand, Symbol auf welche Ereignis gewartet · wird · Zwischenereignis · doppelter Rand und Uhr, nur im · Intermediate Timer Event: Zwischenereignis, · Normalprozessfluss, ein Pfeil rein & ein Pfeil raus · Intermediate Message Event: Zwischenereignis, wartet auf Nachricht · Error End Event: nur ein Pfeil rein · Message End Event: Ende und Nachricht wird gesendet · bei Parallelen Pfaden wichtig, damit · Termination: Sofort Beendigung eines Prozesses · alle pfade sofort beendet werden

**Folie 19:** Benennung mit Prozessname (z.B Buchungsprozess, Urlaubsprozess) · Rolle für bestimmten Schritt · Benutzeraufgaben · Sequenzfluss · Nur innerhalb eines Pools · Collaboration: Nachrichtenfluss · Nur zwischen Pools nicht innerhalb · Kollaberationsfluss · semantisch identisch · © Volker Stiehl sendungsaufgabe, kann man noch mehr machen als 19 · mit dem Ereignis, z-B Markierungen setzen

**Folie 20:** warten bsi beide token da und token werden · zusammengelegt · Endereignis · Token wird · zerstört · Nur ein Token, nur eine Nachricht

**Folie 21:** Paralleles verweigendes · Gateway · Tokensplit · Endereignis, Token · wird zerstört · Token kommen unterschiedlich an · -> Gateway ist dumm und lässt zweites auch und verschickt 2 · Nachricht

**Folie 22:** Beschriftung "Auftrag" · "Auftragt" · mehrfach Instanz · Markierung · Liste (homogen)

**Folie 23:** CALL BY VALUE · Daten Befinden sich im Prozess, also im Prozesskontext · Elternprozess · weiß: Empfang · schwarz: Senden · gerichtete · Assoziation · wiederkehrende Teilprozess · Kopierte Daten von · außerhalb · Kopie und explizit nach · Es wird eine KOPIE der Daten an den Kindprozess weitergegeben -> hat also keine auswirkung · auf den Elternprozess außen gegeben · Hat keine auswirkung · auf Orginaldatensatz · Kindprozess · Aufgerufener Prozess · Daten zurück geben explizit über · Kopie

**Folie 24:** Eingebettete Prozesse, haben zugriff auf · Elterndatenobjekte · CALL BY REFERENCE · greift auf · Originaldaten · zu · kann ich nicht wiederverwenden · er ist also ein eingebetteter Teilprozess

**Folie 25:** eingebetteter Prozess

**Folie 26:** Schleife nur für EINE Aktivität nicht mehrere !!! · Prüfung der Bedingung vor Ausführung des Schrittes · Prüfung der Bedingung NACH · Ausführung des Schrittes · eigentlich falsch nicht möglich sieh S.32 bzw. 30 · muss man angeben · ungerichtete Assoziation · default: false · -> danach wird überprüft · mehrfach, so oft es Instanzen · gibt in der Liste · Schleife wird sequentiell abgearbeitet · -> bis alle Instanzen der Listen durch sind · © Volker Stiehl-> sequenziell · -> Parallel · iteration über die · Liste

**Folie 27:** kann entscheiden, durch vorgelagerten Aktivitäten, wie viele Tokens weitergeleitet · werden soll · Muss beachten ob auf den richtigen · Pfaden ein Token noch kommen muss · überprüft ob die RICHTIGE PFADE genommen · wurden · und ob noch Tokens unterwegs sind · -> geht erst weiter wenn ALLE tokens da sind

**Folie 28:** Muss auch erkennen · kennen, ob in einem · Nebenpfad ein zu · erwartendes Token · zerstört wurde · in dem letzten fall, bei dem ein token in inclusive wartet und ein token den weg richtung end2 nimmt, · wird dann das eine token in end2 zerstört und das andere token kann dann weitergeleitet werden · durch das Inclusive gateway -> das inclusive MUSS das erkennen können!

**Folie 29:** 5 Tokens warten, 3 wandern zum komplexen Gateway · Komplexer Verzweiger · bei 3 token kann es weitergehen · alle danach · ankommende · token werden · zerstört · möchte ich alle · Tokens zerstören · und nicht nur die · 3 -> dann terminator · Terminator · wenn mitarbeiter noch an der · Auswertung arbeitet, aber noch ein · neues Token reinkommt · --> durch liste Datenobejekt · bekommt der Mitarbeiter die Antwort · von bobby mit und kann sie · berücksichtigen · --> · kompl. gateway ist inteleigent und zerstört ein token · wenn es während · der Bearbeitung des nächsten schrittes eintrifft

**Folie 30:** anderes zeichen in der literatur · für exclusive gateway · -> sollen wir nicht hernehmen · wenn keine der Beding · erfüllt, dann nehme diesen · pfad · -> Vermeidung dead lock

**Folie 31:** bedingte Flüsse · inklusives Verhalten · jede Bedingung wird durchgemacht und token verwendet · sollen wir nicht hernehmen

**Folie 32:** mehrere pfeile die reingehen und mehrere die Rausgehen · token muss vorhanden sein, damit etwas weitergeht, · aber am Anfang wird nie ein token kommen · --> Dead lock · end criteria: aceppted = yes · test before: true /false

### Zusätzliche Notizen aus der zweiten Fassung (`05_BPMN_Einführung.pdf`)

**Folie 17:** one outgoing sequence flow sobald 1 ankommt, gleich weiter ·  Waits for all sequence flows to finish erst wenn beide da sind · dann weiter · wartet auf das erste eintretende Ereignis

## 06_Advanced_BPMN.pdf (Notizen aus `03_Advanced_BPMN.pdf`)

**Folie 3:** Ereignisteilprozesse Unterbrechend · Ereignisteilprozesse nicht Unterbrechend · angeheftete unterbrechende Ereignisse · angeheftete NICHT unterbrechende Ereignisse

**Folie 4:** Wie Probleme in BPN ausdrücken? · -> durch angeheftete Ereignisse · angeheftetes Ereignis ist nur aktiv, solange sich ein Token auf dem Schritt befindet · angeheftete Ereignisse · Happy Path · Timer überwacht nur · diesen EINEN Schritt · zerstört, wenn Ereignis eintritt · neues Token · Nicht Unterbrechendes Ereignis (gestrichelt) · Token bleibt bestehen und neues ZUSÄTZLICHES Token wird erstellt · --> Parallelität wird erzeugt · Eskalationsereignis (text wann dieses Ereignis ausgelöst wird) · Unterbrechendes Ereignis (durchzogener Rand) -> Token wird zerstört und neuer Token wird in der neuen Aktivität erstellt

**Folie 5:** Ereignisteilprozesse · Rand ist gepunktet und hat · ein Symbol im Startereignis · Unterbrechend · mit neuer Token Generierung · normaler Teilprozess hat · durchge-zogenen Rand und kein · Symbol im Startereignis · NICHT unterbrechende StartEreignis in einem Ereignisteilprozess · Startet mit dem Anfang des · gesamten Prozesses und hört · auch mit dem Ende des · Prozesses auf! · Token bleibt in ursprünglichen · Prozess und neues Token wird · erstellt · Timer beginnt sobald Prozess · beginnt (unterschied zur letzten Folie!!) · ? Startet gleichzeitig zum · Hauptprozess ?

**Folie 6:** Eingesetzt wenn ich besondere Stellen · (Meilensteine) besonders markieren · möchte · Warten auf eine · Datenbedingung · z.B bis Kunde Platinstatus erreicht · 1:1 Kommunikation · zwischen den Beteiligten · Warte bis der Eintrag · in der Datei · auf "true/false" gesetzt wird · Eskalation sollte immer bei · fachlicher · Ausnahmesituation handelt · Hat auch da · terminierende · Verhalten - Token · gelöscht · token gibt es ja parallel noch · Error bei technischer und · katastrophaler Situation · und fortsetzung keinen sinn · mehr macht -> DB stürzt ab · Stromausfall

**Folie 7:** Es muss nur 1 eintreffen und der · Prozess startet · Unterschied: · Links muss man den Timer und · Nachricht modellieren, rechts nicht · aber dafür text · 5 min · -> Aber im Grunde das Gleiche · A · Man kann auch auf · Signale warten · 1: N Kommunikation · Wir senden, wissen aber · nicht, wer sich für dieses · Signal abonniert hat · später · später · KEINEN FLUSS zeichnen · Terminate · Es müssen alle eintreffen bis der Prozess startet

**Folie 8:** Sequenzfluss wird ersetzt · Mache weiter bei · dem Ereignis bei · dem das Label A zu · finden ist · Empfangen · Schwarz -> werfen

**Folie 9:** Wenn man es graphisch darstellt sieht · man, das der Sequenzfluss den Rand · des Teilprozesses kreuzt · -> das darf NICHT sein

**Folie 10:** Parallelverarbeitung · Antrag Eingabe · Antrag überpüfen · Bestehen Abhängigkeiten · müssen sie in einer · Sequenz modelliert werden · Sollte immer so eine Paarbildung sein · Parallelität immer verwenden, wenn keine Abhängigkeit existiert

**Folie 11:** Dead-Locks können bei Pralallelverarbeitung entstehen · intelligent und erkennt, · dass von oben kein token · mehr kommen kann

**Folie 12:** Standardfluss, soll nur ablaufen, wenn keine Option · übereinstimmt · Token soll immer · rausgehen · In der Literatur ist oftmals ohne Bemerkung · -> wird auch immer ausgeführt · -> Um Verwirrung zu verhindern immer beschriften

**Folie 13:** Es kann sein, · das der schritt · noch nicht · verarbeitet · wurde aber · oben bereits in · den nächsten · gesprungen · wird, dadurch · wird oben vor · unten · ausgeführt · man öffnet einen parallelen Pfad · selbe problematik

**Folie 14:** Hauptpfad ist abgearbeitet, muss aber trotzdem auch im teilprozess warten bis alle token · abgearbeitet sind und geht dann in charge credit card rein

**Folie 15:** Erkennt richtige Anzahl der · Token

**Folie 16:** Möglichkeit beliebig viele Ereignis anzuheften als, auch unterschiedliche an den Rand

**Folie 18:** Ereignis-basiertes Gateway: Wartet auf das was zuerst passiert · -> Nachricht trifft ein oder zeit läuft ab, nimmt dann nur diesen EINEN pfad · Nach diesem Gateway · dürfen auch nur · Ereignisse folgen · Ausnahme · 50% welcher pfad · genommen wird

**Folie 19:** sendende Aufgabe · je nachdem wie der Happy path ist

**Folie 20:** wenn analyse abgebrochen wird · Ende mit versand · Ende ohne nachricht, · aber nachdem · analyzed wurde · Terminator nur einsetzten, wenn man auch wirklich einen · Parallelenpfad hat, auf dem noch ein Token unterwegs ist, welches · eliminiert werden muss

**Folie 21:** weiterer Fall mit Zeitüberwachung · zerstört · nachricht kommt nach 15 sec an · Terminator beendet nur die aktuelle Prozessebene und die untergeordneten Prozessebene

**Folie 22:** könnte schon zu Ende sein, aber · Tokens oben sind noch da, heißt · man braucht Terminator der sie · beendet

**Folie 23:** Transaktion = mehrere Schritte nur zusammen oder keine z.B Überweisung · wieso nehm ich nicht immer transaktionsprozess, wenn er das gleiche kann · -> der Transaktionsteilprozess ist ein hoher Aufwand für eine Process Engine · PE geht rückwärts · durchs logbuch · und führt die · compensationenen · aus indem sie · den assoziationen · folgt · PE muss Protokoll über die Schritte führen · Nicht jeder schritt muss einen Compensations Prozess beinhalten · kombenierte verwendung durch assoziation · Zurückrollen wird nur hier · aktiviert · Abbruchsendereignis, welches nur · im Transaktionsteilprozess sinn · macht · doppelter Rand · kann alles was ein normaler Teilprozess kann · Kompensationsaufgabe

**Folie 24:** Nachträgliches kompensieren · PE bewahrt Logbuch auf

**Folie 25:** WICHTIG · RÜCKWÄRTSABWICKELN · in einem Normalen Teilprozess anwenden von Transaktionskompensation · während des ausführens · nach dem · ausführen des · teilprozesses · service 2 · erfolgreich?

**Folie 26:** Bsp: Versicherung bei Karambolasche, könnte auch Arztbesuch sein · Abarbeitungsreihenfolge ist von vornherein nicht festgelegt, die · Menge an Schritten ist aber nötig zu wissen · Ad-hoc Teilprozess · 3 Attribute! · Verfolgung eines Ziels · Am Anfang alle ohne eingehenden · Sequenzfluss aktiv - 1,3,4,5 · hat 2 Werte · verschwinden aus · • Sequential Tasks · der Liste der anderen · die Teammitgleider an · • Parallel dürfen · den anderen Tasks arbeiten · wenn das Ziel erreicht wurde · 2,3,4,5 sind nach · abschluss von 1 da · bei PARALLEL: kann jeder seperat task annehmen · zusammenhang · falls noch bei parallel eine Task parallel am laufen ist

**Folie 27:** Wann soll ich Teilprozesse hernehmen? · Modularisierung, Zusammenpackung um Prozesse Verständlicher zu machen -> Hirarchie · Modularization to encapsulate certain business/process functionality Fachliche Funktionen zu kapseln · Wiederverwendung aus anderen Prozessen · gemeinsame · Fehlerbehandlung · für Transaktionen · für ad-hoc

**Folie 28:** um etwas hervorzuheben · bewirkt nichts · gibt keine regeln · einsatz zweifelhaft · Datenobjekte überleben · das Ende eines Prozess · nicht · um über das Ende · hinaus Daten zu · speichern

**Folie 29:** Start sollte immer EIN ereignis haben · wegen startereignis · einfacher Kreis · müssen alle · Ereignisse · eintreffen um · den Prozess zu starten · Exklusiver Start · wartet auf das Erste · nur einer danach
