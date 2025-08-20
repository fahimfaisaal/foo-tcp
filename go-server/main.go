package main

import (
	"bufio"
	"fmt"
	"io"
	"net"
	"os"
	"strconv"
	"strings"
	"time"
)

var messageMap = map[string]string{
	"hi":    "Hello",
	"hello": "Hi",
	"ping":  "Pong",
	"foo":   "Bar",
	"exit":  "Bye",
	"help":  "Available commands: hi, hello, ping, foo, exit, help",
}

var delayRead, delayWrite = parseEnvToInt("DELAY_READ"), parseEnvToInt("DELAY_WRITE")

func parseEnvToInt(envName string) int64 {
	if delay := os.Getenv(envName); delay != "" {
		if intDelay, err := strconv.ParseInt(delay, 10, 64); err == nil {
			fmt.Printf("Error on parsing %s\n", envName)
			return intDelay
		}
	}

	return 0
}

func delay(ms int64) {
	time.Sleep(time.Duration(ms) * time.Millisecond)
}

func handleConnection(conn net.Conn) {
	defer conn.Close() // Ensure connection is closed when function returns
	reader := bufio.NewReader(conn)

	for {
		delay(delayRead)

		message, err := reader.ReadString('\n') // Read until newline
		if err != nil {
			if err == io.EOF {
				fmt.Println("Connection closed by client:", conn.RemoteAddr())
			} else {
				fmt.Println("Read error:", err)
			}
			break
		}

		message = strings.TrimSpace(message)
		words := strings.Fields(strings.ToLower(message))
		fmt.Printf("Received message from %s: %v\n", conn.RemoteAddr(), words)

		for _, word := range words {
			if response, exists := messageMap[word]; exists {
				delay(delayWrite)

				fmt.Fprintf(conn, "server: %s\n", response)
				if word == "exit" {
					return // Close connection on exit
				}
			} else {
				fmt.Fprintf(conn, "server: Unknown Command %s\n", word)
			}
		}
	}
}

func init() {

}
func main() {
	socket, err := net.Listen("tcp", ":3000")
	if err != nil {
		fmt.Println(err)
		return
	}

	defer socket.Close()
	fmt.Println("TCP Server listing on", socket.Addr())

	for {
		if conn, err := socket.Accept(); err != nil {
			fmt.Println(err)
		} else {
			fmt.Println("Accepting connection", conn.RemoteAddr())
			go handleConnection(conn)
		}
	}
}
