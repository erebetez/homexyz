from machine import Pin
from machine import Timer

SCAN_INTERVAL = 2000


def blinker():
    print('setup blinker')
    p0 = Pin(2, Pin.OUT)
    blink_state = 0

    def cb(args):
        nonlocal blink_state
        print('update blink')
        print(blink_state)
        if blink_state == 0:
            p0.off()
            blink_state = 1
        else:
            p0.on()
            blink_state = 0

    return cb


blink_timer = Timer(-1)

blink_timer.init(period=SCAN_INTERVAL, mode=Timer.PERIODIC, callback=blinker())
