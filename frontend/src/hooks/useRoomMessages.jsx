import { useState, useRef, useEffect } from "react";

export function useRoomMessages(tokenValue, myRooms) {
    const [message, setMessage] = useState("")
    const textareaRef = useRef(null);
    const socketsRef = useRef({});
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [message])

    useEffect(() => {
        if (!tokenValue || !myRooms || myRooms.length === 0) return;

        // if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readySate === WebSocket.CONNECTING)) return;

        const WS_URL = import.meta.env.VITE_WS_REQUESTS_URL || "ws://localhost:8000";
        console.log("MY ROOMS IN WEBSOCKET", myRooms)
        
        myRooms.forEach((room) => {
            const roomCode = room.room_code;

            // Skip if this room is already connected or connecting
            if (socketsRef.current[roomCode]) return;

            console.log(`Initializing connection for: ${roomCode}`);

            const socket = new WebSocket(`${WS_URL}/ws/${roomCode}?token=${tokenValue}`);

            // Store the socket
            socketsRef.current[roomCode] = socket;

            socket.onopen = function() {
                console.log(`Connected for: ${roomCode}`);
            }

            socket.onmessage = async function (event) {
                try {
                    const data = JSON.parse(event.data);
                    console.log("RECEIVED:", data)
                } catch (err) {
                    console.log("Error parsing message")
                }
            }

            socket.onerror = function(error) {
                console.error(`Socket error in ${roomCode}:`, error)
            }

            socket.onclose = function() {
                console.log(`Socket for ${roomCode} closed`)
                delete socketsRef.current[roomCode];
            }
        });

        // Close sockets for rooms no longer in myRooms list
        const currentRoomCodes = myRooms.map(room => room.room_code);
        Object.keys(socketsRef.current).forEach((code) => {
            if (!currentRoomCodes.includes(code)) {
                socketsRef.current[code].close();
                delete socketsRef.current[code];
            }
        })

        return () => {
            Object.values(socketsRef.current).forEach(ws => ws.close());
            socketsRef.current = {};
        };

    }, [tokenValue, myRooms])

    return {
        message,
        textareaRef,
        setMessage
    }
}