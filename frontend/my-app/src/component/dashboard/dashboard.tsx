import React, { useRef, useState, useEffect } from "react";
import "./dashboard.css";
import '../../css/cours.css';
import api from '../../api/api';
import CourseDetailShow from "../courses/apprent/CourseDetailShow";
import CourseImage from "../courses/CourseImage";

interface Course {
    id: number;
    title_of_course: string;
    description: string;
    image: string;
    image_url?: string;
    creator_username: string;
    creator_first_name: string;
    creator_last_name: string;
    created_at?: string;
    updated_at?: string;
    department?: string;
    is_subscribed?: boolean;
    progress_percentage?: number;
    status?: number; // 0: Draft, 1: Active, 2: Archived
    status_display?: string;
}

const Dashboard = () => {
    const trackRef1 = useRef<HTMLDivElement | null>(null) as React.RefObject<HTMLDivElement>;
    const [currentPosition1, setCurrentPosition1] = useState(0);
    const trackRef2 = useRef<HTMLDivElement | null>(null) as React.RefObject<HTMLDivElement>;
    const [currentPosition2, setCurrentPosition2] = useState(0);
    const [showCourseDetail, setShowCourseDetail] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
    const [myCourses, setMyCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [courseFilter, setCourseFilter] = useState<'all' | 'completed' | 'in-progress'>('all');

    // Filter only active courses (status = 1)
    const filterActiveCourses = (courses: Course[]): Course[] => {
        return courses.filter(course => course.status === 1);
    };

    // Fetch courses from backend
    const fetchCourses = async () => {
        try {
            setLoading(true);
            
            // Fetch courses I'm subscribed to
            // console.log('Fetching my subscribed courses from:', `${api.defaults.baseURL}/courses/my-courses/`);
            const myCoursesRes = await api.get('courses/mysubscriptions/');
            console.log('My courses response:', myCoursesRes.data);
            
            // Fetch recommended courses by department
            console.log('Fetching recommended courses from:', `${api.defaults.baseURL}/courses/recommended/`);
            const recommendedRes = await api.get('courses/recommended/');

            // Filter to show only active courses
            const activeMyCourses = filterActiveCourses(myCoursesRes.data);
            const activeRecommendedCourses = filterActiveCourses(recommendedRes.data);

            setMyCourses(activeMyCourses);
            setRecommendedCourses(activeRecommendedCourses);
            setError('');
        } catch (error: any) {
            console.error("Detailed error information:", {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                url: error.config?.url,
                method: error.config?.method,
                fullError: error.response
            });
            setError(`Failed to load courses. Error ${error.response?.status}: ${error.response?.statusText}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const scrollLeft = (ref: React.RefObject<HTMLDivElement>, set: React.Dispatch<React.SetStateAction<number>>) => {
        if (!ref.current) return;
        const cardWidth = ref.current.children[0]?.clientWidth || 300;
        const gap = 16;
        set(prev => Math.min(prev + cardWidth + gap, 0));
    };

    const scrollRight = (ref: React.RefObject<HTMLDivElement>, set: React.Dispatch<React.SetStateAction<number>>) => {
        if (!ref.current) return;
        const cardWidth = ref.current.children[0]?.clientWidth || 300;
        const gap = 16;
        const maxScroll = ref.current.scrollWidth - ref.current.clientWidth;
        set(prev => Math.max(prev - cardWidth - gap, -maxScroll));
    };

    const handleCardClick = (courseId: number) => {
        setSelectedCourseId(courseId);
        setShowCourseDetail(true);
    };

    const handleCloseCourseDetail = () => {
        setSelectedCourseId(null);
        setShowCourseDetail(false);
        // Refresh courses when returning from course detail
        fetchCourses();
    };

    // Filter courses based on progress (only active courses)
    const filteredMyCourses = myCourses.filter(course => {
        switch (courseFilter) {
            case 'completed':
                return course.progress_percentage === 100;
            case 'in-progress':
                return course.progress_percentage !== undefined && course.progress_percentage > 0 && course.progress_percentage < 100;
            case 'all':
            default:
                return true;
        }
    });

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );
    
    if (error) return (
        <div className="container mt-4">
            <div className="alert alert-danger" role="alert">
                {error}
            </div>
        </div>
    );

    return (
        <>
            {!showCourseDetail ? (
                <div className="dashboard-wrapper">
                    {/* My Subscribed Courses Section */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h4>My Courses</h4>
                            {/* <small className="text-muted">Showing only active courses</small> */}
                        </div>
                        <div className="btn-group">
                            <button 
                                className={`btn btn-sm ${courseFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setCourseFilter('all')}
                            >
                                All Courses
                            </button>
                            <button 
                                className={`btn btn-sm ${courseFilter === 'in-progress' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setCourseFilter('in-progress')}
                            >
                                In Progress
                            </button>
                            <button 
                                className={`btn btn-sm ${courseFilter === 'completed' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setCourseFilter('completed')}
                            >
                                Completed
                            </button>
                        </div>
                    </div>
                    
                    {filteredMyCourses.length > 0 ? (
                        <div className="carousel-container">
                            <button className="carousel-nav left" onClick={() => scrollLeft(trackRef2, setCurrentPosition2)}>&lt;</button>
                            <div className="carousel-track" ref={trackRef2} style={{ transform: `translateX(${currentPosition2}px)` }}>
                                {filteredMyCourses.map(course => (
                                    <div className="card-carousel card-hover" key={course.id} onClick={() => handleCardClick(course.id)} style={{ cursor: 'pointer' }}>
                                        <CourseImage
                                            src={course.image_url || course.image}
                                            fallback="/group.avif"
                                            alt={course.title_of_course}
                                            className="card-img-top"
                                            style={{ height: '200px', objectFit: 'cover' }}
                                        />
                                        <div className="card-body">
                                            <h5 className="card-title">{course.title_of_course}</h5>
                                            <p className="card-text">{course.description}</p>
                                            <div className="course-meta">
                                                <small className="text-muted">
                                                    By: {course.creator_first_name} {course.creator_last_name}
                                                </small>
                                                <div className="progress mt-2" style={{height: '8px'}}>
                                                    <div 
                                                        className={`progress-bar ${
                                                            course.progress_percentage === 100 ? 'bg-success' : 'bg-primary'
                                                        }`} 
                                                        style={{width: `${course.progress_percentage || 0}%`}}
                                                    ></div>
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center mt-1">
                                                    <small className="text-muted">
                                                        {course.progress_percentage === 100 ? 'Completed' : `${course.progress_percentage || 0}% Complete`}
                                                    </small>
                                                    <div className="badge bg-success">Active</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="carousel-nav right" onClick={() => scrollRight(trackRef2, setCurrentPosition2)}>&gt;</button>
                        </div>
                    ) : (
                        <div className="alert alert-info">
                            {courseFilter === 'completed' 
                                ? "You haven't completed any active courses yet."
                                : courseFilter === 'in-progress'
                                ? "You don't have any active courses in progress."
                                : "You haven't subscribed to any active courses yet. Check out the recommended courses below!"
                            }
                        </div>
                    )}

                    {/* Recommended Courses by Department Section */}
                    <div className="d-flex justify-content-between align-items-center mb-4 mt-5">
                        <div>
                            <h4>Recommended Courses for Your Department</h4>
                            {/* <small className="text-muted">Showing only active courses</small> */}
                        </div>
                    </div>
                    {recommendedCourses.length > 0 ? (
                        <div className="carousel-container">
                            <button className="carousel-nav left" onClick={() => scrollLeft(trackRef1, setCurrentPosition1)}>&lt;</button>
                            <div className="carousel-track" ref={trackRef1} style={{ transform: `translateX(${currentPosition1}px)` }}>
                                {recommendedCourses.map(course => (
                                    <div className="card-carousel card-hover" key={course.id} onClick={() => handleCardClick(course.id)} style={{ cursor: 'pointer' }}>
                                        <CourseImage
                                            src={course.image_url || course.image}
                                            fallback="/group.avif"
                                            alt={course.title_of_course}
                                            className="card-img-top"
                                            style={{ height: '200px', objectFit: 'cover' }}
                                        />
                                        <div className="card-body">
                                            <h5 className="card-title">{course.title_of_course}</h5>
                                            <p className="card-text">{course.description}</p>
                                            <div className="course-meta">
                                                <small className="text-muted">
                                                    By: {course.creator_first_name} {course.creator_last_name}
                                                </small>
                                                <div className="d-flex justify-content-between align-items-center mt-2">
                                                    {course.is_subscribed ? (
                                                        <div className="badge bg-success">Subscribed</div>
                                                    ) : (
                                                        <div className="badge bg-primary">Available</div>
                                                    )}
                                                    <div className="badge bg-info">Active</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="carousel-nav right" onClick={() => scrollRight(trackRef1, setCurrentPosition1)}>&gt;</button>
                        </div>
                    ) : (
                        <div className="alert alert-info">
                            No active recommended courses available for your department at the moment.
                        </div>
                    )}
                </div>
            ) : (
                <div className="fullscreen-container">
                    <button className="close-button" onClick={handleCloseCourseDetail}>×</button>
                    <CourseDetailShow courseId={selectedCourseId} onClose={handleCloseCourseDetail} />
                </div>
            )}
        </>
    );
};

export default Dashboard;