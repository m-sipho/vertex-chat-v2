import { Circle, X } from "lucide-react";

function CircularProgress({ progress }) {
    const radius = 10;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-[15px] transition-opacity duration-300">
            <div className="relative flex items-center justify-center">
                {/* Background Track */}
                <Circle size={48} className="text-white/20 absolute" strokeWidth={2} />

                <div className="absolute text-[8px]">{progress}%</div>

                {/* Progress Filler */}
                <Circle size={48} className="text-white transition-all duration-300 ease-out -rotate-90" strokeWidth={2} style={{ strokeDasharray: circumference, strokeDashoffset: offset, strokeLinecap: 'round' }} />
                
            </div>
        </div>
    )
}

export default CircularProgress