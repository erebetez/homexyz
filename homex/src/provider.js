import React from "react";

const socket = new WebSocket("ws://" + window.location.hostname + ":3667");

const base = "/api";

const device = {
  id: "w1",
  name: "web gui",
  desc: "Well, what do you expect?",
  states: {
    button_led1: { type: "button" },
    button_led2: { type: "button" },
    button_fireplace_fan: { type: "button" },
    button_fireplace_fan_mode: { type: "button" },
    button_mock_state: { type: "button" }
  }
};

socket.addEventListener("open", function(event) {
  socket.send(
    JSON.stringify({
      key: "device",
      value: device
    })
  );
});

const messageHandler = (function() {
  let observers = {};

  socket.addEventListener("message", event => {
    // console.log(event);
    let data = JSON.parse(event.data);
    let observer = observers[data.key];
    if (observer) {
      observer.forEach(handler => {
        handler(data);
      });
    }
  });

  return {
    addListener: (key, func) => {
      let keyList = observers[key];
      if (keyList) {
        keyList.push(func);
      } else {
        keyList = [func];
      }
      observers[key] = keyList;
    }
  };
})();

class ServiceData extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      err: false,
      loading: true,
      devices: {},
      states: {}
    };
  }

  componentDidMount() {
    // TODO use parallel of async module
    this.fetchDevices();
    this.fetchStates();

    messageHandler.addListener("devices", data => {
      // getting only the updated device
      let newState = this.state.devices;
      let device = data.value;
      newState[device.id] = device;
      this.setState({ devices: newState });
    });
  }

  async fetchDevices() {
    let query = "/devices/";

    fetchService(query, (err, retr) => {
      if (err) {
        this.setState({ err });
      } else {
        this.setState({
          devices: retr.reduce((acc, dev) => {
            acc[dev.id] = dev;
            return acc;
          }, {})
        });
      }
    });
  }

  fetchStates() {
    let query = "/states/";

    fetchService(query, (err, retr) => {
      if (err) {
        this.setState({ err });
      } else {
        this.setState({
          states: retr.reduce((acc, stat) => {
            acc[stat.key] = stat;
            return acc;
          }, {}),
          loading: false
        });
      }
    });
  }
  render() {
    return this.props.children(
      this.state.err,
      this.state.loading,
      this.state.devices,
      this.state.states
    );
  }
}

class Events extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      err: false,
      eventDict: {}, // newest item in 0
      loading: false
    };
  }

  componentDidMount() {
    this.setState({ loading: true });
    //console.log(this.props.select);

    this.props.select.forEach(key => {
      this.fetchEvent(key);

      socket.send(
        JSON.stringify({
          key: "register",
          value: {
            id: device.id,
            key: key
          }
        })
      );

      messageHandler.addListener(key, data => {
        let keyDict = this.state.eventDict;
        // TODO use data key instead?
        let keyList = keyDict[key];
        if (!keyList) {
          keyList = [];
        }

        if (keyList.length > (this.props.limit || 1)) {
          keyList.pop();
        }

        keyList.unshift(data);
        keyDict[key] = keyList;
        this.setState({ eventDict: keyDict });
      });
    });
  }

  async fetchEvent(key) {
    let query = "/events/" + key;

    let now = Date.now();

    if (this.props.limit) {
      query += "?limit=" + this.props.limit;
    } else {
      let from = this.props.from || new Date(now - 86400000).toISOString(); // default one day
      let to = this.props.to || new Date(now).toISOString();

      query += "?from=" + from + "&to=" + to;
    }

    console.log(query);

    fetchService(query, (err, newEvents) => {
      if (err) {
        this.setState({ err });
      } else {
        let keyDict = this.state.eventDict;

        console.log(newEvents);

        // NOTE overwrite existing events
        keyDict[key] = newEvents;

        this.setState({
          loading: false,
          eventDict: keyDict
        });
      }
    });
  }

  render() {
    return this.props.children(this.state.err, this.state.eventDict);
  }
}

function sendEvent(key, value, origin) {
  socket.send(
    JSON.stringify({
      key: key,
      trail: { origin: origin || "button" },
      value: value
    })
  );
}

async function fetchService(query, cb) {
  const response = await fetch(base + query);

  if (response.status !== 200) {
    cb(Error(response.statusText + ": " + response.url), undefined);
    return;
  }

  try {
    let retr = await response.json();
    cb(undefined, retr);
  } catch (e) {
    cb(e, undefined);
  }
}

export { ServiceData, Events, sendEvent };
