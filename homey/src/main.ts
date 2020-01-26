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

const devicePingInterval = 60 * 60 * 5;

// TODO's

// - SSL for https


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
            // FIXME what if no return of this trasaction happens. Add timeout?
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
    let registrations = {};

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

    const braodcastButSender = function (requestId, payload) {
        let data = JSON.stringify(payload);
        let reg = registrations[payload.key];

        if (reg) {
            Object.keys(reg).forEach((id) => {
                if (requestId != id) {
                    send(id, data);
                }
            });
        }
    }

    const broadcast = function (payload) {
        let data = JSON.stringify(payload);

        Object.keys(connections).forEach((id) => {
            send(id, data);
        });
    }

    const cleanup = function () {
        Object.keys(connections).forEach((id) => {
            const client = connections[id];
            if (!isOpen(client)) {

                // remove registrations
                Object.keys(registrations).forEach((key) => {
                    delete registrations[key][id];
                })

                // remove connection
                delete connections[id];
                updateDeviceState(id, 'down');
                dbLog('INFO', `Client ${id} closed connection.`, id, null, null);
            }
        });
    }

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
                    case 'register': {
                        let request = event.value;

                        // TODO check if request key actually exists.

                        let reg = registrations[request.key];
                        if (!reg) {
                            reg = {};
                        }
                        reg[request.id] = true;
                        registrations[request.key] = reg;

                        // send current value back
                        getEvents(request.key, {
                            limit: 1
                        }, (err, retr) => {
                            if (err) {
                                dbError(err);
                            } else if (retr.rowCount > 0) {
                                send(request.id, JSON.stringify(retr.rows[0]))
                            } else {
                                console.log(`No data yet for ${request.key}, can't send anything.`);
                            }
                        })
                        break;
                    }
                    default: {
                        q.push(event);
                        break;
                    }
                }
            });

            // setInterval(() => {
            //     ws.ping(() => {
            //         let gotIt = false;
            //         setTimeout(() => {
            //             if (!gotIt) {
            //                 ws.close();
            //             }
            //         }, 5000);
            //         ws.on('pong', () => {
            //             gotIt = true;
            //         });
            //     });
            // }, devicePingInterval)
        },
        broadcast: broadcast,
        braodcastButSender: braodcastButSender,
        sendTo: (device: any, payload: any) => {
            send(device.id, JSON.stringify(payload));
        }
    }
}()


const startWss = function () {
    const wss = new WebSocket.Server({ server: http, port: ws_port, clientTracking: false });
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
                    connectionHandler.braodcastButSender(retr.rows[0], row);
                }
            });

            break;
        case 'devices':
            // TODO don't use butSender function. send to everyone including sender.
            connectionHandler.broadcast({ key: 'devices', value: row });
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

process.on('SIGINT', async (code) => {
    await houskeeping();
    process.exit();
});

process.on('SIGTERM', async (code) => {
    await houskeeping();
    process.exit();
});

async function houskeeping() {
    http.close();
    // set all devices to 'down'
    await updateDeviceState(undefined, 'down');
    dbEnd();
}
