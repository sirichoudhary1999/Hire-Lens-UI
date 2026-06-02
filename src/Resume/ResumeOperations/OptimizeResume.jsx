import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FaRobot } from 'react-icons/fa';
import ConfirmationModal from '../../Components/ConfirmationModal/ConfirmationModal';
import { useConfirmationModal } from '../../hooks/useConfirmationModal';
import './OptimizeResume.css';

const OptimizeResume = () => {
  const { resumeId: paramResumeId } = useParams();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(paramResumeId || '');
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const { modalState, showAlert, onConfirm, onCancel } = useConfirmationModal();

  const [formData, setFormData] = useState({
    job_description: '',
    job_title: '',
    ai_provider: 'demo',
    create_new_version: true
  });

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get('http://127.0.0.1:5000/resume/all', {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.data.meta.success) {
        setResumes(response.data.data.resumes);
      }
    } catch (err) {
      console.error("Error fetching resumes:", err);
      await showAlert(err.response?.data?.meta?.message || 'Failed to fetch resumes', 'Load Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptimize = async (e) => {
    e.preventDefault();

    if (!selectedResumeId) {
      await showAlert('Please select a resume to optimize', 'Validation Error');
      return;
    }

    if (!formData.job_description.trim()) {
      await showAlert('Please enter a job description', 'Validation Error');
      return;
    }

    setOptimizing(true);

    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        `http://127.0.0.1:5000/resume/optimize/${selectedResumeId}`,
        formData,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.meta.success) {
        const optimizationLog = response.data.data.optimization_log;
        await showAlert(
          `Resume optimized successfully!\n\n` +
          `AI Provider: ${optimizationLog.ai_provider}\n` +
          `Processing Time: ${optimizationLog.processing_time_ms}ms\n\n` +
          `${optimizationLog.optimization_notes}`,
          'Optimization Complete'
        );
        navigate('/resume/view');
      }
    } catch (err) {
      console.error("Error optimizing resume:", err);
      await showAlert(
        err.response?.data?.meta?.message || 'Failed to optimize resume. Make sure AI API keys are configured.',
        'Optimization Failed'
      );
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="optimize-resume-container">
      <div className="optimize-header">
        <FaRobot size={40} className="robot-icon" />
        <h2>AI-Powered Resume Optimization</h2>
        <p>Optimize your resume for specific job descriptions using AI</p>
      </div>

      {loading ? (
        <div className="loading">Loading resumes...</div>
      ) : resumes.length === 0 ? (
        <div className="no-resumes">
          <p>No resumes found. Upload a resume first to optimize it!</p>
          <button
            className="upload-btn"
            onClick={() => navigate('/resume/upload')}
          >
            Upload Resume
          </button>
        </div>
      ) : (
        <form onSubmit={handleOptimize} className="optimize-form">
          <div className="form-section">
            <h3>Select Resume</h3>
            <div className="form-group">
              <label>Choose Resume to Optimize</label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                required
              >
                <option value="">-- Select a Resume --</option>
                {resumes.map(resume => (
                  <option key={resume.id} value={resume.id}>
                    {resume.title} (v{resume.version})
                    {resume.is_primary ? ' - Primary' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Job Details</h3>
            <div className="form-group">
              <label>Job Title (optional)</label>
              <input
                type="text"
                value={formData.job_title}
                onChange={(e) => handleChange('job_title', e.target.value)}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>

            <div className="form-group">
              <label>Job Description *</label>
              <textarea
                value={formData.job_description}
                onChange={(e) => handleChange('job_description', e.target.value)}
                placeholder="Paste the full job description here..."
                rows="10"
                required
              />
              <small className="helper-text">
                Include the complete job description for best results
              </small>
            </div>
          </div>

          <div className="form-section">
            <h3>Optimization Settings</h3>
            <div className="form-group">
              <label>AI Provider</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="ai_provider"
                    value="demo"
                    checked={formData.ai_provider === 'demo'}
                    onChange={(e) => handleChange('ai_provider', e.target.value)}
                  />
                  Demo (Free - No API key required)
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="ai_provider"
                    value="openai"
                    checked={formData.ai_provider === 'openai'}
                    onChange={(e) => handleChange('ai_provider', e.target.value)}
                  />
                  OpenAI (GPT-4)
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="ai_provider"
                    value="anthropic"
                    checked={formData.ai_provider === 'anthropic'}
                    onChange={(e) => handleChange('ai_provider', e.target.value)}
                  />
                  Anthropic (Claude)
                </label>
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.create_new_version}
                  onChange={(e) => handleChange('create_new_version', e.target.checked)}
                />
                Create new version (recommended)
              </label>
              <small className="helper-text">
                {formData.create_new_version
                  ? 'A new optimized version will be created, keeping your original resume intact'
                  : 'Your existing resume will be updated with optimized content'}
              </small>
            </div>
          </div>

          <div className="info-box">
            <h4>What does AI optimization do?</h4>
            <ul>
              <li>Analyzes the job description for key requirements and skills</li>
              <li>Restructures your resume to emphasize relevant experience</li>
              <li>Rewrites bullet points with action verbs and quantifiable achievements</li>
              <li>Optimizes for ATS (Applicant Tracking Systems)</li>
              <li>Maintains truthfulness - no false information added</li>
            </ul>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="home-btn"
              onClick={() => navigate('/dashboard')}
            >
              Home
            </button>
            <button
              type="submit"
              className="optimize-btn"
              disabled={optimizing}
            >
              {optimizing ? (
                <>
                  <FaRobot className="spinning" /> Optimizing...
                </>
              ) : (
                <>
                  <FaRobot /> Optimize Resume
                </>
              )}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/resume')}
            >
              Cancel
            </button>
          </div>

          {optimizing && (
            <div className="optimizing-message">
              <p>AI is analyzing your resume and the job description...</p>
              <p>This may take 30-60 seconds depending on the AI provider.</p>
            </div>
          )}
        </form>
      )}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </div>
  );
};

export default OptimizeResume;
