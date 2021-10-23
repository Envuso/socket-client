const {SocketClient, SocketChannel} = require('./../dist');

const JWT    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxNzM2NTE4YWI3ZGU5Y2VjZjk2N2M1YSIsImlhdCI6MTYzNDk1MjQ3MiwiZXhwIjoxNjM1MDM4ODcyfQ.1cEWNXbpN7ZqWJ3MQUvbrgUqeSKVwMOgm2ZzpoLsJ_8";
const userId = "61736518ab7de9cecf967c5a";

const client = new SocketClient('ws://127.0.0.1:3335');

window.client = client;

/**
 * @type {SocketChannel|null}
 */
let userChannel = null;

async function setupSockets()
{
	await client.usingJwt(JWT).connect();

	const uChannelName      = `user:${userId}`;
	const publicChannelName = `public`;

	client.subscribe(publicChannelName, (error, channel) => {

		if (error) {
			console.error(error);
			return;
		}

		userChannel = channel;

		channel.listen('hello', (data) => {
			console.log('hello: ', data);
		});

	});

}

setupSockets();

document.getElementById('unsubscribe').addEventListener('click', () => {
	userChannel.unsubscribe();
});
document.getElementById('sendhello').addEventListener('click', () => {
	userChannel.emit('hello', {message : 'ohhi'});
});
document.getElementById('disconnect').addEventListener('click', () => {
	client.disconnect();
});



