import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { loginUser } from "../services/api";
import { Loader } from "lucide-react"


function LoginPage() {
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const navigate = useNavigate()

    //Show error for 4 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null)
            }, 4000)

            return () => clearTimeout(timer);
        }
    }, [error])

    async function handleSubmit(e) {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            const data = await loginUser(username)
            console.log(data)
        } catch (err) {
            setError(err.message || "Sign up failed")
        } finally {
            setLoading(false);
            setUsername("");
        }
    }


    return (
        <div className="h-screen flex items-center justify-center bg-zinc-950 p-4">
            <div className="bg-zinc-900 w-sm md:w-lg h-auto rounded-md border border-zinc-800 p-6">
                {/* Logo and Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-md flex items-center justify-center">
                        <img src="/icon.svg" alt="Vertex Logo" className="w-full h-full" />
                    </div>
                    <h1 className="text-2xl font-semibold text-white tracking-tight">Vertex</h1>
                    <p className="text-zinc-400 text-sm mt-2">Sign in to access your rooms.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="username" className="block text-xs font-medium text-zinc-500 uppercase mb-1.5 ml-1">Username</label>
                        <input type="text" id="username" disabled={loading} value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/20 border border-zinc-800 rounded-md px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition placeholder-zinc-600 font-medium" placeholder="e.g. m_sipho" required autoFocus autoComplete="off" />
                    </div>

                    {/* Error Messages */}
                    {error && (
                        <div className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-md transition ">
                        {loading ? (
                            <div className="flex justify-center items-center">
                                <Loader className="animate-spin text-center" />
                            </div>
                        ) : (
                            "Continue"
                        )}
                    </button>
                </form>
            </div>

            {/* Copyright footer */}
            <div className="absolute bottom-6 text-center text-[10px] text-zinc-600 font-medium">
                <p>&copy; 2026 Vertex. All rights reserved.</p>
            </div>
        </div>
    )
}

export default LoginPage