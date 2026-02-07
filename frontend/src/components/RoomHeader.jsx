

function RoomHeader({ room }) {
    return (
        <div className="flex items-center gap-3">
            <div className="">
                <div className="text-md font-medium text-white">{room ? room.title : 'No room selected'}</div>
                {room && <div className="text-[11px] font-mono bg-zinc-900/60 px-2 py-0.5 rounded text-zinc-400 flex-shrink-0">{room.room_code}</div>}
            </div>
        </div>
    )
}

export default RoomHeader