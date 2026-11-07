# Team 2 Materialversorgung – die BPMN-Modelle einfach erklärt

Jeder Weg mit festen Zahlen durchgespielt: Alle Wege mit Beispielen

Nov 6, 2026 · @amaroviccc

Der Prozess sorgt dafür, dass einem Pflegehaushalt ein Verbrauchsprodukt (z. B. Einmalhandschuhe) nicht ausgeht. Er prüft den Vorrat, bestellt rechtzeitig nach – wenn nötig erst nach Freigabe durch den Kunden – und verfolgt die Lieferung, bis sie bestätigt im Bestand angekommen ist.

Es gibt zwei BPMN-Modelle und zwei Tabellen:

- **`T2_Materialversorgung.bpmn`** – der Hauptprozess. Eine Prozessinstanz = ein Vorgang für **ein** Produkt.
- **`T2_Kundenentscheidung_einholen.bpmn`** – ein kleiner wiederverwendbarer Prozess, der den Kunden fragt „Darf ich das machen?“. Den sollen auch Team 1 und 3 benutzen.
- **`T2_Versorgungsprofil.dmn`** und **`T2_Berechtigungsregel.dmn`** – Tabellen mit Werten und Regeln, damit die nicht im Code stecken.

Die Erklärung beschreibt den Entwurf so, wie er im Repo liegt (Commit `6819881`). Was daran falsch oder verbesserungswürdig ist, steht im Review-Dokument; hier geht es nur ums Verstehen.

## Erst die Symbole

Das wichtigste Wort ist **Token**: Stell dir eine Spielfigur vor, die durch das Diagramm läuft. Wo die Figur steht, passiert gerade etwas oder es wird gewartet. Ein Prozess ist zu Ende, wenn keine Figur mehr unterwegs ist. Im Cockpit (`localhost:8080`) siehst du die Figur als blaue Zahl am Element.

| Symbol | So sieht es aus | Was es bedeutet |
| --- | --- | --- |
| Pool | großer Rahmen mit Namen am linken Rand | Ein Beteiligter. Unser Prozess ist ein Pool; App, Lieferant, Team 1 und Team 3 sind zugeklappte Pools („Black Box“): Wir sehen nicht, was die intern tun, nur was sie uns schicken |
| Lane | Streifen innerhalb des Pools | Eine Rolle in unserem Prozess, z. B. „Pflegende Person“ oder „Menschliche Prüfstelle“ |
| Startereignis mit Briefumschlag | dünner Kreis mit Umschlag | Der Prozess startet, wenn eine bestimmte Nachricht ankommt |
| Startereignis ohne Symbol | dünner leerer Kreis | Start ohne besonderen Auslöser (im Teilprozess: „ich werde aufgerufen“) |
| Endereignis | dicker Kreis | Hier endet ein Token. Mit Umschlag: Beim Enden wird eine Nachricht verschickt |
| Zwischenereignis mit Umschlag (weiß) | doppelter Kreis | Das Token wartet hier, bis eine Nachricht ankommt |
| Zwischenereignis mit Umschlag (schwarz) | doppelter Kreis, gefüllter Umschlag | Das Token schickt hier eine Nachricht und läuft sofort weiter |
| Zwischenereignis mit Uhr | doppelter Kreis mit Uhr | Das Token wartet, bis eine Zeit abgelaufen ist |
| Benutzeraufgabe | Rechteck mit Personen-Icon | Ein Mensch muss etwas tun; die Aufgabe erscheint in der Tasklist |
| Serviceaufgabe | Rechteck mit Zahnrädern | Ein Programm erledigt etwas automatisch (hier: der Simulator) |
| Sendeaufgabe | Rechteck mit schwarzem Umschlag | Schickt eine Nachricht an einen anderen Beteiligten |
| Empfangsaufgabe | Rechteck mit weißem Umschlag | Wartet auf eine Nachricht von außen |
| Geschäftsregel-Aufgabe | Rechteck mit Tabellen-Icon | Schaut in einer DMN-Tabelle nach |
| Aufrufaktivität (Call Activity) | Rechteck mit dickem Rand | Ruft einen anderen, eigenständigen Prozess auf und wartet, bis der fertig ist |
| XOR-Gateway | Raute (mit oder ohne X) | Weiche: Das Token nimmt **genau einen** Weg, je nach Bedingung. Mit mehreren Eingängen und einem Ausgang führt es nur Wege zusammen |
| Default-Fluss | Pfeil mit kleinem Schrägstrich | „Alles andere“: wird genommen, wenn keine andere Bedingung passt |
| Ereignisbasiertes Gateway | Raute mit Fünfeck im Kreis | Warten auf mehrere Ereignisse gleichzeitig; was **zuerst** kommt, gewinnt, die anderen verfallen |
| Angeheftetes Ereignis, durchgezogener Rand | Kreis am Rand einer Aufgabe | **Unterbrechend**: Tritt es ein, wird die Aufgabe abgebrochen und das Token läuft hier weiter |
| Angeheftetes Ereignis, gestrichelter Rand | gestrichelter Kreis am Rand | **Nicht unterbrechend**: Die Aufgabe bleibt offen, zusätzlich startet ein zweites Token (z. B. für eine Erinnerung) |
| Sequenzfluss | durchgezogener Pfeil | Reihenfolge innerhalb unseres Prozesses |
| Nachrichtenfluss | gestrichelter Pfeil zwischen Pools | Eine Nachricht zwischen zwei Beteiligten |

