# Alle Wege mit Beispielen

Jeder mögliche Weg durch den Hauptprozess ist hier einmal mit festen Zahlen durchgespielt. Alle Beträge, Mengen und Nachrichtentexte sind mit dem echten `simulator/handlers.js` aus dem Repo nachgerechnet; die Bestellbeträge für TP-SCHNELL wurden zusätzlich auf CIB seven ausgeführt.

## So liest du die Beispiele

- **Tag 0 = Freitag, 6. November 2026.** Alle Daten rechnen von diesem Tag aus.
- Die Beispiele nutzen die **echten Fristen** von TP-M und TP-HS (Tage). Zum Testen auf CIB seven nimmst du TP-SCHNELL: gleiche Rechnung wie TP-M, aber Minuten statt Tage.
- Jede Tabelle zeigt: wo das Token steht → was passiert → welche Werte entstehen.
- **„Profil Zeile 1/2“** und **„Regel Zeile 1–7“** verweisen auf die Zeilen in den DMN-Tabellen (Spickzettel direkt darunter).

### Spickzettel 1 – `T2_Versorgungsprofil.dmn`

| Wert im Profil | Profil Zeile 1: TP-M | Profil Zeile 2: TP-HS |
| --- | --- | --- |
| Produkt | Inkontinenzmaterial Testprodukt M | Einmalhandschuhe Testprodukt Größe M |
| Ersatzprodukt | … M, Variante B | … Größe M, andere Marke |
| Lieferant / Alternativlieferant | Versorgungsdienst Beispiel / Versorgungsdienst Alternativ | gleich |
| Packungsgröße | 30 | 100 |
| Zielbestand | 120 | 300 |
| Höchstmenge | 150 | 400 |
| Verbrauch pro Tag (Annahme) | 4 | 10 |
| Lieferzeit | 3 Tage | 2 Tage |
| Tage bis zur nächsten Prüfung | 7 | 14 |
| → nötige Reichweite (Prüfung + Lieferzeit) | **10 Tage** | **16 Tage** |
| Stückpreis / beim Alternativlieferanten | 0,45 / 0,50 EUR | 0,08 / 0,09 EUR |
| Schwelle Verbrauchssprung | 30 % | 30 % |
| Erinnerung Bestand und Freigabe | 2×, je nach 1 Tag | gleich |
| Frist Bestandsmeldung / Kundenentscheidung | 3 Tage / 3 Tage | gleich |
| Frist Lieferantenbestätigung | 48 Stunden | gleich |
| Nachfassen höchstens | 2× | 2× |
| Mahnung Zustellung | 2×, je nach 2 Tagen | gleich |
| Lieferung endgültig ausgeblieben nach | 10 Tagen | gleich |
| Erinnerung Lieferbestätigung | 3×, je nach 2 Tagen | gleich |

(Profil Zeile 3 ist TP-SCHNELL: wie TP-M, aber Erinnerung 2× nach 30 s, Fristen 2 min, Lieferant 1 min, nur 1× nachfassen, Mahnung nach 1 min, ausgeblieben nach 5 min.)

### Spickzettel 2 – `T2_Berechtigungsregel.dmn`

Gelesen wird von oben, die **erste** passende Zeile gewinnt.

| Regel Zeile | Bedingung | Ergebnis |
| --- | --- | --- |
| 1 | Fall ungeklärt = true | PRUEFSTELLE |
| 2 | Abweichung mit Folgen = true | KUNDENFREIGABE |
| 3 | BESTELLUNG und Betrag ≤ 40 | AUTOMATISCH |
| 4 | BESTELLUNG und Betrag > 40 | KUNDENFREIGABE |
| 5–7 | Einreichung, Ersatzversorgung, sonstiges | KUNDENFREIGABE |

**„Abweichung mit Folgen“** ist wahr, sobald eines davon zutrifft: anderes Produkt (Ersatz), anderer Lieferant, Verbrauchssprung über 30 %, Menge über der Höchstmenge.

## Übersicht: alle Wege

25 Wege, gruppiert nach der Stelle, an der sie sich vom Normalfall trennen. Die Nummer findest du unten als Überschrift wieder.

