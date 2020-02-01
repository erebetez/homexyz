"use strict";

import { db, dbLog, dbError } from "./db";

// db store stuff

async function storeIot(device) {
  const client = await db().connect();

  try {
    await client.query("BEGIN");
    await storeDevice(client, device);
    await storeStates(client, device);
    await client.query("COMMIT");
  } catch (e) {
    dbError(e, { device: device });
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }
}

async function storeDevice(client, device) {
  const retr = await client.query("SELECT status FROM devices WHERE id = $1", [
    device.id
  ]);
  let text: string;

  if (retr.rowCount > 0) {
    // Existing device
    text =
      "UPDATE devices SET name = $2, description = $3, ip = $4, status = $5 WHERE id = $1";
  } else {
    // New device
    text =
      "INSERT INTO devices( id, name, description, ip, status ) VALUES($1, $2, $3, $4, $5)";
  }

  const values = [device.id, device.name, device.desc, device.ip, "up"];

  await client.query(text, values);
}

async function storeStates(client, device) {
  const retr = await client.query("SELECT key FROM states WHERE id = $1", [
    device.id
  ]);
  const existingKeys = retr.rows.map(x => x.key);

  let text: string;

  for (let key in device.states) {
    if (existingKeys.includes(key)) {
      text =
        "UPDATE states SET id = $2, updated = NOW(), attribute = $3 WHERE key = $1";
    } else {
      text =
        "INSERT INTO states( key, id, inserted, updated, attribute ) VALUES($1, $2, NOW(), NOW(), $3)";
    }

    const values = [key, device.id, JSON.stringify(device.states[key])];

    await client.query(text, values);
  }
}

async function updateDeviceState(id, newState) {
  let text = "UPDATE devices SET status = $1";
  let values = [newState];

  if (id) {
    text += " WHERE id = $2";
    values.push(id);
  }

  try {
    await db().query(text, values);
  } catch (e) {
    dbError(e, { text: text, values: values });
  }
}

async function storeEvent(event) {
  const text =
    "INSERT INTO events(key, inserted, value, trail) VALUES($1, NOW(), $2, $3)";
  const values = [
    event.key,
    JSON.stringify(event.value),
    JSON.stringify(event.trail)
  ];

  try {
    await db().query(text, values);
  } catch (e) {
    dbError(e, { text: text, values: values, evnet: event });
  }
}

// db getter

function getDevices(cb) {
  getTable("devices", cb);
}

function getStates(cb) {
  getTable("states", cb);
}

async function getTable(table: string, cb) {
  const text = "SELECT * FROM " + table;

  try {
    let retr = await db().query(text);
    cb(false, retr);
  } catch (e) {
    cb(e, false);
  }
}

function getDeviceById(id, cb) {
  getDevice(id, "d.id", cb);
}

function getDeviceByKey(key, cb) {
  getDevice(key, "s.key", cb);
}

async function getDevice(selector, where, cb) {
  const text =
    "SELECT d.id, d.name, d.description, d.ip, d.status, s.key, s.attribute FROM devices d LEFT JOIN states s ON d.id = s.id WHERE " +
    where +
    " = $1";

  try {
    let retr = await db().query(text, [selector]);
    cb(false, retr);
  } catch (e) {
    cb(e, false);
  }
}

async function getLogs(cb) {
  getTable("logs", cb);
}

async function getEvents(key, query, cb) {
  let select = "SELECT key, inserted, value FROM events WHERE key = $1";
  let where = "";
  let order = "ORDER BY inserted desc";
  let limit = "";
  let params = [key];

  if (!query.from && !query.limit) {
    cb(
      Error("Missing 'from' or 'limit' from query: " + JSON.stringify(query)),
      undefined
    );
    return;
  }

  if (!query.to) {
    let now = Date.now();
    query.to = new Date(now).toISOString();
  }

  where += "AND inserted <= $2 ";
  params.push(query.to);

  if (query.from) {
    // TODO check for ISOString
    where += "AND inserted > $3 ";
    params.push(query.from);
  } else {
    limit += "LIMIT $3";
    params.push(query.limit);
  }

  let sql = [select, where, order, limit].join(" ");

  // console.log(sql);
  // console.log("params: " + JSON.stringify(params));

  try {
    let retr = await db().query(sql, params);
    cb(false, retr);
  } catch (e) {
    cb(e, false);
  }
}

export {
  storeEvent,
  storeIot,
  getDevices,
  updateDeviceState,
  getStates,
  getDeviceByKey,
  getDeviceById,
  getEvents,
  getLogs
};
