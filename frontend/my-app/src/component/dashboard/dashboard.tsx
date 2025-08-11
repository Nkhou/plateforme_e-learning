import { useRef, useState } from "react";

const Dashboard = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  
  const cards = [
    { id: 1, title: "Course 1", description: "Introduction to Web Development", image: "/group.avif" },
    { id: 2, title: "Course 2", description: "Advanced React Techniques", image: "/group.avif" },
    { id: 3, title: "Course 3", description: "Backend with Node.js", image: "/group.avif" },
    { id: 4, title: "Course 4", description: "Database Design Principles", image: "/group.avif" },
    { id: 5, title: "Course 5", description: "Mobile App Development", image: "/group.avif" },
    { id: 6, title: "Course 6", description: "UI/UX Design Fundamentals", image: "/group.avif" },
  ];

  const scrollLeft = () => {
    if (!trackRef.current) return;
    const cardWidth = trackRef.current.children[0]?.clientWidth || 300;
    const gap = 16; // Your gap value (1rem = 16px)
    const scrollAmount = cardWidth + gap;
    
    setCurrentPosition(prev => {
      const newPosition = prev + scrollAmount;
      // Don't scroll past the start
      return Math.min(newPosition, 0);
    });
  };

  const scrollRight = () => {
    if (!trackRef.current) return;
    const cardWidth = trackRef.current.children[0]?.clientWidth || 300;
    const gap = 16;
    const scrollAmount = cardWidth + gap;
    const maxScroll = trackRef.current.scrollWidth - trackRef.current.clientWidth;
    
    setCurrentPosition(prev => {
      const newPosition = prev - scrollAmount;
      // Don't scroll past the end
      return Math.max(newPosition, -maxScroll);
    });
  };

  return (
    <div className="dashboard-wrapper" style={{ padding: '1rem' }}>
      <h4 className="mb-4">Recommended Courses</h4>
      <div className="carousel-container">
        <button 
          className="carousel-nav left" 
          onClick={scrollLeft}
          aria-label="Scroll left"
        >
          &lt;
        </button>
        
        <div 
          className="carousel-track" 
          ref={trackRef}
          style={{ transform: `translateX(${currentPosition}px)` }}
        >
          {cards.map((item) => (
            <div className="card card-carousel shadow-sm" key={item.id}>
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
          onClick={scrollRight}
          aria-label="Scroll right"
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default Dashboard;