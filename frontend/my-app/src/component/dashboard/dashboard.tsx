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

  // Proper touch event handling with passive listeners
  useEffect(() => {
    const tracks = [trackRef1.current, trackRef2.current].filter(Boolean);
    
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
  }, []);

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
            <div className="card-carousel" key={`rec-${item.id}`}>
              <img src={item.image} className="card-img-top" alt={item.title} />
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
            <div className="card-carousel" key={`my-${item.id}`}>
              <img src={item.image} className="card-img-top" alt={item.title} />
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