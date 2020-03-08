"use strict";
const WebSocket = require("ws");
const fireplaceLogic = require("./fireplace");

const magic = "magic";

const device = {
  id: "l1",
  name: "The logic service",
  states: {
    fireplace_logic_request: { type: "logic" }
  }
};

const host = process.env.homeyhost || "localhost";
const port = process.env.homeyport || "3667";

const fireplace = fireplaceLogic();

const connection = function() {
  const ws = new WebSocket("ws://" + host + ":" + port);

  ws.on("open", () => {
    console.log("Connected to " + host + ":" + port);
    ws.send(
      JSON.stringify({
        key: "device",
        value: device
      })
    );

    // register interested parameter
    fireplace.observe.forEach(registerKey(ws));
  });

  ws.on("error", err => {
    console.log(err.message);
  });

  ws.on("close", () => {
    console.log("connection closed. Try reconnect in 5s.");
    setTimeout(connection, 5000);
  });

  ws.on("message", event => {
    console.log(event);
    // TODO catch parsing error
    let data = JSON.parse(event);

    fireplace.eval(data, sendRequest(ws, data));
  });

  function sendRequest(ws, data) {
    return (key, value, origin) => {
      console.log("Sending logic request:");
      console.log("data: " + data + ", key:" + key + ", value: " + value);
      if (key && value !== undefined) {
        ws.send(
          JSON.stringify({
            key: key,
            value: value,
            trail: {
              trigger: data.key,
              origin: origin
            },
            transaction_id: data.transaction_id
          })
        );
      }
    };
  }
};

function registerKey(ws) {
  return key => {
    ws.send(
      JSON.stringify({
        key: "register",
        value: {
          id: device.id,
          key: key
        }
      })
    );
  };
}

connection();

process.on("SIGINT", code => {
  process.exit();
});

process.on("SIGTERM", code => {
  process.exit();
});
