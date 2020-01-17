import React from "react";
import { sendEvent } from "./provider.js";
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts";

function LastValue(props) {
  console.log(props);

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

function HistoryDisplay(props) {
  if (!props.state) {
    return <div>state not existing</div>;
  }
  if (!props.eventList) {
    return <div>no value yet</div>
  }

  let data = props.eventList.map(item => {
    item["parsed"] = Date.parse(item["inserted"]);
    return item;
  });
  return (
    <div>
      <LineChart
        width={730}
        height={250}
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
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </div>
  );
}

function dateToString(dt) {
  let d = new Date(dt);
  let s = d.toLocaleTimeString().split(":");
  return s[0] + ":" + s[1];
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
