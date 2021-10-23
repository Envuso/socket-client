export var ConnectionStatus;
(function (ConnectionStatus) {
    ConnectionStatus["NONE"] = "none";
    ConnectionStatus["CONNECTING"] = "connecting";
    ConnectionStatus["CONNECTED"] = "connected";
    ConnectionStatus["DISCONNECTED"] = "disconnected";
    ConnectionStatus["RE_CONNECTING"] = "re-connecting";
})(ConnectionStatus || (ConnectionStatus = {}));
export var ServerEventTypes;
(function (ServerEventTypes) {
    ServerEventTypes["SOCKET_PING"] = "ping";
    ServerEventTypes["SOCKET_PONG"] = "pong";
    ServerEventTypes["SOCKET_READY"] = "ready";
    ServerEventTypes["SOCKET_DISCONNECT"] = "disconnect";
    ServerEventTypes["CHANNEL_SUBSCRIBE_REQUEST"] = "subscribe-channel-request";
    ServerEventTypes["CHANNEL_SUBSCRIBE_RESPONSE"] = "subscribe-channel-response";
    ServerEventTypes["CHANNEL_UNSUBSCRIBE_REQUEST"] = "unsubscribe-channel-request";
})(ServerEventTypes || (ServerEventTypes = {}));
export * from './SocketChannel';
export * from './SocketClient';
//# sourceMappingURL=index.js.map