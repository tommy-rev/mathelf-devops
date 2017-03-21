import { EventEmitter } from 'events';
import { Server as WebSocketServer, IServerOptions } from 'uws';
import * as IORedis from 'ioredis';
import * as logger from 'winston';
import { AsapAction } from 'rxjs/scheduler/AsapAction';
import { AsapScheduler } from 'rxjs/scheduler/AsapScheduler';

import { Client } from './client';
import { AttributedModification, ModificationSource } from './blaze/modification';
import { TreeDatabase } from './blaze/tree-database';
import { Update } from './blaze/update';
import { BlazeDataRetriever } from './whiteboard/data-retriever';
import { Whiteboard } from './whiteboard/whiteboard';

export interface ServerConfig {
    host?: string;
    port?: number;
}

let clientId = 0;
export const clients = new Map<number, Client>();

export class Server extends EventEmitter {
    private wssOptions: IServerOptions;
    private wss: WebSocketServer;

    private isActive = false;

    private blazeDb: TreeDatabase;
    private dataRetriever: BlazeDataRetriever;
    private whiteboard: Whiteboard;

    private redis: IORedis.Redis;
    private channel: string;

    constructor(config: ServerConfig = {}) {
        super();

        logger.configure({
            transports: [new logger.transports.Console({
                colorize: true,
                silent: false
            })]
        });

        this.blazeDb = new TreeDatabase(false, new AsapScheduler(AsapAction));
        this.dataRetriever = new BlazeDataRetriever(this.blazeDb);
        this.whiteboard = new Whiteboard(this.dataRetriever);

        this.initRedis();

        // TODO: look into enabling + configuring wss://
        this.wssOptions = {
            host: config.host || 'localhost',
            port: config.port || 8081,
            verifyClient: (info, cb) => this.verifyClient(info, cb)
        };
    }

    start() {
        if (this.isActive) {
            logger.warn('Server is already started');
            return;
        }

        this.wss = new WebSocketServer(this.wssOptions, () => {
            this.emit('open');
        });

        this.wss.on('connection', (socket) => {
            this.initClient((socket as any) as WebSocket);
        });

        this.wss.on('error', (error) => {
            logger.error('WebSocketServer: ' + error);
            this.stop();
        });

        this.isActive = true;
    }

    stop() {
        if (!this.isActive) {
            logger.warn('Server is already stopped');
            return;
        }

        this.isActive = false;

        this.wss.close();
        delete this.wss;

        this.emit('close');
    }

    private verifyClient(info: {}, cb: (res: boolean) => void) {
        // const ip = info.req.socket.remoteAddress;
        cb(true);
    }

    private initClient(socket: WebSocket) {
        const client = this.addClient(socket);

        socket.onclose = (ev: CloseEvent) => {
            this.removeClient(client);
        };
    }

    private addClient(socket: WebSocket) {
        // create a Client object for the socket
        const id = ++clientId;
        const client = new Client(id, socket);

        clients.set(id, client);
        logger.info('Adding client for id ' + id);

        return client;
    }

    private removeClient(client: Client) {
        clients.delete(client.id);
        logger.info('Removing client for id ' + client.id);
    }

    private initRedis() {
        this.redis = new IORedis({
            host: 'redis-test.1hawek.ng.0001.usw2.cache.amazonaws.com',
            port: 6379,
            db: 3
        });

        this.redis.psubscribe('test:tutsess.*');
        this.redis.on('pmessageBuffer', (pattern: Uint8Array, channel: Uint8Array, data: Uint8Array) => {
            // only listen to the first new session to occur
            this.channel = this.channel || channel.toString();
            if (this.channel !== channel.toString()) {
                return;
            }

            const update = JSON.parse(data.slice(4).toString()) as Update;
            const modification: AttributedModification = {
                source: ModificationSource.Remote,
                modification: update.data
            };

            this.blazeDb.modificationSink.next(modification);
        });
    }
}
