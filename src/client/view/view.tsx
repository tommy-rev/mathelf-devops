import * as React from 'react';

import WebSocketHandler from './web-socket-handler';

export default class View extends React.Component<{}, {}> {
    render() {
        return (
            <div>
                <WebSocketHandler />
                {/*<canvas ref='canvas' style={{ position: 'absolute', display: 'block' }} />*/}
            </div>
        );
    }
}
