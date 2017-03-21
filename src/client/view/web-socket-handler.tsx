import * as React from 'react';

export default class WebSocketHandler extends React.Component<{}, {}> {
    private socket: WebSocket;

    componentDidMount() {
        this.socket = new WebSocket('ws://localhost:8081');

        this.socket.onmessage = (ev: MessageEvent) => {
            // const action = JSON.parse(ev.data);
        };
    }

    render() {
        return null;
    }
}
