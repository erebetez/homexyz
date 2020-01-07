'use strict';
const app = require('express')();
const http = require('http').createServer(app);
const WebSocket = require('ws');
const async = require('async');
const uuidv4 = require('uuid/v4');

import { storeEvent, storeIot, getDevices, updateDeviceState, getDeviceByKey, getStates, getDeviceById, getEvents, getLogs } from "./service";
import { setupNofication, dbError, dbLog, dbEnd } from "./db";


const port = 3666;
const ws_port = 3667

// TODO's

// - SSL for https
// - mDNS / bonjour


interface Event {
    key: string;
    transaction_id: string;
    value: object;
    trail: object;
}


const ensureEventObject = function (event) {
    if (!event.transaction_id) {
        event['transaction_id'] = uuidv4();
    }
    if (!event.trail) {
        event['trail'] = {}
    }
    return event;
}

const shouldTransaction = function (event) {
    return (event.trail.origin === undefined || event.trail.origin === event.key);
}

const transactionHandler = function () {
    let transactionTrails = {};

    return async (event, finish) => {
        event = ensureEventObject(event);
        let trailList = transactionTrails[event.transaction_id];
        if (trailList) {
            trailList.push(event.trail);
        } else {
            trailList = [event.trail];
        }

        if (shouldTransaction(event)) {
            event.trail = trailList;
            delete transactionTrails[event.transaction_id];
            await storeEvent(event);
            finish();
        } else {
            // FIXME queue item is closed before new request was send...
            transactionTrails[event.transaction_id] = trailList;
            getDeviceByKey(event.key, (err, retr) => {
                if (err) {
                    dbError(err, { event: event });
                    finish(err);
                } else {
                    connectionHandler.sendTo(retr.rows[0], event);
                    finish();
                }
            });
        }
    }
}()


const q = async.queue(transactionHandler, 1);

q.error(function (err, task) {
    dbError(err, { task: task });
});


const connectionHandler = function () {
    let connections = {};

    const isOpen = function (client) {
        return (client && client.readyState === WebSocket.OPEN)
    }

    const send = function (id, data) {
        const client = connections[id];
        if (isOpen(client)) {
            client.send(data);
        } else {
            delete connections[id];
            updateDeviceState(id, 'down');
            dbError(new Error(`Client ${id} not available.`), { data: data });
        }
    }

    const braodcastButSender = function (sender, payload) {
        let data = JSON.stringify(payload);

        Object.keys(connections).forEach((id) => {
            if (id !== sender.id) {
                send(id, data);
            }
        });
    }

    const cleanup = function () {
        Object.keys(connections).forEach((id) => {
            const client = connections[id];
            if (!isOpen(client)) {
                updateDeviceState(id, 'down');
                dbLog('INFO', `Client ${id} closed connection.`, id, null, null);
            }
        });
    }

    // TODO periodicaly ping client to check for up. 

    return {
        add: (ws, info) => {

            ws.on('close', async (code, reason) => {
                cleanup();
            })

            ws.on('error', (err) => {
                dbError(err);
                cleanup();
            })

            ws.on('message', async (message) => {
                console.log('got: %s', message);
                // FIXME catch parsing errors.
                let event = JSON.parse(message);

                switch (event.key) {
                    case 'device': {
                        let device = event.value;
                        device['ip'] = info.headers.host;

                        connections[device.id] = ws;

                        await storeIot(device);
                        break;
                    }
                    default: {
                        q.push(event);
                        break;
                    }
                }
            });
        },
        broadcast: (sender: any, payload: any) => {
            braodcastButSender(sender, payload);
        },
        sendTo: (device: any, payload: any) => {
            send(device.id, JSON.stringify(payload));
        }
    }
}()


const startWss = function () {
    // TODO could start with option to not track clients. is handlen in connection handler.
    const wss = new WebSocket.Server({ port: ws_port });

    wss.on('connection', connectionHandler.add);
}

app.get('/api/devices', (req, res) => {
    getDevices((err, retr) => {
        if (err) {
            dbError(err);
            res.status(500).send(err.message);
        } else {
            res.send(retr.rows);
        }
    })
})


app.get('/api/states', (req, res) => {
    getStates((err, retr) => {
        if (err) {
            dbError(err);
            res.status(500).send(err.message);
        } else {
            res.send(retr.rows);
        }
    })
})


app.get('/api/:id/state', (req, res) => {
    getDeviceById(req.params.id, (err, retr) => {
        if (err) {
            dbError(err);
            res.status(500).send(err.message);
        } else {
            res.send(retr);
        }
    })
})

app.get('/api/events/:key', (req, res) => {

    getEvents(req.params.key, req.query, (err, retr) => {
        if (err) {
            dbError(err);
            res.status(500).send(err.message);
        } else {
            res.send(retr.rows);
        }
    })
})

app.get('/api/logs', (req, res) => {
    getLogs((err, retr) => {
        if (err) {
            dbError(err);
            res.status(500).send(err.message);
        } else {
            res.send(retr.rows);
        }
    })
})


function notificationHandler(channel, row) {
    switch (channel) {
        case 'events':
            getDeviceByKey(row.key, (err, retr) => {
                if (err) {
                    dbError(err);
                } else {
                    delete row.trail; // do not broadcast trail.
                    connectionHandler.broadcast(retr.rows[0], row);
                }
            });

            break;
        case 'devices':
            // TODO don't use butSender function. send to everyone including sender.
            connectionHandler.broadcast(row, { key: 'devices', value: row });
            break;
        default:
            dbError(Error("Invalid notification handler. " + channel));
    }
}


http.listen(port, "0.0.0.0", () => {
    console.log(`Homey app listening on port ${port}!`);

    setupNofication(notificationHandler, (err) => {
        if (err) {
            console.error("Can't connect to pg db for notifications. " + err.message);
        } else {
            startWss();
        }
    });
})

process.on('SIGINT', (code) => {
    process.exit();
});

process.on('SIGTERM', (code) => {
    process.exit();
});

process.on('exit', (code) => {
    http.close();
    dbEnd();
});