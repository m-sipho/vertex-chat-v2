import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { registerUser } from "../services/api";
import { Loader, Check, Info } from "lucide-react"

function Register() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [displayName, setDisplayName] = useState(undefined);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [shouldFill, setShouldFill] = useState(false);
    const navigate = useNavigate();

    // Show error for 3 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 2000)

            return () => clearTimeout(timer);
        }
    }, [error])

    // Fill the progess bar
    useEffect(() => {
        if (success) {
            // Allow repaint
            const timer = setTimeout(() => setShouldFill(true), 50);
            return () => clearTimeout(timer);
        }
    }, [success]);

    // Check if passwords match
    const passwordMatch = password === confirmPassword

    async function handleSubmit(e) {
        e.preventDefault();

        if (!passwordMatch) {
            setError("Passowords do not match");
            setPassword("");
            setConfirmPassword("");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const data = await registerUser(username, confirmPassword, displayName);
            if (data.message === "User created successfully") {
                setSuccess(true);
                
                setTimeout(() => {
                    navigate("/");
                    setSuccess(false);
                }, 3000)
            } else {
                setError(data.detail || "Invalid credentials");
            }
        } catch(err) {
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
            setUsername("");
            setPassword("");
            setConfirmPassword("");
        }
    }

    return (
        success ? (
            <div className="h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden p-8 text-center fade-in">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="text-emerald-500 text-2xl" />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2">Registered Successfully</h2>
                    <p className="text-zinc-400 text-sm mb-6">Redirecting you to login page...</p>

                    {/* Progress bar */}
                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full bg-emerald-500 progress-bar ${shouldFill ? 'fill-progress' : ''}`}></div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="m-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6">

                <div className="bg-zinc-900 w-xs md:w-lg h-auto rounded-md border border-zinc-800 p-4 sm:p-6 fade-in">
                    {/* Logo and Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-md flex items-center justify-center">
                            <img src="/icon.svg" alt="Vertex Logo" className="w-full h-full" />
                        </div>
                        <h1 className="text-2xl font-semibold text-white tracking-tight">Vertex</h1>
                        <p className="text-zinc-400 text-sm mt-2">Create you identity to access rooms.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5 fade-in">
                        <div>
                            <label htmlFor="username" className="block text-xs font-medium text-zinc-500 mb-1.5 ml-1">Username</label>
                            <input type="text" id="username" disabled={loading} value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/20 border border-zinc-800 rounded-md px-4 py-2 sm:py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition placeholder-zinc-600 font-medium" placeholder="e.g. m_sipho" required autoFocus autoComplete="off" />
                            <p className="text-[10px] text-zinc-500 mt-1.5 ml-1 flex items-center gap-1">
                                <Info size={10}/> Used for sign-in only. Never used in chat.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-medium text-zinc-500 mb-1.5 ml-1">Password</label>
                            <input type="password" id="password" disabled={loading} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/20 border border-zinc-800 rounded-md px-4 py-2 sm:py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition placeholder-zinc-600 font-medium" placeholder="••••••••" required autoComplete="off" />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-xs font-medium text-zinc-500 mb-1.5 ml-1">Confirm password</label>
                            <input type="password" id="confirmPassword" disabled={loading} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-black/20 border border-zinc-800 rounded-md px-4 py-2 sm:py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition placeholder-zinc-600 font-medium" placeholder="••••••••" required autoComplete="off" />
                        </div>

                        <div>
                            <label htmlFor="displayName" className="block text-xs font-medium text-zinc-500 mb-1.5 ml-1">
                                Display name
                                <span className="text-zinc-600 ml-1">(Optional)</span>
                            </label>
                            <input type="text" id="displayName" disabled={loading} value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-black/20 border border-zinc-800 rounded-md px-4 py-2 sm:py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition placeholder-zinc-600 font-medium" placeholder="e.g. Joker" autoComplete="off" />
                            <p className="text-[10px] text-zinc-500 mt-1.5 ml-1 flex items-center gap-1">
                                <Info size={10}/> This is the name that will appear in chat.
                            </p>
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
                    <span className="text-xs text-zinc-500">Already joined network?</span>
                    <Link to="/" className={`text-indigo-500 hover:text-indigo-400 ml-1 font-medium text-xs focus:outline-none ${loading ? 'disabled': ''}`}>Sign In</Link>
                </div>

                {/* Copyright footer */}
                <div className="mt-8 relative text-center text-[10px] text-zinc-600 font-medium">
                    <p>&copy; 2026 Vertex. All rights reserved.</p>
                </div>
            </div>
        )
    )
}

export default Register