Zeitangaben in den Timern sind im ISO-Format: `P3D` = 3 Tage, `PT48H` = 48 Stunden, `PT1M` = 1 Minute, `R2/P1D` = **2-mal**, jeweils nach 1 Tag.

## Überblick

&#91;embedded content: Hauptprozess · 9 Phasen, 7 Enden\]

Lies die Zeichnung von oben nach unten: Das ist der Normalfall. Rechts steigt der Vorgang vorzeitig aus, links kürzt er ab oder springt zurück. Im echten Modell laufen die Phasen von links nach rechts; hier sind sie für die Übersicht untereinander gestellt.

## Wer ist beteiligt

Unser Pool heißt „Pflege-Backoffice: Materialversorgung (Team 2)“. Darin gibt es drei Lanes, außen herum vier zugeklappte Pools. Alle äußeren Partner sind **simuliert** – es wird nichts wirklich bestellt.

| Wer | Art | Was er im Prozess tut |
| --- | --- | --- |
| Pflegende Person | Lane | Meldet den Bestand, entscheidet über Freigaben, bestätigt die Lieferung |
| Pflege-Backoffice (Prozess) | Lane | Alles Automatische: rechnen, Tabellen lesen, Nachrichten schicken, warten |
| Menschliche Prüfstelle | Lane | Ein Mitarbeiter für Fälle, die keine Regel lösen kann (Grenzfälle, Lieferant antwortet nicht, Lieferung falsch) |
| Pflege-App und Prüfplaner | Pool | Startet den Prozess (Prüftermin, Bestandsmeldung, Schwellenwert) und zeigt dem Kunden die Benachrichtigungen an |
| Lieferant (SIMULIERT) | Pool | Bekommt die Bestellung; meldet „bestätigt“, „nicht lieferbar“ oder „zugestellt“ |
| Team 3 (SIMULIERT) | Pool | Erledigt für uns die Kommunikation: nachfassen, mahnen, reklamieren |
| Team 1 (SIMULIERT) | Pool | Bekommt am Ende den Liefernachweis für die Vorgangsakte |

Im Hintergrund führt der Prozess zwei Variablen mit, die man im Cockpit sehen kann: `vorgangsstatus` (z. B. „Wartet auf Kunde“, „Erfolgreich abgeschlossen“ – die Werte kommen aus dem Projekthandbuch 7.2) und `letztesEreignis`. Jedes Ende setzt außerdem `ergebnis` mit einem Satz, warum der Vorgang endete.

## Schritt für Schritt: der Hauptprozess

Der Hauptprozess läuft von links nach rechts durch neun Phasen. Jede Phase hat einen normalen Weg und Ausnahmewege. Die Namen in Anführungszeichen stehen genau so im Modell.

### Phase 1 – Start und Vorgang eröffnen

Ganz links liegen **drei Startereignisse** mit Umschlag. Jedes ist ein anderer Grund, warum der Vorgang beginnt. Alle drei kommen aus dem Pool „Pflege-App und Prüfplaner“.

| Startereignis | Wann | Was mitkommt |
| --- | --- | --- |
| „Bestandsprüfung fällig“ | Ein geplanter Prüftermin ist erreicht | nur die Produkt-ID, **kein** Bestand |
| „Bestandsmeldung eingegangen“ | Die pflegende Person meldet von sich aus ihren Bestand | Produkt-ID **und** Bestand |
| „Schwellenwert unterschritten“ | Ein System hat bemerkt, dass der Vorrat zu niedrig ist | Produkt-ID, Bestand je nachdem |

