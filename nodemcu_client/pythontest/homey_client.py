import websocket
import os
import json
import connect

HOST = os.environ.get('host') or "localhost"
PORT = os.environ.get('port') or "3667"


def on_open_factory(device, register_list):

    def on_open(ws):
        print("Connected to " + HOST + ":" + PORT)

        ws.send(
            json.dumps({
                "key": "device",
                "value": device
            }))

        # loop over register list

        ws.send(
            json.dumps({
                "key": "register",
                "value": {
                    "id": device["id"],
                    "key": "light_bottom"
                }
            }))

    return on_open


def on_error(ws, error):
    print(error)


def on_close(ws):
    print("### closed ###")
    ws.close()
    # FIXME reopen connection
    # init_ws()


def messageWrapper(on_message_logic):
    def on_message(ws, message):
        nonlocal on_message_logic

        print(message)
        if on_message_logic is not None:
            on_message_logic(send_wrapper(ws), json.loads(message))
    return on_message


def send_wrapper(ws):
    def send(data):
        nonlocal ws
        # FIXME error handling if send fails.
        ws.send(json.dumps(data))
    return send


def init_ws(device, register_list, on_message_logic):

    ifconfig = connect.do_connect()
    print('network config:', ifconfig)

    ws = websocket.WebSocketApp("ws://" + HOST + ":" + PORT,
                                on_message=messageWrapper(on_message_logic),
                                on_error=on_error,
                                on_close=on_close)
    # TODO if connected or ws open just return send function
    ws.on_open = on_open_factory(device, register_list)
    ws.run_forever()

    return send_wrapper(ws)
