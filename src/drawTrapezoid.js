// TODO: リファクタ
export default function drawTrapezoid(ctx, img, factor) {
  var w = img.width
  var h = img.height
  var x = 0
  var startPoint = h * 0.5 * (factor*0.01)
  for(; x < w; x++) {
    // get x position based on line (y)
    var yi = (1 - x / w) * startPoint
    // draw the slice
    ctx.drawImage(img, x, 0, 1, h, // source line
                   x, yi, 1, h - yi * 2); // output line
  }
}

