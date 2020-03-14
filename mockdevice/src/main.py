import websocket
try:
    import thread
except ImportError:
    import _thread as thread
import time
import os
import json
import threading

HOST = os.environ.get('host') or "localhost"
PORT = os.environ.get('port') or "3667"

DEVICE = {
    "id": "m2",
    "name": "mock device in python",
    "states": {
        "saw_down_mock": {"location": "livingroom", "unit": "rpm"},
        "light_bottom": {"location": "livingroom", "type": "switch"}
    }
}


def on_open(ws):
    print("Connected to " + HOST + ":" + PORT)

    ws.send(
        json.dumps({
            "key": "device",
            "value": DEVICE
        }))

    ws.send(
        json.dumps({
            "key": "register",
            "value": {
                "id": DEVICE["id"],
                "key": "light_bottom"
            }
        }))


def on_error(ws, error):
    print(error)


def on_close(ws):
    print("### closed ###")
    # thread.start_new_thread(init, ())


def messageHandler():
    light_state = 0

    def on_message(ws, message):
        nonlocal light_state

        print(message)
        data = json.loads(message)

        if data["key"] == "light_bottom":
            oldValue = None
            if data["value"] is not None:
                oldValue = light_state
                light_state = data["value"]

            if oldValue != light_state:
                ws.send(
                    json.dumps({
                        "key": "light_bottom",
                        "transaction_id": data.get("transaction_id"),
                        "value": light_state
                    }))
    return on_message


def saw_down():
    saw = 100

    def new_val():
        nonlocal saw
        saw = saw - 1
        if saw < 0:
            saw = 100

        ws.send(
            json.dumps({
                "key": "saw_down_mock",
                "value": saw
            }))
    return new_val


def set_interval(func, sec):
    def func_wrapper():
        set_interval(func, sec)
        func()
    t = threading.Timer(sec, func_wrapper)
    t.start()
    return t


if __name__ == "__main__":
    websocket.enableTrace(False)
    ws = websocket.WebSocketApp("ws://" + HOST + ":" + PORT,
                                on_message=messageHandler(),
                                on_error=on_error,
                                on_close=on_close)
    ws.on_open = on_open
    set_interval(saw_down(), 6)
    ws.run_forever()
