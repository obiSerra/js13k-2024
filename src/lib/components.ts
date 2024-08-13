import { IComponent, IVec, ComponentType, Sprite, IStage, ImgWithPosition } from "./contracts";
import { ComponentBaseEntity } from "./entities";
import { GameState } from "./gameState";
import { pXs, sumVec } from "./utils";

export class StaticPositionComponent implements IComponent {
    type: ComponentType;
    p: IVec;
    direction: number;
    constructor(p: IVec, v: IVec = [0, 0]) {
        this.type = "pos";
        this.p = p;
        this.direction = 1;
    }
}

export class PositionComponent implements IComponent {
    type: "pos";
    p: IVec;
    v: IVec;
    a: IVec = [0, 0];
    maxA = [10, 10];
    lp: IVec;
    maxSpeed: IVec;
    direction: number;
    constructor(p: IVec, v: IVec = [0, 0], maxSpeed: IVec = [200, 200], direction = 1) {
        this.type = "pos";
        this.p = p;
        this.lp = p;
        this.v = v;
        this.direction = direction;
        this.maxSpeed = maxSpeed;
    }

    accelerate(acc: IVec) {
        this.a = sumVec(this.a, acc);
    }
    stopDir(dir: [boolean, boolean]) {
        this.a[0] = dir[0] ? 0 : this.a[0];
        this.a[1] = dir[1] ? 0 : this.a[1];
    }
    onUpdate(e: ComponentBaseEntity, delta: number, gs?: GameState): void {

        const maxSpeed = this.maxSpeed;
        let {
            p: [x, y],
            v: [vx, vy],
            a: [ax, ay]
        } = this;
        this.lp[0] = x;
        this.lp[1] = y;

        // Apply movement
        vx += ax;
        vy += ay;

        vx = Math.abs(vx) > maxSpeed[0] ? maxSpeed[0] * Math.sign(vx) : vx;
        vy = Math.abs(vy) > maxSpeed[1] ? maxSpeed[1] * Math.sign(vy) : vy;

        let mvY = pXs(vy, delta);
        let mvX = pXs(vx, delta);


        this.a = [0, 0];

        this.v = [vx, vy];
        this.p = [x + mvX, y + mvY];
    }
}

export class SpriteRenderComponent implements IComponent {
    type: ComponentType;
    sprite: Sprite;

    imgPos: IVec = [0, 0];
    stage: IStage;
    time: number;
    currentFrame: number;
    cA: string;
    renderPriority: number;

    constructor(sprite: Sprite, defaultAnimation: string, renderPriority: number = 0) {
        this.type = "rnd";
        this.sprite = sprite;
        this.renderPriority = renderPriority;
        this.sAnim(defaultAnimation);
    }
    onInit(e: ComponentBaseEntity): void {
        this.stage = e.stage;
    }
    sAnim(animationName: string) {
        this.time = 0;
        this.currentFrame = 0;
        this.cA = animationName;
    }
    onRender(e: ComponentBaseEntity, t: number, c: IVec): void {
        const pos = e.getComponent<PositionComponent>("pos").p;
        if (!pos) throw new Error("PositionComponent not found");
        const [x, y] = pos;

        const an = this.sprite[this.cA];
        this.time += t;

        // if (!an) console.error(`Animation ${this.cA} not found`);

        if (this.time > an.changeTime) {
            this.time = 0;
            this.currentFrame = (this.currentFrame + 1) % an.frames.length;
        }
        const ctx = this.stage.ctx;
        ctx.beginPath();
        ctx.drawImage(
            an.frames[this.currentFrame],
            x + c[0] + this.imgPos[0],
            y + c[1] + this.imgPos[1],
            an.frames[this.currentFrame].width,
            an.frames[this.currentFrame].height
        );

        ctx.closePath();
    }
}

export class ImgRenderComponent implements IComponent {
    type: ComponentType;
    stage: IStage;
    image: HTMLImageElement;
    renderPriority: number;

    pos: IVec;

    constructor(image: HTMLImageElement, renderPriority: number = 99) {
        this.type = "rnd";
        this.image = image;
        this.renderPriority = renderPriority;
    }
    onInit(e: ComponentBaseEntity): void {
        this.stage = e.stage;
    }

    onRender(e: ComponentBaseEntity, delta: number, c: IVec): void {
        const pos = e.getComponent<PositionComponent>("pos").p;
        this.stage.ctx.drawImage(this.image, pos[0] + c[0], pos[1] + c[1]);
    }
}

export class CompositImgRenderComponent implements IComponent {
    type: ComponentType;
    stage: IStage;
    images: ImgWithPosition[];
    renderPriority: number;

    pos: IVec;

    constructor(images: ImgWithPosition[], renderPriority: number = 99) {
        this.type = "rnd";
        this.images = images;
        this.renderPriority = renderPriority;
    }
    onInit(e: ComponentBaseEntity): void {
        this.stage = e.stage;
    }

    onRender(e: ComponentBaseEntity, delta: number, c: IVec): void {
        const pos = e.getComponent<PositionComponent>("pos").p;
        this.images.forEach(i => {
            this.stage.ctx.drawImage(i[0], pos[0] + i[1][0], pos[1] + i[1][1]);
        });

    }
}

export class MenuComponent implements IComponent {
    type: ComponentType;
    selector: string;

    el: HTMLElement;
    behavior: { [key: string]: { cb: (e: Event) => void; t: string } } = {};
    removers: { [key: string]: { cb: (e: Event) => void; t: string } } = {};

    constructor(selector: string) {
        this.type = "menu";
        this.selector = selector;
        this.el = document.querySelector(selector);
    }
    addListener(sel: string, cb: (e: Event) => void, eventType: string = "click") {
        this.behavior[sel] = { cb, t: eventType };
    }
    onInit(e: ComponentBaseEntity): void {
        for (let k of Object.keys(this.behavior)) {
            const el = this.el.querySelector(k);
            const b = this.behavior[k];
            if (!el) continue;
            el.addEventListener(b.t, b.cb);
        }
        this.show();
    }

    show() {
        this.el.classList.remove("h");
    }
    hide() {
        this.el.classList.add("h");
    }
    onTerminate(): void {
        this.hide();
    }
}

export class HTMLComponent implements IComponent {
    type: ComponentType;
    selector: string;
    el: HTMLElement;

    constructor(selector: string) {
        this.type = "html";
        this.selector = selector;
    }
    onInit(e: ComponentBaseEntity): void {
        this.el = document.querySelector(this.selector);
        if (!this.el) throw new Error(`Element ${this.selector} not found`);
    }
    show() {
        this.el.classList.remove("h");
    }
    hide() {
        this.el.classList.add("h");
    }
}

type EvtListeners = { [k: string]: (e: KeyboardEvent) => void };

export class KeyboardControlComponent implements IComponent {
    type: ComponentType;
    downListener: EvtListeners;
    upListener: EvtListeners;
    constructor(downEvtLst: EvtListeners = {}, upEvtLst: EvtListeners = {}) {
        this.type = "ctl";
        this.downListener = downEvtLst;
        this.upListener = upEvtLst;
    }
    onInit(e: ComponentBaseEntity): void {
        document.addEventListener("keydown", e => {
            for (let k of Object.keys(this.downListener)) {
                if (k === e.key) this.downListener[k](e);
            }
        });
        document.addEventListener("keyup", e => {
            for (let k of Object.keys(this.upListener)) {
                if (k === e.key) this.upListener[k](e);
            }
        });
    }
}

export class ClickControlComponent implements IComponent {
    type: ComponentType;
    clickListener: (e: MouseEvent) => void;
    constructor(clickListener: (e: MouseEvent) => void) {
        this.type = "ctl";
        this.clickListener = clickListener;
    }
    onInit(e: ComponentBaseEntity): void {
        e.stage.canvas.addEventListener("click", this.clickListener);
    }
}
