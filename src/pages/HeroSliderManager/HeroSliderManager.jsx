import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './HeroSliderManager.css';

const INITIAL_FORM_STATE = {
  title: '',
  highlight: '',
  description: '',
  isActive: true,
  image: null,
};

const HeroSliderManager = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  
  const fileInputRef = useRef(null);

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const response = await api.get('/hero-slider');
      setSlides(response?.data?.slides || []);
    } catch (error) {
      toast.error('Unable to load hero slides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(INITIAL_FORM_STATE);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;
    
    if (type === 'file') {
      setForm((prev) => ({ ...prev, image: files[0] || null }));
      return;
    }

    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(false);

    const payload = new FormData();
    payload.append('title', form.title.trim());
    payload.append('highlight', form.highlight.trim());
    payload.append('description', form.description.trim());
    payload.append('isActive', String(form.isActive)); // Ensure uniform stringified boolean format for form-data body
    
    if (form.image) {
      payload.append('image', form.image);
    }

    try {
      if (editingId) {
        await api.put(`/hero-slider/${editingId}`, payload);
        toast.success('Hero slide updated successfully');
      } else {
        await api.post('/hero-slider', payload);
        toast.success('Hero slide added successfully');
      }
      resetForm();
      await fetchSlides();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save hero slide');
    } finally {
      setSubmitting(true);
    }
  };

  const handleEdit = (slide) => {
    setEditingId(slide._id);
    setForm({
      title: slide.title || '',
      highlight: slide.highlight || '',
      description: slide.description || '',
      isActive: slide.isActive !== false,
      image: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this hero slide?')) return;

    try {
      await api.delete(`/hero-slider/${id}`);
      toast.success('Hero slide deleted successfully');
      if (editingId === id) {
        resetForm();
      }
      await fetchSlides();
    } catch (error) {
      toast.error('Failed to delete hero slide');
    }
  };

  const isVideoFile = (url) => /\.(mp4|webm|ogg|mov)$/i.test(url);

  return (
    <main className="slider-manager">
      <header className="slider-manager__header">
        <h1 className="slider-manager__title">Hero Slider Manager</h1>
        <p className="slider-manager__subtitle">Create, update, and organize the live configuration profiles for your homepage viewport engine.</p>
      </header>

      <section className="slider-manager__workspace">
        <form onSubmit={handleSubmit} className="slider-manager__form">
          <div className="form-group">
            <input 
              name="title" 
              type="text"
              value={form.title} 
              onChange={handleChange} 
              placeholder="Slide Title"  
              required
            />
          </div>
          
          <div className="form-group">
            <input 
              name="highlight" 
              type="text"
              value={form.highlight} 
              onChange={handleChange} 
              placeholder="Context Highlight Text"  
            />
          </div>

          <div className="form-group">
            <textarea 
              name="description" 
              value={form.description} 
              onChange={handleChange} 
              placeholder="Structural Body Description..." 
              rows={4} 
              required
            />
          </div>

          <div className="form-element-row">
            <label className="slider-manager__checkbox-label">
              <input 
                name="isActive" 
                type="checkbox" 
                checked={form.isActive} 
                onChange={handleChange} 
              />
              <span>Publish Status: Active</span>
            </label>

            <input 
              name="image" 
              type="file" 
              ref={fileInputRef}
              accept="image/*,video/*" 
              onChange={handleChange} 
              className="slider-manager__file-input"
            />
          </div>

          <div className="slider-manager__form-actions">
            <button 
              type="submit" 
              disabled={submitting} 
              className="btn btn--primary"
            >
              {editingId ? 'Update Viewport Configuration' : 'Create Context Slide'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn btn--secondary">
                Cancel Refactor
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="slider-manager__inventory">
        <h2 className="slider-manager__section-heading">Active Content Stream</h2>
        
        {loading ? (
          <div className="slider-manager__loader" role="status">
            <span className="visual-indicator">Syncing remote media configurations...</span>
          </div>
        ) : slides.length === 0 ? (
          <p className="slider-manager__empty-state">No context layers are currently active in the ecosystem engine database.</p>
        ) : (
          <div className="slider-manager__grid">
            {slides.map((slide) => (
              <article key={slide._id} className={`slider-manager__card ${!slide.isActive ? 'slider-manager__card--disabled' : ''}`}>
                <div className="slider-manager__media-frame">
                  {slide.image ? (
                    slide.mediaType === 'video' || isVideoFile(slide.image) ? (
                      <video src={slide.image} preload="metadata" muted playsInline />
                    ) : (
                      <img src={slide.image} alt={slide.title} loading="lazy" />
                    )
                  ) : (
                    <div className="slider-manager__media-fallback">Missing Engine Resource</div>
                  )}
                </div>
                
                <div className="slider-manager__card-body">
                  <header className="slider-manager__card-header">
                    <span className="slider-manager__card-badge">{slide.highlight || 'Global Context'}</span>
                    <h3 className="slider-manager__card-title">{slide.title}</h3>
                  </header>
                  
                  <p className="slider-manager__card-desc">{slide.description}</p>
                  
                  <footer className="slider-manager__card-footer">
                    <span className={`status-pill ${slide.isActive ? 'status-pill--active' : 'status-pill--inactive'}`}>
                      {slide.isActive ? 'Live Engine Target' : 'Staged Context Layer'}
                    </span>
                    <div className="slider-manager__card-actions">
                      <button 
                        type="button" 
                        onClick={() => handleEdit(slide)} 
                        className="btn-link btn-link--edit"
                        aria-label={`Edit profile ${slide.title}`}
                      >
                        Modify
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDelete(slide._id)} 
                        className="btn-link btn-link--danger"
                        aria-label={`Purge profile ${slide.title}`}
                      >
                        Purge
                      </button>
                    </div>
                  </footer>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default HeroSliderManager;