// Wertet die beiden DMN-Tabellen mit einfachen Unary Tests aus (nur die hier benutzten Formen)
import fs from 'fs';
const dir = process.argv[2];
const unx = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
function laden(f) {
  const x = fs.readFileSync(dir + '/' + f, 'utf8');
  const hit = x.match(/hitPolicy="(\w+)"/)[1];
  const ins = [...x.matchAll(/<inputExpression[^>]*>\s*<text>([^<]+)</g)].map((m) => m[1]);
  const outs = [...x.matchAll(/<output [^>]*name="([^"]+)"/g)].map((m) => m[1]);
  const rules = [...x.matchAll(/<rule id="[^"]+">([\s\S]*?)<\/rule>/g)].map((r) => ({
    ins: [...r[1].matchAll(/<inputEntry[^>]*><text>([^<]*)</g)].map((m) => unx(m[1])),
    outs: [...r[1].matchAll(/<outputEntry[^>]*><text>([^<]*)</g)].map((m) => unx(m[1])),
  }));
  return { hit, ins, outs, rules };
}
function passt(test, wert) {
  if (test === '') return true;
  if (test === 'true' || test === 'false') return wert === (test === 'true');
  let m = test.match(/^(<=|>=|<|>)\s*([\d.]+)$/);
  if (m) return wert !== null && eval(wert + m[1] + m[2]);
  if (/^".*"$/.test(test)) return wert === JSON.parse(test);
  throw new Error('Unbekannter Test ' + test);
}
function werte(t, v) {
  const treffer = t.rules.filter((r) => r.ins.every((e, i) => passt(e, v[t.ins[i]] ?? null)));
  if (t.hit === 'UNIQUE' && treffer.length > 1) throw new Error('UNIQUE verletzt: ' + treffer.length + ' Treffer');
  if (!treffer.length) return null;
  return Object.fromEntries(t.outs.map((o, i) => [o, JSON.parse(treffer[0].outs[i])]));
}
const b = laden('T2_Berechtigungsregel.dmn');
const faelle = [
  [{ handlungsart: 'BESTELLUNG', betrag: 54, fallUngeklaert: false, abweichungMitFolgen: false }, 'KUNDENFREIGABE'],
  [{ handlungsart: 'BESTELLUNG', betrag: 24, fallUngeklaert: false, abweichungMitFolgen: false }, 'AUTOMATISCH'],
  [{ handlungsart: 'BESTELLUNG', betrag: 40, fallUngeklaert: false, abweichungMitFolgen: false }, 'AUTOMATISCH'],
  [{ handlungsart: 'BESTELLUNG', betrag: 24, fallUngeklaert: false, abweichungMitFolgen: true }, 'KUNDENFREIGABE'],
  [{ handlungsart: 'BESTELLUNG', betrag: 24, fallUngeklaert: true, abweichungMitFolgen: true }, 'PRUEFSTELLE'],
  [{ handlungsart: 'EINREICHUNG', betrag: null, fallUngeklaert: false, abweichungMitFolgen: false }, 'KUNDENFREIGABE'],
  [{ handlungsart: 'ERSATZVERSORGUNG' }, 'KUNDENFREIGABE'],
  [{ handlungsart: 'IRGENDWAS' }, 'KUNDENFREIGABE'],
];
let fehler = 0;
for (const [v, erwartet] of faelle) {
  const r = werte(b, v);
  const ok = r && r.freigabeweg === erwartet;
  if (!ok) fehler++;
  console.log(ok ? 'OK    ' : 'FEHLER', JSON.stringify(v), '->', r && r.freigabeweg, '|', r && r.begruendung);
}
const p = laden('T2_Versorgungsprofil.dmn');
for (const id of ['TP-M', 'TP-HS', 'TP-SCHNELL']) {
  const r = werte(p, { produktId: id });
  const ok = r && Object.keys(r).length === 21;
  if (!ok) fehler++;
  console.log(ok ? 'OK    ' : 'FEHLER', id, '->', r && r.produkt, r && r.zielbestand, r && r.fristBestaetigungLieferant);
}
if (werte(p, { produktId: 'GIBTSNICHT' }) !== null) { fehler++; console.log('FEHLER unbekanntes Produkt liefert Treffer'); }
console.log('DMN-Prüfung:', fehler, 'Fehler');
process.exit(fehler ? 1 : 0);