| Nr. | Weg | Beispiel-Start | Endet in | Status am Ende |
| --- | --- | --- | --- | --- |
| A1 | Bestand reicht | TP-M, Bestand 100 | „Kunde informiert: kein Bedarf“ | Erfolgreich abgeschlossen |
| A2 | Genau an der Grenze | TP-M, Bestand 40 bzw. 44 | bestellen bzw. kein Bedarf | – |
| A3 | Geplante Prüfung, Kunde meldet nach Erinnerung | TP-M, Prüftermin | weiter wie B2 | – |
| A4 | Meldefrist abgelaufen | TP-M, Prüftermin | „Abgebrochen: Bestand nicht gemeldet“ | Abgebrochen |
| B1 | Happy Path automatisch | TP-HS, Bestand 50 | „Kunde informiert: Lieferung bestätigt“ | Erfolgreich abgeschlossen |
| B2 | Happy Path mit Kundenfreigabe | TP-M, Bestand 20 | „Kunde informiert: Lieferung bestätigt“ | Erfolgreich abgeschlossen |
| C1 | Verbrauchssprung | TP-HS, Bestand 50, Verbrauch beobachtet 20 | Kundenfreigabe, dann wie B2 | – |
| C2 | Über Höchstmenge | TP-M, Kunde will 180 Stück | Kundenfreigabe, dann wie B2 | – |
| D1 | Kunde ändert die Menge | TP-M, Bestand 20, Wunsch 60 | automatisch bestellt, dann wie B1 | – |
| D2 | Kunde lehnt ab | TP-M, Bestand 20 | „Kunde informiert: keine Bestellung“ | Erfolglos abgeschlossen |
| D3 | Kunde schiebt auf | TP-M, Bestand 20 | „Kunde informiert: keine Bestellung“ | Erfolglos abgeschlossen |
| D4 | Kunde antwortet nicht | TP-M, Bestand 20 | „Kunde informiert: keine Bestellung“ | Erfolglos abgeschlossen |
| E1 | Nicht lieferbar → Ersatzprodukt | TP-M, Bestand 20 | neue Freigabe, dann wie B2 | – |
| E2 | Ersatz auch nicht lieferbar, Prüfstelle lässt Kunden entscheiden | wie E1 | neue Freigabe | – |
| E3 | Ersatz auch nicht lieferbar, nicht lösbar | wie E1 | „Übergeben: Grenzfall nicht lösbar“ | Übergeben |
| E4 | Lieferant schweigt, Nachfassen hilft | TP-M, Bestand 20 | weiter wie B2 | – |
| E5 | Lieferant schweigt endgültig → Alternativlieferant | TP-M, Bestand 20 | neue Freigabe, dann wie B2 | – |
| E6 | Lieferant schweigt endgültig → beenden | TP-M, Bestand 20 | „Erfolglos: Lieferant antwortet nicht“ | Erfolglos abgeschlossen |
| F1 | Zustellung verspätet, Mahnung | TP-M, Bestand 20 | weiter wie B2 | – |
| F2 | Lieferung endgültig ausgeblieben | TP-M, Bestand 20 | Prüfstelle: Nachlieferung oder Übergabe | – |
| F3 | Teillieferung, Teilmenge übernehmen | TP-M, 60 statt 120 geliefert | „Kunde informiert: Lieferung bestätigt“ | Erfolgreich abgeschlossen |
| F4 | Falschlieferung, Nachlieferung | TP-M | „Kunde informiert: Lieferung bestätigt“ | Erfolgreich abgeschlossen |
| F5 | Lieferabweichung nicht lösbar | TP-M | „Übergeben: Lieferabweichung offen“ | Übergeben |
| F6 | Kunde bestätigt die Lieferung nie | TP-M | bleibt offen | Wartet auf Kunde |
| G1 | Unbekanntes Produkt | Produkt „GIBTSNICHT“ | Fehler im Cockpit | – |

Wege mit „–“ enden nicht selbst, sondern laufen in einen anderen Weg weiter.

## Gruppe A – Start und Bestand

### A1 – Bestand reicht: kein Bedarf

Die pflegende Person meldet am Fr 6. Nov. über die App: TP-M, Bestand 100.

| Token bei | Was passiert | Werte |
| --- | --- | --- |
| „Bestandsmeldung eingegangen“ | Startnachricht von der App | `produktId` = TP-M, `bestand` = 100 |
| „Vorgang eröffnen“ | Vorgangsnummer vergeben, Bestand ist bekannt | `vorgangId` = VG-T2-…, `bestandBekannt` = true |
| „Versorgungsprofil laden“ | **Profil Zeile 1** | Verbrauch 4, Prüfung in 7, Lieferzeit 3 |
| „Aktueller Bestand gemeldet?“ | ja | – |
| „Verbrauch und Reichweite berechnen“ | 100 ÷ 4 = 25 Tage; nötig 7 + 3 = 10 | `nachversorgungNoetig` = false |
| „Reicht der Bestand …?“ | ja (Default) | – |
| „Nächste Prüfung terminieren“ | Tag 0 + 7 Tage | `naechstePruefungAm` = 2026-11-13 |
| „Kunde informiert: kein Bedarf“ | Nachricht an die App | „Ihr Vorrat reicht ca. 25 Tage. Nächste Prüfung am 2026-11-13.“ |

Status: *Erfolgreich abgeschlossen*. Keine Nachricht an Lieferant, Team 1 oder Team 3.

### A2 – Genau an der Grenze

Die Bedingung lautet „Reichweite **kleiner oder gleich** nötige Reichweite“, und die Reichweite wird **abgerundet**. Bei TP-M (nötig 10 Tage):

| Bestand | Reichweite | Ergebnis |
| --- | --- | --- |
| 44 | 44 ÷ 4 = 11 | 11 > 10 → reicht → wie A1, Nachricht „… reicht ca. 11 Tage“ |
| 43 | 43 ÷ 4 = 10,75 → 10 | 10 ≤ 10 → bestellen |
| 40 | 40 ÷ 4 = 10 | 10 ≤ 10 → bestellen |

### A3 – Geplante Prüfung, Kunde meldet nach einer Erinnerung

Der Prüfplaner startet am Fr 6. Nov. eine Prüfung für TP-M. Es kommt **kein** Bestand mit.

| Token bei | Was passiert | Werte |
| --- | --- | --- |
| „Bestandsprüfung fällig“ | Startnachricht, nur Produkt-ID | `produktId` = TP-M |
| „Vorgang eröffnen“ | kein Bestand bekannt | `bestandBekannt` = false |
| „Versorgungsprofil laden“ | **Profil Zeile 1** | – |
| „Aktueller Bestand gemeldet?“ | nein (Default) | – |
| „Aktuellen Bestand melden“ | Aufgabe in der Tasklist der pflegenden Person | Status *Wartet auf Kunde* |
| Sa 7. Nov.: „Erinnerung fällig“ | gestrichelte Uhr feuert, **zweites Token** läuft zum Ende „An Bestandsmeldung erinnert“ | App: „Bitte melden Sie den aktuellen Bestand von Inkontinenzmaterial Testprodukt M.“ |
| Sa 7. Nov., später | Kunde trägt 30 ein; die zweite Erinnerung und die Frist verfallen | `bestand` = 30 |
| „Verbrauch und Reichweite berechnen“ | 30 ÷ 4 = 7 Tage; nötig 10 | bestellen |
| „Produkt, Menge … vorschlagen“ | 120 − 30 = 90 fehlen = 3 Packungen | `bestellmenge` = 90 |
| „Abweichungen prüfen“ | keine; 90 × 0,45 | `betrag` = 40,50 EUR |
| „Berechtigung prüfen“ | **Regel Zeile 4** (40,50 > 40, ganz knapp) | KUNDENFREIGABE |

