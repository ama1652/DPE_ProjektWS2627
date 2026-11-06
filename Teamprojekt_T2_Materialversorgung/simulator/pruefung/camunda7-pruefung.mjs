// Eigene Pruefung auf Ausfuehrbarkeit in Camunda 7 / CIB seven und auf Konsistenz Modell <-> DMN <-> Simulator
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const dir = process.argv[2];
const { handlers } = require(path.resolve(dir, 'simulator/handlers.js'));
const fehler = [];
const F = (m) => fehler.push(m);
const unxml = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

const bpmn = fs.readdirSync(dir).filter((f) => f.endsWith('.bpmn')).map((f) => [f, fs.readFileSync(path.join(dir, f), 'utf8')]);
const dmn = fs.readdirSync(dir).filter((f) => f.endsWith('.dmn')).map((f) => [f, fs.readFileSync(path.join(dir, f), 'utf8')]);

// ---- bekannte Variablen sammeln ----
const bekannt = new Set(['execution', 'bestand', 'produktId', 'verbrauchBeobachtetProTag', 'pflegehaushaltId', 'produktVerfuegbar']); // Startvariablen
for (const [, x] of bpmn) {
  for (const m of x.matchAll(/<camunda:outputParameter name="([^"]+)"/g)) bekannt.add(m[1]);
  for (const m of x.matchAll(/<camunda:formField id="([^"]+)"/g)) bekannt.add(m[1]);
  for (const m of x.matchAll(/setVariable\(&apos;|setVariable\('([A-Za-z]+)'/g)) if (m[1]) bekannt.add(m[1]);
  for (const m of x.matchAll(/setVariable\((?:&apos;|')([A-Za-z]+)/g)) bekannt.add(m[1]);
  for (const m of x.matchAll(/<camunda:(?:in|out) [^>]*target="([^"]+)"/g)) bekannt.add(m[1]);
  for (const m of x.matchAll(/resultVariable="([^"]+)"/g)) bekannt.add(m[1]);
}
const task = { activityId: 'X', processInstanceId: 'pi', businessKey: 'bk' };
for (const [topic, h] of Object.entries(handlers)) {
  for (const act of ['X', 'ST_Nachfassen', 'ST_Mahnen', 'KE_Keine']) {
    try { Object.keys(h(new Proxy({}, { get: () => 1 }), { ...task, activityId: act })).forEach((k) => bekannt.add(k)); } catch (e) { F('Handler ' + topic + ' wirft bei Probe: ' + e.message); }
  }
}

// ---- DMN: Entscheidungen, Eingaben ----
const entscheidungen = new Set();
for (const [f, x] of dmn) {
  for (const m of x.matchAll(/<decision id="([^"]+)"[^>]*camunda:historyTimeToLive/g)) entscheidungen.add(m[1]);
  if (!/historyTimeToLive/.test(x)) F(f + ': historyTimeToLive fehlt');
  for (const m of x.matchAll(/<inputExpression[^>]*>\s*<text>([^<]+)<\/text>/g)) {
    if (!bekannt.has(m[1].trim())) F(f + ': Eingabe "' + m[1] + '" wird nirgends gesetzt');
  }
}

// ---- BPMN ----
const prozesse = new Set();
for (const [, x] of bpmn) for (const m of x.matchAll(/<bpmn:process id="([^"]+)"/g)) prozesse.add(m[1]);
const topicsModell = new Set();
for (const [f, x] of bpmn) {
  if (!/isExecutable="true"/.test(x)) F(f + ': nicht ausführbar markiert');
  if (!/<bpmn:process [^>]*camunda:historyTimeToLive/.test(x)) F(f + ': historyTimeToLive fehlt');
  // Service- und Send-Tasks brauchen eine Implementierung
  for (const m of x.matchAll(/<bpmn:(serviceTask|sendTask) ([^>]*)>/g)) {
    const a = m[2];
    if (!/camunda:(class|expression|delegateExpression)=|camunda:type="external"/.test(a)) F(f + ': ' + m[1] + ' ohne Implementierung: ' + a.slice(0, 60));
    const t = a.match(/camunda:topic="([^"]+)"/); if (/external/.test(a) && !t) F(f + ': External Task ohne Topic'); if (t) topicsModell.add(t[1]);
  }
  for (const m of x.matchAll(/<bpmn:messageEventDefinition [^>]*camunda:topic="([^"]+)"/g)) topicsModell.add(m[1]);
  // Business Rule Tasks -> existierende Entscheidung
  for (const m of x.matchAll(/camunda:decisionRef="([^"]+)"/g)) if (!entscheidungen.has(m[1])) F(f + ': decisionRef ' + m[1] + ' nicht gefunden');
  // Call Activities -> existierender Prozess
  for (const m of x.matchAll(/calledElement="([^"]+)"/g)) if (!prozesse.has(m[1])) F(f + ': calledElement ' + m[1] + ' nicht gefunden');
  // Nachrichten
  const msgIds = new Set([...x.matchAll(/<bpmn:message id="([^"]+)"/g)].map((m) => m[1]));
  for (const m of x.matchAll(/messageRef="([^"]+)"/g)) if (!msgIds.has(m[1])) F(f + ': messageRef ' + m[1] + ' fehlt');
  // Exklusive Gateways: jeder ausgehende Fluss ausser Default braucht eine Bedingung
  const flows = {};
  for (const m of x.matchAll(/<bpmn:sequenceFlow id="([^"]+)"[^>]*sourceRef="([^"]+)"[^>]*?(\/>|>([\s\S]*?)<\/bpmn:sequenceFlow>)/g)) flows[m[1]] = { src: m[2], body: m[4] || '' };
  for (const m of x.matchAll(/<bpmn:exclusiveGateway id="([^"]+)"([^>]*)>([\s\S]*?)<\/bpmn:exclusiveGateway>/g)) {
    const outs = [...m[3].matchAll(/<bpmn:outgoing>([^<]+)</g)].map((o) => o[1]);
    if (outs.length < 2) continue;
    const def = (m[2].match(/default="([^"]+)"/) || [])[1];
    for (const o of outs) if (o !== def && !/conditionExpression/.test(flows[o].body)) F(f + ': ' + m[1] + ' Fluss ' + o + ' ohne Bedingung');
    if (!def) F(f + ': ' + m[1] + ' ohne Standardfluss');
  }
  // Ausdruecke: alle verwendeten Variablen muessen irgendwo gesetzt werden
  const ausdruecke = [...x.matchAll(/(?:conditionExpression[^>]*>|tFormalExpression">|expression="|sourceExpression="|camunda:outputParameter name="[^"]+">)\$\{([^}]*)\}/g)].map((m) => unxml(m[1]));
  for (const a of ausdruecke) {
    const ohneStrings = a.replace(/'[^']*'/g, '');
    for (const id of ohneStrings.matchAll(/(?<![.\w])([A-Za-z_]\w*)/g)) {
      const name = id[1];
      if (['true', 'false', 'null', 'empty', 'not', 'and', 'or', 'eq', 'ne'].includes(name)) continue;
      if (!bekannt.has(name)) F(f + ': Ausdruck ${' + a + '} nutzt unbekannte Variable ' + name);
    }
  }
}
for (const t of topicsModell) if (!handlers[t]) F('Topic ' + t + ' hat keinen Handler im Simulator');
for (const t of Object.keys(handlers)) if (!topicsModell.has(t)) F('Simulator-Handler ' + t + ' wird im Modell nicht verwendet');

console.log('Topics im Modell:', [...topicsModell].sort().join(', '));
console.log(fehler.length ? fehler.join('\n') : 'Camunda-7-Prüfung: 0 Fehler');
process.exit(fehler.length ? 1 : 0);
