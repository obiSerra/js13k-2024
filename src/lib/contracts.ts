import { ComponentBaseEntity } from "./entities";
import { GameState } from "./gameState";

export type IVec = [number, number];

export interface IComponent {
    type: string;
    onInit?(e: ComponentBaseEntity): void;
    onRender?(e: ComponentBaseEntity, delta: number, c: IVec): void;
    onUpdate?(e: ComponentBaseEntity, delta: number, gs?: GameState): void;
    onTerminate?(e: ComponentBaseEntity): void;
}

export interface IRenderComponent extends IComponent {
    renderPriority: number;
}

export interface IStage {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
}

export type RenderFn = (ctx: CanvasRenderingContext2D, pos: IVec) => void;

export type SpriteFrame = {
    frames: HTMLImageElement[];
    changeTime: number;
};

export type Sprite = {
    [key: string]: SpriteFrame;
};

export type ColorMap = { colors: (string | null)[] };
export type ImagePxsRaw = number[][];
export type ImagePxsRawMap = { [key: string]: ImagePxsRaw } | ColorMap;

export type ImagePxs = (string | null)[][];

export type ImgFnMap = { [key: string]: { d: IVec; f: RenderFn } };

export type ImgWithPosition = [HTMLImageElement, [number, number]];