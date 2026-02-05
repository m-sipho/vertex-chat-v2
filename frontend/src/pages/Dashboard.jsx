import { UserRound, Plus, Hash, LogOut, MessageCircleMore } from "lucide-react"
import { useState, useEffect } from "react"

function Dashboard() {
    const [seed, setSeed] = useState("")
    const [displayName, setDisplayName] = useState("")

    useEffect(() => {
        setDisplayName(sessionStorage.getItem("display_name"))

        setSeed(sessionStorage.getItem("avatar_seed"))
    }, [])

    return (
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
                        <div className="w-10 h-10 rounded-full flex items-center justify-center border border-zinc-600 hover:border-zinc-500 transition" title={displayName}>
                            <img src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${seed}&radius=50`} alt="avatar"/>
                        </div>
                    </div>
                </div>

                {/* New session button */}
                <div className="p-4 pb-2">
                    <button className="w-full bg-white/5 hover:bg-white/10 text-zinc-200 py-2 px-4 rounded-md flex items-center justify-center gap-2 transition border border-dashed border-zinc-600 hover:border-zinc-500 text-sm group cursor-pointer">
                        <Plus />
                        <span className="font-medium">New Room</span>
                    </button>
                </div>

                {/* Room list */}
                <div className="flex-1 flex flex-col overflow-y-auto px-3 py-2 space-y-1 gap-1">
                    {/* <div className="cursor-pointer py-2.5 px-3 rounded-r-md transition flex items-center justify-between group mb-1 mx-1 bg-white/2 hover:bg-zinc-700 border-l-2 border-indigo-500">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Hash size={16} className="text-indigo-500" />
                            <span className="text-sm font-medium truncate text-white">Planning</span>
                        </div>
                    </div> */}
                </div>

                <div className="p-4 border-t border-zinc-700 text-xs text-zinc-500 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span>
                        <span>Connected</span>
                    </div>
                    <button className="hover:text-zinc-300 transition" title="Sign Out">
                        <LogOut />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center flex-col relative">
                {/* Empty state */}
                <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800 shadow-inner">
                    <MessageCircleMore size={36} className="text-zinc-700" />
                </div>
                <h2 className="text-lg font-medium text-zinc-300">No room selected</h2>
                <p className="text-sm mt-2 max-w-xs text-center text-zinc-700">Choose an active room from the sidebar or create a new one to start chatting.</p>
            </div>
        </div>
    )
}

export default Dashboard