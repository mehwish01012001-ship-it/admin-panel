import React, { useEffect, useState, useCallback } from 'react';
import { FiMail, FiMessageSquare, FiCheckCircle, FiClock, FiSend } from 'react-icons/fi';
import { contactService } from '../../services/contactService';
import './ContactMessages.css';

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMessages = useCallback(async () => {
    try {
      setError('');
      const response = await contactService.getAllMessages();
      const list = response?.data?.messages || response?.data || response?.messages || [];
      setMessages(Array.isArray(list) ? list : []);
    } catch (err) {
      setError('Unable to load contact messages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleUpdateStatus = async (id, newStatus) => {
    const previousMessages = [...messages];

    // Optimistic UI update for immediate response (< 1s)
    setMessages((prev) =>
      prev.map((msg) => (msg._id === id ? { ...msg, status: newStatus } : msg))
    );

    try {
      await contactService.updateMessageStatus(id, newStatus);
    } catch (err) {
      // Rollback on API failure
      setMessages(previousMessages);
      setError('Unable to update message status.');
    }
  };

  const getStatusBadge = (status) => {
    const currentStatus = (status || 'new').toLowerCase();
    switch (currentStatus) {
      case 'read':
        return <span className="status-badge status-read"><FiCheckCircle /> Read</span>;
      case 'replied':
        return <span className="status-badge status-replied"><FiSend /> Replied</span>;
      default:
        return <span className="status-badge status-new"><FiClock /> New</span>;
    }
  };

  return (
    <div className="contact-messages-container">
      <header className="contact-messages-header">
        <h1>Contact Messages</h1>
        <p>Messages submitted from the contact form will appear here dynamically.</p>
      </header>

      {error && <div className="contact-messages-error">{error}</div>}

      {loading ? (
        <div className="contact-messages-loading">
          <div className="spinner"></div>
          <p>Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="contact-messages-empty">
          <FiMessageSquare className="empty-icon" />
          <p>No contact messages found.</p>
        </div>
      ) : (
        <div className="contact-messages-grid">
          {messages.map((message) => (
            <article key={message._id} className="message-card">
              <div className="message-card-header">
                <div className="sender-info">
                  <h3 className="sender-name">{message.name}</h3>
                  <span className="sender-email">
                    <FiMail className="inline-icon" /> {message.email}
                  </span>
                </div>
                <div className="header-meta">
                  {getStatusBadge(message.status)}
                  <time className="message-date">
                    {message.createdAt ? new Date(message.createdAt).toLocaleString() : ''}
                  </time>
                </div>
              </div>

              <div className="message-subject">
                <FiMessageSquare className="inline-icon" />
                <span>{message.subject || 'No Subject'}</span>
              </div>

              <div className="message-body">
                <p>{message.message}</p>
              </div>

              <footer className="message-card-actions">
                <button
                  type="button"
                  className={`action-btn btn-read ${message.status === 'read' ? 'active' : ''}`}
                  onClick={() => handleUpdateStatus(message._id, 'read')}
                >
                  Mark Read
                </button>
                <button
                  type="button"
                  className={`action-btn btn-replied ${message.status === 'replied' ? 'active' : ''}`}
                  onClick={() => handleUpdateStatus(message._id, 'replied')}
                >
                  Mark Replied
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactMessages;