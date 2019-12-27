import React from "react";
import { ServiceData, Events } from "./provider.js";
import { ToggleButton } from "./widgets.js";
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

                <Events select="temperature1" last="10">
                  {(eventList, set) => (
                    <React.Fragment>
                      <ul>
                        {eventList.map(item => (
                          <li key={item.inserted}>
                            {item.inserted} : {item.value}
                            {states.temperature1.attribute.unit}
                          </li>
                        ))}
                      </ul>
                    </React.Fragment>
                  )}
                </Events>

                <Events select="temperature2" last="10">
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

                <Events select="humidity1" last="10">
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

                <Events select="temperature_mock" last="10">
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
