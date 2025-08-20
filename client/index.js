const net = require('net');

const messages = process.argv.slice(2);
const totalConnections = process.env.CONNECTIONS ?? 1;
const intervalTimer = process.env.INTERVAL ?? 500;
const timeout = process.env.TIMEOUT ?? 10000;
const HOST = process.env.HOST ?? 'node-server';
const PORT = process.env.PORT ?? 3000;

const createAndConnect = (id) => {
  // Create a client socket
  const client = new net.Socket();

  // Connect to the server
  client.connect(PORT, HOST, () => {
    console.log(`[connected ${id}] SrcIP:SrcPort ${client.localAddress}:${client.localPort} -> DstIP:DstPort ${client.remoteAddress}:${client.remotePort}`);

    // Send some random test messages
    const intervalId = setInterval(
      () => {
        client.write(`${messages[Math.floor(Math.random() * messages.length)] || 'Hello'}`);
      },
      intervalTimer
    );

    // Close connection after timeout
    setTimeout(
      () => {
        console.log(`[${id}] Closing connection...`);
        clearInterval(intervalId);
        client.end();
      },
      timeout
    );
  });

  // Handle data received from server
  client.on('data', (data) => {
    console.log(`[${id}] ${data.toString().trim()}`);
  });

  // Handle connection closed
  client.on('close', () => {
    console.log(`[${id}] Connection closed`);
  });

  // Handle connection errors
  client.on('error', (err) => {
    console.error(`[${id}] Connection error:`, err);
  });

  // Handle connection timeout
  client.on('timeout', () => {
    console.log(`[${id}] Connection timed out`);
    client.destroy();
  });
}

for (let i = 0; i < totalConnections; i++) {
  createAndConnect(i + 1)
}
