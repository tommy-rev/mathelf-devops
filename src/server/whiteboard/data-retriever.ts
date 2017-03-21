import 'rxjs/add/operator/map';
import 'rxjs/add/operator/scan';
import { Observable } from 'rxjs/Observable';

import { TreeDatabase } from '../blaze/tree-database';
import { TreeDataEvent, TreeDataEventType } from '../blaze/tree-data-event';

export type PageData = {
    pageId: string;
    paperType: number;
};

export interface WhiteboardData {
    pages: { [key: string]: PageData };
    canvasWidth: number;
    canvasHeight: number;
}

export interface DrawableData {
    type: string;
}

export interface PathData extends DrawableData {
    isEraser: boolean;
    penType: number;
    strokeColor: string;
    strokeOpacity: number;
    strokeWidth: number;
    d3: string;
}

export interface DataRetriever {
    getWhiteboard: (id: string) => Promise<WhiteboardData>;
    listenForDrawables: (pageId: string) => Observable<DrawableData>;
    listenForPages: () => Observable<PageData[]>;
}

export class BlazeDataRetriever implements DataRetriever {
    private blazeDb: TreeDatabase;

    constructor(blazeDb: TreeDatabase) {
        this.blazeDb = blazeDb;
    }

    getWhiteboard(): Promise<WhiteboardData> {
        return this.blazeDb.reference('whiteboard').getValue();
    }

    listenForDrawables(pageId: string): Observable<DrawableData> {
        return this.blazeDb.reference(`drawablesData/${pageId}`)
            .changes(new Set([TreeDataEventType.ChildAdded, TreeDataEventType.ChildChanged]))
            .filter((event: TreeDataEvent) => event.value.hasChild('d3') || event.value.hasChild('imageURL'))
            .map((event: TreeDataEvent) => {
                const drawable = event.value.toJSON() as { [key: string]: any };
                drawable['.key'] = event.value.key;
                return drawable as DrawableData;
            });
    }

    listenForPages(): Observable<PageData[]> {
        return this.blazeDb.reference('whiteboard/pages')
            .changes(new Set([TreeDataEventType.ChildAdded]))
            .scan((acc: PageData[], event: TreeDataEvent): PageData[] => {
                const page = event.value.toJSON() as PageData;
                page.pageId = event.value.key;

                acc.push(page);
                return acc;
            }, [] as PageData[]);
    }
}
