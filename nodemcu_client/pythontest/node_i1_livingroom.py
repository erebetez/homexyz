from machine import Pin
from machine import Timer
import homey_client

LOOP_INTERVAL = 2000

DEVICE = {
    "id": "i1",
    "name": "livingroom",
    "desc": "Corner of livingroom",
    "states": {
        "temperature1": {"location": "livingroom", "type": "sensor", "unit": "°C"},
        "humidity1":    {"location": "livingroom", "type": "sensor", "unit": "%"},
    }
}

REGISTER_LIST = []


def messageHandler():
    light_state = 0

    def on_message(send, data):
        nonlocal light_state

        if data["key"] == "light_bottom" and data["value"] is not None:
            oldValue = light_state
            light_state = data["value"]

            if oldValue != light_state:
                send({
                    "key": "light_bottom",
                    "transaction_id": data.get("transaction_id"),
                    "value": light_state
                })
    return on_message


def setup():

    print("Setup temp sensor")
    p0 = Pin(2, Pin.IN)
    temperature = 0

    def loop(t):
        send = homey_client.init_ws(DEVICE, REGISTER_LIST,
                                    messageHandler())

        nonlocal temperature

        # read stuff
        t_new = 20
        if t_new != temperature:
            temperature = t_new
            send({
                "key": "temperature1",
                "value": temperature
            })

    blink_timer = Timer(-1)

    blink_timer.init(period=LOOP_INTERVAL,
                     mode=Timer.PERIODIC, callback=loop)
    # TODO stop timer on reconnection.


setup()
