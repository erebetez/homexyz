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

const minTemp = 50;

let temp = 0;
let light = 0;
let fan = 0;

const connection = function() {
  const ws = new WebSocket("ws://moria:3667");

  ws.on("open", () => {
    ws.send(
      JSON.stringify({
        key: "device",
        value: device
      })
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
      sendRequest(decision, data.transaction_id);
    }

    // fireplace_fan
  });

  function sendRequest(decision, transaction_id) {
    if (decision) {
      ws.send(
        JSON.stringify({
          key: "fireplace_fan",
          transaction_id: transaction_id,
          value: decision
        })
      );
    }
  }
};

function logic() {
  if (temp >= minTemp && fan === 0) {
    return 1;
  }

  if (temp < minTemp && fan === 1) {
    return 0;
  }

  return undefined;
}

connection();