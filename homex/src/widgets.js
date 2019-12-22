import React from 'react';

class DiscoverButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            discovering: false
        };
    }

    async discover() {
        this.setState({ discovering: true });
        let query = '/discover/';

        await fetch(query);

        this.setState({ discovering: false });
    }

    render() {
        if (this.state.discovering) {
            return <button class="btn btn-outline-primary">Discovering</button>
        } else {
            return <button class="btn btn-primary" onClick={this.discover.bind(this)}>Discover</button>
        }

    }
}


class ToggleButton extends React.Component {
    click(ev) {

        let val = this.props.event.value;
        if (val === 0) {
            val = 1;
        } else {
            val = 0;
        }

        this.props.set(this.props.name, val);
    }

    render() {
        if (this.props.event) {
            return <div>
                <div>{this.props.event.value}</div>
                <button class="btn btn-secondary" onClick={this.click.bind(this)}>Toggle</button>
            </div >
        } else {
            return <div>No data.</div>
        }
    }
}


export { DiscoverButton, ToggleButton }
