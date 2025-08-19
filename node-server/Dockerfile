FROM node:alpine

# Install strace
RUN apk add --no-cache strace

WORKDIR /app

COPY index.js .

CMD ["strace", "-e", "trace=open,read,write,close,socket,bind,listen,accept4,epoll_create1,epoll_ctl,epoll_pwait", "-f", "-tt", "-T", "-o", "./logs/syscall.log", "node", "index.js"]
