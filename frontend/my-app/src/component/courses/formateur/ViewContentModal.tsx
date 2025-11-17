import React, { useState } from 'react';
import type { CourseContent } from './CourseDetail';

interface ViewContentModalProps {
    content: CourseContent;
    onClose: () => void;
    onEdit: () => void;
}

const ViewContentModal: React.FC<ViewContentModalProps> = ({ content, onClose, onEdit }) => {
    const [videoError, setVideoError] = useState(false);

    const getFileUrl = (fileUrl: string) => {
        if (!fileUrl) return '';
        if (fileUrl.includes('backend:8000')) {
            return fileUrl.replace('backend:8000', 'localhost:8000');
        }
        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
            return fileUrl;
        }
        if (fileUrl.startsWith('/media/')) {
            return `http://localhost:8000${fileUrl}`;
        }
        return `http://localhost:8000/media/${fileUrl}`;
    };

    const getContentIcon = (contentType: string) => {
        switch (contentType) {
            case 'pdf': return 'fas fa-file-pdf text-danger';
            case 'Video': return 'fas fa-video text-success';
            case 'QCM': return 'fas fa-question-circle text-warning';
            default: return 'fas fa-file text-secondary';
        }
    };

    const handleVideoError = () => {
        setVideoError(true);
    };

    const openPdfInNewWindow = (pdfUrl: string) => {
        window.open(pdfUrl, '_blank', 'width=800,height=600');
    };

    const downloadFile = (fileUrl: string, filename: string) => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderContent = () => {
        const contentType = content.content_type_name || content.content_type;
        
        switch (contentType) {
            case 'pdf':
                const pdfUrl = content.pdf_content?.pdf_file ? getFileUrl(content.pdf_content.pdf_file) : null;
                return (
                    <div className="text-center">
                        <i className="fas fa-file-pdf fa-5x text-danger mb-3"></i>
                        <h5>{content.title}</h5>
                        {content.caption && <p className="text-muted">{content.caption}</p>}
                        
                        {pdfUrl ? (
                            <div className="mt-4">
                                <div className="alert alert-info">
                                    <i className="fas fa-info-circle me-2"></i>
                                    PDF content is available. Choose an option below to view it.
                                </div>
                                
                                <div className="d-grid gap-2">
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => openPdfInNewWindow(pdfUrl)}
                                    >
                                        <i className="fas fa-external-link-alt me-2"></i>
                                        Open PDF in New Window
                                    </button>
                                    
                                    <button 
                                        className="btn btn-outline-primary"
                                        onClick={() => downloadFile(pdfUrl, `${content.title}.pdf`)}
                                    >
                                        <i className="fas fa-download me-2"></i>
                                        Download PDF
                                    </button>
                                    
                                    <a 
                                        href={pdfUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn btn-outline-secondary"
                                    >
                                        <i className="fas fa-link me-2"></i>
                                        Direct Link to PDF
                                    </a>
                                </div>
                                
                                {/* Alternative: Try embedding with object tag */}
                                <div className="mt-4">
                                    <button 
                                        className="btn btn-sm btn-outline-info mb-2"
                                        onClick={() => {
                                            const container = document.getElementById('pdf-container');
                                            if (container) {
                                                container.innerHTML = `
                                                    <object 
                                                        data="${pdfUrl}" 
                                                        type="application/pdf" 
                                                        width="100%" 
                                                        height="600px"
                                                        style="border: 1px solid #ccc;"
                                                    >
                                                        <p>PDF cannot be displayed. <a href="${pdfUrl}" target="_blank">Click here to view</a></p>
                                                    </object>
                                                `;
                                            }
                                        }}
                                    >
                                        Try Embed Here
                                    </button>
                                    <div id="pdf-container"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="alert alert-warning mt-3">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                PDF file path not available.
                            </div>
                        )}
                    </div>
                );
            
            case 'Video':
                const videoUrl = content.video_content?.video_file ? getFileUrl(content.video_content.video_file) : null;
                return (
                    <div>
                        <h5>{content.title}</h5>
                        {content.caption && <p className="text-muted">{content.caption}</p>}
                        
                        {videoUrl && !videoError ? (
                            <div className="mt-3">
                                <video 
                                    controls 
                                    className="w-100"
                                    style={{ maxHeight: '400px' }}
                                    onError={handleVideoError}
                                    crossOrigin="anonymous"
                                >
                                    <source src={videoUrl} type="video/mp4" />
                                    <source src={videoUrl} type="video/webm" />
                                    <source src={videoUrl} type="video/ogg" />
                                    Your browser does not support the video tag.
                                </video>
                                
                                <div className="mt-2">
                                    <a 
                                        href={videoUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn btn-sm btn-outline-primary"
                                    >
                                        <i className="fas fa-external-link-alt me-1"></i>
                                        Open in New Tab
                                    </a>
                                    <button 
                                        className="btn btn-sm btn-outline-secondary ms-2"
                                        onClick={() => downloadFile(videoUrl, `${content.title}.mp4`)}
                                    >
                                        <i className="fas fa-download me-1"></i>
                                        Download
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="alert alert-warning mt-3">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                {!videoUrl ? 'Video file path not available.' : 'Unable to load video. File may be missing or in an unsupported format.'}
                                {videoUrl && (
                                    <div className="mt-2">
                                        <a 
                                            href={videoUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="btn btn-sm btn-primary"
                                        >
                                            Try Direct Link
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            
            case 'QCM':
                return (
                <div>
                    <h5>{content.title}</h5>
                    {content.caption && <p className="text-muted">{content.caption}</p>}
                    
                    {/* FIX: Add null check for content.qcm and content.qcm.options */}
                    {content.qcm ? (
                        <div className="mt-3">
                            <div className="alert alert-info">
                                <h6>Quiz Details</h6>
                                <ul className="list-unstyled mb-0">
                                    <li><strong>Question:</strong> {content.qcm.question}</li>
                                    <li><strong>Type:</strong> {content.qcm.question_type === 'single' ? 'Single Choice' : 'Multiple Choice'}</li>
                                    <li><strong>Points:</strong> {content.qcm.points}</li>
                                    <li><strong>Passing Score:</strong> {content.qcm.passing_score}%</li>
                                    <li><strong>Max Attempts:</strong> {content.qcm.max_attempts}</li>
                                    {content.qcm.time_limit > 0 && (
                                        <li><strong>Time Limit:</strong> {content.qcm.time_limit} minutes</li>
                                    )}
                                </ul>
                            </div>
                            
                            <h6 className="mt-3">Options:</h6>
                            
                            {/* FIX: Add proper null check for options */}
                            {content.qcm.options && content.qcm.options.length > 0 ? (
                                <div className="list-group">
                                    {content.qcm.options.map((option, index) => (
                                        <div key={option.id || index} className="list-group-item">
                                            <div className="d-flex align-items-center">
                                                <span className="me-3">{index + 1}.</span>
                                                <span className="flex-grow-1">{option.text}</span>
                                                {option.is_correct && (
                                                    <span className="badge bg-success">
                                                        <i className="fas fa-check me-1"></i>
                                                        Correct
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="alert alert-warning">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    No options available for this quiz.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="alert alert-warning">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            Quiz content not available.
                        </div>
                    )}
                </div>
            );
            
            default:
                return (
                    <div className="text-center">
                        <i className="fas fa-file fa-5x text-secondary mb-3"></i>
                        <h5>{content.title}</h5>
                        {content.caption && <p className="text-muted">{content.caption}</p>}
                        <div className="alert alert-info">
                            <i className="fas fa-info-circle me-2"></i>
                            This content type ({contentType}) is not directly viewable here.
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">
                            <i className={`${getContentIcon(content.content_type_name || content.content_type)} me-2`}></i>
                            View Content: {content.title}
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {renderContent()}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Close
                        </button>
                        <button type="button" className="btn btn-primary" onClick={onEdit}>
                            <i className="fas fa-edit me-1"></i>
                            Edit Content
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewContentModal;