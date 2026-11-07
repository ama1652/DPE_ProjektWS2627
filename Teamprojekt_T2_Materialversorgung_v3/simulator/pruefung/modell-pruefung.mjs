// Prueft die BPMN-Modelle auf Ausfuehrbarkeit (Camunda 7 / CIB seven), auf Stiehls Stilregeln und auf
// Konsistenz zwischen Modell, DMN-Tabellen und Simulator. Ohne Abhaengigkeiten: node pruefung/modell-pruefung.mjs ..
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.resolve(process.argv[2] || '..');
const { handlers } = require(path.join(dir, 'simulator/handlers.js'));
const fehler = [];
const F = (m) => fehler.push(m);

// ---------- kleiner XML-Parser (reicht fuer Modeler-Dateien) ----------
const ent = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
function parse(xml) {
  const root = { tag: '#root', attrs: {}, kids: [], text: '' };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<(\/?)([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(xml))) {
    if (m[5] !== undefined) { stack[stack.length - 1].text += ent(m[5]); continue; }
    if (!m[2]) continue;
    if (m[1]) { stack.pop(); continue; }
    const attrs = {};
    for (const a of m[3].matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1]] = ent(a[2] ?? a[3]);
    const node = { tag: m[2].replace(/^\w+:/, ''), ns: m[2].includes(':') ? m[2].split(':')[0] : '', attrs, kids: [], text: '', parent: stack[stack.length - 1] };
    stack[stack.length - 1].kids.push(node);
    if (!m[4]) stack.push(node);
  }
  return root;
}
const all = (n, pred, out = []) => { for (const k of n.kids) { if (pred(k)) out.push(k); all(k, pred, out); } return out; };
const kid = (n, tag) => n.kids.find((k) => k.tag === tag);

const bpmnFiles = fs.readdirSync(dir).filter((f) => f.endsWith('.bpmn'));
const dmnFiles = fs.readdirSync(dir).filter((f) => f.endsWith('.dmn'));
const models = Object.fromEntries(bpmnFiles.map((f) => [f, parse(fs.readFileSync(path.join(dir, f), 'utf8'))]));
const dmns = Object.fromEntries(dmnFiles.map((f) => [f, parse(fs.readFileSync(path.join(dir, f), 'utf8'))]));

const FLOWNODE = new Set(['startEvent', 'endEvent', 'intermediateThrowEvent', 'intermediateCatchEvent', 'boundaryEvent', 'task', 'serviceTask',
  'sendTask', 'receiveTask', 'userTask', 'businessRuleTask', 'scriptTask', 'callActivity', 'subProcess', 'exclusiveGateway', 'parallelGateway',
  'inclusiveGateway', 'eventBasedGateway']);
const ACTIVITY = new Set(['task', 'serviceTask', 'sendTask', 'receiveTask', 'userTask', 'businessRuleTask', 'scriptTask', 'callActivity', 'subProcess']);

