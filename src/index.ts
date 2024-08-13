import "./assets/main.scss";
import { TileMap } from "./game/map";
import { ClickControlComponent, ResizeControlComponent } from "./lib/components";
import { IRenderComponent, IVec } from "./lib/contracts";
import { ComponentBaseEntity } from "./lib/entities";
import { GameState, Scene } from "./lib/gameState";
import { isInView, overriteOnScreen } from "./lib/utils";


export const mainScene = () => {
    return new Scene(
        async (gs: GameState, scene): Promise<{ gs: GameState; scene: Scene }> =>
            new Promise(resolve => {
                const { gl } = gs;
                const map = new TileMap(gs);

                scene.addEntity(map);

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

                    toRender.forEach(e => e.render(t, [cx, cy]));
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
        stage.canvas.width = vw;
        stage.canvas.height = vh - 200;
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



(async () => {
    const gs = new GameState();


    gs.status = "running";
    gs.scene = mainScene();

    // Global entities
    gs.addEntity(new Controller(gs));

    gs.addEntity(new ResizeController(gs));
    await gs.runScene();
    console.log("Game Over");
})();
