export interface Action<P> {
    type: string;
    payload: P;
}

export type Dispatch = (action: Action<any>) => Action<any>;

export type Middleware<Store> = (store: Store) => (next: Dispatch) => Dispatch;
