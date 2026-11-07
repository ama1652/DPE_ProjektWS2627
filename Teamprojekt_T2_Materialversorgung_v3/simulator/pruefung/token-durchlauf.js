'use strict';
// Vereinfachter Token-Durchlauf ohne Engine: spielt einen Fall durch das BPMN-Modell (inkl. Teilprozesse,
// Call Activity, Randereignisse, DMN, Listener) und nutzt die echten Simulator-Handler.
// Ersetzt keinen Test auf CIB seven, findet aber falsche Bedingungen, fehlende Variablen und falsche Wege.
const fs = require('fs');
const path = require('path');
const { handlers } = require('../handlers');

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
    const node = { tag: m[2].replace(/^\w+:/, ''), attrs, kids: [], text: '', parent: stack[stack.length - 1] };
    stack[stack.length - 1].kids.push(node);
    if (!m[4]) stack.push(node);
  }
  return root;
}
const all = (n, pred, out = []) => { for (const k of n.kids) { if (pred(k)) out.push(k); all(k, pred, out); } return out; };

// ---------- DMN ----------
function dmnLaden(datei) {
  const x = fs.readFileSync(datei, 'utf8');
  const id = x.match(/<decision id="([^"]+)"/)[1];
  return {
    id,
    hit: x.match(/hitPolicy="(\w+)"/)[1],
    ins: [...x.matchAll(/<inputExpression[^>]*>\s*<text>([^<]+)</g)].map((m) => ent(m[1])),
    outs: [...x.matchAll(/<output [^>]*name="([^"]+)"/g)].map((m) => m[1]),
    rules: [...x.matchAll(/<rule id="[^"]+">([\s\S]*?)<\/rule>/g)].map((r) => ({
      ins: [...r[1].matchAll(/<inputEntry[^>]*><text>([^<]*)</g)].map((m) => ent(m[1])),
      outs: [...r[1].matchAll(/<outputEntry[^>]*><text>([^<]*)</g)].map((m) => ent(m[1])),
    })),
  };
}
function dmnWerte(t, v) {
  const ein = (e) => {
    const m = e.match(/^\s*(\w+)\s*(<=|>=|<|>)\s*(\w+)\s*$/);
    if (!m) return v[e.trim()] ?? null;
    const a = v[m[1]], b = v[m[3]];
    if (a == null || b == null) return null;
    return { '<=': a <= b, '>=': a >= b, '<': a < b, '>': a > b }[m[2]];
  };
  const passt = (test, w) => test === '' || (test === 'true' ? w === true : test === 'false' ? w === false : /^".*"$/.test(test) ? w === JSON.parse(test) : false);
  const r = t.rules.find((rr) => rr.ins.every((e, i) => passt(e, ein(t.ins[i]))));
  if (!r) throw new Error('DMN ' + t.id + ': kein Treffer');
  return Object.fromEntries(t.outs.map((o, i) => [o, JSON.parse(r.outs[i])]));
}

// ---------- JUEL (vereinfacht) ----------
function juel(expr, vars, ctx) {
  const m = expr.match(/^\$\{([\s\S]*)\}$/);
  if (!m) return expr;
  const execution = {
    setVariable: (n, w) => { vars[n] = w; },
    setProcessBusinessKey: (k) => { ctx.businessKey = k; },
  };
  const scope = new Proxy({ execution }, {
    has: (t, k) => typeof k === 'string' && k !== 'globalThis',
    get: (t, k) => {
      if (k === Symbol.unscopables) return undefined;
      if (k in t) return t[k];
      if (!(k in vars)) throw new Error('Unbekannte Variable ' + String(k) + ' in ' + expr);
      return vars[k];
    },
  });
  // eslint-disable-next-line no-new-func
  return new Function('scope', 'with (scope) { return (' + m[1].replace(/\band\b/g, '&&').replace(/\bor\b/g, '||') + '); }')(scope);
}

class Unterbrechung { constructor(boundary) { this.boundary = boundary; } }