Weiter wie B2 ab „Kundenentscheidung einholen“.

### A4 – Meldefrist abgelaufen

Wie A3, aber die pflegende Person reagiert gar nicht.

| Zeitpunkt | Was passiert | Nachricht an die App |
| --- | --- | --- |
| Fr 6. Nov. | Aufgabe „Aktuellen Bestand melden“ entsteht | – |
| Sa 7. Nov. | Erinnerung 1 (Neben-Token → „An Bestandsmeldung erinnert“) | „Bitte melden Sie den aktuellen Bestand …“ |
| So 8. Nov. | Erinnerung 2, danach keine weitere (`R2` = zweimal) | „Bitte melden Sie den aktuellen Bestand …“ |
| Mo 9. Nov. | **„Meldefrist abgelaufen“** (3 Tage, durchgezogen): Aufgabe wird abgebrochen | – |
| „Abgebrochen: Bestand nicht gemeldet“ | Ende mit Nachricht | „Ohne Bestandsmeldung wurde die Nachversorgung von Inkontinenzmaterial Testprodukt M beendet.“ |

Status: *Abgebrochen*, `ergebnis` = „Bestand trotz Erinnerung nicht gemeldet“. Insgesamt sind drei Token gelaufen: das Haupt-Token und zwei Erinnerungs-Token.

## Gruppe B – Happy Paths

### B1 – Automatisch bestellt (ohne den Kunden zu fragen)

Die pflegende Person meldet am Fr 6. Nov.: TP-HS (Handschuhe), Bestand 50.

| Token bei | Was passiert | Werte |
| --- | --- | --- |
| „Bestandsmeldung eingegangen“ | Start | `produktId` = TP-HS, `bestand` = 50 |
| „Vorgang eröffnen“ | – | `vorgangId` = VG-T2-… |
| „Versorgungsprofil laden“ | **Profil Zeile 2** | Verbrauch 10, Prüfung in 14, Lieferzeit 2, Ziel 300, Packung 100, 0,08 EUR |
| „Verbrauch und Reichweite berechnen“ | 50 ÷ 10 = 5 Tage; nötig 14 + 2 = 16 | Vorrat endet ca. 2026-11-11 |
| „Reicht der Bestand …?“ | nein | – |
| „Produkt, Menge und Lieferant vorschlagen“ | 300 − 50 = 250 fehlen → aufgerundet 3 Packungen | `bestellmenge` = 300 |
| „Abweichungen prüfen“ | nichts Auffälliges; 300 × 0,08 | `betrag` = 24 EUR, Abweichung mit Folgen = false |
| „Berechtigung prüfen“ | Zeile 1 nein, Zeile 2 nein, **Regel Zeile 3** (24 ≤ 40) | AUTOMATISCH |
| „Freigabeweg?“ | automatisch → Phase 6 | Status *Freigegeben* |
| „Bestellung simuliert übermitteln“ | **Nachricht an den Lieferanten** | `bestellId` = BE-SIM-…, Status *In Ausführung* |
| „Antwort des Lieferanten?“ | Sa 7. Nov.: „Bestellung bestätigt“ kommt (vor Ablauf der 48 h) | Status *Wartet auf Gegenstelle* |
| „Auf Zustellmeldung warten“ | Mo 9. Nov.: Lieferant meldet „zugestellt“ | – |
| „Lieferung prüfen und bestätigen“ | Kunde wählt KORREKT | `lieferErgebnis` = KORREKT |
| „Lieferung korrekt?“ | ja | – |
| „Bestand und Verbrauch fortschreiben“ | 50 + 300 = 350; 350 ÷ 10 = 35 Tage; Mo 9. Nov. + 14 | `bestand` = 350, `naechstePruefungAm` = 2026-11-23 |
| „Liefernachweis an Team 1 übergeben“ | **Nachricht an Team 1** | `dokumentId` = DK-SIM-… |
| „Kunde informiert: Lieferung bestätigt“ | Nachricht an die App | „Lieferung bestätigt. Neuer Bestand: 350, reicht ca. 35 Tage. Nächste Prüfung am 2026-11-23.“ |

Status: *Erfolgreich abgeschlossen*. Der Kunde wurde nur am Anfang (Meldung) und am Ende (Bestätigung) gebraucht.

### B2 – Mit Kundenfreigabe (die Leitgeschichte)

Die pflegende Person meldet am Fr 6. Nov.: TP-M, Bestand 20.

