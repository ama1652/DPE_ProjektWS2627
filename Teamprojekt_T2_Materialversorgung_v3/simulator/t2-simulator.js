#!/usr/bin/env node
'use strict';
// Simulierter Dienst-Worker fuer Team 2 (SIMULIERT, keine echten Bestellungen oder Nachrichten).
// Holt External Tasks von CIB seven ueber die REST-Schnittstelle, fuehrt den passenden Handler aus
// und meldet das Ergebnis zurueck. Keine Abhaengigkeiten, Node.js 18 oder neuer.
//
// Start:   node t2-simulator.js
// Optional: CIB_URL=http://localhost:8080/engine-rest  CIB_AUTH=demo:demo  SIM_LIEFERANT=auto

const { handlers } = require('./handlers');

const BASE = process.env.CIB_URL || 'http://localhost:8080/engine-rest';
const AUTH = 'Basic ' + Buffer.from(process.env.CIB_AUTH || 'demo:demo').toString('base64');
const WORKER_ID = 'team2-simulator';
const LIEFERANT_AUTO = process.env.SIM_LIEFERANT === 'auto';

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(method + ' ' + path + ' -> HTTP ' + res.status + ': ' + text.slice(0, 300));
  return text ? JSON.parse(text) : null;
}

// Camunda-Variablen {name: {value, type}} <-> einfaches Objekt
function vonCamunda(variables) {
  const v = {};
  for (const [name, { value }] of Object.entries(variables || {})) v[name] = value;
  return v;
}

function zuCamunda(obj) {
  const out = {};
  for (const [name, value] of Object.entries(obj)) {
    let type = 'String';
    if (value === null || value === undefined) type = 'Null';
    else if (typeof value === 'boolean') type = 'Boolean';
    else if (typeof value === 'number') type = Number.isInteger(value) ? 'Long' : 'Double';
    out[name] = { value: value === undefined ? null : value, type };
  }
  return out;
}

// A4: laufende Vorgaenge fuer dasselbe Produkt zaehlen (spaeter Aufgabe des echten Dienstes von Team 1)
async function laufendeVorgaenge(task) {
  const produktId = task.variables && task.variables.produktId && task.variables.produktId.value;
  if (!produktId) return 0;
  const liste = await api('GET', '/process-instance?processDefinitionKey=T2_Materialversorgung&variables=produktId_eq_' + encodeURIComponent(produktId));
  return (liste || []).filter((p) => p.id !== task.processInstanceId).length;
}

async function bearbeite(task) {
  const handler = handlers[task.topicName];
  try {
    if (!handler) throw new Error('Kein Handler für Topic ' + task.topicName);
    if (task.topicName === 't2-vorgang-eroeffnen') task.laufendeVorgaenge = await laufendeVorgaenge(task);
    const ergebnis = handler(vonCamunda(task.variables), task);
    await api('POST', '/external-task/' + task.id + '/complete', { workerId: WORKER_ID, variables: zuCamunda(ergebnis) });
    console.log(new Date().toISOString(), 'OK  ', task.topicName.padEnd(28), task.activityId, task.businessKey || '');
    if (LIEFERANT_AUTO) lieferantSimulieren(task);
  } catch (e) {
    console.error(new Date().toISOString(), 'FEHLER', task.topicName, e.message);
    // retries 0: der Fall wird als Incident im Cockpit sichtbar und nicht still uebergangen
    await api('POST', '/external-task/' + task.id + '/failure', {
      workerId: WORKER_ID, errorMessage: e.message.slice(0, 600), retries: 0, retryTimeout: 0,
    }).catch(() => {});
  }
}

// Optional: der simulierte Lieferant antwortet selbst (Leitgeschichte: Bestaetigung erst nach dem Nachfassen)
function lieferantSimulieren(task) {
  if (task.topicName !== 't3-nachfassen' || task.activityId !== 'ST_Nachfassen' || !task.businessKey) return;
  const senden = async (messageName, versuche = 10) => {
    for (let i = 0; i < versuche; i++) {
      try {
        await api('POST', '/message', { messageName, businessKey: task.businessKey });
        console.log(new Date().toISOString(), 'SIM ', messageName, task.businessKey);
        return;
      } catch (e) {
        await new Promise((r) => setTimeout(r, 3000)); // Instanz wartet evtl. noch nicht auf die Nachricht
      }
    }
  };
  setTimeout(async () => {
    await senden('MV_Bestellbestaetigung');
    setTimeout(async () => {
      await senden('MV_Versand_gemeldet');
      setTimeout(() => senden('MV_Zustellung_gemeldet'), 5000);
    }, 5000);
  }, 5000);
}

async function schleife(einmal = false) {
  const topics = Object.keys(handlers).map((topicName) => ({ topicName, lockDuration: 30000 }));
  do {
    try {
      const tasks = await api('POST', '/external-task/fetchAndLock', {
        workerId: WORKER_ID, maxTasks: 10, usePriority: true, asyncResponseTimeout: 20000, topics,
      });
      for (const task of tasks) await bearbeite(task);
    } catch (e) {
      console.error(new Date().toISOString(), 'Engine nicht erreichbar:', e.message);
      if (einmal) throw e;
      await new Promise((r) => setTimeout(r, 5000));
    }
  } while (!einmal);
}

module.exports = { schleife, vonCamunda, zuCamunda };

if (require.main === module) {
  console.log('Team-2-Simulator läuft gegen', BASE, LIEFERANT_AUTO ? '(Lieferant antwortet automatisch)' : '');
  console.log('Topics:', Object.keys(handlers).join(', '));
  schleife();
}
