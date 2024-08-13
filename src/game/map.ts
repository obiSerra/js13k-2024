import { CompositImgRenderComponent, PositionComponent } from "../lib/components";
import { IVec, RenderFn } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { GameState } from "../lib/gameState";
import { preRender } from "../lib/rendering";


const tileBlock: (color: string, stroke?: string | null, size?: IVec) => RenderFn =
    (color, stroke, size = [32, 32]) =>
        (ctx) => {
            ctx.fillStyle = color;
            if (stroke) ctx.strokeStyle = stroke;
            ctx.beginPath();
            ctx.rect(0, 0, size[0], size[1]);
            ctx.closePath();

            ctx.fill();
            if (stroke) ctx.stroke();
        };

export class TileMap extends ComponentBaseEntity {
    gs: GameState;

    width: number;
    height: number;

    tileWidth: number;
    tileHeight: number;

    blocks: any;
    selectedImg: any;
    images: any;

    constructor(gs: GameState) {
        const { stage } = gs;
        super(stage, []);
        this.gs = gs;

        this.tileWidth = 64;
        this.tileHeight = 64;
        const sz: IVec = [this.tileWidth, this.tileHeight];
        this.selectedImg = preRender(sz, tileBlock("red", null, sz));

        this.width = 20;
        this.height = 20;

        this.blocks = [];

        this.images = [preRender(sz, tileBlock("white", null, sz)), preRender(sz, tileBlock("black", null, sz))];

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.blocks.push({
                    img: [this.images[(y + x) % 2], [y * this.tileWidth, x * this.tileHeight]],
                    selected: false
                });
            }
        }

        const renderer = new CompositImgRenderComponent(this.blocks.map((b: any) => b.img));

        this.addComponent(renderer);
        this.addComponent(new PositionComponent([0, 0]));
    }

    _findBlock(x: number, y: number) {
        const blockX = Math.floor(y / this.tileWidth);
        const blockY = Math.floor(x / this.tileHeight);
        return blockX + blockY * this.width;
    }

    onUpdateStart(d: number, gs: GameState): void {
        const contoller = this.gs?.getEntity("controller"),
            clicked = contoller?.clickPosition;
        if (clicked) {
            const [x, y] = clicked;
            const block = this._findBlock(x, y);


            this.blocks.map((b: any, i: number) => {
                if (b.selected) {
                    b.selected = false;
                }
                return b
            })

            this.blocks[block].selected = !this.blocks[block].selected;
            contoller.clickPosition = null;
            const renderer = new CompositImgRenderComponent(this.blocks.map((b: any) =>b.selected ? [this.selectedImg, b.img[1]] : b.img));
            this.replaceComponent(renderer);

        }
    }
}