Egal welcher Start: Die drei Wege laufen in eine Raute zusammen (sie führt nur zusammen, entscheidet nichts) und dann geht es gleich weiter:

1. **„Vorgang eröffnen“** (Serviceaufgabe): vergibt eine Vorgangsnummer wie `VG-T2-2df4b458`. Diese Nummer wird als **Business Key** gesetzt – über sie findet später eine Nachricht vom Lieferanten den richtigen Vorgang. Außerdem wird gemerkt, ob ein Bestand mitgeschickt wurde.
2. **„Versorgungsprofil laden“** (Geschäftsregel-Aufgabe): schaut in der Tabelle `T2_Versorgungsprofil` nach, was für dieses Produkt gilt – Packungsgröße, Zielbestand, Verbrauch pro Tag, Lieferzeit, Preis, alle Fristen. Ein unbekanntes Produkt führt später zu einem Fehler (Incident im Cockpit) statt zu einem falschen Ergebnis.

### Phase 2 – Bestand klären

Raute **„Aktueller Bestand gemeldet?“**:

| Fall | Weg |
| --- | --- |
| **ja** – der Bestand kam schon beim Start mit | direkt weiter zu Phase 3 |
| **nein** (Default) – z. B. beim geplanten Prüftermin | Benutzeraufgabe **„Aktuellen Bestand melden“** für die pflegende Person |

An „Aktuellen Bestand melden“ hängen zwei Uhren:

- **„Erinnerung fällig“** (gestrichelt, nicht unterbrechend): Nach einem Tag, insgesamt zweimal, läuft ein **zweites** Token los zum Ende **„An Bestandsmeldung erinnert“**. Dieses Ende schickt der App eine Erinnerung. Die Aufgabe selbst bleibt offen, das Haupt-Token wartet weiter.
- **„Meldefrist abgelaufen“** (durchgezogen, unterbrechend): Nach 3 Tagen ohne Meldung wird die Aufgabe **abgebrochen**. Das Token läuft zum Ende **„Abgebrochen: Bestand nicht gemeldet“**, der Kunde wird informiert. Status: *Abgebrochen*.

Meldet die Person rechtzeitig (Formular: Bestand, Pflichtfeld; „Bestand unsicher“ als Häkchen), geht es mit Phase 3 weiter.

### Phase 3 – Brauchen wir überhaupt Nachschub?

**„Verbrauch und Reichweite berechnen“** (Serviceaufgabe) rechnet:

- **Reichweite** = Bestand ÷ Verbrauch pro Tag, abgerundet. Beispiel: 20 Stück, 4 pro Tag → 5 Tage.
- **Nötige Reichweite** = Tage bis zur nächsten regulären Prüfung + Lieferzeit. Beispiel: 7 + 3 = 10 Tage.
- **Nachschub nötig**, wenn Reichweite ≤ nötige Reichweite.

Raute **„Reicht der Bestand bis Prüfung + Lieferzeit?“**:

| Fall | Weg |
| --- | --- |
| **ja** (Default) – reicht | **„Nächste Prüfung terminieren“** rechnet das nächste Prüfdatum aus → Ende **„Kunde informiert: kein Bedarf“**. Status: *Erfolgreich abgeschlossen* |
| **nein** – reicht nicht | weiter zu Phase 4, es wird bestellt |

Vorsicht beim Lesen: Die Frage heißt „Reicht der Bestand?“. „Nein“ ist also der Weg, auf dem bestellt wird.

### Phase 4 – Vorschlag machen und prüfen, wer entscheiden darf

Drei Schritte hintereinander, alle automatisch:

1. **„Produkt, Menge und Lieferant vorschlagen“**: Menge = was bis zum Zielbestand fehlt, **aufgerundet auf ganze Packungen**. Beispiel: Ziel 120, Bestand 20 → 100 fehlen → Packung zu 30 → 4 Packungen = 120 Stück. Hat der Kunde vorher eine andere Menge gewünscht (siehe Phase 5, „Änderung“), wird stattdessen seine Wunschmenge auf Packungen aufgerundet.
2. **„Abweichungen prüfen“**: vergleicht den Vorschlag mit dem Versorgungsprofil und sammelt alles, was der Kunde wissen sollte:
   - Ist das Produkt lieferbar? Wenn nicht: auf das hinterlegte **Ersatzprodukt** wechseln. Ist auch das nicht lieferbar: „Fall ungeklärt“.
   - Anderes Produkt oder anderer Lieferant als hinterlegt?
   - **Verbrauchssprung**: Weicht der tatsächlich beobachtete Verbrauch um mehr als 30 % von der Annahme ab?
   - Liegt die Menge über der Höchstmenge?
   - Gesamtpreis = Menge × Stückpreis.

   Daraus entstehen auch die Texte für eine mögliche Freigabe: was gemacht werden soll, warum, und was passiert, wenn man ablehnt.
