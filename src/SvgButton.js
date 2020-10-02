import React, { Component } from 'react';

class SvgButton extends Component {
  constructor(props) {
    super(props);
    this.clicked = this.clicked.bind(this);
    this.state = {
      left_facing: (props.hasOwnProperty('left') ? props.left : true),
    };
  }

  is_enabled() {
    return this.props.hasOwnProperty('enabled') && this.props.enabled;
  }

  clicked(ev) {
    if (!this.is_enabled()) {
      return;
    }

    if (this.props.hasOwnProperty('onClicked') && typeof this.props.onClicked === 'function') {
      this.props.onClicked();
    }
  }

  render() {
    return (
      <div id="svgbutton-wrap" className="svgbutton-wrap" onClick={this.clicked} >
        <svg version="1.1"
             baseProfile="full"
             width="80" height="80"
             xmlns="http://www.w3.org/2000/svg">
          {this.state.left_facing && !this.is_enabled() && <polygon points="1 20 20 0 20 10 50 10 50 30 20 30 20 40 0 20" stroke="grey" fill="lightgrey" strokeWidth="1" />}
          {this.state.left_facing && this.is_enabled() && <polygon points="1 20 20 0 20 10 50 10 50 20 20 20 20 30 0 20" stroke="green" fill="lightgreen" strokeWidth="2" />}
          {!this.state.left_facing && !this.is_enabled() && <polygon points="0 10 30 10 30 0 50 20 30 40 30 30 0 30 0 10" stroke="grey" fill="lightgrey" strokeWidth="1" />}
          {!this.state.left_facing && this.is_enabled() && <polygon points="1 10 30 10 30 0 50 20 30 40 30 30 1 30 1 10" stroke="green" fill="lightgreen" strokeWidth="2" />}
        </svg>
      </div>
    );
  }
}

export default SvgButton;
