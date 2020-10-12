import React, { Component } from 'react';
import {GlassMagnifier, MOUSE_ACTIVATION, TOUCH_ACTIVATION} from "react-image-magnifiers";
import SvgButton from './SvgButton'
import Toolbar from './ToolBar'
import ToolDetails from './ToolDetails'
import './PlotClip.css'

var ZOOM_IMAGE_BUFFER_PIXEL = 20;

class PlotClip extends Component {
  constructor(props) {
    super(props);
    this.actionFieldDelete = this.actionFieldDelete.bind(this);
    this.boundsDone = this.boundsDone.bind(this);
    this.clicked = this.clicked.bind(this);
    this.getBounds = this.getBounds.bind(this);
    this.imageLoaded = this.imageLoaded.bind(this);
    this.keyPress = this.keyPress.bind(this);
    this.mouseEnter = this.mouseEnter.bind(this);
    this.mouseLeave = this.mouseLeave.bind(this);
    this.mouseMove = this.mouseMove.bind(this);
    this.plotsCols = this.plotsCols.bind(this);
    this.plotsDone = this.plotsDone.bind(this);
    this.plotsRows = this.plotsRows.bind(this);
    this.toolOptionsBounds = this.toolOptionsBounds.bind(this);
    this.toolOptionsPlot = this.toolOptionsPlot.bind(this);

    this.state = {points_x: [],
                  points_y: [],
                  img_field_x: [],
                  img_field_y: [],
                  last_x: null,
                  last_y: null,
                  drawing: false,
                  was_drawing: false,
                  have_bounds: false,
                  current_tool: 0,
                 };
  }

  bounds_actions = [
  {id: 'delete_point', name: 'Delete', tool_uri: process.env.PUBLIC_URL + '/Delete.png', state: 1, tool_click: ()=>this.actionFieldDelete()},
  ];

  plots_actions = [];

  tools = [
  { id: 'draw_plot_boundaries', 
    name: 'Field Boundary', 
    tool_uri: process.env.PUBLIC_URL + '/PlotBounds.png', 
    state: 0, 
    tool_actions: this.bounds_actions,
    tool_options: ()=>this.toolOptionsBounds()
  },
  {
    id: 'plot_rows_columns', 
    name: 'Plot Definition', 
    tool_uri: process.env.PUBLIC_URL + '/PlotCounts.png', 
    state: 1, 
    tool_actions: this.plots_actions,
    tool_options: ()=>this.toolOptionsPlot()
  },
  ];

  cards = [
    'Click on the field corners to outline the boundaries of all the plots',
    'Enter the number of plot rows and columns contained within the boundary'
  ];

  plots_display_info = {
    offset_x: 0,
    offset_y: 0,
    field_disp_scale: 1.0,
    img_display_scale: 1.0,
  };

  componentDidMount(){
    document.addEventListener("keydown", this.keyPress, false);
  }

  componentWillUnmount(){
    document.removeEventListener("keydown", this.keyPress, false);
  }

  clicked(ev) {
    let new_points_x = this.state.points_x;
    let new_points_y = this.state.points_y;

    let client_rect = ev.target.getBoundingClientRect();
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

    let scale = (this.props.image_details.width > this.props.image_details.height) 
                  ? client_rect.width / this.props.image_details.width 
                  : client_rect.height / this.props.image_details.height;
    let new_field_x = this.state.img_field_x;
    let new_field_y = this.state.img_field_y;
    new_field_x.push(img_click_x / scale);
    new_field_y.push(img_click_y / scale);

    this.setState({points_x: new_points_x, points_y: new_points_y, img_field_x: new_field_x, img_field_y: new_field_y, drawing: true});

    if (new_points_x.length > 3) {
      this.setState({have_bounds: true});
    }
  }

