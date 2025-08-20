# TCP Network I/O Internals

A Docker-based TCP lab for exploring network I/O internals, syscalls, and packet-level analysis. It includes two echo servers (Node.js and Go) and a configurable TCP client with built-in analysis tools.

## Repository structure

```text
.
├─ compose.yml              # Docker Compose with 3 services
├─ client/                  # TCP client + tcpdump/strace tools
│  ├─ index.js
│  ├─ Dockerfile
│  └─ logs/                 # mounted to /app/logs in container
├─ node-server/             # Node.js TCP server (strace-enabled)
│  ├─ index.js
│  ├─ Dockerfile
│  └─ logs/                 # mounted to /app/logs in container
└─ go-server/               # Go TCP server (strace-enabled)
   ├─ main.go
   ├─ Dockerfile
   └─ logs/                 # mounted to /app/logs in container
```

## Services and ports

- **node-server (Node.js)**: listens on container port 3000; published on host as `${NODE_PORT:-3000}`.
- **go-server (Go)**: listens on container port 3000; published on host as `${GO_PORT:-3001}`.
- **client**: utility container with `node`, `strace`, `tcpdump`, `telnet`. Default command is idle; you exec into it to run the client.

Syscall traces for both servers are written inside the containers to `/app/logs/syscall.log` and are bind-mounted to the host at `node-server/logs/syscall.log` and `go-server/logs/syscall.log`.

## Prerequisites

- Docker and Docker Compose v2

## Environment variables

- **Client**

  - `CONNECTIONS` (default: 1): number of concurrent connections
  - `HOST` (default: `localhost`; compose sets it to `node-server`): server hostname/IP
  - `PORT` (default: 3000): server port
  - `INTERVAL` (default: 500 ms): message send interval
  - `TIMEOUT` (default: 10000 ms): how long to keep each connection open
  - CLI args to `index.js` are treated as candidate messages (picked at random each tick)

- **Node server**

  - `PORT` (default: 3000)
  - `BLOCK_EVENT_LOOP_INTERVAL` (optional, ms): simulate CPU-bound event-loop blocking in a recurring loop

- **Go server**
  - Listens on container port 3000 (no env toggles in code); host port is `${GO_PORT:-3001}` via compose

## Quick start

Start everything

```bash
docker compose up -d
```

Run the client against the Node server

```bash
# Enter client container
docker compose exec client sh

# Defaults: HOST=node-server (from compose), PORT=3000, 1 connection
node index.js

# Multiple connections with faster messages and shorter lifetime
CONNECTIONS=5 INTERVAL=200 TIMEOUT=5000 node index.js hello ping foo exit

# or use telnet
telnet node-server 3000
# for go server
telnet go-server 3000
```

## Commands and behavior

- Common echo behavior: send words separated by spaces/newlines, server responds per word
- Node server supported commands: `hi`, `hello`, `ping`, `foo`, `exit`, `poison`, `help`
  - `poison` closes the Node server listener (stops accepting new connections)
- Go server supported commands: `hi`, `hello`, `ping`, `foo`, `exit`, `help` (no `poison`)

## Network analysis

### TCP packet capture (pcap)

```bash
# In one terminal
docker compose exec client sh

tcpdump -i eth0 host node-server -w ./logs/captured.pcap and port 3000 -n

# parse the output pcap to log
tcpdump -r ./logs/captured.pcap > ./logs/tcpdump.log

# or

tcpdump -i eth0 host node-server and port 3000 -n > ./logs/tcpdump.log
```

Observe:

- 3-way handshake (SYN, SYN-ACK, ACK)
- Data packets (PSH) and ACKs
- FIN/ACK teardown

### Syscall tracing

Servers run under `strace` by default.

```bash
tail -f node-server/logs/syscall.log
tail -f go-server/logs/syscall.log
```

## Observability and logs

```bash
docker compose logs -f node-server
docker compose logs -f go-server
docker compose logs -f client
```

## Cleanup

```bash
docker compose down
# or also remove volumes
docker compose down -v
```

## Troubleshooting

- Ports already in use: pick different `NODE_PORT`/`GO_PORT` before `docker compose up`
- Node server appears unresponsive: if `poison` was sent, it stops accepting new connections; restart that service
- Check connections/state inside containers: `netstat -ant` or `ss -ant`
