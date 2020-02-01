"use strict";
const { Pool } = require("pg");

let db = (function() {
  let pool;

  return () => {
    if (pool) {
      return pool;
    } else {
      pool = new Pool({
        user: "dbuser",
        host: "database.server.com",
        database: "mydb",
        password: "secretpassword",
        port: 3211
      });

      pool.on("error", (err: Error) => {
        console.error("pg pool error: " + err.message);
        pool = undefined;
      });

      return pool;
    }
  };
})();

function dbEnd() {
  db().end();
}

async function setupNofication(notify, cb) {
  let con;

  try {
    con = await db().connect();

    con.on("notification", msg => {
      notify(msg.channel, JSON.parse(msg.payload));
    });

    con.on("err", e => {
      dbError(e);
    });

    con.query("LISTEN devices");
    con.query("LISTEN events");
    cb(undefined);
  } catch (e) {
    cb(e);
  }
}

function dbLog(loglevel, message, id, key, irritants) {
  const text =
    "INSERT INTO logs( id, key, inserted, loglevel, message, irritants ) VALUES($1, $2, NOW(), $3, $4, $5)";
  const values = [id, key, loglevel, message, JSON.stringify(irritants)];

  // TODO Do fancy stuff with loglevel etc.

  db().query(text, values, (err, res) => {
    if (err) {
      console.error(err);
    }
  });
}

function dbError(err: Error, irritants?: any) {
  console.error(err);
  // NOTE js err object does not have irritants.
  dbLog("ERROR", err.message, null, null, irritants);
}

export { setupNofication, db, dbLog, dbError, dbEnd };
