import React from "react";
import { sendEvent } from "./provider.js";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

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

const getColor = function (idx) {
  const colors = [
    "#191102",
    "#994636",
    "#f3b61f",
    "#a29f15",
    "#510d0a",
    "#895b1e"
  ];

  return colors[(idx % colors.length)];
};

function HistoryDisplay(props) {
  if (!props.states || Object.keys(props.states).length === 0) {
    return <div>state not existing</div>;
  }
  if (!props.eventDict || Object.keys(props.eventDict).length === 0) {
    return <div>no value yet</div>;
  }

  const keyCount = Object.keys(props.eventDict).length - 1;

  let data = Object.keys(props.eventDict).reduce((acc, key) => {
    let keyList = props.eventDict[key];
    keyList = keyList.map(event => {
      event[key] = event.value;
      // TODO check all have same range of time...
      event["parsed"] = Date.parse(event["inserted"]);
      return event;
    });
    return acc.concat(keyList);
  }, []);


  // TODO group/reduce by unit....
  // FIXME see https://github.com/recharts/recharts/issues/1065
  // FIXME data should contain only parse and the key values

  return (
    <div>
      {Object.keys(props.eventDict).map((key, i) => {
        let type;
        let unit = "";
        let hideXAxis = true;
        let height = 120;

        if (i >= keyCount) {
          hideXAxis = false;
          height += 30;
        }

        if (props.states[key]) {
          unit = props.states[key].attribute.unit;
          switch (props.states[key].attribute.type) {
            case "switch":
              type = "stepBefore";
              break;

            default:
              type = "monotone";
              break;
          }
        } else {
          type = "monotone";
        }

        return (
          <LineChart
            key={key}
            width={730}
            height={height}
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            {/* <Legend verticalAlign="left" layout="vertical" /> */}
            <Tooltip />

            <XAxis
              dataKey="parsed"
              scale="time"
              reversed="true"
              hide={hideXAxis}
              tickFormatter={dateToString}
            />

            <YAxis
              key={key}
              yAxisId={key}
              hide={false}
              dataKey={key}
              unit={unit}
            />

            <Line
              key={key}
              yAxisId={key}
              dot={false}
              type={type}
              dataKey={key}
              stroke={getColor(i)}
            />

          </LineChart>
        )
      })}

      <ul>
        {Object.keys(props.eventDict).map((key, i) => {
          return (<li key={i} style={{ color: getColor(i) }}>{key}</li>)
        })}
      </ul>


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
    if (this.props.eventList && this.props.eventList.length > 0) {
      let val = this.props.eventList[0].value;
      if (val === 0) {
        val = 1;
      } else {
        val = 0;
      }

      sendEvent(this.props.eventList[0].key, val, this.props.name);
    }
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
