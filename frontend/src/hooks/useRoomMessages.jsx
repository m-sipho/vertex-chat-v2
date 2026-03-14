import { useState, useRef, useEffect } from "react";

export function useRoomMessages(tokenValue, myRooms) {
    const [message, setMessage] = useState("")
    const [roomMessages, setRoomMessages] = useState({});
    const textareaRef = useRef(null);
    const socketsRef = useRef({}); // Keep sockets of all rooms the user is connected to
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [message])

    async function handleSendMessage(roomCode) {

        if (!message.trim() || !roomCode) return;

        const messagePayload = {
            type: "chat",
            message: message
        };

        const roomSocket = socketsRef.current[roomCode];

        if (roomSocket && roomSocket.readyState === WebSocket.OPEN) {
            roomSocket.send(JSON.stringify(messagePayload));

            setMessage("");
        } else {
            console.error("WebSocket is not connected for this room.");
        }
    }

    useEffect(() => {
        if (!tokenValue || !myRooms || myRooms.length === 0) {
            return;
        }

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

                    if (data.type === 'presence_update') {
                        console.log(`${data.username} is ${data.status}`);
                        return;
                    }

                    setRoomMessages(prev => {
                        const oldMessages = prev[roomCode] || []
                        if (Array.isArray(data)) {
                            setIsLoading(false);
                            return { ...prev, [roomCode]: data }
                        }

                        // return {...prev, [roomCode]: [...oldMessages, data]}
                        switch (data.type) {
                            case "chat":
                            case "system":
                            case "image":
                                setIsLoading(false);
                                return {
                                    ...prev,
                                    [roomCode]: [...oldMessages, data]
                                };
                            
                            case "typing":
                                console.log("Typing happening");
                                return prev;
                                
                            default:
                                console.warn(`Unknown message type received: ${data.type}`);
                                return prev;
                        }
                    })
                } catch (err) {
                    console.log("Error parsing message")
                }
            }

            socket.onerror = function(error) {
                setIsLoading(false);
                console.error(`Socket error in ${roomCode}:`, error)
            }

            socket.onclose = function() {
                setIsLoading(false);
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

        // return () => {
        //     Object.values(socketsRef.current).forEach(ws => ws.close());
        //     socketsRef.current = {};
        // };

    }, [tokenValue, myRooms])

    return {
        message,
        textareaRef,
        roomMessages,
        isLoading,
        socketsRef,
        setMessage,
        handleSendMessage
    }
}