import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { API_BASE } from '../../utils/api';

import ConfirmationModal from '../../Components/ConfirmationModal/ConfirmationModal';
import { useConfirmationModal } from '../../hooks/useConfirmationModal';
import {
  CORE_LIST_SECTIONS,
  DEFAULT_FORMAT,
  FORMAT_DEFINITIONS,
  FORMAT_OPTIONS,
  defaultResumeData,
  listToText,
  normalizeResumeFormat,
  skillsArrayToText,
  skillsTextToArray,
  textToList
} from './resumeFormatConfig';
import './EditResume.css';

const EditResume = () => {
  const createEmptyExperience = () => ({
    company_name: '',
    role: '',
    start_year: '',
    end_year: '',
    responsibilities: []
  });

  const createEmptyEducation = () => ({
    institution: '',
    degree: '',
    start_date: '',
    end_date: '',
    cgpa_or_percentage: ''
  });

  const { resumeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [permissionMode, setPermissionMode] = useState('manual');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(DEFAULT_FORMAT);
  const [autosaveNotice, setAutosaveNotice] = useState('');
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldType, setCustomFieldType] = useState('text');
  const { modalState, showAlert, showConfirm, onConfirm, onCancel } = useConfirmationModal();

  const [resumeData, setResumeData] = useState({
    ...defaultResumeData
  });

  const [skillInputs, setSkillInputs] = useState({
    technical: '',
    soft: '',
    languages: '',
    tools: '',
    keywords: ''
  });

  const [listInputs, setListInputs] = useState({
    experiences: '',
    education: '',
    projects: '',
    certifications: ''
  });

  const [customFieldDefs, setCustomFieldDefs] = useState([]);

  const activeDefinition = useMemo(
    () => FORMAT_DEFINITIONS[selectedFormat] || FORMAT_DEFINITIONS.standard,
    [selectedFormat]
  );

  const visibleListSections = useMemo(() => {
    const merged = [...CORE_LIST_SECTIONS, ...(activeDefinition.listSections || [])];
    const seen = new Set();
    return merged.filter((section) => {
      if (!section?.key || seen.has(section.key)) {
        return false;
      }
      seen.add(section.key);
      return true;
    });
  }, [activeDefinition]);

  const derivedPersonalFields = useMemo(() => {
    const reservedKeys = new Set(['resume_format', 'custom_field_defs', 'custom_fields']);
    const fields = [...(activeDefinition.personalFields || [])];
    const knownKeys = new Set(fields.map((field) => field.key));

    Object.entries(resumeData.personal_info || {}).forEach(([key, value]) => {
      if (reservedKeys.has(key) || knownKeys.has(key) || value == null) {
        return;
      }

      const label = key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

      fields.push({
        key,
        label,
        type: typeof value === 'string' && value.length > 120 ? 'textarea' : 'text',
        rows: 4,
        placeholder: `Enter ${label.toLowerCase()}`
      });
    });

    return fields;
  }, [activeDefinition.personalFields, resumeData.personal_info]);

  const derivedSkillFields = useMemo(() => {
    const fields = [...(activeDefinition.skillFields || [])];
    const knownKeys = new Set(fields.map((field) => field.key));

    Object.entries(resumeData.skills || {}).forEach(([key, value]) => {
      if (knownKeys.has(key) || value == null) {
        return;
      }

      const label = key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

      fields.push({
        key,
        label,
        placeholder: `${label} 1, ${label} 2`
      });
    });

    return fields;
  }, [activeDefinition.skillFields, resumeData.skills]);

  useEffect(() => {
    fetchResume();
  }, [resumeId]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const payload = {
      selectedFormat,
      resumeData,
      skillInputs,
      listInputs,
      customFieldDefs,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem(`resume_edit_draft_${resumeId}`, JSON.stringify(payload));
    setAutosaveNotice('Draft autosaved');
    const timer = setTimeout(() => setAutosaveNotice(''), 1200);
    return () => clearTimeout(timer);
  }, [loading, resumeId, selectedFormat, resumeData, skillInputs, listInputs, customFieldDefs]);

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
    personal_info: {
      ...(resumeData.personal_info || {}),
      resume_format: selectedFormat,
      custom_field_defs: customFieldDefs
    },
    experiences: Array.isArray(resumeData.experiences) ? resumeData.experiences : [],
    education: Array.isArray(resumeData.education) ? resumeData.education : [],
    skills: resumeData.skills || {},
    projects: Array.isArray(resumeData.projects) ? resumeData.projects : [],
    certifications: Array.isArray(resumeData.certifications) ? resumeData.certifications : []
  });

  const applyResumeToState = (resume) => {
    const normalized = {
      ...defaultResumeData,
      ...resume,
      personal_info: {
        ...defaultResumeData.personal_info,
        ...(resume.personal_info || {})
      },
      skills: {
        ...defaultResumeData.skills,
        ...(resume.skills || {})
      }
    };

    setResumeData(normalized);

    const draftFormat = normalizeResumeFormat(normalized.personal_info?.resume_format);
    setSelectedFormat(draftFormat);

    const nextSkillInputs = {
      technical: skillsArrayToText(normalized.skills, 'technical'),
      soft: skillsArrayToText(normalized.skills, 'soft'),
      languages: skillsArrayToText(normalized.skills, 'languages'),
      tools: skillsArrayToText(normalized.skills, 'tools'),
      keywords: skillsArrayToText(normalized.skills, 'keywords')
    };
    setSkillInputs(nextSkillInputs);

    const nextListInputs = {
      experiences: listToText(normalized.experiences),
      education: listToText(normalized.education),
      projects: listToText(normalized.projects),
      certifications: listToText(normalized.certifications)
    };
    setListInputs(nextListInputs);

    const defs = Array.isArray(normalized.personal_info?.custom_field_defs)
      ? normalized.personal_info.custom_field_defs
      : [];
    setCustomFieldDefs(defs);
  };

  const fetchResume = async () => {
    try {
      const response = await api.get(`${API_BASE}/resume/${resumeId}`, {
        headers: getAuthHeaders()
      });

      if (response.data.meta.success) {
        const resume = response.data.data.resume;
        applyResumeToState(resume);
      }
    } catch (err) {
      console.error('Error fetching resume:', err);
      await showAlert(err.response?.data?.meta?.message || 'Failed to fetch resume', 'Load Failed');
      navigate('/resume/view');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setResumeData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePersonalInfoChange = (field, value) => {
    setResumeData((prev) => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        [field]: value
      }
    }));
  };

  const handleSkillsChange = (category, value) => {
    setSkillInputs((prev) => ({
      ...prev,
      [category]: value
    }));

    const skillsArray = skillsTextToArray(value);
    setResumeData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: skillsArray
      }
    }));
  };

  const handleListSectionChange = (sectionKey, value) => {
    setListInputs((prev) => ({
      ...prev,
      [sectionKey]: value
    }));

    setResumeData((prev) => ({
      ...prev,
      [sectionKey]: textToList(value, sectionKey)
    }));
  };

  const handleFormatChange = (value) => {
    const normalizedFormat = normalizeResumeFormat(value);
    setSelectedFormat(normalizedFormat);
    handlePersonalInfoChange('resume_format', normalizedFormat);
  };

  const responsibilitiesToText = (value) => {
    if (Array.isArray(value)) {
      return value.join('\n');
    }
    return typeof value === 'string' ? value : '';
  };

  const textToResponsibilities = (value) => {
    return (value || '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const updateExperienceField = (index, field, value) => {
    setResumeData((prev) => {
      const existing = Array.isArray(prev.experiences) ? [...prev.experiences] : [];
      while (existing.length <= index) {
        existing.push(createEmptyExperience());
      }

      const nextValue = field === 'responsibilities' ? textToResponsibilities(value) : value;
      existing[index] = {
        ...createEmptyExperience(),
        ...(existing[index] || {}),
        [field]: nextValue
      };

      return {
        ...prev,
        experiences: existing
      };
    });
  };

  const addExperience = () => {
    setResumeData((prev) => ({
      ...prev,
      experiences: [...(Array.isArray(prev.experiences) ? prev.experiences : []), createEmptyExperience()]
    }));
  };

  const removeExperience = (index) => {
    setResumeData((prev) => ({
      ...prev,
      experiences: (Array.isArray(prev.experiences) ? prev.experiences : []).filter((_, idx) => idx !== index)
    }));
  };

  const updateEducationField = (index, field, value) => {
    setResumeData((prev) => {
      const existing = Array.isArray(prev.education) ? [...prev.education] : [];
      while (existing.length <= index) {
        existing.push(createEmptyEducation());
      }

      existing[index] = {
        ...createEmptyEducation(),
        ...(existing[index] || {}),
        [field]: value
      };

      return {
        ...prev,
        education: existing
      };
    });
  };

  const addEducation = () => {
    setResumeData((prev) => ({
      ...prev,
      education: [...(Array.isArray(prev.education) ? prev.education : []), createEmptyEducation()]
    }));
  };

  const removeEducation = (index) => {
    setResumeData((prev) => ({
      ...prev,
      education: (Array.isArray(prev.education) ? prev.education : []).filter((_, idx) => idx !== index)
    }));
  };

  const addCustomField = () => {
    const trimmed = customFieldName.trim();
    if (!trimmed) {
      return;
    }

    const normalizedKey = trimmed.toLowerCase().replace(/\s+/g, '_');
    if (customFieldDefs.some((field) => field.key === normalizedKey)) {
      showAlert('Custom field already exists.', 'Duplicate Field');
      return;
    }

    const nextField = {
      key: normalizedKey,
      label: trimmed,
      type: customFieldType
    };

    const nextDefs = [...customFieldDefs, nextField];
    setCustomFieldDefs(nextDefs);
    setResumeData((prev) => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        custom_field_defs: nextDefs,
        custom_fields: {
          ...(prev.personal_info?.custom_fields || {}),
          [normalizedKey]: ''
        }
      }
    }));

    setCustomFieldName('');
    setCustomFieldType('text');
  };

  const handleCustomFieldValue = (key, value) => {
    setResumeData((prev) => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        custom_fields: {
          ...(prev.personal_info?.custom_fields || {}),
          [key]: value
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!getAuthToken()) {
        await showAlert('Session expired. Please login again.', 'Session Expired');
        navigate('/');
        return;
      }

      const payload = buildUpdatePayload();
      const requestOptions = {
        headers: getAuthHeaders()
      };

      const updateRequests = [
        () => api.put(`${API_BASE}/resume/update/${resumeId}`, payload, requestOptions),
        () => api.put(`${API_BASE}/resume/${resumeId}`, payload, requestOptions),
        () => api.patch(`${API_BASE}/resume/${resumeId}`, payload, requestOptions)
      ];

      let lastError = null;
      for (const request of updateRequests) {
        try {
          const response = await request();
          if (response?.data?.meta?.success) {
            localStorage.removeItem(`resume_edit_draft_${resumeId}`);
            await showAlert('Resume updated successfully!', 'Saved');
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
      console.error('Error updating resume:', err);
      await showAlert(err.response?.data?.meta?.message || 'Failed to update resume', 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!jobDescription.trim()) {
      await showAlert('Please enter the job description before analyzing.', 'Validation Error');
      return;
    }

    // Keep ATS analysis on custom format to preserve full editable structure.
    if (selectedFormat !== 'custom') {
      setSelectedFormat('custom');
      handlePersonalInfoChange('resume_format', 'custom');
    }

    let applyChanges = false;
    if (permissionMode === 'auto') {
      applyChanges = await showConfirm('Allow automatic updates to your resume based on analysis suggestions?', {
        title: 'Apply Suggestions',
        confirmText: 'Allow'
      });
    }

    setAnalysisLoading(true);
    try {
      const response = await api.post(
        `${API_BASE}/resume/analyze/${resumeId}`,
        {
          job_description: jobDescription,
          permission_mode: permissionMode,
          apply_changes: applyChanges
        },
        {
          headers: getAuthHeaders()
        }
      );

      if (response.data.meta.success) {
        const data = response.data.data;
        setAnalysisResult(data);

        if (data.applied_changes && data.resume) {
          if (!data.resume.personal_info || typeof data.resume.personal_info !== 'object') {
            data.resume.personal_info = {};
          }
          data.resume.personal_info.resume_format = 'custom';
          applyResumeToState(data.resume);
          await showAlert('Analyzer applied changes automatically. Review and save to continue.', 'Analysis Complete');
        } else {
          await showAlert('Analysis complete. Review the optimization areas below.', 'Analysis Complete');
        }
      }
    } catch (err) {
      console.error('Error analyzing resume:', err);
      await showAlert(err.response?.data?.meta?.message || 'Failed to analyze resume', 'Analysis Failed');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const renderInputByType = (field, value, onChange) => {
    if (field.type === 'textarea') {
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={field.rows || 4}
          placeholder={field.placeholder || ''}
        />
      );
    }

    return (
      <input
        type={field.type || 'text'}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || ''}
      />
    );
  };

  if (loading) {
    return <div className="loading">Loading resume...</div>;
  }

  const hasNoData = !resumeData.personal_info ||
    (Object.keys(resumeData.personal_info).length === 0) ||
    (!resumeData.personal_info.name && !resumeData.personal_info.email && !resumeData.personal_info.raw_text);

  return (
    <div className="edit-resume-container">
      <h2>Edit Resume</h2>

      {hasNoData && !resumeData.file_path && (
        <div className="alert alert-info">
          <h4>Empty Resume</h4>
          <p>This resume has no data yet. Fill in the form below to add your information.</p>
        </div>
      )}

      <div className="analysis-panel">
        <h3>Resume Analyzer</h3>
        <p>
          This analyzer extracts text, compares your resume with the target job description, scores ATS fit,
          and identifies areas to optimize.
        </p>

        <div className="form-group">
          <label>Target Job Description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows="5"
            placeholder="Paste the job description here to analyze resume fit"
          />
        </div>

        <div className="permission-mode">
          <label>
            <input
              type="radio"
              name="permissionMode"
              value="manual"
              checked={permissionMode === 'manual'}
              onChange={(e) => setPermissionMode(e.target.value)}
            />
            Manual mode: show recommendations only
          </label>
          <label>
            <input
              type="radio"
              name="permissionMode"
              value="auto"
              checked={permissionMode === 'auto'}
              onChange={(e) => setPermissionMode(e.target.value)}
            />
            Auto mode: ask and apply suggested improvements automatically
          </label>
        </div>

        <button
          type="button"
          className="analyze-btn"
          onClick={handleAnalyzeResume}
          disabled={analysisLoading}
        >
          {analysisLoading ? 'Analyzing...' : 'Analyze Resume'}
        </button>

        {analysisResult?.analysis && (
          <div className="analysis-result">
            <h4>Analysis Output</h4>
            <p><strong>ATS Score:</strong> {analysisResult.analysis.ats_score}/100</p>
            <p><strong>Missing Skills:</strong> {analysisResult.analysis.missing_skills?.join(', ') || 'None detected'}</p>

            <div className="analysis-block">
              <h5>Weak Bullet Points</h5>
              <ul>
                {(analysisResult.analysis.weak_bullet_points || []).length > 0 ? (
                  analysisResult.analysis.weak_bullet_points.map((item, idx) => <li key={`weak-${idx}`}>{item}</li>)
                ) : (
                  <li>No weak bullet points detected</li>
                )}
              </ul>
            </div>

            <div className="analysis-block">
              <h5>Too Much Passive Language</h5>
              <ul>
                {(analysisResult.analysis.too_much_passive_language || []).length > 0 ? (
                  analysisResult.analysis.too_much_passive_language.map((item, idx) => <li key={`passive-${idx}`}>{item}</li>)
                ) : (
                  <li>No significant passive language detected</li>
                )}
              </ul>
            </div>

            <div className="analysis-block">
              <h5>Improve Quantification</h5>
              <ul>
                {(analysisResult.analysis.improve_quantification || []).length > 0 ? (
                  analysisResult.analysis.improve_quantification.map((item, idx) => <li key={`quant-${idx}`}>{item}</li>)
                ) : (
                  <li>Good use of quantified impact in current content</li>
                )}
              </ul>
            </div>

            <p>
              <strong>Recommended Keywords:</strong>{' '}
              {(analysisResult.analysis.recommended_keywords || []).join(', ') || 'No additional keywords recommended'}
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-section">
          <h3>Resume Format</h3>
          <div className="form-group">
            <label>Choose Format</label>
            <select value={selectedFormat} onChange={(e) => handleFormatChange(e.target.value)}>
              {FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <p className="helper-text">{activeDefinition.description}</p>
            {autosaveNotice && <p className="autosave-notice">{autosaveNotice}</p>}
          </div>
        </div>

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
          {derivedPersonalFields.map((field) => (
            <div key={field.key} className="form-group">
              <label>{field.label}{field.required ? ' *' : ''}</label>
              {renderInputByType(
                field,
                resumeData.personal_info?.[field.key],
                (value) => handlePersonalInfoChange(field.key, value)
              )}
            </div>
          ))}
        </div>

        <div className="form-section">
          <h3>Skills</h3>
          {derivedSkillFields.map((field) => (
            <div key={field.key} className="form-group">
              <label>{field.label} (comma-separated)</label>
              <input
                type="text"
                value={skillInputs[field.key] || skillsArrayToText(resumeData.skills, field.key)}
                onChange={(e) => handleSkillsChange(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>

        <div className="form-section">
          <h3>Experience Details</h3>
          {(Array.isArray(resumeData.experiences) ? resumeData.experiences : []).map((exp, index) => (
            <div className="structured-item-card" key={`experience-${index}`}>
              <div className="structured-item-header">
                <h4>Experience {index + 1}</h4>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => removeExperience(index)}
                >
                  Remove
                </button>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    value={exp?.company_name || ''}
                    onChange={(e) => updateExperienceField(index, 'company_name', e.target.value)}
                    placeholder="e.g., Infosys"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    value={exp?.role || ''}
                    onChange={(e) => updateExperienceField(index, 'role', e.target.value)}
                    placeholder="e.g., Software Engineer"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Year</label>
                  <input
                    type="text"
                    value={exp?.start_year || ''}
                    onChange={(e) => updateExperienceField(index, 'start_year', e.target.value)}
                    placeholder="e.g., 2022"
                  />
                </div>
                <div className="form-group">
                  <label>End Year</label>
                  <input
                    type="text"
                    value={exp?.end_year || ''}
                    onChange={(e) => updateExperienceField(index, 'end_year', e.target.value)}
                    placeholder="e.g., 2025 or Present"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Responsibilities / Bullet Points</label>
                <textarea
                  rows={4}
                  value={responsibilitiesToText(exp?.responsibilities)}
                  onChange={(e) => updateExperienceField(index, 'responsibilities', e.target.value)}
                  placeholder="One bullet point per line"
                />
              </div>
            </div>
          ))}
          <button type="button" className="secondary-btn" onClick={addExperience}>
            + Add Experience
          </button>
        </div>

        <div className="form-section">
          <h3>Education Details</h3>
          {(Array.isArray(resumeData.education) ? resumeData.education : []).map((edu, index) => (
            <div className="structured-item-card" key={`education-${index}`}>
              <div className="structured-item-header">
                <h4>Education {index + 1}</h4>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => removeEducation(index)}
                >
                  Remove
                </button>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Institution / College Name</label>
                  <input
                    type="text"
                    value={edu?.institution || ''}
                    onChange={(e) => updateEducationField(index, 'institution', e.target.value)}
                    placeholder="e.g., JNTU Hyderabad"
                  />
                </div>
                <div className="form-group">
                  <label>Degree</label>
                  <input
                    type="text"
                    value={edu?.degree || ''}
                    onChange={(e) => updateEducationField(index, 'degree', e.target.value)}
                    placeholder="e.g., B.Tech in CSE"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date / Year</label>
                  <input
                    type="text"
                    value={edu?.start_date || ''}
                    onChange={(e) => updateEducationField(index, 'start_date', e.target.value)}
                    placeholder="e.g., 2019"
                  />
                </div>
                <div className="form-group">
                  <label>End Date / Year</label>
                  <input
                    type="text"
                    value={edu?.end_date || ''}
                    onChange={(e) => updateEducationField(index, 'end_date', e.target.value)}
                    placeholder="e.g., 2023"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>CGPA or Percentage</label>
                <input
                  type="text"
                  value={edu?.cgpa_or_percentage || ''}
                  onChange={(e) => updateEducationField(index, 'cgpa_or_percentage', e.target.value)}
                  placeholder="e.g., 8.5 CGPA / 85%"
                />
              </div>
            </div>
          ))}
          <button type="button" className="secondary-btn" onClick={addEducation}>
            + Add Education
          </button>
        </div>

        <div className="form-section">
          <h3>Additional Sections</h3>
          {visibleListSections
            .filter((section) => !['experiences', 'education'].includes(section.key))
            .map((section) => (
            <div className="form-group" key={section.key}>
              <label>{section.label} (one line per item)</label>
              <textarea
                rows={4}
                value={listInputs[section.key] || listToText(resumeData[section.key])}
                onChange={(e) => handleListSectionChange(section.key, e.target.value)}
                placeholder={section.placeholder}
              />
            </div>
            ))}
        </div>

        {(selectedFormat === 'custom' || customFieldDefs.length > 0) && (
          <div className="form-section">
            <h3>Custom Fields</h3>
            <div className="custom-field-row">
              <input
                type="text"
                value={customFieldName}
                onChange={(e) => setCustomFieldName(e.target.value)}
                placeholder="Field name (e.g., Portfolio)"
              />
              <select value={customFieldType} onChange={(e) => setCustomFieldType(e.target.value)}>
                <option value="text">Text</option>
                <option value="textarea">Long Text</option>
                <option value="url">URL</option>
              </select>
              <button type="button" className="secondary-btn" onClick={addCustomField}>Add</button>
            </div>

            {customFieldDefs.map((field) => (
              <div key={field.key} className="form-group">
                <label>{field.label}</label>
                {renderInputByType(
                  field,
                  resumeData.personal_info?.custom_fields?.[field.key],
                  (value) => handleCustomFieldValue(field.key, value)
                )}
              </div>
            ))}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="home-btn"
            onClick={() => navigate('/dashboard')}
          >
            Home
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate('/resume/view')}
          >
            Back to List
          </button>
          <button type="submit" className="submit-btn" disabled={saving || analysisLoading}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>

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

export default EditResume;
