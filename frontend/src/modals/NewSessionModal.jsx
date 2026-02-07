import { X, Info, Users } from "lucide-react"
import { useState } from "react"

function NewSessionModal({ onCreateRoom, onClose }) {
    const [isCreateClicked, setCreateClicked] = useState(true)
    const [isJoinClicked, setJoinClicked] = useState(false)
    const [roomName, setRoomName] = useState("")

    async function handleCreateSubmit(e) {
        e.preventDefault();

        onClose();

        await onCreateRoom({title: roomName})
    }

    return (
        <div className=" backdrop-blur-xs fixed inset-0 flex items-center justify-center p-4 fade-in">
            <div className="bg-zinc-900 w-full max-w-md rounded-xl border border-zinc-700 overflow-hidden">

                <div className="border-b border-zinc-800 p-4 flex justify-between items-center bg-zinc-900">
                    <h3 className="font-semibold text-white">New Session</h3>
                    <button className="text-zinc-500 hover:text-white transition">
                        <X onClick={onClose} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Tabs */}
                    <div className="flex p-1 bg-zinc-800 rounded-lg mb-6 border border-zinc-700/50">
                        <button onClick={() => (setCreateClicked(true), setJoinClicked(false))} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${isCreateClicked ? "bg-zinc-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>Create Room</button>
                        <button onClick={() => (setJoinClicked(true), setCreateClicked(false))} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${isJoinClicked ? "bg-zinc-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>Join Room</button>
                    </div>

                    {/* Create form */}
                    {isCreateClicked && (
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="roomName" className="text-xs font-medium text-zinc-400 mb-1.5">Room Name</label>
                                <input type="text" value={roomName} onChange={e => (setRoomName(e.target.value))} className="w-full bg-black/20 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition placeholder-zinc-600" placeholder="e.g Chess Club" required autoComplete="off" autoFocus />
                            </div>
                            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-3 flex gap-3 items-start">
                                <Info className="text-indigo-500 mt-0.5 text-xs" size={13} />
                                <div>
                                    <p className="text-xs text-indigo-200 font-medium">Host permission</p>
                                    <p className="text-[10px] text-indigo-300/70 mt-0.5">You will moderate this room. Max 1 active hosted room.</p>
                                </div>
                            </div>
                            <button type="submit" onClick={handleCreateSubmit} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded font-medium text-sm cursor-pointer transition">Create & Enter</button>
                        </div>
                    )}

                    {/* Join form */}
                    {isJoinClicked && (
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="roomCode" className="text-xs font-medium text-zinc-400 mb-1.5">Room Code</label>
                                <input type="text" className="w-full bg-black/20 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition placeholder-zinc-600" placeholder="e.g BH67g" required autoComplete="off" autoFocus />
                            </div>
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 flex gap-3 items-start">
                                <Users className="text-emerald-500 mt-0.5 text-xs" size={13} />
                                <div>
                                    <p className="text-xs text-emerald-200 font-medium">Member Access</p>
                                    <p className="text-[10px] text-emerald-300/70 mt-0.5">Join an existing room. Max 2 concurrent rooms.</p>
                                </div>
                            </div>
                            <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded font-medium text-sm cursor-pointer transition">Join Session</button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}

export default NewSessionModal