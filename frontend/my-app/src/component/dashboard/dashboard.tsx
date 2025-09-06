import React, { useRef, useState, useEffect } from "react";
import "./dashboard.css";
import '../../css/cours.css';
import api from '../../api/api';
import CourseDetailShow from "../courses/CourseDetailShow";
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

    // Fetch courses from backend
    const fetchCourses = async () => {
        try {
            setLoading(true);
            
            // Fetch courses I'm subscribed to
            console.log('Fetching my subscribed courses from:', `${api.defaults.baseURL}/courses/my-courses/`);
            const myCoursesRes = await api.get('courses/mysubscriptions/');
            console.log('My courses response:', myCoursesRes.data);
            
            // Fetch recommended courses by department
            console.log('Fetching recommended courses from:', `${api.defaults.baseURL}/courses/recommended/`);
            const recommendedRes = await api.get('courses/recommended/');
            console.log('Recommended courses response:', recommendedRes.data);

            setMyCourses(myCoursesRes.data);
            setRecommendedCourses(recommendedRes.data);
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
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="alert alert-danger">{error}</p>;

    return (
        <>
            {!showCourseDetail ? (
                <div className="dashboard-wrapper">
                    {/* My Subscribed Courses Section */}
                    <h4 className="mb-4">My Courses</h4>
                    {myCourses.length > 0 ? (
                        <div className="carousel-container">
                            <button className="carousel-nav left" onClick={() => scrollLeft(trackRef2, setCurrentPosition2)}>&lt;</button>
                            <div className="carousel-track" ref={trackRef2} style={{ transform: `translateX(${currentPosition2}px)` }}>
                                {myCourses.map(course => (
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
                                                <div className="badge badge-success">Subscribed</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="carousel-nav right" onClick={() => scrollRight(trackRef2, setCurrentPosition2)}>&gt;</button>
                        </div>
                    ) : (
                        <div className="alert alert-info">
                            You haven't subscribed to any courses yet. Check out the recommended courses below!
                        </div>
                    )}

                    {/* Recommended Courses by Department Section */}
                    <h4 className="mb-4 mt-5">Recommended Courses for Your Department</h4>
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
                                                {course.is_subscribed ? (
                                                    <div className="badge badge-success">Subscribed</div>
                                                ) : (
                                                    <div className="badge badge-primary">Available</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="carousel-nav right" onClick={() => scrollRight(trackRef1, setCurrentPosition1)}>&gt;</button>
                        </div>
                    ) : (
                        <div className="alert alert-info">
                            No recommended courses available for your department at the moment.
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