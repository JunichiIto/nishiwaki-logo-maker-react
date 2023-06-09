import React, { Component } from 'react';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import { Input, Button, Navbar, NavbarBrand } from 'reactstrap';
import platform from 'platform';
import canvasToImage from 'canvas-to-image';
import 'bootstrap';
import 'react-resizable/css/styles.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.css';
import classnames from 'classnames';

import logo from './logo.png';
import './App.css';
import { readFile, readImage } from './file';
import drawTrapezoid from './drawTrapezoid';

const baseSize = 325;
const { min, max } = Math;
const elPath = (el) => {
  return el.parentNode ? [el, ...elPath(el.parentNode)] : [el];
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      name: '西脇 太郎',
      mode: 'initial',
      rotationIndex: 0,
    };
  }
  componentDidMount() {
    this.loadLogo();
    this.createNameImage();
  }
  async loadLogo() {
    this.setState({ logo: await readImage(logo) });
  }
  componentDidUpdate(prevProps, prevState) {
    if(prevState.logo !== this.state.logo) {
      this.drawCanvas();
    }
    if(prevState.width !== this.state.width || prevState.height !== this.state.height) {
      this.drawInteractCanvas();
      this.drawCanvas();
    }
    if(prevState.x !== this.state.x || prevState.y !== this.state.y) {
      this.drawCanvas();
    }
    if(prevState.name !== this.state.name) {
      this.createNameImage();
    }
    if(prevState.nameImage !== this.state.nameImage) {
      this.drawCanvas();
    }
    if(prevState.photo !== this.state.photo || prevState.rotationIndex !== this.state.rotationIndex) {
      this.setRotatedImage();
    }
    if(prevState.rotatedImage !== this.state.rotatedImage) {
      this.setSize();
      this.drawInteractCanvas();
      this.drawCanvas();
    }
  }
  // NOTE: files: [file] をするとIEで動かない
  onSelectFile = async ({ target: { files = [] } }) => {
    const [file] = Array.from(files);
    if (!file) return;
    const imageUrl = await readFile(file, 'readAsDataURL');
    const photo = await readImage(imageUrl);
    this.setState({ photo });
  }
  setSize() {
    const { rotatedImage } = this.state;
    if (!rotatedImage) return;
    const { width, height } = rotatedImage;
    const rate = min(1, baseSize / max(width, height))
    this.setState({ width: width * rate, height: height * rate });
  }
  async setRotatedImage() {
    const { photo, rotationIndex } = this.state;
    if (!photo) return;
    const canvas = document.createElement('canvas');
    const isOdd = rotationIndex % 2 === 1;
    const index = rotationIndex % 4;
    const w = photo[isOdd ? 'height' : 'width'];
    const h = photo[isOdd ? 'width' : 'height'];
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const params =
      (()=> {
        switch (index) {
          case 0: return [0, 0]
          case 1: return [w, 0]
          case 2: return [w, h]
          case 3: return [0, h]
          default: console.log('Wrong index: ' + index)
        }
      })()
    ctx.translate(...params);
    ctx.rotate(Math.PI * (90 * index) / 180);
    ctx.drawImage(photo, 0, 0, photo.width, photo.height);
    const url = canvas.toDataURL();
    const image = await readImage(url);
    this.setState({ rotatedImage: image });
  }
  drawCanvas() {
    this.clear()
    this.drawRotatedImage();
    this.drawLogo();
    this.drawTextImage();
  }
  clear() {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, baseSize, baseSize);
  }
  rotate = () => {
    this.setState({ rotationIndex: this.state.rotationIndex + 1 });
  }
  drawRotatedImage() {
    const { rotatedImage, x = 0, y = 0, width = 0, height = 0 } = this.state;
    if (!rotatedImage) return;
    const offsetRate = 0.15;
    const offset = baseSize * offsetRate;
    const maskSize = baseSize - offset * 2;
    const ctx = this.canvas.getContext('2d');
    ctx.save();
    ctx.beginPath();
    ctx.rect(offset, offset, maskSize, maskSize);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(rotatedImage, x, y, width, height);
    ctx.restore();
  }
  drawInteractCanvas() {
    const { rotatedImage, width = 0, height = 0 } = this.state;
    if (!rotatedImage) return;
    const ctx = this.interactCanvas.getContext('2d');
    ctx.drawImage(rotatedImage, 0, 0, width, height)
  }
  drawLogo() {
    const { logo } = this.state;
    if(!logo) return;
    const ctx = this.canvas.getContext('2d');
    ctx.drawImage(logo, 0, 0, baseSize, baseSize);
  }
  onDrag = (event, { x, y }) => {
    if(elPath(event.target).some(_ => _.className === 'react-resizable-handle')) return false;
    this.setState({ x, y });
  }
  onResize = (_, { size: { width, height } }) => {
    this.setState({ width, height });
  }
  onChangeText = (propName, { target: { value } }) => {
    this.setState({ [propName]: value });
  }
  async createNameImage() {
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
    this.setState({ nameImage: image });
  }
  drawTextImage() {
    const { nameImage } = this.state;
    if(!nameImage) return;
    const ctx = this.canvas.getContext('2d');
    const x = baseSize * 0.68;
    const y = baseSize * 0.48;
    const w = nameImage.width;
    const h = nameImage.height;
    ctx.translate(x, y);
    ctx.translate(w / 2, h / 2);
    ctx.rotate(18 * Math.PI / 180);
    ctx.translate(- w / 2, - h / 2);
    drawTrapezoid(ctx, nameImage, 50);
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
  toggleMode = () => {
    const { mode } = this.state;
    this.setState({ mode: ({ initial: 'editing', editing: 'initial' })[mode] });
  }
  onClickInputLabel = () => this.fileInput.click()
  render() {
    const { width = 0, height = 0, name, mode, photo } = this.state;
    const isMobile = ['Android', 'iOS', 'Windows Phone'].includes(platform.os.family);
    return (
      <div className={classnames('app', { 'with-photo': !!photo, mobile: isMobile, editing: mode === 'editing' })}>
        <div>
          <Navbar color="navbar" light expand="md">
            <div className="logo-wrapper"><img src="/logo.png" height="35" width="35" alt="西脇市ロゴ" /></div> 
            <NavbarBrand>
              ニシワキ ロゴメーカー
            </NavbarBrand>
          </Navbar>
        </div>
        <div style={{ width: 375, margin: 'auto', padding: '0 10px' }}>
          <div className="text-center">
            <h3 className="description">西脇市のロゴを使って、あなただけのアイコン画像を作成します。</h3>
            <div className="movie-help">
              <a href="https://youtu.be/R8PkcZtWeks" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-youtube" aria-hidden="true"></i>&nbsp;動画で使い方を見る
              </a>
            </div>

          </div>
          {
            isMobile && photo && (
              <div>
                <div className="d-flex justify-content-end">
                  <Button color="link" className="btn-help-modal" data-toggle="modal" data-target="#helpModal">
                    <i className="fas fa-question-circle"></i>
                    操作方法
                  </Button>
                  <div className="modal fade modal-help" id="helpModal" tabIndex="-1" role="dialog" aria-labelledby="helpModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title" id="helpModalLabel">操作方法と注意事項</h5>
                          <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                          </button>
                        </div>
                        <div className="modal-body">
                          <ul>
                            <li>
                               <i className="fas fa-crop-alt" aria-hidden="true"></i>
                               をタップで画像編集モード開始
                            </li>
                            <li>
                              画像編集モードでは以下のことができます
                              <ul>
                                 <li>画像の中心付近をドラッグで位置調整</li>
                                 <li>画像の右下をドラッグで拡大縮小</li>
                                 <li>
                                    <i className="fas fa-redo" aria-hidden="true"></i>
                                    をタップで90度右回転
                                 </li>
                              </ul>
                            </li>
                            <li>
                              <i className="fas fa-crop-alt crop-icon editing" aria-hidden="true"></i>
                              をタップで画像編集モード終了
                            </li>
                            <li>他のアプリ内（LINE等）で開いた場合は、SafariやChromeなどのブラウザで開き直してください。</li>
                            <li>
                              Androidは
                              <a href="https://play.google.com/store/apps/details?id=com.android.chrome&amp;hl=ja" target="_blank" rel="noopener noreferrer">Chromeブラウザ</a>
                              の利用を推奨します。</li>
                          </ul>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn btn-secondary" data-dismiss="modal">閉じる</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex text-primary justify-content-end">
                  {
                    mode === 'editing' && (
                      <span className="fas fa-redo mr-2 cursor-pointer" onClick={this.rotate} />
                    )
                  }
                  <span className={classnames('fas fa-crop-alt crop-icon cursor-pointer', [mode])}  onClick={this.toggleMode} />
                </div>
              </div>
            )
          }
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
              {
                !photo && (
                  <div className="image-selector d-flex align-items-center justify-content-center">
                    <Button color="primary" outline size="sm" onClick={this.onClickInputLabel}>
                      <label className="m-0 cursor-pointer">
                        画像選択
                      </label>
                    </Button>
                    <input ref={_ => this.fileInput = _} type="file" className="d-none" onChange={this.onSelectFile} accept="image/*" />
                  </div>
                )
              }
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="input-name">おなまえ</label>
            <Input value={name} onChange={this.onChangeText.bind(this, 'name')} className="form-control" id="input-name"/>
          </div>
          <div>
            <Button size="lg" block color="primary" onClick={this.download}>
              <i className="fas fa-download" aria-hidden="true"></i>&nbsp;画像をダウンロード！
            </Button>
          </div>
          <div className="text-center">
            <div className="inquiry">
              お問合せ先：<a href="https://www.city.nishiwaki.lg.jp/form/inquiryPC/Init.do?inquiryId=2&amp;ref=www.city.nishiwaki.lg.jp%2Fkakukanogoannai%2Ftoshikeieibu%2Fjisedaisouseika%2Findex.html" target="_blank" rel="noopener noreferrer">西脇市役所次世代創生課</a>
            </div>
            <div className="source-code">
              <a href="https://github.com/JunichiIto/nishiwaki-logo-maker-react" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-github" aria-hidden="true"></i>&nbsp;JunichiIto/nishiwaki-logo-maker-react
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
