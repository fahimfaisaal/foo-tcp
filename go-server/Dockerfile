FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy source (single-file module-less build)
COPY main.go .

# Build the binary
RUN go build -o server main.go

FROM alpine:3.20 AS runtime

WORKDIR /app

# Install strace for syscall tracing at runtime
RUN apk add --no-cache strace

# Copy built binary from builder image
COPY --from=builder /app/server ./server

# Default command: run the server under strace and log syscalls
CMD ["strace", "-e", "trace=open,read,write,close,socket,bind,listen,accept4,epoll_create1,epoll_ctl,epoll_pwait", "-f", "-tt", "-T", "-o", "./logs/syscall.log", "./server"]
