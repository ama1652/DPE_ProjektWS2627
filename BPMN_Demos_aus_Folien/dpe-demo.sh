#!/bin/bash
# =============================================================================
#  dpe-demo.sh – Hilfsskript für die BPMN-Demos aus den Folien (Einführung + Advanced)
#  Spricht die REST-Schnittstelle deines lokalen CIB seven an (http://localhost:8080/engine-rest).
#  Voraussetzung: Docker Desktop läuft und der Container "cibseven" ist gestartet.
#
#  Aufruf im Terminal (im Ordner dieser Datei):   bash dpe-demo.sh <befehl> ...
#  Ohne Befehl wird die Hilfe angezeigt.
# =============================================================================
BASE="${CIB_URL:-http://localhost:8080/engine-rest}"
AUTH="${CIB_AUTH:-demo:demo}"
DIR="$(cd "$(dirname "$0")" && pwd)"

have_jq() { command -v jq >/dev/null 2>&1; }
pretty() { if have_jq; then jq "${1:-.}"; else cat; echo; fi; }
api() { # METHODE PFAD [JSON]
  if [ -n "$3" ]; then
    curl -s -u "$AUTH" -X "$1" -H "Content-Type: application/json" -d "$3" "$BASE$2"
  else
    curl -s -u "$AUTH" -X "$1" "$BASE$2"
  fi
}

hilfe() {
cat <<'TXT'
Befehle:
  check                       Prüft, ob CIB seven erreichbar ist
  deploy [datei ...]          Lädt alle (oder die genannten) BPMN- und DMN-Dateien dieses Ordners in CIB seven
  start <prozessKey> [JSON]   Startet einen Prozess, z. B.  start E28_InklusiverJoin
                              Variablen optional: '{"x":{"value":70000,"type":"Long"}}'
  tasks                       Zeigt offene Aufgaben (ID, Name, Prozessinstanz)
  complete <taskId> [JSON]    Erledigt eine Aufgabe, z. B. complete <id> '{"approved":{"value":true}}'
  error <taskId> <code>       Wirft an einer Benutzeraufgabe einen BPMN-Fehler (z. B. BUCHUNG_FEHLGESCHLAGEN)
  escalate <taskId> <code>    Wirft an einer Benutzeraufgabe eine Eskalation (z. B. NOT_AVAILABLE)
  msg <name> [instanzId] [JSON]  Sendet eine Nachricht (ohne instanzId = Startnachricht / einzige Empfängerin)
  where <instanzId>           Zeigt, wo die Instanz gerade steht (aktive Aktivitäten)
  vars <instanzId>            Zeigt die Variablen einer Instanz
  instances [prozessKey]      Listet laufende Instanzen
  abbrechen <instanzId>       Löscht eine laufende Instanz (z. B. nach einem Deadlock)
TXT
}

case "$1" in
  check)
    api GET /engine | pretty; api GET /version | pretty ;;
  deploy)
    shift
    files=("$@"); [ ${#files[@]} -eq 0 ] && files=("$DIR"/*.dmn "$DIR"/*.bpmn)
    ok=0; fail=0
    for f in "${files[@]}"; do
      name="$(basename "$f")"; name="${name%.*}"
      resp=$(curl -s -u "$AUTH" -w "\n%{http_code}" -X POST "$BASE/deployment/create" \
        -F "deployment-name=$name" -F "deployment-source=Claude-DPE-Demos" \
        -F "enable-duplicate-filtering=true" -F "data=@$f")
      code=$(echo "$resp" | tail -n1); body=$(echo "$resp" | sed '$d')
      if [ "$code" = "200" ]; then
        echo "OK      $name"; ok=$((ok+1))
      else
        echo "FEHLER  $name  (HTTP $code)"; echo "        $body" | cut -c1-600; fail=$((fail+1))
      fi
    done
    echo "----"; echo "Erfolgreich: $ok   Fehlgeschlagen: $fail"
    [ $fail -gt 0 ] && echo "Bitte die FEHLER-Zeilen an Claude schicken." ;;
  start)
    vars="${3:-{\}}"
    api POST "/process-definition/key/$2/start" "{\"variables\":$vars}" | pretty '{id, definitionId, ended}' ;;
  tasks)
    if have_jq; then
      api GET "/task?sortBy=created&sortOrder=asc" | jq -r '.[] | "\(.id)  |  \(.name)  |  Instanz: \(.processInstanceId)  |  \(.processDefinitionId | split(":")[0])"'
    else api GET "/task?sortBy=created&sortOrder=asc"; echo; fi ;;
  complete)
    vars="${3:-{\}}"
    r=$(api POST "/task/$2/complete" "{\"variables\":$vars}"); [ -z "$r" ] && echo "erledigt" || echo "$r" ;;
  error)
    r=$(api POST "/task/$2/bpmnError" "{\"errorCode\":\"$3\"}"); [ -z "$r" ] && echo "Fehler $3 geworfen" || echo "$r" ;;
  escalate)
    r=$(api POST "/task/$2/bpmnEscalation" "{\"escalationCode\":\"$3\"}"); [ -z "$r" ] && echo "Eskalation $3 geworfen" || echo "$r" ;;
  msg)
    vars="${4:-{\}}"
    if [ -n "$3" ]; then body="{\"messageName\":\"$2\",\"processInstanceId\":\"$3\",\"processVariables\":$vars,\"resultEnabled\":true}"
    else body="{\"messageName\":\"$2\",\"processVariables\":$vars,\"resultEnabled\":true}"; fi
    api POST /message "$body" | pretty ;;
  where)
    if have_jq; then
      api GET "/process-instance/$2/activity-instances" | jq -r '.. | objects | select(.activityName? != null or .activityId? != null) | select(.childActivityInstances? == [] ) | "aktiv: \(.activityName // .activityId)"'
    else api GET "/process-instance/$2/activity-instances"; echo; fi ;;
  vars)
    api GET "/process-instance/$2/variables" | pretty ;;
  instances)
    q=""; [ -n "$2" ] && q="?processDefinitionKey=$2"
    if have_jq; then api GET "/process-instance$q" | jq -r '.[] | "\(.id)  |  \(.definitionId | split(":")[0])"'
    else api GET "/process-instance$q"; echo; fi ;;
  abbrechen)
    r=$(api DELETE "/process-instance/$2?skipCustomListeners=true"); [ -z "$r" ] && echo "Instanz gelöscht" || echo "$r" ;;
  *) hilfe ;;
esac
