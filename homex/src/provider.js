import React from "react";

const socket = new WebSocket("ws://moria:3667");

const device = {
  id: "w1",
  name: "web gui",
  desc: "Well, what do you expect?",
  states: {
    button_led1: { type: "button" },
    button_led2: { type: "button" },
    button_fireplace_fan: { type: "button" },
    button_mock_state: { type: "button" }
  }
};

socket.addEventListener("open", function(event) {
  socket.send(
    JSON.stringify({
      key: "device",
      origin: false,
      transaction_id: false,
      value: device
      // inserted: new Date //?
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
      err: false, // TODO ...
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

    try {
      const response = await fetch(query);
      const retr = await response.json();

      this.setState({
        devices: retr.reduce((acc, dev) => {
          acc[dev.id] = dev;
          return acc;
        }, {})
      });
    } catch (e) {
      console.error(e);
    }
  }

  async fetchStates() {
    let query = "/states/";

    try {
      const response = await fetch(query);
      const retr = await response.json();

      this.setState({
        states: retr.reduce((acc, stat) => {
          acc[stat.key] = stat;
          return acc;
        }, {}),
        loading: false
      });
    } catch (e) {
      console.error(e);
    }
  }
  render() {
    return this.props.children(
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
    socket.addEventListener(
      "message",
      listenerHandler(this.props.select, data => {
        console.log(data);
        let l = this.state.eventList;
        console.log(l);

        // FIXME only pop if < then this.props.last
        l.pop();

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

    try {
      const response = await fetch(query);
      const newEvents = await response.json();

      this.setState({
        loading: false,
        eventList: newEvents
      });
    } catch (e) {
      console.error(e);
    }
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
    return this.props.children(this.state.eventList, this.setEvent.bind(this));
  }
}

export { ServiceData, Events };
