import { User, Plus, Hash, MessageCircleMore, Users, Loader, Settings, ArrowLeft, Paperclip, Send, ChevronDown } from "lucide-react"
import { useState, useMemo, useRef, useEffect } from "react"
import NewSessionModal from "../modals/NewSessionModal"
import RoomHeader from "../components/RoomHeader"
import Sidebar from "../components/Sidebar"
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
    const messageEndRef = useRef(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [missedMessages, setMissedMessages] = useState(0);
    const scrollContainerRef = useRef(null);
    const isInitialRoomLoad = useRef(true);
    const lastSeenMessageRef = useRef(null);
    const [previousLastSeen, setPreviousLastSeen] = useState(null);

    useEffect(() => {
        isInitialRoomLoad.current = true;
    }, [selectedRoom?.room_code]);

    function handleScroll() {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Check if user is within 100px of the bottom
        const isBottom = (container.scrollHeight - container.scrollTop <= container.clientHeight + 50);
        setIsAtBottom(isBottom);

        if (isBottom) setMissedMessages(0); // Reset count if they scrolled to the bottom
    }

    useEffect(() => {
        // Only scroll to the bottom only to the sender
        const lastMessage = currentMessages[currentMessages.length - 1];
        if (!lastMessage) return;

        if ((lastMessage.user !== displayName || lastMessage.username !== displayName) && !isAtBottom) {
            setMissedMessages(prev => prev + 1);
        }

        // Check if this is the first load of this room
        if (isInitialRoomLoad.current) {
            if (lastSeenMessageRef.current) {
                lastSeenMessageRef.current.scrollIntoView({behavior: "auto", block: "center"})
            } else {
                messageEndRef.current?.scrollIntoView({ behavior: "auto" });
            }

            isInitialRoomLoad.current = false;
        } else if ((lastMessage?.user === displayName || lastMessage?.username === displayName) || isAtBottom) {
            
            messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [currentMessages, selectedRoom?.room_code])

    useRequestNotifications(
        token,
        handleNewRequests,
        fetchRooms,
        updatePendingRooms
    )

    function handleCloseRoom(room) {
        setSelectedRoom(null);
        setIsRoomOpen(false);

        // Mark as read by saving the current time
        const now = new Date().toISOString();

        const updatedLastSeen = {
            ...lastSeenConfig,
            [room.room_code]: now
        };

        // Set last seen
        setLastSeenConfig(updatedLastSeen);

        // Save to persist on refresh
        sessionStorage.setItem("lastSeenConfig", JSON.stringify(updatedLastSeen))
    }

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

    async function handleSendingMessages(e) {
        e.preventDefault();
        await handleSendMessage(selectedRoom?.room_code);
    }

    async function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            await handleSendMessage(selectedRoom?.room_code);
        }
    }
    

    return (
        <div>
            <div className="h-screen w-full bg-zinc-950 flex">
                {/* Sidebar */}
                <Sidebar seed={seed} displayName={displayName} setModalOpen={setModalOpen} myRooms={myRooms} roomMessages={roomMessages} isRoomOpen={isRoomOpen} selectedRoom={selectedRoom} isLoading={isLoading} requestedRooms={requestedRooms} sidebarLoading={sidebarLoading} setSelectedRoom={setSelectedRoom} setIsRoomOpen={setIsRoomOpen} setPreviousLastSeen={setPreviousLastSeen} setLastSeenConfig={setLastSeenConfig} lastSeenConfig={lastSeenConfig} unreadCounts={unreadCounts} />

                <div className={`flex-1 flex items-center flex-col relative transition`}>
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

                    {/* Room header placed at top of the message area (only when a room is open) */}
                    {isRoomOpen && (
                        <div className="fade-out h-16 w-full px-6 py-4 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between gap-3">
                            <div>
                                <button onClick={() => handleCloseRoom(selectedRoom)} className="text-sm text-zinc-400 hover:text-zinc-200">
                                    <ArrowLeft />
                                </button>
                            </div>
                            <div className="flex-1">
                                <RoomHeader room={selectedRoom} pendingRequests={pendingRequests} onApprove={handleApprove} onReject={handleReject} />
                            </div>
                        </div>
                    )}

                    {/* Main message area (centered when no room open) */}
                    <div className="w-full flex-1 flex items-center justify-center flex-col overflow-hidden">
                        {!isRoomOpen ? (
                            <>
                                <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800 shadow-inner">
                                    <MessageCircleMore size={36} className="text-zinc-700" />
                                </div>
                                <h2 className="text-lg font-medium text-zinc-300">No room selected</h2>
                                <p className="text-sm mt-2 max-w-xs text-center text-zinc-700">Choose an active room from the sidebar or create a new one to start chatting.</p>
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto space-y-4" ref={scrollContainerRef} onScroll={handleScroll}>
                                    {currentMessages.length === 0 ? (
                                        <div className="h-full flex items-center justify-center">
                                            {/* Messages will go here - replace with real message list */}
                                            <div className="text-zinc-500 text-center text-sm">No messages yet</div>
                                        </div>
                                    ) : (
                                        currentMessages.map((msg, index) => {
                                            const currentMsgTimestamp = msg.timestamp || "0";
                                            const nextMessageTimestamp = currentMessages[index + 1]?.timestamp || "0";
                                            const lastViewed = previousLastSeen || "0";

                                            // Look for the 1st message where the NEXT message is newer than lastViewed
                                            const isLastSeenPoint = currentMsgTimestamp <= lastViewed && (nextMessageTimestamp > lastViewed);

                                            if (msg.type === "system") {
                                                const parts = msg.message.split(" ");
                                                const displayName = parts[0];
                                                const restOfMessage = parts.slice(1).join(" ");

                                                return (
                                                    <div ref={isLastSeenPoint ? lastSeenMessageRef : null} key={index} className="flex justify-center my-2">
                                                        <span className="text-[11px] font-medium bg-zinc-900 text-zinc-500 px-3 py-1 rounded-full border border-zinc-800">
                                                            <span className="text-indigo-400 font-semibold">{displayName}</span>
                                                            <span> {restOfMessage}</span>
                                                        </span>
                                                    </div>
                                                )
                                            } else if (msg.type === "chat") {
                                                const author = msg.user || msg.username || "Unknown";
                                                const isMe = author === displayName;

                                                // Check if the previous message was by the same person
                                                const previousMsg = index > 0 ? currentMessages[index - 1]: null;
                                                const isSameAsPrevious = previousMsg && (previousMsg.user || previousMsg.username) === author;

                                                const date = new Date(msg.timestamp);
                                                const localTime = date.toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: false
                                                })

                                                return (
                                                    <div ref={isLastSeenPoint ? lastSeenMessageRef : null} key={index} className={`w-full flex ${isMe ? "justify-end" : "justify-start gap-2.5"} px-8 my-2`}>
                                                        {!isMe && !isSameAsPrevious ? (
                                                            <img className="w-9 h-9" src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${msg.avatar_seed}&radius=50`} alt="avatar"/>
                                                        ) : (
                                                            !isMe && (
                                                                <div className="w-9 shrink-0"></div>
                                                            )
                                                        )}
                                                        <div className={`flex flex-col gap-1.5 p-3 rounded-xl max-w-[75%] wrap-break-word ${isMe ? `bg-indigo-600 text-white rounded-tr-none ${isSameAsPrevious ? "rounded-tr-xl": "rounded-tr-none"}`: `bg-zinc-800 text-zinc-200 rounded-tl-none ${isSameAsPrevious ? "rounded-tl-xl": "rounded-tl-none"}`}`}>
                                                            <div className="flex items-center space-x-2">
                                                                <span className={`text-sm ${isMe ? 'text-zinc-300' : 'text-white'} font-bold`}>
                                                                    {isMe ? "You" : author}
                                                                </span>
                                                                <span className={`text-sm ${isMe ? 'text-zinc-200/90' : 'text-zinc-300'} text-end`}>{localTime}</span>
                                                            </div>
                                                            <div className={`text-sm ${isMe ? "text-white" : "text-zinc-400"} font-semibold`}>{msg.message}</div>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        })
                                    )}
                                    <div ref={messageEndRef} />
                                </div>

                                {/* Floating Chevron */}
                                {!isAtBottom && (
                                    <button onClick={() => (messageEndRef.current?.scrollIntoView({ behavior: "smooth" }))} className="fixed bottom-24 right-8 bg-zinc-800/60 text-white p-3 rounded-full hover:bg-zinc-800 transition-all flex items-center justify-center">
                                        <ChevronDown />
                                        {missedMessages > 0 && (
                                            <span className="absolute -top-px -right-2 bg-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-zinc-950">
                                                {missedMessages}
                                            </span>
                                        )}
                                    </button>
                                )}

                                <div className="shrink-0 w-full">
                                    <div className="fade-in p-2 mb-1 mx-3 bg-zinc-900 border-t border-zinc-800 rounded-4xl">
                                        <form onSubmit={handleSendingMessages} className="flex items-end gap-3">
                                            <button type="button" className="w-9 h-9 cursor-pointer flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition rounded-4xl">
                                                <input type="file" id="file-upload" className="hidden" />
                                                <Paperclip size={22} />
                                            </button>

                                            <div className="flex-1">
                                                <textarea autoFocus ref={textareaRef} onKeyDown={handleKeyDown} value={message} onChange={e => setMessage(e.target.value)} rows={1} placeholder="Write a message..." className="w-full bg-transparent outline-none border-none focus:outline-none focus:ring-0 text-white resize-none max-h-40 box-border overflow-y-auto transition"></textarea>
                                            </div>

                                            <button type="submit" className="w-9 h-9 flex items-center justify-center text-white rounded-4xl transition hover:bg-zinc-700 p-2">
                                                <Send />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <NewSessionModal onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} onClose={() => (setModalOpen(false))} />
            )}
        </div>
    )
}

export default Dashboard