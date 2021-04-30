import { ChannelSubscribeRequestCallback, ChannelSubscribeResponsePacket, ServerEventTypes, SocketPacket, SocketPacketBody } from "./index";
import { SocketClient } from "./SocketClient";
export declare class SocketChannel {
    private name;
    private client;
    private listeners;
    _responseCallback: ChannelSubscribeRequestCallback;
    constructor(name: string, client: SocketClient);
    /**
     * Subscribe to a socket channel
     *
     * @param {ChannelSubscribeRequestCallback} callback
     */
    subscribe(callback: ChannelSubscribeRequestCallback): void;
    /**
     * Used internally to process whether your subscription was successful or not
     *
     * @private
     * @param {ChannelSubscribeResponsePacket} data
     */
    handleSubscriptionResponse(data: ChannelSubscribeResponsePacket): void;
    /**
     * Get the name of this channel
     *
     * @returns {string}
     */
    getName(): string;
    /**
     * Used internally when the socket client receives a new channel event
     *
     * @private
     * @param {SocketPacket} packet
     * @returns {this}
     */
    dispatchEvent(packet: SocketPacket): this;
    /**
     * Listen for an event on this channel
     *
     * @param {string} eventName
     * @param {(data: T) => void} callback
     * @returns {this}
     */
    listen<T extends SocketPacketBody>(eventName: string, callback: (data: T) => void): this;
    /**
     * Emit a websocket event on this channel
     *
     * @param {string | ServerEventTypes} event
     * @param {T} data
     */
    emit<T>(event: string | ServerEventTypes, data: T): void;
    /**
     * Unsubscribe from this channel and stop receiving events from it.
     */
    unsubscribe(): void;
}
