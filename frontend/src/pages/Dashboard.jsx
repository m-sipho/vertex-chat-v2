import { User, Plus, Hash, LogOut, MessageCircleMore, Users, Loader, Settings, ArrowLeft, Paperclip, Send } from "lucide-react"
import { useState } from "react"
import NewSessionModal from "../modals/NewSessionModal"
import RoomHeader from "../components/RoomHeader"
import { useDashboard } from "../hooks/useDashboard"

function Dashboard() {
    
    const { myRooms, sidebarLoading, error, success, displayName, seed, handleCreateRoom} = useDashboard();
    const [isModalOpen, setModalOpen] = useState(false);
    const [isRoomOpen, setIsRoomOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);

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
                        {sidebarLoading ? (
                        <div className="flex text-white justify-center items-center">
                            <Loader className="animate-spin text-center" />
                        </div>
                    ) : myRooms && myRooms.length > 0 ? (
                        myRooms.map(myRoom => (
                            <div onClick={() => { setSelectedRoom(myRoom); setIsRoomOpen(true); }} key={myRoom.room_code} className={`cursor-pointer py-3 px-3 rounded-lg transition flex flex-col gap-2 group mb-2 mx-2 hover:bg-zinc-700/70 ${isRoomOpen && selectedRoom?.room_code === myRoom.room_code ? 'bg-zinc-700/70' : 'bg-zinc-900/50'}`}>
                                <div className="flex items-center gap-2.5 overflow-hidden w-full">
                                    <Hash size={16} className="text-indigo-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0 truncate text-white">
                                        <span className="text-sm font-medium text-zinc-100">{myRoom.title}</span>
                                    </div>
                                    <span className="text-[11px] font-mono bg-zinc-900/60 px-2 py-0.5 rounded text-zinc-400 flex-shrink-0">
                                        {myRoom.room_code}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-1.5 text-xs text-zinc-400 ml-[22px]">
                                    {myRoom.members_length > 1 ? (
                                        <>
                                            <Users size={13} className="text-indigo-400/60 flex-shrink-0" />
                                            <span>{myRoom.members_length} members</span>
                                        </>
                                    ) : (
                                        <>
                                            <User size={13} className="text-indigo-400/60 flex-shrink-0" />
                                            <span>Only you</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-zinc-500 text-center text-sm">No rooms yet</div>
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
                                <button onClick={() => { setIsRoomOpen(false); setSelectedRoom(null); }} className="text-sm text-zinc-400 hover:text-zinc-200">
                                    <ArrowLeft />
                                </button>
                            </div>
                            <div className="flex-1">
                                <RoomHeader room={selectedRoom} />
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
                                    <form className="flex items-center gap-3">
                                        <button type="button" className="w-9 h-9 cursor-pointer flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition rounded-4xl">
                                            <input type="file" id="file-upload" className="hidden" />
                                            <Paperclip size={22} />
                                        </button>

                                        <input type="text" placeholder="Write a message..." className="flex-1 bg-transparent outline-none border-none focus:outline-none focus:ring-0 text-white" />

                                        <button type="submit" className="w-9 h-9 flex items-center justify-center text-white rounded transition hover:bg-zinc-700 rounded-4xl p-2">
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
                <NewSessionModal onCreateRoom={handleCreateRoom} onClose={() => (setModalOpen(false))} />
            )}
        </div>
    )
}

export default Dashboard