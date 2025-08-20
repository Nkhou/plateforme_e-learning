import { useRef, useState, useEffect } from "react";
import "./dashboard.css";

const Dashboard = () => {
  const trackRef1 = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const [currentPosition1, setCurrentPosition1] = useState(0);
  const trackRef2 = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const [currentPosition2, setCurrentPosition2] = useState(0);
  
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  
  const cards = [
    { id: 1, title: "Course 1", description: "Introduction to Web Development", image: "/group.avif" },
    { id: 2, title: "Course 2", description: "Advanced React Techniques", image: "/group.avif" },
    { id: 3, title: "Course 3", description: "Backend with Node.js", image: "/group.avif" },
    { id: 4, title: "Course 4", description: "Database Design Principles", image: "/group.avif" },
    { id: 5, title: "Course 5", description: "Mobile App Development", image: "/group.avif" },
    { id: 6, title: "Course 6", description: "UI/UX Design Fundamentals", image: "/group.avif" },
  ];

  // Add debug logging to identify the source
  useEffect(() => {
    
    // Check for any global variables that might be corrupted
    if (typeof window !== 'undefined') {
      console.log('Window object exists');
    }
    
    return () => {
      console.log('Dashboard component unmounting');
    };
  }, []);

  // Enhanced touch event handling with better error handling
  useEffect(() => {
    const tracks = [trackRef1.current, trackRef2.current].filter(Boolean);
    
    const handleTouchStart = (e: TouchEvent) => {
      try {
        touchStartX.current = e.touches[0]?.clientX || 0;
        touchStartY.current = e.touches[0]?.clientY || 0;
        isDragging.current = true;
        console.log('Touch start:', { x: touchStartX.current, y: touchStartY.current });
      } catch (error) {
        console.error('Error in handleTouchStart:', error);
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      
      try {
        const touchX = e.touches[0]?.clientX || 0;
        const touchY = e.touches[0]?.clientY || 0;
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
            setCurrentPosition1(prev => {
              const maxScroll = track.scrollWidth - track.clientWidth;
              const newPos = Math.max(prev - scrollAmount, -maxScroll);
              console.log('Swipe left, new position:', newPos);
              return newPos;
            });
          } else {
            // Swipe right
            setCurrentPosition1(prev => {
              const newPos = Math.min(prev + scrollAmount, 0);
              console.log('Swipe right, new position:', newPos);
              return newPos;
            });
          }
        }
      } catch (error) {
        console.error('Error in handleTouchMove:', error);
      }
    };
    
    const handleTouchEnd = () => {
      try {
        isDragging.current = false;
        console.log('Touch end');
      } catch (error) {
        console.error('Error in handleTouchEnd:', error);
      }
    };

    // Add error handling for event listeners
    tracks.forEach((track, index) => {
      if (track) {
        try {
          track.addEventListener('touchstart', handleTouchStart, { passive: true });
          track.addEventListener('touchmove', handleTouchMove, { passive: false });
          track.addEventListener('touchend', handleTouchEnd, { passive: true });
        } catch (error) {
          console.error(`Error adding event listeners to track ${index + 1}:`, error);
        }
      }
    });

    return () => {
      tracks.forEach((track, index) => {
        if (track) {
          try {
            track.removeEventListener('touchstart', handleTouchStart);
            track.removeEventListener('touchmove', handleTouchMove);
            track.removeEventListener('touchend', handleTouchEnd);
          } catch (error) {
            console.error(`Error removing event listeners from track ${index + 1}:`, error);
          }
        }
      });
    };
  }, []);

  const scrollLeft = (trackRef: React.RefObject<HTMLDivElement>, setPosition: React.Dispatch<React.SetStateAction<number>>) => {
    try {
      if (!trackRef.current) {
        console.warn('Track ref is null');
        return;
      }
      
      const cardWidth = trackRef.current.children[0]?.clientWidth || 300;
      const gap = 16;
      const scrollAmount = cardWidth + gap;
      
      setPosition(prev => {
        const newPosition = Math.min(prev + scrollAmount, 0);
        console.log('Scroll left, new position:', newPosition);
        return newPosition;
      });
    } catch (error) {
      console.error('Error in scrollLeft:', error);
    }
  };

  const scrollRight = (trackRef: React.RefObject<HTMLDivElement>, setPosition: React.Dispatch<React.SetStateAction<number>>) => {
    try {
      if (!trackRef.current) {
        console.warn('Track ref is null');
        return;
      }
      
      const cardWidth = trackRef.current.children[0]?.clientWidth || 300;
      const gap = 16;
      const scrollAmount = cardWidth + gap;
      const maxScroll = trackRef.current.scrollWidth - trackRef.current.clientWidth;
      
      setPosition(prev => {
        const newPosition = Math.max(prev - scrollAmount, -maxScroll);
        console.log('Scroll right, new position:', newPosition);
        return newPosition;
      });
    } catch (error) {
      console.error('Error in scrollRight:', error);
    }
  };

  // Add error boundary-like logging
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Image failed to load:', e.currentTarget.src);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('Image loaded successfully:', e.currentTarget.src);
  };

  return (
    <div className="dashboard-wrapper">
      <h4 className="mb-4">Recommended Courses</h4>
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
          {cards.map((item) => (
            <div className="card-carousel card-hover" key={`rec-${item.id}`}>
              <img 
                src={item.image} 
                className="card-img-top" 
                alt={item.title}
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
              <div className="card-body">
                <h5 className="card-title">{item.title}</h5>
                <p className="card-text">{item.description}</p>
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

      <h4 className="mb-4 mt-5">My Courses</h4>
      <div className="carousel-container">
        <button 
          className="carousel-nav left" 
          onClick={() => scrollLeft(trackRef2, setCurrentPosition2)}
          aria-label="Scroll left"
        >
          &lt;
        </button>
        
        <div 
          className="carousel-track"
          ref={trackRef2}
          style={{ transform: `translateX(${currentPosition2}px)` }}
        >
          {cards.map((item) => (
            <div className="card-carousel card-hover" key={`my-${item.id}`}>
              <img 
                src={item.image} 
                className="card-img-top" 
                alt={item.title}
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
              <div className="card-body">
                <h5 className="card-title">{item.title}</h5>
                <p className="card-text">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <button 
          className="carousel-nav right" 
          onClick={() => scrollRight(trackRef2, setCurrentPosition2)}
          aria-label="Scroll right"
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default Dashboard;