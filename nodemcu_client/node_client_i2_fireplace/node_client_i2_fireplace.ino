#include <ArduinoWebsockets.h>
#include <ESP8266WiFi.h>
#include <ArduinoJson.h>
#include <DallasTemperature.h>
#include <OneWire.h>

const char *ssid = "powder";
const char *password = "123456";
const char *websockets_server = "ws://moria:3667";

// Device properties
const String id = "i2";
const String name = "fireplace";
const String desc = "Next to fireplace";

String states = "";

// Assign output variables to GPIO pins
const int output2 = 2;
const int input5 = 5;

// DS18B20
#define ONE_WIRE_BUS 4

// sensor setup

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

const uint32_t interval = 30000;
long lastMillis = 0;

// States
int fanOn = 0;
int lightOn = 2;

// Data
float tempBottom = 0.0;

using namespace websockets;
WebsocketsClient client;

void setup()
{
  Serial.begin(115200);

  // Initialize the output variables as outputs
  pinMode(output2, OUTPUT);
  pinMode(input5, INPUT);

  // Set outputs to LOW
  digitalWrite(output2, HIGH);

  sensors.begin();

  // Set states
  states = "{";
  states += "\"fireplace_fan\": {\"location\": \"fireplace\",\"type\": \"switch\",\"range\": [0,1]},";
  states += "\"livingroom_light\": {\"location\": \"livingroom\",\"type\": \"sensor\",\"range\": [0,1]},";
  states += "\"fireplace_temp_bottom\": {\"location\": \"fireplace\",\"type\": \"sensor\", \"unit\": \"°C\"}";
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

  if (message.data().indexOf("{\"key\":\"") == 0)
  {

    // maybe faster to check for key the c way. do json pars only for interesting messages.
    // Serial.print(message.data().indexOf("temperature1"));

    DynamicJsonDocument event(1024);
    deserializeJson(event, message.data());

    const char *key = event["key"];
    const char *transaction_id = event["transaction_id"];

    if (strcmp(key, "fireplace_fan") == 0)
    {

      int oldValue = fanOn;
      fanOn = event["value"];

      if (fanOn == 1)
      {
        digitalWrite(output2, LOW);
      }
      else
      {
        digitalWrite(output2, HIGH);
      }

      if (oldValue != fanOn)
      {
        client.send("{\"key\": \"fireplace_fan\", \"transaction_id\": \"" + String(transaction_id) + "\", \"value\":" + String(fanOn) + "}");
      }
    }
    else
    {
      Serial.print("Not interesetd in: ");
      Serial.println(key);
    }
  }
}

void onEventsCallback(WebsocketsEvent event, String data)
{
  if (event == WebsocketsEvent::ConnectionOpened)
  {
    Serial.println("Connnection Opened");
    client.send("{\"key\": \"device\", \"value\": {\"id\": \"" + id + "\",\"name\": \"" + name + "\",\"desc\": \"" + desc + "\",\"states\": " + states + "}}");

    delay(2000);
    // send register fireplace_fan
    client.send("{\"key\": \"register\", \"value\": {\"key\": \"fireplace_fan\", \"id\": \"" + id + "\"}}");
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
  webSocketConnect();

  long currentMillis = millis();
  if (currentMillis - lastMillis > interval)
  {
    lastMillis = currentMillis;
    readDataTemperatureOneWire();
    readLightSensor();
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

void readLightSensor()
{
  int newValue = digitalRead(input5);
  // Sensor return HIGH if light is off.
  if (newValue == HIGH)
  {
    newValue = 0;
  }
  else
  {
    newValue = 1;
  }

  if (lightOn != newValue)
  {
    lightOn = newValue;
    Serial.println(newValue);
    client.send("{\"key\": \"livingroom_light\", \"value\":" + String(lightOn) + "}");
  }
}

void readDataTemperatureOneWire()
{
  sensors.requestTemperatures();

  float newT = sensors.getTempCByIndex(0);

  if (newT == -127)
  {
    Serial.println("Failed to read temperature from DS18B20 sensor!");
    if (tempBottom != -127)
    {
      client.send("{\"key\": \"fireplace_temp_bottom\", \"value\": null}");
      client.send("{\"key\": \"log\", \"value\": {\"id\": \"" + id + "\", \"key\": \"fireplace_temp_bottom\", \"message\": \"Failed to read temperature from DS18B20 sensor!\" }}");
    }

    tempBottom = newT;
  }
  else if (abs(tempBottom - newT) > 1)
  {
    tempBottom = newT;
    Serial.println(tempBottom);
    client.send("{\"key\": \"fireplace_temp_bottom\", \"value\":" + String(tempBottom) + "}");
  }
  return;
}
