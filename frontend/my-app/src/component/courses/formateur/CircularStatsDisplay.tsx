import CircularProgress from './CircularProgress'
import type { CourseStats } from './CourseDetail'

interface CircularStatsDisplayProps {
    stats: CourseStats;
    type: 'course' | 'module';
}

const CircularStatsDisplay: React.FC<CircularStatsDisplayProps> = ({ stats, type }) => {
    // console.log('+-9999999999999999', stats);
    // console.log('+-9999999999999999', type);
    const statItems = type === 'course' ? [
        { value: stats.total_contents_course, max: Math.max(stats.total_contents_course, 50), label: 'Total Contents', color: '#007bff' },
        { value: stats.total_modules, max: Math.max(stats.total_modules, 10), label: 'Modules', color: '#17a2b8' },
        { value: stats.total_users_enrolled, max: Math.max(stats.total_users_enrolled, 100), label: 'Enrolled', color: '#6c757d' },
        { value: stats.completion_rate, max: 100, label: 'Completion %', color: '#28a745' },
        { value: stats.average_progress, max: 100, label: 'Avg Progress', color: '#ffc107' },
        { value: stats.total_users_completed, max: Math.max(stats.total_users_completed, 50), label: 'Completed', color: '#343a40' }
    ] : [
        // FIXED: Use module-specific stats for modules
        { value: stats.total_contents_module, max: Math.max(stats.total_contents_module, 10), label: 'Contents', color: '#007bff' },
        { value: stats.pdf_count, max: Math.max(stats.total_contents_module, 1), label: 'PDFs', color: '#dc3545' },
        { value: stats.video_count, max: Math.max(stats.total_contents_module, 1), label: 'Videos', color: '#28a745' },
        { value: stats.qcm_count, max: Math.max(stats.total_contents_module, 1), label: 'QCMs', color: '#ffc107' }
    ];

    return (
        <div className={`stats-container ${type === 'course' ? 'course-stats' : 'module-stats'}`}>
            <h6 className="mb-3">{type === 'course' ? 'Course Statistics' : 'Module Statistics'}</h6>
            <div className="row g-3 justify-content-center">
                {statItems.map((stat, index) => (
                    <div key={index} className="col-4 col-sm-3">
                        <CircularProgress
                            value={stat.value}
                            max={stat.max}
                            label={stat.label}
                            color={stat.color}
                            size={type === 'course' ? 70 : 60}
                            strokeWidth={type === 'course' ? 6 : 5}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CircularStatsDisplay;