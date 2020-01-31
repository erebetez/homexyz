"use strict";
const WebSocket = require("ws");

const magic = "magic";

const device = {
  id: "l1",
  name: "fireplace logic",
  states: {
    fireplace_logic_request: { type: "logic" }
  }
};

const host = process.env.host || "localhost";
const port = process.env.port || "3667";

const startTemp = 60;
const minTemp = 50;

let temp = 0;
let light = 0;
let fan = 0;

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
    ["fireplace_fan", "livingroom_light", "fireplace_temp_bottom"].forEach(
      key => {
        ws.send(
          JSON.stringify({
            key: "register",
            value: {
              id: device.id,
              key: key
            }
          })
        );
      }
    );
  });

  // TODO should request or get fan state on 'open'

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

    if (data.key === "fireplace_temp_bottom") {
      temp = data.value;
      let decision = logic();
      sendRequest(decision, data);
    }
    if (data.key === "livingroom_light") {
      light = data.value;
      let decision = logic();
      sendRequest(decision, data);
    }
    if (data.key === "fireplace_fan") {
      fan = data.value;
    }
  });

  function sendRequest(decision, data) {
    if (decision) {
      ws.send(
        JSON.stringify({
          key: "fireplace_fan",
          origin: data.key,
          transaction_id: data.transaction_id,
          value: decision
        })
      );
    }
  }
};

function logic() {
  if (temp >= startTemp && light == 1 && fan == 0) {
    return 1;
  }

  if ((temp < minTemp || light == 0) && fan == 1) {
    return 0;
  }

  return undefined;
}

connection();

process.on("SIGINT", code => {
  process.exit();
});

process.on("SIGTERM", code => {
  process.exit();
});
