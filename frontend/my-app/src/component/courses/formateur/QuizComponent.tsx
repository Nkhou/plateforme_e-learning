import type { CourseContent } from './CourseDetail';
import React, { useState, useEffect } from 'react';

interface QuizState {
    currentQuestionIndex: number;
    selectedOptions: number[];
    timeRemaining: number;
    isCompleted: boolean;
    score: number;
    attempts: number;
    showResults: boolean;
}
interface QuizProps {
    content: CourseContent;
    onClose: () => void;
    onComplete: (score: number, passed: boolean) => void;
}

const QuizComponent: React.FC<QuizProps> = ({ content, onClose, onComplete }) => {
    const [quizState, setQuizState] = useState<QuizState>({
        currentQuestionIndex: 0,
        selectedOptions: [],
        timeRemaining: content.qcm?.time_limit ? content.qcm.time_limit * 60 : 0,
        isCompleted: false,
        score: 0,
        attempts: 0,
        showResults: false
    });

    const [userAnswers, setUserAnswers] = useState<number[][]>([]);
    const [quizStarted, setQuizStarted] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (quizStarted && quizState.timeRemaining > 0 && !quizState.isCompleted) {
            timer = setInterval(() => {
                setQuizState(prev => ({
                    ...prev,
                    timeRemaining: prev.timeRemaining - 1
                }));
            }, 1000);
        } else if (quizState.timeRemaining === 0 && !quizState.isCompleted) {
            handleQuizComplete();
        }
        return () => clearInterval(timer);
    }, [quizState.timeRemaining, quizState.isCompleted, quizStarted]);

    const startQuiz = () => {
        setQuizStarted(true);
        setUserAnswers([]);
    };

    const handleOptionSelect = (optionId: number) => {
        if (content.qcm?.options) {
            const currentOptions = [...quizState.selectedOptions];
            const optionIndex = currentOptions.indexOf(optionId);
            
            if (optionIndex > -1) {
                currentOptions.splice(optionIndex, 1);
            } else {
                currentOptions.push(optionId);
            }
            
            setQuizState(prev => ({ ...prev, selectedOptions: currentOptions }));
        }
    };

    const handleQuizComplete = () => {
        if (content.qcm?.options) {
            const finalAnswers = [...userAnswers, quizState.selectedOptions];
            const correctAnswers = content.qcm.options
                .filter(opt => opt.is_correct)
                .map(opt => opt.id);
            
            const isCorrect = JSON.stringify([...finalAnswers[0]].sort()) === JSON.stringify([...correctAnswers].sort());
            const score = isCorrect ? content.qcm.points : 0;
            const passed = score >= content.qcm.passing_score;

            setQuizState(prev => ({
                ...prev,
                isCompleted: true,
                score,
                showResults: true,
                attempts: prev.attempts + 1
            }));

            onComplete(score, passed);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!content.qcm) return null;

    return (
        <div className="modal fade show d-block">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">
                            <i className="fas fa-question-circle me-2"></i>
                            {content.title}
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    
                    <div className="modal-body">
                        {!quizStarted ? (
                            <div className="text-center py-4">
                                <div className="alert alert-info">
                                    <h6>Quiz Instructions</h6>
                                    <ul className="list-unstyled">
                                        <li>• Points: {content.qcm.points}</li>
                                        <li>• Passing Score: {content.qcm.passing_score}%</li>
                                        <li>• Max Attempts: {content.qcm.max_attempts}</li>
                                        {content.qcm.time_limit > 0 && (
                                            <li>• Time Limit: {content.qcm.time_limit} minutes</li>
                                        )}
                                    </ul>
                                </div>
                                <button className="btn btn-primary btn-lg" onClick={startQuiz}>
                                    Start Quiz
                                </button>
                            </div>
                        ) : quizState.showResults ? (
                            <div className="text-center py-4">
                                <div className={`alert ${quizState.score >= content.qcm.passing_score ? 'alert-success' : 'alert-danger'}`}>
                                    <i className={`fas ${quizState.score >= content.qcm.passing_score ? 'fa-check-circle' : 'fa-times-circle'} fa-3x mb-3`}></i>
                                    <h4>{quizState.score >= content.qcm.passing_score ? 'Congratulations!' : 'Try Again'}</h4>
                                    <p>Your score: {quizState.score}/{content.qcm.points} ({Math.round((quizState.score / content.qcm.points) * 100)}%)</p>
                                    <p>{quizState.score >= content.qcm.passing_score ? 'You passed the quiz!' : `You need ${content.qcm.passing_score}% to pass.`}</p>
                                </div>
                                <button className="btn btn-primary" onClick={onClose}>
                                    Close
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <div>
                                        <span className="badge bg-primary">Question 1 of 1</span>
                                    </div>
                                    {content.qcm.time_limit > 0 && (
                                        <div className="text-end">
                                            <div className={`badge ${quizState.timeRemaining < 60 ? 'bg-danger' : 'bg-warning'}`}>
                                                <i className="fas fa-clock me-1"></i>
                                                {formatTime(quizState.timeRemaining)}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="card mb-4">
                                    <div className="card-body">
                                        <h6 className="card-title">{content.qcm.question}</h6>
                                        <div className="mt-3">
                                            {content.qcm.options.map((option) => (
                                                <div key={option.id} className="form-check mb-3">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={quizState.selectedOptions.includes(option.id)}
                                                        onChange={() => handleOptionSelect(option.id)}
                                                        id={`option-${option.id}`}
                                                    />
                                                    <label className="form-check-label w-100" htmlFor={`option-${option.id}`}>
                                                        {option.text}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-between">
                                    <button 
                                        className="btn btn-secondary" 
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={handleQuizComplete}
                                        disabled={quizState.selectedOptions.length === 0}
                                    >
                                        Submit Answers
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizComponent;