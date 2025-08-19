const net = require('net');
const { setTimeout } = require('timers/promises')

const PORT = process.env.PORT || 3000;
const blockEventLoopInterval = process.env.BLOCK_EVENT_LOOP_INTERVAL;

const messageMap = {
  hi: 'Hello',
  hello: 'Hi',
  ping: 'Pong',
  foo: 'Bar',
  exit: 'Bye',
  help: 'Available commands: hi, hello, ping, foo, exit, poison, help',
  poison: 'Poisoned successfully, no more connection will be accepted.'
}

const server = net.createServer((socket) => {
  console.log(`Client connected: ${socket.remoteAddress}:${socket.remotePort}`);

  socket.on('data', (data) => {
    const messages = data.toString().trim().toLowerCase().replace(/[\r\n\s]+/g, ' ').split(' ')

    for (const message of messages) {
      console.log(`Received: ${message}`);
      
      socket.write(`server: ${messageMap[message] || `Unknown command: ${message}`}\n`);

      switch (message) {
        case 'exit':
          socket.end();
        case 'poison':
          server.close()
      }
    }
  });

  socket.on('end', () => {
    console.log(`Client disconnected: ${socket.remoteAddress}:${socket.remotePort}`);
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});

server.listen(PORT, () => {
  console.log(`TCP Server listening on ${PORT}`);
});

server.on('close', () => {
  console.info('The server is Closing...')
})

server.on('error', (err) => {
  console.error('Server error:', err);
});

const blockEventLoop = async (interval) => {
  await setTimeout(interval)
  console.log(`blocking for ${interval / 1000} seconds..`)
  
  const startTime = Date.now()
  while (Date.now() - startTime < interval) {}

  console.log('blocking finished')

  blockEventLoop(interval)
}

if (blockEventLoopInterval) {
  blockEventLoop(+blockEventLoopInterval)
}
