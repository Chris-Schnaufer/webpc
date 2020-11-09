import React, { Component } from 'react';
import "./PlotAdjustment.css"

class PlotAdjustment extends Component {
  constructor(props) {
    super(props);

    this.keyPress = this.keyPress.bind(this);
    this.mouseEnter = this.mouseEnter.bind(this);
    this.mouseLeave = this.mouseLeave.bind(this);
    this.mouseMove = this.mouseMove.bind(this);
    this.mouseUp = this.mouseUp.bind(this);
    this.lineAdjust = this.lineAdjust.bind(this);

    this.state = {
      top_inset: 0,
      right_inset: 0,
      bottom_inset: 0,
      left_inset: 0,
      was_dragging: false
    };
  }

  line_position = undefined;  // The position of line being dragged: "top", "right", "bottom", "left"
  center_x = 0;
  center_y = 0;
  right_max = 0;
  bottom_max = 0;

  componentDidMount(){
    document.addEventListener("keydown", this.keyPress, false);
    this.setState({top_inset: 0});
  }

  componentWillUnmount(){
    document.removeEventListener("keydown", this.keyPress, false);
  }

  keyPress(ev) {
    if (this.line_position) {
      if (ev.key === 'Escape') {
        this.line_position = undefined;
        this.setState({was_dragging: false});
      }
    }
  }

  mouseEnter(ev) {
    if (this.state.was_dragging) {
      let client_rect = ev.target.getBoundingClientRect();
      let cur_x = ev.clientX - client_rect.x;
      let cur_y = ev.clientY - client_rect.y;
      this.setState({last_x: cur_x, last_y: cur_y, was_dragging: false});
    }
  }

  mouseLeave(ev) {
    if (this.state.line_position) {
      this.setState({last_x: null, last_y: null, was_dragging: true});
    }
  }

  mouseMove(ev) {
    console.log("MM",ev.target.id);
    if (this.line_position) {
      if (ev.target.id !== 'adjustment_bounds') {
      let client_rect = ev.target.getBoundingClientRect();
      let cur_x = ev.clientX - client_rect.x;
      let cur_y = ev.clientY - client_rect.y;
      console.log("Client:",client_rect,"Event:",ev.clientX,ev.clientY);
      console.log("Cur:",cur_x, cur_y,"Max:",this.right_max,this.bottom_max);

      switch(this.line_position) {
        case 'top':
          this.setState({top_inset: this.state.top_inset + cur_y});
          break;
        case 'right':
          this.setState({right_inset: this.state.right_inset - cur_x});
          break;
        case 'bottom':
          this.setState({bottom_inset: this.state.bottom_inset - cur_y});
          break;
        case 'left':
          this.setState({left_inset: this.state.left_inset + cur_x});
          break;
      }
    }
    }
  }

  mouseUp(ev) {
    // TODO: Call back up to redraw plots on image
    this.line_position = undefined;
  }

  lineAdjust(ev, line_position) {
    this.line_position = line_position;
  }

  drawLine(id, css_tag, sx, sy, ex, ey, mouse_down_cb, cursor_name) {
    const cur_cursor = cursor_name || 'default';
    return (
        <React.Fragment>
          <line id={id} x1={sx} y1={sy} x2={ex} y2={ey} stroke="red" strokeWidth="2" onMouseDown={(ev) => {console.log("MD");mouse_down_cb(ev);}} cursor={cur_cursor} />
        </React.Fragment>
      );
  }

  adjustmentLines() {
    let outer_el = document.getElementById('plot-adjust-grid');
    let inner_el = document.getElementById('plot-adjust-box');
    if (!outer_el || !inner_el) {
      return;
    }

    const outer_cr = outer_el.getBoundingClientRect();
    const inner_cr = inner_el.getBoundingClientRect();
    const max_width = outer_cr.width;
    const max_height = outer_cr.height;
    const inner_width = inner_cr.width;
    const inner_height = inner_cr.height;
    const left_off = ((max_width - inner_width) / 2.0) + this.state.left_inset;
    const right_off = ((max_width - inner_width) / 2.0) + this.state.right_inset;
    const top_off = ((max_height - inner_height) / 2.0) + this.state.top_inset;
    const bottom_off = ((max_height - inner_height) / 2.0) + this.state.bottom_inset;

    this.center_x = outer_cr.left + ((max_width - inner_width) / 2.0);
    this.center_y = outer_cr.top + ((max_height - inner_height) / 2.0);
    this.right_max = max_width;
    this.bottom_max = max_height;

    return (
      <svg id="adjustment_bounds"
           className="adjustment_bounds"
           version="1.1"
           baseProfile="full"
           width={max_width} height={max_height}
           xmlns="http://www.w3.org/2000/svg">
        {this.drawLine("top_edit_line", "top_edit_line", 0, top_off, max_width, top_off, (ev) => {this.lineAdjust(ev, "top")}, "s-resize")}
        {this.drawLine("right_edit_line", "right_edit_line", max_width - right_off, 0, max_width - right_off, max_height, (ev) => {this.lineAdjust(ev, "right")}, "w-resize")}
        {this.drawLine("bottom_edit_line", "bottom_edit_line", 0, max_height - bottom_off, max_width, max_height - bottom_off, (ev) => {this.lineAdjust(ev, "bottom")}, "n-resize")}
        {this.drawLine("left_edit_line", "left_edit_line", left_off, 0, left_off, max_height, (ev) => {this.lineAdjust(ev, "left")}, "e-resize")}
      </svg>
    );
  }

  render() {
    return (
      <div id="plot-adjust-wrap"
           onMouseMove={this.mouseMove} 
           onMouseLeave={this.mouseLeave} 
           onMouseEnter={this.mouseEnter}
           onMouseUp={this.mouseUp}
           >
        <div id="plot-adjust-grid" className="plot-adjust-grid">
          <div id="plot-adjust-box" className="plot-adjust-box">
          </div>
          {this.adjustmentLines()}
        </div>        
      </div>        
    );
  }
}

export default PlotAdjustment
