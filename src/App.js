import React, { Component } from 'react';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

import logo from './logo.png';
import './App.css';
import { readFile, readImage } from './file';

const baseSize = 425

class App extends Component {
  constructor() {
    super();
    this.state = {};
  }
  componentDidMount() {
    this.loadLogo();
  }
  async loadLogo() {
    this.setState({ logo: await readImage(logo) });
  }
  componentDidUpdate(prevProps, prevState) {
    if(prevState.logo !== this.state.logo) {
      this.drawCanvas();
    }
    if(prevState.photo !== this.state.photo) {
      this.setSize();
    }
    if(prevState.width !== this.state.width || prevState.height !== this.state.height) {
      this.drawInteractCanvas();
      this.drawCanvas();
    }
    if(prevState.x !== this.state.x || prevState.y !== this.state.y) {
      this.drawCanvas();
    }
  }
  onSelectFile = async ({ target: { files: [file] } }) => {
    if (!file) return;
    const imageUrl = await readFile(file, 'readAsDataURL');
    const photo = await readImage(imageUrl);
    this.setState({ photo });
  }
  setSize() {
    const { photo: { width = 0, height = 0 } = {} } = this.state;
    this.setState({ width, height });
  }
  drawCanvas() {
    this.clear()
    this.drawPhoto();
    this.drawLogo();
  }
  clear() {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, baseSize, baseSize);
  }
  drawPhoto() {
    const { photo, x = 0, y = 0, width = 0, height = 0 } = this.state;
    if (!photo) return;
    const offsetRate = 0.15;
    const offset = baseSize * offsetRate;
    const maskSize = baseSize - offset * 2;
    const ctx = this.canvas.getContext('2d');
    ctx.save();
    ctx.beginPath();
    ctx.rect(offset, offset, maskSize, maskSize);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(photo, x, y, width, height);
    ctx.restore();
  }
  drawInteractCanvas() {
    const { photo, width = 0, height = 0 } = this.state;
    if (!photo) return;
    const ctx = this.interactCanvas.getContext('2d');
    ctx.drawImage(photo, 0, 0, width, height)
  }
  drawLogo() {
    const { logo } = this.state;
    if(!logo) return;
    const ctx = this.canvas.getContext('2d');
    ctx.drawImage(logo, 0, 0, baseSize, baseSize);
  }
  onDrag = (event, { x, y }) => {
    if(event.path.some(_ => _.className === 'react-resizable-handle')) return false;
    this.setState({ x, y });
  }
  onResize = (_, { size: { width, height } }) => {
    this.setState({ width, height });
  }
  render() {
    const { width = 0, height = 0 } = this.state;
    return (
      <div className="App">
        <input type="file" onChange={this.onSelectFile} />
        <Draggable onDrag={this.onDrag}>
          <Resizable width={width} height={height} onResize={this.onResize} lockAspectRatio>
            <div style={{ width, height }}>
              <canvas width={width} height={height} ref={_ => this.interactCanvas = _} />
            </div>
          </Resizable>
        </Draggable>
        <canvas width={425} height={425} ref={_ => this.canvas = _} />
      </div>
    );
  }
}

export default App;
