
import { useState, useMemo, useRef, useEffect } from "react"
import NewSessionModal from "../modals/NewSessionModal"
import Sidebar from "../components/Sidebar"
import MessageRoom from "../components/MessageRoom"
import { useDashboard } from "../hooks/useDashboard"
import { useRequestNotifications } from "../hooks/useRequestNotifications"
import { useRoomMessages } from "../hooks/useRoomMessages"

function Dashboard() {
    
    const { token, myRooms, requestedRooms, sidebarLoading, error, success, displayName, seed, pendingRequests, handleCreateRoom, handleJoinRoom, handleNewRequests, handleApprove, handleReject, fetchRooms, updatePendingRooms } = useDashboard();
    const [isModalOpen, setModalOpen] = useState(false);
    const [isRoomOpen, setIsRoomOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [lastSeenConfig, setLastSeenConfig] = useState(() => {
        const saved = sessionStorage.getItem("lastSeenConfig");

        return saved ? JSON.parse(saved) : {}
    });
    const {message, textareaRef, roomMessages, isLoading, setMessage, handleSendMessage} = useRoomMessages(token, myRooms);
    const currentMessages = roomMessages[selectedRoom?.room_code] || [];
    const [previousLastSeen, setPreviousLastSeen] = useState(null);

    useRequestNotifications(
        token,
        handleNewRequests,
        fetchRooms,
        updatePendingRooms
    )

    const unreadCounts = useMemo(() => {
        // Structure: {"room_A: 2", "room_B": 1}
        const counts = {}
        
        Object.values(pendingRequests).forEach(request => {
            const lastViewed = lastSeenConfig[request.room_code] || "0";

            // Only count it if it's newer than last visit
            if (request.timestamp > lastViewed) {
                counts[request.room_code] = (counts[request.room_code] || 0) + 1;
            }
        });

        Object.keys(roomMessages).forEach(roomCode => {
            const messages = roomMessages[roomCode] || [];
            const lastViewed = lastSeenConfig[roomCode] || "0";

            // Count messages in this room that are newer than lastSeen
            const unreadInRoom = messages.filter(msg => {
                const isNotMe = (msg.user || msg.username) !== displayName;
                return isNotMe && msg.timestamp > lastViewed;
            }).length;

            if (unreadInRoom > 0) {
                counts[roomCode] = (counts[roomCode] || 0) + unreadInRoom;
            }
        })

        return counts
    }, [pendingRequests, lastSeenConfig, currentMessages])
    

    return (
        <div>
            <div className="h-screen w-full bg-zinc-950 flex">
                {/* Sidebar */}
                <Sidebar seed={seed} displayName={displayName} setModalOpen={setModalOpen} myRooms={myRooms} roomMessages={roomMessages} isRoomOpen={isRoomOpen} selectedRoom={selectedRoom} isLoading={isLoading} requestedRooms={requestedRooms} sidebarLoading={sidebarLoading} setSelectedRoom={setSelectedRoom} setIsRoomOpen={setIsRoomOpen} setPreviousLastSeen={setPreviousLastSeen} setLastSeenConfig={setLastSeenConfig} lastSeenConfig={lastSeenConfig} unreadCounts={unreadCounts} />

                <div className="absolute left-1/2 z-50">
                    {error && (
                        <div className="fixed top-5 text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 p-2 rounded transition fade-out">
                            {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className="fixed top-5 text-emerald-400 text-xs text-center bg-emerald-500/10 border border-emerald-500/20 p-2 rounded transition fade-out">
                            {success}
                        </div>
                    )}
                </div>

                <MessageRoom setSelectedRoom={setSelectedRoom} setIsRoomOpen={setIsRoomOpen} setLastSeenConfig={setLastSeenConfig} lastSeenConfig={lastSeenConfig} handleSendMessage={handleSendMessage} selectedRoom={selectedRoom} isRoomOpen={isRoomOpen} pendingRequests={pendingRequests} handleApprove={handleApprove} handleReject={handleReject} currentMessages={currentMessages} displayName={displayName} previousLastSeen={previousLastSeen} textareaRef={textareaRef} setMessage={setMessage} message={message} />
            </div>

            {isModalOpen && (
                <NewSessionModal onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} onClose={() => (setModalOpen(false))} />
            )}
        </div>
    )
}

export default Dashboard