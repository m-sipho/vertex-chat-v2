import { useEffect, useRef } from "react";

export function useRequestNotifications(tokenValue, onRequestsReceived, onFetchRooms, onUpdatePendingRequests) {
    const wsRef = useRef(null);
    
    useEffect(() => {
        if (!tokenValue) {
            return;
        }

        if (wsRef.current && (wsRef.current.readySate === WebSocket.OPEN || wsRef.current.readySate === WebSocket.CONNECTING)) {
            return;
        }

        const WS_URL = import.meta.env.VITE_WS_REQUESTS_URL || "ws://localhost:8000";
        function connectWebSocket() {
            try {
                wsRef.current = new WebSocket(`${WS_URL}/ws/requests?token=${tokenValue}`);

                wsRef.current.onopen = function() {
                    console.log("Connected to request notifications");
                }

                wsRef.current.onmessage = async function(event) {
                    console.log("RAW DATA RECEIVED:", event.data)
                    try {
                        const data = JSON.parse(event.data);

                        if (data.type === "new_join_request" && onRequestsReceived) {
                            await onRequestsReceived(data.request);
                            await onUpdatePendingRequests();
                        } else if (data.type === "request_approved") {
                            await onUpdatePendingRequests()
                        } else if (data.type === "request_rejected") {
                            await onUpdatePendingRequests()
                        } else if (data.type === "request_removed") {
                            onFetchRooms();
                            onUpdatePendingRequests();
                        } else if (data.type === "broadcast") {
                            await onUpdatePendingRequests()
                        }
                    } catch (err) {
                        console.log("Error parsing request notification:", err);
                    }
                }

                wsRef.current.onerror = function(error) {
                    console.log("Websocket error:", error);
                }

                wsRef.current.onclose = function() {
                    console.log("Disconnected from request notifications");
                }
            } catch(err) {
                console.error("Failed to connect WebSocket:", err)
            }
        }

        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        }
    }, [tokenValue, onRequestsReceived]);

    return wsRef.current;
}