| Token bei | Was passiert | Werte |
| --- | --- | --- |
| Start bis „Versorgungsprofil laden“ | wie B1, aber **Profil Zeile 1** | Verbrauch 4, nötig 10 Tage |
| „Verbrauch und Reichweite berechnen“ | 20 ÷ 4 = 5 Tage < 10 | Vorrat endet ca. 2026-11-11 |
| „Produkt, Menge … vorschlagen“ | 120 − 20 = 100 → aufgerundet 4 Packungen à 30 | `bestellmenge` = 120 |
| „Abweichungen prüfen“ | keine; 120 × 0,45 | `betrag` = 54 EUR |
| „Berechtigung prüfen“ | **Regel Zeile 4** (54 > 40) | KUNDENFREIGABE |
| „Kundenentscheidung einholen“ | Teilprozess startet; Hauptprozess wartet | Status *Wartet auf Kunde* |
| → im Teilprozess: „Freigabeanforderung anlegen“ | Freigabenummer | `freigabeId` = FR-SIM-… |
| → „Kunde benachrichtigt“ | Nachricht an die App | „Bitte entscheiden Sie bis 2026-11-11: Bestellung von 120 Stück Inkontinenzmaterial Testprodukt M bei Versorgungsdienst Beispiel (SIMULIERT) für 54 EUR“ |
| → „Über Freigabe entscheiden“ | Fr 6. Nov. abends: Kunde wählt **Freigeben** | `entscheidung` = FREIGEGEBEN |
| → „Entscheidung dokumentieren“ → „Entscheidung dokumentiert“ | Teilprozess endet, Ergebnis geht zurück | `letztesEreignis` = Freigabe erteilt |
| „Entscheidung des Kunden?“ | freigegeben | – |
| „Bestellung simuliert übermitteln“ | **Nachricht an den Lieferanten** | `bestellId` = BE-SIM-… |
| „Antwort des Lieferanten?“ | Sa 7. Nov.: „Bestellung bestätigt“ | – |
| „Auf Zustellmeldung warten“ | Mo 9. Nov.: „zugestellt“ | – |
| „Lieferung prüfen und bestätigen“ | KORREKT | – |
| „Bestand und Verbrauch fortschreiben“ | 20 + 120 = 140; 140 ÷ 4 = 35 Tage; Mo 9. Nov. + 7 | `bestand` = 140, `naechstePruefungAm` = 2026-11-16 |
| „Liefernachweis an Team 1 übergeben“ | **Nachricht an Team 1** | `dokumentId` = DK-SIM-… |
| „Kunde informiert: Lieferung bestätigt“ | Nachricht an die App | „Lieferung bestätigt. Neuer Bestand: 140, reicht ca. 35 Tage. Nächste Prüfung am 2026-11-16.“ |

Status: *Erfolgreich abgeschlossen*.

## Gruppe C – Abweichungen

Hier kostet die Bestellung zwar wenig, aber etwas weicht vom Profil ab. Dann greift **Regel Zeile 2** – sie steht *vor* der 40-EUR-Regel, deshalb muss der Kunde trotzdem freigeben.

### C1 – Verbrauchssprung

Wie B1 (TP-HS, Bestand 50), aber die App schickt zusätzlich mit: Der tatsächlich beobachtete Verbrauch ist 20 pro Tag statt der angenommenen 10.

| Token bei | Was passiert | Werte |
| --- | --- | --- |
| „Bestandsmeldung eingegangen“ | Start | `bestand` = 50, `verbrauchBeobachtetProTag` = 20 |
| „Verbrauch und Reichweite berechnen“ | rechnet weiter mit der **Annahme** aus dem Profil: 50 ÷ 10 = 5 Tage | bestellen |
| „Produkt, Menge … vorschlagen“ | wie B1 | 300 Stück |
| „Abweichungen prüfen“ | (20 − 10) ÷ 10 = 100 % > 30 % → Verbrauchssprung. Die Menge wird **nicht** still erhöht | `betrag` = 24 EUR, Abweichung mit Folgen = **true** |
| „Berechtigung prüfen“ | Zeile 1 nein, **Regel Zeile 2** ja | KUNDENFREIGABE |
| → „Kunde benachrichtigt“ | Nachricht an die App mit Begründung | „Bestand reicht voraussichtlich nur 5 Tage (bis 2026-11-11). Abweichungen: Verbrauch deutlich verändert: beobachtet 20 statt 10 pro Tag (keine stille Mengenerhöhung).“ |

Danach weiter wie B2 ab „Über Freigabe entscheiden“. Will der Kunde wegen des höheren Verbrauchs mehr, wählt er „Ändern“ (siehe D1).

Gegenprobe: Beobachtet 12 statt 10 = 20 % → unter 30 % → kein Sprung → Regel Zeile 3 → automatisch wie B1.

### C2 – Menge über der Höchstmenge

B2 (TP-M, Bestand 20, 120 Stück für 54 EUR) bis zur ersten Freigabe. Der Kunde wählt **Ändern** und trägt 180 Stück ein.

| Token bei | Was passiert | Werte |
| --- | --- | --- |
| „Über Freigabe entscheiden“ | Kunde: Ändern, 180 | `entscheidung` = AENDERUNG, `gewuenschteMenge` = 180 |
| „Entscheidung des Kunden?“ | Änderung gewünscht → zurück | – |
| „Produkt, Menge … vorschlagen“ | Wunschmenge auf Packungen: 180 ÷ 30 = 6 Packungen | `bestellmenge` = 180; Wunschmenge wird danach gelöscht |
| „Abweichungen prüfen“ | 180 > Höchstmenge 150 (Profil Zeile 1); 180 × 0,45 | `betrag` = 81 EUR, Abweichung mit Folgen = true |
| „Berechtigung prüfen“ | **Regel Zeile 2** | KUNDENFREIGABE – **zweite** Freigabe |
| → „Kunde benachrichtigt“ | neue Anfrage | „Bitte entscheiden Sie bis 2026-11-11: Bestellung von 180 Stück … für 81 EUR“, Begründung: „Menge 180 liegt über der Höchstmenge 150.“ |
| → „Über Freigabe entscheiden“ | Kunde: Freigeben | weiter wie B2 |
| „Bestand und Verbrauch fortschreiben“ | 20 + 180 | `bestand` = 200 |

Ein Wunsch von 170 würde genauso auf 180 aufgerundet (6 Packungen).

## Gruppe D – Kundenentscheidung

Alle vier Wege beginnen wie B2: TP-M, Bestand 20, Vorschlag 120 Stück für 54 EUR, **Regel Zeile 4**, Freigabeanfrage geht am Fr 6. Nov. an die App. Der Kunde sieht im Formular „Über Freigabe entscheiden“:

