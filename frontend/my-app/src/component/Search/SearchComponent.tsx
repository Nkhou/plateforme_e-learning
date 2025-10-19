import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import 'bootstrap/dist/css/bootstrap.min.css';
// import './SearchComponent.css'; // Import the CSS file

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
}

interface SearchComponentProps {
  onSearchResultClick?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  onSearchResultClick,
  placeholder = "Que cherchez vouz ?",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [displaycard, setDisplayCard] = useState(false)
  const [selectedType, setSelectedType] = useState<'all' | 'course' | 'module' | 'content'>('all');

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

  const handleTypeChange = (type: 'all' | 'course' | 'module' | 'content') => {
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

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'course':
        return '📚';
      case 'module':
        return '📖';
      case 'content':
        return '📄';
      default:
        return '🔍';
    }
  };

  return (
    <div className={`search-component ${className}`}>
      {/* Search Input with Filters */}
      <div className="search-form">
        <div className="input-group">
          <input
            type="text"
            className="search-input form-control"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
          />
          <span className="search-icon" style={{ color: 'white' }}>
            <i className="bi bi-search"></i>
          </span>
        </div>
      {/* </div> */}

      {/* Type Filter */}
      {/* <div className="mt-2">
          <select
            className="form-select form-select-sm"
            value={selectedType}
            onChange={(e) => handleTypeChange(e.target.value as any)}
          >
            <option value="all">All Types</option>
            <option value="course">Courses</option>
            <option value="module">Modules</option>
            <option value="content">Content</option>
          </select>
        </div> */}
    </div>

      {/* Search Results */ }
  {
    showResults && (searchTerm.trim() || isLoading) && (
      <div className="card position-absolute top-100 start-0 end-0 mt-1 shadow-lg border-0 z-3">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center p-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-2 mb-0">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="search-results-list">
              {searchResults.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="search-result-item p-3 cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="d-flex align-items-start">
                    <div className="flex-shrink-0 me-3 fs-5">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center mb-1 flex-wrap">
                        <h6 className="mb-0 me-2">{result.title}</h6>
                        <span className="badge bg-primary me-1 text-capitalize">
                          {result.type}
                        </span>
                        {result.content_type && (
                          <span className="badge bg-info text-capitalize">
                            {result.content_type}
                          </span>
                        )}
                      </div>

                      {result.description && (
                        <p className="text-muted small mb-1">
                          {result.description.length > 120
                            ? `${result.description.substring(0, 120)}...`
                            : result.description
                          }
                        </p>
                      )}

                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {result.course_title && (
                          <small className="text-muted">
                            <i className="bi bi-book me-1"></i>
                            {result.course_title}
                          </small>
                        )}
                        {result.module_title && (
                          <small className="text-muted">
                            <i className="bi bi-folder me-1"></i>
                            {result.module_title}
                          </small>
                        )}
                        {result.creator && (
                          <small className="text-muted">
                            <i className="bi bi-person me-1"></i>
                            {result.creator}
                          </small>
                        )}
                        {result.status_display && (
                          <small className={`badge ${result.status === 1 ? 'bg-success' : 'bg-warning'}`}>
                            {result.status_display}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm.trim() ? (
            <div className="text-center p-4">
              <i className="bi bi-search display-4 text-muted mb-3"></i>
              <p className="text-muted mb-0">No results found for "{searchTerm}"</p>
              <small className="text-muted">Try different keywords or filters</small>
            </div>
          ) : null}
        </div>
      </div>
    )
  }
    </div >
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