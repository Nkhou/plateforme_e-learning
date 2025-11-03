import React, { useRef, useState, useEffect } from "react";
import api from '../../api/api';
import CourseImage from "../courses/CourseImage";
import { useNavigate } from 'react-router-dom';

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
    status?: number;
    status_display?: string;
    // New fields from backend
    module_count?: number;
    total_duration_minutes?: number;
    enrolled_learners_count?: number;
}

interface CourseLog {
    id: number;
    title_of_course: string;
    status?: number;
    department?: string;
}

const Dashboard = () => {
    const scrollContainer1 = useRef<HTMLDivElement>(null);
    const scrollContainer2 = useRef<HTMLDivElement>(null);
    const [myCourses, setMyCourses] = useState<Course[]>([]);
    const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Filter only active courses (status = 1)
    const filterActiveCourses = (courses: Course[]): Course[] => {
        console.log('Filtering courses. Total courses:', courses.length);
        const activeCourses = courses.filter(course => {
            console.log('Course:', course.id, course.title_of_course, 'Status:', course.status);
            return course.status === 1;
        });
        console.log('Active courses after filtering:', activeCourses.length);
        return activeCourses;
    };

    // Format duration from minutes to "Xh Ym" format
    const formatDuration = (minutes: number | undefined): string => {
        if (!minutes) return '1h 55m';
        
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours === 0) return `${mins}m`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}m`;
    };

    // Fetch course details including modules, duration, and learners
    const fetchCourseDetails = async (courseId: number): Promise<Course> => {
        try {
            console.log('Fetching details for course:', courseId);
            const response = await api.get(`courses/${courseId}/`);
            console.log('Course details response:', response.data);
            return response.data;
        } catch (error) {
            console.error(`Error fetching details for course ${courseId}:`, error);
            // Return default values if API fails
            return {
                id: courseId,
                module_count: 5,
                total_duration_minutes: 115,
                enrolled_learners_count: 32
            } as Course;
        }
    };

    // Subscribe to a course
    const subscribeToCourse = async (courseId: number) => {
        try {
            console.log('Subscribing to course:', courseId);
            const response = await api.post(`courses/${courseId}/subscribe/`);
            
            if (response.status === 201 || response.status === 200) {
                // Fetch the course details that was just subscribed to
                const courseDetails = await fetchCourseDetails(courseId);
                
                // Add the course to myCourses with progress
                const subscribedCourse = {
                    ...courseDetails,
                    is_subscribed: true,
                    progress_percentage: 0
                };
                
                setMyCourses(prev => [...prev, subscribedCourse]);
                
                // Remove from recommended
                setRecommendedCourses(prev => 
                    prev.filter(course => course.id !== courseId)
                );
                
                console.log(`Successfully subscribed to course ${courseId}`);
                
                // Show success message
                alert(`Vous êtes maintenant inscrit à "${courseDetails.title_of_course}"`);
            }
        } catch (error: any) {
            console.error("Error subscribing to course:", error);
            alert(`Failed to subscribe to course. Error: ${error.response?.data?.message || 'Unknown error'}`);
        }
    };

    // Fetch user's subscribed courses (Formations en cours)
    const fetchMyCourses = async () => {
        try {
            console.log('Fetching my subscribed courses...');
            const response = await api.get('courses/my-subscriptions/');
            console.log('My subscribed courses API response:', response);
            console.log('My subscribed courses data:', response.data);
            
            if (!response.data) {
                console.log('No data in my-subscriptions response');
                return [];
            }

        // Check if response.data is an array
        if (!Array.isArray(response.data)) {
            console.log('My subscribed courses response is not an array:', typeof response.data);
            console.log('Response structure:', response.data);
            // Try to extract courses from different possible response structures
            if (response.data.courses && Array.isArray(response.data.courses)) {
                console.log('Found courses in response.data.courses');
                response.data = response.data.courses;
            } else if (response.data.results && Array.isArray(response.data.results)) {
                console.log('Found courses in response.data.results');
                response.data = response.data.results;
            } else {
                console.log('Cannot find courses array in response');
                return [];
            }
        }
        
        console.log('Processing my subscribed courses:', response.data.length);
        
        // Filter active courses and fetch details for each
        const activeCourses = filterActiveCourses(response.data);
        console.log('Active my subscribed courses after filtering:', activeCourses);
        
        const coursesWithDetails = await Promise.all(
            activeCourses.map(async (course: Course) => {
                console.log('Processing subscribed course:', course.id, course.title_of_course);
                const details = await fetchCourseDetails(course.id);
                return { 
                    ...course, 
                    ...details,
                    progress_percentage: course.progress_percentage || 0,
                    is_subscribed: true // Mark as subscribed
                };
            })
        );
        
        console.log('Final my subscribed courses with details:', coursesWithDetails);
        setMyCourses(coursesWithDetails);
        return coursesWithDetails;
    } catch (error: any) {
        console.error("Error fetching my subscribed courses:", error);
        console.error("Error details:", error.response);
        setError(`Failed to load your courses. Error ${error.response?.status}: ${error.response?.statusText}`);
        return [];
    }
};

    // Fetch recommended courses
    const fetchRecommendedCourses = async (myCourseIds: number[] = []) => {
        try {
            console.log('Fetching recommended courses...');
            const response = await api.get('courses/recommended/');
            console.log('Recommended courses API response:', response);
            console.log('Recommended courses data:', response.data);
            
            if (!response.data) {
                console.log('No data in recommended courses response');
                return;
            }

            // Check if response.data is an array
            if (!Array.isArray(response.data)) {
                console.log('Recommended courses response is not an array:', typeof response.data);
                console.log('Response structure:', response.data);
                // Try to extract courses from different possible response structures
                if (response.data.courses && Array.isArray(response.data.courses)) {
                    console.log('Found courses in response.data.courses');
                    response.data = response.data.courses;
                } else if (response.data.results && Array.isArray(response.data.results)) {
                    console.log('Found courses in response.data.results');
                    response.data = response.data.results;
                } else {
                    console.log('Cannot find courses array in response');
                    return;
                }
            }
            
            console.log('Processing recommended courses:', response.data.length);
            
            // Filter active courses and exclude already subscribed ones
            const activeCourses = filterActiveCourses(response.data);
            console.log('Active recommended courses after filtering:', activeCourses);
            
            const filteredRecommended = activeCourses.filter(
                course => !myCourseIds.includes(course.id)
            );
            
            console.log('Recommended courses after filtering subscribed ones:', filteredRecommended);
            
            // Fetch details for recommended courses
            const recommendedWithDetails = await Promise.all(
                filteredRecommended.map(async (course: Course) => {
                    const details = await fetchCourseDetails(course.id);
                    return { ...course, ...details };
                })
            );
            
            console.log('Final recommended courses with details:', recommendedWithDetails);
            setRecommendedCourses(recommendedWithDetails);
        } catch (error: any) {
            console.error("Error fetching recommended courses:", error);
            console.error("Error details:", error.response);
            setError(`Failed to load recommended courses. Error ${error.response?.status}: ${error.response?.statusText}`);
        }
    };

    // Fetch all courses from backend
    const fetchCourses = async () => {
        try {
            setLoading(true);
            console.log('Starting to fetch all courses...');
            
            // First fetch user's courses
            const myCoursesData = await fetchMyCourses();
            const myCourseIds = myCoursesData.map(course => course.id);
            console.log('My course IDs:', myCourseIds);
            
            // Then fetch recommended courses (excluding already subscribed ones)
            await fetchRecommendedCourses(myCourseIds);
            
            console.log('Finished fetching all courses');
            console.log('My courses state:', myCoursesData);
            console.log('Recommended courses state:', recommendedCourses);
            
        } catch (error: any) {
            console.error("Error fetching courses:", error);
            setError(`Failed to load courses. Error ${error.response?.status}: ${error.response?.statusText}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const scrollLeft = (ref: React.RefObject<HTMLDivElement | null>) => {
        if (ref.current) {
            ref.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRight = (ref: React.RefObject<HTMLDivElement | null>) => {
        if (ref.current) {
            ref.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    const handleCardClick = (courseId: number) => {
        navigate(`/cours/${courseId}`);
    };

    const handleSubscribeClick = async (courseId: number, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent card click navigation
        await subscribeToCourse(courseId);
    };

    // Debug component to see what's happening
    const DebugInfo = () => (
        <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '10px', 
            margin: '10px 0', 
            border: '1px solid #ddd',
            fontSize: '12px'
        }}>
            <strong>Debug Info:</strong><br />
            My Courses Count: {myCourses.length}<br />
            Recommended Courses Count: {recommendedCourses.length}<br />
            Loading: {loading ? 'Yes' : 'No'}<br />
            Error: {error || 'None'}
        </div>
    );

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
            <DebugInfo />
        </div>
    );

    return (
        <div style={{ 
            padding: '2rem 3rem',
            backgroundColor: '#f8f9fa',
            minHeight: '100vh'
        }}>
            <style>
                {`
                    .scroll-container::-webkit-scrollbar {
                        display: none;
                    }
                    .course-image-container {
                        position: relative;
                        width: 100%;
                        padding-bottom: 40%; /* Increased from 100% to 120% to make images taller */
                        overflow: hidden;
                    }
                    .course-image {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                `}
            </style>

            {/* Debug information - remove in production */}
            <DebugInfo />

            {/* My Courses Section - Formations en cours */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#1a1a1a' }}>
                        Formations en cours
                    </h3>
                    {/* <p style={{ fontSize: '0.95rem', color: '#666', marginBottom: '0' }}>
                        Continuez votre apprentissage là où vous vous étiez arrêté
                    </p> */}
                </div>
                {myCourses.length > 0 && (
                    <div className="d-flex gap-2">
                        <button 
                            className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
                            onClick={() => scrollLeft(scrollContainer2)}
                            style={{ 
                                width: '40px', 
                                height: '40px',
                                border: '1px solid #e0e0e0',
                                fontSize: '1.5rem',
                                padding: '0'
                            }}
                        >
                            ‹
                        </button>
                        <button 
                            className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
                            onClick={() => scrollRight(scrollContainer2)}
                            style={{ 
                                width: '40px', 
                                height: '40px',
                                border: '1px solid #e0e0e0',
                                fontSize: '1.5rem',
                                padding: '0'
                            }}
                        >
                            ›
                        </button>
                    </div>
                )}
            </div>

            {myCourses.length > 0 ? (
                <div 
                    ref={scrollContainer2}
                    className="d-flex gap-3 mb-5 scroll-container" 
                    style={{ 
                        overflowX: 'auto', 
                        scrollBehavior: 'smooth',
                        paddingBottom: '1rem',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}
                >
                    {myCourses.map(course => (
                        <div 
                            key={course.id} 
                            onClick={() => handleCardClick(course.id)} 
                            style={{ 
                                cursor: 'pointer',
                                minWidth: '260px',
                                maxWidth: '260px',
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                            }}
                        >
                            <div style={{ position: 'relative' }}>
                                <div className="course-image-container">
                                    <CourseImage
                                        src={course.image_url || course.image}
                                        fallback="/group.avif"
                                        alt={course.title_of_course}
                                        className="course-image"
                                        style={{ 
                                            backgroundColor: '#E8E8F5'
                                        }}
                                    />
                                </div>
                                <div style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    left: 0,
                                    right: 0,
                                    height: '6px',
                                    background: `linear-gradient(90deg, 
                                        #C85B3C ${course.progress_percentage || 0}%, 
                                        transparent ${course.progress_percentage || 0}%)`
                                }}></div>
                            </div>
                            <div style={{ padding: '1rem' }}>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <span style={{ 
                                        backgroundColor: '#FFE4D6',
                                        color: '#C85B3C',
                                        fontSize: '0.75rem',
                                        fontWeight: '500',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '6px'
                                    }}>
                                        {course.department || 'Finance dept.'}
                                    </span>
                                    <button 
                                        style={{ 
                                            border: 'none', 
                                            background: 'transparent',
                                            fontSize: '1.25rem',
                                            cursor: 'pointer',
                                            padding: '0',
                                            color: course.progress_percentage === 100 ? '#FFD700' : '#ddd'
                                        }}
                                    >
                                        {course.progress_percentage === 100 ? '★' : '☆'}
                                    </button>
                                </div>
                                <h5 style={{ 
                                    fontSize: '1rem', 
                                    fontWeight: '600',
                                    marginBottom: '0.5rem',
                                    color: '#1a1a1a'
                                }}>
                                    {course.title_of_course}
                                </h5>
                                <p style={{ 
                                    fontSize: '0.875rem',
                                    color: '#666',
                                    marginBottom: '1rem',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    lineHeight: '1.4'
                                }}>
                                    {course.description}
                                </p>
                                <div className="d-flex justify-content-between align-items-center" style={{ 
                                    fontSize: '0.8rem',
                                    color: '#666',
                                    paddingTop: '0.75rem',
                                    borderTop: '1px solid #f0f0f0'
                                }}>
                                    <span>📚 {course.module_count || 5} modules</span>
                                    <span>🕐 {formatDuration(course.total_duration_minutes)}</span>
                                    <span>👥 {course.enrolled_learners_count || 32} apprenants</span>
                                </div>
                                <button 
                                    style={{
                                        width: '100%',
                                        marginTop: '1rem',
                                        backgroundColor: course.progress_percentage === 100 ? '#8B92C4' : '#C85B3C',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '0.625rem',
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'opacity 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                >
                                    {course.progress_percentage === 100 ? 'Relire la formation ?' : 'Continuer la lecture'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="alert alert-info mb-5">
                    <strong>Aucune formation en cours</strong><br />
                    Vous n'êtes pas encore inscrit à des formations. Découvrez nos formations recommandées ci-dessous !
                </div>
            )}

            {/* Recommended Courses Section */}
            <div className="d-flex justify-content-between align-items-center mb-4 mt-5">
                <div>
                    <h3 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#1a1a1a' }}>
                        Formations recommandées
                    </h3>
                    <p style={{ fontSize: '0.95rem', color: '#666', marginBottom: '0' }}>
                        Découvrez de nouvelles formations adaptées à vos besoins
                    </p>
                </div>
                {recommendedCourses.length > 0 && (
                    <div className="d-flex gap-2">
                        <button 
                            className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
                            onClick={() => scrollLeft(scrollContainer1)}
                            style={{ 
                                width: '40px', 
                                height: '40px',
                                border: '1px solid #e0e0e0',
                                fontSize: '1.5rem',
                                padding: '0'
                            }}
                        >
                            ‹
                        </button>
                        <button 
                            className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
                            onClick={() => scrollRight(scrollContainer1)}
                            style={{ 
                                width: '40px', 
                                height: '40px',
                                border: '1px solid #e0e0e0',
                                fontSize: '1.5rem',
                                padding: '0'
                            }}
                        >
                            ›
                        </button>
                    </div>
                )}
            </div>

            {recommendedCourses.length > 0 ? (
                <div 
                    ref={scrollContainer1}
                    className="d-flex gap-3 scroll-container" 
                    style={{ 
                        overflowX: 'auto', 
                        scrollBehavior: 'smooth',
                        paddingBottom: '1rem',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}
                >
                    {recommendedCourses.map(course => (
                        <div 
                            key={course.id} 
                            onClick={() => handleCardClick(course.id)} 
                            style={{ 
                                cursor: 'pointer',
                                minWidth: '260px',
                                maxWidth: '260px',
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                            }}
                        >
                            <div style={{ position: 'relative' }}>
                                <div className="course-image-container">
                                    <CourseImage
                                        src={course.image_url || course.image}
                                        fallback="/group.avif"
                                        alt={course.title_of_course}
                                        className="course-image"
                                        style={{ 
                                            backgroundColor: '#E8E8F5'
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ padding: '1rem' }}>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <span style={{ 
                                        backgroundColor: '#E3F2FD',
                                        color: '#1976D2',
                                        fontSize: '0.75rem',
                                        fontWeight: '500',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '6px'
                                    }}>
                                        {course.department || 'Finance dept.'}
                                    </span>
                                    <button 
                                        style={{ 
                                            border: 'none', 
                                            background: 'transparent',
                                            fontSize: '1.25rem',
                                            cursor: 'pointer',
                                            padding: '0',
                                            color: '#ddd'
                                        }}
                                    >
                                        ☆
                                    </button>
                                </div>
                                <h5 style={{ 
                                    fontSize: '1rem', 
                                    fontWeight: '600',
                                    marginBottom: '0.5rem',
                                    color: '#1a1a1a'
                                }}>
                                    {course.title_of_course}
                                </h5>
                                <p style={{ 
                                    fontSize: '0.875rem',
                                    color: '#666',
                                    marginBottom: '1rem',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    lineHeight: '1.4'
                                }}>
                                    {course.description}
                                </p>
                                <div className="d-flex justify-content-between align-items-center" style={{ 
                                    fontSize: '0.8rem',
                                    color: '#666',
                                    paddingTop: '0.75rem',
                                    borderTop: '1px solid #f0f0f0'
                                }}>
                                    <span>📚 {course.module_count || 5} modules</span>
                                    <span>🕐 {formatDuration(course.total_duration_minutes)}</span>
                                    <span>👥 {course.enrolled_learners_count || 32} apprenants</span>
                                </div>
                                <button 
                                    onClick={(e) => handleSubscribeClick(course.id, e)}
                                    style={{
                                        width: '100%',
                                        marginTop: '1rem',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '0.625rem',
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.opacity = '0.9';
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.opacity = '1';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                >
                                    S'inscrire et commencer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="alert alert-info">
                    Aucune formation recommandée disponible pour votre département pour le moment.
                </div>
            )}
        </div>
    );
};

export default Dashboard;