3. **„Berechtigung prüfen“** (Geschäftsregel-Aufgabe, Tabelle `T2_Berechtigungsregel`): entscheidet, **wer** über die Bestellung entscheiden muss. Ergebnis ist eins von drei Wörtern (die Regel steht unten im Abschnitt zu den Tabellen).

Raute **„Freigabeweg?“**:

| Ergebnis | Wann (vereinfacht) | Weg |
| --- | --- | --- |
| **automatisch** | keine Abweichung und höchstens 40 EUR | direkt zu Phase 6, bestellen |
| **Kundenfreigabe** | über 40 EUR oder eine Abweichung mit Folgen für den Kunden | Phase 5, den Kunden fragen |
| **Prüfstelle** (Default) | Fall ungeklärt, z. B. weder Produkt noch Ersatz lieferbar | Benutzeraufgabe **„Grenzfall prüfen“** |

**„Grenzfall prüfen“** (Lane Menschliche Prüfstelle): Der Mitarbeiter wählt ein Ergebnis und schreibt eine Notiz (beides Pflicht). Raute **„Prüfergebnis?“**:

| Wahl | Weg |
| --- | --- |
| **Kunde entscheidet** | weiter zu Phase 5 – der Kunde soll selbst entscheiden |
| **nicht lösbar** (Default) | Ende **„Übergeben: Grenzfall nicht lösbar“**. Status: *Übergeben* |

### Phase 5 – Den Kunden fragen

**„Kundenentscheidung einholen“** ist eine **Aufrufaktivität** (dicker Rand). Das Token im Hauptprozess bleibt hier stehen, während der kleine Prozess `T2_Kundenentscheidung_einholen` läuft (genauer erklärt im eigenen Abschnitt weiter unten). Mitgegeben werden: was gemacht werden soll, Begründung, Folgen, Gültigkeit, Fristen. Zurück kommt **`entscheidung`** mit einem von fünf Werten, ggf. eine Wunschmenge und ein Kommentar.

Raute **„Entscheidung des Kunden?“**:

| Entscheidung | Weg |
| --- | --- |
| **FREIGEGEBEN** | weiter zu Phase 6, bestellen |
| **AENDERUNG** („Änderung gewünscht“) | **zurück** zu „Produkt, Menge und Lieferant vorschlagen“ mit der Wunschmenge. Danach wird alles neu geprüft – liegt die neue Menge unter 40 EUR, wird ohne zweite Frage automatisch bestellt |
| **ABGELEHNT**, **AUFSCHUB** oder **KEINE\_ANTWORT** (alle drei über den Default) | Ende **„Kunde informiert: keine Bestellung“**. Der Kunde bekommt eine Nachricht, bis wann sein Vorrat voraussichtlich reicht. Status: *Erfolglos abgeschlossen* |

Wichtig: **Keine Antwort ist keine Freigabe.** Antwortet der Kunde nicht rechtzeitig, wird nicht bestellt.

### Phase 6 – Bestellen und auf den Lieferanten warten

Von „automatisch“ und von „FREIGEGEBEN“ laufen die Wege in eine Raute zusammen (setzt den Status *Freigegeben*). Dann:

1. **„Bestellung simuliert übermitteln“** (Sendeaufgabe): schickt die Bestellung an den Lieferanten (Nachrichtenpfeil „Bestellung“). Status: *In Ausführung*.
2. Eine weitere Raute führt nur zusammen (dorthin kommt das Token auch nach dem Nachfassen zurück).
3. **Ereignisbasiertes Gateway „Antwort des Lieferanten?“**. Status: *Wartet auf Gegenstelle*. Das Token wartet jetzt auf **drei Dinge gleichzeitig**. Was zuerst passiert, gewinnt; die anderen beiden sind dann vergessen.

