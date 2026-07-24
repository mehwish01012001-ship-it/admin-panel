import React, { useEffect, useState } from 'react';
import { FiMail, FiMessageSquare, FiCheckCircle } from 'react-icons/fi';
import { contactService } from '../../services/contactService';

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await contactService.getAllMessages();
      setMessages(response?.data?.messages || []);
    } catch (err) {
      setError('Unable to load contact messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await contactService.updateMessageStatus(id, status);
      fetchMessages();
    } catch (err) {
      setError('Unable to update message status.');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '8px' }}>Contact Messages</h1>
      <p style={{ marginBottom: '24px', color: '#666' }}>Messages submitted from the contact form will appear here.</p>

      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      {loading ? (
        <p>Loading messages...</p>
      ) : messages.length === 0 ? (
        <p>No contact messages yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {messages.map((message) => (
            <div key={message._id} style={{ border: '1px solid #e5e5e5', borderRadius: '12px', padding: '16px', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                <strong>{message.name}</strong>
                <span style={{ fontSize: '12px', color: '#888' }}>{new Date(message.createdAt).toLocaleString()}</span>
              </div>
              <p style={{ margin: '4px 0' }}><FiMail style={{ marginRight: '6px' }} />{message.email}</p>
              <p style={{ margin: '4px 0' }}><FiMessageSquare style={{ marginRight: '6px' }} />{message.subject}</p>
              <p style={{ margin: '8px 0 12px', color: '#444' }}>{message.message}</p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', textTransform: 'capitalize', color: '#8a5a00' }}>{message.status || 'new'}</span>
                <button onClick={() => updateStatus(message._id, 'read')} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #ccc', background: '#f7f7f7', cursor: 'pointer' }}>
                  Mark Read
                </button>
                <button onClick={() => updateStatus(message._id, 'replied')} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #ccc', background: '#f7f7f7', cursor: 'pointer' }}>
                  Mark Replied
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactMessages;
