// Wertet die DMN-Tabellen mit Testfaellen aus (nur die hier benutzten FEEL-Formen). node pruefung/dmn-pruefung.mjs ..
import fs from 'fs';
import path from 'path';

const dir = path.resolve(process.argv[2] || '..');
const unx = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
function laden(f) {
  const x = fs.readFileSync(path.join(dir, f), 'utf8');
  return {
    hit: x.match(/hitPolicy="(\w+)"/)[1],
    ins: [...x.matchAll(/<inputExpression[^>]*>\s*<text>([^<]+)</g)].map((m) => unx(m[1])),
    outs: [...x.matchAll(/<output [^>]*name="([^"]+)"/g)].map((m) => m[1]),
    rules: [...x.matchAll(/<rule id="[^"]+">([\s\S]*?)<\/rule>/g)].map((r) => ({
      ins: [...r[1].matchAll(/<inputEntry[^>]*><text>([^<]*)</g)].map((m) => unx(m[1])),
      outs: [...r[1].matchAll(/<outputEntry[^>]*><text>([^<]*)</g)].map((m) => unx(m[1])),
    })),
  };
}
// Eingabeausdruck: Variable oder Vergleich "a <= b" (null, wenn ein Wert fehlt, wie in FEEL)
function eingabe(expr, v) {
  const m = expr.match(/^\s*(\w+)\s*(<=|>=|<|>)\s*(\w+)\s*$/);
  if (!m) return v[expr.trim()] ?? null;
  const a = v[m[1]], b = v[m[3]];
  if (a === null || a === undefined || b === null || b === undefined) return null;
  return { '<=': a <= b, '>=': a >= b, '<': a < b, '>': a > b }[m[2]];
}
function passt(test, wert) {
  if (test === '' || test === '-') return true;
  if (test === 'true' || test === 'false') return wert === (test === 'true');
  const m = test.match(/^(<=|>=|<|>)\s*([\d.]+)$/);
  if (m) return wert !== null && { '<=': wert <= +m[2], '>=': wert >= +m[2], '<': wert < +m[2], '>': wert > +m[2] }[m[1]];
  if (/^".*"$/.test(test)) return wert === JSON.parse(test);
  throw new Error('Unbekannter Test ' + test);
}
function werte(t, v) {
  const treffer = t.rules.filter((r) => r.ins.every((e, i) => passt(e, eingabe(t.ins[i], v))));
  if (t.hit === 'UNIQUE' && treffer.length > 1) throw new Error('UNIQUE verletzt');
  return treffer.length ? Object.fromEntries(t.outs.map((o, i) => [o, JSON.parse(treffer[0].outs[i])])) : null;
}

let fehler = 0;
const pruefe = (ok, text) => { if (!ok) fehler++; console.log(ok ? 'OK    ' : 'FEHLER', text); };

const regel = laden('T2_Berechtigungsregel.dmn');
const B = { handlungsart: 'BESTELLUNG', betragsgrenze: 40, fallUngeklaert: false, abweichungMitFolgen: false };
for (const [v, erwartet, text] of [
  [{ ...B, betrag: 54 }, 'KUNDENFREIGABE', 'Leitgeschichte 54 EUR über 40 EUR'],
  [{ ...B, betrag: 24 }, 'AUTOMATISCH', 'TP-HS 24 EUR unter der Grenze'],
  [{ ...B, betrag: 40 }, 'AUTOMATISCH', 'genau an der Grenze'],
  [{ ...B, betrag: 24, betragsgrenze: 20 }, 'KUNDENFREIGABE', 'andere Grenze je Produkt'],
  [{ ...B, betrag: 24, abweichungMitFolgen: true }, 'KUNDENFREIGABE', 'Abweichung mit Folgen'],
  [{ ...B, betrag: 24, fallUngeklaert: true, abweichungMitFolgen: true }, 'PRUEFSTELLE', 'ungeklärter Fall'],
  [{ handlungsart: 'EINREICHUNG', betrag: null, betragsgrenze: null }, 'KUNDENFREIGABE', 'Einreichung (Team 1) ohne Betrag'],
  [{ handlungsart: 'ERSATZVERSORGUNG' }, 'KUNDENFREIGABE', 'Ersatzversorgung (Team 3)'],
  [{ handlungsart: 'IRGENDWAS' }, 'KUNDENFREIGABE', 'unbekannte Handlung'],
]) {
  const r = werte(regel, v);
  pruefe(r && r.freigabeweg === erwartet, text + ' -> ' + (r && r.freigabeweg));
}
const profil = laden('T2_Produktprofil.dmn');
const fristen = laden('T2_Fristen.dmn');
for (const id of ['TP-M', 'TP-HS', 'TP-SCHNELL']) {
  const p = werte(profil, { produktId: id });
  const f = werte(fristen, { produktId: id });
  pruefe(p && Object.keys(p).length === profil.outs.length && p.betragsgrenze > 0, id + ' Produktprofil vollständig');
  pruefe(f && Object.values(f).every((x) => x !== null && x !== ''), id + ' Fristen vollständig');
}
pruefe(werte(profil, { produktId: 'GIBTSNICHT' }) === null, 'unbekanntes Produkt liefert keinen Treffer');
console.log('DMN-Prüfung:', fehler, 'Fehler');
process.exit(fehler ? 1 : 0);
