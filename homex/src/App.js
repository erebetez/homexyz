import React from 'react';
import { ServiceData, Events } from './provider.js';
import { DiscoverButton, ToggleButton } from './widgets.js';

function App() {
  return (
    <div className="App" class="container">
      <h1>HomeX</h1>
      <ServiceData>
        {(devices, states) =>
          <div>
            <DeviceTable devices={devices}></DeviceTable>
            <StatesTable states={states}></StatesTable>
          </div>
        }
      </ServiceData>

      <DiscoverButton></DiscoverButton>

      <div>
        <Events select="light_top" last="1">
          {(eventList, set) =>
            <ToggleButton name="button_mock_state" event={eventList[0]} set={set}></ToggleButton>
          }
        </Events>

        <Events select="led1" last="1">
          {(eventList, set) =>
            <ToggleButton name="button_led1" event={eventList[0]} set={set}></ToggleButton>
          }
        </Events>

        <Events select="led2" last="1">
          {(eventList, set) =>
            <ToggleButton name="button_led2" event={eventList[0]} set={set}></ToggleButton>
          }
        </Events>

        <Events select="temperature_mock" last="10">
          {(eventList, set) =>
            <React.Fragment>
              <ul>
                {eventList.map(item => <li key={item.inserted}>{item.inserted} ": " {item.value}</li>)}
              </ul>
            </React.Fragment>
          }
        </Events>

        <Events select="temperature1" last="10">
          {(eventList, set) =>
            <React.Fragment>
              <ul>
                {eventList.map(item => <li key={item.inserted}>{item.value}</li>)}
              </ul>
            </React.Fragment>
          }
        </Events>

        <Events select="humidity1" last="10">
          {(eventList, set) =>
            <React.Fragment>
              <ul>
                {eventList.map(item => <li key={item.inserted}>{item.value}</li>)}
              </ul>
            </React.Fragment>
          }
        </Events>
      </div>
    </div>
  );
}


function DeviceTable(props) {
  console.log(props);
  return (<table class="table table-sm table-hover">
    <thead>
      <tr>
        <th>id</th>
        <th>name</th>
        <th>desc</th>
        <th>status</th>
      </tr>
    </thead>
    <tbody>
      {Object.keys(props.devices).map(id => {
        return (<tr key={id}>
          <td>{id}</td>
          <td>{props.devices[id].name}</td>
          <td>{props.devices[id].description}</td>
          <td>{props.devices[id].status}</td>
        </tr>)
      })}
    </tbody>
  </table>);
}

function StatesTable(props) {
  console.log(props);
  return (<table class="table table-sm table-hover">
    <thead>
      <tr>
        <th>device</th>
        <th>key</th>
        <th>updated</th>
        <th>attribute</th>
      </tr>
    </thead>
    <tbody>
      {Object.keys(props.states).map(key => {
        return (<tr key={key}>
          <td>{props.states[key].id}</td>
          <td>{props.states[key].key}</td>
          <td>{props.states[key].updated}</td>
          <td>{JSON.stringify(props.states[key].attribute)}</td>
        </tr>)
      })}
    </tbody>
  </table>);
}


export default App;
