import React, { Component } from 'react';
import Titlebar from './Titlebar';
import ImageBar from './ImageBar';
import PlotClip from './PlotClip';
import "./App.css"

class App extends Component {

  constructor(props) {
    super(props);
    this.expand_image_bar = this.expand_image_bar.bind(this);
    this.image_reload_done = this.image_reload_done.bind(this);
    this.image_selected = this.image_selected.bind(this);
    this.reload_images = this.reload_images.bind(this);
    this.state = {
      image_bar_full: true,
      reload_images: true,
      selected_image: null,
    };
  }

  expand_image_bar(bar_expanded) {
    this.setState({image_bar_full: bar_expanded});
  }

  image_reload_done() {
    this.setState({reload_images: false});
  }

  image_selected(image_uri) {
    this.setState({selected_image: image_uri, image_bar_full: false});
  }

  reload_images() {
    this.setState({reload_images: true});
  }

  render() {;
    const should_reload_images = this.state.reload_images;
    const image_bar_full = this.state.image_bar_full;
    return (
      <div id="App">
        <Titlebar title="Image Plot Clipping" />
          <ImageBar reload={should_reload_images} 
                    done_reload={this.image_reload_done}
                    selected_func={this.image_selected}
                    update_images={this.reload_images}
                    full_bar={image_bar_full}
                    expand_func={this.expand_image_bar}
          />
        {this.state.selected_image != null ? <PlotClip image_uri={this.state.selected_image} /> : null}
      </div>
    );
  }
}

export default App;
