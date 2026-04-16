import { usePresignedUrl } from "../hooks/usePresignedUrl";
import { Loader, AlertCircle } from "lucide-react";

export function ImageMessage({ filename, roomCode }) {
    const { url, loading, error } = usePresignedUrl(roomCode, filename);

    if (loading) return (
        <div className="w-full h-full flex items-center justify-center bg-zinc-900/50 rounded-lg">
            <Loader size={20} className="text-zinc-400 animate-spin" />
        </div>
    );

    if (error) return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/50 rounded-lg gap-2 p-3">
            <AlertCircle size={20} className="text-red-400" />
            <span className="text-xs text-red-400 text-center">Failed to load image</span>
        </div>
    );

    return (
            <img src={url} alt="Image" className="w-full h-full object-cover rounded-lg" />
    )
}