import React, { Component } from 'react';
import {GlassMagnifier, MOUSE_ACTIVATION, TOUCH_ACTIVATION} from "react-image-magnifiers";
import SvgButton from './SvgButton'
import Toolbar from './ToolBar'
import ToolDetails from './ToolDetails'
import './PlotClip.css'

var MAX_FIELD_ZOOM = 4.0;

class PlotClip extends Component {
  constructor(props) {
    super(props);
    this.actionFieldDelete = this.actionFieldDelete.bind(this);
    this.actionFieldClear = this.actionFieldClear.bind(this);
    this.boundsDone = this.boundsDone.bind(this);
    this.clicked = this.clicked.bind(this);
    this.fieldCornerMoveStart = this.fieldCornerMoveStart.bind(this);
    this.fieldCornerMove = this.fieldCornerMove.bind(this);
    this.fieldCornerUp = this.fieldCornerUp.bind(this);
    this.getBounds = this.getBounds.bind(this);
    this.imageLoaded = this.imageLoaded.bind(this);
    this.keyPress = this.keyPress.bind(this);
    this.mouseEnter = this.mouseEnter.bind(this);
    this.mouseLeave = this.mouseLeave.bind(this);
    this.mouseMove = this.mouseMove.bind(this);
    this.plotsCols = this.plotsCols.bind(this);
    this.plotsDone = this.plotsDone.bind(this);
    this.plotsRows = this.plotsRows.bind(this);
    this.toolOptionsField = this.toolOptionsField.bind(this);
    this.toolOptionsPlotCount = this.toolOptionsPlotCount.bind(this);

    this.state = {points_x: [],
                  points_y: [],
                  last_x: null,
                  last_y: null,
                  drawing: false,
                  was_drawing: false,
                  have_bounds: false,
                  current_tool: 0,
                  plot_rows: 1,
                  plot_cols: 1,
                 };
  }

  bounds_actions = [
  {id: 'delete_point', name: 'Delete last point', description: "Delete Last Point", tool_uri: process.env.PUBLIC_URL + '/Delete.png', state: 1, tool_click: ()=>this.actionFieldDelete()},
  {id: 'clear_points', name: 'Clear all points', description: "Clear Points", tool_uri: process.env.PUBLIC_URL + '/Clear.png', state: 0, tool_click: ()=>this.actionFieldClear()},
  ];

  plots_actions = [];

  tools = [
  { id: 'draw_plot_boundaries', 
    name: 'Field Boundary', 
    tool_uri: process.env.PUBLIC_URL + '/PlotBounds.png', 
    state: 0, 
    tool_actions: this.bounds_actions,
    tool_options: ()=>this.toolOptionsField()
  },
  {
    id: 'plot_rows_columns', 
    name: 'Plot Counts', 
    tool_uri: process.env.PUBLIC_URL + '/PlotCounts.png', 
    state: 1, 
    tool_actions: this.plots_actions,
    tool_options: ()=>this.toolOptionsPlotCount()
  },
  ];

  cards = [
    'Click on the field corners to outline the boundaries of all the plots',
    'Enter the number of plot rows and columns contained within the boundary. Drag corners to move them'
  ];

  plots_display_info = {
    offset_x: 0,
    offset_y: 0,
    field_disp_scale: 1.0,
    img_display_scale: 1.0,
    img_width: 100,
    img_height: 100,
  };

  corner_move_idx = -1;

  componentDidMount(){
    document.addEventListener("keydown", this.keyPress, false);
  }

  componentWillUnmount(){
    document.removeEventListener("keydown", this.keyPress, false);
  }

  clicked(ev) {
    if (this.state.points_x.length >= 4) {
      return;
    }

    let new_points_x = this.state.points_x;
    let new_points_y = this.state.points_y;

    let top_el = document.getElementById('plotclip-image-grid');
    let client_rect = top_el.getBoundingClientRect();

    let img_click_x = ev.clientX - client_rect.x;
    let img_click_y = ev.clientY - client_rect.y;

    // Don't add if it's too close to previous point
    if (new_points_x.length > 0) {
      const diff_x = Math.abs(img_click_x - new_points_x[new_points_x.length - 1]);
      const diff_y = Math.abs(img_click_y - new_points_y[new_points_y.length - 1]);

      if (diff_x <= 5 && diff_y <= 5) {
        return;
      }
    }

    // Good point, add it in
    this.bounds_actions[0].state = 0;
    new_points_x.push(img_click_x);
    new_points_y.push(img_click_y);

    this.setState({points_x: new_points_x, points_y: new_points_y, drawing: true});

    if (new_points_x.length > 3) {
      this.setState({have_bounds: true});
    }
  }

  keyPress(ev) {
    if (ev.key === 'Escape') {
      this.setState({drawing: false});
    } else if ((ev.key === 'Backspace') || (ev.key === 'x') || (ev.key === 'X')) {
      this.setState({last_x: null, last_y: null, drawing: false});
      this.actionFieldDelete();
    } else if ((ev.key === 'c') || (ev.key === 'C')) {
      this.actionFieldClear();
    }
  }

  mouseEnter(ev) {
    if (this.state.was_drawing) {
      let client_rect = ev.target.getBoundingClientRect();
      let cur_x = ev.clientX - client_rect.x;
      let cur_y = ev.clientY - client_rect.y;
      this.setState({last_x: cur_x, last_y: cur_y, drawing: true, was_drawing: false});
    }
  }

  mouseLeave(ev) {
    if (this.state.drawing) {
      this.setState({last_x: null, last_y: null, drawing: false, was_drawing: true});
    }
  }

  mouseMove(ev) {
    if (this.state.drawing) {
      let client_rect = ev.target.getBoundingClientRect();
      let cur_x = ev.clientX - client_rect.x;
      let cur_y = ev.clientY - client_rect.y;
      this.setState({last_x: cur_x, last_y: cur_y});
    }
  }

  fieldCornerMoveStart(ev, idx) {
    if (idx < this.state.points_x.length) {
      this.corner_move_idx = idx;
    } else {
      this.corner_move_idx = -1;
    }
  }

  fieldCornerMove(ev) {
    if (this.corner_move_idx >= 0) {
      let new_points_x = this.state.points_x;
      let new_points_y = this.state.points_y;
  
      new_points_x[this.corner_move_idx] += ev.movementX / this.plots_display_info.field_disp_scale;
      new_points_y[this.corner_move_idx] += ev.movementY / this.plots_display_info.field_disp_scale;

      this.setState({points_x: new_points_x, points_y: new_points_y});
    }
  }

  fieldCornerUp(ev) {
    this.corner_move_idx = -1;
  }

  getBounds(ev) {
    this.tools[0].state = 0;
    this.tools[1].state = 1;
    this.plots_display_info.offset_x = 0;
    this.plots_display_info.offset_y = 0;
    this.plots_display_info.field_disp_scale = 1.0;
    this.plots_display_info.img_disp_scale = 1.0;
    this.setState({current_tool: 0, drawing: false, plot_cols: 1, plot_rows: 1})
  }

  boundsDone(ev) {
    this.tools[0].state = -1;
    this.tools[1].state = 0;
    this.setState({current_tool: 1, drawing: false, was_drawing: false});
  }

  actionFieldDelete(ev) {
    let cur_x = this.state.points_x;
    let cur_y = this.state.points_y;
    if (cur_x.length > 0) {
      cur_x.pop();
      cur_y.pop();

    if (cur_x.length <= 0) {
      this.bounds_actions[0].state = 1;
    }

      this.setState({points_x: cur_x, points_y: cur_y});
    }
  }

  actionFieldClear(ev) {
    this.bounds_actions[0].state = 1;
    this.setState({points_x: [], points_y: []});
  }

  plotsCols(ev) {
    const num_cols = ev.target.value;
    this.setState({plot_cols: num_cols});
  }

  plotsRows(ev) {
    const num_rows = ev.target.value;
    this.setState({plot_rows: num_rows});
  }

  plotsDone(ev) {
    this.tools[1].state = -1;
    this.setState({current_tool: 1});
  }

  toolOptionsField() {
    return (
      <div style={{disply:"flex", displayDirection:"column", justifyContent: "space-around"}} >
        <div id="tool-options-plot-navigation" className="tool-options-plot-navigation">
          <SvgButton enabled={false} left={true} />
          <SvgButton enabled={this.state.have_bounds} left={false} onClicked={this.boundsDone} />
        </div>
      </div>
    );
  }

  toolOptionsPlotCount() {
    return (
      <div style={{disply:"flex", displayDirection:"column", justifyContent: "space-around"}} >
        <div style={{display:"grid", gridTemplateColumns: "repeat(2, 1fr)", gridGap: "10px"}} >
            <label htmlFor="plot_cols" style={{gridColumn: 1}}>Number of plot columns:</label>
            <input id="plot_cols" type="number" min="1" max="1000" placeholder={this.state.plot_cols.toString()} size="10" style={{gridColumn: 2, maxWidth: "100px"}} onChange={this.plotsCols}></input>
            <label htmlFor="plot_rows" style={{gridColumn: 1}}>Number of plot rows:</label>
            <input id="plot_rows" type="number" min="1" max="1000" placeholder={this.state.plot_rows.toString()} size="10" style={{gridColumn: 2, maxWidth: "100px"}} onChange={this.plotsRows}></input>
        </div>
        <div id="tool-options-plot-navigation" className="tool-options-plot-navigation">
          <SvgButton enabled={true} left={true} onClicked={this.getBounds} />
          <SvgButton enabled={false} left={false} onClicked={this.plotsDone} />
        </div>
      </div>
    );
  }

