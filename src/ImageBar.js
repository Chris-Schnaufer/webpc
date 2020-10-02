import React, { Component } from 'react';
import ImageLoad from './ImageLoad';
import ExpandCollapse from './ExpandCollapse';
import './ImageBar.css';

var FILE_LIST_URI='http://127.0.0.1:5000/files';

class ImageBar extends Component {
  constructor(props) {
    super(props);
    let default_max = (document.body.clientWidth / 110) - 1;

    this.handleResize = this.handleResize.bind(this);
    this.fetchImages = this.fetchImages.bind(this);

    this.state = {
      start_pos: 0,               // Starting display index
      max_display: default_max,   // Maximum number of images on the display
      image_list: [],             // The list of images
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.reload && ! this.props.reload) {
      window.setTimeout(this.fetchImages, 100);
    }
    return nextProps.reload === true || this.props.full_bar !== nextProps.full_bar;
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    // Fetch available images
    window.setTimeout(this.fetchImages);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  fetchImages() {
    fetch(FILE_LIST_URI, {
      method: 'GET',
      }
    )
    .then(response => response.json())
    .then(success => {this.setState({image_list: success});this.props.done_reload();})
    .catch(error => {console.log('ERROR'); console.log(error);});
  }

  handleResize() {
    let main_bar = document.getElementById("imagebar-wrap");
    let one_image = document.getElementById("imagebar-image-wrap0");
    if (! main_bar || ! one_image ) {
      return;
    }

    let image_width = one_image.getBoundingClientRect().width;
    let max_images = Math.floor(main_bar.clientWidth / image_width) - 1;
    this.setState({max_display: max_images});
  }

  image_selected(image_uri) {
    this.props.selected_func(image_uri);
  }

  thumbnails(images) {
    const image_wrap_class = this.props.full_bar ? "imagebar-image-wrap" : "imagebar-image-wrap-small";
    const image_class = this.props.full_bar ? "imagebar-image" : "imagebar-image-small";
    const image_label_class = this.props.full_bar ? "imagebar-image-label" : "imagebar-image-label-small";
    return (
      images.map((image) => 
          <div key={image.id.toString()} id={"imagebar-image-wrap" + image.id.toString()} className={image_wrap_class} onClick={() => this.image_selected(image.uri)}>
            <img id={"imagebar-image-"  + image.id.toString()} className={image_class} src={image.thumbnail_uri} alt={image.name} />
            <label id={"imagebar-image-"  + image.id.toString() + "-label"} className={image_label_class} >
              {image.name}
            </label>
          </div>
      )
    );
  }

  render() {
    let images = this.state.image_list;
    return(
      <div id="imagebar-wrap" className={this.props.full_bar ? "imagebar-wrap" : "imagebar-wrap-small"} >
        <ImageLoad have_uploaded={this.props.update_images} small={!this.props.full_bar} />
        <ExpandCollapse full_bar={this.props.full_bar} state_changed={this.props.expand_func} />
        {this.thumbnails(images.slice(this.state.start_pos, this.state.start_pos + this.state.max_display))}
      </div>
    );
  }
}

export default ImageBar
