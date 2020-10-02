import React, { Component } from 'react';
import './Titlebar.css'

class Titlebar extends Component {
  render() {
    return (
      <div id="titlebar" className="titlebar">
      <h1>{this.props.title}</h1>
      </div>
      )
  }
}

export default Titlebar