- **Handlung:** Bestellung von 120 Stück Inkontinenzmaterial Testprodukt M bei Versorgungsdienst Beispiel (SIMULIERT) für 54 EUR
- **Begründung:** Bestand reicht voraussichtlich nur 5 Tage (bis 2026-11-11). Abweichungen: keine. Regel: Betrag über der Grenze für automatische Bestellungen (40 EUR).
- **Folgen:** Freigabe: Bestellung wird simuliert ausgelöst. Ablehnung oder Aufschub: keine Bestellung, Vorrat endet voraussichtlich am 2026-11-11.
- **Gültig bis:** 2026-11-11

### D1 – Kunde ändert die Menge nach unten

| Token bei | Was passiert | Werte |
| --- | --- | --- |
| „Über Freigabe entscheiden“ | Kunde: **Ändern**, 60 Stück, Kommentar „Reicht erstmal“ | `entscheidung` = AENDERUNG, `gewuenschteMenge` = 60 |
| „Entscheidung des Kunden?“ | Änderung gewünscht → zurück zu Phase 4 | – |
| „Produkt, Menge … vorschlagen“ | 60 ÷ 30 = 2 Packungen | `bestellmenge` = 60 |
| „Abweichungen prüfen“ | keine; 60 × 0,45 | `betrag` = 27 EUR |
| „Berechtigung prüfen“ | **Regel Zeile 3** (27 ≤ 40) | AUTOMATISCH – keine zweite Frage |
| weiter wie B1 | Bestellung, Bestätigung, Zustellung, KORREKT | – |
| „Bestand und Verbrauch fortschreiben“ | 20 + 60 = 80; 80 ÷ 4 = 20 Tage | `bestand` = 80 |

Der Kunde hat die 60 Stück selbst gewählt, deshalb gilt das als gewollt (Entscheidung 8 in der README).

### D2 – Kunde lehnt ab

| Token bei | Was passiert | Werte |
| --- | --- | --- |
| „Über Freigabe entscheiden“ | Kunde: **Ablehnen** | `entscheidung` = ABGELEHNT |
| → „Entscheidung dokumentieren“ | – | `letztesEreignis` = Freigabe verweigert oder zurückgegeben |
| „Entscheidung des Kunden?“ | Default („abgelehnt, Aufschub, keine Antwort“) | – |
| „Kunde informiert: keine Bestellung“ | Nachricht an die App | „Keine Bestellung ausgelöst (ABGELEHNT). Achtung: Der Vorrat reicht voraussichtlich nur bis 2026-11-11.“ |

Status: *Erfolglos abgeschlossen*. Keine Nachricht an Lieferant, Team 1 oder Team 3.

### D3 – Kunde schiebt auf

Genau wie D2, nur wählt der Kunde **Später entscheiden**. Nachricht: „Keine Bestellung ausgelöst (AUFSCHUB). Achtung: Der Vorrat reicht voraussichtlich nur bis 2026-11-11.“ Status: *Erfolglos abgeschlossen*. Ein späterer neuer Prüftermin startet einen neuen Vorgang.

### D4 – Kunde antwortet nicht

| Zeitpunkt | Was passiert | Nachricht an die App |
| --- | --- | --- |
| Fr 6. Nov. | Aufgabe „Über Freigabe entscheiden“ entsteht | „Bitte entscheiden Sie bis 2026-11-11: …“ |
| Sa 7. Nov. | Erinnerung 1 → Ende „An offene Freigabe erinnert“ (Neben-Token) | „Erinnerung: Ihre Entscheidung zu ‚Bestellung von 120 Stück … für 54 EUR‘ steht noch aus.“ |
| So 8. Nov. | Erinnerung 2 | dieselbe Erinnerung |
| Mo 9. Nov. | **„Entscheidungsfrist abgelaufen“** (3 Tage): Aufgabe wird abgebrochen → „Keine Antwort dokumentieren“ | – (`entscheidung` = KEINE\_ANTWORT, Kommentar „Frist abgelaufen ohne Rückmeldung“) |
| „Entscheidung des Kunden?“ | Default | – |
| „Kunde informiert: keine Bestellung“ | Ende | „Keine Bestellung ausgelöst (KEINE\_ANTWORT). Achtung: Der Vorrat reicht voraussichtlich nur bis 2026-11-11.“ |

Status: *Erfolglos abgeschlossen*. Keine Antwort ist keine Freigabe.

## Gruppe E – Antwort des Lieferanten

Alle Wege beginnen wie B2: TP-M, Bestand 20, 120 Stück für 54 EUR, Kunde gibt frei. **Die Bestellung geht am Fr 6. Nov. um 20:00 an den Lieferanten.** Ab da wartet das Token am ereignisbasierten Gateway „Antwort des Lieferanten?“ auf drei Dinge: „Bestellung bestätigt“, „Nicht lieferbar gemeldet“ oder 48 Stunden Stille.

### E1 – Nicht lieferbar → Ersatzprodukt

| Token bei | Was passiert | Werte |
| --- | --- | --- |
| „Antwort des Lieferanten?“ | Sa 7. Nov.: Lieferant meldet **„Nicht lieferbar“** – gewinnt, Uhr und Bestätigung verfallen | – |
| Pfeil zurück | Listener auf dem Pfeil | `produktVerfuegbar` = false, `anzahlNachfassen` = 0 |
| „Abweichungen prüfen“ | Produkt nicht verfügbar → hinterlegtes Ersatzprodukt aus **Profil Zeile 1**. Menge bleibt 120; der Preis bleibt 0,45 (das Profil kennt keinen eigenen Ersatzpreis) | `aktuellesProdukt` = … M, Variante B; `betrag` = 54 EUR; Abweichung mit Folgen = true |
| „Berechtigung prüfen“ | **Regel Zeile 2** (Produktwechsel) | KUNDENFREIGABE |
| → „Kunde benachrichtigt“ | neue Freigabeanfrage | „… Abweichungen: Hinterlegte Ersatzoption statt bevorzugtem Produkt: Inkontinenzmaterial Testprodukt M, Variante B.“ |
| → „Über Freigabe entscheiden“ | Kunde: Freigeben | – |
| „Bestellung simuliert übermitteln“ | **zweite Nachricht an den Lieferanten**, jetzt für Variante B | – |

