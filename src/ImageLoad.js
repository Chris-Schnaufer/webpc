import React, { Component } from 'react';
import './ImageLoad.css'

var MAX_FILE_SIZE=100*1024*1024
var FILE_UPLOAD_URI='http://127.0.0.1:5000/files'

class ImageLoad extends Component {
  constructor(props) {
    super(props)
    this.handleStart = this.handleStart.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleOver = this.handleOver.bind(this);
    this.handleEnd = this.handleEnd.bind(this);
    this.browseImage = this.browseImage.bind(this);
  }

  browseImage() {
    let btn = document.getElementById('imagedrop-file-browse');
    let browse = document.getElementById('imagedrop-file-find');
    btn.style.display = "none";
    browse.style.display = "default";
    browse.click();
  }

  handleDrop(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    if (ev.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (let i = 0; i < ev.dataTransfer.items.length; i++) {
        // If dropped items aren't files, reject them
        if (ev.dataTransfer.items[i].kind === 'file') {
          var file = ev.dataTransfer.items[i].getAsFile();
          this.handleUpload(file);
          break;
        }
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      for (let i = 0; i < ev.dataTransfer.files.length; i++) {
        this.handleUpload(ev.dataTransfer.files[i]);
        break;
      }
    }
  }

  fileBrowsed() {
    let btn = document.getElementById('imagedrop-file-browse');
    let browse = document.getElementById('imagedrop-file-find');
    const selected_file = browse.files;
    btn.style.display = "unset";
    browse.style.display = "none";
    for (let i = 0; i < selected_file.length; i++) {
      this.handleUpload(selected_file[i]);
    }
  }

  handleUpload(file) {
    if (file.size > MAX_FILE_SIZE) {
      console.log("File too large: '" + file.name + "'' " + file.size);
      return;
    }
    var formData = new FormData();
    formData.append('file', file);

    fetch(FILE_UPLOAD_URI, {
      method: 'PUT',
      body: formData,
      }
    )
    .then(response => response.json())
    .then(success => {console.log(success); this.props.have_uploaded();})
    .catch(error => {console.log('ERROR'); console.log(error);}
    );
  }

  handleOver(ev) {
    ev.preventDefault();
    ev.stopPropagation();
  }

  handleStart(ev) {
    ev.preventDefault();
    ev.stopPropagation();
  }

  handleEnd(ev) {
    ev.preventDefault();
    ev.stopPropagation();
  }

  render() {
    return (
      <div id="imagedrop-wrap" className="imagedrop-wrap" draggable="true" onDragStart={this.handleStart} onDrop={this.handleDrop} onDragOver={this.handleOver} onDragEnd={this.handleEnd}>
        <div id="imagedrop" className={this.props.small ? "imagedrop-border-small" : "imagedrop-border"} >
          <div id="imagedrop-zone" className={this.props.small ? "imagedrop-zone-small" : "imagedrop-zone"} >
            {!this.props.small && 
              <div id="imagedrop-zone-info" className="imagedrop-zone-info">
                <svg version="1.1"
                   baseProfile="full"
                   width="50" height="70"
                   xmlns="http://www.w3.org/2000/svg">
                  <polygon points="0 0 35 0 50 15 50 70 0 70 0 0" stroke="lightgrey" fill="white" strokeWidth="2" />
                  <polygon points="35 0 35 15 50 15" stroke="lightgrey" fill="white" strokeWidth="1" />
                  <polygon points="25 35 35 45 30 45 30 55 20 55 20 45 15 45 25 35" stroke="lightgrey" fill="white" strokeWidth="1" />
                  <text x="25" y="27" fontSize="10" textAnchor="middle" fill="darkgrey">Drop File</text>
                </svg>
              </div>
            }
          </div>
          <div id="imagedrop-browse" className="imagedrop-browse">
            <button type="button" id="imagedrop-file-browse" className={this.props.small ? "imagedrop-file-browse-small" : "imagedrop-file-browse"} onClick={this.browseImage}>Browse Image</button>
            <input type="file" id="imagedrop-file-find" accept="image/*" multiple className="imagedrop-file-pick" onChange={this.fileBrowsed.bind(this)}></input>
          </div>
        </div>
      </div>
      )
  }
}

export default ImageLoad