  get_polyline() {
    let points_x = this.state.points_x;
    let points_y = this.state.points_y;
    let polyline = '';
    let last_x = null;
    let last_y = null;

    points_x.map((coord_x, idx) => polyline += ((coord_x * this.plots_display_info.field_disp_scale) + this.plots_display_info.offset_x) 
                                                  + ' ' 
                                                  + ((points_y[idx] * this.plots_display_info.field_disp_scale) + this.plots_display_info.offset_y) + ' ');
    if (points_x.length > 0) {
      last_x = points_x[points_x.length - 1];
      last_y = points_y[points_y.length - 1];
    }
    if (this.state.drawing && this.state.last_x && this.state.last_y && (this.state.last_x !== last_x || this.state.last_y !== last_y)) {
      polyline += (this.state.last_x + this.plots_display_info.offset_x) + ' ' + (this.state.last_y + this.plots_display_info.offset_y);
    }
    return polyline;
  }

  get_plotlines() {
    const rows = Math.max(1, this.state.plot_rows);
    const cols = Math.max(1, this.state.plot_cols);
    const points_x = this.state.points_x;
    const points_y = this.state.points_y;
    // Since we start form the "upper left" (aka: the first point) we have offsets relative to that point
    const top_seg_dist = {x: parseFloat(points_x[1] - points_x[0]) / cols, y: parseFloat(points_y[1] - points_y[0]) / cols};
    const right_seg_dist = {x: parseFloat(points_x[2] - points_x[1]) / rows, y: parseFloat(points_y[2] - points_y[1]) / rows};
    const bottom_seg_dist = {x: parseFloat(points_x[2] - points_x[3]) / cols, y: parseFloat(points_y[2] - points_y[3]) / cols};
    const left_seg_dist = {x: parseFloat(points_x[3] - points_x[0]) / rows, y: parseFloat(points_y[3] - points_y[0]) / rows};
    let plotlines = [];

    for (let idx_row =  0; idx_row < rows; idx_row++) {
      // Calculate the top side for the row of plots
      const top_lx = points_x[0] + (idx_row * left_seg_dist.x);
      const top_ly = points_y[0] + (idx_row * left_seg_dist.y);
      const top_rx = points_x[1] + (idx_row * right_seg_dist.x);
      const top_ry = points_y[1] + (idx_row * right_seg_dist.y);
      const top_slope = (top_ry - top_ly) / (top_rx - top_lx);

      // Calculate the bottom side for the row of plots
      const bot_lx = points_x[0] + ((idx_row + 1) * left_seg_dist.x);
      const bot_ly = points_y[0] + ((idx_row + 1) * left_seg_dist.y);
      const bot_rx = points_x[1] + ((idx_row + 1) * right_seg_dist.x);
      const bot_ry = points_y[1] + ((idx_row + 1) * right_seg_dist.y);
      const bot_slope = (bot_ry - bot_ly) / (bot_rx - bot_lx);

      for (let idx_col = 0; idx_col < cols; idx_col++) {
        const top_col_dist = {x: (top_rx - top_lx) / cols, y: (top_ry - top_ly) / cols};
        const bottom_col_dist = {x: (bot_rx - bot_lx) / cols, y: (bot_ry - bot_ly) / cols};
        // Calculating the left side of the plot for left points
        const left_ux = top_lx + (idx_col * top_col_dist.x);
        const left_bx = bot_lx + (idx_col * bottom_col_dist.x);

        // Calculating the right side of the plot for right points
        const right_ux = top_lx + ((idx_col + 1) * top_col_dist.x);
        const right_bx = bot_lx + ((idx_col + 1) * bottom_col_dist.x);

        const ul_pt = {x: left_ux,  y: (left_ux - top_lx) * top_slope + top_ly};
        const ur_pt = {x: right_ux, y: (right_ux - top_lx) * top_slope + top_ly};
        const lr_pt = {x: right_bx, y: (right_bx - bot_lx) * bot_slope + bot_ly};
        const ll_pt = {x: left_bx,  y: (left_bx - bot_lx) * bot_slope + bot_ly};

        let plot =         ((ul_pt.x * this.plots_display_info.field_disp_scale) + this.plots_display_info.offset_x)
                   + ' ' + ((ul_pt.y * this.plots_display_info.field_disp_scale) + this.plots_display_info.offset_y)
                   + ' ' + ((ur_pt.x * this.plots_display_info.field_disp_scale) + this.plots_display_info.offset_x)
                   + ' ' + ((ur_pt.y * this.plots_display_info.field_disp_scale) + this.plots_display_info.offset_y)
                   + ' ' + ((lr_pt.x * this.plots_display_info.field_disp_scale) + this.plots_display_info.offset_x)
                   + ' ' + ((lr_pt.y * this.plots_display_info.field_disp_scale) + this.plots_display_info.offset_y)
                   + ' ' + ((ll_pt.x * this.plots_display_info.field_disp_scale) + this.plots_display_info.offset_x)
                   + ' ' + ((ll_pt.y * this.plots_display_info.field_disp_scale) + this.plots_display_info.offset_y)
                   + ' ' + ((ul_pt.x * this.plots_display_info.field_disp_scale) + this.plots_display_info.offset_x)
                   + ' ' + ((ul_pt.y * this.plots_display_info.field_disp_scale) + this.plots_display_info.offset_y);
        console.log("Plot",plot);
        plotlines.push(plot);
      }
    }

    return plotlines;
  }

