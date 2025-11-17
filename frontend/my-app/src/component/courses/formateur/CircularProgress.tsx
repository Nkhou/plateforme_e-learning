interface CircularProgressProps {
    value: number;
    max: number;
    label: string;
    color: string;
    size?: number;
    strokeWidth?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ 
    value, 
    max, 
    label, 
    color, 
    size = 80, 
    strokeWidth = 8 
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = max > 0 ? (value / max) * 100 : 0;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="text-center">
            <div className="position-relative d-inline-block">
                <svg width={size} height={size} className="rotate-270">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#e9ecef"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-300"
                    />
                </svg>
                <div 
                    className="position-absolute top-50 start-50 translate-middle text-center"
                    style={{ width: size - strokeWidth * 2, height: size - strokeWidth * 2 }}
                >
                    <div className="h-100 d-flex flex-column justify-content-center">
                        <strong className="fs-6">{value}</strong>
                        <small className="text-muted">{max > 1000 ? 'k' : ''}</small>
                    </div>
                </div>
            </div>
            <div className="mt-2">
                <small className="text-muted d-block">{label}</small>
            </div>
        </div>
    );
};

export default CircularProgress;