#include <ArduinoWebsockets.h>
#include <ESP8266WiFi.h>
#include <ArduinoJson.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>

const char* ssid     = "ssid";
const char* password = "123456";
const char* websockets_server = "ws://192.168.0.5:3667";


// Device properties
const String id = "i1";
const String name = "fireplace";
const String desc = "Next to fireplace";

String states = "";


// Assign output variables to GPIO pins
const int output2 = 2;
const int output4 = 4;

// DHT11
const int input5 = 5;

// Light
const int input15 = 15;
int lightOn = 0;

// KY035
const int input0 = A0;
int a0inputVal  = 0;


// sensor setup
#define DHTTYPE    DHT11     // DHT 11
//#define DHTTYPE    DHT22     // DHT 22 (AM2302)
//#define DHTTYPE    DHT21     // DHT 21 (AM2301)

DHT dht(input5, DHTTYPE);

const uint32_t interval = 30000;
long lastMillis = 0;

// States
int output2State = 0;
int output4State = 0;

// Data
float t = 0.0;
float h = 0.0;

using namespace websockets;
WebsocketsClient client;


void setup() {
  Serial.begin(115200);

  // Initialize the output variables as outputs
  pinMode(output2, OUTPUT);
  pinMode(output4, OUTPUT);
  pinMode(input5, INPUT);
  // Set outputs to LOW
  digitalWrite(output2, LOW);
  digitalWrite(output4, LOW);

  dht.begin();


  // Set states
  states = "{";
  states += "\"led1\": {\"location\": \"livingroom\",\"type\": \"switch\",\"range\": [0,1]},";
  states += "\"led2\": {\"location\": \"kitchen\",\"type\": \"dimmer\", \"range\": [0,9]},";
  states += "\"temperature1\": {\"location\": \"livingroom\",\"type\": \"sensor\", \"unit\": \"°C\"},";
  states += "\"humidity1\": {\"location\": \"livingroom\",\"type\": \"sensor\", \"unit\": \"%\"}";
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
      
      if (strcmp(key, "led1") == 0) {

        int oldValue = output2State;
        output2State = event["value"];

        if (output2State == 1) {
          digitalWrite(output2, HIGH);
        } else {
          digitalWrite(output2, LOW);
        }

        // NOTE in order to prevent infinit loops between server and client. Last server implementation does not broadcast to sender. So risiko is small now.
        if (oldValue != output2State) {
           client.send("{\"key\": \"led1\", \"transaction_id\": \"" + String(transaction_id) + "\", \"value\":" + String(output2State) + "}");
        }      
      }
      else if (strcmp(key, "led2") == 0) {

        int oldValue = output4State;
        output4State = event["value"];

        if (output4State == 1) {
          digitalWrite(output4, HIGH);
        } else {
          digitalWrite(output4, LOW);
        }

        if (oldValue != output4State) {
          client.send("{\"key\": \"led2\", \"transaction_id\": \"" + String(transaction_id) + "\", \"value\":" + String(output4State) + "}");
        }
      } 
      else {
           Serial.print("Not interesetd in: ");
           Serial.print(key);
      }
    }
}

void onEventsCallback(WebsocketsEvent event, String data) {
    if(event == WebsocketsEvent::ConnectionOpened) {
        Serial.println("Connnection Opened");
        client.send("{\"key\": \"device\", \"value\": {\"id\": \"" + id + "\",\"name\": \"" + name + "\",\"desc\": \"" + desc + "\",\"states\": " + states + "}}");

        delay(2000);
        // send current states of led1 and led2...
        client.send("{\"key\": \"led1\", \"value\":" + String(output2State) + "}");
        client.send("{\"key\": \"led2\", \"value\":" + String(output4State) + "}");

    } else if(event == WebsocketsEvent::ConnectionClosed) {
        Serial.println("Connnection Closed");
    } else if(event == WebsocketsEvent::GotPing) {
        Serial.println("Got a Ping!");
    } else if(event == WebsocketsEvent::GotPong) {
        Serial.println("Got a Pong!");
    }
}


void loop() {
  webScoketsConnect();

  // Do reading of sensors here
  long currentMillis = millis();
  if(currentMillis - lastMillis > interval){
    lastMillis = currentMillis;
    readDataTemperature();
    readDataHumidity();
  }

  // lightOn = digitalRead(input15);
  // Serial.println(lightOn);

  // a0inputVal = analogRead(input0); // Analog Values 0 to 1023
  // Serial.println (a0inputVal);
  // delay(1000);
}



void webScoketsConnect(){
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

void readDataTemperature(){
  // Read temperature as Celsius (the default)
  float newT = dht.readTemperature();

  if (isnan(newT)) {
    Serial.println("Failed to read temperature from DHT sensor!");
    return;
  }
  
  t = newT;
  Serial.println(t);
  client.send("{\"key\": \"temperature1\", \"value\":" + String(t) + "}");

  return;
}

void readDataHumidity(){
  // Read Humidity
  float newH = dht.readHumidity();

  if (isnan(newH)) {
    Serial.println("Failed to read humidity from DHT sensor!");
    return;
  }
  
  h = newH;
  Serial.println(h);
  client.send("{\"key\": \"humidity1\", \"value\":" + String(h) + "}");
  
  return;
}