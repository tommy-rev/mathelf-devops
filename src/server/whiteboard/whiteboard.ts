import * as Fabric from 'fabric';
const fabric = (Fabric as any).fabric as typeof Fabric;

import { Canvas } from 'fabric';
const { createCanvasForNode } = fabric;

import { BlazeDataRetriever } from './data-retriever';
// import Paths from './paths';

export class Whiteboard {
    private dataRetriever: BlazeDataRetriever;

    private canvas: Canvas;

    constructor(dataRetriever: BlazeDataRetriever) {
        this.dataRetriever = dataRetriever;

        // TODO: use whiteboard dimensions
        this.canvas = createCanvasForNode(200, 200);
        this.canvas.setBackgroundColor('rgba(50, 205, 50, 1.0)', () => this.canvas.renderAll());
    }
}
