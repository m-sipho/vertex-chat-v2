import { Clock9, LogOut, Check, X } from 'lucide-react';
import { useState } from 'react';

function RoomHeader({ room, pendingRequests }) {

    const [isRequestsOpen, setRequestsOpen] = useState(false);
    const requestCount = Object.keys(pendingRequests).length;

    return (
        <div className="flex items-center justify-between">
            <div className="">
                <div className="text-md font-medium text-white truncate">{room ? room.title : 'No room selected'}</div>
                {room && <div className="text-[11px] font-mono bg-zinc-900/60 px-2 py-0.5 rounded text-zinc-400 flex-shrink-0 w-min">{room.room_code}</div>}
            </div>
            <div className='flex gap-8'>
                {room && room.role == "host" && (
                    <div className="relative">
                        <button onClick={() => setRequestsOpen(prev => !prev)} className={`${isRequestsOpen ? 'text-white bg-zinc-700': 'text-zinc-400 bg-zinc-800'} hover:text-white hover:bg-zinc-700 px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-2 border border-zinc-700`}>
                            <Clock9 />Requests
                            <span className='bg-indigo-600 text-white px-1.5 rounded-full text-[10px]'>{requestCount}</span>
                        </button>
                        
                        {/* Request dropdown */}
                        {isRequestsOpen && (
                            <div className={`absolute top-full right-0 mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden z-50`}>
                                <div className='p-3 border-b border-zinc-800 text-xs font-bold text-zinc-500 uppercase'>Pending Users</div>
                                    <div className="max-h-48 overflow-y-auto" >
                                        {requestCount === 0 ? (
                                            <div className="p-4 text-center text-xs text-zinc-600 italic pointer-events-none">No pending requests</div>
                                        ) : (
                                            Object.values(pendingRequests).map(request => (
                                                <div key={request.user_id} className='p-3 border-b border-zinc-800/50 last:border-b-0 flex items-center justify-between gap-3 hover:bg-zinc-800/50 transition'>
                                                    <div className='flex-1 min-w-0'>
                                                        <p className='text-sm font-medium text-white truncate'>{request.display_name}</p>
                                                        <p className='text-[10px] text-zinc-500'>User ID: {request.user_id.slice(0, 8)}...</p>
                                                    </div>

                                                    <div className='flex gap-2 flex-shrink-0'>
                                                        <button className='p-1.5 border border-zinc-500 rounded transition disabled:opacity-50' title='approve'>
                                                            <Check className='text-emerald-600 hover:text-emerald-700' size={14} />
                                                        </button>
                                                        <button className='p-1.5 border border-zinc-500 text-white rounded transition disabled:opacity-50' title='Reject'>
                                                            <X className='text-rose-600 hover:text-rose-800' size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                            </div>
                        )}
                    </div>
                )}
                <button className='text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 px-3 py-2 rounded-md transition text-xs font-medium flex items-center gap-2'>
                    <LogOut />Leave
                </button>
            </div>
        </div>
    )
}

export default RoomHeader