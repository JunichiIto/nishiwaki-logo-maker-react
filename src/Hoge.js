const baseSize = 425

Polymer({
  is: "nishiwaki-logo-composer",
  properties: {
    isMobile: { value: false },
    isUploadingFile: { value: false },
    logo: { value: null },
    file: { value: null },
    imageUrl: { value: null },
    originalImage: { value: null },
    rotatedImage: { value: null },
    image: { value: null },
    textImage: { value: null },
    text: {
      value: "西脇 太郎"
    },
    isDragging: {
      value: false
    },
    scale: {
      value: 1
    },
    rotationIndex: { value: 0 },
    x: { value: 0 },
    y: { value: 0 },
    w: { value: 0 },
    h: { value: 0 },
    scale: { value: 1 },
  },
  observers: [
    "drawLogo(ctx, logo)",
    "setImageUrl(file)",
    "setOriginalImage(imageUrl)",
    "setRotatedImage(originalImage, rotationIndex)",
    "setHandleSize(rotatedImage)",
    "drawInteractCanvas(rotatedImage, w, h)",
    "render(ctx, logo, rotatedImage, text, x, y, w, h)",
    "drawText(ctx, textImage)"
  ],
  rotate() {
    this.set("rotationIndex", this.rotationIndex + 1)
  },
  attached() {
    this.setMobile()
    this.listenResize()
    this.resize()
    this.setLogo()
    this.setCtx()
  },
  setMobile() {
    this.set("isMobile", ["Android", "iOS", "Windows Phone"].indexOf(platform.os.family) >= 0)
    if (this.isMobile) this.classList.add("mobile")
  },
  listenResize() {
    window.addEventListener("resize", this.resize.bind(this))
  },
  resize() {
    const {min} = Math
    const scale = min(1, this.parentNode.clientWidth / baseSize)
    this.set("scale", scale)
    this.style.transform = `scale(${scale})`
  },
  setCtx() {
    const {$: {canvas}} = this
    const ctx = canvas.getContext("2d")
    this.set("ctx", ctx)
  },
  clear() {
    this.ctx.clearRect(0, 0, baseSize, baseSize)
  },
  setHandleSize(rotatedImage) {
    if (!rotatedImage) return
    const {width, height} = rotatedImage
    const {min, max} = Math
    const rate = min(1, baseSize / max(width, height))
    this.set("w", width * rate)
    this.set("h", height * rate)
  },
  drawInteractCanvas(rotatedImage, w, h) {
    if (!rotatedImage) return
    const {interactCanvas} = this.$
    const ctx = interactCanvas.getContext("2d")
    ctx.drawImage(rotatedImage, 0, 0, w, h)
  },
  render(ctx, logo, rotatedImage, text, x, y, w, h) {
    this.renderImage(ctx, logo, rotatedImage, x, y, w, h)
    var image = this.createTextImage(text)
    image.onload = ()=> {
      this.renderImage(ctx, logo, rotatedImage, x, y, w, h)
      this.set("textImage", image)
    }
  },
  renderImage(ctx, logo, rotatedImage, x, y, w, h) {
    this.clear()
    this.drawImage(rotatedImage, x, y, w, h)
    this.drawLogo(ctx, logo)
  },
  selectFile() {
    this.$.fileInput.inputElement.click()
  },
  onFileSelected({target: {files}}) {
    // NOTE: Safariとかやと、files: [file] とかすると files がイテレータブルじゃないからと言われて怒られる
    const file = files[0]
    this.set("isUploadingFile", true)
    this.set("file", file)
  },
  toggleEditorMode() {
    this.classList.toggle("editor-mode")
  },
  setImageUrl(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = ({target: {result}})=> {
      this.set("imageUrl", result)
    }
    reader.readAsDataURL(file)
  },
  setOriginalImage(imageUrl) {
    if (!imageUrl) return
    const image = new Image()
    image.onload = ()=> {
      this.set("originalImage", image)
    }
    image.src = imageUrl
  },
  setRotatedImage(originalImage, rotationIndex) {
    if (!originalImage) return
    const canvas = document.createElement("canvas")
    const isOdd = rotationIndex % 2 === 1
    const index = rotationIndex % 4
    const w = originalImage[isOdd ? "height" : "width"]
    const h = originalImage[isOdd ? "width" : "height"]
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    ctx.translate(...
      (()=> {
        switch (index) {
          case 0: return [0, 0]
          case 1: return [w, 0]
          case 2: return [w, h]
          case 3: return [0, h]
        }
      })()
    )
    ctx.rotate(Math.PI * (90 * index) / 180)
    ctx.drawImage(originalImage, 0, 0, originalImage.width, originalImage.height)
    const url = canvas.toDataURL()
    const image = new Image()
    image.src = url
    image.onload = ()=> {
      this.set("rotatedImage", image)
    }
  },
  drawImage(rotatedImage, x, y, w, h) {
    if (!rotatedImage) return
    const offsetRate = 0.15
    const offset = baseSize * offsetRate
    const maskSize = baseSize - offset * 2
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.rect(offset, offset, maskSize, maskSize)
    this.ctx.closePath()
    this.ctx.clip()
    this.ctx.drawImage(rotatedImage, x, y, w, h)
    this.ctx.restore()
  },
  setLogo(file) {
    const image = new Image()
    image.onload = ()=> {
      this.set("logo", image)
    }
    image.src = "./components/nishiwaki-logo-composer/logo.png"
  },
  drawLogo(ctx, logo) {
    if (!logo) return
    ctx.drawImage(logo, 0, 0, baseSize, baseSize)
  },
  createTextImage(text) {
    const canvas = document.createElement("canvas")
    const w = baseSize * 0.3
    const h = w * 0.8
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    ctx.font = `${h * 0.8}px Arial`
    ctx.fillText(text, 0, h * 0.8, w)
    const url = canvas.toDataURL()
    const image = new Image()
    image.src = url
    return image
  },
  drawText(ctx, textImage) {
    if (!textImage) return
    const x = baseSize * 0.68
    const y = baseSize * 0.48
    const w = textImage.width
    const h = textImage.height
    ctx.translate(x, y)
    ctx.translate(w / 2, h / 2)
    ctx.rotate(18 * Math.PI / 180)
    ctx.translate(- w / 2, - h / 2)
    drawTrapezoid(ctx, textImage, 50)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  },
  download() {
    if (platform.os.family === "Android") {
      const a = document.createElement("a")
      a.href = this.$.canvas.toDataURL()
      a.download = `西脇市ロゴ ${this.text}.png`
      a.style.display = "none"
      this.appendChild(a)
      a.click()
    }
    else {
      canvasToImage("canvas")
    }
  },
  onDragover(event) {
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = "copy"
  },
  onDrop(event) {
    event.preventDefault()
    event.stopPropagation()
    window.dataTransfer = event.dataTransfer
    const {dataTransfer: {files}} = event
    const file = files[0]
    this.set("file", file)
    this.set("isDragging", false)
  },
  setDragging(event) {
    event.preventDefault()
    event.stopPropagation()
    this.set("isDragging", true)
  },
  unsetDragging(event) {
    event.preventDefault()
    event.stopPropagation()
  },
  openHelp() {
    this.$.dialog.open()
  },
})
// TODO: リファクタ
function drawTrapezoid(ctx, img, factor) {
  var w = img.width
  var h = img.height
  var x = 0
  var startPoint = h * 0.5 * (factor*0.01)
  var startLine = 0
  for(; x < w; x++) {
    // get x position based on line (y)
    var yi = (1 - x / w) * startPoint
    // draw the slice
    ctx.drawImage(img, x, 0, 1, h, // source line
                   x, yi, 1, h - yi * 2); // output line
  }
}

