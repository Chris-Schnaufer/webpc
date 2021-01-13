import React, { Component } from 'react';
import "./PlotAdjustment.css"

var CENTER_MOVE_BUFFER_PX = 5;

class PlotAdjustment extends Component {
  constructor(props) {
    super(props);

    this.onUpdateCb = props.onUpdate && (typeof props.onUpdate == 'function') ? props.onUpdate : undefined;

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
      was_dragging: false,
    };
  }

  initialized_insets = false; // Indicates we've initialized insets based upon props (only want to do once)
  line_position = undefined;  // The position of line being dragged: "top", "right", "bottom", "left"
  line_position_el_id = undefined; // The ID of the elemnt being moved
  center_x = 0;
  center_y = 0;
  right_max = 0;
  bottom_max = 0;
  draw_off_y = 0;
  draw_off_x = 0;
  max_adjust_width = 0;
  max_adjust_height = 0;

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
    if (this.line_position) {
      let el = ev.target;
      if (el.id !== this.line_position_el_id) {
        el = document.getElementById(this.line_position_el_id);
      }
      let client_rect = el.getBoundingClientRect();
      let cur_x = ev.clientX - client_rect.x;
      let cur_y = ev.clientY - client_rect.y;

      switch(this.line_position) {
        case 'top':
          {
            let new_inset = Math.max(0, Math.min(this.center_y - CENTER_MOVE_BUFFER_PX, this.state.top_inset + this.draw_off_y + cur_y) - this.draw_off_y);
            this.setState({top_inset: new_inset});
          }
          break;
        case 'right':
          {
            let new_inset = Math.max(0, Math.min(this.center_x - CENTER_MOVE_BUFFER_PX, Math.min(this.right_max, this.state.right_inset + this.draw_off_x - cur_x)) - this.draw_off_x);
            this.setState({right_inset: new_inset});
          }
          break;
        case 'bottom':
          {
            let new_inset = Math.max(0, Math.min(this.center_y - CENTER_MOVE_BUFFER_PX, Math.min(this.bottom_max, this.state.bottom_inset + this.draw_off_y  - cur_y)) - this.draw_off_y);
            this.setState({bottom_inset: new_inset});
          }
          break;
        case 'left':
          {
            let new_inset = Math.max(0, Math.min(this.center_x - CENTER_MOVE_BUFFER_PX, this.state.left_inset + this.draw_off_x + cur_x) - this.draw_off_x);
            this.setState({left_inset: new_inset});
          }
          break;
        default:
          console.log("Warning: Unknown line position type:",this.line_position);
          break;
      }
    }
  }

  mouseUp(ev) {
    this.line_position = undefined;

    if (this.onUpdateCb) {
      this.onUpdateCb(this.state.top_inset / this.max_adjust_height, 
                      this.state.right_inset / this.max_adjust_width, 
                      this.state.bottom_inset / this.max_adjust_height, 
                      this.state.left_inset / this.max_adjust_width);
    }
  }

  lineAdjust(ev, line_position) {
    this.line_position_el_id = ev.target.id;
    this.line_position = line_position;
  }

  drawLine(id, css_tag, sx, sy, ex, ey, mouse_down_cb, cursor_name) {
    const cur_cursor = cursor_name || 'default';
    return (
        <React.Fragment>
          <line id={id} x1={sx} y1={sy} x2={ex} y2={ey} stroke="red" strokeWidth="2" onMouseDown={mouse_down_cb} cursor={cur_cursor} />
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

    let top_inset = this.state.top_inset;
    let right_inset = this.state.right_inset;
    let bottom_inset = this.state.bottom_inset;
    let left_inset = this.state.left_inset;

    if (!this.initialized_insets) {
      if (this.props.top_pct) {
        top_inset = inner_cr.height * this.props.top_pct;
      }
      if (this.props.right_pct) {
        right_inset = inner_cr.width * this.props.right_pct;
      }
      if (this.props.bottom_pct) {
        bottom_inset = inner_cr.height * this.props.bottom_pct;
      }
      if (this.props.left_pct) {
        left_inset = inner_cr.width * this.props.left_pct;
      }
      this.initialized_insets = true;
      this.setState({top_inset, right_inset, bottom_inset, left_inset});
    }

    const top_off = ((max_height - inner_height) / 2.0) + this.state.top_inset;
    const right_off = ((max_width - inner_width) / 2.0) + this.state.right_inset;
    const bottom_off = ((max_height - inner_height) / 2.0) + this.state.bottom_inset;
    const left_off = ((max_width - inner_width) / 2.0) + this.state.left_inset;

    this.center_x = (max_width / 2.0);
    this.center_y = (max_height / 2.0);
    this.right_max = max_width;
    this.bottom_max = max_height;
    this.max_adjust_width = inner_width;
    this.max_adjust_height = inner_height;
    this.draw_off_y = ((max_height - inner_height) / 2.0);
    this.draw_off_x = ((max_width - inner_width) / 2.0);

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
          {this.adjustmentLines()}
          <div id="plot-adjust-box" className="plot-adjust-box"></div>
        </div>        
      </div>        
    );
  }
}

export default PlotAdjustment
