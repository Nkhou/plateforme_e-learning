import React, { useState, useEffect, useCallback } from 'react';
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
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  onSearchResultClick,
  placeholder = "Que cherchez vous ?",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'course' | 'module'>('all');

  const navigate = useNavigate();

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
            type="text"
            className="search-input form-control"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            style={{
              fontSize: '0.9375rem',
              padding: '0.875rem 1rem 0.875rem 3rem',
              borderRadius: '12px',
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

      {/* Search Results */}
      {showResults && (searchTerm.trim() || isLoading) && (
        <div 
          className="position-absolute start-0 mt-2 shadow-lg"
          style={{
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            overflow: 'hidden',
            maxHeight: '600px',
            overflowY: 'auto',
            width: '100%',
            minWidth: '500px',
            backgroundColor: 'white',
            zIndex: 1000
          }}
        >
          {isLoading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-3 mb-0" style={{ fontSize: '0.875rem' }}>Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="search-results-list">
              {/* Search Input Display */}
              <div 
                className="p-4"
                style={{
                  backgroundColor: 'white',
                  borderBottom: '1px solid #F3F4F6'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.125rem', color: '#6B7280' }}>🔍</span>
                  <span 
                    style={{
                      fontSize: '0.9375rem',
                      color: '#1F2937',
                      fontWeight: '400'
                    }}
                  >
                    {searchTerm}
                  </span>
                </div>
              </div>

              {/* Filter Buttons */}
              <div 
                className="p-4"
                style={{
                  backgroundColor: 'white',
                  borderBottom: '1px solid #F3F4F6'
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => handleTypeChange('all')}
                    style={{
                      padding: '0.5rem 1.25rem',
                      borderRadius: '20px',
                      border: 'none',
                      backgroundColor: selectedType === 'all' ? '#3730A3' : '#F3F4F6',
                      color: selectedType === 'all' ? 'white' : '#6B7280',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => handleTypeChange('course')}
                    style={{
                      padding: '0.5rem 1.25rem',
                      borderRadius: '20px',
                      border: 'none',
                      backgroundColor: selectedType === 'course' ? '#3730A3' : '#F3F4F6',
                      color: selectedType === 'course' ? 'white' : '#6B7280',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Formations
                  </button>
                  <button
                    onClick={() => handleTypeChange('module')}
                    style={{
                      padding: '0.5rem 1.25rem',
                      borderRadius: '20px',
                      border: 'none',
                      backgroundColor: selectedType === 'module' ? '#3730A3' : '#F3F4F6',
                      color: selectedType === 'module' ? 'white' : '#6B7280',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
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
                    className="px-4 py-2"
                    style={{
                      backgroundColor: 'white'
                    }}
                  >
                    <h6 
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: '600',
                        color: '#6B7280',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Formations
                    </h6>
                  </div>
                  <div className="p-0">
                    {courses.map((course) => (
                      <div
                        key={`course-${course.id}`}
                        className="px-4 py-3"
                        onClick={() => handleResultClick(course)}
                        style={{
                          transition: 'background-color 0.2s ease',
                          cursor: 'pointer',
                          backgroundColor: 'white'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div 
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: '#818CF8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '600',
                              fontSize: '0.875rem',
                              flexShrink: 0
                            }}
                          >
                            F
                          </div>
                          <div style={{ flex: 1 }}>
                            <h6 
                              style={{
                                fontSize: '0.9375rem',
                                fontWeight: '400',
                                color: '#1F2937',
                                margin: '0 0 0.25rem 0'
                              }}
                            >
                              {course.title}
                            </h6>
                            <p 
                              style={{
                                fontSize: '0.8125rem',
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
                    className="px-4 py-2"
                    style={{
                      backgroundColor: 'white'
                    }}
                  >
                    <h6 
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: '600',
                        color: '#6B7280',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Modules
                    </h6>
                  </div>
                  <div className="p-0">
                    {modules.map((module) => (
                      <div
                        key={`module-${module.id}`}
                        className="px-4 py-3"
                        onClick={() => handleResultClick(module)}
                        style={{
                          transition: 'background-color 0.2s ease',
                          cursor: 'pointer',
                          backgroundColor: 'white'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div 
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: '#BEF264',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#365314',
                              fontWeight: '600',
                              fontSize: '0.875rem',
                              flexShrink: 0
                            }}
                          >
                            M
                          </div>
                          <div style={{ flex: 1 }}>
                            <h6 
                              style={{
                                fontSize: '0.9375rem',
                                fontWeight: '400',
                                color: '#1F2937',
                                margin: '0 0 0.25rem 0'
                              }}
                            >
                              {module.title}
                            </h6>
                            <p 
                              style={{
                                fontSize: '0.8125rem',
                                color: '#9CA3AF',
                                margin: 0
                              }}
                            >
                              • {module.element_count || 2} elements
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Navigation */}
              <div 
                className="px-4 py-3"
                style={{
                  backgroundColor: '#F9FAFB',
                  borderTop: '1px solid #F3F4F6'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>↓↑</span>
                      <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Naviguer</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>↵</span>
                      <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Select</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span 
                      style={{ 
                        fontSize: '0.6875rem', 
                        color: '#9CA3AF',
                        backgroundColor: 'white',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '4px',
                        border: '1px solid #E5E7EB'
                      }}
                    >
                      ESC
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Quitter</span>
                  </div>
                </div>
              </div>
            </div>
          ) : searchTerm.trim() ? (
            <div 
              className="text-center p-5"
              style={{
                backgroundColor: 'white'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <p 
                className="text-muted mb-2"
                style={{ fontSize: '0.9375rem', fontWeight: '500', color: '#374151' }}
              >
                No results found for "{searchTerm}"
              </p>
              <small 
                className="text-muted"
                style={{ fontSize: '0.8125rem', color: '#9CA3AF' }}
              >
                Try different keywords or filters
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