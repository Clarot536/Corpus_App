import React, { useState, useEffect } from 'react';
import axios from 'axios';

const allowedLanguages = [
  'assamese', 'bengali', 'bodo', 'dogri', 'gujarati', 'hindi', 'kannada',
  'kashmiri', 'konkani', 'maithili', 'malayalam', 'marathi', 'meitei', 'nepali',
  'odia', 'punjabi', 'sanskrit', 'santali', 'sindhi', 'tamil', 'telugu', 'urdu'
];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: 'ab9fa2ce-1f83-4e91-b89d-cca18e8b301e', // default or from select
    media_type: 'text',
    language: '',
    release_rights: 'creator',
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('https://api.corpus.swecha.org/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        console.log('User data from /auth/me:', res.data); // Debug log to inspect user object
      } catch (err) {
        console.error('Error fetching user:', err);
        setMessage('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'media_type') {
      if (value === 'text') {
        setFile(null);
      } else {
        setFormData((prev) => ({ ...prev, description: '' }));
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const mime = selectedFile.type;
      if (mime.startsWith('audio/')) {
        setFormData((prev) => ({ ...prev, media_type: 'audio' }));
      } else if (mime.startsWith('video/')) {
        setFormData((prev) => ({ ...prev, media_type: 'video' }));
      } else {
        setFormData((prev) => ({ ...prev, media_type: 'text' }));
      }
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.title.trim()) {
      setMessage('Title is required.');
      return;
    }
    if (!formData.category_id.trim()) {
      setMessage('Category ID is required.');
      return;
    }
    if (!formData.language.trim()) {
      setMessage('Language is required.');
      return;
    }
    if (!allowedLanguages.includes(formData.language.toLowerCase())) {
      setMessage(`Language must be one of: ${allowedLanguages.join(', ')}`);
      return;
    }
    if (!file && !formData.description.trim()) {
      setMessage('Please provide a description or upload a file.');
      return;
    }
    if (!user) {
      setMessage('User info not loaded.');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      // Determine user ID field dynamically
      const userId =
        user.uid ||
        user.id ||
        user._id ||
        user.uuid ||
        user.user_id || // add more keys if needed
        null;

      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid or missing user ID.');
      }

      // UUID for upload (normally from chunk upload response)
      const upload_uuid = crypto.randomUUID();

      const payload = new URLSearchParams();
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      payload.append('category_id', formData.category_id);
      payload.append('user_id', userId);
      payload.append('media_type', formData.media_type);
      payload.append('upload_uuid', upload_uuid);
      payload.append('filename', file ? file.name : formData.title + '.txt');
      payload.append('total_chunks', 1);
      payload.append('latitude', 0);
      payload.append('longitude', 0);
      payload.append('release_rights', formData.release_rights);
      payload.append('language', formData.language.toLowerCase());
      payload.append('use_uid_filename', true);

      const res = await axios.post(
        'https://api.corpus.swecha.org/api/v1/records/upload',
        payload,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage('Upload successful!');
      console.log('Upload success:', res.data);

      setFormData({
        title: '',
        description: '',
        category_id: formData.category_id,
        media_type: 'text',
        language: '',
        release_rights: 'creator',
      });
      setFile(null);
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message);
      setMessage('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div>Loading your profile...</div>;
  if (!user) return <div>Failed to load user data.</div>;

  return (
    <div style={styles.container}>
      <h1>Welcome, {user.name || user.phone || 'User'}!</h1>
      <p>
        <strong>Phone:</strong> {user.phone}
      </p>
      <p>
        <strong>Email:</strong> {user.email || 'N/A'}
      </p>

      <hr style={{ margin: '2rem 0' }} />

      <h2>Upload New Record</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          name="title"
          placeholder="Title *"
          value={formData.title}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <textarea
          name="description"
          placeholder="Description (text content)"
          value={formData.description}
          onChange={handleChange}
          disabled={file !== null}
          style={{ ...styles.input, height: '100px' }}
        />

        <input
          type="text"
          name="category_id"
          placeholder="Category ID *"
          value={formData.category_id}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <select
          name="media_type"
          value={formData.media_type}
          onChange={handleChange}
          disabled={file !== null}
          style={styles.input}
        >
          <option value="text">Text</option>
          <option value="audio">Audio</option>
          <option value="video">Video</option>
        </select>

        <select
          name="language"
          value={formData.language}
          onChange={handleChange}
          required
          style={styles.input}
        >
          <option value="">Select Language *</option>
          {allowedLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>

        <select
          name="release_rights"
          value={formData.release_rights}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="creator">Creator</option>
          <option value="family_or_friend">Family or Friend</option>
        </select>

        <label style={{ marginTop: '1rem' }}>
          Upload a file (optional if text description provided):
          <input
            type="file"
            onChange={handleFileChange}
            style={{ marginTop: '0.5rem' }}
            accept="text/*,audio/*,video/*"
          />
        </label>

        <button
          type="submit"
          disabled={uploading}
          style={{
            ...styles.button,
            opacity: uploading ? 0.6 : 1,
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          {uploading ? 'Uploading...' : 'Submit'}
        </button>
      </form>

      {message && (
        <p
          style={{
            marginTop: '1rem',
            color: message.toLowerCase().includes('failed') ? 'red' : 'green',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '600px',
    margin: 'auto',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  input: {
    padding: '0.6rem',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    width: '100%',
    boxSizing: 'border-box',
  },
  button: {
    padding: '0.75rem',
    fontSize: '1.1rem',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    transition: 'background-color 0.3s ease',
  },
};

export default Dashboard;
