import { useState, useEffect } from "react"
import { createRoom, getAllRooms } from "../services/api"

export function useDashboard() {
    const [seed, setSeed] = useState("");
    const [myRooms, setMyRooms] = useState([]) // Stores a list of disctionaries
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [sidebarLoading, setSidebarLoading] = useState(false);

    
    useEffect(() => {
        const fetchData = async () => {

            setSidebarLoading(true);
            try {
                setDisplayName(sessionStorage.getItem("display_name"))
                setSeed(sessionStorage.getItem("avatar_seed"))

                const data = await getAllRooms();
                setMyRooms(data);
                setSuccess("Room(s) loaded successfully.")
            } catch(err) {
                setError("Failed to fetch data", err)
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

    return {
        myRooms,
        sidebarLoading,
        error,
        success,
        displayName,
        seed,
        handleCreateRoom
    }
}