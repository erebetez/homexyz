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
const String id = "i3";
const String name = "corner";
const String desc = "Livingroom Fireplace corner";

String states = "";

// Assign output variables to GPIO pins
const int output2 = 2;
const int input5 = 5;

// DS18B20
#define ONE_WIRE_BUS 4

// DHT11
const int input5 = 5;

#define DHTTYPE DHT11

DHT dht(input5, DHTTYPE);

// sensor setup

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

const uint32_t readIntervall = 30000;
long readIntervall_lastMillis = 0;

const uint32_t sendIntervall = 600000; // 10min
long sendIntervall_lastMillis = 0;

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

  pinMode(input5, INPUT);

  // Set outputs to LOW
  digitalWrite(output2, HIGH);

  dht.begin();
  sensors.begin();

  // Set states
  states = "{";
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

    if (strcmp(key, "bla_bla") == 0)
    {
      Serial.print("Nothing to controll");
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
    //client.send("{\"key\": \"register\", \"value\": {\"key\": \"fireplace_fan\", \"id\": \"" + id + "\"}}");
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
  if (currentMillis - readIntervall_lastMillis > readIntervall)
  {
    readIntervall_lastMillis = currentMillis;
    readDataTemperatureOneWire();
    readDataTemperatureDHT();
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
  else if (abs(t1 - newT) > 0.5)
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
