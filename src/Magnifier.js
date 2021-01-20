import React, { Component } from 'react';
import "./Magnifier.css"

class Magnifier extends Component {
  MIN_ZOOM = 1.0;   // 1x zoom in
  MAX_ZOOM = 8.0;   // 8x zoom in

  constructor(props) {
    super(props);

    this.mouseMove = this.mouseMove.bind(this);
    this.imgLoad = this.imgLoad.bind(this);

    let starting_zoom = 'zoom' in props ? parseFloat(props['zoom']) : this.MIN_ZOOM;
    if (isNaN(starting_zoom) || (starting_zoom < this.MIN_ZOOM)) {
      starting_zoom = this.MIN_ZOOM;
    }
    if (starting_zoom > this.MAX_ZOOM) {
      starting_zoom = this.MAX_ZOOM;
    }

    if (! ('parent_id' in props)) {
      console.log('Error: Magnifier configuration error: parent element identifier property not specified');
    }
    if (! ('source_uri' in props)) {
      console.log('Error: Magnifier configuration error: source image URI property not specified');
    }

    this.parent_id = props['parent_id'];
    this.source_image = props['source_uri'];
    this.image_width = 0;
    this.image_height = 0;
    this.conversion_factor = 1.0;

    this.state = {
      zoom: parseFloat(starting_zoom),
    };
  }

  imgLoad(img) {
    this.image_width = img.width;
    this.image_height = img.height;

    // Force an initialization
    this.initializeUI();
  }

  componentDidMount(){
    if (!this.parent_id || !this.source_image) {
      return;
    }

    let parent_el = document.getElementById(this.parent_id);
    if (!parent_el) {
      console.log("Magnifier: Unable to find parent element for event listener:",this.parent_id);
      return;
    }

    const img = new Image();
    img.onload = () => {this.imgLoad(img)};
    img.src = this.source_image;

    parent_el.addEventListener("mousemove", this.mouseMove, { passive: true });
  }

  componentWillUnmount(){
    if (!this.parent_id) {
      return;
    }

    let parent_el = document.getElementById(this.parent_id);
    if (!parent_el) {
      console.log("Magnifier: Unable to find parent element to remove event listener:",this.parent_id);
      return;
    }

    parent_el.removeEventListener("mousemove", this.mouseMove, false);
  }

  initializeUI() {
    if (!this.parent_id || !this.source_image) {
      return;
    }

    let el = document.getElementById("magnifier");
    let el_frame = document.getElementById("magnifier_frame");
    let el_parent = document.getElementById(this.parent_id);

    if (!el || !el_frame || !el_parent) {
      console.log("ERROR: unable to initialize magnifier");
      return;
    }

    const parent_rect = el_parent.getBoundingClientRect();

    el_frame.style.left = parent_rect.left + "px";
    el_frame.style.top = parent_rect.top + "px";
    el_frame.style.width = parent_rect.width + "px";
    el_frame.style.height = parent_rect.height + "px";

    if (this.props.hasOwnProperty('startX') && this.props.hasOwnProperty('startY')) {
      this.adjustMagnifier(parseInt(this.props['startX']), parseInt(this.props['startY']));
    }
  }

  mouseMove(ev) {
    this.adjustMagnifier(ev.pageX, ev.pageY);
  }

  adjustMagnifier(pageX, pageY) {
    // Can't do anything until we're properly initialized
    if (!this.image_width || !this.image_height) {
      return;
    }
    let el = document.getElementById("magnifier");
    let el_frame = document.getElementById("magnifier_frame");
    let el_parent = document.getElementById(this.parent_id);

    if (!el || !el_frame || !el_parent) {
      return;
    }

    const el_rect = el.getBoundingClientRect();
    const el_frame_rect = el_frame.getBoundingClientRect();
    const parent_rect = el_parent.getBoundingClientRect();
    let top_pos = (pageY - (el_rect.height / 2.0));
    let left_pos = (pageX - (el_rect.width / 2.0));

    let el_style = window.getComputedStyle(el, null);
    let left_border = parseInt(el_style.getPropertyValue('border-left-width'));
    let top_border = parseInt(el_style.getPropertyValue('border-top-width'));
    let background_image_url = 'url('+this.source_image+')';;

    let style_left = (left_pos - left_border - el_frame_rect.left); 
    let style_top = (top_pos - top_border - el_frame_rect.top);
    el.style.left = style_left + 'px';
    el.style.top = style_top + 'px';
    el.style.backgroundImage = background_image_url;
    el.style.backgroundRepeat = "no-repeat";

    this.conversion_factor = this.image_height / parent_rect.height;
    let zoomed_height = this.image_height * this.state.zoom;
    let zoomed_width = this.image_width * this.state.zoom;
    let offset_top = (pageY - parent_rect.y) * this.conversion_factor * this.state.zoom;
    let offset_left = (pageX - parent_rect.x) * this.conversion_factor * this.state.zoom;
    offset_top -= (((el.clientHeight) / 2.0) / this.state.zoom);
    offset_left -= (((el.clientWidth) / 2.0) / this.state.zoom);

    el.style.backgroundPosition = -offset_left + "px " + -offset_top + "px";
    el.style.backgroundSize = zoomed_width + "px " + zoomed_height + "px";
  }

  render() {
    if (!this.parent_id || !this.source_image) {
      return;
    }

    return(
      <div id="magnifier_frame" className="magnifier_frame">
        <div id="magnifier" className="magnifier">
        </div>
      </div>
    );
  }
}

export default Magnifier
