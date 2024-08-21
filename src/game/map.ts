import { CompositImgRenderComponent, StaticPositionComponent } from "../lib/components";
import { ImgWithPosition, IVec, RenderFn } from "../lib/contracts";
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


type TileNode = {
    selected: boolean;
    img: ImgWithPosition;
}
// TODO - pregenearte the whole map
// TODO - generate selected with overlay




export class TileMap extends ComponentBaseEntity {
    gs: GameState;

    width: number;
    height: number;

    tileWidth: number;
    tileHeight: number;

    tiles: TileNode[];
    selectedImg: any;
    pathImage: any;
    image: any;

    constructor(gs: GameState, size: IVec = [20, 20], tileSizes: IVec = [64, 64]) {
        const { stage } = gs;
        super(stage, []);
        this.gs = gs;
        this.ID = "map";

        this.tileWidth = tileSizes[0];
        this.tileHeight = tileSizes[1];
        const sz: IVec = [this.tileWidth, this.tileHeight];
        this.selectedImg = preRender(sz, tileBlock("red", null, sz));
        this.pathImage = preRender(sz, tileBlock("green", null, sz));

        this.width = size[0];
        this.height = size[1];

        this.tiles = [];

        this.image = preRender(sz, tileBlock("white", "gray", sz));

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.tiles.push({
                    img: [this.image, [x * this.tileWidth, y * this.tileHeight]],
                    selected: false
                });
            }
        }

        const renderer = new CompositImgRenderComponent(this.tiles.map((b: any) => b.img));

        this.addComponent(renderer);
        this.addComponent(new StaticPositionComponent([0, 0]));

        this.addComponent(new CompositImgRenderComponent([], 0, "overlay"));
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
        // const renderer = new CompositImgRenderComponent(this.tiles.map((b: any) => b.selected ? [this.selectedImg, b.img[1]] : b.img));
        // this.replaceComponent(renderer);
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
        const player = this.gs?.getEntity("player");

        let tiles = [];

        if (clicked) {
            const [x, y] = clicked;
            const block = this.findBlock(x, y);
            if (block === this.selectedBlocks()) {
                this.gs.getEntity("player").action = "moving";
            } else {
                this.clearSelection()
                this.tiles[block].selected = !this.tiles[block].selected;
            }

            
            contoller.clickPosition = null;
        }

        tiles = [...tiles, ...this.tiles.filter(b => b.selected).map((b: TileNode) => {
            b.img = [this.selectedImg, b.img[1]];
            return b
        })];

        const path = player?.getPath();
        if (path.length) {
            tiles = [...tiles, ...this.tiles.filter((b, i) => path.includes(i) && !b.selected)
                .map((b: TileNode, i: number) => {
                    b.img = [this.pathImage, b.img[1]];
                    return b;
                })]
        }
        // TODO - Improve this
        const renderer = new CompositImgRenderComponent(tiles.map(b => b.img), 0, "overlay");
        this.replaceComponent(renderer);
    }
}