import React, { Component } from 'react';
import Cards from './Cards'
import './ToolDetails.css'

class ToolDetails extends Component {
  render() {
    return(
      <div id="tooldetails-wrap" className="tooldetails-wrap" >
        <div id="tooldetails-options-wrap" className="tooldetails-options-wrap" >
          <div id="tooldetails-options" className="tooldetails-options" >
            {this.props.tool_children()}
          </div>
        </div>
        <div id="tooldetail-card-wrap" className="tooldetail-card-wrap" >
          <div id="tooldetail-card" className="tooldetail-card" >
            <Cards selected_card={this.props.active_card} cards={this.props.cards} />
          </div>
        </div>
      </div>
      );
  }
}

export default ToolDetails
