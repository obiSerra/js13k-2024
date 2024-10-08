import { IVec, ImagePxs, ImagePxsRaw, ImagePxsRawMap, RenderFn } from "./contracts";

// Pre-render a complex image inside a temporary canvas
export const preRender = (dim: IVec, renderFn: RenderFn) => {
  const prC = document.createElement("canvas");
  const [w, h] = dim;
  prC.width = w;
  prC.height = h;
  const ctx = prC.getContext("2d");
  renderFn(ctx, [prC.width / 2, prC.height / 2]);
  // Debugging prerender images
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  // ctx.strokeStyle = "lime";

  ctx.closePath();
  ctx.stroke();

  const imgSrc = prC.toDataURL("image/png");
  const img = document.createElement("img");
  img.src = imgSrc;
  return img;
};

export function genDrawCharacter(charGrid: (string | null)[][], px: number = 2) {
  const drawCharacter: RenderFn = (ctx, pos) => {
    let [xInit, yInit] = pos;
    xInit -= (charGrid[0].length * px) / 2;
    yInit -= (charGrid.length * px) / 2;
    for (let r = 0; r < charGrid.length; r++) {
      for (let c = 0; c < charGrid[r].length; c++) {
        if (charGrid[r][c] !== null) {
          const x = xInit + c * px;
          const y = yInit + r * px;
          ctx.beginPath();
          ctx.fillStyle = charGrid[r][c];
          ctx.fillRect(x, y, px, px);
          ctx.closePath();
        }
      }
    }
  };
  return drawCharacter;
}

export const hydrateImage = (images: ImagePxsRawMap, imageName): ImagePxs => {
  const image: ImagePxsRaw = images[imageName];
  const values = image.map(row => row.map(pixel => images.colors[pixel])) as ImagePxs;
  return values;
};
export function deepCopy<Type>(arg: Type): Type {
  return JSON.parse(JSON.stringify(arg));
}
export const flipImage = (image: ImagePxs): ImagePxs => deepCopy(image).map(row => row.reverse());


export const colorizeImages = (newColors: { [k: string]: string[] }, original: ImagePxsRawMap) => {
  let copy = deepCopy(original);

  copy.colors = [...original.colors, ...Object.keys(newColors)] as string[];

  for (let nC of Object.keys(newColors)) {
    for (let c of newColors[nC]) {
      const iC = copy.colors.indexOf(c);
      const inC = copy.colors.indexOf(nC);
      for (let k in copy) {
        if (k !== "colors") {
          copy[k] = copy[k].map(row => row.map(px => (px === iC ? inC : px)));
        }
      }
    }
  }
  return copy;
};
