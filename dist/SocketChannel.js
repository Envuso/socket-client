import { ConnectionStatus, ServerEventTypes } from "./index";
const FAILED_TO_SUBSCRIBE_ERROR = 'Failed to connect to channel, likely due to not being authorised to access this channel.';
export class SocketChannel {
    constructor(name, client) {
        this.listeners = new Map();
        this.name = name;
        this.client = client;
    }
    /**
     * Subscribe to a socket channel
     *
     * @param {ChannelSubscribeRequestCallback} callback
     */
    subscribe(callback) {
        this._responseCallback = callback;
        this.client.emit(ServerEventTypes.CHANNEL_SUBSCRIBE_REQUEST, { channel: this.name });
    }
    /**
     * Used internally to process whether your subscription was successful or not
     *
     * @private
     * @param {ChannelSubscribeResponsePacket} data
     */
    handleSubscriptionResponse(data) {
        this._responseCallback((data.successful ? null : new Error(FAILED_TO_SUBSCRIBE_ERROR)), this);
        if (!data.successful) {
            this.client.removeChannel(this);
        }
    }
    /**
     * Get the name of this channel
     *
     * @returns {string}
     */
    getName() {
        return this.name;
    }
    /**
     * Used internally when the socket client receives a new channel event
     *
     * @private
     * @param {SocketPacket} packet
     * @returns {this}
     */
    dispatchEvent(packet) {
        if (!this.listeners.has(packet.event)) {
            throw new Error(`Received event "${packet.event}" on channel "${packet.channel}", but there is no listener registered.`);
        }
        this.listeners.get(packet.event)(packet.data);
        return this;
    }
    /**
     * Listen for an event on this channel
     *
     * @param {string} eventName
     * @param {(data: T) => void} callback
     * @returns {this}
     */
    listen(eventName, callback) {
        this.listeners.set(eventName, callback);
        return this;
    }
    /**
     * Emit a websocket event on this channel
     *
     * @param {string | ServerEventTypes} event
     * @param {T} data
     */
    emit(event, data) {
        if (this.client.getConnectionStatus() !== ConnectionStatus.CONNECTED) {
            throw new Error('Cannot send socket event when not connected.');
        }
        this.client.getWs().send(JSON.stringify({
            event: event,
            channel: this.name,
            data: data !== null && data !== void 0 ? data : {}
        }));
    }
    /**
     * Unsubscribe from this channel and stop receiving events from it.
     */
    unsubscribe() {
        this.emit(ServerEventTypes.CHANNEL_UNSUBSCRIBE_REQUEST, {
            channel: this.name
        });
        this.listeners.clear();
        this.client.removeChannel(this);
    }
}
//# sourceMappingURL=SocketChannel.js.map