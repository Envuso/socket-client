import { ChannelSubscribeRequestCallback, ConnectionStatus, ServerEventTypes, SocketPacketBody } from "./index";
import { SocketChannel } from "./SocketChannel";
export declare class SocketClient {
    private url;
    private token;
    private protocols;
    private ws;
    private listeners;
    private channels;
    private disconnectTimer;
    private disconnectBackoff;
    private disconnectRetries;
    private connectionStatus;
    constructor(url: string, protocols?: string[]);
    /**
     * Connect using a user Json Web Token
     *
     * @param {string} token
     * @returns {this}
     */
    usingJwt(token: string): this;
    addProtocol(protocol: any): this;
    /**
     * Start the websocket connection
     *
     * @returns {Promise<boolean>}
     */
    connect(): Promise<boolean>;
    /**
     * Just to make sure the connection happens in the right order. We need
     * to wait for our "ready" packet, if subscriptions are created
     * before we receive this, they will not be registered.
     *
     * @returns {Promise<boolean>}
     * @private
     */
    private waitForReady;
    /**
     * Start a subscription to a channel, this takes a callback because we
     * will send a socket event to the server to see if the user has authorisation
     * to access the specified channel. If they are allowed, we will then return a
     * {@see SocketChannel} instance which represents the channel.
     *
     * @param {string} name
     * @param {ChannelSubscribeRequestCallback} callback
     */
    subscribe(name: string, callback: ChannelSubscribeRequestCallback): void;
    /**
     * Handle the internal websocket errors
     *
     * @private
     * @param {Event} event
     * @private
     */
    private _onError;
    /**
     * Handle the internal websocket open event
     *
     * @private
     * @param {Event} event
     * @private
     */
    private _onOpen;
    /**
     * Handle the internal websocket close event
     *
     * @private
     * @param {CloseEvent} event
     * @private
     */
    private _onClose;
    /**
     * Handle the internal websocket message event
     *
     * This will handle any pre-defined "packets" and
     * then continue to send the event to your channel
     * or regular event listener.
     *
     * @private
     * @param {MessageEvent} event
     * @private
     */
    private _onMessage;
    /**
     * Used internally to dispatch an event to your specified listener
     *
     * @private
     * @param {string} name
     * @param data
     * @private
     */
    private dispatchEvent;
    /**
     * Listen for a websocket event
     *
     * This method only handles global events, not channel events
     *
     * @param {string} eventName
     * @param {(data: T) => void} callback
     * @returns {this}
     */
    listen<T extends SocketPacketBody>(eventName: string, callback: (data: T) => void): this;
    /**
     * Send a regular socket event to the server
     *
     * @param {string | ServerEventTypes} event
     * @param {T} data
     */
    emit<T>(event: string | ServerEventTypes, data: T): void;
    /**
     * When we receive a subscribe response, we'll get the callback
     * from the map, and call it with it's "successful" state.
     *
     * If we failed to subscribe to the channel, we'll remove the callback.
     *
     * @param {ChannelSubscribeResponsePacket} data
     * @private
     */
    private handleSubscribeResponse;
    /**
     * Used internally to remove a {@see SocketChannel} instance
     *
     * @param {SocketChannel | string} channel
     * @private
     */
    removeChannel(channel: SocketChannel | string): void;
    hasSubscription(channel: string): boolean;
    getWs(): WebSocket;
    getConnectionStatus(): ConnectionStatus;
    /**
     * When we lose connection to the server or cannot connect to
     * it, we'll begin to retry the connection automatically
     * @private
     */
    private beginReconnect;
    /**
     * Once we've reconnected, we need to reset some values so it can
     * handle it-self properly next time
     *
     * @returns {boolean}
     * @private
     */
    private handleReconnect;
    disconnect(): void;
}
