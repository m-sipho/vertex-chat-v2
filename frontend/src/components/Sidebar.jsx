import { Plus, Hash, User, Users, Loader, Settings } from "lucide-react";

function Sidebar({ seed, displayName, setModalOpen, myRooms, roomMessages, isRoomOpen, selectedRoom, isLoading, requestedRooms, sidebarLoading, setSelectedRoom, setIsRoomOpen, setPreviousLastSeen, setLastSeenConfig, lastSeenConfig, unreadCounts }) {

    function handleOpenRoom(room) {
        // Capture what's in storage before updating it
        const oldTimestamp = lastSeenConfig[room.room_code] || "0";
        setPreviousLastSeen(oldTimestamp);

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

    return (
        <>
            <div className="w-100 h-screen border-r border-zinc-700 flex flex-col bg-zinc-800">
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
                                const unread = unreadCounts[myRoom.room_code] || 0;

                                const messages = roomMessages[myRoom.room_code] || [];
                                const lastMessage = messages[messages.length - 1] || "";

                                const author = lastMessage.user || lastMessage.username || "";
                                const isMe = author === displayName;
                                return (
                                    <div onClick={() => handleOpenRoom(myRoom)} key={myRoom.room_code} className={`cursor-pointer py-3 px-3 rounded-lg transition flex flex-col gap-2 group mb-2 mx-2 hover:bg-zinc-700/70 ${isRoomOpen && selectedRoom?.room_code === myRoom.room_code ? 'bg-zinc-700/70' : 'bg-zinc-900/50'} ${unread > 0 && !isRoomOpen ? 'border-l-3 border-indigo-400' : ''}`}>
                                        <div className="flex items-center gap-2.5 overflow-hidden w-full">
                                            <Hash size={16} className="text-indigo-400 shrink-0" />
                                            <div className="flex-1 min-w-0 truncate text-white">
                                                <span className="text-sm font-medium text-zinc-100">{myRoom.title}</span>
                                            </div>
                                            {myRoom.members_size > 1 ? (
                                                <div className="flex gap-2 justify-between items-center text-xs text-zinc-400">
                                                    <Users size={13} className="text-indigo-400/60 shrink-0" />
                                                    <span>{myRoom.members_size} members</span>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2 justify-between items-center text-xs text-zinc-400">
                                                    <User size={13} className="text-indigo-400/60 shrink-0" />
                                                    <span>Only you</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center justify-between gap-1.5 text-xs text-zinc-400 ml-5.5 h-4">
                                            {!isLoading ? (
                                                <p className="truncate flex-1 min-w-0 space-x-1">
                                                    {lastMessage.type === "chat" && (
                                                        <span className="text-indigo-300 font-medium">
                                                            {isMe ? "You" : author}: 
                                                        </span>
                                                    )}
                                                    <span className={lastMessage.type === "system" ? "text-indigo-400 italic" : "text-zinc-400"}>
                                                        {lastMessage.message}
                                                    </span>
                                                </p>
                                                ) : (
                                                    <p>Loading...</p>
                                                ) 
                                            }
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
        </>
    )
}

export default Sidebar