  imageLoaded(e) {
    const el_rect = e.target.getBoundingClientRect();
    const frame = document.getElementById('plotclip-image-wrap');
    let el_width = el_rect.width;
    let el_height = el_rect.height;

    const ratio_x = frame.clientWidth / el_width;
    const ratio_y = frame.clientHeight / el_height;

    if (ratio_x < 1) {
      el_width = frame.clientWidth;
      el_height = frame.clientHeight * ratio_x;
    } else if (ratio_y < 1) {
      el_width = frame.clientWidth * ratio_y;
      el_height = frame.clientHeight;
    }
    e.target.parentNode.style.width = el_width + "px";
    e.target.parentNode.style.height = el_height + "px";

    let svg_el = document.getElementById('field_bounds');
    if (svg_el) {
      svg_el.style.width = el_width + "px";
      svg_el.style.height = el_height + "px";
    } else {
      console.log("NO SVG ELEMENT FOUND");
    }
  }

  render_field() {
    const polyline = this.get_polyline();
    return (
      <React.Fragment>
        <svg id="field_bounds"
             className="field_bounds"
             version="1.1"
             baseProfile="full"
             width="500" height="500"
             xmlns="http://www.w3.org/2000/svg">
          <polygon points={polyline} stroke="white" strokeWidth="3" fill="lightgrey" fillOpacity="70%" />
          {
            this.state.points_x.map((coord_x, idx) => {
                return (<circle
                        key={idx}
                        cx={coord_x}
                        cy={this.state.points_y[idx]}
                        r={3}
                        stroke="white"
                        strokeWidth="2"
                        fill="darkgrey"
                      />
                )
            }
          )}
        </svg>
        <GlassMagnifier id="magnifier"
          imageSrc={this.props.image_uri}
          cursorStyle="crosshair"
          square={true}
          onImageLoad={this.imageLoaded}
          mouseActivation={MOUSE_ACTIVATION.DOUBLE_CLICK}
          touchActivation={TOUCH_ACTIVATION.DOUBLE_TAP}
          style={{"gridColumn":"1", "gridRow":"1"}}
        />
      </React.Fragment>
    );
  }

