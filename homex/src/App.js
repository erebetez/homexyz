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
                <Events
                  select={[
                    "fireplace_fan",
                    "fireplace_temp_bottom",
                    "temperature1",
                    "temperature2",
                    "temperature4",
                    "pressure1",
                    "humidity1",
                    "temperature3",
                    "humidity2"
                  ]}
                  limit="1"
                >
                  {(err, eventDict) => (
                    <div>
                      <h4>Fireplace</h4>
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
                      </div>
                      <div>
                        <span>Temp bottom: </span>
                        <LastValue
                          eventList={eventDict.fireplace_temp_bottom}
                          state={states.fireplace_temp_bottom}
                        ></LastValue>
                      </div>

                      <h4>Livingroom</h4>
                      <div>
                        <span>Temperature: </span>
                        <LastValue
                          eventList={eventDict.temperature1}
                          state={states.temperature1}
                        ></LastValue>
                        <LastValue
                          eventList={eventDict.temperature2}
                          state={states.temperature2}
                        ></LastValue>
                        <LastValue
                          eventList={eventDict.temperature4}
                          state={states.temperature4}
                        ></LastValue>
                      </div>
                      <div>
                        <span>Humidity: </span>
                        <LastValue
                          eventList={eventDict.humidity1}
                          state={states.humidity1}
                        ></LastValue>
                      </div>
                      <div>
                        <span>Pressure: </span>
                        <LastValue
                          eventList={eventDict.pressure1}
                          state={states.pressure1}
                        ></LastValue>
                      </div>

                      <h4>Kitchen</h4>

                      <div>
                        <span>Temperature: </span>
                        <LastValue
                          eventList={eventDict.temperature3}
                          state={states.temperature3}
                        ></LastValue>
                      </div>

                      <div>
                        <span>Humidity: </span>
                        <LastValue
                          eventList={eventDict.humidity2}
                          state={states.humidity2}
                        ></LastValue>
                      </div>
                    </div>
                  )}
                </Events>

                <Events
                  select={[
                    "fireplace_temp_bottom",
                    "temperature2",
                    "temperature3",
                    "humidity1",
                    "humidity2",
                    "pressure1"
                  ]}
                  from={new Date(Date.now() - 344000000).toISOString()}
                >
                  {(err, eventDict) => (
                    <div>
                      <hr></hr>
                      <h4>Graphs</h4>
                      <HistoryDisplay
                        eventDict={eventDict}
                        states={states}
                      ></HistoryDisplay>
                    </div>
                  )}
                </Events>

                <hr></hr>
                <h4>Mockdevice</h4>
                <Events select={["light_top", "light_bottom"]} limit="1">
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

                      <LastValue
                        eventList={eventDict.light_bottom}
                        state={states.light_bottom}
                      ></LastValue>

                      <ToggleButton
                        name="button_mock_state2"
                        eventList={eventDict.light_bottom}
                      ></ToggleButton>
                    </div>
                  )}
                </Events>

                <hr></hr>

                <RangeChooser>
                  {(from, to) => (
                    <Events
                      key={from} // FIXME not the nice way
                      from={from}
                      to={to}
                      select={[
                        "temperature_mock",
                        "possible_error_mock",
                        "saw_mock",
                        "saw_down_mock"
                      ]}
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

                          <div>
                            <span>saw_mock: </span>
                            <LastValue
                              eventList={eventDict.saw_mock}
                              state={states.saw_mock}
                            ></LastValue>
                          </div>

                          <div>
                            <span>saw_down_mock: </span>
                            <LastValue
                              eventList={eventDict.saw_down_mock}
                              state={states.saw_down_mock}
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
      range: 2, // days
      from: undefined,
      to: Date.now()
      // unit = days
    };
  }

  clickBack(ev) {
    console.log("back");

    let temp = this.state.from;

    this.setState({
      from: temp - this.state.range * 1000 * 60 * 60,
      to: temp
    });
  }
  clickeForward(ev) {
    console.log("forward");

    let temp = this.state.to;

    // TODO to can't be newer then now

    this.setState({
      from: temp,
      to: temp + this.state.range * 1000 * 60 * 60
    });
  }

  clickNewest(ev) {
    console.log("newest");
  }

  clickDate(ev) {
    console.log("date");
  }

  changeRange(ev) {
    this.setState({
      range: ev.target.value,
      from: this.state.to - ev.target.value * 1000 * 60 * 60
    });
  }

  componentDidMount() {
    this.setState({ from: this.state.to - this.state.range * 1000 * 60 * 60 });
  }

  render() {
    if (this.state.from && this.state.to) {
      return (
        <div>
          <div class="form-group row">
            <div class="col-sm-6">Range selector</div>
            <button
              class="btn btn-secondary col-sm-2"
              onClick={this.clickDate.bind(this)}
            >
              Date selector
            </button>
            <button
              class="btn btn-secondary col-sm-2"
              onClick={this.clickNewest.bind(this)}
            >
              To newest
            </button>
          </div>

          <div class="form-group row">
            <button
              class="btn btn-primary col-sm-4"
              onClick={this.clickBack.bind(this)}
            >
              {new Date(this.state.from).toISOString()}
            </button>
            <input
              class="form-control col-sm-2"
              type="number"
              onChange={this.changeRange.bind(this)}
              value={this.state.range}
            />
            <button
              class="btn btn-primary col-sm-4"
              onClick={this.clickeForward.bind(this)}
            >
              {new Date(this.state.to).toISOString()}
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
