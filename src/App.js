import React, { Component } from 'react';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import { Input, Button } from 'reactstrap';
import platform from 'platform';
import canvasToImage from 'canvas-to-image';
import 'react-resizable/css/styles.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import logo from './logo.png';
import './App.css';
import { readFile, readImage } from './file';
import drawTrapezoid from './drawTrapezoid';

const baseSize = 325;
const { min, max } = Math;

class App extends Component {
  constructor() {
    super();
    this.state = {
      name: '西脇 太郎',
    };
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
    if(prevState.name !== this.state.name) {
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
    const rate = min(1, baseSize / max(width, height));
    this.setState({ width: width * rate, height: height * rate });
  }
  drawCanvas() {
    this.clear()
    this.drawPhoto();
    this.drawLogo();
    this.drawTextImage();
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
  onChangeText = (propName, { target: { value } }) => {
    this.setState({ [propName]: value });
  }
  async drawTextImage() {
    const { name } = this.state;
    const tempCanvas = document.createElement('canvas');
    const tempCanvasWidth = baseSize * 0.3;
    const tempCanvasHeight = tempCanvasWidth * 0.8;
    tempCanvas.width = tempCanvasWidth;
    tempCanvas.height = tempCanvasHeight;
    const tempCanvasCtx = tempCanvas.getContext('2d');
    tempCanvasCtx.font = `${tempCanvasHeight * 0.8}px Arial`;
    tempCanvasCtx.fillText(name, 0, tempCanvasHeight * 0.8, tempCanvasWidth);
    const url = tempCanvas.toDataURL();
    const image = await readImage(url);
    const ctx = this.canvas.getContext('2d');
    const x = baseSize * 0.68;
    const y = baseSize * 0.48;
    const w = image.width;
    const h = image.height;
    ctx.translate(x, y);
    ctx.translate(w / 2, h / 2);
    ctx.rotate(18 * Math.PI / 180);
    ctx.translate(- w / 2, - h / 2);
    drawTrapezoid(ctx, image, 50);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  download = () => {
    if (platform.os.family === 'Android') {
      const { name } = this.state;
      const a = document.createElement('a');
      a.href = this.$.canvas.toDataURL();
      a.download = `西脇市ロゴ ${name}.png`;
      a.style.display = 'none';
      this.appendChild(a);
      a.click();
    }
    else {
      canvasToImage('canvas');
    }
  }
  render() {
    const { width = 0, height = 0, name } = this.state;
    return (
      <div className="App">
        <div style={{ width: 375, margin: 'auto' }}>
          <div className="text-center">
            <div className="canvas-container" style={{ width: 325, height: 325, position: 'relative', margin: 'auto' }}>
              <Draggable onDrag={this.onDrag}>
                <Resizable width={width} height={height} onResize={this.onResize} lockAspectRatio style={{ position: 'absolute', zIndex: 1 }} className="photo-controller">
                  <div style={{ width, height }}>
                    <canvas width={width} height={height} ref={_ => this.interactCanvas = _} />
                  </div>
                </Resizable>
              </Draggable>
              <canvas id="canvas" className="main-canvas" width={325} height={325} ref={_ => this.canvas = _} style={{ position: 'absolute', zIndex: 2, left: 0 }} />
            </div>
          </div>
          <div className="form-group">
            <Input value={name} onChange={this.onChangeText.bind(this, 'name')} className="form-control"/>
          </div>
          <div className="form-group">
            <Input type="file" className="form-control" onChange={this.onSelectFile} />
          </div>
          <div>
            <Button block color="primary" onClick={this.download}>
              画像をダウンロード
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
