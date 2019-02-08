export function readFile(file, type = 'readAsText') {
  const reader = new FileReader();
  reader[type](file);
  return new Promise((resolve) => {
    reader.addEventListener('load', _ => resolve(_.target.result));
  });
}

export function readImage(imageUrl) {
  if (!imageUrl) return;
  const image = new Image()
  image.src = imageUrl;
  return new Promise((resolve) => {
    image.addEventListener('load', _ => resolve(image));
  });
}
