import "./assets/main.scss";
import { TileMap } from "./game/map";
import { ClickControlComponent, CountDownComponent, ImgRenderComponent, ResizeControlComponent, TiledPositionComponent } from "./lib/components";
import { IComponent, IRenderComponent, IVec, RenderFn } from "./lib/contracts";
import { ComponentBaseEntity } from "./lib/entities";
import { GameState, Scene } from "./lib/gameState";
import { preRender } from "./lib/rendering";
import { isInView, nullOrUndefined, overriteOnScreen } from "./lib/utils";


export const mainScene = () => {
    return new Scene(
        async (gs: GameState, scene): Promise<{ gs: GameState; scene: Scene }> =>
            new Promise(resolve => {
                const { gl } = gs;
                const map = new TileMap(gs, [30, 20], [32, 32]);
                scene.addEntity(map);

                const player = new Player(gs, 0, map);
                scene.addEntity(player);

                gl.onUpdate(delta => {
                    gs.getEntities()
                        .filter(e => typeof e.update === "function")
                        .forEach(e => e?.update(delta, gs));

                    if (gs.status !== "running") return;
                });

                gl.onRender(t => {
                    const [x, y] = [0, 0];
                    const cx = gs.stage.canvas.width / 2 - x;
                    const cy = gs.stage.canvas.height / 2 - y;

                    scene.cameraPos = [cx, cy];
                    let toRender = scene.getEntities().filter(e => {
                        if (!e.components["rnd"]) return false;
                        return isInView(e, [cx, cy], gs.stage.canvas);
                    });

                    toRender.sort(
                        (a, b) =>
                            b.getComponent<IRenderComponent>("rnd").renderPriority -
                            a.getComponent<IRenderComponent>("rnd").renderPriority
                    );

                    toRender.forEach(e => e.render(t, [x, y]));
                });
                gl.start();
            })
    );
};

class ResizeController extends ComponentBaseEntity {
    gs: GameState;

    constructor(gs: GameState) {
        const { stage } = gs;
        super(stage, []);

        const resizeHandler = () => {
            let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
            let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
            // stage.canvas.width = vw;
            // stage.canvas.height = vh - 200;
            overriteOnScreen(`Updated size vw: ${vw} vh: ${vh}`);
        }
        this.addComponent(new ResizeControlComponent(resizeHandler))
    }
}

class Controller extends ComponentBaseEntity {
    gs: GameState;

    clickPosition: IVec | null = null;

    constructor(gs: GameState) {

        const { stage } = gs;
        super(stage, []);
        this.ID = "controller";


        const clickHandler = (e: MouseEvent) => {
            const offset = gs.stage.canvas.getClientRects()[0];
            this.clickPosition = [e.clientX - offset.left, e.clientY - offset.top];
        }

        this.addComponent(new ClickControlComponent(clickHandler));
    }
}

const renderPlayer: RenderFn = (ctx, pos) => {
    ctx.fillStyle = "tomato";
    ctx.beginPath();
    ctx.arc(pos[0], pos[1], 10, 0, Math.PI * 2);
    ctx.closePath();

    ctx.fill();
};

