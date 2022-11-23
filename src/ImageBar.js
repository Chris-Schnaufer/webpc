import React, { Component } from 'react';
import ImageLoad from './ImageLoad';
import './ImageBar.css';

var FILE_LIST_URI=window.location.origin.concat('/files');

const LARGE_IMAGE_SIZE_PX=150;
const SMALL_IMAGE_SIZE_PX=47;

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
    .catch(error => {console.log('ERROR', error);});
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

  image_selected(image_uri, image_details) {
    this.props.selected_func(image_uri, image_details);
  }

  thumbnails(images) {
    const image_wrap_class = this.props.full_bar ? "imagebar-image-wrap" : "imagebar-image-wrap-small";
    const image_class = this.props.full_bar ? "imagebar-image" : "imagebar-image-small";
    const image_label_class = this.props.full_bar ? "imagebar-image-label" : "imagebar-image-label-small";
    const image_size_px = this.props.full_bar ? LARGE_IMAGE_SIZE_PX : SMALL_IMAGE_SIZE_PX;
    return (
      images.map((image) => {
          const dim_ratio = Number(image.width) / Number(image.height);
          var thumb_width = 0;
          var thumb_height = 0;
          if (image.width <= image.height) {
            thumb_width = (image_size_px * dim_ratio) + 'px';
            thumb_height = image_size_px + 'px';
          } else {
            thumb_width = image_size_px + 'px';
            thumb_height = (image_size_px * dim_ratio) + 'px';
          }
          return (
          <>
            <div key={image.id.toString()} id={"imagebar-image-wrap" + image.id.toString()} className={image_wrap_class} onClick={() => this.image_selected(image.uri, image)}>
              <img id={"imagebar-image-"  + image.id.toString()} 
                   className={image_class}
                   style={{minWidth: thumb_width, minHeight: thumb_height, maxWidth: thumb_width, maxHeight: thumb_height}}
                   src={window.location.origin.concat(image.thumbnail_uri)}
                   alt={image.name}
                   title={image.name}
                   />
              <label id={"imagebar-image-"  + image.id.toString() + "-label"} className={image_label_class} >
                {image.name}
              </label>
            </div>
          </>
          );
        }
      )
    );
  }

  render() {
    let images = this.state.image_list;
    return(
      <div id="imagebar-wrap" className={this.props.full_bar ? "imagebar-wrap" : "imagebar-wrap-small"} >
        <ImageLoad have_uploaded={this.props.update_images} small={!this.props.full_bar} />
        <div id="imagebar-all-img-wrap" class="imagebar-all-img-wrap" >
          {this.thumbnails(images.slice(this.state.start_pos, this.state.start_pos + this.state.max_display))}
        </div>
      </div>
    );
  }
}

export default ImageBar
