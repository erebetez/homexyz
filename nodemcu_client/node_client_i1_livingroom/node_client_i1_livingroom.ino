#include <ArduinoWebsockets.h>
#include <ESP8266WiFi.h>
#include <ArduinoJson.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <DallasTemperature.h>
#include <OneWire.h>

const char *ssid = "powder";
const char *password = "123456";
const char *websockets_server = "ws://moria:3667";

// Device properties
const String id = "i1";
const String name = "livingroom";
const String desc = "Corner of livingroom";

String states = "";

// Assign output variables to GPIO pins
const int output2 = 2;
const int output4 = 4;

// DHT11
const int input5 = 5;

// KY035
const int input0 = A0;
int a0inputVal = 0;

// DS18B20
#define ONE_WIRE_BUS 13

// sensor setup

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

#define DHTTYPE DHT11

DHT dht(input5, DHTTYPE);

const uint32_t interval = 30000;
long lastMillis = 0;

// States
int output2State = 0;
int output4State = 0;

// Data
float t1 = 0.0;
float t2 = 0.0;
float h = 0.0;

using namespace websockets;
WebsocketsClient client;

void setup()
{
  Serial.begin(115200);

  // Initialize the output variables as outputs
  pinMode(output2, OUTPUT);
  pinMode(output4, OUTPUT);
  pinMode(input5, INPUT);
  // Set outputs to LOW
  digitalWrite(output2, LOW);
  digitalWrite(output4, LOW);

  dht.begin();
  sensors.begin();

  // Set states
  states = "{";
  states += "\"led1\": {\"location\": \"livingroom\",\"type\": \"switch\",\"range\": [0,1]},";
  states += "\"led2\": {\"location\": \"kitchen\",\"type\": \"dimmer\", \"range\": [0,9]},";
  states += "\"temperature1\": {\"location\": \"livingroom\",\"type\": \"sensor\", \"unit\": \"°C\"},";
  states += "\"temperature2\": {\"location\": \"livingroom\",\"type\": \"sensor\", \"unit\": \"°C\"},";
  states += "\"humidity1\": {\"location\": \"livingroom\",\"type\": \"sensor\", \"unit\": \"%\"}";
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

    // FIXME ignore event["value"] === null;

    if (strcmp(key, "led1") == 0)
    {

      int oldValue = output2State;
      output2State = event["value"];

      if (output2State == 1)
      {
        digitalWrite(output2, HIGH);
      }
      else
      {
        digitalWrite(output2, LOW);
      }

      // NOTE in order to prevent infinit loops between server and client. Last server implementation does not broadcast to sender. So risiko is small now.
      if (oldValue != output2State)
      {
        client.send("{\"key\": \"led1\", \"transaction_id\": \"" + String(transaction_id) + "\", \"value\":" + String(output2State) + "}");
      }
    }
    else if (strcmp(key, "led2") == 0)
    {

      int oldValue = output4State;
      output4State = event["value"];

      if (output4State == 1)
      {
        digitalWrite(output4, HIGH);
      }
      else
      {
        digitalWrite(output4, LOW);
      }

      if (oldValue != output4State)
      {
        client.send("{\"key\": \"led2\", \"transaction_id\": \"" + String(transaction_id) + "\", \"value\":" + String(output4State) + "}");
      }
    }
    else
    {
      Serial.print("Not interesetd in: ");
      Serial.print(key);
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

    client.send("{\"key\": \"register\", \"value\": {\"key\": \"led1\", \"id\": \"" + id + "\"}}");
    client.send("{\"key\": \"register\", \"value\": {\"key\": \"led2\", \"id\": \"" + id + "\"}}");
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
    readDataTemperatureDHT();
    readDataTemperatureOneWire();
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
    if (t1 != -127)
    {
      client.send("{\"key\": \"temperature1\", \"value\": null}");
    }

    t1 = -127;
  }
  else if (abs(t1 - newT) > 0.1)
  {
    t1 = newT;
    Serial.println(t1);
    client.send("{\"key\": \"temperature1\", \"value\":" + String(t1) + "}");
  }
  return;
}

void readDataTemperatureOneWire()
{
  sensors.requestTemperatures();

  float newT = sensors.getTempCByIndex(0);

  if (newT == -127)
  {
    Serial.println("Failed to read temperature from DS18B20 sensor!");
    if (t2 != -127)
    {
      client.send("{\"key\": \"temperature2\", \"value\": null}");
    }
    t2 = newT;
  }
  else if (abs(t2 - newT) > 0.1)
  {
    t2 = newT;
    Serial.println(t2);
    client.send("{\"key\": \"temperature2\", \"value\":" + String(t2) + "}");
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
      client.send("{\"key\": \"humidity1\", \"value\": null}");
    }

    h = -127;
  }
  else if (abs(h - newH) > 1)
  {
    h = newH;
    Serial.println(h);
    client.send("{\"key\": \"humidity1\", \"value\":" + String(h) + "}");
  }

  return;
}
