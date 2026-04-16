import { useState, useEffect } from "react";
import { getPresignedUrl } from "../services/api";

const urlCache = new Map();

export function usePresignedUrl(roomCode, filename) {
    const [url, setUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!roomCode || !filename) {
            setLoading(false);
            return;
        }

        const cacheKey = `${roomCode}/${filename}`;

        if (urlCache.has(cacheKey)) {
            setUrl(urlCache.get(cacheKey));
            setLoading(false);
            return;
        }

        const fetchUrl = async () => {
            try {
                setLoading(true);
                setError(null);

                const presignedUrl = await getPresignedUrl(roomCode, filename);

                if (!presignedUrl) {
                    throw new Error("No URL returned from server");
                }

                urlCache.set(cacheKey, presignedUrl);
                setUrl(presignedUrl);
            } catch (error) {
                console.error("Failed to get presigned URL:", error);
                setError(error.message || "Failed to load image");
            } finally {
                setLoading(false);
            }
        };

        fetchUrl();
    }, [roomCode, filename]);

    return { url, loading, error };
}