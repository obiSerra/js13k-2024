import { CompositImgRenderComponent, StaticPositionComponent } from "../lib/components";
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


// TODO - pregenearte the whole map
// TODO - generate selected with overlay
export class TileMap extends ComponentBaseEntity {
    gs: GameState;

    width: number;
    height: number;

    tileWidth: number;
    tileHeight: number;

    tiles: any;
    selectedImg: any;
    images: any;

    constructor(gs: GameState, size: IVec = [20, 20], tileSizes: IVec = [64, 64]) {
        const { stage } = gs;
        super(stage, []);
        this.gs = gs;
        this.ID = "map";

        this.tileWidth = tileSizes[0];
        this.tileHeight = tileSizes[1];
        const sz: IVec = [this.tileWidth, this.tileHeight];
        this.selectedImg = preRender(sz, tileBlock("red", null, sz));

        this.width = size[0];
        this.height = size[1];

        this.tiles = [];

        this.images = [
            preRender(sz, tileBlock("white", "gray", sz)),
            preRender(sz, tileBlock("white", "gray", sz))
        ];

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.tiles.push({
                    img: [this.images[(y + x) % 2], [x * this.tileWidth, y * this.tileHeight]],
                    selected: false
                });
            }
        }

        const renderer = new CompositImgRenderComponent(this.tiles.map((b: any) => b.img));

        this.addComponent(renderer);
        this.addComponent(new StaticPositionComponent([0, 0]));
    }
    selectedBlocks() {
        for (let i = 0; i < this.tiles.length; i++) {
            if (this.tiles[i].selected) return i;
        }
        return null;
    }
    findBlock(x: number, y: number) {
        const blockX = Math.floor(x / this.tileWidth);
        const blockY = Math.floor(y / this.tileHeight);
        return blockX + blockY * this.width;
    }

    clearSelection() {
        this.tiles = this.tiles.map((b: any, i: number) => {
            if (b.selected) {
                b.selected = false;
            }
            return b
        })
        // TODO - Optimize render updates
        const renderer = new CompositImgRenderComponent(this.tiles.map((b: any) => b.selected ? [this.selectedImg, b.img[1]] : b.img));
        this.replaceComponent(renderer);
    }

    blockPos(block: number) {
        const x = block % this.width;
        const y = Math.floor(block / this.width);
        return [x * this.tileWidth, y * this.tileHeight];
    }

    blockCenter(block: number) {
        const [x, y] = this.blockPos(block);
        return [x + this.tileWidth / 2, y + this.tileHeight / 2];
    }

    onUpdateStart(d: number, gs: GameState): void {
        const contoller = this.gs?.getEntity("controller"),
            clicked = contoller?.clickPosition;
        if (clicked) {
            const [x, y] = clicked;
            const block = this.findBlock(x, y);
            this.clearSelection()
            this.tiles[block].selected = !this.tiles[block].selected;
            contoller.clickPosition = null;
            const renderer = new CompositImgRenderComponent(this.tiles.map((b: any) => b.selected ? [this.selectedImg, b.img[1]] : b.img));
            this.replaceComponent(renderer);

        }
    }
}