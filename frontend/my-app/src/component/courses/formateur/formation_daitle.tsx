import React, { useState } from 'react';
import { FileText, Video, Lock, Calendar, User, ArrowLeft, Edit, Plus } from 'lucide-react';

const FormationDetailsPage = () => {
  const [activeModule, setActiveModule] = useState(null);

  // Sample course data
  const courseData = {
    title: "Employee Onboarding",
    status: "Actif",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor",
    stats: {
      totalContent: 4,
      modules: 2,
      learners: 38,
      avgProgress: 42.3,
      yourProgress: 68.3,
      estimatedTime: "3h 23min"
    },
    thumbnail: null,
    category: "Finance dept.",
    description_full: "Contrary to popular belief, Lorem ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old...",
    creator: "Jean Dupont",
    createdDate: "27 Sept, 2025",
    modules: [
      {
        id: 1,
        title: "Introduction",
        contents: [
          { id: 1, type: "document", title: "At vero eos et accusamus et iusto odio dignissimos ducimus.", size: "15MB", progress: 100, status: "Complété", locked: false },
          { id: 2, type: "document", title: "At vero eos et accusamus et iusto odio dignissimos ducimus.", size: "15MB", progress: 35, status: "En cours", locked: false },
          { id: 3, type: "video", title: "At vero eos et accusamus et iusto odio dignissimos ducimus.", size: "", progress: 0, status: "", locked: true },
          { id: 4, type: "document", title: "At vero eos et accusamus et iusto odio dignissimos ducimus.", size: "", progress: 0, status: "", locked: true }
        ]
      },
      {
        id: 2,
        title: "Verbal reasoning",
        contents: [
          { id: 5, type: "document", title: "At vero eos et accusamus et iusto odio dignissimos ducimus.", size: "", progress: 0, status: "", locked: true },
          { id: 6, type: "document", title: "At vero eos et accusamus et iusto odio dignissimos ducimus.", size: "", progress: 0, status: "", locked: true },
          { id: 7, type: "video", title: "At vero eos et accusamus et iusto odio dignissimos ducimus.", size: "", progress: 0, status: "", locked: true },
          { id: 8, type: "document", title: "At vero eos et accusamus et iusto odio dignissimos ducimus.", size: "", progress: 0, status: "", locked: true }
        ]
      },
      {
        id: 3,
        title: "Other module title n° 3",
        contents: [
          { id: 9, type: "document", title: "At vero eos et accusamus et iusto odio dignissimos ducimus.", size: "", progress: 0, status: "", locked: true },
          { id: 10, type: "document", title: "At vero eos et accusamus et iusto odio dignissimos ducimus.", size: "", progress: 0, status: "", locked: true },
          { id: 11, type: "video", title: "At vero eos et accusamus et iusto odio dignissimos ducimus.", size: "", progress: 0, status: "", locked: true },
          { id: 12, type: "document", title: "At vero eos et accusamus et iusto odio dignissimos ducimus.", size: "", progress: 0, status: "", locked: true }
        ]
      },
      {
        id: 4,
        title: "Other module title n° 4",
        contents: [
          { id: 13, type: "document", title: "At vero eos et accusamus et iusto odio dignissimos ducimus.", size: "", progress: 0, status: "", locked: true },
          { id: 14, type: "document", title: "At vero eos et accusamus et iusto odio dignissimos ducimus.", size: "", progress: 0, status: "", locked: true },
          { id: 15, type: "video", title: "At vero eos et accusamus et iusto odio dignissimos ducimus.", size: "", progress: 0, status: "", locked: true },
          { id: 16, type: "document", title: "At vero eos et accusamus et iusto odio dignissimos ducimus.", size: "", progress: 0, status: "", locked: true }
        ]
      }
    ]
  };

  return (
    <div style={{ backgroundColor: '#F3F4F6', minHeight: '100vh' }}>
      {/* Top Navigation */}
      <nav style={{ backgroundColor: '#2D2B6B', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: 'white', borderRadius: '8px' }}></div>
          <input 
            type="text" 
            placeholder="Que cherchez vous ?" 
            style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: '20px', 
              border: 'none', 
              width: '300px',
              backgroundColor: 'white'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#3F3D7F', border: 'none', color: 'white' }}>🔔</button>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#3F3D7F', border: 'none', color: 'white' }}>👤</button>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#3F3D7F', border: 'none', color: 'white' }}>⚙️</button>
        </div>
      </nav>

      {/* Secondary Navigation */}
      <div style={{ backgroundColor: '#2D2B6B', padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', gap: '2rem', color: 'white' }}>
          <button style={{ background: 'none', border: 'none', color: '#9CA3AF', padding: '0.5rem 1rem', cursor: 'pointer' }}>Dashboard</button>
          <button style={{ background: 'none', border: 'none', color: 'white', padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: '2px solid #F59E0B' }}>Formations</button>
          <button style={{ background: 'none', border: 'none', color: '#9CA3AF', padding: '0.5rem 1rem', cursor: 'pointer' }}>Utilisateurs</button>
          <button style={{ background: 'none', border: 'none', color: '#9CA3AF', padding: '0.5rem 1rem', cursor: 'pointer' }}>Messages</button>
          <button style={{ background: 'none', border: 'none', color: '#9CA3AF', padding: '0.5rem 1rem', cursor: 'pointer' }}>Favoris</button>
        </div>
      </div>

      {/* Header with Breadcrumb */}
      <div style={{ backgroundColor: '#2D2B6B', color: 'white', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <ArrowLeft size={20} style={{ cursor: 'pointer' }} />
          <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>
            Main {'>'} Formations {'>'} <span style={{ color: '#FCD34D' }}>Détails de formation</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>{courseData.title}</h1>
          <span style={{ 
            backgroundColor: '#10B981', 
            color: 'white', 
            padding: '0.25rem 0.75rem', 
            borderRadius: '12px', 
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            {courseData.status}
          </span>
        </div>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.9 }}>{courseData.description}</p>
      </div>

      {/* Stats Bar */}
      <div style={{ backgroundColor: '#2D2B6B', padding: '0 2rem 2rem 2rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(6, 1fr)', 
          gap: '2rem',
          color: 'white'
        }}>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>Contenu total</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>0{courseData.stats.totalContent}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>N° de modules</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>0{courseData.stats.modules}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>N° d'apprenants</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{courseData.stats.learners}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>Avg. du progrès</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{courseData.stats.avgProgress}%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>Votre progrès</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{courseData.stats.yourProgress}%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>Temps estimé</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{courseData.stats.estimatedTime}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '2rem', display: 'flex', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Left Sidebar */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          {/* Thumbnail */}
          <div style={{ 
            backgroundColor: '#E5E7EB', 
            borderRadius: '8px', 
            height: '200px', 
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9CA3AF'
          }}>
            Image placeholder
          </div>

          {/* Category Badge */}
          <div style={{ 
            backgroundColor: '#FED7AA', 
            color: '#9A3412', 
            padding: '0.5rem 1rem', 
            borderRadius: '20px', 
            fontSize: '0.875rem',
            fontWeight: '500',
            display: 'inline-block',
            marginBottom: '1rem'
          }}>
            {courseData.category}
          </div>

          {/* Description */}
          <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: '1.6', marginBottom: '1rem' }}>
            {courseData.description_full} <span style={{ color: '#4F46E5', cursor: 'pointer' }}>voir plus</span>
          </p>

          {/* Creator Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <User size={16} style={{ color: '#6B7280' }} />
            <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Créée par</span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1F2937', marginBottom: '1rem' }}>
            {courseData.creator}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Calendar size={16} style={{ color: '#6B7280' }} />
            <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Créée le</span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1F2937' }}>
            {courseData.createdDate}
          </div>
        </div>

        {/* Right Content - Modules */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1.5rem' }}>
            <button style={{
              backgroundColor: '#F97316',
              color: 'white',
              border: 'none',
              padding: '0.625rem 1.25rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Edit size={16} />
              Modifier la formation
            </button>
            <button style={{
              backgroundColor: '#2D2B6B',
              color: 'white',
              border: 'none',
              padding: '0.625rem 1.25rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Plus size={16} />
              Nouveau module
            </button>
          </div>

          {/* Modules List */}
          {courseData.modules.map((module, index) => (
            <div key={module.id} style={{ marginBottom: '1.5rem' }}>
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                padding: '1rem 1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1F2937', margin: 0 }}>
                    Module {module.id} • {module.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ color: '#F97316', fontSize: '0.875rem', cursor: 'pointer' }}>Modifier</span>
                    <span style={{ color: '#2D2B6B', fontSize: '0.875rem', cursor: 'pointer' }}>+ nouveau contenu</span>
                  </div>
                </div>

                {/* Content Items */}
                {module.contents.map((content) => (
                  <div 
                    key={content.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      backgroundColor: content.locked ? '#F9FAFB' : 'white',
                      borderRadius: '6px',
                      marginBottom: '0.5rem',
                      border: '1px solid #E5E7EB'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      {content.type === 'document' ? (
                        <FileText size={20} style={{ color: content.locked ? '#9CA3AF' : '#1F2937' }} />
                      ) : (
                        <Video size={20} style={{ color: content.locked ? '#9CA3AF' : '#1F2937' }} />
                      )}
                      <span style={{ 
                        fontSize: '0.875rem', 
                        color: content.locked ? '#9CA3AF' : '#1F2937',
                        flex: 1
                      }}>
                        {content.title}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {content.size && (
                        <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>{content.size}</span>
                      )}
                      {content.progress > 0 && (
                        <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>{content.progress}%</span>
                      )}
                      {content.status && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: content.status === 'Complété' ? '#10B981' : '#F97316',
                          fontWeight: '500'
                        }}>
                          {content.status}
                        </span>
                      )}
                      {content.locked && (
                        <Lock size={16} style={{ color: '#9CA3AF' }} />
                      )}
                      <button style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        color: '#6B7280',
                        fontSize: '1.25rem',
                        padding: 0
                      }}>⋯</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FormationDetailsPage;