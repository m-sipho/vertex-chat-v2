import { User, Plus, Hash, MessageCircleMore, Users, Loader, Settings, ArrowLeft, Paperclip, Send } from "lucide-react"
import { useState, useMemo } from "react"
import NewSessionModal from "../modals/NewSessionModal"
import RoomHeader from "../components/RoomHeader"
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
    const {message, textareaRef, setMessage} = useRoomMessages(token, myRooms);

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

    function handleOpenRoom(room) {
        setSelectedRoom(room);
        setIsRoomOpen(true);

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
        console.log("PENDING REQUESTS:", pendingRequests);
        Object.values(pendingRequests).forEach(request => {
            const lastViewed = lastSeenConfig[request.room_code] || "0";

            // Only count it if it's newer than last visit
            console.log(`DEBUG: request.timestamp = ${request.timestamp} and lastViewed = ${lastViewed}`)
            if (request.timestamp > lastViewed) {
                counts[request.room_code] = (counts[request.room_code] || 0) + 1;
            }
        });

        return counts
    }, [pendingRequests, lastSeenConfig])
    

    return (
        <div>
            <div className="h-screen bg-zinc-950 flex">
                {/* Sidebar */}
                <div className="w-84 h-screen border-r border-zinc-700 flex flex-col bg-zinc-800">
                    <div className="h-16 w-full flex items-center justify-between px-5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8" >
                                <img src="/icon.svg" alt="Vertex Logo" className="w-full h-full" />
                            </div>
                            <span className="font-semibold text-white tracking-tight">Vertex</span>
                        </div>

                        {/* User profile */}
                        <div className="group cursor-pointer">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center border border-zinc-600 hover:border-zinc-500 transition" title={displayName ? displayName : 'Not specified'}>
                                <img src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${seed}&radius=50`} alt="avatar"/>
                            </div>
                        </div>
                    </div>

                    {/* New session button */}
                    <div className="p-4 pb-2">
                        <button onClick={() => setModalOpen(true)} className="w-full bg-white/5 hover:bg-white/10 text-zinc-200 py-2 px-4 rounded-md flex items-center justify-center gap-2 transition border border-dashed border-zinc-600 hover:border-zinc-500 text-sm group cursor-pointer">
                            <Plus />
                            <span className="font-medium">New Room</span>
                        </button>
                    </div>

                    {/* Room list */}
                    <div className="flex-1 flex flex-col overflow-y-auto px-3 py-2 space-y-1 gap-1">

                        {myRooms && myRooms.length > 0 && (
                            <div className="space-y-1">

                                <div className="px-5 py-1">
                                    <span className="text-[10px] font-bold text-zinc-500 tracking-widest">ACTIVE ROOM(S)</span>
                                </div>

                                {myRooms.map(myRoom => {
                                    const unread = unreadCounts[myRoom.room_code] || 0
                                    return (
                                        <div onClick={() => handleOpenRoom(myRoom)} key={myRoom.room_code} className={`cursor-pointer py-3 px-3 rounded-lg transition flex flex-col gap-2 group mb-2 mx-2 hover:bg-zinc-700/70 ${isRoomOpen && selectedRoom?.room_code === myRoom.room_code ? 'bg-zinc-700/70' : 'bg-zinc-900/50'} ${unread > 0 && !isRoomOpen ? 'border-l-3 border-indigo-400' : ''}`}>
                                            <div className="flex items-center gap-2.5 overflow-hidden w-full">
                                                <Hash size={16} className="text-indigo-400 shrink-0" />
                                                <div className="flex-1 min-w-0 truncate text-white">
                                                    <span className="text-sm font-medium text-zinc-100">{myRoom.title}</span>
                                                </div>
                                                <span className="text-[11px] font-mono bg-zinc-900/60 px-2 py-0.5 rounded text-zinc-400 shrink-0">
                                                    {myRoom.room_code}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center justify-between gap-1.5 text-xs text-zinc-400 ml-5.5">
                                                {myRoom.members_size > 1 ? (
                                                    <div className="flex gap-2">
                                                        <Users size={13} className="text-indigo-400/60 shrink-0" />
                                                        <span>{myRoom.members_size} members</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <User size={13} className="text-indigo-400/60 shrink-0" />
                                                        <span>Only you</span>
                                                    </div>
                                                )}
                                                {unread > 0 && !isRoomOpen && <span className='bg-indigo-600 text-white px-1.5 rounded-full text-[10px]'>{unread}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {requestedRooms && requestedRooms.length > 0 && (
                            <div className="space-y-1">
                                
                                <div className={`px-5 py-1 ${myRooms.length > 0 ? 'border-t border-zinc-700': ''}`}>
                                    <span className="text-[10px] font-bold text-zinc-500 tracking-widest">PENDING APPROVAL</span>
                                </div>

                                {requestedRooms.map(room => (
                                    <div  key={room.room_code} className={`pointer-events-none py-3 px-3 rounded-lg transition flex flex-col gap-2 group mb-2 mx-2 bg-zinc-900/20 border border-zinc-800/50 opacity-70 cursor-not-allowed select-none`}>
                                        <div className="flex items-center gap-2.5 overflow-hidden w-full">
                                            <Hash size={16} className="text-zinc-500 shrink-0" />
                                            <div className="flex-1 min-w-0 truncate text-white">
                                                <span className="text-sm font-medium text-zinc-400">{room.title}</span>
                                            </div>
                                            <span className="text-[11px] font-mono bg-zinc-900/60 px-2 py-0.5 rounded text-zinc-400 shrink-0">
                                                {room.room_code}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 ml-5.5">
                                            <span>Pending</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {sidebarLoading ? (
                        <div className="flex text-white justify-center items-center">
                            <Loader className="animate-spin text-center" />
                        </div>
                        ) : myRooms.length == 0 && requestedRooms.length == 0 && (
                            <div className="flex flex-col items-center justify-cente py-10 px-4 text-center">
                                <p className="text-zinc-500 text-sm font-medium">No rooms yet</p>
                                <p className="text-zinc-600 text-xs mt-1">Create or join a room to get started</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-zinc-700 text-xs text-zinc-500 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span>
                            <span>Connected</span>
                        </div>
                        <button className="hover:text-zinc-300 transition" title="Settings">
                            <Settings />
                        </button>
                    </div>
                </div>

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
                    <div className="w-full flex-1 flex items-center justify-center flex-col">
                        {!isRoomOpen ? (
                            <>
                                <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800 shadow-inner">
                                    <MessageCircleMore size={36} className="text-zinc-700" />
                                </div>
                                <h2 className="text-lg font-medium text-zinc-300">No room selected</h2>
                                <p className="text-sm mt-2 max-w-xs text-center text-zinc-700">Choose an active room from the sidebar or create a new one to start chatting.</p>
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col">
                                <div className="flex-1 overflow-auto p-4">
                                    {/* Messages will go here - replace with real message list */}
                                    <div className="text-zinc-500 text-center text-sm">No messages yet</div>
                                </div>

                                <div className="fade-in p-2 mb-1 mx-3 bg-zinc-900 border-t border-zinc-800 rounded-4xl">
                                    <form className="flex items-end gap-3">
                                        <button type="button" className="w-9 h-9 cursor-pointer flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition rounded-4xl">
                                            <input type="file" id="file-upload" className="hidden" />
                                            <Paperclip size={22} />
                                        </button>

                                        <div className="flex-1">
                                            <textarea ref={textareaRef} type="text" value={message} onChange={e => setMessage(e.target.value)} rows={1} placeholder="Write a message..." className="w-full bg-transparent outline-none border-none focus:outline-none focus:ring-0 text-white resize-none max-h-40 box-border overflow-y-auto transition"></textarea>
                                        </div>

                                        <button type="submit" className="w-9 h-9 flex items-center justify-center text-white rounded-4xl transition hover:bg-zinc-700 p-2">
                                            <Send />
                                        </button>
                                    </form>
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