| Was zuerst passiert | Weg |
| --- | --- |
| Nachricht **„Bestellung bestätigt“** vom Lieferanten | weiter zu Phase 7 (Zustellung abwarten) |
| Nachricht **„Nicht lieferbar gemeldet“** vom Lieferanten | Auf dem Pfeil wird gemerkt „Produkt nicht verfügbar“, und der Nachfass-Zähler wird auf 0 gesetzt. Dann **zurück zu „Abweichungen prüfen“** (Phase 4). Dort wird auf das Ersatzprodukt gewechselt – ein Produktwechsel ist eine Abweichung mit Folgen, also muss der Kunde neu freigeben. Ist schon das Ersatzprodukt nicht lieferbar, wird der Fall ungeklärt → Prüfstelle |
| Uhr **„Bestätigungsfrist abgelaufen“** (48 Stunden, beim Testprodukt 1 Minute) | Raute **„Nachfassen noch möglich?“** (siehe unten) |

Raute **„Nachfassen noch möglich?“** – gefragt wird: Wurde seltener nachgefasst als erlaubt (`maxNachfassen`, normal 2)?

| Fall | Weg |
| --- | --- |
| **ja** | **„Beim Lieferanten nachfassen (über Team 3)“** (Sendeaufgabe) – Team 3 erinnert den Lieferanten. Dann **zurück** vor das ereignisbasierte Gateway: Es wird wieder auf die drei Dinge gewartet, die Uhr läuft neu. Der Zähler wird um 1 erhöht |
| **nein** (Default) – genug nachgefasst | Benutzeraufgabe **„Ausbleibende Lieferantenantwort klären“** (Prüfstelle) |

Bei **„Ausbleibende Lieferantenantwort klären“** wählt der Mitarbeiter (mit Pflicht-Notiz), Raute **„Ergebnis?“**:

| Wahl | Weg |
| --- | --- |
| **Alternativlieferant** | Auf dem Pfeil wird der Lieferant auf den hinterlegten Alternativlieferanten umgestellt und der Zähler auf 0 gesetzt. Dann **zurück zu „Abweichungen prüfen“**: Lieferantenwechsel = Abweichung → Kunde muss neu freigeben, danach wird beim neuen Lieferanten bestellt |
| **beenden** (Default) | Ende **„Erfolglos: Lieferant antwortet nicht“**. Status: *Erfolglos abgeschlossen* |

Ein Beispiel für eine Schleife: bestellt → 48 h nichts → nachfassen → 48 h nichts → nachfassen → 48 h nichts → Zähler steht auf 2 = Maximum → Prüfstelle.

### Phase 7 – Auf die Zustellung warten

Nach der Bestätigung landet das Token (über eine zusammenführende Raute) bei der Empfangsaufgabe **„Auf Zustellmeldung warten“**. Es wartet, bis der Lieferant meldet „zugestellt“. Daran hängen zwei Uhren:

- **„Lieferfrist überschritten“** (gestrichelt, nicht unterbrechend, alle 2 Tage, zweimal): Ein zweites Token läuft zu **„Lieferung anmahnen (über Team 3)“** und dann zum Ende **„Mahnung versandt“**. Das Warten geht weiter.
- **„Lieferung endgültig ausgeblieben“** (durchgezogen, unterbrechend, nach 10 Tagen): Das Warten wird abgebrochen. Auf dem Pfeil wird „nicht geliefert“ eingetragen, und das Token springt direkt zu **„Lieferabweichung klären“** (Phase 8, Prüfstelle).

Kommt die Zustellmeldung: weiter zu Phase 8.

### Phase 8 – Lieferung prüfen

Benutzeraufgabe **„Lieferung prüfen und bestätigen“** für die pflegende Person. Status: *Wartet auf Kunde*. Sie wählt, wie die Lieferung angekommen ist, und kann die tatsächlich gelieferte Menge eintragen:

- KORREKT – richtig und vollständig
- TEILLIEFERUNG – nur ein Teil kam an
- FALSCHLIEFERUNG – etwas Falsches kam an
- NICHT\_GELIEFERT – nichts kam an

An der Aufgabe hängt **„Erinnerung fällig“** (gestrichelt, alle 2 Tage, dreimal) → Ende **„An Lieferbestätigung erinnert“**: Der Kunde wird erinnert, die Aufgabe bleibt offen. Eine Uhr, die die Aufgabe irgendwann abbricht, gibt es nicht – eine unbestätigte Lieferung wird nie automatisch als erfolgreich abgeschlossen.

Raute **„Lieferung korrekt?“**:

| Fall | Weg |
| --- | --- |
| **ja** (KORREKT) | weiter zu Phase 9 |
| **nein** (Default, alle anderen drei) | **„Lieferabweichung erfassen“** (hält fest, was fehlt) → **„Abweichung an Lieferanten melden (über Team 3)“** (Reklamation) → **„Lieferabweichung klären“** |

**„Lieferabweichung klären“** (Prüfstelle) erreicht man also auf zwei Wegen: über diese Reklamation oder direkt aus Phase 7, wenn die Lieferung endgültig ausgeblieben ist. Der Mitarbeiter wählt (Notiz Pflicht, gelieferte Menge optional), Raute **„Klärungsergebnis?“**:

| Wahl | Weg |
| --- | --- |
| **Nachlieferung** | **zurück zu „Auf Zustellmeldung warten“** (Phase 7): Der Lieferant liefert nach, es wird erneut auf die Zustellung gewartet und danach erneut geprüft |
| **Teilmenge übernehmen** | Man akzeptiert, was gekommen ist → Phase 9; der Bestand wird nur um die gelieferte Menge erhöht |
| **nicht lösbar** (Default) | Ende **„Übergeben: Lieferabweichung offen“**. Status: *Übergeben* |

### Phase 9 – Bestand fortschreiben und abschließen

1. **„Bestand und Verbrauch fortschreiben“**: neuer Bestand = alter Bestand + gelieferte Menge (oder die Bestellmenge, wenn keine Menge eingetragen wurde). Neue Reichweite und nächstes Prüfdatum werden berechnet.
2. **„Liefernachweis an Team 1 übergeben“** (Sendeaufgabe, Nachrichtenpfeil „Liefernachweis“): Team 1 legt den Beleg in der Vorgangsakte ab.
3. Ende **„Kunde informiert: Lieferung bestätigt“**: Der Kunde bekommt eine Nachricht mit neuem Bestand und nächstem Prüftermin. Status: *Erfolgreich abgeschlossen*.

## Der zweite Prozess: „Kundenentscheidung einholen“

Das ist ein kleiner, eigenständiger Prozess, den der Hauptprozess in Phase 5 aufruft. Er ist absichtlich allgemein gehalten: Er kennt keine Bestellung, sondern nur „eine Handlung, die der Kunde freigeben soll“. Deshalb können ihn auch Team 1 (z. B. eine Einreichung bei der Kasse) und Team 3 benutzen.

**Was hineinkommt** (wird beim Aufruf kopiert – „Call by Value“: Änderungen hier drinnen verändern draußen nichts): was gemacht werden soll, Begründung, Folgen, gültig bis, Frist für die Entscheidung, Erinnerungsrhythmus, Vorgangs- und Haushaltsnummer.

**Was herauskommt**: `entscheidung`, `entscheidungKommentar`, `gewuenschteMenge`.

Der Pool hat zwei Lanes: „Pflegende Person (Kunde)“ und „Pflege-Backoffice (Prozess)“. Der Ablauf:

1. **„Freigabe angefordert“** – leeres Startereignis: Der Prozess wurde aufgerufen.
2. **„Freigabeanforderung anlegen“** (Serviceaufgabe) – vergibt eine Freigabenummer, merkt sich den Zeitpunkt.
3. **„Kunde benachrichtigt“** (schwarzes Umschlag-Zwischenereignis) – schickt dem Kunden über die App „Bitte entscheiden Sie bis …“ und läuft sofort weiter.
4. **„Über Freigabe entscheiden“** (Benutzeraufgabe für den Kunden). Das Formular zeigt Handlung, Begründung, Folgen und Gültigkeit (nur lesen). Der Kunde wählt **Freigeben**, **Ablehnen**, **Ändern** (mit Wunschmenge) oder **Später entscheiden**, Kommentar optional.

An „Über Freigabe entscheiden“ hängen zwei Uhren – dasselbe Muster wie bei der Bestandsmeldung:

| Uhr | Art | Was passiert |
| --- | --- | --- |
| **„Erinnerung fällig“** | gestrichelt, nicht unterbrechend | Zweites Token → Ende **„An offene Freigabe erinnert“**: Erinnerung an den Kunden, die Aufgabe bleibt offen |
| **„Entscheidungsfrist abgelaufen“** | durchgezogen, unterbrechend | Aufgabe wird abgebrochen → **„Keine Antwort dokumentieren“** setzt `entscheidung = KEINE_ANTWORT` |

