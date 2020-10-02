import React, { Component } from 'react';
import {GlassMagnifier, MOUSE_ACTIVATION, TOUCH_ACTIVATION} from "react-image-magnifiers";
import SvgButton from './SvgButton'
import Toolbar from './ToolBar'
import ToolDetails from './ToolDetails'
import './PlotClip.css'

class PlotClip extends Component {
  constructor(props) {
    super(props);
    this.boundsDone = this.boundsDone.bind(this);
    this.clicked = this.clicked.bind(this);
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
                  last_x: null,
                  last_y: null,
                  drawing: false,
                  was_drawing: false,
                  have_bounds: false,
                  current_tool: 0,
                 };
  }

  tools = [
  {id: 'draw_plot_boundaries', name: 'Field Boundary', tool_uri: process.env.PUBLIC_URL + '/PlotBounds.png', state: 0, tool_options: ()=>this.toolOptionsBounds()},
  {id: 'plot_rows_columns', name: 'Plot Definition', tool_uri: process.env.PUBLIC_URL + '/PlotCounts.png', state: 1, tool_options: ()=>this.toolOptionsPlot()},
  ];

  cards = [
    'Click on the field corners to outline the boundaries of all the plots',
    'Enter the number of plot rows and columns contained within the boundary'
  ];

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
    } else if (ev.key === 'Backspace') {
      let cur_x = this.state.points_x;
      let cur_y = this.state.points_y;

      if (cur_x.length > 0) {
        cur_x.pop();
        cur_y.pop();

        this.setState({points_x: cur_x, points_y: cur_y});
      }
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

  boundsDone(ev) {
    this.tools[0].state = -1;
    this.tools[1].state = 0;
    this.setState({current_tool: 1, drawing: false, was_drawing: false});
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
      <React.Fragment>
        <SvgButton enabled={false} left={true} />
        <SvgButton enabled={this.state.have_bounds} left={false} onClicked={this.boundsDone} />
      </React.Fragment>
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
          <SvgButton enabled={false} left={true} />
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

    let svg_el = document.getElementById('grid_lines');
    if (svg_el) {
      svg_el.style.width = el_width + "px";
      svg_el.style.height = el_height + "px";
    } else {
      console.log("NO SVG");
    }
  }

  render() {
    const polyline = this.get_polyline();

    return (
      <div id="plotclip-wrap" className="plotclip-wrap" >
        <div id="plotclip-toolbar-wrap" className="plotclip-toolbar-wrap" >
          <Toolbar tools={this.tools} />
        </div>
        <div id="plotclip-image-wrap" className="plotclip-image-wrap" onClick={this.clicked} onMouseMove={this.mouseMove} onMouseLeave={this.mouseLeave} onMouseEnter={this.mouseEnter} >
          <div id="plotclip-image-grid" className="plotclip-image-grid" >
            <svg id="grid_lines"
                 className="grid_lines"
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
        </div>
        <div id="plotclip-tool-details-wrap" className="plotclip-tool-details-wrap">
          <ToolDetails tool_children={()=>this.tools[this.state.current_tool].tool_options()} cards={this.cards} active_card={this.state.current_tool} />
        </div>
      </div>
      );
  }
}

export default PlotClip
