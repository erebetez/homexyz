import credentials


def do_connect():
    import network
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print('connecting to network...')
        wlan.connect(credentials.W_LAN_SSID, credentials.W_LAN_PWD)
        while not wlan.isconnected():
            pass
    return wlan.ifconfig()
