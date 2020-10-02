import React, { Component } from 'react';
import './ToolBar.css'

class Toolbar extends Component {
  constructor(props) {
    super(props);
    let default_max = document.body.clientWidth / 55;

    this.handleResize = this.handleResize.bind(this);
    this.tool_selected = this.tool_selected.bind(this);

    this.state = {
      start_pos: 0,               // Starting display index
      max_display: default_max,   // Maximum number of images on the display
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize() {
    let main_bar = document.getElementById("toolbar-wrap");
    let one_tool = document.getElementById("toolbar-tool-wrap0");
    if (! main_bar || ! one_tool ) {
      return;
    }

    let image_width = one_tool.getBoundingClientRect().width;
    let max_images = Math.floor(main_bar.clientWidth / image_width) - 1;
    this.setState({max_display: max_images});
  }

  tool_selected(tool_id) {

  }

  handle_overlay(state, tool_info) {
    if (state) {
      return (
        <div id="toolbar-tool-grid" className="toolbar-tool-grid" >
          <svg id="toolbar-tool-overlay"
                 className="toolbar-svg"
                 version="1.1"
                 baseProfile="full"
                 width="100%" height="100%"
                 xmlns="http://www.w3.org/2000/svg">
            <polygon points="0 0 60 0 60 90 0 90" stroke="white" strokeWidth="1" fill="white" fillOpacity="60%" />
          </svg>
          <div id="toolbar-tooldetail-wrap" className="toolbar-tooldetail-wrap" >
            <img id={"toolbar-tool-"  + tool_info.id.toString()} className="toolbar-tool" src={tool_info.tool_uri} alt={tool_info.name} />
            <div id={"toolbar-tool-"  + tool_info.id.toString() + "-label"} className="toolbar-tool-label">{tool_info.name}</div>
          </div>
        </div>
        );
    }
    return (
      <React.Fragment>
        <img id={"toolbar-tool-"  + tool_info.id.toString()} className="toolbar-tool" src={tool_info.tool_uri} alt={tool_info.name} />
        <div id={"toolbar-tool-"  + tool_info.id.toString() + "-label"} className="toolbar-tool-label">{tool_info.name}</div>
        </React.Fragment>
    );
  }

  tools(all_tools) {
    return (
      all_tools.map((one_tool) => {
          let state = 0;

          if (one_tool.hasOwnProperty('state')) {
            state = one_tool['state'];
            if (state < 0) {
              state = -1;
            } else if (state > 0) {
              state = 1;
            }
          }

          return (
              <div key={one_tool.id.toString()} id={"toolbar-tool-wrap" + one_tool.id.toString()} className="toolbar-tool-wrap" onClick={() => this.tool_selected(one_tool.id)}>
                {this.handle_overlay(state, one_tool)}
              </div>
          );
        }
      )
    );
  }

  render() {
    let all_tools = this.props.tools;
    return(
      <div id="toolbar-wrap" className="toolbar-wrap">
      {this.tools(all_tools.slice(this.state.start_pos, this.state.start_pos + this.state.max_display))}
      </div>
      )
  }
}

export default Toolbar;
