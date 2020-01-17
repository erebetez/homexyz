import React from "react";
import { sendEvent } from "./provider.js";
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts";

function LastValue(props) {

  if (props.state && props.eventList && props.eventList.length > 0) {
    return (
      <h3 class="badge badge-secondary">
        {props.eventList[0].value} {props.state.attribute.unit}
      </h3>
    );
  } else {
    return <div>No data..</div>;
  }
}

const getColor = function () {
  const colors = ['#8884d8', '#c0c8ad', '#dbd8ae', '#ca907e', '#994636', '#895b1e'];
  let idx = 0;

  return () => {
    idx = idx + 1;

    if (idx >= colors.length) {
      idx = 0;
    }

    return colors[idx];
  }
}()


function HistoryDisplay(props) {
  if (!props.state) {
    return <div>state not existing</div>;
  }
  if (!props.eventDict) {
    return <div>no value yet</div>
  }

  let data = Object.keys(props.eventDict).reduce((acc, key) => {
    let keyList = props.eventDict[key];
    keyList = keyList.map(event => {
      event[key] = event.value;
      event["parsed"] = Date.parse(event["inserted"])
      return event;
    });
    return acc.concat(keyList);
  }, []);

  return (
    <div>
      <LineChart
        width={730}
        height={350}
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="parsed"
          scale="time"
          reversed="true"
          tickFormatter={dateToString}
        />
        <YAxis dataKey="value" unit={props.state.attribute.unit} />
        {Object.keys(props.eventDict).map(key => {
          return <Line key={key} type="monotone" dataKey={key} stroke={getColor()} />
        })}

      </LineChart>
    </div>
  );
}

function dateToString(dt) {
  let d = new Date(dt);
  let s = d.toLocaleTimeString().split(":");
  return s[0] + ":" + s[1];

  // TODO add days somehow.
}

class ToggleButton extends React.Component {
  click(ev) {
    let val = this.props.eventList[0].value;
    if (val === 0) {
      val = 1;
    } else {
      val = 0;
    }

    sendEvent(this.props.event.key, val, this.props.name);
  }

  render() {
    if (this.props.eventList && this.props.eventList.length > 0) {
      return (
        <div>
          <button class="btn btn-secondary" onClick={this.click.bind(this)}>
            Toggle: {this.props.eventList[0].value}
          </button>
        </div>
      );
    } else {
      return <div>No data.</div>;
    }
  }
}

export { ToggleButton, LastValue, HistoryDisplay };