Ab hier wie B2.

### E2 – Ersatz auch nicht lieferbar, Prüfstelle lässt den Kunden entscheiden

Wie E1, aber auch auf die Ersatz-Bestellung antwortet der Lieferant am So 8. Nov. „Nicht lieferbar“.

| Token bei | Was passiert | Werte |
| --- | --- | --- |
| Pfeil zurück | wieder `produktVerfuegbar` = false | – |
| „Abweichungen prüfen“ | Es wird schon das Ersatzprodukt bestellt – einen weiteren Ersatz gibt es nicht | `fallUngeklaert` = true; Abweichungen: „Weder bevorzugtes Produkt noch hinterlegte Ersatzoption lieferbar; …“ |
| „Berechtigung prüfen“ | **Regel Zeile 1** – die steht ganz oben und gewinnt | PRUEFSTELLE |
| „Freigabeweg?“ | Prüfstelle (Default) | – |
| „Grenzfall prüfen“ | Mitarbeiter der Prüfstelle wählt **Kunde entscheidet**, Notiz „Kunde soll entscheiden, ob er auf Lieferbarkeit wartet“ | Status *Klärung erforderlich*, `pruefErgebnis` = KUNDENENTSCHEIDUNG |
| „Prüfergebnis?“ | Kunde entscheidet → „Kundenentscheidung einholen“ | – |
| → Kunde wählt **Ablehnen** | wie D2 | Ende „Kunde informiert: keine Bestellung“ |

Wählt der Kunde hier **Freigeben**, wird Variante B erneut beim selben Lieferanten bestellt – also ein Produkt, das gerade als nicht lieferbar gemeldet wurde. Das steht in der README als offene Frage („Ob nach ‚Kunde entscheidet‘ … überhaupt bestellt werden darf“).

### E3 – Ersatz auch nicht lieferbar, nicht lösbar

Wie E2 bis „Grenzfall prüfen“. Die Prüfstelle wählt **Übergeben**, Notiz „An Pflegeberatung zur Produktauswahl übergeben“.

| Token bei | Was passiert | Werte |
| --- | --- | --- |
| „Prüfergebnis?“ | nicht lösbar (Default) | – |
| „Übergeben: Grenzfall nicht lösbar“ | Ende **ohne** Nachricht an die App | Status *Übergeben*, `ergebnis` = „Grenzfall von Prüfstelle übergeben“ |

### E4 – Lieferant schweigt, Nachfassen hilft

TP-M erlaubt 2× Nachfassen (`maxNachfassen` = 2, Profil Zeile 1). Gefragt wird jedes Mal: Zähler < 2?

| Zeitpunkt | Token bei | Was passiert | Zähler |
| --- | --- | --- | --- |
| Fr 6. Nov. 20:00 | „Antwort des Lieferanten?“ | Bestellung raus, Warten beginnt | 0 |
| So 8. Nov. 20:00 | „Bestätigungsfrist abgelaufen“ | 48 h Stille → „Nachfassen noch möglich?“ 0 < 2 → ja | 0 |
| So 8. Nov. 20:00 | „Beim Lieferanten nachfassen (über Team 3)“ | **Nachricht an Team 3**, dann zurück zum Warten, Uhr startet neu | 1 |
| Di 10. Nov. 20:00 | „Bestätigungsfrist abgelaufen“ | 1 < 2 → ja → **zweite Nachricht an Team 3** | 2 |
| Mi 11. Nov. 10:00 | „Bestellung bestätigt“ | Lieferant antwortet endlich → Phase 7 | 2 |

Ab hier wie B2. Achtung: Kommt die Bestätigung genau in dem Moment, in dem das Token beim Nachfassen liegt, geht sie verloren (Review, Punkt A1).

### E5 – Lieferant schweigt endgültig → Alternativlieferant

Wie E4, aber auch nach dem zweiten Nachfassen kommt nichts.

| Zeitpunkt / Token bei | Was passiert | Werte |
| --- | --- | --- |
| Do 12. Nov. 20:00, „Bestätigungsfrist abgelaufen“ | dritte Stille; „Nachfassen noch möglich?“ 2 < 2 → nein (Default) | – |
| „Ausbleibende Lieferantenantwort klären“ | Prüfstelle wählt **Alternativlieferant**, Notiz „Beispiel-Dienst nicht erreichbar“ | Status *Klärung erforderlich* |
| Pfeil „Alternativlieferant“ | Listener auf dem Pfeil | `aktuellerLieferant` = Versorgungsdienst Alternativ (SIMULIERT), `anzahlNachfassen` = 0 |
| „Abweichungen prüfen“ | Lieferantenwechsel → Alternativpreis aus **Profil Zeile 1**: 120 × 0,50 | `betrag` = 60 EUR, Abweichung mit Folgen = true |
| „Berechtigung prüfen“ | **Regel Zeile 2** | KUNDENFREIGABE |
| → „Kunde benachrichtigt“ | neue Anfrage | „Bestellung von 120 Stück … bei Versorgungsdienst Alternativ (SIMULIERT) für 60 EUR“, „Anderer Lieferant: Versorgungsdienst Alternativ (SIMULIERT)“ |
| → Kunde: Freigeben | **Bestellung an den Alternativlieferanten** | ab hier wie B2 |

Fachlich auffällig: Der Vorrat war schon am 11. Nov. leer, die Freigabe ist also „gültig bis“ einem vergangenen Datum. Geprüft wird das nicht (Review, DMN-Punkt „Gültigkeit der Freigabe“).

### E6 – Lieferant schweigt endgültig → beenden

