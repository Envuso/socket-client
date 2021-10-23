import {ChannelSubscribeRequestCallback, ChannelSubscribeResponsePacket, ConnectionStatus, ServerEventTypes, SocketPacket, SocketPacketBody} from "./index";
import {SocketChannel} from "./SocketChannel";


export class SocketClient {
	private url: string;
	private token: string;

	private protocols: string[];

	private ws: WebSocket;

	private listeners: Map<string, Function>     = new Map();
	private channels: Map<string, SocketChannel> = new Map();

	private disconnectTimer: number   = null;
	private disconnectBackoff: number = 2_000;
	private disconnectRetries: number = 0;

	private connectionStatus: ConnectionStatus = ConnectionStatus.NONE;

	constructor(url: string, protocols?: string[]) {
		this.url       = url;
		this.protocols = protocols;
	}

	/**
	 * Connect using a user Json Web Token
	 *
	 * @param {string} token
	 * @returns {this}
	 */
	public usingJwt(token: string): this {
		this.token = token;

		this.addProtocol(this.token);

		return this;
	}

	public addProtocol(protocol: any): this {
		if (!this.protocols) {
			this.protocols = [];
		}

		this.protocols.push(this.token);

		return this;
	}

	/**
	 * Start the websocket connection
	 *
	 * @returns {Promise<boolean>}
	 */
	async connect(): Promise<boolean> {

		if (this.connectionStatus !== ConnectionStatus.RE_CONNECTING) {
			this.connectionStatus = ConnectionStatus.CONNECTING;
		}

		this.ws         = new WebSocket(this.url, this.protocols);
		this.ws.onerror = this._onError.bind(this);
		this.ws.onopen  = this._onOpen.bind(this);
		this.ws.onclose = this._onClose.bind(this);

		await this.waitForReady();

		return true;
	}

	/**
	 * Just to make sure the connection happens in the right order. We need
	 * to wait for our "ready" packet, if subscriptions are created
	 * before we receive this, they will not be registered.
	 *
	 * @returns {Promise<boolean>}
	 * @private
	 */
	private waitForReady(): Promise<boolean> {
		return new Promise((resolve => {
			this.ws.addEventListener('message', (event) => {
				const packet: SocketPacket = JSON.parse(event.data);

				if (packet.event === ServerEventTypes.SOCKET_DISCONNECT) {
					this.connectionStatus = ConnectionStatus.DISCONNECTED;
					resolve(false);

					return;
				}

				if (packet.event === ServerEventTypes.SOCKET_READY) {
					this.connectionStatus = ConnectionStatus.CONNECTED;

					this.ws.onmessage = this._onMessage.bind(this);

					if (this.channels.size) {
						for (let channel of this.channels.values()) {
							channel.subscribe(channel._responseCallback);
						}
					}

					resolve(true);
				}
			}, {once : true});
		}));
	}

	/**
	 * Start a subscription to a channel, this takes a callback because we
	 * will send a socket event to the server to see if the user has authorisation
	 * to access the specified channel. If they are allowed, we will then return a
	 * {@see SocketChannel} instance which represents the channel.
	 *
	 * @param {string} name
	 * @param {ChannelSubscribeRequestCallback} callback
	 */
	public subscribe(name: string, callback: ChannelSubscribeRequestCallback) {
		if (this.connectionStatus !== ConnectionStatus.CONNECTED) {
			throw Error('Cannot subscribe to channel when not connected.');
		}

		const channel = new SocketChannel(name, this);

		this.channels.set(name, channel);

		channel.subscribe(callback);
	}

	/**
	 * Handle the internal websocket errors
	 *
	 * @private
	 * @param {Event} event
	 * @private
	 */
	private _onError(event: Event) {
		this.dispatchEvent('error', event);
	}

	/**
	 * Handle the internal websocket open event
	 *
	 * @private
	 * @param {Event} event
	 * @private
	 */
	private _onOpen(event: Event) {
		this.connectionStatus = ConnectionStatus.CONNECTING;
	}