  render_plots() {
    if (this.corner_move_idx < 0) {
      // Get the bonds of the field
      const img_x = this.state.points_x;
      const img_y = this.state.points_y;
      let min_x = img_x[0];
      let min_y = img_y[0];
      let max_x = min_x;
      let max_y = min_y;
      for (let idx = 0; idx < img_x.length; idx++) {
        if (img_x[idx] < min_x) min_x = img_x[idx];
        if (img_y[idx] < min_y) min_y = img_y[idx];
        if (img_x[idx] > max_x) max_x = img_x[idx];
        if (img_y[idx] > max_y) max_y = img_y[idx];
      }
      const field_width = max_x - min_x;
      const field_height = max_y - min_y;

      let disp_image_width = this.props.image_details.width * this.props.image_details.scale;
      let disp_image_height = this.props.image_details.height * this.props.image_details.scale;

      let field_disp_scale = field_width > field_height
                                ? Math.floor(10.0 * Math.max(1.0, Math.min(MAX_FIELD_ZOOM, 500 / field_width))) / 10.0
                                : Math.floor(10.0 * Math.max(1.0, Math.min(MAX_FIELD_ZOOM, 500 / field_height))) / 10.0;
      let img_disp_scale = this.props.image_details.width > this.props.image_details.height 
                                ? 500 / (disp_image_width) 
                                : 500 / (disp_image_height);

      const img_width  = (disp_image_width  * img_disp_scale * field_disp_scale);
      const img_height = (disp_image_height * img_disp_scale * field_disp_scale);

      // Image size needs to be considered
      const field_center_x = (min_x + (field_width / 2.0)) * field_disp_scale;
      const field_center_y = (min_y + (field_height / 2.0)) * field_disp_scale;
      const img_disp_ul_x = field_center_x - (500 / 2.0);
      const img_disp_ul_y = field_center_y - (500 / 2.0);

      const x_shift = img_disp_ul_x > 0 ? img_disp_ul_x : 0;
      const y_shift = img_disp_ul_y > 0 ? img_disp_ul_y : 0;

      this.plots_display_info.img_width = img_width;
      this.plots_display_info.img_height = img_height;
      this.plots_display_info.offset_x = -x_shift;
      this.plots_display_info.offset_y = -y_shift;
      this.plots_display_info.field_disp_scale = field_disp_scale;
      this.plots_display_info.img_display_scale = img_disp_scale;
    }

    const bg_position = this.plots_display_info.offset_x + 'px ' + this.plots_display_info.offset_y + 'px';
    const bg_size = this.plots_display_info.img_width + 'px ' + this.plots_display_info.img_height + 'px';

    const polyline = this.get_polyline();
    const plot_lines = this.get_plotlines();
    return (
      <React.Fragment>
        <svg id="field_bounds"
             className="field_bounds"
             version="1.1"
             baseProfile="full"
             width="500" height="500"
             xmlns="http://www.w3.org/2000/svg">
          <polygon points={polyline} stroke="white" fill="none" strokeWidth="3" />
          {
            this.state.points_x.map((coord_x, idx) => {
                return (<circle
                        id="field_corner"
                        key={idx}
                        cx={(coord_x * this.plots_display_info.field_disp_scale) + this.plots_display_info.offset_x}
                        cy={(this.state.points_y[idx] * this.plots_display_info.field_disp_scale) + this.plots_display_info.offset_y}
                        r={3}
                        stroke="white"
                        strokeWidth="2"
                        fill="darkgrey"
                        onMouseDown={(ev) => this.fieldCornerMoveStart(ev, idx)}
                      />
                )
            })
          }
          {
            plot_lines.map((plot, idx) => {
              return (<polygon points={plot} stroke="blue" fill="lightgrey" strokeWidth= "2" fillOpacity=".7" />);
            })
          }
        </svg>
        <div id="field_image_wrapper" className="field_image_wrapper">
          <div id="field_image"
             className="field_image" 
             style={{backgroundImage: 'url('+this.props.image_uri+')', 
                     backgroundSize: bg_size, 
                     backgroundPosition: bg_position}}>
          </div>
        </div>
      </React.Fragment>
    );
  }

  render() {
    let click_func = this.state.current_tool === 0 ? this.clicked : null;
    let move_func =  this.state.current_tool === 0 ? this.mouseMove : this.fieldCornerMove;
    let leave_func = this.state.current_tool === 0 ? this.mouseLeave : this.mouseLeave;
    let enter_func = this.state.current_tool === 0 ? this.mouseEnter : this.mouseEnter;
    let up_func = this.state.current_tool === 0 ? null : this.fieldCornerUp;

    return (
      <div id="plotclip-wrap" className="plotclip-wrap" >
        <div id="plotclip-toolbar-wrap" className="plotclip-toolbar-wrap" >
          <Toolbar tools={this.tools} />
        </div>
        <div id="plotclip-image-wrap" 
             className="plotclip-image-wrap" 
             onClick={click_func} 
             onMouseMove={move_func} 
             onMouseLeave={leave_func} 
             onMouseEnter={enter_func}
             onMouseUp={up_func} >
          <div id="plotclip-image-grid" className="plotclip-image-grid" >
            {(this.state.current_tool === 0) && this.render_field()}
            {(this.state.current_tool === 1) && this.render_plots()}
        </div>
        </div>
        <div id="plotclip-tool-actions" className="plotclip-tool-actions" >
          <Toolbar tools={this.tools[this.state.current_tool].tool_actions} tool_size="small" />
        </div>
        <div id="plotclip-tool-details-wrap" className="plotclip-tool-details-wrap">
          <ToolDetails tool_children={()=>this.tools[this.state.current_tool].tool_options()} cards={this.cards} active_card={this.state.current_tool} />
        </div>
      </div>
      );
  }
}

export default PlotClip
