import React, { Component } from 'react';
import Titlebar from './Titlebar';
import ImageBar from './ImageBar';
import PlotClip from './PlotClip';
import ExpandCollapse from './ExpandCollapse';
import "./App.css"

class App extends Component {

  constructor(props) {
    super(props);
    this.expand_image_bar = this.expand_image_bar.bind(this);
    this.image_reload_done = this.image_reload_done.bind(this);
    this.image_selected = this.image_selected.bind(this);
    this.reload_images = this.reload_images.bind(this);
    this.reset_selected_image = this.reset_selected_image.bind(this);
    this.state = {
      modified: false,
      image_bar_full: false,
      reload_images: true,
      selected_image: null,
      image_details: null,
    };
  }

  expand_image_bar(bar_expanded) {
    this.setState({image_bar_full: bar_expanded});
  }

  image_reload_done() {
    this.setState({reload_images: false});
  }

  image_selected(image_uri, image_details) {
    this.setState({selected_image: image_uri, image_details: image_details, image_bar_full: false});
  }

  reload_images() {
    this.setState({reload_images: true});
  }

  reset_selected_image() {
    this.setState({selected_image: null, reload_images: true});
  }

  render_image_bar() {
    let should_reload_images = this.state.reload_images;
    const image_bar_full = this.state.image_bar_full;
    if (!image_bar_full && !this.state.reload_images) {
      this.setState({reload_images: true});
      should_reload_images = true;
    }
    return (
      <div id="image_bar_drop_wrap" class="image_bar_drop_wrap">
        <ExpandCollapse expanded={image_bar_full} state_changed={this.expand_image_bar} />
        {!image_bar_full ? null :
            <div id="floating_image_bar" class="floating_image_bar" >
              <ImageBar reload={should_reload_images} 
                    done_reload={this.image_reload_done}
                    selected_func={this.image_selected}
                    update_images={this.reload_images}
                    full_bar={image_bar_full}
                    expand_func={this.expand_image_bar}
              />
            </div>
        }
      </div>
    );
  }

  render() {
    const should_reload_images = this.state.reload_images;
    return (
      <div id="App">
        <Titlebar title="Plot Boundaries" />
          {this.state.selected_image == null ?
              <ImageBar reload={should_reload_images} 
                    done_reload={this.image_reload_done}
                    selected_func={this.image_selected}
                    update_images={this.reload_images}
                    full_bar={true}
                    expand_func={this.expand_image_bar}
              /> :
              this.render_image_bar()}
        {this.state.selected_image != null ? 
              <PlotClip image_uri={window.location.origin.concat(this.state.selected_image)} image_details={this.state.image_details} /> :
              null}
      </div>
    );
  }
}

export default App;