Wie E5 bis „Ausbleibende Lieferantenantwort klären“. Die Prüfstelle wählt **Beenden**, Notiz „Kein Lieferant verfügbar“.

| Token bei | Was passiert | Werte |
| --- | --- | --- |
| „Ergebnis?“ | beenden (Default) | – |
| „Erfolglos: Lieferant antwortet nicht“ | Ende **ohne** Nachricht an die App | Status *Erfolglos abgeschlossen*, `ergebnis` = „Lieferant hat nicht bestätigt, Vorgang beendet“ |

## Gruppe F – Zustellung und Lieferung

Alle Wege beginnen wie B2: TP-M, Bestand 20, 120 Stück bestellt. **Der Lieferant bestätigt am Sa 7. Nov. um 10:00.** Ab da wartet das Token bei „Auf Zustellmeldung warten“. Die zwei Uhren daran (Profil Zeile 1): Mahnung 2× je nach 2 Tagen, endgültig ausgeblieben nach 10 Tagen.

### F1 – Zustellung verspätet, Mahnung

| Zeitpunkt | Token bei | Was passiert |
| --- | --- | --- |
| Mo 9. Nov. 10:00 | „Lieferfrist überschritten“ (gestrichelt) | Neben-Token → „Lieferung anmahnen (über Team 3)“ → **Nachricht an Team 3** → Ende „Mahnung versandt“. `anzahlMahnungen` = 1. Das Haupt-Token wartet weiter |
| Mi 11. Nov. 10:00 | dieselbe Uhr, zweites Mal | zweite Mahnung über Team 3, `anzahlMahnungen` = 2. Danach keine weitere |
| Do 12. Nov. | „Auf Zustellmeldung warten“ | Lieferant meldet „zugestellt“ |
| Do 12. Nov. | „Lieferung prüfen und bestätigen“ | KORREKT → Bestand 140, nächste Prüfung 2026-11-19 |

Ende wie B2: *Erfolgreich abgeschlossen*.

### F2 – Lieferung endgültig ausgeblieben

Wie F1, aber nach den zwei Mahnungen kommt gar nichts.

| Zeitpunkt / Token bei | Was passiert | Werte |
| --- | --- | --- |
| Di 17. Nov. 10:00, „Lieferung endgültig ausgeblieben“ | 10 Tage um, durchgezogene Uhr: Warten wird abgebrochen | – |
| Pfeil zur Klärung | Listener auf dem Pfeil; „Lieferabweichung erfassen“ und die Reklamation werden **übersprungen** | `lieferErgebnis` = NICHT\_GELIEFERT |
| „Lieferabweichung klären“ | Prüfstelle wählt **Nachlieferung**, Notiz „Lieferant sagt Versand bis 20.11. zu“ | Status *Klärung erforderlich* |
| „Klärungsergebnis?“ | Nachlieferung → zurück zu „Auf Zustellmeldung warten“ | Beide Uhren starten neu: Mahnung ab Do 19. Nov., ausgeblieben am Fr 27. Nov. |
| Fr 20. Nov. | Zustellung, Kunde bestätigt KORREKT | Bestand 140 |

Wählt die Prüfstelle stattdessen **nicht lösbar**: Ende wie F5.

### F3 – Teillieferung, Teilmenge übernehmen

| Token bei | Was passiert | Werte |
| --- | --- | --- |
| „Auf Zustellmeldung warten“ | Mo 9. Nov.: „zugestellt“ | – |
| „Lieferung prüfen und bestätigen“ | Kunde: **Nur teilweise geliefert**, gelieferte Menge 60 | `lieferErgebnis` = TEILLIEFERUNG, `gelieferteMenge` = 60 |
| „Lieferung korrekt?“ | nein (Default) | – |
| „Lieferabweichung erfassen“ | hält fest, was fehlt | `lieferabweichung` = „TEILLIEFERUNG (geliefert: 60 von 120)“, `letztesEreignis` = Lieferung beanstandet |
| „Abweichung an Lieferanten melden (über Team 3)“ | **Nachricht an Team 3** (Beanstandung) | – |
| „Lieferabweichung klären“ | Prüfstelle: **Teilmenge übernehmen**, Menge 60 bleibt, Notiz „Rest kommt mit der nächsten Bestellung“ | `klaerErgebnis` = TEILMENGE\_UEBERNEHMEN |
| „Bestand und Verbrauch fortschreiben“ | 20 + **60** (nicht 120); 80 ÷ 4 = 20 Tage | `bestand` = 80 |
| „Liefernachweis an Team 1 übergeben“ | **Nachricht an Team 1** | – |
| „Kunde informiert: Lieferung bestätigt“ | Nachricht an die App | „Lieferung bestätigt. Neuer Bestand: 80, reicht ca. 20 Tage. Nächste Prüfung am 2026-11-16.“ |

Status: *Erfolgreich abgeschlossen* (laut Teamauftrag eigentlich „Status offen halten“ – siehe Review).

### F4 – Falschlieferung, Nachlieferung

| Token bei | Was passiert | Werte |
| --- | --- | --- |
| „Lieferung prüfen und bestätigen“ | Mo 9. Nov.: Kunde wählt **Falsches Produkt geliefert**, keine Menge | `lieferErgebnis` = FALSCHLIEFERUNG |
| „Lieferabweichung erfassen“ | – | `lieferabweichung` = „FALSCHLIEFERUNG“ |
| „Abweichung an Lieferanten melden (über Team 3)“ | **Nachricht an Team 3** | – |
| „Lieferabweichung klären“ | Prüfstelle: **Nachlieferung** | – |
| „Auf Zustellmeldung warten“ | Do 12. Nov.: richtige Ware zugestellt | – |
| „Lieferung prüfen und bestätigen“ | Kunde: KORREKT | `lieferErgebnis` = KORREKT |
| „Bestand und Verbrauch fortschreiben“ | 20 + 120 | `bestand` = 140 |

