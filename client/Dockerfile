FROM node:alpine

# Install strace, tcpdump, and telnet
RUN apk add --no-cache strace tcpdump busybox-extras
# watch netstat -a
WORKDIR /app

COPY index.js .

CMD ["tail", "-f", "/dev/null"]
