import React from "react";
import { ServiceData, Events } from "./provider.js";
import { ToggleButton, LastValue, HistoryDisplay } from "./widgets.js";
import { Devices } from "./devices.js";

function App() {
  return (
    <div className="App" class="container">
      <h1>HomeX</h1>
      <ServiceData>
        {(err, loading, devices, states) => {
          if (err) {
            return (<div class="alert alert-danger" role="alert">
              {err.message}
            </div>);
          } else if (loading) {
            return <div>Loading...</div>;
          } else {
            return (
              <div>
                <Devices devices={devices} states={states}></Devices>
                <hr></hr>
                <h4>Fireplace</h4>
                <Events select={["fireplace_fan", "livingroom_light"]} last="1">
                  {(err, eventDict) => (
                    <div>
                      <span>Fan: </span>
                      <LastValue
                        eventList={eventDict.fireplace_fan}
                        state={states.fireplace_fan}
                      ></LastValue>
                      <ToggleButton
                        name="fireplace_fan_button"
                        eventList={eventDict.fireplace_fan}
                      ></ToggleButton>
                      <span>Light: </span>
                      <LastValue
                        eventList={eventDict.livingroom_light}
                        state={states.livingroom_light}
                      ></LastValue>
                    </div>
                  )}
                </Events>

                <Events select={["fireplace_temp_bottom", "temperature2", "humidity1"]} last="100">
                  {(err, eventDict) => (
                    <div>
                      <span>Temp bottom: </span>
                      <LastValue
                        eventList={eventDict.fireplace_temp_bottom}
                        state={states.fireplace_temp_bottom}
                      ></LastValue>

                      <span>Temp corner: </span>
                      <LastValue
                        eventList={eventDict.temperature2}
                        state={states.temperature2}
                      ></LastValue>

                      <span>Humidity corner: </span>
                      <LastValue
                        eventList={eventDict.humidity1}
                        state={states.humidity1}
                      ></LastValue>

                      <HistoryDisplay
                        eventDict={eventDict}
                        states={states}
                      ></HistoryDisplay>
                    </div>
                  )}
                </Events>

                <hr></hr>
                <h4>Livingroom</h4>
                <Events select={["led1", "led2"]} last="1">
                  {(err, eventDict) => (
                    <div>
                      <ToggleButton
                        name="button_led1"
                        eventList={eventDict.led1}
                      ></ToggleButton>
                      <ToggleButton
                        name="button_led2"
                        eventList={eventDict.led2}
                      ></ToggleButton>
                    </div>
                  )}
                </Events>

                <hr></hr>
                <h4>Mockdevice</h4>

                <Events select={["light_top"]} last="5">
                  {(err, eventDict) => (
                    <div>
                      <LastValue
                        eventList={eventDict.light_top}
                        state={states.light_top}
                      ></LastValue>
                      <ToggleButton
                        name="button_mock_state"
                        eventList={eventDict.light_top}
                      ></ToggleButton>
                      <HistoryDisplay
                        eventDict={eventDict}
                        states={states}
                      ></HistoryDisplay>
                    </div>
                  )}
                </Events>

                <Events select={["temperature_mock", "possible_error_mock"]} last="0.5" type="days">
                  {(err, eventDict) => (
                    <div>
                      <span>temperature_mock corner: </span>
                      <LastValue
                        eventList={eventDict.temperature_mock}
                        state={states.temperature_mock}
                      ></LastValue>

                      <span>possible_error_mock corner: </span>
                      <LastValue
                        eventList={eventDict.possible_error_mock}
                        state={states.possible_error_mock}
                      ></LastValue>

                      <HistoryDisplay
                        eventDict={eventDict}
                        states={states}
                      ></HistoryDisplay>
                    </div>
                  )}
                </Events>
              </div>
            );
          }
        }}
      </ServiceData>
    </div>
  );
}

export default App;
