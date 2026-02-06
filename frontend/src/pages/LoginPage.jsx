import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { loginUser } from "../services/api";
import { Loader } from "lucide-react"


function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [showLoadingMsg, setShowLoadingMsg] = useState(false)
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

    // Trigger slow connection message
    useEffect(() => {
        let timer;
        if (loading) {
            // Wait 2 seconds before showing the message
            timer = setTimeout(() => {
                setShowLoadingMsg(true)
            }, 4000)
        } else {
            // Reset when loading finishes
            setShowLoadingMsg(false)
        }

        return () => clearTimeout(timer);
    }, [loading])

    async function handleSubmit(e) {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            const data = await loginUser(username, password)
            if (data.access_token) {
                sessionStorage.setItem("token", data.access_token);
                sessionStorage.setItem("display_name", data.display_name);
                sessionStorage.setItem("avatar_seed", data.avatar_seed);
                navigate(`/dashboard`)
            } else {
                setError(data.detail || "Invalid credentials");
            }
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
            setUsername("");
            setPassword("");
        }
    }


    return (
        <div className="h-screen flex flex-col items-center justify-center bg-zinc-950 p-6">
            
            <div className={`text-center ${showLoadingMsg ? 'animate-pulse opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                <p className="text-yellow-500/90 text-xs font-medium">Using free tier services.</p>
                <p className="text-zinc-500 text-[10px] mb-3">Waking up server, please be patient...</p>
            </div>

            <div className="bg-zinc-900 w-xs md:w-lg h-auto rounded-md border border-zinc-800 p-6 fade-in">
                {/* Logo and Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-md flex items-center justify-center">
                        <img src="/icon.svg" alt="Vertex Logo" className="w-full h-full" />
                    </div>
                    <h1 className="text-2xl font-semibold text-white tracking-tight">Vertex</h1>
                    <p className="text-zinc-400 text-sm mt-2">Sign in to access your rooms.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 fade-in">
                    <div>
                        <label htmlFor="username" className="block text-xs font-medium text-zinc-500 mb-1.5 ml-1">Username</label>
                        <input type="text" id="username" disabled={loading} value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/20 border border-zinc-800 rounded-md px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition placeholder-zinc-600 font-medium" placeholder="e.g. m_sipho" required autoFocus autoComplete="off" />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-xs font-medium text-zinc-500 mb-1.5 ml-1">Password</label>
                        <input type="password" id="password" disabled={loading} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/20 border border-zinc-800 rounded-md px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition placeholder-zinc-600 font-medium" placeholder="••••••••" required autoComplete="off" />
                    </div>

                    {/* Error Messages */}
                    {error && (
                        <div className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 p-2 rounded transition">
                            {error}
                        </div>
                    )}

                    <button type="submit" className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-md transition ${loading ? 'opacity-25': ''}`}>
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

            <div className="md:w-lg bg-zinc-950 p-1 text-center">
                <span className="text-xs text-zinc-500">New to the network?</span>
                <Link to="/register" className={`text-indigo-500 hover:text-indigo-400 ml-1 font-medium text-xs focus:outline-none ${loading ? 'disabled': ''}`}>Create</Link>
            </div>

            {/* Copyright footer */}
            <div className="absolute bottom-6 text-center text-[10px] text-zinc-600 font-medium">
                <p>&copy; 2026 Vertex. All rights reserved.</p>
            </div>
        </div>
    )
}

export default LoginPage