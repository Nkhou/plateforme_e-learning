import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import api from '../../api/api';

interface NewCoursProps {
    onCourseCreated?: () => void;
}

// Notification types and components
export type NotificationType = "success" | "info" | "warning" | "error";

type NotificationItem = {
    id: number;
    type: NotificationType;
    title: string;
    message: string;
    duration: number;
};

type NotificationProps = {
    type: NotificationType;
    title: string;
    message: string;
    onClose: () => void;
    duration?: number;
};

type NotificationContainerProps = {
    notifications: NotificationItem[];
    removeNotification: (id: number) => void;
};

const Notification: React.FC<NotificationProps> = ({
    type = "success",
    title,
    message,
    onClose,
    duration = 5000,
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    React.useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => handleClose(), duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose();
        }, 300);
    };

    if (!isVisible) return null;

    const styles: Record<
        NotificationType,
        { titleColor: string; backgroundColor: string; borderColor: string }
    > = {
        success: {
            titleColor: "#10B981",
            backgroundColor: "#1F2937",
            borderColor: "#10B981",
        },
        info: {
            titleColor: "#3B82F6",
            backgroundColor: "#1F2937",
            borderColor: "#3B82F6",
        },
        warning: {
            titleColor: "#F59E0B",
            backgroundColor: "#1F2937",
            borderColor: "#F59E0B",
        },
        error: {
            titleColor: "#EF4444",
            backgroundColor: "#1F2937",
            borderColor: "#EF4444",
        },
    };

    const currentStyle = styles[type];

    return (
        <div
            style={{
                backgroundColor: currentStyle.backgroundColor,
                borderRadius: "12px",
                padding: "20px 24px",
                marginBottom: "16px",
                width: "460px",
                maxWidth: "90vw",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
                borderLeft: `4px solid ${currentStyle.borderColor}`,
                animation: isExiting
                    ? "slideOut 0.3s ease-out forwards"
                    : "slideIn 0.3s ease-out",
                position: "relative",
            }}
        >
            <div style={{ marginBottom: "8px" }}>
                <span
                    style={{
                        color: currentStyle.titleColor,
                        fontSize: "14px",
                        fontWeight: 600,
                        letterSpacing: "0.5px",
                    }}
                >
                    {title}
                </span>
                <span style={{ color: "#9CA3AF", fontSize: "14px", margin: "0 8px" }}>
                    •
                </span>
                <span style={{ color: "#E5E7EB", fontSize: "13px", fontWeight: 400 }}>
                    {type === "success" && "Données enregistrées"}
                    {type === "info" && "Quelques informations à vous communiquer"}
                    {type === "warning" && "Attention à ce que vous avez fait"}
                    {type === "error" && "Informations non enregistrées, réessayer"}
                </span>
            </div>

            <p
                style={{
                    color: "#D1D5DB",
                    fontSize: "13px",
                    lineHeight: "1.6",
                    margin: "0 0 16px 0",
                }}
            >
                {message}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                    onClick={handleClose}
                    style={{
                        backgroundColor: "transparent",
                        border: "none",
                        color: "#F97316",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                        padding: "4px 8px",
                        transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                    Ok, fermer
                </button>
            </div>

            {/* Add inline styles for animations */}
            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};

const NotificationContainer: React.FC<NotificationContainerProps> = ({
    notifications,
    removeNotification,
}) => (
    <div
        style={{
            position: "fixed",
            bottom: "24px",
            left: "24px",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column-reverse",
            gap: "0",
        }}
    >
        {notifications.map((n) => (
            <Notification
                key={n.id}
                type={n.type}
                title={n.title}
                message={n.message}
                duration={n.duration}
                onClose={() => removeNotification(n.id)}
            />
        ))}
    </div>
);

function NewCours({ onCourseCreated }: NewCoursProps) {
    const [error, setError] = useState('');
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    
    // Add notifications state
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    // Notification functions
    const addNotification = (
        type: NotificationType,
        title: string,
        message: string,
        duration: number = 5000
    ) => {
        const id = Date.now();
        setNotifications((prev) => [
            ...prev,
            { id, type, title, message, duration },
        ]);
        console.log('Notification added:', { type, title, message, duration });
    };

    const removeNotification = (id: number) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];

        if (!selectedFile) {
            const errorMsg = 'No file selected.';
            setError(errorMsg);
            addNotification('warning', 'Attention', errorMsg);
            setFile(null);
            setImagePreview(null);
            return;
        }

        // Check file size (2MB limit)
        const maxSize = 2 * 1024 * 1024;
        if (selectedFile.size > maxSize) {
            const errorMsg = 'File is too large. Maximum size is 2MB.';
            setError(errorMsg);
            addNotification('error', 'Erreur', errorMsg);
            setFile(null);
            setImagePreview(null);
            return;
        }

        // Supported image types
        const supportedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml'
        ];

        const isImage = supportedTypes.includes(selectedFile.type) ||
            /\.(jpe?g|png|gif|webp|svg)$/i.test(selectedFile.name);

        if (!isImage) {
            const errorMsg = 'Invalid file type. Only image files are allowed.';
            setError(errorMsg);
            addNotification('error', 'Erreur', errorMsg);
            setFile(null);
            setImagePreview(null);
            return;
        }

        // If all checks pass
        setError('');
        setFile(selectedFile);

        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
        
        addNotification('success', 'Succès', 'Image sélectionnée avec succès', 3000);
    };

    const uploadImageToDjango = async (imageFile: File): Promise<any> => {
        const formData = new FormData();
        formData.append('title_of_course', String(title));
        formData.append('description', String(description));
        formData.append('image', imageFile);

        try {
            const response = await api.post('courses/', formData);
            return response;
        } catch (error: any) {
            console.error("Create course error:", error.response?.data || error.message);
            
            // ADD THIS TO SEE THE FULL RESPONSE
            console.log("Full error response:", error.response);
            console.log("Error data:", error.response?.data);
            
            let errorMessage = 'Failed to create course';
            if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.data) {
                const errorData = error.response.data;
                if (typeof errorData === 'object') {
                    // Extract all error messages from serializer errors
                    const errorMessages: string[] = [];
                    Object.values(errorData).forEach((fieldErrors: any) => {
                        if (Array.isArray(fieldErrors)) {
                            errorMessages.push(...fieldErrors);
                        } else if (typeof fieldErrors === 'string') {
                            errorMessages.push(fieldErrors);
                        } else if (typeof fieldErrors === 'object') {
                            // Handle nested errors
                            Object.values(fieldErrors).forEach((nestedError: any) => {
                                if (Array.isArray(nestedError)) {
                                    errorMessages.push(...nestedError);
                                } else if (typeof nestedError === 'string') {
                                    errorMessages.push(nestedError);
                                }
                            });
                        }
                    });
                    errorMessage = errorMessages.join(', ') || 'Validation error';
                } else {
                    errorMessage = String(errorData);
                }
            }
            
            setError(errorMessage);
            addNotification('error', 'Erreur', errorMessage);
            throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            const errorMsg = 'Please select an image first';
            setError(errorMsg);
            addNotification('warning', 'Attention', errorMsg);
            return;
        }

        if (!title.trim()) {
            const errorMsg = 'Please enter a title';
            setError(errorMsg);
            addNotification('warning', 'Attention', errorMsg);
            return;
        }

        if (!description.trim()) {
            const errorMsg = 'Please enter a description';
            setError(errorMsg);
            addNotification('warning', 'Attention', errorMsg);
            return;
        }

        try {
            setUploading(true);
            setError('');
            setSuccess('');

            const result = await uploadImageToDjango(file);
            console.log('Upload successful:', result);
            
            const successMsg = 'Course created successfully!';
            setSuccess(successMsg);
            addNotification('success', 'Succès', successMsg);

            setFile(null);
            setImagePreview(null);
            setTitle('');
            setDescription('');

            // Notify parent component
            if (onCourseCreated) {
                onCourseCreated();
            }

        } catch (error: any) {
            console.error('Upload failed:', error);
            // Error notification is already handled in uploadImageToDjango
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container-fluid py-3 py-md-5" style={{ minHeight: '100vh', paddingBottom: '80px' }}>
            {/* Add Notification Container */}
            <NotificationContainer 
                notifications={notifications} 
                removeNotification={removeNotification} 
            />
            
            <div className="row justify-content-center mx-0">
                <div className="col-12 col-sm-11 col-md-10 col-lg-8 col-xl-6">
                    <div className="card shadow-lg border-0">
                        <div className="card-body p-3 p-sm-4 p-md-5">
                            <h2 className="text-center mb-3 mb-sm-4 fs-3 fs-sm-2">Create Course</h2>

                            {/* Error Message */}
                            {error && (
                                <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
                                    <div className="d-flex align-items-start">
                                        <div className="flex-grow-1 pe-2">
                                            {error}
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-close flex-shrink-0"
                                            onClick={() => setError('')}
                                            aria-label="Close"
                                        ></button>
                                    </div>
                                </div>
                            )}

                            {/* Success Message */}
                            {success && (
                                <div className="alert alert-success alert-dismissible fade show mb-3" role="alert">
                                    <div className="d-flex align-items-start">
                                        <div className="flex-grow-1 pe-2">
                                            {success}
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-close flex-shrink-0"
                                            onClick={() => setSuccess('')}
                                            aria-label="Close"
                                        ></button>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="needs-validation" noValidate>
                                {/* File Upload Section */}
                                <div className="mb-3 mb-sm-4">
                                    <div className="d-flex justify-content-center w-100">
                                        <div className="text-center border border-secondary rounded p-3 p-sm-4 p-md-5 w-100" style={{
                                            borderStyle: 'dashed',
                                            backgroundColor: '#f8f9fa',
                                            cursor: 'pointer',
                                            minHeight: '180px'
                                        }}>
                                            <label htmlFor="dropzone-file" className="w-100 h-100 d-flex flex-column justify-content-center align-items-center mb-0">
                                                {file ? (
                                                    <div className="d-flex flex-column align-items-center justify-content-center text-center">
                                                        <svg className="bi bi-file-earmark-image mb-2 mb-sm-3" width="28" height="28" fill="#28a745" viewBox="0 0 16 16">
                                                            <path d="M6.502 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
                                                            <path d="M14 14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5V14zM4 1a1 1 0 0 0-1 1v10l2.224-2.224a.5.5 0 0 1 .61-.075L8 11l2.157-3.02a.5.5 0 0 1 .76-.063L13 10V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4z" />
                                                        </svg>
                                                        <p className="mb-1 text-success fw-semibold small">
                                                            File selected: <span className="d-block d-sm-inline">{file.name}</span>
                                                        </p>
                                                        <p className="small text-muted mb-2">
                                                            Size: {(file.size / 1024).toFixed(2)} KB
                                                        </p>
                                                        {imagePreview && (
                                                            <img
                                                                src={imagePreview}
                                                                alt="Preview"
                                                                className="mt-2 rounded img-fluid"
                                                                style={{
                                                                    maxWidth: '120px',
                                                                    maxHeight: '120px',
                                                                    objectFit: 'cover'
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="d-flex flex-column align-items-center justify-content-center text-center">
                                                        <svg className="bi bi-cloud-arrow-up mb-2 mb-sm-3" width="28" height="28" fill="#6c757d" viewBox="0 0 16 16">
                                                            <path fillRule="evenodd" d="M7.646 5.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 6.707V10.5a.5.5 0 0 1-1 0V6.707L6.354 7.854a.5.5 0 1 1-.708-.708l2-2z" />
                                                            <path d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 12.687 13H3.781C1.708 13 0 11.366 0 9.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383zm.653.757c-.757.653-1.153 1.44-1.153 2.056v.448l-.445.049C2.064 6.805 1 7.952 1 9.318 1 10.785 2.23 12 3.781 12h8.906C13.98 12 15 10.988 15 9.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 4.825 10.328 3 8 3a4.53 4.53 0 0 0-2.941 1.1z" />
                                                        </svg>
                                                        <p className="mb-1 text-muted small">
                                                            <span className="fw-semibold">Click to upload</span>
                                                            <span className="d-block d-sm-inline"> or drag and drop</span>
                                                        </p>
                                                        <p className="small text-muted mb-0">SVG, PNG, JPG or GIF (MAX. 2MB)</p>
                                                    </div>
                                                )}
                                                <input
                                                    id="dropzone-file"
                                                    name="courseImage"
                                                    type="file"
                                                    className="visually-hidden"
                                                    onChange={handleImageChange}
                                                    accept="image/*"
                                                    aria-describedby="fileHelp"
                                                    autoComplete="off"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    <div id="fileHelp" className="form-text text-center mt-2 small">
                                        Upload a course image (max 2MB)
                                    </div>
                                </div>

                                {/* Title Field */}
                                <div className="mb-3">
                                    <div className="form-group">
                                        <label htmlFor="courseTitle" className="form-label fw-semibold">
                                            Course Title *
                                        </label>
                                        <input
                                            id="courseTitle"
                                            name="courseTitle"
                                            className="form-control form-control-lg"
                                            type="text"
                                            value={title}
                                            placeholder="Enter course title"
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                            autoComplete="course-title"
                                            aria-describedby="titleHelp"
                                        />
                                        <div id="titleHelp" className="form-text small">
                                            Enter a descriptive title for your course
                                        </div>
                                    </div>
                                </div>

                                {/* Description Field */}
                                <div className="mb-4">
                                    <div className="form-group">
                                        <label htmlFor="courseDescription" className="form-label fw-semibold">
                                            Course Description *
                                        </label>
                                        <textarea
                                            id="courseDescription"
                                            name="courseDescription"
                                            className="form-control"
                                            rows={4}
                                            placeholder="Enter detailed course description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                            autoComplete="off"
                                            aria-describedby="descriptionHelp"
                                            style={{ resize: 'vertical', minHeight: '100px' }}
                                        />
                                        <div id="descriptionHelp" className="form-text small">
                                            Describe what students will learn in this course
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="text-center" style={{ paddingBottom: '40px' }}>
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-lg px-4 px-sm-5 py-2 w-100 w-sm-auto"
                                        disabled={uploading}
                                        style={{ marginBottom: '20px'  , background: '#052c65'}}
                                    >
                                        {uploading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                <span className="d-none d-sm-inline">Creating Course...</span>
                                                <span className="d-inline d-sm-none">Creating...</span>
                                            </>
                                        ) : (
                                            <h6 className='text-white'>Create Course</h6>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NewCours;