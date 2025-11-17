import React, { useState } from 'react';

const EleviaHero: React.FC = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = [
    '/10128135.jpg',
    '/10128140.jpg', 
    '/10133785.jpg',
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="w-100 h-100 d-flex align-items-center justify-content-center position-relative">
      <img
        src={images[currentImageIndex]}
        alt="Elevia Learning"
        className="w-100 h-100"
        style={{
          objectFit: 'cover',
          cursor: 'pointer',
          transition: 'transform 0.3s ease',
          filter: 'brightness(0.8)'
        }}
        onClick={nextImage}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      />
      
      {/* Text Overlay on Image */}
      <div 
        className="position-absolute bottom-0 d-flex flex-column  text-white p-5"
        style={{
        //   background: 'linear-gradient(rgba(33, 32, 96, 0.7), rgba(33, 32, 96, 0.5))',
          pointerEvents: 'none'
        }}
      >
        <h1 className="fw-bold mb-4  display-5" style={{ 
          // textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
          lineHeight: '1,6'
        }}>
          L'avenir s'apprend avec Elevia
        </h1>
        <p className=" mb-4 fs-5" style={{ 
          // textShadow: '1px 1px 4px rgba(0,0,0,0.7)',
          lineHeight: '1.4'
        }}>
          Chez Elevia, nous aidons chaque apprenant à progresser et à s'élever. 
          Notre plateforme d'e-learning rend l'apprentissage accessible, moderne 
          et motivant, pour préparer l'avenir dès aujourd'hui.
        </p>
        
        {/* Dot Indicators */}
        <div className="d-flex gap-3 mt-4">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(index);
              }}
              className={`btn btn-sm rounded-circle p-0 ${
                index === currentImageIndex ? 'btn-light' : 'btn-outline-light'
              }`}
              style={{ 
                width: '16px', 
                height: '16px', 
                pointerEvents: 'auto'
              }}
            />
          ))}
        </div>
        
        {/* <small className="text-light mt-4 fs-5" style={{ 
          textShadow: '1px 1px 3px rgba(0,0,0,0.7)'
        }}>
          Cliquez sur l'image pour découvrir nos fonctionnalités
        </small> */}
      </div>
    </div>
  );
};

export default EleviaHero;