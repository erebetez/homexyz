'use strict';
const WebSocket = require('ws');

const magic = "magic";

const host = process.env.host || "localhost";
const port = process.env.port || "3667";

const device = {
    id: "m1",
    name: "mock device",
    states: {
        temperature_mock: { location: "kitchen", unit: "°C" },
        possible_error_mock: { location: "livingroom", unit: "°C" },
        light_top: { location: "other room", type: "switch" }
    }
}

let someState = 0;

const connection = function () {
    const ws = new WebSocket("ws://" + host + ":" + port);

    ws.on('open', () => {
        console.log("Connected to " + host + ":" + port);
        ws.send(JSON.stringify({
            key: 'device',
            value: device
        }));

        ws.send(JSON.stringify({
            key: 'register',
            value: {
                id: device.id,
                key: 'light_top'
            }
        }));
    });

    ws.on('error', err => {
        console.log(err.message);
    })

    ws.on('close', () => {
        console.log("connection closed. Try reconnect in 5s.");
        setTimeout(connection, 5000);
    });

    ws.on('message', (event) => {
        console.log(event)
        let data = JSON.parse(event);

        // just interested in my key
        if (data.key === 'light_top') {
            let oldValue = someState;
            someState = data.value;
            console.log(`set someState to ${someState}`);
            // now we cn response with the new state.
            // FIXME this will probably make an endless loop.....
            // only sending if changed
            // FIXME origin is not send anymore....
            if (data.origin !== data.key && oldValue !== someState) {
                ws.send(JSON.stringify({
                    key: 'light_top',
                    transaction_id: data.transaction_id,
                    value: someState
                }));
            }
        }
    });

    setInterval(() => {
        let mult = (someState === 0) ? 3 : 100;
        let newVal = Math.ceil(Math.random() * mult);

        ws.send(JSON.stringify({
            key: 'temperature_mock',
            value: newVal
        }));
    }, 5000)

    setInterval(() => {
        let newVal = Math.ceil(Math.random() * 100);

        let isError = Math.random() > 0.8;

        if (isError) {
            newVal = null;
        }

        ws.send(JSON.stringify({
            key: 'possible_error_mock',
            value: newVal
        }));
    }, 10300)

}

connection();
