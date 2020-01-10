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

socket.addEventListener("open", function (event) {
  socket.send(
    JSON.stringify({
      key: "device",
      origin: false,
      transaction_id: false,
      value: device
    })
  );
});

function listenerHandler(key, cb) {
  return event => {
    console.log(event);
    let data = JSON.parse(event.data);
    if (data.key === key) {
      cb(data);
    }
  };
}

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

    socket.addEventListener(
      "message",
      listenerHandler("devices", data => {
        // getting only the updated device
        let newState = this.state.devices;
        let device = data.value;
        newState[device.id] = device;
        this.setState({ devices: newState });
      })
    );
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
      eventList: [], // newest item in 0
      loading: false
    };
  }

  componentDidMount() {
    this.fetchEvent();

    socket.send(
      JSON.stringify({
        key: "register",
        value: {
          id: device.id,
          key: this.props.select
        }
      })
    );

    socket.addEventListener(
      "message",
      listenerHandler(this.props.select, data => {
        let l = this.state.eventList;

        if (l.length > this.props.last) {
          l.pop();
        }

        l.unshift(data);
        this.setState({ eventList: l });
      })
    );
  }

  async fetchEvent() {
    this.setState({ loading: true });

    let query = "/events/" + this.props.select;
    if (this.props.last) {
      query += "?last=" + this.props.last + "&type=count";
    }

    fetchService(query, (err, newEvents) => {
      if (err) {
        this.setState({ err });
      } else {
        this.setState({
          loading: false,
          eventList: newEvents
        });
      }
    })
  }

  async setEvent(origin, value) {
    //this.setState({ loading: true });
    socket.send(
      JSON.stringify({
        key: this.props.select,
        trail: { origin: origin },
        value: value
      })
    );
  }

  render() {
    return this.props.children(this.state.err, this.state.eventList, this.setEvent.bind(this));
  }
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
    cb(e, undefined)
  }
}

export { ServiceData, Events };
