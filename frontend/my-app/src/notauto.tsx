const Notauto= () => {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div
      className="min-vh-100 d-flex flex-column"
      style={{
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        padding: '2rem 0'
      }}
    >
      <div className="flex-grow-1 container-fluid h-100 d-flex align-items-center justify-content-center">
        <div className="row w-100 justify-content-center align-items-center" style={{ maxWidth: '1800px', margin: '0 auto' }}>

          {/* IMAGE SECTION - Wider but same height */}
          <div className="col-xl-6 col-lg-6 col-md-10 d-flex justify-content-center">
            <div
              className="card rounded-5 overflow-hidden"
              style={{
                border: 'none',
                minHeight: '870px',
                background: 'transparent',
                width: '100%',
                maxWidth: '800px'
              }}
            >
              <div className="card-body p-0 w-100 h-100 d-flex align-items-center justify-content-center">
                 <h1 className="text-1xl lg:text-2xl font-bold text-gray-900 leading-tight">
            Vous n'êtes pas autorisé pour accèder à cette page
          </h1>
          
          <button
            onClick={handleGoHome}
            className="bg-indigo-900 hover:bg-indigo-800 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200 inline-flex items-center gap-2"
          
           style={{
    backgroundColor: '#212068',
  }}>

            <span>‹</span>
            <span>Retourner à la page d'accueil</span>
          </button>
              </div>
            </div>
          </div>

          {/* LOGIN SECTION - Wider but same height */}
          <div className="col-xl-6 col-lg-6 col-md-8 d-flex justify-content-center">
            <div
              className="card rounded-6"
              style={{
                border: 'none',
                backdropFilter: 'blur(10px)',
                minHeight: '700px',
                width: '100%',
                maxWidth: '800px'
              }}
            >
              <div className="card-body d-flex flex-column justify-content-center p-4 p-md-5">
                {/* Login Header - Centered */}
  
                {/* Form - Centered */}
                <div className="w-100">
                     <img
                    src="/noauto.jpg"
                    alt="noauto"
                    style={{
                      width: '500px',
                      height: '500px',
                      objectFit: 'contain',
                      marginRight: '0.75rem'
                    }}
                  />
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Notauto;