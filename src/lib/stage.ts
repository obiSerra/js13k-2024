import { IStage } from "./contracts";
import { d } from "./dom";
import { appendToConsole } from "./utils";

export class Stage implements IStage {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  constructor() {
    this.canvas = d.querySelector("#stage");

    this.ctx = this.canvas.getContext("2d");

    // TODO - move to a resize event and to utils
    let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    

    appendToConsole(`vw: ${vw} vh: ${vh}`);
    this.canvas.width = vw;
    this.canvas.height = vh - 200;
  }
}
