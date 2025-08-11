import { useState } from "react";

interface Cours {
  id: number;
  title: string;
  description: string;
  image: string;
}

const Dashboard = () => {
  // Fake data just for demo
  const cards = [
    { id: 1, title: "Course 1", description: "Introduction to Web Development", image: "/group.avif" },
    { id: 2, title: "Course 2", description: "Advanced React Techniques", image: "/group.avif" },
    { id: 3, title: "Course 3", description: "Backend with Node.js", image: "/group.avif" },
    { id: 4, title: "Course 4", description: "Database Design Principles", image: "/group.avif" },
    { id: 5, title: "Course 5", description: "Mobile App Development", image: "/group.avif" },
    { id: 6, title: "Course 6", description: "UI/UX Design Fundamentals", image: "/group.avif" },
  ];

  return (
    <div className="dashboard-wrapper" style={{ padding: '1rem' }}>
      <h4 className="mb-4">Recommended Courses</h4>
      <div className="carousel-container">
        <div className="carousel-track">
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
      </div>
    </div>
  );
};

export default Dashboard;