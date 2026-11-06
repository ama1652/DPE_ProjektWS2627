'use strict';
// Prueft das Zusammenspiel mit der REST-Schnittstelle gegen eine nachgebildete Engine (kein CIB seven noetig).
const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

test('Worker holt einen Task, ruft den Handler auf und meldet typisierte Variablen zurück', async () => {
  const anfragen = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      anfragen.push({ url: req.url, body: body ? JSON.parse(body) : null, auth: req.headers.authorization });
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/engine-rest/external-task/fetchAndLock') {
        res.end(JSON.stringify([{
          id: 'task-1', topicName: 't2-reichweite-berechnen', activityId: 'T_Reichweite',
          processInstanceId: 'pi-1', businessKey: 'VG-T2-TEST',
          variables: {
            bestand: { value: 20, type: 'Long' }, verbrauchProTag: { value: 4, type: 'Integer' },
            tageBisNaechstePruefung: { value: 7, type: 'Integer' }, lieferzeitTage: { value: 3, type: 'Integer' },
          },
        }]));
      } else {
        res.statusCode = 204;
        res.end();
      }
    });
  });
  await new Promise((r) => server.listen(0, r));
  process.env.CIB_URL = 'http://127.0.0.1:' + server.address().port + '/engine-rest';
  delete require.cache[require.resolve('../t2-simulator')];
  const { schleife } = require('../t2-simulator');
  await schleife(true);
  server.close();

  const complete = anfragen.find((a) => a.url === '/engine-rest/external-task/task-1/complete');
  assert.ok(complete, 'complete wurde aufgerufen');
  assert.strictEqual(complete.auth, 'Basic ' + Buffer.from('demo:demo').toString('base64'));
  assert.deepStrictEqual(complete.body.variables.reichweiteTage, { value: 5, type: 'Long' });
  assert.deepStrictEqual(complete.body.variables.nachversorgungNoetig, { value: true, type: 'Boolean' });
  assert.strictEqual(complete.body.workerId, 'team2-simulator');
});
