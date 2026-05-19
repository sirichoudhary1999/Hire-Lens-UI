import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaFileUpload, FaKeyboard } from 'react-icons/fa';
import './UploadResume.css';

const UploadResume = () => {
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'json'
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('My Resume');
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // JSON mode form data
  const [jsonData, setJsonData] = useState({
    title: 'My Resume',
    is_primary: false,
    personal_info: {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      summary: ''
    },
    experiences: [],
    education: [],
    skills: { technical: [], soft: [], languages: [], tools: [] },
    projects: [],
    certifications: []
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split('.').pop().toLowerCase();
      if (fileType !== 'pdf' && fileType !== 'docx') {
        alert('Only PDF and DOCX files are allowed');
        e.target.value = '';
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('is_primary', isPrimary);

      const response = await axios.post(
        'http://127.0.0.1:5000/resume/upload',
        formData,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      if (response.data.meta.success) {
        alert('Resume uploaded successfully!');
        navigate('/resume/view');
      }
    } catch (err) {
      console.error("Error uploading resume:", err);
      alert(err.response?.data?.meta?.message || "Failed to upload resume");
    } finally {
      setLoading(false);
    }
  };

  const handleJsonChange = (field, value) => {
    setJsonData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePersonalInfoChange = (field, value) => {
    setJsonData(prev => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        [field]: value
      }
    }));
  };

  const handleSkillsChange = (category, value) => {
    const skillsArray = value.split(',').map(s => s.trim()).filter(s => s);
    setJsonData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: skillsArray
      }
    }));
  };

  const handleJsonSubmit = async (e) => {
    e.preventDefault();

    if (!jsonData.personal_info.name || !jsonData.personal_info.email) {
      alert('Name and email are required');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        'http://127.0.0.1:5000/resume/upload',
        jsonData,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.meta.success) {
        alert('Resume created successfully!');
        navigate('/resume/view');
      }
    } catch (err) {
      console.error("Error creating resume:", err);
      alert(err.response?.data?.meta?.message || "Failed to create resume");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-resume-container">
      <h2>Upload or Create Resume</h2>

      <div className="mode-selector">
        <button
          className={`mode-btn ${uploadMode === 'file' ? 'active' : ''}`}
          onClick={() => setUploadMode('file')}
        >
          <FaFileUpload /> Upload File
        </button>
        <button
          className={`mode-btn ${uploadMode === 'json' ? 'active' : ''}`}
          onClick={() => setUploadMode('json')}
        >
          <FaKeyboard /> Create Manually
        </button>
      </div>

      {uploadMode === 'file' ? (
        <form onSubmit={handleFileUpload} className="upload-form">
          <div className="form-group">
            <label htmlFor="title">Resume Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Software Engineer Resume"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="file">Upload Resume (PDF or DOCX)</label>
            <input
              type="file"
              id="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              required
            />
            {file && <p className="file-name">Selected: {file.name}</p>}
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
              />
              Set as primary resume
            </label>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload Resume'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleJsonSubmit} className="json-form">
          <div className="form-section">
            <h3>Resume Details</h3>
            <div className="form-group">
              <label>Resume Title</label>
              <input
                type="text"
                value={jsonData.title}
                onChange={(e) => handleJsonChange('title', e.target.value)}
                placeholder="e.g., Software Engineer Resume"
                required
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={jsonData.is_primary}
                  onChange={(e) => handleJsonChange('is_primary', e.target.checked)}
                />
                Set as primary resume
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={jsonData.personal_info.name}
                  onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={jsonData.personal_info.email}
                  onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={jsonData.personal_info.phone}
                  onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={jsonData.personal_info.location}
                  onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                  placeholder="San Francisco, CA"
                />
              </div>
            </div>

            <div className="form-group">
              <label>LinkedIn</label>
              <input
                type="url"
                value={jsonData.personal_info.linkedin}
                onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>

            <div className="form-group">
              <label>Professional Summary</label>
              <textarea
                value={jsonData.personal_info.summary}
                onChange={(e) => handlePersonalInfoChange('summary', e.target.value)}
                placeholder="Brief professional summary..."
                rows="4"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Skills</h3>
            <div className="form-group">
              <label>Technical Skills (comma-separated)</label>
              <input
                type="text"
                onChange={(e) => handleSkillsChange('technical', e.target.value)}
                placeholder="JavaScript, Python, React, Node.js"
              />
            </div>
            <div className="form-group">
              <label>Soft Skills (comma-separated)</label>
              <input
                type="text"
                onChange={(e) => handleSkillsChange('soft', e.target.value)}
                placeholder="Leadership, Communication, Problem Solving"
              />
            </div>
            <div className="form-group">
              <label>Languages (comma-separated)</label>
              <input
                type="text"
                onChange={(e) => handleSkillsChange('languages', e.target.value)}
                placeholder="English, Spanish, French"
              />
            </div>
            <div className="form-group">
              <label>Tools (comma-separated)</label>
              <input
                type="text"
                onChange={(e) => handleSkillsChange('tools', e.target.value)}
                placeholder="Git, Docker, AWS, Jenkins"
              />
            </div>
          </div>

          <p className="note">
            Note: You can add experiences, education, projects, and certifications after creating the resume using the Edit feature.
          </p>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating...' : 'Create Resume'}
          </button>
        </form>
      )}

      <div className="footer-actions">
        <button
          type="button"
          className="nav-btn home-btn"
          onClick={() => navigate('/dashboard')}
        >
          Home
        </button>
        <button
          type="button"
          className="nav-btn cancel-btn"
          onClick={() => navigate('/resume')}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default UploadResume;
