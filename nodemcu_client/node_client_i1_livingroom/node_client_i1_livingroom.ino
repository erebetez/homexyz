#include <ArduinoWebsockets.h>
#include <ESP8266WiFi.h>
#include <ArduinoJson.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>

const char *ssid = "powder";
const char *password = "fire3000EQ.-";
const char *websockets_server = "ws://moria:3667";

// Device properties
const String id = "i1";
const String name = "livingroom";
const String desc = "Test node";

String states = "";

// Assign output variables to GPIO pins
const int output2 = 2;
const int fan_ctr_ = 14;

const uint32_t interval = 30000;
long lastMillis = 0;

// Sensors
Adafruit_BMP280 bmp; // I2C Interface

// States
int output2State = 0;
int fan_ctr_State = 0;

// Data
float pressure = 0.0;
float temperature = 0.0;

using namespace websockets;
WebsocketsClient client;

void setup()
{
  Serial.begin(115200);

  // Initialize the output variables as outputs
  pinMode(output2, OUTPUT);
  pinMode(fan_ctr_, OUTPUT);

  // Set outputs to LOW
  digitalWrite(output2, LOW);
  digitalWrite(fan_ctr_, LOW);

  if (!bmp.begin())
  {
    Serial.println(F("Could not find a valid BMP280 sensor, check wiring!"));
    while (1)
      ;
  }

  // Set states
  states = "{";
  states += "\"led1\": {\"location\": \"test\",\"type\": \"switch\",\"range\": [0,1]},";
  states += "\"led2\": {\"location\": \"test\",\"type\": \"dimmer\", \"range\": [0,9]}";
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

      int oldValue = fan_ctr_State;
      fan_ctr_State = event["value"];

      if (fan_ctr_State == 1)
      {
        digitalWrite(fan_ctr_, HIGH);
      }
      else
      {
        digitalWrite(fan_ctr_, LOW);
      }

      if (oldValue != fan_ctr_State)
      {
        client.send("{\"key\": \"led2\", \"transaction_id\": \"" + String(transaction_id) + "\", \"value\":" + String(fan_ctr_State) + "}");
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

void readBMP280()
{
  Serial.print(F("Temperature = "));
  Serial.print(bmp.readTemperature());
  Serial.println(" *C");

  Serial.print(F("Pressure = "));
  Serial.print(bmp.readPressure() / 100); //displaying the Pressure in hPa, you can change the unit
  Serial.println(" hPa");
}