  keyPress(ev) {
    if (ev.key === 'Escape') {
      this.setState({drawing: false});
    } else if (ev.key === 'Backspace') {
      this.actionFieldDelete();
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

  getBounds(ev) {
    this.tools[0].state = 0;
    this.tools[1].state = 1;
    this.setState({current_tool: 0, drawing: false})
  }

  boundsDone(ev) {
    this.tools[0].state = -1;
    this.tools[1].state = 0;
    this.setState({current_tool: 1, drawing: false, was_drawing: false});
  }

  actionFieldDelete(ev) {
    let cur_x = this.state.points_x;
    let cur_y = this.state.points_y;
    let field_x = this.state.img_field_x;
    let field_y = this.state.img_field_y;
    if (cur_x.length > 0) {
      cur_x.pop();
      cur_y.pop();
      field_x.pop();
      field_y.pop();

    if (cur_x.length <= 0) {
      this.bounds_actions[0].state = 1;
    }

      this.setState({points_x: cur_x, points_y: cur_y, img_field_x: field_x, img_field_y: field_y});
    }
  }

  plotsCols(ev) {
    const num_cols = ev.target.value;
    console.log("COLS:" + num_cols);
  }

  plotsRows(ev) {
    const num_rows = ev.target.value;
    console.log("ROWS:" + num_rows);
  }

  plotsDone(ev) {
    this.tools[1].state = -1;
    this.setState({current_tool: 1});
  }

  toolOptionsBounds() {
    return (
      <div style={{disply:"flex", displayDirection:"column", justifyContent: "space-around"}} >
        <div id="tool-options-plot-navigation" className="tool-options-plot-navigation">
          <SvgButton enabled={false} left={true} />
          <SvgButton enabled={this.state.have_bounds} left={false} onClicked={this.boundsDone} />
        </div>
      </div>
    );
  }

  toolOptionsPlot() {
    return (
      <div style={{disply:"flex", displayDirection:"column", justifyContent: "space-around"}} >
        <div style={{display:"grid", gridTemplateColumns: "repeat(2, 1fr)", gridGap: "10px"}} >
            <label htmlFor="plot_cols" style={{gridColumn: 1}}>Number of plot columns:</label>
            <input id="plot_cols" type="number" min="1" max="1000" size="10" value="1" style={{gridColumn: 2, maxWidth: "100px"}} onChange={this.plotsCols}></input>
            <label htmlFor="plot_rows" style={{gridColumn: 1}}>Number of plot rows:</label>
            <input id="plot_rows" type="number" min="1" max="1000" size="10" value="1" style={{gridColumn: 2, maxWidth: "100px"}} onChange={this.plotsRows}></input>
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

    points_x.map((coord_x, idx) => polyline += coord_x + ' ' + points_y[idx] + ' ');
    if (points_x.length > 0) {
      last_x = points_x[points_x.length - 1];
      last_y = points_y[points_y.length - 1];
    }
    if (this.state.drawing && this.state.last_x && this.state.last_y && (this.state.last_x !== last_x || this.state.last_y !== last_y)) {
      polyline += this.state.last_x + ' ' + this.state.last_y;
    }
    return polyline;
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
      <div id="plotclip-image-grid" className="plotclip-image-grid" >
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
      </div>
    );
  }

  render_plots() {
    const polyline = this.get_polyline();

    // Get the bonds of the field
    const img_x = this.state.img_field_x;
    const img_y = this.state.img_field_y;
    console.log(img_x);console.log(img_y);
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

    // TODO: Center shape on image
    // Add some buffer
    min_x -= ZOOM_IMAGE_BUFFER_PIXEL;
    min_y -= ZOOM_IMAGE_BUFFER_PIXEL;
    max_x += ZOOM_IMAGE_BUFFER_PIXEL;
    max_y += ZOOM_IMAGE_BUFFER_PIXEL;
    if (min_x < 0) min_x = 0;
    if (min_y < 0) min_y = 0;
    if (max_x > this.props.image_details.width)  max_x = this.props.image_details.width;
    if (max_y > this.props.image_details.height) max_y = this.props.image_details.height;

    let disp_image_width = this.props.image_details.width * this.props.image_details.scale;
    let disp_image_height = this.props.image_details.height * this.props.image_details.scale;
    console.log("DISP:",disp_image_width,disp_image_height);

    let field_disp_scale = this.props.image_details.width > this.props.image_details.height 
                              ? 500 / ((max_x - min_x) * this.props.image_details.scale)
                              : 500 / ((max_y - min_y) * this.props.image_details.scale);
    let img_disp_scale = this.props.image_details.width > this.props.image_details.height 
                              ? 500 / (disp_image_width) 
                              : 500 / (disp_image_height);

  field_disp_scale = 1.0;

    console.log(this.props.image_details);
    console.log("Bounds:",max_x,min_x,max_y,min_y);
    console.log("Size:",max_x-min_x,max_y-min_y);
    console.log("Scales:",field_disp_scale, img_disp_scale);

    const min_width = (disp_image_width * field_disp_scale);
    const min_height = (disp_image_height * field_disp_scale);
    const offset_x = (min_x * this.props.image_details.scale * img_disp_scale * field_disp_scale);
    const offset_y = (min_y * this.props.image_details.scale * img_disp_scale * field_disp_scale);
    const bg_position = '-' + offset_x + 'px -' + offset_y + 'px';

    console.log("Img:", this.props.image_details.width,this.props.image_details.height);
    console.log("Disp: ", this.props.image_details.width * field_disp_scale, this.props.image_details.height * field_disp_scale)
    console.log("Size:", min_width, min_height);
    console.log("OFFset:",offset_x, offset_y);

    this.plots_display_info.offset_x = offset_x;
    this.plots_display_info.offset_y = offset_y;
    this.plots_display_info.field_disp_scale = field_disp_scale;
    this.plots_display_info.img_display_scale = img_disp_scale;

    return (
      <div id="plotclip-image-grid" className="plotclip-image-grid" >
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
        <div id="field_image_wrapper" className="field_image_wrapper">
          <div id="field_image"
             className="field_image" 
             style={{backgroundImage:'url('+this.props.image_uri+')', 
                     backgroundSize:min_height + 'px '+min_width + 'px', 
                     backgroundPosition:bg_position}}>
          </div>
        </div>
      </div>
    );
  }


  render() {

    return (
      <div id="plotclip-wrap" className="plotclip-wrap" >
        <div id="plotclip-toolbar-wrap" className="plotclip-toolbar-wrap" >
          <Toolbar tools={this.tools} />
        </div>
        <div id="plotclip-image-wrap" className="plotclip-image-wrap" onClick={this.clicked} onMouseMove={this.mouseMove} onMouseLeave={this.mouseLeave} onMouseEnter={this.mouseEnter} >
        {(this.state.current_tool === 0) && this.render_field()}
        {(this.state.current_tool === 1) && this.render_plots()}
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
