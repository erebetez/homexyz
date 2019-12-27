import React from 'react';

class Devices extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            collapsed: true
        };
    }

    render() {
        return <details>
                <summary>Devices</summary>
                <DeviceTable devices={this.props.devices}></DeviceTable>
                <StatesTable states={this.props.states}></StatesTable>
            </details>
    }
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


export { Devices }