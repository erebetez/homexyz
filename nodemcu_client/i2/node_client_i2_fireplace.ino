#include <ArduinoWebsockets.h>
#include <ESP8266WiFi.h>
#include <ArduinoJson.h>
#include <DallasTemperature.h>
#include <OneWire.h>

const char* ssid     = "ssid";
const char* password = "123456";
const char* websockets_server = "ws://moria:3667";


// Device properties
const String id = "i2";
const String name = "fireplace";
const String desc = "Next to fireplace";

String states = "";


// Assign output variables to GPIO pins
const int output2 = 2;

// DS18B20
#define ONE_WIRE_BUS 4

// sensor setup

OneWire oneWire(ONE_WIRE_BUS); 
DallasTemperature sensors(&oneWire);


const uint32_t interval = 30000;
long lastMillis = 0;

// States
int fanOn = 0;

// Data
float tempBottom = 0.0;

using namespace websockets;
WebsocketsClient client;


void setup() {
  Serial.begin(115200);

  // Initialize the output variables as outputs
  pinMode(output2, OUTPUT);
  // Set outputs to LOW
  digitalWrite(output2, HIGH);

  sensors.begin();

  // Set states
  states = "{";
  states += "\"fireplace_fan\": {\"location\": \"livingroom\",\"type\": \"switch\",\"range\": [0,1]},";
  states += "\"fireplace_temp_bottom\": {\"location\": \"fireplace\",\"type\": \"sensor\", \"unit\": \"°C\"}";
  states += "}";

  // Connect to wifi
  WiFi.begin(ssid, password);


  // Wait some time to connect to wifi
  for(int i = 0; i < 10 && WiFi.status() != WL_CONNECTED; i++) {
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

void onMessageCallback(WebsocketsMessage message) {
    Serial.print("Got Message: ");
    Serial.println(message.data());

    if (message.data().indexOf("{\"key\":\"") == 0){

      // maybe faster to check for key the c way. do json pars only for interesting messages.
      // Serial.print(message.data().indexOf("temperature1"));


      DynamicJsonDocument event(1024);
      deserializeJson(event, message.data());

      const char* key = event["key"];
      const char* transaction_id = event["transaction_id"];
      
      if (strcmp(key, "fireplace_fan") == 0) {

        int oldValue = fanOn;
        fanOn = event["value"];

        if (fanOn == 1) {
          digitalWrite(output2, LOW);
        } else {
          digitalWrite(output2, HIGH);
        }

        // NOTE in order to prevent infinit loops between server and client. Last server implementation does not broadcast to sender. So risiko is small now.
        if (oldValue != fanOn) {
           client.send("{\"key\": \"fireplace_fan\", \"transaction_id\": \"" + String(transaction_id) + "\", \"value\":" + String(fanOn) + "}");
        }      
      }      
      else {
           Serial.print("Not interesetd in: ");
           Serial.println(key);
      }
    }
}

void onEventsCallback(WebsocketsEvent event, String data) {
    if(event == WebsocketsEvent::ConnectionOpened) {
        Serial.println("Connnection Opened");
        client.send("{\"key\": \"device\", \"value\": {\"id\": \"" + id + "\",\"name\": \"" + name + "\",\"desc\": \"" + desc + "\",\"states\": " + states + "}}");

        delay(2000);
        // send current states
        client.send("{\"key\": \"fireplace_fan\", \"value\":" + String(fanOn) + "}");        

    } else if(event == WebsocketsEvent::ConnectionClosed) {
        Serial.println("Connnection Closed");
    } else if(event == WebsocketsEvent::GotPing) {
        Serial.println("Got a Ping!");
    } else if(event == WebsocketsEvent::GotPong) {
        Serial.println("Got a Pong!");
    }
}

void loop() {
  webSocketConnect();

  long currentMillis = millis();
  if(currentMillis - lastMillis > interval){
    lastMillis = currentMillis;    
    readDataTemperatureOneWire();
  }
}

void webSocketConnect(){
  if(client.available()) {
    client.poll();
  }
  else if (client.connect(websockets_server)) {
    Serial.println("Connected to ws.");
  }
  else {
    Serial.println("Could not connect to server: '" + String(websockets_server) + "'");
    delay(1000);
  }
}

void readDataTemperatureOneWire(){
  sensors.requestTemperatures();

  float newT = sensors.getTempCByIndex(0);

  if (newT == -127) {
    Serial.println("Failed to read temperature from DS18B20 sensor!");
    return;
  }

  if (tempBottom != newT){
    tempBottom = newT;
    Serial.println(tempBottom);
    client.send("{\"key\": \"fireplace_temp_bottom\", \"value\":" + String(tempBottom) + "}");
  }
  return;
}