function durchlauf(dir, startId, startVars, fall) {
  const models = fs.readdirSync(dir).filter((f) => f.endsWith('.bpmn')).map((f) => parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  const dmns = Object.fromEntries(fs.readdirSync(dir).filter((f) => f.endsWith('.dmn')).map((f) => { const t = dmnLaden(path.join(dir, f)); return [t.id, t]; }));
  const byId = {};
  const prozesse = {};
  for (const r of models) {
    for (const n of all(r, (x) => x.attrs.id)) byId[n.attrs.id] = n;
    for (const p of all(r, (x) => x.tag === 'process')) prozesse[p.attrs.id] = p;
  }
  const spur = [];
  const ctx = { businessKey: null };
  const vars = { ...startVars };
  const queues = JSON.parse(JSON.stringify(fall));
  const nimm = (art, id) => {
    const q = (queues[art] || {})[id];
    if (!q || !q.length) throw new Error('Fall sagt nichts zu ' + art + ' ' + id + ' (Spur: ' + spur.slice(-6).join(' > ') + ')');
    return q.shift();
  };
  const listeners = (n, ev, v) => {
    for (const l of all(n, (x) => x.tag === 'executionListener')) if (l.attrs.event === ev && l.parent.parent === n) juel(l.attrs.expression, v, ctx);
  };
  const outgoing = (n) => n.parent.kids.filter((k) => k.tag === 'sequenceFlow' && k.attrs.sourceRef === n.attrs.id);
  const boundaries = (n) => n.parent.kids.filter((k) => k.tag === 'boundaryEvent' && k.attrs.attachedToRef === n.attrs.id);
  const folge = (fl, v) => {
    for (const l of all(fl, (x) => x.tag === 'executionListener')) juel(l.attrs.expression, v, ctx);
    return byId[fl.attrs.targetRef];
  };
  const handler = (n, v) => {
    const topic = n.attrs['camunda:topic'] || (n.kids.find((k) => k.attrs['camunda:topic']) || { attrs: {} }).attrs['camunda:topic'];
    if (!topic) return;
    const h = handlers[topic];
    if (!h) throw new Error('Kein Handler ' + topic);
    Object.assign(v, h(v, { activityId: n.attrs.id, processInstanceId: 'pi-test-0001', businessKey: ctx.businessKey, laufendeVorgaenge: fall.laufendeVorgaenge || 0 }));
  };

  // laeuft von Knoten n bis zu einem Endereignis derselben Ebene; liefert das Endereignis
  function lauf(n, v) {
    for (let schritte = 0; schritte < 500; schritte++) {
      spur.push(n.attrs.name || n.attrs.id);
      listeners(n, 'start', v);
      if (n.tag === 'endEvent') { handler(n, v); listeners(n, 'end', v); return n; }
      let weiter = null;
      try {
        weiter = schritt(n, v);
      } catch (e) {
        if (!(e instanceof Unterbrechung)) throw e;
        const b = boundaries(n).find((x) => x.attrs.id === e.boundary);
        if (!b) throw e;
        spur.push(b.attrs.name);
        n = folge(outgoing(b)[0], v);
        continue;
      }
      listeners(n, 'end', v);
      n = weiter;
    }
    throw new Error('Endlosschleife? ' + spur.slice(-10).join(' > '));
  }
  // Wartezustand: Randereignisse laut Fall ausloesen, bis die Aufgabe normal endet
  function warte(n, v, art) {
    for (;;) {
      const ereignis = nimm(art, n.attrs.id);
      if (ereignis === 'normal' || typeof ereignis === 'object') return ereignis;
      // Randereignis an dieser Aufgabe oder an einem umgebenden Teilprozess
      let host = n;
      let b = null;
      while (host && !b) {
        b = boundaries(host).find((x) => x.attrs.id === ereignis);
        if (!b) host = host.parent && host.parent.tag === 'subProcess' ? host.parent : null;
      }
      if (!b) throw new Error('Randereignis ' + ereignis + ' gibt es nicht an ' + n.attrs.id);
      if (b.attrs.cancelActivity === 'false') {
        spur.push(b.attrs.name);
        lauf(folge(outgoing(b)[0], v), v); // Nebenpfad bis zu seinem Ende
        continue;
      }
      throw new Unterbrechung(ereignis);
    }
  }
  function schritt(n, v) {
    switch (n.tag) {
      case 'startEvent': case 'intermediateThrowEvent':
        handler(n, v); break;
      case 'serviceTask': case 'sendTask':
        handler(n, v); break;
      case 'businessRuleTask': {
        const erg = dmnWerte(dmns[n.attrs['camunda:decisionRef']], v);
        v[n.attrs['camunda:resultVariable']] = erg;
        for (const op of all(n, (x) => x.tag === 'outputParameter')) v[op.attrs.name] = juel(op.text, v, ctx);
        break;
      }
      case 'userTask': {
        const werte = warte(n, v, 'aufgabe');
        if (typeof werte === 'object') Object.assign(v, werte);
        break;
      }
      case 'receiveTask':
        warte(n, v, 'nachricht'); break;
      case 'subProcess': {
        const start = n.kids.find((k) => k.tag === 'startEvent');
        try {
          lauf(start, v);
        } catch (e) {
          if (e instanceof Unterbrechung && boundaries(n).some((b) => b.attrs.id === e.boundary)) throw e;
          throw e;
        }
        break;
      }
      case 'callActivity': {
        const sub = {};
        for (const i of all(n, (x) => x.tag === 'in')) {
          if (i.attrs.source) sub[i.attrs.target] = v[i.attrs.source];
          if (i.attrs.sourceExpression) sub[i.attrs.target] = juel(i.attrs.sourceExpression, v, ctx);
        }
        const p = prozesse[n.attrs.calledElement];
        const ende = lauf(p.kids.find((k) => k.tag === 'startEvent'), sub);
        spur.push('[' + ende.attrs.name + ']');
        for (const o of all(n, (x) => x.tag === 'out')) v[o.attrs.target] = sub[o.attrs.source];
        break;
      }
      case 'exclusiveGateway': {
        const out = outgoing(n);
        const treffer = out.find((fl) => fl.attrs.id !== n.attrs.default && fl.kids.some((k) => k.tag === 'conditionExpression')
          && juel(fl.kids.find((k) => k.tag === 'conditionExpression').text.trim(), v, ctx));
        const fl = treffer || out.find((x) => x.attrs.id === n.attrs.default);
        if (!fl) throw new Error('Kein Ausgang an ' + n.attrs.id);
        if (out.length > 1) spur.push('(' + (fl.attrs.name || '') + ')');
        return folge(fl, v);
      }
      default:
        throw new Error('Nicht unterstützt: ' + n.tag);
    }
    const out = outgoing(n);
    if (out.length !== 1) throw new Error(n.attrs.id + ' hat ' + out.length + ' Ausgänge');
    return folge(out[0], v);
  }

  const ende = lauf(byId[startId], vars);
  const rest = Object.entries(queues).flatMap(([art, q]) => (typeof q === 'object' ? Object.entries(q) : [])
    .filter(([, l]) => Array.isArray(l) && l.length).map(([id]) => art + ' ' + id));
  return { ende: ende.attrs.id, endeName: ende.attrs.name, vars, spur, ungenutzt: rest, businessKey: ctx.businessKey };
}

module.exports = { durchlauf };
