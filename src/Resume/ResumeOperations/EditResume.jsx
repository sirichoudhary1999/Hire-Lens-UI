import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './EditResume.css';

const API_BASE = 'http://127.0.0.1:5000';

const EditResume = () => {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [resumeData, setResumeData] = useState({
    title: '',
    is_primary: false,
    personal_info: {},
    experiences: [],
    education: [],
    skills: {},
    projects: [],
    certifications: []
  });

  // Separate state for comma-separated skill inputs
  const [skillInputs, setSkillInputs] = useState({
    technical: '',
    soft: '',
    languages: '',
    tools: ''
  });

  useEffect(() => {
    fetchResume();
  }, [resumeId]);

  const getAuthToken = () => {
    const rawToken = localStorage.getItem('access_token') || '';
    return rawToken.replace(/^"|"$/g, '').trim();
  };

  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const buildUpdatePayload = () => ({
    title: resumeData.title || '',
    is_primary: !!resumeData.is_primary,
    personal_info: resumeData.personal_info || {},
    experiences: Array.isArray(resumeData.experiences) ? resumeData.experiences : [],
    education: Array.isArray(resumeData.education) ? resumeData.education : [],
    skills: resumeData.skills || {},
    projects: Array.isArray(resumeData.projects) ? resumeData.projects : [],
    certifications: Array.isArray(resumeData.certifications) ? resumeData.certifications : []
  });

  const fetchResume = async () => {
    try {
      const response = await axios.get(`${API_BASE}/resume/${resumeId}`, {
        headers: getAuthHeaders()
      });

      if (response.data.meta.success) {
        const resume = response.data.data.resume;
        console.log('Fetched resume data:', resume);
        console.log('Personal info:', resume.personal_info);
        console.log('Skills:', resume.skills);

        if (!resume.personal_info || typeof resume.personal_info !== 'object') {
          resume.personal_info = {};
        }

        if (!resume.skills || typeof resume.skills !== 'object') {
          resume.skills = {};
        }

        setResumeData(resume);

        const skillsToSet = {
          technical: Array.isArray(resume.skills?.technical) ? resume.skills.technical.join(', ') : '',
          soft: Array.isArray(resume.skills?.soft) ? resume.skills.soft.join(', ') : '',
          languages: Array.isArray(resume.skills?.languages) ? resume.skills.languages.join(', ') : '',
          tools: Array.isArray(resume.skills?.tools) ? resume.skills.tools.join(', ') : ''
        };
        setSkillInputs(skillsToSet);
        handleExtractData();
      }
    } catch (err) {
      console.error("Error fetching resume:", err);
      alert(err.response?.data?.meta?.message || "Failed to fetch resume");
      navigate('/resume/view');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setResumeData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePersonalInfoChange = (field, value) => {
    setResumeData(prev => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        [field]: value
      }
    }));
  };

  const handleSkillsChange = (category, value) => {
    // Update the input field
    setSkillInputs(prev => ({
      ...prev,
      [category]: value
    }));

    // Update the resume data with array
    const skillsArray = value.split(',').map(s => s.trim()).filter(s => s);
    setResumeData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: skillsArray
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!getAuthToken()) {
        alert('Session expired. Please login again.');
        navigate('/');
        return;
      }

      const payload = buildUpdatePayload();
      const requestOptions = {
        headers: getAuthHeaders()
      };

      // Try common backend route patterns to handle API path or method mismatches.
      const updateRequests = [
        () => axios.put(`${API_BASE}/resume/update/${resumeId}`, payload, requestOptions),
        () => axios.put(`${API_BASE}/resume/${resumeId}`, payload, requestOptions),
        () => axios.patch(`${API_BASE}/resume/${resumeId}`, payload, requestOptions)
      ];

      let lastError = null;
      for (const request of updateRequests) {
        try {
          const response = await request();
          if (response?.data?.meta?.success) {
            alert('Resume updated successfully!');
            navigate('/resume/view');
            return;
          }
        } catch (error) {
          lastError = error;
          const statusCode = error?.response?.status;
          if (![401, 404, 405].includes(statusCode)) {
            throw error;
          }
        }
      }

      if (lastError) {
        throw lastError;
      }
    } catch (err) {
      console.error("Error updating resume:", err);
      alert(err.response?.data?.meta?.message || "Failed to update resume");
    } finally {
      setSaving(false);
    }
  };

  const handleExtractData = async () => {

    setSaving(true);
    try {
      const response = await axios.post(
        `${API_BASE}/resume/optimize/${resumeId}`,
        {
          job_description: "Parse and extract all information from this resume into structured format. Extract all personal information, skills, experience, education, projects, and certifications.",
          ai_provider: "demo",
          create_new_version: false
        },
        {
          headers: getAuthHeaders()
        }
      );

      if (response.data.meta.success) {
        console.log('Data extracted successfully!');
      }
    } catch (err) {
      console.error("Error extracting data:", err);
      alert(err.response?.data?.meta?.message || "Failed to extract data");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading resume...</div>;
  }

  // Check if this is a file-uploaded resume with only raw text
  const hasRawTextOnly = resumeData.personal_info?.raw_text &&
                         !resumeData.personal_info?.name &&
                         Object.keys(resumeData.skills || {}).length === 0;

  // Check if resume has NO data at all (empty personal_info)
  const hasNoData = !resumeData.personal_info ||
                    (Object.keys(resumeData.personal_info).length === 0) ||
                    (!resumeData.personal_info.name && !resumeData.personal_info.email && !resumeData.personal_info.raw_text);

  return (
    <div className="edit-resume-container">
      <h2>Edit Resume</h2>

      {/* Show alert if resume needs data extraction */}
      {/* {hasRawTextOnly && (
        <div className="alert alert-warning">
          <h4>⚠️ Data Extraction Needed</h4>
          <p>This resume contains raw text but hasn't been parsed into structured fields yet.</p>
          <button type="button" className="extract-btn" onClick={handleExtractData} disabled={saving}>
            {saving ? 'Extracting...' : '🤖 Extract Data with AI'}
          </button>
        </div>
      )} */}

      {hasNoData && !resumeData.file_path && (
        <div className="alert alert-info">
          <h4>ℹ️ Empty Resume</h4>
          <p>This resume has no data yet. Fill in the form below to add your information.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-section">
          <h3>Resume Details</h3>
          <div className="form-group">
            <label>Resume Title</label>
            <input
              type="text"
              value={resumeData.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Resume Title"
              required
            />
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={resumeData.is_primary || false}
                onChange={(e) => handleChange('is_primary', e.target.checked)}
              />
              Set as primary resume
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={resumeData.personal_info?.name || ''}
                onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
                // placeholder="John Doe"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={resumeData.personal_info?.email || ''}
                onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                // placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={resumeData.personal_info?.phone || ''}
                onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                // placeholder="+1234567890"
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={resumeData.personal_info?.location || ''}
                onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                // placeholder="San Francisco, CA"
              />
            </div>
          </div>

          <div className="form-group">
            <label>LinkedIn</label>
            <input
              type="url"
              value={resumeData.personal_info?.linkedin || ''}
              onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
              // placeholder="https://linkedin.com/in/johndoe"
            />
          </div>

          <div className="form-group">
            <label>Professional Summary</label>
            <textarea
              value={resumeData.personal_info?.summary || ''}
              onChange={(e) => handlePersonalInfoChange('summary', e.target.value)}
              // placeholder="Brief professional summary..."
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
              value={skillInputs.technical}
              onChange={(e) => handleSkillsChange('technical', e.target.value)}
              // placeholder="JavaScript, Python, React, Node.js"
            />
          </div>
          <div className="form-group">
            <label>Soft Skills (comma-separated)</label>
            <input
              type="text"
              value={skillInputs.soft}
              onChange={(e) => handleSkillsChange('soft', e.target.value)}
              // placeholder="Leadership, Communication, Problem Solving"
            />
          </div>
          <div className="form-group">
            <label>Languages (comma-separated)</label>
            <input
              type="text"
              value={skillInputs.languages}
              onChange={(e) => handleSkillsChange('languages', e.target.value)}
              // placeholder="English, Spanish, French"
            />
          </div>
          <div className="form-group">
            <label>Tools (comma-separated)</label>
            <input
              type="text"
              value={skillInputs.tools}
              onChange={(e) => handleSkillsChange('tools', e.target.value)}
              // placeholder="Git, Docker, AWS, Jenkins"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="home-btn"
            onClick={() => navigate('/dashboard')}
          >
            Home
          </button>
          <button type="submit" className="submit-btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate('/resume/view')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditResume;
