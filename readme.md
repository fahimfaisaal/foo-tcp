# TCP Network I/O Internals

A Docker-based TCP client-server application for exploring network I/O internals, syscalls, and packet-level analysis. This project demonstrates TCP connection handling, message exchange patterns, and provides tools for deep network analysis.

## Overview

This project consists of:

- **TCP Server**: Node.js server that accepts connections and echoes messages back
- **TCP Client**: Configurable client that can create multiple connections and send test messages
- **Network Monitoring**: Built-in tools for packet capture and syscall tracing
- **Dockerized Environment**: Isolated containers for consistent network analysis

## Environment Variables

- `CONNECTIONS`: Number of concurrent client connections (default: 1)
- `HOST`: Server hostname for client connections (default: localhost)
- `PORT`: TCP port number (default: 3000)

## Quick Start

### 1. Start the Environment

```bash
docker compose up -d
```

### 2. Run Basic Client Test

```bash
# Enter the client container
docker compose exec client sh

# Inside the container, run client with default single connection
node index.js

# Run client with multiple connections
CONNECTIONS=5 node index.js
```

## Network Analysis

### TCP Packet Capture

Capture and analyze TCP handshakes, data transfer, and connection teardown:

```bash
# Enter the client container
docker compose exec client sh

# Inside the container, get the server IP and start packet capture
SERVER_IP=$(getent hosts server | awk '{print $1}')
tcpdump -i eth0 host $SERVER_IP and port 3000 -n > tcpdump.log

# In another terminal, enter the container again and run client
docker compose exec client sh
node index.js
```

**What to observe:**

- TCP 3-way handshake (SYN, SYN-ACK, ACK)
- Data packets with PSH flag
- Connection termination (FIN, ACK)

### Syscall Tracing

#### Client-side Syscall Analysis

```bash
# Enter the client container
docker compose exec client sh

# Inside the container, trace client syscalls
strace -e trace=open,read,write,close,socket,connect,listen,epoll_create1,epoll_ctl,epoll_pwait -f -t -o ./logs/syscall.log node index.js

# View the syscall log
cat syscall.log
```

#### Server-side Syscall Analysis

The server automatically runs with strace enabled. View server syscalls:

```bash
# Enter the server container
docker compose exec server sh

# Inside the container, view server syscall log
cat syscall.log
```

**Key syscalls to observe:**

- `socket()`: Socket creation
- `bind`: Bind with port
- `listen`: Listen on server
- `connect()`: Client connection establishment
- `accept4()`: Server accepting connections
- `epoll_create1()`, `epoll_ctl()`, `epoll_pwait()`: Event polling for I/O multiplexing
- `read()`, `write()`: Data transfer
- `close()`: Connection cleanup

## Advanced Usage

### Multiple Connections Analysis

```bash
# Enter the client container
docker compose exec client sh

# Inside the container, run 10 concurrent connections in background
CONNECTIONS=10 node index.js &

# Monitor network packets
tcpdump -i eth0 port 3000 -n
```

### Custom Environment

```bash
# Use custom port and multiple connections
PORT=8080 CONNECTIONS=3 docker compose up -d

# Enter the client container
docker compose exec client sh

# Inside the container, run with custom settings
HOST=server PORT=8080 CONNECTIONS=3 node index.js
```

### Continuous Monitoring

```bash
# Monitor server logs in real-time
docker compose logs -f server

# Monitor client logs in real-time
docker compose logs -f client
```

## Analysis Tips

1. **TCP State Analysis**: Use `netstat -ant` inside containers to see connection states
2. **Performance Impact**: Compare syscall traces between single vs multiple connections
3. **Buffer Analysis**: Observe how Node.js buffers affect `read()`/`write()` patterns
4. **Event Loop**: Notice `epoll_*` syscalls showing Node.js event-driven I/O
5. **Resource Cleanup**: Track file descriptor lifecycle through `socket()` and `close()`
6. **Container Access**: Use `docker compose exec <service> sh` to enter containers and run commands directly

## Cleanup

```bash
# Stop and remove containers
docker compose down

# Remove containers and volumes
docker compose down -v
```