Hat der Kunde entschieden, läuft das Token zu **„Entscheidung dokumentieren“** (hält Entscheidung und Zeitpunkt fest). Beide Wege laufen in eine Raute zusammen und enden in **„Entscheidung dokumentiert“**. Danach geht es im Hauptprozess bei „Entscheidung des Kunden?“ weiter.

Rechts im Diagramm stehen noch zwei zugeklappte Pools: „Pflege-App“ (bekommt die Benachrichtigungen) und „Aufrufender Prozess (Team 1, 2 oder 3)“ – Letzterer nur zur Erklärung, er hat keinen Nachrichtenpfeil.

## Die zwei Entscheidungstabellen (DMN)

Eine DMN-Tabelle ist wie eine Excel-Tabelle, in der die Engine nachschlägt: links die Eingaben, rechts das Ergebnis. Vorteil: Wer eine Grenze ändern will, ändert die Tabelle, nicht den Code.

### T2\_Versorgungsprofil – „Was gilt für dieses Produkt?“

Eingabe: die Produkt-ID. Es gibt genau eine Zeile pro Produkt („UNIQUE“). Alle Werte sind Projektannahmen, keine echten Daten.

| Produkt-ID | Produkt | Zielbestand / Packung | Verbrauch pro Tag | Lieferzeit + Tage bis Prüfung | Stückpreis | Fristen |
| --- | --- | --- | --- | --- | --- | --- |
| TP-M | Inkontinenzmaterial Testprodukt M | 120 / 30 | 4 | 3 + 7 | 0,45 EUR | normal (Tage) |
| TP-HS | Einmalhandschuhe Größe M | 300 / 100 | 10 | 2 + 14 | 0,08 EUR | normal (Tage) |
| TP-SCHNELL | wie TP-M, nur zum Testen | 120 / 30 | 4 | 3 + 7 | 0,45 EUR | Minuten statt Tage |

Dazu kommen pro Produkt: Ersatzprodukt, Alternativlieferant und dessen Preis, Höchstmenge, Schwelle für den Verbrauchssprung (30 %), alle Erinnerungs- und Fristwerte, maximale Zahl der Nachfass-Versuche.

### T2\_Berechtigungsregel – „Wer muss entscheiden?“

Eingaben: Art der Handlung, Betrag, „Fall ungeklärt?“, „Abweichung mit Folgen?“. Die Engine liest von **oben nach unten** und nimmt die **erste** passende Zeile („FIRST“). Die Reihenfolge ist also wichtig.

| Nr. | Wenn … | dann … |
| --- | --- | --- |
| 1 | Fall ungeklärt | **PRUEFSTELLE** – keine Regel erfinden, ein Mensch entscheidet |
| 2 | Abweichung mit Folgen für den Kunden | **KUNDENFREIGABE** |
| 3 | Bestellung bis 40 EUR | **AUTOMATISCH** |
| 4 | Bestellung über 40 EUR | **KUNDENFREIGABE** |
| 5 | Einreichung (für Team 1) | **KUNDENFREIGABE** |
| 6 | Ersatzversorgung (für Team 3) | **KUNDENFREIGABE** |
| 7 | alles andere | **KUNDENFREIGABE** – sicherheitshalber |

Zeilen 5 und 6 sind für die anderen Teams da: Die Tabelle soll nicht nur für Bestellungen funktionieren.

## Alle Enden auf einen Blick

Ein Vorgang kann auf **sieben** Arten zu Ende gehen. Daneben gibt es Endereignisse, an denen nur ein Neben-Token (Erinnerung, Mahnung) endet – der Vorgang läuft dort weiter.

**Echte Enden des Vorgangs (Hauptprozess):**

| Ende | Phase | Status | Kunde bekommt Nachricht? |
| --- | --- | --- | --- |
| „Kunde informiert: Lieferung bestätigt“ | 9 | Erfolgreich abgeschlossen | ja |
| „Kunde informiert: kein Bedarf“ | 3 | Erfolgreich abgeschlossen | ja |
| „Kunde informiert: keine Bestellung“ | 5 | Erfolglos abgeschlossen | ja |
| „Erfolglos: Lieferant antwortet nicht“ | 6 | Erfolglos abgeschlossen | nein |
| „Abgebrochen: Bestand nicht gemeldet“ | 2 | Abgebrochen | ja |
| „Übergeben: Grenzfall nicht lösbar“ | 4 | Übergeben | nein |
| „Übergeben: Lieferabweichung offen“ | 8 | Übergeben | nein |

