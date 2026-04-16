import { MessageCircleMore, ArrowLeft, Paperclip, Send, ChevronDown, Smile, Image, File, X, ImagePlus, Check, LoaderCircle, Clock } from "lucide-react"
import RoomHeader from "../components/RoomHeader"
import { useEffect, useState, useRef } from "react";
import EmojiPicker from "emoji-picker-react"
import { uploadImages } from "../services/api";
import CircularProgress from "./CircularProgress";
import { ImageMessage } from "./ImageMessage";

function MessageRoom({ setSelectedRoom, setIsRoomOpen, setLastSeenConfig, lastSeenConfig, handleSendMessage, selectedRoom, isRoomOpen, pendingRequests, handleApprove, handleReject, currentMessages, displayName, previousLastSeen, textareaRef, setMessage, message, socketsRef }) {

    const scrollContainerRef = useRef(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [missedMessages, setMissedMessages] = useState(0);
    const isInitialRoomLoad = useRef(true);
    const lastSeenMessageRef = useRef(null);
    const messageEndRef = useRef(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttach, setShowAttach] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] =useState([]);
    const [caption, setCaption] = useState("");
    const imageInputRef = useRef(null);
    const [selectedImg, setSelectedImg] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});

    useEffect(() => {
        // Close the modal when no files selected
        if (selectedFiles.length === 0 && isUploadModalOpen) {
            setIsUploadModalOpen(false);
        }
    }, [selectedFiles, previews])

    async function handleUploadImages(roomCode, optimisticMsg) {
        if (selectedFiles.length === 0 || !roomCode) return;
        setIsUploading(true);
        setUploadProgress({});

        const uploadPromises = selectedFiles.map(async (file, index) => {

            setUploadProgress(prev => ({
                ...prev,
                [index]: 0
            }));

            try {
                // Upload the specific file
                const response = await uploadImages(roomCode, file, (fileProgress) => {
                    console.log("FILE PROGRESS:", fileProgress)
                    // Calculate total progress accross all files
                    setUploadProgress(prev => ({
                        ...prev,
                        [index]: fileProgress
                    }));
                });
                const s3Filename = response.data.filename;

                // Turn off the loading state of this specific image
                if (optimisticMsg && Array.isArray(optimisticMsg.isUploading)) {
                    optimisticMsg.isUploading[index] = false;
                }

                // Mark this specific image as sent. Ready to send via WebSocket
                if (optimisticMsg && Array.isArray(optimisticMsg.isSent)) {
                    optimisticMsg.isSent[index] = true;
                }

                return { success: true, filename: s3Filename };
                
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                return { success: false, filename: file.name, error };
            }
        });

        try {
            // Send all uploads at once and wait for group to finish
            const results = await Promise.all(uploadPromises);
            
            // Check if any uploads failed
            const failures = results.filter(r => !r.success);
            
            if (failures.length > 0) {
                alert(`Failed to upload ${failures.length} image(s). Check console for details.`);
                return;
            }

            // Collect all filenames in original order
            const filenames = results
                .sort((a, b) => a.index - b.index)
                .map(r => r.filename)

            const messagePayload = {
                type: "image",
                message: filenames,
                caption: caption,
            };

            // Notify the room via WebSocket
            const roomSocket = socketsRef.current[roomCode];
            if (roomSocket && roomSocket.readyState === WebSocket.OPEN) {
                roomSocket.send(JSON.stringify(messagePayload));
            }
            
            setCaption("");
        } catch (error) {
            console.error("Upload batch error:", error);
            alert("Upload process failed unexpectedly. Check console for details.");
        } finally {
            setIsUploading(false);
        }
    }

    async function handleSendingImages(e) {
        e.preventDefault();
        if (isUploading) {
            alert("Upload in progress, please wait...");
            return;
        }

        const optimisticMsg = {
            type: "image_preview",
            caption: caption,
            localPreviews: [...previews],
            username: displayName,
            isUploading: previews.map(() => true),
            isSent: previews.map(() => false)
        }
        
        currentMessages.push(optimisticMsg);
        
        setIsUploadModalOpen(false);

        await handleUploadImages(selectedRoom?.room_code, optimisticMsg);
        // Clear the selected files after upload
        setSelectedFiles([]);
        setPreviews([]);
    }

    const handleRemovingImage = async (indexToRemove) => {
        // Remove the clicked image
        setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));

        setPreviews(prev => {
            // Revoke to free up memory on device
            URL.revokeObjectURL(prev[indexToRemove]);

            return prev.filter((_, index) => index !== indexToRemove);
        });
    }

    const addImages = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setSelectedFiles(prev => (
            [...prev, ...files]
        ));

        // Create temporary URLs to see added images in the modal
        const filePreviews = files.map(file =>
            URL.createObjectURL(file)
        );

        setPreviews(prev => (
            [...prev, ...filePreviews]
        ));
    }

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setSelectedFiles(files);

        // Create temporary URLs to see images in the modal
        const filePreviews = files.map(file =>
            URL.createObjectURL(file)
        );

        setPreviews(filePreviews);

        // Open the Upload modal
        setIsUploadModalOpen(true);

        // Reset input value
        if (imageInputRef.current) {
            imageInputRef.current.value = null;
        }

        setShowAttach(false);
    }

    function onEmojiClick(emojiData) {
        setMessage(prev => prev + emojiData.emoji);

        textareaRef.current.focus();
    }

    useEffect(() => {
            isInitialRoomLoad.current = true;
        }, [selectedRoom?.room_code]);
    
    useEffect(() => {
        // Only scroll to the bottom only to the sender
        const lastMessage = currentMessages[currentMessages.length - 1];
        if (!lastMessage) return;

        if ((lastMessage.username !== displayName) && !isAtBottom) {
            setMissedMessages(prev => prev + 1);
        }

        // Check if this is the first load of this room
        if (isInitialRoomLoad.current) {
            if (lastSeenMessageRef.current) {
                lastSeenMessageRef.current.scrollIntoView({behavior: "auto", block: "center"})
            } else {
                messageEndRef.current?.scrollIntoView({ behavior: "auto" });
            }

            isInitialRoomLoad.current = false;
        } else if ((lastMessage?.user === displayName || lastMessage?.username === displayName) || isAtBottom) {
            
            messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [currentMessages, selectedRoom?.room_code])

    function handleScroll() {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Check if user is within 100px of the bottom
        const isBottom = (container.scrollHeight - container.scrollTop <= container.clientHeight + 100);
        setIsAtBottom(isBottom);

        if (isBottom) setMissedMessages(0); // Reset count if they scrolled to the bottom
    }

    function handleCloseRoom(room) {
        setSelectedRoom(null);
        setIsRoomOpen(false);

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

    async function handleSendingMessages(e) {
        e.preventDefault();
        await handleSendMessage(selectedRoom?.room_code);
    }

    async function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            await handleSendMessage(selectedRoom?.room_code);
        }
    }

    return (
        <>
            <div className={`flex-1 flex items-center flex-col relative transition`}>

                {/* Room header placed at top of the message area (only when a room is open) */}
                {isRoomOpen && (
                    <div className="fade-out h-16 w-full px-6 py-4 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between gap-3">
                        <div>
                            <button onClick={() => handleCloseRoom(selectedRoom)} className="text-sm text-zinc-400 hover:text-zinc-200">
                                <ArrowLeft />
                            </button>
                        </div>
                        <div className="flex-1">
                            <RoomHeader room={selectedRoom} pendingRequests={pendingRequests} onApprove={handleApprove} onReject={handleReject} />
                        </div>
                    </div>
                )}

                {/* Main message area (centered when no room open) */}
                <div className="w-full flex-1 flex items-center justify-center flex-col overflow-hidden">
                    {!isRoomOpen ? (
                        <>
                            <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800 shadow-inner">
                                <MessageCircleMore size={36} className="text-zinc-700" />
                            </div>
                            <h2 className="text-lg font-medium text-zinc-300">No room selected</h2>
                            <p className="text-sm mt-2 max-w-xs text-center text-zinc-700">Choose an active room from the sidebar or create a new one to start chatting.</p>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto space-y-4" ref={scrollContainerRef} onScroll={handleScroll}>
                                {currentMessages.length === 0 ? (
                                    <div className="h-full flex items-center justify-center">
                                        {/* Messages will go here - replace with real message list */}
                                        <div className="text-zinc-500 text-center text-sm">No messages yet</div>
                                    </div>
                                ) : (
                                    currentMessages.map((msg, index) => {
                                        const currentMsgTimestamp = msg.timestamp || "0";
                                        const nextMessageTimestamp = currentMessages[index + 1]?.timestamp || "0";
                                        const lastViewed = previousLastSeen || "0";

                                        // Look for the 1st message where the NEXT message is newer than lastViewed
                                        const isLastSeenPoint = currentMsgTimestamp <= lastViewed && (nextMessageTimestamp > lastViewed);

                                        if (msg.type === "system") {
                                            const parts = msg.message.split(" ");
                                            const displayName = parts[0];
                                            const restOfMessage = parts.slice(1).join(" ");

                                            return (
                                                <div ref={isLastSeenPoint ? lastSeenMessageRef : null} key={index} className="flex justify-center my-2">
                                                    <span className="text-[11px] font-medium bg-zinc-900 text-zinc-500 px-3 py-1 rounded-full border border-zinc-800">
                                                        <span className="text-indigo-400 font-semibold">{displayName}</span>
                                                        <span> {restOfMessage}</span>
                                                    </span>
                                                </div>
                                            )
                                        } else if (msg.type === "chat") {
                                            const author = msg.user || msg.username || "Unknown";
                                            const isMe = author === displayName;

                                            // Check if the previous message was by the same person
                                            const previousMsg = index > 0 ? currentMessages[index - 1]: null;
                                            const isSameAsPrevious = previousMsg && (previousMsg.user || previousMsg.username) === author;

                                            const date = new Date(msg.timestamp);
                                            const localTime = date.toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: false
                                            })

                                            return (
                                                <div ref={isLastSeenPoint ? lastSeenMessageRef : null} key={index} className={`w-full flex ${isMe ? "justify-end" : "justify-start gap-2.5"} px-8 my-2`}>
                                                    {!isMe && !isSameAsPrevious ? (
                                                        <img className="w-9 h-9" src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${msg.avatar_seed}&radius=50`} alt="avatar"/>
                                                    ) : (
                                                        !isMe && (
                                                            <div className="w-9 shrink-0"></div>
                                                        )
                                                    )}
                                                    <div className={`flex flex-col gap-1.5 p-3 rounded-xl max-w-[75%] wrap-break-word ${isMe ? `bg-indigo-600 text-white rounded-tr-none ${isSameAsPrevious ? "rounded-tr-xl": "rounded-tr-none"}`: `bg-zinc-800 text-zinc-200 rounded-tl-none ${isSameAsPrevious ? "rounded-tl-xl": "rounded-tl-none"}`}`}>
                                                        <div className="flex items-center space-x-2">
                                                            <span className={`text-sm ${isMe ? 'text-zinc-300' : 'text-white'} font-bold`}>
                                                                {isMe ? "You" : author}
                                                            </span>
                                                            <span className={`text-sm ${isMe ? 'text-zinc-200/90' : 'text-zinc-300'} text-end`}>{localTime}</span>
                                                        </div>
                                                        <div className={`text-sm ${isMe ? "text-white" : "text-zinc-400"} font-semibold whitespace-pre-wrap`}>{msg.message}</div>

                                                        {isMe && (
                                                            <div className="flex items-center gap-1 shrink-0 ml-auto">
                                                                <Check size={11} strokeWidth={3} className="text-white/70" />
                                                                <span className="text-[11px] text-white/55">Sent</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        } else if (msg.type === "image_preview") {
                                            const author = msg.user || msg.username || "Unknown";
                                            const isMe = author === displayName;

                                            // Check if the previous message was by the same person
                                            const previousMsg = index > 0 ? currentMessages[index - 1]: null;
                                            const isSameAsPrevious = previousMsg && (previousMsg.user || previousMsg.username) === author;

                                            const displaySources = msg.localPreviews;

                                            const allSent = msg.isSent?.every(Boolean);

                                            return (
                                                <div ref={isLastSeenPoint ? lastSeenMessageRef : null} key={index} className={`w-full flex ${isMe ? "justify-end" : "justify-start gap-2.5"} px-8 my-2`}>
                                                    {!isMe && !isSameAsPrevious ? (
                                                        <img className="w-9 h-9" src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${msg.avatar_seed}&radius=50`} alt="avatar"/>
                                                    ) : (
                                                        !isMe && (
                                                            <div className="w-9 shrink-0"></div>
                                                        )
                                                    )}
                                                    <div className={`flex flex-col rounded-xl max-w-[50%] md:max-w-[55%] overflow-hidden ${isMe ? `bg-indigo-600 text-white rounded-tr-none ${isSameAsPrevious ? "rounded-tr-xl": "rounded-tr-none"}`: `bg-zinc-800 text-zinc-200 rounded-tl-none ${isSameAsPrevious ? "rounded-tl-xl": "rounded-tl-none"}`}`}>
                                                        <div className={`grid gap-0.5 p-0.5 ${displaySources.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                                            {displaySources.map((src, index) => {
                                                                // if the total of images is odd, make the width of first image full
                                                                const isFirstOfOdd = displaySources.length > 1 && displaySources.length % 2 !== 0 && index === 0;

                                                                return (
                                                                    <div key={index} className={`relative overflow-hidden rounded-xl w-full bg-zinc-900/50 ${isFirstOfOdd ? 'col-span-2 w-full aspect-video' : ''} ${displaySources.length === 1 ? 'h-64' : 'h-40 aspect-square'}`}>
                                                                        {/* <div>Hi I am Mthokozisi</div> */}
                                                                        {msg.localPreviews ? (
                                                                            // Sender sees local blob immediately
                                                                            <>
                                                                                <img className="w-full h-full object-cover" src={src} alt='Uploading' />
                                                                                {msg.isUploading[index] && uploadProgress[index] < 100 && (
                                                                                    <CircularProgress progress={uploadProgress[index]} />
                                                                                )}

                                                                                {/* 100% but not sent yet */}
                                                                                {uploadProgress[index] === 100 && isUploading && !msg.isSent[index] && (
                                                                                    <div className="absolute bottom-1.5 right-1.5 backdrop-blur-md rounded-full flex items-end justify-end bg-black/40 p-0.5">
                                                                                        <LoaderCircle size={15} className="text-white animate-spin opacity-50" />
                                                                                    </div>
                                                                                )}

                                                                                {/* Sent phase */}
                                                                                {msg.isSent[index] && (
                                                                                    <div className="absolute bottom-1.5 right-1.5 bg-black/40 backdrop-blur-md p-0.5 rounded-full flex items-end justify-end">
                                                                                        <Check size={14} className="tezt-zinc-200" strokeWidth={3} />
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        ) : 'Receiver fetch from S3'}

                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                        {/* Caption and sent indicator */}
                                                        <div className="flex items-end justify-between gap-2 px-2.5 pt-1.5 pb-2 min-h-8">
                                                            {msg.caption && (
                                                                <span className="text-sm font-medium leading-snug">
                                                                    {msg.caption}
                                                                </span>
                                                            )}

                                                            {allSent ? (
                                                                <div className="flex items-center gap-1 shrink-0 ml-auto">
                                                                    <Check size={11} strokeWidth={3} className="text-white/70" />
                                                                    <span className="text-[11px] text-white/55">Sent</span>
                                                                </div>
                                                            ) : (
                                                                <Clock size={11} strokeWidth={3} className="text-white/70 ml-auto" />
                                                            )}
                                                        </div>
                                                        {/* {msg.caption && (
                                                            <div className="px-3 py-2 text-sm font-medium">{msg.caption}</div>
                                                        )} */}
                                                    </div>
                                                </div>
                                            )
                                        } else if (msg.type === "image") {
                                            console.log("IMAGE_GROUP:", msg);
                                            const author = msg.user || msg.username || "Unknown";
                                            const isMe = author === displayName;

                                            const previousMsg = index > 0 ? currentMessages[index - 1] : null;
                                            const isSameAsPrevious = previousMsg && (previousMsg.user || previousMsg.username) === author;

                                            const date = new Date(msg.timestamp);
                                            const localTime = date.toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: false
                                            })

                                            const allSent = msg.isSent?.every(Boolean);

                                            return (
                                                <div ref={isLastSeenPoint ? lastSeenMessageRef : null} key={index} className={`w-full flex ${isMe ? "justify-end" : "justify-start gap-2.5"} px-8 my-2`}>
                                                    {!isMe && !isSameAsPrevious ? (
                                                        <img className="w-9 h-9" src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${msg.avatar_seed}&radius=50`} alt="avatar" />
                                                    ) : (
                                                        !isMe && (
                                                            <div className="w-9 shrink-0"></div>
                                                        )
                                                    )}
                                                    <div className={`flex flex-col rounded-xl max-w-[40%] md:max-w-[45%] overflow-hidden ${isMe ? `bg-indigo-600 text-white ${isSameAsPrevious ? 'rounded-tr-xl' : 'rounded-tr-none'}` : `bg-zinc-800 text-zinc-200 ${isSameAsPrevious ? 'rounded-tl-xl' : 'rounded-tl-none'}`}`}>
                                                        <div className="flex items-center space-x-2 px-3 pt-2">
                                                            <span className={`text-sm ${isMe ? 'text-zinc-300' : 'text-white'} font-bold`}>
                                                                {isMe ? "You" : author}
                                                            </span>
                                                            <span className={`text-sm ${isMe ? 'text-zinc-200/90' : 'text-zinc-300'} text-end`}>{localTime}</span>
                                                        </div>

                                                        <div className={`grid gap-0.5 p-0.5 ${msg.message.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>

                                                            {msg.message.map((filename, index) => {
                                                                const isFirstOdd = msg.message.length > 1 && msg.message.length % 2 !== 0 && index === 0;
                                                                return (
                                                                        <div key={index} className={`relative overflow-hidden rounded-xl w-full bg-zinc-900/50 ${isFirstOdd ? 'col-span-2 aspect-video' : ''} ${msg.message.length === 1 ? 'h-64' : 'h-40 aspect-square'}`}>
                                                                            <ImageMessage filename={filename} roomCode={selectedRoom?.room_code} />
                                                                        </div>
                                                                )
                                                            })}
                                                            
                                                        </div>
                                                        {/* Caption and sent indicator */}
                                                        {(msg.caption || isMe) && (
                                                            <div className={`flex flex-col justify-between gap-2 px-2.5 pt-1.5 pb-2 min-h-8`}>
                                                                {msg.caption && (
                                                                    <span className="text-sm font-medium leading-snug mr-0">
                                                                        {msg.caption}
                                                                    </span>
                                                                )}

                                                                {isMe && (
                                                                    <div className="flex items-center gap-1 shrink-0 ml-auto">
                                                                        <Check size={11} strokeWidth={3} className="text-white/70" />
                                                                        <span className="text-[11px] text-white/55">Sent</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        
                                                    </div>
                                                </div>
                                            )
                                        }
                                    })
                                )}
                                <div ref={messageEndRef} />
                            </div>
                            {/* Floating Chevron */}
                            {!isAtBottom && (
                                <button onClick={() => (messageEndRef.current?.scrollIntoView({ behavior: "smooth" }))} className="fixed bottom-24 right-8 bg-zinc-800/60 text-white p-3 rounded-full hover:bg-zinc-800 transition-all flex items-center justify-center">
                                    <ChevronDown />
                                    {missedMessages > 0 && (
                                        <span className="absolute -top-px -right-2 bg-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-zinc-950">
                                            {missedMessages}
                                        </span>
                                    )}
                                </button>
                            )}

                            <div className="shrink-0 w-full">
                                <div className="fade-in p-2 mb-1 mx-3 bg-zinc-900 border-t border-zinc-800 rounded-4xl">
                                    <form onSubmit={handleSendingMessages} className="flex items-end gap-3">
                                        <button type="button" onClick={() => setShowAttach(!showAttach)} className="w-9 h-9 cursor-pointer flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition rounded-4xl" title="Attach">
                                            <Paperclip size={22} />
                                        </button>

                                        <div className="flex-1">
                                            <textarea autoFocus ref={textareaRef} onKeyDown={handleKeyDown} value={message} onChange={e => setMessage(e.target.value)} rows={1} placeholder="Write a message..." className="w-full bg-transparent outline-none border-none focus:outline-none focus:ring-0 text-white resize-none max-h-40 box-border overflow-y-auto transition"></textarea>
                                        </div>

                                        <div className="flex gap-1.5">
                                            <button type="button" className={`${showEmojiPicker ? 'text-indigo-400' : 'text-zinc-400'} w-9 h-9 flex items-center justify-center rounded-4xl transition cursor-pointer`} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                                                <Smile />
                                            </button>
                                            <button type="submit" className={`w-9 h-9 flex items-center justify-center ${message.trim().length === 0 ? 'text-zinc-600' : 'text-white hover:bg-zinc-700'} rounded-4xl transition p-2 cursor-pointer`}>
                                                <Send />
                                            </button>
                                        </div>
                                    </form>

                                    {showEmojiPicker && (
                                        <div className="absolute bottom-14.5 right-0 z-50 transition">
                                            <EmojiPicker theme="dark" emojiStyle="native" previewConfig={{showPreview: false}} onEmojiClick={onEmojiClick} searchDisabled={false} />
                                        </div>
                                    )}

                                    {showAttach && (
                                        <div className="absolute bottom-14.5 left-0 z-50 transition mx-3 py-2 rounded-lg bg-zinc-900/98">
                                            <label className="flex text-md gap-5 items-center w-50 hover:bg-zinc-800 px-4 py-2 cursor-pointer">
                                                <Image size={30} className="text-white" strokeWidth="1px" />
                                                <span className="text-white font-light">Image</span>
                                                <input type="file" multiple ref={imageInputRef} className="hidden" onChange={handleUpload} accept='image/*' />
                                            </label>
                                            <label className="flex text-md gap-5 items-center w-50 hover:bg-zinc-800 px-4 py-2 cursor-pointer">
                                                <File size={30} className="text-white" strokeWidth="1px" />
                                                <span className="text-white font-light">Files</span>
                                                <input type="file" multiple  className="hidden" onChange={handleUpload} accept="application/*" />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p4 text-white">
                        <div className="bg-zinc-900 w-full max-w-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                                <div>
                                    <h3 className="text-white font-semibold">Send {selectedFiles.length} {selectedFiles.length === 1 ? 'image' : 'images'}</h3>
                                </div>
                                <button onClick={() => !isUploading && (setIsUploadModalOpen(false), setSelectedFiles([]))} disabled={isUploading}>
                                    <X className="text-zinc-400 hover:text-zinc-500 disabled:opacity-50" />
                                </button>
                            </div>

                            {/* Image preview grid */}
                            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2">
                                {previews.map((url, index) => (
                                    <div className="group relative" onClick={() => setSelectedImg(url)}>
                                        <img key={index} src={url} className="w-full h-40 object-cover rounded-lg cursor-pointer" alt="Preview" />
                                        <div className="absolute right-0 top-0 rounded-lg m-1.5 bg-black/40 transition-all z-50 flex justify-end items-start">
                                            <button className="cursor-pointer hover:text-zinc-300 p-2" onClick={(e) => {e.stopPropagation(); handleRemovingImage(index)}} disabled={isUploading}>
                                                <X size={15} className="disabled:opacity-50" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Caption */}
                            <div className="fade-in p-2 mb-1 mx-3 bg-zinc-900 border-t border-zinc-800 rounded-4xl">
                                <form onSubmit={handleSendingImages} className="flex items-center gap-3 px-3">
                                    <label className="w-9 h-9 cursor-pointer flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition rounded-4xl disabled:opacity-50" title="Add">
                                        <ImagePlus size={22} />
                                        <input type="file" multiple className="hidden" onChange={addImages} accept="image/*" disabled={isUploading} />
                                    </label>

                                    <div className="flex-1">
                                        <textarea autoFocus value={caption} onChange={e => setCaption(e.target.value)} rows={1} placeholder="Add a caption..." className="w-full bg-transparent outline-none border-none focus:outline-none focus:ring-0 text-white resize-none max-h-40 box-border overflow-y-auto transition" disabled={isUploading}></textarea>
                                    </div>

                                    <button type="submit" disabled={isUploading} className={`w-9 h-9 flex items-center justify-center text-indigo-600 rounded-4xl transition p-2 cursor-pointer font-bold ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        {isUploading ? '...' : 'Send'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Fullscreen View */}
                {selectedImg && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                        <button onClick={() => setSelectedImg(null)} className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors">
                            <X className='cursor-pointer' size={40} />
                        </button>
                        <img src={selectedImg} alt="Fullscreen view" className="max-w-full text-white max-h-[90vh] rounded-lg object-contain" />
                    </div>
                )}
            </div>
        </>
    )
}

export default MessageRoom