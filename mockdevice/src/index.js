'use strict';
const WebSocket = require('ws');

const magic = "magic";



const device = {
    id: "m1",
    name: "mock device",
    states: {
        temperature_mock: { location: "kitchen", unit: "°C" },
        light_top: { location: "other room", type: "switch" }
    }
}

let someState = 0;

const connection = function () {
    const ws = new WebSocket('ws://192.168.0.6:3667');

    ws.on('open', () => {
        ws.send(JSON.stringify({
            key: 'device',
            value: device
        }));

        ws.send(JSON.stringify({
            key: 'light_top',
            value: someState
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
        let newVal = Math.ceil(Math.random() * 100);

        ws.send(JSON.stringify({
            key: 'temperature_mock',
            value: newVal
        }));
    }, 5000)

}

connection();