**Enden von Neben-Token (der Vorgang läuft weiter):**

| Ende | Woher | Was passiert |
| --- | --- | --- |
| „An Bestandsmeldung erinnert“ | Erinnerung an „Aktuellen Bestand melden“ | Erinnerung an den Kunden |
| „Mahnung versandt“ | Uhr an „Auf Zustellmeldung warten“ | Team 3 mahnt beim Lieferanten |
| „An Lieferbestätigung erinnert“ | Erinnerung an „Lieferung prüfen und bestätigen“ | Erinnerung an den Kunden |
| „An offene Freigabe erinnert“ (Teilprozess) | Erinnerung an „Über Freigabe entscheiden“ | Erinnerung an den Kunden |

Das Ende **„Entscheidung dokumentiert“** im Teilprozess beendet nur den Teilprozess. Das Token im Hauptprozess läuft danach bei „Entscheidung des Kunden?“ weiter.

## Ein Durchlauf mit echten Zahlen

So läuft die Leitgeschichte aus dem Teamauftrag (Abschnitt 9). Genau diesen Durchlauf habe ich heute auf CIB seven ausgeführt; er endet mit Bestand 140 und einem Nachfassen.

| # | Wo das Token steht | Was passiert |
| --- | --- | --- |
| 1 | „Bestandsmeldung eingegangen“ | Die App meldet: Produkt TP-SCHNELL, Bestand 20 |
| 2 | „Vorgang eröffnen“ | Vorgangsnummer `VG-T2-…` wird vergeben |
| 3 | „Versorgungsprofil laden“ | Ziel 120, Packung 30, 4 pro Tag, Lieferzeit 3, nächste Prüfung in 7 Tagen, 0,45 EUR/Stück |
| 4 | „Aktueller Bestand gemeldet?“ | ja (20 kam mit) |
| 5 | „Verbrauch und Reichweite berechnen“ | 20 ÷ 4 = 5 Tage Reichweite; nötig 7 + 3 = 10 Tage |
| 6 | „Reicht der Bestand …?“ | nein (5 < 10) → bestellen |
| 7 | „Produkt, Menge und Lieferant vorschlagen“ | 100 fehlen → 4 Packungen = 120 Stück |
| 8 | „Abweichungen prüfen“ | keine Abweichung; 120 × 0,45 = 54 EUR |
| 9 | „Berechtigung prüfen“ | Zeile 4: über 40 EUR → KUNDENFREIGABE |
| 10 | „Kundenentscheidung einholen“ | Teilprozess startet, Kunde wird benachrichtigt; Aufgabe „Über Freigabe entscheiden“ → Kunde klickt **Freigeben** |
| 11 | „Entscheidung des Kunden?“ | FREIGEGEBEN |
| 12 | „Bestellung simuliert übermitteln“ | Bestellung geht an den Lieferanten |
| 13 | „Antwort des Lieferanten?“ | Es wird gewartet … nach 1 Minute läuft die Uhr ab |
| 14 | „Nachfassen noch möglich?“ | 0 von 1 Versuch genutzt → ja |
| 15 | „Beim Lieferanten nachfassen“ | Team 3 erinnert den Lieferanten; Zähler = 1 |
| 16 | wieder „Antwort des Lieferanten?“ | Diesmal kommt „Bestellung bestätigt“ |
| 17 | „Auf Zustellmeldung warten“ | Der Lieferant meldet „zugestellt“ |
| 18 | „Lieferung prüfen und bestätigen“ | Kunde wählt **richtig und vollständig** |
| 19 | „Lieferung korrekt?“ | ja |
| 20 | „Bestand und Verbrauch fortschreiben“ | 20 + 120 = 140 Stück, reicht 35 Tage |
| 21 | „Liefernachweis an Team 1 übergeben“ | Beleg geht an Team 1 |
| 22 | „Kunde informiert: Lieferung bestätigt“ | Ende, *Erfolgreich abgeschlossen* |

Zwei kurze Gegenbeispiele:

- **TP-HS, Bestand 50**: 5 Tage Reichweite, nötig 16 → bestellen; 250 fehlen → 3 Packungen = 300 Stück × 0,08 = 24 EUR → Zeile 3: AUTOMATISCH. Der Kunde wird gar nicht gefragt.
- **TP-M, Bestand 100**: 25 Tage Reichweite, nötig 10 → reicht → „Kunde informiert: kein Bedarf“.
