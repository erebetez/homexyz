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
            return (
              <div class="alert alert-danger" role="alert">
                {err.message}
              </div>
            );
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

                <Events
                  select={[
                    "fireplace_temp_bottom",
                    "temperature1",
                    "temperature2",
                    "humidity1"
                  ]}
                  last="100"
                >
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
                        key="button_led1"
                        name="button_led1"
                        eventList={eventDict.led1}
                      ></ToggleButton>
                      <ToggleButton
                        key="button_led2"
                        name="button_led2"
                        eventList={eventDict.led2}
                      ></ToggleButton>
                    </div>
                  )}
                </Events>

                <hr></hr>
                <h4>Mockdevice</h4>
                <Events select={["light_top"]} type="count">
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
                    </div>
                  )}
                </Events>

                <hr></hr>

                <RangeChooser>
                  {(from, to) => (
                    <Events
                      key="mock-graph"
                      select={[
                        "temperature_mock",
                        "possible_error_mock",
                        "light_top"
                      ]}
                      from={from}
                      to={to}
                      type="days"
                    >
                      {(err, eventDict) => (
                        <div>
                          <div>
                            <span>temperature_mock: </span>
                            <LastValue
                              eventList={eventDict.temperature_mock}
                              state={states.temperature_mock}
                            ></LastValue>
                          </div>

                          <div>
                            <span>possible_error_mock: </span>
                            <LastValue
                              eventList={eventDict.possible_error_mock}
                              state={states.possible_error_mock}
                            ></LastValue>
                          </div>

                          <HistoryDisplay
                            eventDict={eventDict}
                            states={states}
                          ></HistoryDisplay>
                        </div>
                      )}
                    </Events>
                  )}
                </RangeChooser>
              </div>
            );
          }
        }}
      </ServiceData>
    </div>
  );
}

class RangeChooser extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      auto: true,
      range: 1,
      from: undefined,
      to: Date.now()
      // unit = days
    };
  }

  clickBack(ev) {
    console.log(ev);
  }
  clickNext(ev) {
    console.log(ev);
  }
  clickNewest(ev) {
    console.log(ev);
  }
  change(ev) {
    console.log(ev);
    this.setState({ range: ev.value });
  }

  componentDidMount() {
    this.state.from = this.state.to - this.state.range * 1000 * 60 * 60;
  }

  render() {
    if (this.state.from && this.state.to) {
      return (
        <div>
          <div class="form-group row">
            <button
              class="btn btn-primary col-sm-2"
              onClick={this.clickBack.bind(this)}
            >
              Back
            </button>
            <input
              class="form-control col-sm-2"
              type="number"
              onChange={this.change.bind(this)}
              value={this.state.range}
            />
            <button
              class="btn btn-secondary col-sm-2"
              onClick={this.clickNewest.bind(this)}
            >
              To newest
            </button>
            <button
              class="btn btn-primary col-sm-2"
              onClick={this.clickNext.bind(this)}
            >
              forward
            </button>
          </div>
          {this.props.children(
            new Date(this.state.from).toISOString(),
            new Date(this.state.to).toISOString()
          )}
        </div>
      );
    } else {
      return <div>Loading</div>;
    }
  }
}

export default App;
