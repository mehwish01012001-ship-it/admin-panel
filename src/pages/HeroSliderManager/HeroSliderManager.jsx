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
    setSubmitting(true);

    const payload = new FormData();
    payload.append('title', form.title.trim());
    payload.append('highlight', form.highlight.trim());
    payload.append('description', form.description.trim());
    payload.append('isActive', String(form.isActive));

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
      setSubmitting(false);
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
    if (!window.confirm('Are you sure you want to delete this slide?')) return;

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

  const isVideoFile = (url) => typeof url === 'string' && /\.(mp4|webm|ogg|mov)$/i.test(url);

  return (
    <main className="hsm-root">
      <header className="hsm-header">
        <h1 className="hsm-title">Hero Slider Manager</h1>
        <p className="hsm-subtitle">Manage hero slides for your main page banner</p>
      </header>

      <section>
        <form onSubmit={handleSubmit} className="hsm-form">
          <div className="hsm-input-group">
            <input
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="Slide Title"
              className="hsm-input"
              required
            />
          </div>

          <div className="hsm-input-group">
            <input
              name="highlight"
              type="text"
              value={form.highlight}
              onChange={handleChange}
              placeholder="Badge / Highlight Text (e.g. Save up to Rs. 500)"
              className="hsm-input"
            />
          </div>

          <div className="hsm-input-group">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Description..."
              rows={3}
              className="hsm-textarea"
              required
            />
          </div>

          <div className="hsm-form-row">
            <label className="hsm-checkbox-label">
              <input
                name="isActive"
                type="checkbox"
                checked={form.isActive}
                onChange={handleChange}
                className="hsm-checkbox"
              />
              <span>Status: Active</span>
            </label>

            <input
              name="image"
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              onChange={handleChange}
              className="hsm-file-input"
            />
          </div>

          <div className="hsm-actions">
            <button
              type="submit"
              disabled={submitting}
              className="hsm-btn hsm-btn-primary"
            >
              {submitting ? 'Saving...' : editingId ? 'Update Slide' : 'Add Slide'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="hsm-btn hsm-btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2 className="hsm-section-title">Current Hero Slides</h2>

        {loading ? (
          <div className="hsm-loader">
            <span>Loading slides...</span>
          </div>
        ) : slides.length === 0 ? (
          <p className="hsm-empty-state">No hero slides found.</p>
        ) : (
          <div className="hsm-grid">
            {slides.map((slide) => (
              <article
                key={slide._id}
                className={`hsm-card ${!slide.isActive ? 'hsm-card-disabled' : ''}`}
              >
                <div className="hsm-media-frame">
                  {slide.image ? (
                    slide.mediaType === 'video' || isVideoFile(slide.image) ? (
                      <video src={slide.image} preload="metadata" muted playsInline />
                    ) : (
                      <img src={slide.image} alt={slide.title} loading="lazy" />
                    )
                  ) : (
                    <div className="hsm-media-fallback">No Media Available</div>
                  )}
                </div>

                <div className="hsm-card-body">
                  <header>
                    {slide.highlight && (
                      <span className="hsm-badge">{slide.highlight}</span>
                    )}
                    <h3 className="hsm-card-title">{slide.title}</h3>
                  </header>

                  <p className="hsm-card-desc">{slide.description}</p>

                  <footer className="hsm-card-footer">
                    <span
                      className={`hsm-status ${
                        slide.isActive ? 'hsm-status-active' : 'hsm-status-inactive'
                      }`}
                    >
                      {slide.isActive ? 'Active' : 'Inactive'}
                    </span>

                    <div className="hsm-card-actions">
                      <button
                        type="button"
                        onClick={() => handleEdit(slide)}
                        className="hsm-link-btn hsm-link-edit"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(slide._id)}
                        className="hsm-link-btn hsm-link-danger"
                      >
                        Delete
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