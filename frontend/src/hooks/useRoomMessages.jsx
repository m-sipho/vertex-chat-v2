import { useState, useRef, useEffect } from "react";

export function useRoomMessages() {
    const [message, setMessage] = useState("")
    const textareaRef = useRef(null);
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [message])

    return {
        message,
        textareaRef,
        setMessage
    }
}