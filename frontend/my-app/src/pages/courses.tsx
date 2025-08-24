import React, { useEffect, useRef, useState } from "react";
import '../css/cours.css';
import NewCours from '../component/courses/new_courses';
import api from '../api/api';
import CourseDetail from "../component/courses/CourseDetail";
import CourseImage from '../component/courses/CourseImage'; // Import the CourseImage component

// In your React component file or a types file
interface Course {
    id: number;
    title_of_course: string;
    description: string;
    image: string;  // Original image field (relative path)
    image_url?: string;  // Optional absolute URL field added by serializer
    creator_username: string;
    creator_first_name: string;
    creator_last_name: string;
    created_at?: string;
    updated_at?: string;
}

const Cours = () => {
    const trackRef1 = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
    const [currentPosition1, setCurrentPosition1] = useState(0);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const [newProject, setNewProject] = useState(false);
    const [showCourseDetail, setShowCourseDetail] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const isDragging = useRef(false);
    const [myCourses, setMyCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch user's created courses
    const fetchMyCourses = async () => {
        try {
            setLoading(true);
            const response = await api.get('courses/my-courses/');
            console.log('Courses data:', response.data);
            setMyCourses(response.data);
            setError(''); // Clear any previous errors
        } catch (error: any) {
            console.error('Failed to fetch courses:', error);
            setError('Failed to load your courses. Please check if the backend server is running.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch courses when component mounts
    useEffect(() => {
        fetchMyCourses();
    }, []);

    // Refresh courses when returning from new course creation
    useEffect(() => {
        if (!newProject && !showCourseDetail) {
            fetchMyCourses();
        }
    }, [newProject, showCourseDetail]);

    // Proper touch event handling with passive listeners
    useEffect(() => {
        const tracks = [trackRef1.current].filter(Boolean);

        const handleTouchStart = (e: TouchEvent) => {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
            isDragging.current = true;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging.current) return;

            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const diffX = touchStartX.current - touchX;
            const diffY = touchStartY.current - touchY;

            if (Math.abs(diffX) > Math.abs(diffY)) {
                e.preventDefault();
                const track = e.currentTarget as HTMLDivElement;
                const cardWidth = track.children[0]?.clientWidth || 300;
                const gap = 16;
                const scrollAmount = cardWidth + gap;

                if (diffX > 0) {
                    // Swipe left
                    setCurrentPosition1(prev => Math.max(prev - scrollAmount, -(track.scrollWidth - track.clientWidth)));
                } else {
                    // Swipe right
                    setCurrentPosition1(prev => Math.min(prev + scrollAmount, 0));
                }
            }
        };

        const handleTouchEnd = () => {
            isDragging.current = false;
        };

        tracks.forEach(track => {
            track?.addEventListener('touchstart', handleTouchStart, { passive: true });
            track?.addEventListener('touchmove', handleTouchMove, { passive: false });
            track?.addEventListener('touchend', handleTouchEnd, { passive: true });
        });

        return () => {
            tracks.forEach(track => {
                track?.removeEventListener('touchstart', handleTouchStart);
                track?.removeEventListener('touchmove', handleTouchMove);
                track?.removeEventListener('touchend', handleTouchEnd);
            });
        };
    }, [myCourses]);

    const scrollLeft = (trackRef: React.RefObject<HTMLDivElement>, setPosition: React.Dispatch<React.SetStateAction<number>>) => {
        if (!trackRef.current) return;
        const cardWidth = trackRef.current.children[0]?.clientWidth || 300;
        const gap = 16;
        const scrollAmount = cardWidth + gap;

        setPosition(prev => {
            const newPosition = prev + scrollAmount;
            return Math.min(newPosition, 0);
        });
    };

    const scrollRight = (trackRef: React.RefObject<HTMLDivElement>, setPosition: React.Dispatch<React.SetStateAction<number>>) => {
        if (!trackRef.current) return;
        const cardWidth = trackRef.current.children[0]?.clientWidth || 300;
        const gap = 16;
        const scrollAmount = cardWidth + gap;
        const maxScroll = trackRef.current.scrollWidth - trackRef.current.clientWidth;

        setPosition(prev => {
            const newPosition = prev - scrollAmount;
            return Math.max(newPosition, -maxScroll);
        });
    };

    const createNewProject = () => {
        setNewProject(!newProject);
    };

    // Handle card click to show course detail component
    const handleCardClick = (courseId: number) => {
        setSelectedCourseId(courseId);
        setShowCourseDetail(true);
    };

    // Handle closing course detail
    const handleCloseCourseDetail = () => {
        setShowCourseDetail(false);
        setSelectedCourseId(null);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            {!newProject && !showCourseDetail ? (
                <div>
                    <button className="button" onClick={createNewProject}>New project</button>
                    
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            <strong>Error:</strong> {error}
                            <br />
                            <small>Make sure your backend server is running on http://localhost:8000</small>
                        </div>
                    )}

                    {myCourses.length === 0 && !error ? (
                        <div className="text-center py-5">
                            <h5>You haven't created any courses yet</h5>
                            <p>Click "New project" to create your first course!</p>
                        </div>
                    ) : myCourses.length > 0 ? (
                        <>
                            <h4 className="mb-4">My Courses</h4>
                            <div className="carousel-container">
                                <button
                                    className="carousel-nav left"
                                    onClick={() => scrollLeft(trackRef1, setCurrentPosition1)}
                                    aria-label="Scroll left"
                                >
                                    &lt;
                                </button>

                                <div
                                    className="carousel-track"
                                    ref={trackRef1}
                                    style={{ transform: `translateX(${currentPosition1}px)` }}
                                >
                                    {myCourses.map((course) => (
                                        <div 
                                      className="card-carousel card-hover" 
                                      key={`my-course-${course.id}`}
                                      onClick={() => handleCardClick(course.id)}
                                      style={{ cursor: 'pointer' }}
                                    >
                                      <CourseImage
                                        src={course.image_url || course.image}  // Use image_url if available, fallback to image
                                        alt={course.title_of_course}
                                        className="card-img-top"
                                        fallbackSrc="/group.avif"
                                        style={{ height: '200px', objectFit: 'cover' }}
                                      />
                                            <div className="card-body">
                                                <h5 className="card-title">{course.title_of_course}</h5>
                                                <p className="card-text">{course.description || 'No description'}</p>
                                                <small className="text-muted">
                                                    Created by: {course.creator_first_name} {course.creator_last_name}
                                                </small>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className="carousel-nav right"
                                    onClick={() => scrollRight(trackRef1, setCurrentPosition1)}
                                    aria-label="Scroll right"
                                >
                                    &gt;
                                </button>
                            </div>
                        </>
                    ) : null}
                </div>
            ) : showCourseDetail ? (
                <div className="fullscreen-container">
                    <button className="close-button" onClick={handleCloseCourseDetail}>
                        ×
                    </button>
                    <CourseDetail courseId={selectedCourseId} onClose={handleCloseCourseDetail} />
                </div>
            ) : (
                <div className="fullscreen-container">
                    <button className="close-button" onClick={createNewProject}>
                        ×
                    </button>
                    <NewCours onCourseCreated={() => setNewProject(false)} />
                </div>
            )}
        </>
    );
};

export default Cours;