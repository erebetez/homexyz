#include <ArduinoWebsockets.h>
#include <ESP8266WiFi.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>

const char *ssid = "powder";
const char *password = "123456";
const char *websockets_server = "ws://moria:3667";

// Device properties
const String id = "i3";
const String name = "kitchen";
const String desc = "Kitchen under sink";

String states = "";

// DHT11
const int input4 = 4;

#define DHTTYPE DHT11

DHT dht(input4, DHTTYPE);

const uint32_t readIntervall = 30000;
long readIntervall_lastMillis = 0;

// States

// Data
float t3 = 0.0;
float h = 0.0;

using namespace websockets;
WebsocketsClient client;

void setup()
{
  Serial.begin(115200);

  pinMode(input4, INPUT);

  dht.begin();

  // Set states
  states = "{";
  states += "\"temperature3\": {\"location\": \"kitchen\",\"type\": \"sensor\", \"unit\": \"°C\"},";
  states += "\"humidity2\": {\"location\": \"kitchen\",\"type\": \"sensor\", \"unit\": \"%\"}";
  states += "}";

  // Connect to wifi
  WiFi.begin(ssid, password);

  // Wait some time to connect to wifi
  for (int i = 0; i < 10 && WiFi.status() != WL_CONNECTED; i++)
  {
    Serial.print(".");
    delay(1000);
  }

  // Print local IP address and start web server
  Serial.println("");
  Serial.println("WiFi connected.");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  Serial.println("");

  // Setup Callbacks
  client.onMessage(onMessageCallback);
  client.onEvent(onEventsCallback);
}

void onMessageCallback(WebsocketsMessage message)
{
  Serial.print("Got Message: ");
  Serial.println(message.data());
}

void onEventsCallback(WebsocketsEvent event, String data)
{
  if (event == WebsocketsEvent::ConnectionOpened)
  {
    Serial.println("Connnection Opened");
    client.send("{\"key\": \"device\", \"value\": {\"id\": \"" + id + "\",\"name\": \"" + name + "\",\"desc\": \"" + desc + "\",\"states\": " + states + "}}");
  }
  else if (event == WebsocketsEvent::ConnectionClosed)
  {
    Serial.println("Connnection Closed");
  }
  else if (event == WebsocketsEvent::GotPing)
  {
    Serial.println("Got a Ping!");
  }
  else if (event == WebsocketsEvent::GotPong)
  {
    Serial.println("Got a Pong!");
  }
}

void loop()
{

  long currentMillis = millis();
  if (currentMillis - readIntervall_lastMillis > readIntervall)
  {
    webSocketConnect();
    readIntervall_lastMillis = currentMillis;
    readDataTemperatureDHT();
    readDataHumidity();
  }
}

void webSocketConnect()
{
  if (client.available())
  {
    client.poll();
  }
  else if (client.connect(websockets_server))
  {
    Serial.println("Connected to ws.");
  }
  else
  {
    Serial.println("Could not connect to server: '" + String(websockets_server) + "'");
    delay(1000);
  }
}

void readDataTemperatureDHT()
{
  // Read temperature as Celsius (the default)
  float newT = dht.readTemperature();

  if (isnan(newT))
  {
    Serial.println("Failed to read temperature from DHT sensor!");
    if (t3 != -127)
    {
      client.send("{\"key\":\"temperature3\",\"value\": null}");
    }

    t3 = -127;
  }
  else if (abs(t3 - newT) > 0.1)
  {
    t3 = newT;
    Serial.println(t3);
    client.send("{\"key\":\"temperature3\",\"value\":" + String(t3) + "}");
  }
  return;
}

void readDataHumidity()
{
  // Read Humidity
  float newH = dht.readHumidity();

  if (isnan(newH))
  {
    Serial.println("Failed to read humidity from DHT sensor!");
    if (h != -127)
    {
      client.send("{\"key\":\"humidity2\",\"value\": null}");
    }

    h = -127;
  }
  else if (abs(h - newH) > 1)
  {
    h = newH;
    Serial.println(h);
    client.send("{\"key\":\"humidity2\",\"value\":" + String(h) + "}");
  }

  return;
}
