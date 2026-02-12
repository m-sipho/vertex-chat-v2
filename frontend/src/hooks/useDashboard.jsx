import { useState, useEffect, useCallback } from "react"
import { createRoom, getAllRooms, joinRoom, getAllRequestRooms, getAllPendingRequests, approveUser } from "../services/api"

export function useDashboard() {
    const [seed, setSeed] = useState("");
    const [myRooms, setMyRooms] = useState([]); // Stores a list of dictionaries
    const [requestedRooms, setRequestedRooms] = useState([]);
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [sidebarLoading, setSidebarLoading] = useState(false);
    const [pendingRequests, setPendingRequests] = useState({});
    const [joinRequestSent, setJoinRequestSent] = useState({});
    const [token, setToken] = useState("");

    
    useEffect(() => {
        const fetchData = async () => {

            setSidebarLoading(true);
            try {
                setDisplayName(sessionStorage.getItem("display_name"))
                setSeed(sessionStorage.getItem("avatar_seed"))
                setToken(sessionStorage.getItem("token"))

                const data = await getAllRooms();
                setMyRooms(data);

                const requests = await getAllRequestRooms();
                setRequestedRooms(requests)

                const hostRequestsPending = await getAllPendingRequests();
                setPendingRequests(hostRequestsPending);
                setSuccess("Room(s) loaded successfully.")
            } catch(err) {
                setError("Failed to fetch data", err);
            } finally {
                setSidebarLoading(false);
            }
        }
        fetchData();
    }, [])


    //Show error/sucess for 4 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null)
            }, 4000)

            return () => clearTimeout(timer);
        } else if (success) {
            const timer = setTimeout(() => {
                setSuccess(null)
            }, 2000)

            return () => clearTimeout(timer);
        }
    }, [success, error])


    async function handleCreateRoom(formData) {
        try {
            const data = await createRoom(formData.title);

            let copyOfMyRooms = [...myRooms];
            copyOfMyRooms.push(data);
            setMyRooms(copyOfMyRooms);
            setSuccess("Room created successfully.")

        } catch (err) {
            console.error(err)
            setError(`${err}`)
        } finally {

        }
    }

    async function handleJoinRoom(formData) {
        try {
            const data = await joinRoom(formData.room_code);

            let copyOfRequestedRooms = [...requestedRooms];
            copyOfRequestedRooms.push(data);
            setRequestedRooms(copyOfRequestedRooms);
            setSuccess(`Request sent to '${formData.room_code}'`)
        } catch (err) {
            setError(err.message || "An error occured")
        } finally {

        }
    }

    // Handle incoming join request for hosts
    const handleNewRequests = useCallback((request) => {
        setPendingRequests(prev => {
            // Copy the old data
            const newState = {...prev};

            // Add the new request using the ID as the key
            newState[request.user_id] = request;

            return newState
        });

        setSuccess(`New request from ${request.display_name} to join "${request.room_title}"`)
    }, []);


    async function handleApprove(request) {
        const previousRequests = {...pendingRequests};
        
        setPendingRequests(prev => {
            const updated = {...prev};
            const requestToRemove = Object.keys(updated).find(
                key => updated[key].user_id === request.user_id &&
                updated[key].room_code === request.room_code
            );

            if (requestToRemove) {
                delete updated[requestToRemove];
                return updated;
            }
        });

        try {
            await approveUser(request.room_code, request.display_name);
        } catch (err) {
            // Rollback if failed
            setPendingRequests(previousRequests);
            setError("Failed to approve user. Please try again.");
        }
    }


    return {
        token,
        myRooms,
        requestedRooms,
        sidebarLoading,
        error,
        success,
        displayName,
        seed,
        pendingRequests,
        handleCreateRoom,
        handleJoinRoom,
        handleNewRequests,
        handleApprove
    }
}