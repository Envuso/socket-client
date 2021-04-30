const {SocketClient, SocketChannel} = require('./../dist');

const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwODcxNzdiNzIyNDcyZDUxMDNlYjZiNyIsImlhdCI6MTYxOTgwNjk3MiwiZXhwIjoxNjE5ODkzMzcyfQ.QhvXViAVOZUtJ6PvoijTL5ZA3fxYOqzsHC9aYxJTbZ8";

const client = new SocketClient('ws://127.0.0.1:3000');

window.client = client;

/**
 * @type {SocketChannel|null}
 */
let userChannel = null;

async function setupSockets()
{
	await client.usingJwt(JWT).connect();

	client.subscribe("user:6087177b722472d5103eb6b7", (error, channel) => {

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

document.addEventListener('readystatechange', () => {
	document.getElementById('unsubscribe').addEventListener('click', () => {
		userChannel.unsubscribe();
	});
	document.getElementById('disconnect').addEventListener('click', () => {
		client.disconnect();
	});
});