	/**
	 * Handle the internal websocket close event
	 *
	 * @private
	 * @param {CloseEvent} event
	 * @private
	 */
	private _onClose(event: CloseEvent) {
		this.dispatchEvent('closed', event);

		/**
		 * Connection was closed by the developer, not a lost connection to the server
		 */
		if (event.wasClean) {
			this.connectionStatus = ConnectionStatus.NONE;
			this.channels.clear();
			this.listeners.clear();
			this.ws = null;

			return;
		}

		/**
		 * Connection was lost to the server
		 */

		this.connectionStatus = ConnectionStatus.RE_CONNECTING;
		this.beginReconnect();
	}

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
	private _onMessage(event: MessageEvent) {

		const packet: SocketPacket = JSON.parse(event.data);

		switch (packet.event) {
			case ServerEventTypes.CHANNEL_SUBSCRIBE_RESPONSE:
				return this.handleSubscribeResponse(packet.data);
		}

		if (packet?.channel) {
			const channel = this.channels.get(packet.channel);

			if (channel) {
				channel.dispatchEvent(packet);
			}
			return;
		}

		this.dispatchEvent(packet.event, packet.data);

	}

	/**
	 * Used internally to dispatch an event to your specified listener
	 *
	 * @private
	 * @param {string} name
	 * @param data
	 * @private
	 */
	private dispatchEvent(name: string, data: any) {
		if (!this.listeners.has(name)) {
			return;
		}

		this.listeners.get(name)(data);
	}

	/**
	 * Listen for a websocket event
	 *
	 * This method only handles global events, not channel events
	 *
	 * @param {string} eventName
	 * @param {(data: T) => void} callback
	 * @returns {this}
	 */
	listen<T extends SocketPacketBody>(eventName: string, callback: (data: T) => void) {
		this.listeners.set(eventName, callback);

		return this;
	}

	/**
	 * Send a regular socket event to the server
	 *
	 * @param {string | ServerEventTypes} event
	 * @param {T} data
	 */
	public emit<T>(event: string | ServerEventTypes, data: T) {

		if (this.connectionStatus !== ConnectionStatus.CONNECTED) {
			throw new Error('Cannot send socket event when not connected.');
		}

		this.ws.send(JSON.stringify({
			event : event,
			data  : data
		}));

	}

	/**
	 * When we receive a subscribe response, we'll get the callback
	 * from the map, and call it with it's "successful" state.
	 *
	 * If we failed to subscribe to the channel, we'll remove the callback.
	 *
	 * @param {ChannelSubscribeResponsePacket} data
	 * @private
	 */
	private handleSubscribeResponse(data: ChannelSubscribeResponsePacket) {
		const channel = this.channels.get(data.channel);

		if (!channel) {
			throw new Error('Received subscribe response... but no channel was registered.');
		}

		channel.handleSubscriptionResponse(data);
	}

	/**
	 * Used internally to remove a {@see SocketChannel} instance
	 *
	 * @param {SocketChannel | string} channel
	 * @private
	 */
	public removeChannel(channel: SocketChannel | string) {
		const channelName = (channel instanceof SocketChannel) ? channel.getName() : channel;

		if (this.channels.has(channelName)) {
			this.channels.delete(channelName);
		}
	}

	hasSubscription(channel: string): boolean {
		return this.channels.has(channel);
	}

	public getWs(): WebSocket {
		return this.ws;
	}

	getConnectionStatus(): ConnectionStatus {
		return this.connectionStatus;
	}

	/**
	 * When we lose connection to the server or cannot connect to
	 * it, we'll begin to retry the connection automatically
	 * @private
	 */
	private beginReconnect() {
		if (this.connectionStatus === ConnectionStatus.DISCONNECTED) {
			this.connectionStatus = ConnectionStatus.RE_CONNECTING;
		}

		this.disconnectTimer = setTimeout(() => {

			this.disconnectRetries++;
			this.disconnectBackoff += 2_000;

			console.log('Attempting to reconnect.... ');

			this.connect().then(() => {
				this.handleReconnect();
			});
		}, this.disconnectBackoff);
	}

	/**
	 * Once we've reconnected, we need to reset some values so it can
	 * handle it-self properly next time
	 *
	 * @returns {boolean}
	 * @private
	 */
	private handleReconnect() {
		if (this.connectionStatus !== ConnectionStatus.CONNECTED && this.connectionStatus !== ConnectionStatus.RE_CONNECTING) {
			return false;
		}

		clearTimeout(this.disconnectTimer);
		this.disconnectRetries = 0;
		this.disconnectBackoff = 0;

		return true;
	}

	disconnect() {
		this.ws.close();
	}
}