const cDistance = (a: IVec, b: IVec) => {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

const getNeighbors = (node: IVec, board: IVec[][]) => {
    const [x, y] = node,
        width = board.length,
        height = board[0].length,
        neighbors = [
            [x - 1, y],
            [x + 1, y],
            [x, y - 1],
            [x, y + 1]
        ];

    return neighbors.filter(([nx, ny]) => nx >= 0 && nx < width && ny >= 0 && ny < height)
};

const planTrip = (start: number, end: number, map: TileMap) => {
    let queue = [],
        board = [],
        endCoords: IVec = [end % map.width, Math.floor(end / map.width)];


    for (let i = 0; i < map.width; i++) {
        board[i] = []
        for (let j = 0; j < map.height; j++) {
            const node = {
                target: false,
                visited: false,
                start: false,
                index: j * map.width + i,
                distance: cDistance([i, j], endCoords),
                cost: 0,
                coords: [i, j]
            }

            if (node.index === start) {
                node.start = true;
                queue.push([i, j]);
            }


            if (node.index === end)
                node.target = true;
            board[i][j] = node;
        }
    }

    while (queue.length > 0) {
        const [x, y] = queue.shift() as [number, number];
        const node = board[x][y];


        if (node.target) break;

        if (node.visited) continue;

        node.visited = true;

        const neighbors = getNeighbors([x, y], board);

        neighbors.forEach(([nx, ny]) => {
            const neighbor = board[nx][ny];
            if (neighbor.visited) {
                return;
            }
            neighbor.cost = node.cost + 1;

            queue.push([nx, ny]);
        });

        queue.sort((a, b) => board[a[0]][a[1]].distance - board[b[0]][b[1]].distance);
    }

    const reversePath = (currentNode, path, nodes) => {
        path.push(currentNode.index);
        if (currentNode.start) {
            return path;
        }

        const neighbors = getNeighbors(currentNode.coords, board);

        for (let i = 0; i < neighbors.length; i++) {
            const [nx, ny] = neighbors[i];
            // TODO - Bug when changing to target while navigating
            const neighbor = nodes[nx][ny];
            if (neighbor.cost === currentNode.cost - 1) {
                return reversePath(neighbor, path, nodes);
            }
        }
    }

    return reversePath(board[endCoords[0]][endCoords[1]], [], board);
}

class MovementComponent implements IComponent {
    type: string;

    currentTile: number | null = null;
    path: number[] = [];
    entity: ComponentBaseEntity | null = null;

    constructor() {
        this.type = "behv";
    }

    onInit(e: ComponentBaseEntity): void {
        this.entity = e;
    }

    planPath(selected, map) {
        let path = planTrip(this.currentTile, selected, map)?.reverse()
        if (path === undefined) return;
        path = [...new Set(path)];
        
        path.shift();
        this.path = path ?? [];
    }

    onUpdate(e: ComponentBaseEntity, delta: number, gs?: GameState): void {
        const tile = e.getComponent<TiledPositionComponent>("pos").tile;
        const player = e as Player;
        if (nullOrUndefined(tile)) return;
        if (player.getPath().length === 0) player.action = "idle";
        this.currentTile = tile;
        const map = gs.scene.getEntity("map") as TileMap | null;
        if (!map) return;

        const selected = map.selectedBlocks();

        if (!nullOrUndefined(selected) && tile === selected) {
            map.clearSelection();
            return;
        };

        const action = (this.entity as Player).action;
        if (!nullOrUndefined(selected) && (this.path.length === 0 || this.path[this.path.length - 1] !== selected)) {
            this.planPath(selected, map);
        } else if(this.path.length > 0 && action === "moving") {
            const countDown = this.entity.getComponent<CountDownComponent>("ctd");
            if (countDown && !countDown.running) {
                countDown.running = true;
            }
            if (countDown && countDown.time <= 0) {
                const next = this.path.shift();
                // console.log("Moving to", next);
                this.entity.getComponent<TiledPositionComponent>("pos").tile = next;
                countDown.reset()
            }
        }
    }

    // onUpdate(e: ComponentBaseEntity, delta: number, gs: GameState): void {
    //     throw new Error("Method not implemented.");
    // }
    // onTerminate(e: ComponentBaseEntity): void {
    //     throw new Error("Method not implemented.");
    // }
    // onRender(e: ComponentBaseEntity, delta: number, c: IVec): void {
    //     throw new Error("Method not implemented.");
    // }
}



class Player extends ComponentBaseEntity {
    gs: GameState;
    action: string = "idle";
    constructor(gs: GameState, pos: number, map: TileMap) {
        const { stage } = gs;
        super(stage, []);
        this.gs = gs;
        this.ID = "player";
        this.addComponent(new TiledPositionComponent(pos, [20, 20], map));
        this.addComponent(new ImgRenderComponent(preRender([20, 20], renderPlayer)));
        this.addComponent(new MovementComponent());
        this.addComponent(new CountDownComponent(200, 0));
    }

    getPath() {
        return this.getComponent<MovementComponent>("behv").path;
    }
}

(async () => {
    const gs = new GameState();


    gs.status = "running";
    gs.scene = mainScene();

    // Global entities
    gs.addEntity(new Controller(gs));

    gs.addEntity(new ResizeController(gs));
    await gs.runScene();
    // console.log("Game Over");
})();
