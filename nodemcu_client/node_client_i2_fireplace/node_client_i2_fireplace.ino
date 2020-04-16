#include <ArduinoWebsockets.h>
#include <ESP8266WiFi.h>
#include <ArduinoJson.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <DallasTemperature.h>
#include <OneWire.h>
#include <Adafruit_BMP280.h>

const char *ssid = "powder";
const char *password = "123456";
const char *websockets_server = "ws://moria:3667";

// Device properties
const String id = "i2";
const String name = "fireplace";
const String desc = "Next to fireplace";

String states = "";

// Assign variables to GPIO pins
const int output2 = 2;

// DHT11
const int input5 = 5;

// DS18B20
#define ONE_WIRE_BUS 4

// sensor setup

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

#define DHTTYPE DHT11

DHT dht(input5, DHTTYPE);

Adafruit_BMP280 bmp; // I2C Interface
const int BMP280_SCL = 12;
const int BMP280_SDA = 14;
// NOTE: CSB and SDD must be HIGH in order to use I2C.

const uint32_t readIntervall = 30000;
long readIntervall_lastMillis = 0;

const uint32_t sendIntervall = 600000; // 10min
long sendIntervall_lastMillis = 0;

// States
int fanOn = 0;
int lightOn = 2;

// Data
float t1 = 0.0;
float t2 = 0.0;
float t4 = 0.0;
float h = 0.0;
float pressure = 0.0;
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

  dht.begin();
  sensors.begin();

  Wire.begin(BMP280_SDA, BMP280_SCL);

  if (!bmp.begin())
  {
    Serial.println(F("Could not find a valid BMP280 sensor, check wiring!"));
    while (1)
      ;
  }

  // Set states
  states = "{";
  states += "\"temperature1\": {\"location\": \"livingroom\",\"type\": \"sensor\", \"unit\": \"°C\"},";
  states += "\"temperature2\": {\"location\": \"livingroom\",\"type\": \"sensor\", \"unit\": \"°C\"},";
  states += "\"temperature4\": {\"location\": \"livingroom\",\"type\": \"sensor\", \"unit\": \"°C\"},";
  states += "\"humidity1\": {\"location\": \"livingroom\",\"type\": \"sensor\", \"unit\": \"%\"},";
  states += "\"presure1\": {\"location\": \"livingroom\",\"type\": \"sensor\", \"unit\": \"hPa\"},";
  states += "\"fireplace_fan\": {\"location\": \"fireplace\",\"type\": \"switch\",\"range\": [0,1]},";
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
  if (currentMillis - readIntervall_lastMillis > readIntervall)
  {
    readIntervall_lastMillis = currentMillis;
    readDataTemperatureDHT();
    readDataTemperatureOneWire();
    readDataHumidity();
    readBMP280();
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

void readDataTemperatureOneWire()
{
  sensors.requestTemperatures();

  float newT01 = sensors.getTempCByIndex(0);
  float newT02 = sensors.getTempCByIndex(1);

  if (newT01 == -127)
  {
    Serial.println("Failed to read temperature from DS18B20 sensor!");
    if (tempBottom != -127)
    {
      client.send("{\"key\": \"fireplace_temp_bottom\", \"value\": null}");
      client.send("{\"key\": \"log\", \"value\": {\"id\": \"" + id + "\", \"key\": \"fireplace_temp_bottom\", \"message\": \"Failed to read temperature from DS18B20 sensor!\" }}");
    }

    tempBottom = newT01;
  }
  else if (abs(tempBottom - newT01) > 0.1)
  {
    tempBottom = newT01;
    Serial.println(tempBottom);
    client.send("{\"key\": \"fireplace_temp_bottom\", \"value\":" + String(tempBottom) + "}");
  }

  if (newT02 == -127)
  {
    Serial.println("Failed to read temperature from DS18B20 sensor!");
    if (t2 != -127)
    {
      client.send("{\"key\": \"temperature2\", \"value\": null}");
      client.send("{\"key\": \"log\", \"value\": {\"id\": \"" + id + "\", \"key\": \"temperature2\", \"message\": \"Failed to read temperature from DS18B20 sensor!\" }}");
    }

    t2 = newT02;
  }
  else if (abs(t2 - newT02) > 0.1)
  {
    t2 = newT02;
    Serial.println(tempBottom);
    client.send("{\"key\": \"temperature2\", \"value\":" + String(t2) + "}");
  }
  return;
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
      client.send("{\"key\": \"log\", \"value\": {\"id\": \"" + id + "\", \"key\": \"temperature1\", \"message\": \"Failed to read temperature from DHT11 sensor!\" }}");
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
      client.send("{\"key\": \"log\", \"value\": {\"id\": \"" + id + "\", \"key\": \"humidity1\", \"message\": \"Failed to read humidity from DHT11 sensor!\" }}");
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

void readBMP280()
{
  // FIXME What is returne when read fails?
  t4 = bmp.readTemperature();
  Serial.print(F("Temperature = "));
  Serial.print(t4);
  Serial.println(" *C");

  client.send("{\"key\": \"temperature4\", \"value\":" + String(t4) + "}");

  pressure = bmp.readPressure() / 100;
  Serial.print(F("Pressure = "));
  Serial.print(pressure);
  Serial.println(" hPa");

  client.send("{\"key\": \"presure1\", \"value\":" + String(pressure) + "}");
}
