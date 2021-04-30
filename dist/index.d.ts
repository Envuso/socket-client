import { SocketChannel } from "./SocketChannel";
export declare enum ConnectionStatus {
    NONE = "none",
    CONNECTING = "connecting",
    CONNECTED = "connected",
    DISCONNECTED = "disconnected",
    RE_CONNECTING = "re-connecting"
}
export declare enum ServerEventTypes {
    SOCKET_PING = "ping",
    SOCKET_PONG = "pong",
    SOCKET_READY = "ready",
    CHANNEL_SUBSCRIBE_REQUEST = "subscribe-channel-request",
    CHANNEL_SUBSCRIBE_RESPONSE = "subscribe-channel-response",
    CHANNEL_UNSUBSCRIBE_REQUEST = "unsubscribe-channel-request"
}
export interface SocketPacket {
    channel?: string;
    event: string | ServerEventTypes;
    data: SocketPacketBody;
}
export declare type SocketPacketBody = ChannelSubscribeRequestPacket | ChannelSubscribeResponsePacket | ChannelUnsubscribeRequest | any;
export interface ChannelSubscribeRequestPacket {
    channel: string;
}
export interface ChannelUnsubscribeRequest {
    channel: string;
}
export interface ChannelSubscribeResponsePacket {
    channel: string;
    successful: boolean;
}
export declare type ChannelSubscribeRequestCallback = (error: Error | null, channel?: SocketChannel) => void;
export * from './SocketChannel';
export * from './SocketClient';