Vorsicht: Hat der Kunde beim ersten Mal eine Menge eingetragen, steht sie beim zweiten Mal noch im Formular. Bleibt sie stehen, wird mit dieser Menge gerechnet statt mit 120.

### F5 – Lieferabweichung nicht lösbar

Wie F3 oder F4 bis „Lieferabweichung klären“. Die Prüfstelle wählt **Nicht lösbar**, Notiz „Lieferant reagiert nicht auf Beanstandung“.

| Token bei | Was passiert | Werte |
| --- | --- | --- |
| „Klärungsergebnis?“ | nicht lösbar (Default) | – |
| „Übergeben: Lieferabweichung offen“ | Ende **ohne** Nachricht an die App, ohne Beleg an Team 1, Bestand wird **nicht** fortgeschrieben | Status *Übergeben*, `ergebnis` = „Lieferabweichung nicht lösbar, an andere Stelle übergeben“ |

### F6 – Kunde bestätigt die Lieferung nie

| Zeitpunkt | Was passiert | Nachricht an die App |
| --- | --- | --- |
| Mo 9. Nov. | Zustellung, Aufgabe „Lieferung prüfen und bestätigen“ entsteht | – |
| Mi 11. Nov. | Erinnerung 1 → Ende „An Lieferbestätigung erinnert“ | „Bitte bestätigen Sie, ob die Lieferung richtig angekommen ist.“ |
| Fr 13. Nov. | Erinnerung 2 | dieselbe |
| So 15. Nov. | Erinnerung 3, die letzte (`R3`) | dieselbe |
| danach | nichts mehr; die Aufgabe bleibt für immer offen | – |

Status bleibt *Wartet auf Kunde*. Das ist so gewollt (nie automatisch erfolgreich), aber der Vorgang endet nie – Review, Punkt A3.

## Sonderfall und Nachschlagen

### G1 – Unbekanntes Produkt

Die App schickt eine Bestandsmeldung für `produktId` = GIBTSNICHT, Bestand 20.

| Token bei | Was passiert |
| --- | --- |
| „Vorgang eröffnen“ | läuft normal |
| „Versorgungsprofil laden“ | Keine Zeile im Profil passt, es gibt kein Ergebnis |
| spätestens „Verbrauch und Reichweite berechnen“ | Der Dienst meldet einen Fehler → **Incident im Cockpit**, das Token bleibt dort stehen |

Das ist Absicht (Entscheidung 9 in der README): lieber sichtbar stehen bleiben als mit falschen Werten weiterrechnen. Behoben wird es, indem jemand im Cockpit nachsieht.

### Formular-Beschriftung ↔ gespeicherter Wert

In der Tasklist siehst du die Beschriftung, die Gateways prüfen den Wert.

| Aufgabe | Beschriftung im Formular | Wert in der Variable |
| --- | --- | --- |
| „Über Freigabe entscheiden“ | Freigeben / Ablehnen / Ändern / Später entscheiden | FREIGEGEBEN / ABGELEHNT / AENDERUNG / AUFSCHUB |
| „Grenzfall prüfen“ | Kunden mit Hinweis entscheiden lassen / Nicht lösbar: Vorgang übergeben | KUNDENENTSCHEIDUNG / UEBERGEBEN |
| „Ausbleibende Lieferantenantwort klären“ | Zugelassenen Alternativlieferanten vorlegen / Vorgang mit Grund beenden | ALTERNATIVLIEFERANT / BEENDEN |
| „Lieferung prüfen und bestätigen“ | Richtig und vollständig geliefert / Nur teilweise geliefert / Falsches Produkt geliefert / Nicht angekommen | KORREKT / TEILLIEFERUNG / FALSCHLIEFERUNG / NICHT\_GELIEFERT |
| „Lieferabweichung klären“ | Lieferant liefert nach / Gelieferte Menge übernehmen / Nicht lösbar: Vorgang übergeben | NACHLIEFERUNG / TEILMENGE\_UEBERNEHMEN / NICHT\_LOESBAR |

### Wer bekommt wann eine Nachricht?

| Empfänger | Aus welchem Element | In welchen Wegen |
| --- | --- | --- |
| **App (Kunde)** | „An Bestandsmeldung erinnert“ | A3, A4 |
| App | „Abgebrochen: Bestand nicht gemeldet“ | A4 |
| App | „Kunde informiert: kein Bedarf“ | A1, A2 (Bestand 44) |
| App | „Kunde benachrichtigt“ (Teilprozess) | jede Kundenfreigabe: B2, C1, C2, D1–D4, E1, E2, E5 |
| App | „An offene Freigabe erinnert“ (Teilprozess) | D4 |
| App | „Kunde informiert: keine Bestellung“ | D2, D3, D4, ggf. E2 |
| App | „An Lieferbestätigung erinnert“ | F6 |
| App | „Kunde informiert: Lieferung bestätigt“ | B1, B2 und alle Wege, die dort enden |
| **Lieferant** | „Bestellung simuliert übermitteln“ | jede Bestellung; in E1 und E5 ein zweites Mal |
| **Team 3** | „Beim Lieferanten nachfassen“ | E4 (2×), E5, E6 |
| Team 3 | „Lieferung anmahnen“ | F1, F2 |
| Team 3 | „Abweichung an Lieferanten melden“ | F3, F4, F5 (nicht bei F2: dort wird die Reklamation übersprungen) |
| **Team 1** | „Liefernachweis an Team 1 übergeben“ | nur bei „Lieferung bestätigt“: B1, B2, F1–F4 |

Keine Nachricht an den Kunden gibt es bei den drei Enden „Übergeben: Grenzfall nicht lösbar“ (E3), „Erfolglos: Lieferant antwortet nicht“ (E6) und „Übergeben: Lieferabweichung offen“ (F5).