// ---------- bekannte Variablen ----------
const bekannt = new Set(['execution', 'produktId', 'pflegehaushaltId', 'bestand', 'verbrauchBeobachtetProTag', 'produktVerfuegbar', 'aktuellerLieferant']);
for (const t of Object.keys(handlers)) {
  for (const act of ['X', 'KE_Keine']) {
    try { Object.keys(handlers[t](new Proxy({}, { get: () => 1 }), { activityId: act, processInstanceId: 'pi', businessKey: 'bk' })).forEach((k) => bekannt.add(k)); } catch (e) { /* Probe */ }
  }
}
for (const root of Object.values(models)) {
  for (const n of all(root, () => true)) {
    if (n.tag === 'outputParameter' || n.tag === 'formField') bekannt.add(n.attrs.name || n.attrs.id);
    if ((n.tag === 'in' || n.tag === 'out') && n.attrs.target) bekannt.add(n.attrs.target);
    if (n.attrs['camunda:resultVariable']) bekannt.add(n.attrs['camunda:resultVariable']);
    const ex = n.attrs.expression || '';
    for (const m of ex.matchAll(/setVariable\('([A-Za-z]+)'/g)) bekannt.add(m[1]);
  }
}
for (const root of Object.values(dmns)) for (const o of all(root, (n) => n.tag === 'output')) bekannt.add(o.attrs.name);

const ids = (expr) => [...expr.replace(/'[^']*'/g, '').matchAll(/(?<![.\w])([A-Za-z_]\w*)/g)].map((m) => m[1])
  .filter((n) => !['true', 'false', 'null', 'empty', 'not', 'and', 'or', 'eq', 'ne', 'lt', 'gt'].includes(n));

// ---------- DMN ----------
const entscheidungen = new Set();
for (const [f, root] of Object.entries(dmns)) {
  for (const d of all(root, (n) => n.tag === 'decision')) {
    entscheidungen.add(d.attrs.id);
    if (!d.attrs['camunda:historyTimeToLive']) F(f + ': historyTimeToLive fehlt');
    for (const r of all(d, (n) => n.tag === 'rule')) {
      if (!kid(r, 'description') || !kid(r, 'description').text.trim()) F(f + ': Regel ' + r.attrs.id + ' ohne Quelle/Annotation (Teamauftrag 6.1)');
    }
  }
  for (const ie of all(root, (n) => n.tag === 'inputExpression')) {
    for (const v of ids(kid(ie, 'text').text)) if (!bekannt.has(v)) F(f + ': Eingabe ' + v + ' wird nirgends gesetzt');
  }
}

// ---------- BPMN ----------
const prozesse = {};
for (const root of Object.values(models)) for (const p of all(root, (n) => n.tag === 'process')) prozesse[p.attrs.id] = p;
const topics = new Set();
for (const [f, root] of Object.entries(models)) {
  const byId = {};
  for (const n of all(root, (x) => x.attrs.id)) byId[n.attrs.id] = n;
  const msgIds = new Set(all(root, (n) => n.tag === 'message').map((n) => n.attrs.id));
  for (const p of all(root, (n) => n.tag === 'process')) {
    if (p.attrs.isExecutable !== 'true') F(f + ': Prozess nicht ausführbar markiert');
    if (!p.attrs['camunda:historyTimeToLive']) F(f + ': historyTimeToLive fehlt');
  }
  // Stilregel 13-15: Nachrichtenfluesse beschriftet
  for (const mf of all(root, (n) => n.tag === 'messageFlow')) if (!mf.attrs.name) F(f + ': Nachrichtenfluss ' + mf.attrs.id + ' ohne Beschriftung (Stilregel 13-15)');
  // Ebenen: Prozess und jeder Teilprozess
  const ebenen = all(root, (n) => n.tag === 'process' || n.tag === 'subProcess');
  for (const e of ebenen) {
    const knoten = e.kids.filter((k) => FLOWNODE.has(k.tag));
    const akt = knoten.filter((k) => ACTIVITY.has(k.tag));
    if (akt.length > 10) F(f + ': Ebene ' + (e.attrs.name || e.attrs.id) + ' hat ' + akt.length + ' Aktivitäten (Stilregel 2: höchstens 10)');
    const flows = e.kids.filter((k) => k.tag === 'sequenceFlow');
    const inc = {}, out = {};
    for (const fl of flows) { (out[fl.attrs.sourceRef] ||= []).push(fl); (inc[fl.attrs.targetRef] ||= []).push(fl); }
    for (const k of knoten) {
      const id = k.attrs.id;
      if (!k.attrs.name && k.tag !== 'exclusiveGateway') F(f + ': ' + k.tag + ' ' + id + ' ohne Namen');
      if (k.tag === 'exclusiveGateway') {
        const o = out[id] || [], i = inc[id] || [];
        if (i.length > 1 && o.length === 1) F(f + ': zusammenführendes XOR ' + id + ' (Stilregel 19)');
        if (o.length > 1) {
          if (!k.attrs.name) F(f + ': verzweigendes XOR ' + id + ' ohne Frage als Namen');
          if (!k.attrs.default) F(f + ': ' + id + ' ohne Standardfluss');
          for (const fl of o) {
            if (!fl.attrs.name) F(f + ': Ausgang ' + fl.attrs.id + ' ohne Beschriftung');
            if (fl.attrs.id !== k.attrs.default && !kid(fl, 'conditionExpression')) F(f + ': Ausgang ' + fl.attrs.id + ' ohne Bedingung');
          }
        }
      }
      if (['serviceTask', 'sendTask'].includes(k.tag)) {
        if (k.attrs['camunda:type'] !== 'external' && !k.attrs['camunda:class'] && !k.attrs['camunda:delegateExpression'] && !k.attrs['camunda:expression']) F(f + ': ' + id + ' ohne Implementierung');
        if (k.attrs['camunda:topic']) topics.add(k.attrs['camunda:topic']);
      }
      if (k.tag === 'businessRuleTask' && !entscheidungen.has(k.attrs['camunda:decisionRef'])) F(f + ': decisionRef ' + k.attrs['camunda:decisionRef'] + ' fehlt');
      if (k.tag === 'callActivity' && !prozesse[k.attrs.calledElement]) F(f + ': calledElement ' + k.attrs.calledElement + ' fehlt');
      if (k.tag === 'receiveTask' && !msgIds.has(k.attrs.messageRef)) F(f + ': messageRef von ' + id + ' fehlt');
      for (const ed of k.kids.filter((x) => x.tag === 'messageEventDefinition')) {
        if (!msgIds.has(ed.attrs.messageRef)) F(f + ': messageRef von ' + id + ' fehlt');
        if (ed.attrs['camunda:topic']) topics.add(ed.attrs['camunda:topic']);
      }
      if (k.tag === 'startEvent' && e.tag === 'subProcess' && k.kids.some((x) => x.tag.endsWith('EventDefinition'))) F(f + ': Startereignis im Teilprozess mit Auslöser: ' + id);
      if (!['startEvent', 'boundaryEvent'].includes(k.tag) && !(inc[id] || []).length) F(f + ': ' + id + ' ohne eingehenden Fluss');
      if (!['endEvent'].includes(k.tag) && !(out[id] || []).length) F(f + ': ' + id + ' ohne ausgehenden Fluss');
      // Label-Matching (Stilregel 10-12): Endzustaende des Teilprozesses = Ausgaenge des folgenden Gateways
      if (k.tag === 'subProcess' || k.tag === 'callActivity') {
        const nach = (out[id] || []).map((fl) => byId[fl.attrs.targetRef]);
        const hatErgebnisse = (s) => s && s.kids.some((x) => x.tag === 'endEvent' && all(x, (y) => y.tag === 'executionListener').some((l) => /ergebnis[A-Z]/.test(l.attrs.expression || '')));
        if (nach.length === 1 && nach[0].tag === 'exclusiveGateway' && (k.tag === 'callActivity' || hatErgebnisse(k))) {
          const sub = k.tag === 'subProcess' ? k : prozesse[k.attrs.calledElement];
          const ends = sub.kids.filter((x) => x.tag === 'endEvent' && (k.tag === 'callActivity'
            || all(x, (y) => y.tag === 'executionListener').some((l) => /ergebnis[A-Z]/.test(l.attrs.expression || ''))));
          const endNamen = new Set(ends.map((x) => x.attrs.name));
          const gwNamen = new Set((out[nach[0].attrs.id] || []).map((fl) => fl.attrs.name));
          for (const n of endNamen) if (!gwNamen.has(n)) F(f + ': Endzustand „' + n + '“ von ' + id + ' fehlt als Ausgang von ' + nach[0].attrs.id);
          for (const n of gwNamen) if (!endNamen.has(n)) F(f + ': Ausgang „' + n + '“ von ' + nach[0].attrs.id + ' ist kein Endzustand von ' + id);
        }
      }
    }
  }
  // Ausdruecke: Variablen muessen bekannt sein
  const exprs = [];
  for (const n of all(root, () => true)) {
    if (['conditionExpression', 'timeCycle', 'timeDuration', 'timeDate', 'outputParameter'].includes(n.tag)) exprs.push(n.text);
    if (n.attrs.expression) exprs.push(n.attrs.expression);
    if (n.attrs.sourceExpression) exprs.push(n.attrs.sourceExpression);
  }
  for (const ex of exprs) for (const m of ex.matchAll(/\$\{([^}]*)\}/g)) {
    for (const v of ids(m[1])) if (!bekannt.has(v)) F(f + ': Ausdruck ${' + m[1] + '} nutzt unbekannte Variable ' + v);
  }
}
for (const t of topics) if (!handlers[t]) F('Topic ' + t + ' hat keinen Handler im Simulator');
for (const t of Object.keys(handlers)) if (!topics.has(t)) F('Simulator-Handler ' + t + ' wird im Modell nicht verwendet');

console.log('Topics:', [...topics].sort().join(', '));
console.log(fehler.length ? fehler.join('\n') : 'Modellprüfung (Camunda 7, Stilregeln, Konsistenz): 0 Fehler');
process.exit(fehler.length ? 1 : 0);
