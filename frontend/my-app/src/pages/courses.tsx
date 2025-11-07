import React, { useEffect, useRef, useState } from "react";
import '../css/cours.css';
import NewCours from '../component/courses/new_courses';
import api from '../api/api';
import CourseDetail from "../component/courses/formateur/CourseDetail";
import CourseImage from '../component/courses/CourseImage';
import { useNavigate } from 'react-router-dom';
// import getimageUrl from '../component/courses/apprent/CourseDetailShow'

interface Course {
    id: number;
    title_of_course: string;
    description: string;
    image: string;
    image_url: string;
    creator_username: string;
    creator_first_name: string;
    creator_last_name: string;
    created_at?: string;
    updated_at?: string;
    subscriber_count?: number;
    // module_count?: number;
    module_count?:number;
    status?: any;
    department?: string;
}

const Cours = () => {
    const [newProject, setNewProject] = useState(false);
    const [showCourseDetail, setShowCourseDetail] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [myCourses, setMyCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState('all');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [changingStatus, setChangingStatus] = useState<number | null>(null);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);

    const DEPARTMENT_CHOICES = [
        { code: 'F', label: 'Finance' },
        { code: 'H', label: 'Human Resources' },
        { code: 'M', label: 'Marketing' },
        { code: 'O', label: 'Operations/Production' },
        { code: 'S', label: 'Sales' }
    ];

    const STATUS_CHOICES = [
        { value: 'Brouillon', label: 'Brouillon', color: '#F59E0B', numeric: 0 },
        { value: 'Actif', label: 'Actif', color: '#10B981', numeric: 1 },
        { value: 'Archivé', label: 'Archivé', color: '#6B7280', numeric: 2 }
    ];
    const BASE_URL = 'http://localhost:8000';
    // Close dropdown when clicking outside
    const getimageUrl = (contentOrPath:  string | undefined): string | undefined => {
    if (!contentOrPath) return undefined;

    let imagePath: string | undefined;

    if (typeof contentOrPath === 'string') {
      imagePath = contentOrPath;
    } else {
      imagePath = (contentOrPath as any).image_url;
    }

    if (!imagePath) return undefined;

    let url = imagePath.replace('http://backend:8000', BASE_URL);

    if (!url.startsWith('http')) {
      url = `${BASE_URL}${url}`;
    }

    return url;
  };
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('[data-menu-container]')) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Add the edit course handler
    const handleEditCourse = (courseId: number) => {
        console.log('Edit course requested:', courseId);
        alert(`Edit course with ID: ${courseId}`);
    };

    // Fetch user's created courses
    const fetchMyCourses = async () => {
        try {
            setLoading(true);
            const response = await api.get('courses/my-courses/');
            console.log('Courses data:', response.data);
            setMyCourses(response.data);
            setError('');
        } catch (error: any) {
            console.error('Failed to fetch courses:', error);
            setError('Failed to load your courses. Please check if the backend server is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyCourses();
    }, []);

    useEffect(() => {
        if (!newProject && !showCourseDetail) {
            fetchMyCourses();
        }
    }, [newProject, showCourseDetail]);

    const createNewProject = () => {
        setNewProject(!newProject);
    };

    const handleCardClick = (courseId: number) => {
        setSelectedCourseId(courseId);
        navigate(`/formations/${courseId}`);
        setShowCourseDetail(true);
    };

    const handleCloseCourseDetail = () => {
        setShowCourseDetail(false);
        setSelectedCourseId(null);
    };

    // Safe status value extraction
    const getStatusValue = (status: any): string => {
        if (!status && status !== 0) return '';
        
        if (typeof status === 'number') {
            const statusMap: { [key: number]: string } = {
                0: 'Brouillon',
                1: 'Actif', 
                2: 'Archivé'
            };
            return statusMap[status] || '';
        }
        
        if (typeof status === 'string') {
            return status;
        }
        
        if (typeof status === 'object' && status.value) {
            return String(status.value);
        }
        
        if (typeof status === 'object') {
            return String(status.name || status.status || status.id || '');
        }
        
        return String(status);
    };

    // Safe status color getter
    const getStatusColor = (status: any) => {
        const statusValue = getStatusValue(status);
        const statusChoice = STATUS_CHOICES.find(s => s.value === statusValue);
        return statusChoice ? statusChoice.color : '#6B7280';
    };

    // Safe status label getter
    const getStatusLabel = (status: any) => {
        const statusValue = getStatusValue(status);
        const statusChoice = STATUS_CHOICES.find(s => s.value === statusValue);
        return statusChoice ? statusChoice.label : 'Non défini';
    };

    const getDepartmentLabel = (code?: string | null) => {
        if (!code) return '';
        const dept = DEPARTMENT_CHOICES.find(d => d.code === code);
        return dept ? dept.label : code;
    };

    const handleChangeStatus = async (courseId: number, newStatus: string) => {
        console.log(`Changing course ${courseId} to status: ${newStatus}`);
        setChangingStatus(courseId);
        setOpenMenuId(null);
        
        try {
            // Find the status choice to get numeric value
            const statusChoice = STATUS_CHOICES.find(s => s.value === newStatus);
            
            if (!statusChoice) {
                throw new Error(`Invalid status: ${newStatus}`);
            }

            const response = await api.patch(`courses/${courseId}/`, {
                status: statusChoice.numeric
            });

            if (response.status === 200) {
                // Update local state with numeric status (backend returns numeric)
                setMyCourses(prev => prev.map(course =>
                    course.id === courseId
                        ? { ...course, status: statusChoice.numeric }
                        : course
                ));
                alert('Statut mis à jour avec succès');
            } else {
                throw new Error('Failed to update status');
            }
        } catch (err: any) {
            console.error('Error updating course status:', err);
            const errorMessage = err.response?.data?.error || 'Erreur lors de la mise à jour du statut';
            alert(errorMessage);
        } finally {
            setChangingStatus(null);
        }
    };

    const handleCourseAction = async (courseId: number, action: string) => {
        console.log(`${action} course ${courseId}`);
        setOpenMenuId(null);
        
        try {
            switch (action) {
                // case 'delete':
                //     if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) {
                //         return;
                //     }
                    
                //     const deleteResponse = await api.delete(`courses/${courseId}/`);

                //     if (deleteResponse.status === 200 || deleteResponse.status === 204) {
                //         setMyCourses(prev => prev.filter(course => course.id !== courseId));
                //         alert('Formation supprimée avec succès');
                //     } else {
                //         throw new Error('Failed to delete course');
                //     }
                //     break;

                case 'edit':
                    const courseToEdit = myCourses.find(course => course.id === courseId);
                    if (courseToEdit) {
                        setEditingCourse(courseToEdit);
                    }
                    break;

                case 'view':
                    navigate(`/cours/${courseId}`);
                    break;

                case 'duplicate':
                    const duplicateResponse = await api.post(`courses/${courseId}/duplicate/`);
                    if (duplicateResponse.status === 200 || duplicateResponse.status === 201) {
                        alert('Formation dupliquée avec succès');
                        fetchMyCourses();
                    }
                    break;

                case 'show_students':
                    // Implement show students functionality
                    alert(`Afficher les étudiants pour le cours ${courseId}`);
                    break;

                case 'subscribe':
                    // Implement subscribe functionality
                    alert(`S'inscrire au cours ${courseId}`);
                    break;

                default:
                    console.log('Unknown action:', action);
            }
        } catch (err: any) {
            console.error('Error performing course action:', err);
            const errorMessage = err.response?.data?.error || err.message || 'Action failed';
            setError(errorMessage);
            alert('Une erreur est survenue. Veuillez réessayer.');
        }
    };

    // Filter logic with safe status handling
    const filteredCourses = myCourses.filter(course => {
        const courseStatus = getStatusValue(course.status);
        const matchesStatus = statusFilter === 'all' || courseStatus === statusFilter;

        const courseDepartment = course.department || '';
        const matchesDepartment = departmentFilter === 'all' || courseDepartment === departmentFilter;

        return matchesStatus && matchesDepartment;
    });

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.currentTarget;
        const parent = target.parentElement;
        if (parent) {
            parent.innerHTML = `
                <div style="width: 50px; height: 50px; background-color: #E5E7EB; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #9CA3AF; font-size: 1.5rem;">
                    📚
                </div>
            `;
        }
    };

    // Edit Course Modal Component
    const EditCourseModal = () => {
        const [formData, setFormData] = useState({
            title_of_course: editingCourse?.title_of_course || '',
            description: editingCourse?.description || '',
            department: editingCourse?.department || '',
            status: typeof editingCourse?.status === 'number' ? editingCourse.status : 0
        });
        const [saving, setSaving] = useState(false);

        const handleSave = async () => {
            try {
                setSaving(true);
                const response = await api.patch(`courses/${editingCourse?.id}/`, formData);
                
                if (response.status === 200) {
                    // Update local state
                    setMyCourses(prev => prev.map(course =>
                        course.id === editingCourse?.id
                            ? { 
                                ...course, 
                                title_of_course: formData.title_of_course,
                                description: formData.description,
                                department: formData.department,
                                status: formData.status
                            }
                            : course
                    ));
                    alert('Formation modifiée avec succès');
                    setEditingCourse(null);
                }
            } catch (err: any) {
                console.error('Error updating course:', err);
                const errorMessage = err.response?.data?.error || 'Erreur lors de la modification de la formation';
                alert(errorMessage);
            } finally {
                setSaving(false);
            }
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            setFormData(prev => ({
                ...prev,
                [name]: name === 'status' ? parseInt(value) : value
            }));
        };

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '2rem',
                    maxWidth: '600px',
                    width: '95%',
                    maxHeight: '90vh',
                    overflow: 'auto'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.5rem',
                        borderBottom: '1px solid #E5E7EB',
                        paddingBottom: '1rem'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
                            Modifier la formation
                        </h3>
                        <button
                            onClick={() => setEditingCourse(null)}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                color: '#6B7280',
                                padding: '0.5rem',
                                borderRadius: '4px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            ×
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                                Titre de la formation *
                            </label>
                            <input
                                type="text"
                                name="title_of_course"
                                value={formData.title_of_course}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #D1D5DB',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem'
                                }}
                                placeholder="Entrez le titre de la formation"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                                Description *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #D1D5DB',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    resize: 'vertical'
                                }}
                                placeholder="Entrez la description de la formation"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                                Département
                            </label>
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #D1D5DB',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    backgroundColor: 'white'
                                }}
                            >
                                <option value="">Sélectionnez un département</option>
                                {DEPARTMENT_CHOICES.map(dept => (
                                    <option key={dept.code} value={dept.code}>{dept.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                                Statut
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #D1D5DB',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    backgroundColor: 'white'
                                }}
                            >
                                {STATUS_CHOICES.map(status => (
                                    <option key={status.numeric} value={status.numeric}>{status.label}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <button
                                onClick={() => setEditingCourse(null)}
                                style={{
                                    backgroundColor: '#6B7280',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4B5563'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6B7280'}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !formData.title_of_course || !formData.description}
                                style={{
                                    backgroundColor: saving ? '#9CA3AF' : '#4338CA',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (!saving) {
                                        e.currentTarget.style.backgroundColor = '#3730A3';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!saving) {
                                        e.currentTarget.style.backgroundColor = '#4338CA';
                                    }
                                }}
                            >
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '8px', 
                    padding: '3rem', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                    <div style={{ fontSize: '1rem', fontWeight: '500', color: '#374151' }}>
                        Chargement de vos formations...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            {editingCourse && <EditCourseModal />}
            
            {!newProject && !showCourseDetail ? (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    {/* Header with filters and button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1F2937', margin: 0 }}>
                                {filteredCourses.length} formation{filteredCourses.length !== 1 ? 's' : ''} créée{filteredCourses.length !== 1 ? 's' : ''}
                            </h2>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{
                                    backgroundColor: '#EEF2FF',
                                    border: '1px solid #C7D2FE',
                                    borderRadius: '6px',
                                    padding: '0.5rem 2rem 0.5rem 0.75rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: '#4338CA',
                                    cursor: 'pointer',
                                    appearance: 'none',
                                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%234338CA\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 0.5rem center',
                                    minWidth: '180px'
                                }}
                            >
                                <option value="all">Statut &gt; Tous</option>
                                <option value="Actif">Actif</option>
                                <option value="Brouillon">Brouillon</option>
                                <option value="Archivé">Archivé</option>
                            </select>
                            
                            {/* Department Filter */}
                            <select
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                                style={{
                                    backgroundColor: '#EEF2FF',
                                    border: '1px solid #C7D2FE',
                                    borderRadius: '6px',
                                    padding: '0.5rem 2rem 0.5rem 0.75rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: '#4338CA',
                                    cursor: 'pointer',
                                    appearance: 'none',
                                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%234338CA\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 0.5rem center',
                                    minWidth: '220px'
                                }}
                            >
                                <option value="all">Département &gt; Tous</option>
                                {DEPARTMENT_CHOICES.map(dept => (
                                    <option key={dept.code} value={dept.code}>{dept.label}</option>
                                ))}
                            </select>

                            {/* New Course Button */}
                            <button
                                onClick={createNewProject}
                                style={{
                                    backgroundColor: '#4338CA',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.625rem 1.25rem',
                                    borderRadius: '6px',
                                    fontSize: '0.9375rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3730A3'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4338CA'}
                            >
                                + Nouvelle formation
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            backgroundColor: '#FEF2F2',
                            border: '1px solid #FECACA',
                            borderRadius: '6px',
                            padding: '1rem',
                            marginBottom: '1.5rem',
                            color: '#DC2626'
                        }}>
                            <strong>Erreur:</strong> {error}
                            <br />
                            <small style={{ color: '#EF4444' }}>
                                Assurez-vous que votre serveur backend fonctionne sur http://localhost:8000
                            </small>
                        </div>
                    )}

                    {/* Courses Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#E5E7EB' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Image</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Titre de la formation</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Créateur</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Étudiants</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Modules</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Créé le</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Statut</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCourses.length > 0 ? (
                                    filteredCourses.map((course, index) => {
                                        const courseStatusValue = getStatusValue(course.status);
                                        const statusColor = getStatusColor(course.status);
                                        const statusLabel = getStatusLabel(course.status);
                                        
                                        return (
                                            <tr
                                                key={course.id}
                                                style={{
                                                    borderBottom: '1px solid #E5E7EB',
                                                    backgroundColor: index % 2 === 0 ? 'white' : '#F9FAFB',
                                                    transition: 'background-color 0.2s',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#F9FAFB'}
                                                onClick={() => handleCardClick(course.id)}
                                            >
                                                <td style={{ padding: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
                                                    {course.image_url ? (
                                                        <img
                                                            src={getimageUrl(course.image_url)}                                                      alt={course.title_of_course}
                                                            style={{
                                                                width: '50px',
                                                                height: '50px',
                                                                objectFit: 'cover',
                                                                borderRadius: '6px',
                                                                border: '1px solid #E5E7EB'
                                                            }}
                                                            onError={handleImageError}
                                                        />
                                                    ) : (
                                                        <div style={{
                                                            width: '50px',
                                                            height: '50px',
                                                            backgroundColor: '#E5E7EB',
                                                            borderRadius: '6px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#9CA3AF',
                                                            fontSize: '1.5rem'
                                                        }}>
                                                            📚
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <div style={{ fontWeight: '500', color: '#1F2937' }}>
                                                        {course.title_of_course}
                                                    </div>
                                                    {course.department && (
                                                        <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                                                            {getDepartmentLabel(course.department)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem', color: '#6B7280' }}>
                                                    {course.creator_first_name} {course.creator_last_name}
                                                </td>
                                                <td style={{ padding: '0.75rem', color: '#1F2937', textAlign: 'center' }}>
                                                    <span 
                                                        style={{
                                                            backgroundColor: '#EEF2FF',
                                                            color: '#4338CA',
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '12px',
                                                            fontSize: '0.8125rem',
                                                            fontWeight: '500',
                                                            cursor: 'pointer',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleCourseAction(course.id, 'show_students');
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E0E7FF'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EEF2FF'}
                                                        title="Afficher tous les étudiants"
                                                    >
                                                        {course.subscriber_count || 0} étudiant{(course.subscriber_count || 0) !== 1 ? 's' : ''}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem', color: '#1F2937', textAlign: 'center' }}>
                                                    {course.module_count || 0}
                                                </td>
                                                <td style={{ padding: '0.75rem', color: '#6B7280' }}>
                                                    {course.created_at ? new Date(course.created_at).toLocaleDateString('fr-FR', { 
                                                        day: '2-digit', 
                                                        month: 'short', 
                                                        year: 'numeric' 
                                                    }) : 'N/A'}
                                                </td>
                                                <td style={{ padding: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
                                                    {changingStatus === course.id ? (
                                                        <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                                                            Mise à jour...
                                                        </span>
                                                    ) : (
                                                        <span style={{
                                                            color: statusColor,
                                                            fontWeight: '500',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem'
                                                        }}>
                                                            <span style={{
                                                                width: '6px',
                                                                height: '6px',
                                                                borderRadius: '50%',
                                                                backgroundColor: statusColor
                                                            }}></span>
                                                            {statusLabel}
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                                                    <div data-menu-container style={{ position: 'relative', display: 'inline-block' }}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setOpenMenuId(openMenuId === course.id ? null : course.id);
                                                            }}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                color: '#6B7280',
                                                                fontSize: '1.25rem',
                                                                padding: '0.25rem 0.5rem',
                                                                borderRadius: '4px',
                                                                transition: 'background-color 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        >
                                                            ⋯
                                                        </button>
                                                        
                                                        {openMenuId === course.id && (
                                                            <div 
                                                                style={{
                                                                    position: 'absolute',
                                                                    right: '0',
                                                                    top: '100%',
                                                                    backgroundColor: 'white',
                                                                    border: '1px solid #E5E7EB',
                                                                    borderRadius: '6px',
                                                                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                                                                    zIndex: 1000,
                                                                    minWidth: '250px',
                                                                    marginTop: '0.25rem'
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {/* Student Actions */}
                                                                <div style={{ padding: '0.5rem 0', borderBottom: '1px solid #E5E7EB' }}>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            handleCourseAction(course.id, 'show_students');
                                                                        }}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '0.75rem 1rem',
                                                                            textAlign: 'left',
                                                                            border: 'none',
                                                                            backgroundColor: 'transparent',
                                                                            cursor: 'pointer',
                                                                            fontSize: '0.875rem',
                                                                            color: '#374151',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '0.5rem',
                                                                            transition: 'background-color 0.2s'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                    >
                                                                        👥 Afficher tous les étudiants
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            handleCourseAction(course.id, 'subscribe');
                                                                        }}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '0.75rem 1rem',
                                                                            textAlign: 'left',
                                                                            border: 'none',
                                                                            backgroundColor: 'transparent',
                                                                            cursor: 'pointer',
                                                                            fontSize: '0.875rem',
                                                                            color: '#374151',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '0.5rem',
                                                                            transition: 'background-color 0.2s'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                    >
                                                                        📝 S'inscrire à ce cours
                                                                    </button>
                                                                </div>

                                                                {/* Status Change Options */}
                                                                <div style={{ padding: '0.5rem 0', borderBottom: '1px solid #E5E7EB' }}>
                                                                    <div style={{ padding: '0.25rem 1rem', fontSize: '0.75rem', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase' }}>
                                                                        Changer le statut
                                                                    </div>
                                                                    {STATUS_CHOICES.map((status) => (
                                                                        <button
                                                                            key={status.value}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                handleChangeStatus(course.id, status.value);
                                                                            }}
                                                                            disabled={courseStatusValue === status.value}
                                                                            style={{
                                                                                width: '100%',
                                                                                padding: '0.5rem 1rem',
                                                                                textAlign: 'left',
                                                                                border: 'none',
                                                                                backgroundColor: courseStatusValue === status.value ? '#F3F4F6' : 'transparent',
                                                                                cursor: courseStatusValue === status.value ? 'default' : 'pointer',
                                                                                fontSize: '0.875rem',
                                                                                color: status.color,
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '0.5rem',
                                                                                opacity: courseStatusValue === status.value ? 0.5 : 1,
                                                                                transition: 'background-color 0.2s'
                                                                            }}
                                                                            onMouseEnter={(e) => {
                                                                                if (courseStatusValue !== status.value) {
                                                                                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                                                                                }
                                                                            }}
                                                                            onMouseLeave={(e) => {
                                                                                if (courseStatusValue !== status.value) {
                                                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                                                }
                                                                            }}
                                                                        >
                                                                            <span style={{
                                                                                width: '8px',
                                                                                height: '8px',
                                                                                borderRadius: '50%',
                                                                                backgroundColor: status.color
                                                                            }}></span>
                                                                            {status.label}
                                                                        </button>
                                                                    ))}
                                                                </div>

                                                                {/* Other Actions */}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleCourseAction(course.id, 'edit');
                                                                    }}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '0.75rem 1rem',
                                                                        textAlign: 'left',
                                                                        border: 'none',
                                                                        backgroundColor: 'transparent',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.875rem',
                                                                        color: '#374151',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.5rem',
                                                                        transition: 'background-color 0.2s'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                >
                                                                    ✏️ Modifier la formation
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleCourseAction(course.id, 'view');
                                                                    }}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '0.75rem 1rem',
                                                                        textAlign: 'left',
                                                                        border: 'none',
                                                                        backgroundColor: 'transparent',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.875rem',
                                                                        color: '#374151',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.5rem',
                                                                        transition: 'background-color 0.2s'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                >
                                                                    👁️ Voir les détails
                                                                </button>
                                                                {/* <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleCourseAction(course.id, 'duplicate');
                                                                    }}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '0.75rem 1rem',
                                                                        textAlign: 'left',
                                                                        border: 'none',
                                                                        backgroundColor: 'transparent',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.875rem',
                                                                        color: '#374151',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.5rem',
                                                                        transition: 'background-color 0.2s'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                >
                                                                    📋 Dupliquer
                                                                </button>
                                                                <hr style={{ margin: '0.25rem 0', border: 'none', borderTop: '1px solid #E5E7EB' }} />
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleCourseAction(course.id, 'delete');
                                                                    }}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '0.75rem 1rem',
                                                                        textAlign: 'left',
                                                                        border: 'none',
                                                                        backgroundColor: 'transparent',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.875rem',
                                                                        color: '#DC2626',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.5rem',
                                                                        transition: 'background-color 0.2s'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                >
                                                                    🗑️ Supprimer
                                                                </button> */}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
                                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                                            <div style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>Aucune formation trouvée</div>
                                            <div style={{ fontSize: '0.875rem' }}>Essayez de modifier vos filtres ou créez une nouvelle formation</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Load More Button */}
                    {filteredCourses.length > 0 && (
                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            <button
                                style={{
                                    backgroundColor: '#8B5A3C',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 2rem',
                                    borderRadius: '6px',
                                    fontSize: '0.9375rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#78472A'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8B5A3C'}
                            >
                                Afficher plus de résultat
                            </button>
                        </div>
                    )}
                </div>
            ) : showCourseDetail ? (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'white',
                    zIndex: 1000,
                    overflow: 'auto'
                }}>
                    <button 
                        onClick={handleCloseCourseDetail}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            backgroundColor: '#6B7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            zIndex: 1001,
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4B5563'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6B7280'}
                    >
                        ×
                    </button>
                    {/* Fixed: Added the missing onEditCourse prop */}
                    {/* <CourseDetail 
                        courseId={selectedCourseId} 
                        onClose={handleCloseCourseDetail}
                        onEditCourse={handleEditCourse}
                    /> */}
                </div>
            ) : (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'white',
                    zIndex: 1000,
                    overflow: 'auto'
                }}>
                    <button 
                        onClick={createNewProject}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            backgroundColor: '#6B7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            zIndex: 1001,
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4B5563'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6B7280'}
                    >
                        ×
                    </button>
                    <NewCours onCourseCreated={() => setNewProject(false)} />
                </div>
            )}
        </div>
    );
};

export default Cours;