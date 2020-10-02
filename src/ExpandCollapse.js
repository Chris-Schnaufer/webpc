import React, { Component } from 'react';
import "./ExpandCollapse.css"

class ExpandCollapse extends Component {
  constructor(props) {
    super(props);
    this.clicked = this.clicked.bind(this);
    this.state = {
      expanded: props.full_bar
    };
  }

  clicked() {
    const new_state = !this.state.expanded;
    this.setState({expanded: new_state});

    if (this.props.hasOwnProperty("state_changed") && typeof this.props.state_changed === 'function') {
      this.props.state_changed(new_state);
    }
  }

  render() {
    return (
        <div id="expandcollapse-wrap" className="expandcollapse-wrap" onClick={this.clicked} >
          <svg version="1.1"
               baseProfile="full"
               width="30" height="30"
               xmlns="http://www.w3.org/2000/svg">
            {!this.state.expanded && <polyline points="5 7 15 7 10 12 5 7" stroke="darkgrey" strokeWidth="1" fill="darkgrey" ></polyline>}
            {this.state.expanded && <polyline points="7 5 7 15 12 10 7 5" stroke="darkgrey" strokeWidth="1" fill="darkgrey" ></polyline>}
          </svg>
        </div>
      );
  }
}

export default ExpandCollapse
