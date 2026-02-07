import { User, Plus, Hash, LogOut, MessageCircleMore, Users, Loader, Settings } from "lucide-react"
import { useState, useEffect } from "react"
import NewSessionModal from "../modals/NewSessionModal"
import { createRoom, getAllRooms } from "../services/api"

function Dashboard() {
    const [seed, setSeed] = useState("");
    const [myRooms, setMyRooms] = useState([]) // Stores a list of disctionaries
    const [displayName, setDisplayName] = useState("");
    const [isModalOpen, setModalOpen] = useState(false);
    const [error, setError] = useState("");
    const [sidebarLoading, setSidebarLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {

            setSidebarLoading(true);
            try {
                setDisplayName(sessionStorage.getItem("display_name"))
                setSeed(sessionStorage.getItem("avatar_seed"))

                const data = await getAllRooms();
                setMyRooms(data);
            } catch(err) {
                setError("Failed to fetch data", err)
            } finally {
                setSidebarLoading(false);
            }
        }
        fetchData();
    }, [])

    //Show error for 4 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null)
            }, 4000)

            return () => clearTimeout(timer);
        }
    }, [error])

    async function handleCreateRoom(formData) {
        try {
            const data = await createRoom(formData.title);

            let copyOfMyRooms = [...myRooms];
            copyOfMyRooms.push(data);
            setMyRooms(copyOfMyRooms);

        } catch (err) {
            console.error(err)
            setError(`${err}`)
        } finally {

        }
    }

    return (
        <div>
            <div className="h-screen bg-zinc-950 flex">
                {/* Sidebar */}
                <div className="w-84 h-screen border-r border-zinc-700 flex flex-col bg-zinc-800">
                    <div className="h-16 w-full flex items-center justify-between px-5 border-b border-zinc-700">
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
                            <div key={myRoom.room_code} className="cursor-pointer py-3 px-3 rounded-lg transition flex flex-col gap-2 group mb-2 mx-2 bg-zinc-900/50 hover:bg-zinc-700/70">
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

                <div className="flex-1 flex items-center justify-center flex-col relative">
                    {error && (
                        <div className="fixed top-5 text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 p-2 rounded transition fade-out">
                            {error}
                        </div>
                    )}
                    {/* Empty state */}
                    <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800 shadow-inner">
                        <MessageCircleMore size={36} className="text-zinc-700" />
                    </div>
                    <h2 className="text-lg font-medium text-zinc-300">No room selected</h2>
                    <p className="text-sm mt-2 max-w-xs text-center text-zinc-700">Choose an active room from the sidebar or create a new one to start chatting.</p>
                </div>
            </div>

            {isModalOpen && (
                <NewSessionModal onCreateRoom={handleCreateRoom} onClose={() => (setModalOpen(false))} />
            )}
        </div>
    )
}

export default Dashboard