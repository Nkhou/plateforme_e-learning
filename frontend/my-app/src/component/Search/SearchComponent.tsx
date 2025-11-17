import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import 'bootstrap/dist/css/bootstrap.min.css';

interface SearchResult {
  id: number;
  type: 'course' | 'module' | 'content';
  title: string;
  description?: string;
  course_title?: string;
  module_title?: string;
  content_type?: string;
  creator?: string;
  status?: number;
  status_display?: string;
  course_id?: number;
  module_id?: number;
  module_count?: number;
  element_count?: number;
}

interface SearchComponentProps {
  onSearchResultClick?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  onSearchResultClick,
  placeholder = "Que cherchez vous ?",
  className = "",
  autoFocus = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'course' | 'module'>('all');
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchResults, selectedType]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultRefs.current[selectedIndex]) {
      resultRefs.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedIndex]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term: string, type: string) => {
      if (!term.trim()) {
        setSearchResults([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await api.get('/api/search/', {
          params: {
            q: term,
            type: type === 'all' ? '' : type,
            limit: 20
          }
        });

        setSearchResults(response.data.results || []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (searchTerm.trim()) {
      debouncedSearch(searchTerm, selectedType);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, selectedType, debouncedSearch]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const courses = searchResults.filter(result => result.type === 'course');
    const modules = searchResults.filter(result => result.type === 'module');
    
    // Filter based on selected type
    let visibleResults: SearchResult[] = [];
    if (selectedType === 'all') {
      visibleResults = [...courses, ...modules];
    } else if (selectedType === 'course') {
      visibleResults = courses;
    } else if (selectedType === 'module') {
      visibleResults = modules;
    }
    
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((prev) => 
        prev < visibleResults.length - 1 ? prev + 1 : prev
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (event.key === 'Enter' && selectedIndex >= 0 && visibleResults[selectedIndex]) {
      event.preventDefault();
      handleResultClick(visibleResults[selectedIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setShowResults(false);
      inputRef.current?.blur();
    }
  };

  const handleTypeChange = (type: 'all' | 'course' | 'module') => {
    setSelectedType(type);
  };

  const handleResultClick = (result: SearchResult) => {
    if (onSearchResultClick) {
      onSearchResultClick(result);
    } else {
      // Default navigation behavior
      switch (result.type) {
        case 'course':
          navigate(`/cours/${result.id}`);
          break;
        case 'module':
          if (result.course_id) {
            navigate(`/cours/${result.course_id}/`);
          }
          break;
        case 'content':
          navigate(`/cours/${result.course_id}/`);
          break;
      }
    }
    setShowResults(false);
    setSearchTerm('');
  };

  // Group results by type
  const courses = searchResults.filter(result => result.type === 'course');
  const modules = searchResults.filter(result => result.type === 'module');

  return (
    <div className={`search-component ${className}`} style={{ position: 'relative', width: '100%' }}>
      {/* Search Input */}
      <div className="search-form">
        <div className="input-group" style={{ position: 'relative', width: '100%' }}>
          <input
            ref={inputRef}
            type="text"
            className="search-input form-control"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowResults(true)}
            style={{
              fontSize: '0.9375rem',
              padding: '0.875rem 1rem 0.875rem 3rem',
              borderRadius: '1.5px',
              border: '1px solid #E5E7EB',
              backgroundColor: 'white',
              width: '100%',
              height: '56px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          />
          <span
            className="search-icon"
            style={{
              position: 'absolute',
              left: '1.25rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6B7280',
              zIndex: 5,
              pointerEvents: 'none',
              fontSize: '1.125rem'
            }}
          >
            🔍
          </span>
        </div>
      </div>

      {/* Search Results - NO SPACE, NO BACKGROUND */}
      {showResults && (searchTerm.trim() || isLoading) && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            borderRadius: '0 0 12px 12px',
            border: '1px solid #E5E7EB',
            borderTop: 'none',
            overflow: 'hidden',
            maxHeight: '400px',
            overflowY: 'auto',
            backgroundColor: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 1000
          }}
        >
          {isLoading ? (
            <div className="text-center p-4">
              <div className="spinner-border text-primary" role="status" style={{ width: '1.5rem', height: '1.5rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.875rem' }}>Recherche en cours...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="search-results-list">
              {/* Search Input Display */}
              {/* <div
                className="p-3"
                style={{
                  backgroundColor: '#F9FAFB',
                  borderBottom: '1px solid #E5E7EB'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1rem', color: '#6B7280' }}>🔍</span>
                  <span
                    style={{
                      fontSize: '0.875rem',
                      color: '#1F2937',
                      fontWeight: '400'
                    }}
                  >
                    {searchTerm}
                  </span>
                </div>
              </div> */}

              {/* Filter Buttons */}
              <div
                className="p-3"
                style={{
                  backgroundColor: '#F9FAFB',
                  borderBottom: '1px solid #E5E7EB'
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleTypeChange('all')}
                    style={{
                      padding: '0.375rem 1rem',
                      borderRadius: '16px',
                      border: 'none',
                      backgroundColor: selectedType === 'all' ? '#3730A3' : 'white',
                      color: selectedType === 'all' ? 'white' : '#6B7280',
                      fontSize: '0.8125rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      // border: '1px solid #E5E7EB'
                    }}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => handleTypeChange('course')}
                    style={{
                      padding: '0.375rem 1rem',
                      borderRadius: '16px',
                      border: 'none',
                      backgroundColor: selectedType === 'course' ? '#3730A3' : 'white',
                      color: selectedType === 'course' ? 'white' : '#6B7280',
                      fontSize: '0.8125rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      // border: '1px solid #E5E7EB'
                    }}
                  >
                    Formations
                  </button>
                  <button
                    onClick={() => handleTypeChange('module')}
                    style={{
                      padding: '0.375rem 1rem',
                      borderRadius: '16px',
                      border: 'none',
                      backgroundColor: selectedType === 'module' ? '#3730A3' : 'white',
                      color: selectedType === 'module' ? 'white' : '#6B7280',
                      fontSize: '0.8125rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      // border: '1px solid #E5E7EB'
                    }}
                  >
                    Modules
                  </button>
                </div>
              </div>

              {/* Formations Section */}
              {(selectedType === 'all' || selectedType === 'course') && courses.length > 0 && (
                <div>
                  <div
                    className="px-3 py-2"
                    style={{
                      backgroundColor: 'white'
                    }}
                  >
                    <h6
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#6B7280',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Formations ({courses.length})
                    </h6>
                  </div>
                  <div className="p-0">
                    {courses.map((course, index) => (
                      <div
                        key={`course-${course.id}`}
                        ref={(el) => { resultRefs.current[index] = el; }}
                        className="px-3 py-2"
                        onClick={() => handleResultClick(course)}
                        style={{
                          transition: 'background-color 0.2s ease',
                          cursor: 'pointer',
                          backgroundColor: selectedIndex === index ? '#F3F4F6' : 'white',
                          borderBottom: '1px solid #F9FAFB'
                        }}
                        onMouseEnter={() => {
                          setSelectedIndex(index);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              backgroundColor: '#818CF8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '600',
                              fontSize: '0.75rem',
                              flexShrink: 0
                            }}
                          >
                            F
                          </div>
                          <div style={{ flex: 1 }}>
                            <h6
                              style={{
                                fontSize: '0.875rem',
                                fontWeight: '400',
                                color: '#1F2937',
                                margin: '0 0 0.125rem 0'
                              }}
                            >
                              {course.title}
                            </h6>
                            <p
                              style={{
                                fontSize: '0.75rem',
                                color: '#9CA3AF',
                                margin: 0
                              }}
                            >
                              • {course.module_count || 5} modules
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modules Section */}
              {(selectedType === 'all' || selectedType === 'module') && modules.length > 0 && (
                <div>
                  <div
                    className="px-3 py-2"
                    style={{
                      backgroundColor: 'white'
                    }}
                  >
                    <h6
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#6B7280',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Modules ({modules.length})
                    </h6>
                  </div>
                  <div className="p-0">
                    {modules.map((module, index) => {
                      const moduleIndex = courses.length + index;
                      return (
                        <div
                          key={`module-${module.id}`}
                          ref={(el) => { resultRefs.current[moduleIndex] = el; }}
                          className="px-3 py-2"
                          onClick={() => handleResultClick(module)}
                          style={{
                            transition: 'background-color 0.2s ease',
                            cursor: 'pointer',
                            backgroundColor: selectedIndex === moduleIndex ? '#F3F4F6' : 'white',
                            borderBottom: '1px solid #F9FAFB'
                          }}
                          onMouseEnter={() => {
                            setSelectedIndex(moduleIndex);
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                backgroundColor: '#BEF264',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#365314',
                                fontWeight: '600',
                                fontSize: '0.75rem',
                                flexShrink: 0
                              }}
                            >
                              M
                            </div>
                            <div style={{ flex: 1 }}>
                              <h6
                                style={{
                                  fontSize: '0.875rem',
                                  fontWeight: '400',
                                  color: '#1F2937',
                                  margin: '0 0 0.125rem 0'
                                }}
                              >
                                {module.title}
                              </h6>
                              <p
                                style={{
                                  fontSize: '0.75rem',
                                  color: '#9CA3AF',
                                  margin: 0
                                }}
                              >
                                • {module.element_count || 2} éléments
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer Navigation */}
              <div
                className="px-3 py-2"
                style={{
                  backgroundColor: '#F9FAFB',
                  borderTop: '1px solid #E5E7EB'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>↓↑</span>
                      <span style={{ fontSize: '0.6875rem', color: '#6B7280' }}>Naviguer</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>↵</span>
                      <span style={{ fontSize: '0.6875rem', color: '#6B7280' }}>Select</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        color: '#9CA3AF',
                        backgroundColor: 'white',
                        padding: '0.125rem 0.25rem',
                        borderRadius: '3px',
                        border: '1px solid #E5E7EB'
                      }}
                    >
                      ESC
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: '#6B7280' }}>Quitter</span>
                  </div>
                </div>
              </div>
            </div>
          ) : searchTerm.trim() ? (
            <div
              className="text-center p-4"
              style={{
                backgroundColor: 'white'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}>🔍</div>
              <p
                className="text-muted mb-1"
                style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}
              >
                Aucun résultat pour "{searchTerm}"
              </p>
              <small
                className="text-muted"
                style={{ fontSize: '0.75rem', color: '#9CA3AF' }}
              >
                Essayez d'autres mots-clés
              </small>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default SearchComponent;