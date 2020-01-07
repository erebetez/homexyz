import React from "react";
import { ServiceData, Events } from "./provider.js";
import { ToggleButton, LastValue, HistoryDisplay } from "./widgets.js";
import { Devices } from "./devices.js";

function App() {
  return (
    <div className="App" class="container">
      <h1>HomeX</h1>
      <ServiceData>
        {(loading, devices, states) => {
          if (loading) {
            return <div>Loading...</div>;
          } else {
            return (
              <div>
                <Devices devices={devices} states={states}></Devices>
                <hr></hr>
                <h4>Fireplace</h4>
                <Events select="fireplace_fan" last="1">
                  {(eventList, set) => (
                    <div>
                      <span>Fan: </span>
                      <LastValue
                        eventList={eventList}
                        state={states.fireplace_fan}
                      ></LastValue>
                      <ToggleButton
                        name="fireplace_fan"
                        event={eventList[0]}
                        set={set}
                      ></ToggleButton>
                    </div>
                  )}
                </Events>

                <Events select="livingroom_light" last="1">
                  {(eventList, set) => (
                    <div>
                      <span>Light: </span>
                      <LastValue
                        eventList={eventList}
                        state={states.livingroom_light}
                      ></LastValue>
                    </div>
                  )}
                </Events>

                <Events select="fireplace_temp_bottom" last="100">
                  {(eventList, set) => (
                    <div>
                      <span>Temp bottom: </span>
                      <LastValue
                        eventList={eventList}
                        state={states.fireplace_temp_bottom}
                      ></LastValue>
                      <HistoryDisplay
                        eventList={eventList}
                        state={states.fireplace_temp_bottom}
                      ></HistoryDisplay>
                    </div>
                  )}
                </Events>

                <hr></hr>
                <h4>Livingroom</h4>
                <Events select="led1" last="1">
                  {(eventList, set) => (
                    <ToggleButton
                      name="button_led1"
                      event={eventList[0]}
                      set={set}
                    ></ToggleButton>
                  )}
                </Events>

                <Events select="led2" last="1">
                  {(eventList, set) => (
                    <ToggleButton
                      name="button_led2"
                      event={eventList[0]}
                      set={set}
                    ></ToggleButton>
                  )}
                </Events>

                <Events select="temperature2" last="100">
                  {(eventList, set) => (
                    <div>
                      <span>Temp corner: </span>
                      <LastValue
                        eventList={eventList}
                        state={states.temperature2}
                      ></LastValue>
                      <HistoryDisplay
                        eventList={eventList}
                        state={states.temperature2}
                      ></HistoryDisplay>
                    </div>
                  )}
                </Events>

                <Events select="humidity1" last="100">
                  {(eventList, set) => (
                    <div>
                      <span>Humidity corner: </span>
                      <LastValue
                        eventList={eventList}
                        state={states.humidity1}
                      ></LastValue>
                      <HistoryDisplay
                        eventList={eventList}
                        state={states.humidity1}
                      ></HistoryDisplay>
                    </div>
                  )}
                </Events>

                <hr></hr>
                <h4>Mockdevice</h4>

                <Events select="light_top" last="1">
                  {(eventList, set) => (
                    <ToggleButton
                      name="button_mock_state"
                      event={eventList[0]}
                      set={set}
                    ></ToggleButton>
                  )}
                </Events>

                <Events select="temperature_mock" last="100">
                  {(eventList, set) => (
                    <React.Fragment>
                      <ul>
                        {eventList.map(item => (
                          <li key={item.inserted}>
                            {item.inserted} ": " {item.value}
                          </li>
                        ))}
                      </ul>
                    </React.Fragment>
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
