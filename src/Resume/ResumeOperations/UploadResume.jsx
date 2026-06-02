import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaFileUpload, FaKeyboard } from 'react-icons/fa';
import ConfirmationModal from '../../Components/ConfirmationModal/ConfirmationModal';
import { useConfirmationModal } from '../../hooks/useConfirmationModal';
import {
  FORMAT_DEFINITIONS,
  FORMAT_OPTIONS,
  defaultResumeData,
  listToText,
  skillsArrayToText,
  skillsTextToArray,
  textToList
} from './resumeFormatConfig';
import './UploadResume.css';

const UploadResume = () => {
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

  const [uploadMode, setUploadMode] = useState('file');
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('My Resume');
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createFormat, setCreateFormat] = useState('standard');
  const [autosaveNotice, setAutosaveNotice] = useState('');
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldType, setCustomFieldType] = useState('text');
  const { modalState, showAlert, onConfirm, onCancel } = useConfirmationModal();
  const navigate = useNavigate();

  const [jsonData, setJsonData] = useState({
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
    () => FORMAT_DEFINITIONS[createFormat] || FORMAT_DEFINITIONS.standard,
    [createFormat]
  );

  useEffect(() => {
    const savedDraft = localStorage.getItem('resume_create_draft_v1');
    if (!savedDraft) {
      return;
    }

    try {
      const parsed = JSON.parse(savedDraft);
      if (parsed?.jsonData) {
        setJsonData(parsed.jsonData);
      }
      if (parsed?.skillInputs) {
        setSkillInputs(parsed.skillInputs);
      }
      if (parsed?.listInputs) {
        setListInputs(parsed.listInputs);
      }
      if (parsed?.customFieldDefs) {
        setCustomFieldDefs(parsed.customFieldDefs);
      }
      if (parsed?.createFormat) {
        setCreateFormat(parsed.createFormat);
      }
      setAutosaveNotice('Recovered your autosaved draft.');
    } catch (error) {
      console.error('Failed to parse create draft:', error);
    }
  }, []);

  useEffect(() => {
    if (uploadMode !== 'json') {
      return;
    }

    const payload = {
      createFormat,
      jsonData,
      skillInputs,
      listInputs,
      customFieldDefs,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem('resume_create_draft_v1', JSON.stringify(payload));
    setAutosaveNotice('Draft autosaved');
    const timer = setTimeout(() => setAutosaveNotice(''), 1200);
    return () => clearTimeout(timer);
  }, [uploadMode, createFormat, jsonData, skillInputs, listInputs, customFieldDefs]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split('.').pop().toLowerCase();
      if (fileType !== 'pdf' && fileType !== 'docx') {
        showAlert('Only PDF and DOCX files are allowed', 'Invalid File Type');
        e.target.value = '';
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      await showAlert('Please select a file to upload', 'Missing File');
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
        await showAlert('Resume uploaded successfully!', 'Upload Complete');
        navigate('/resume/view');
      }
    } catch (err) {
      console.error("Error uploading resume:", err);
      await showAlert(err.response?.data?.meta?.message || 'Failed to upload resume', 'Upload Failed');
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
    setSkillInputs(prev => ({
      ...prev,
      [category]: value
    }));

    const skillsArray = skillsTextToArray(value);
    setJsonData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: skillsArray
      }
    }));
  };

  const handleListSectionChange = (sectionKey, value) => {
    setListInputs(prev => ({
      ...prev,
      [sectionKey]: value
    }));

    setJsonData(prev => ({
      ...prev,
      [sectionKey]: textToList(value, sectionKey)
    }));
  };

  const handleFormatChange = (value) => {
    setCreateFormat(value);
    handlePersonalInfoChange('resume_format', value);
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
    setJsonData((prev) => {
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
    setJsonData((prev) => ({
      ...prev,
      experiences: [...(Array.isArray(prev.experiences) ? prev.experiences : []), createEmptyExperience()]
    }));
  };

  const removeExperience = (index) => {
    setJsonData((prev) => ({
      ...prev,
      experiences: (Array.isArray(prev.experiences) ? prev.experiences : []).filter((_, idx) => idx !== index)
    }));
  };

  const updateEducationField = (index, field, value) => {
    setJsonData((prev) => {
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
    setJsonData((prev) => ({
      ...prev,
      education: [...(Array.isArray(prev.education) ? prev.education : []), createEmptyEducation()]
    }));
  };

  const removeEducation = (index) => {
    setJsonData((prev) => ({
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
    setJsonData((prev) => ({
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
    setJsonData((prev) => ({
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

  const handleJsonSubmit = async (e) => {
    e.preventDefault();

    if (!jsonData.personal_info.name || !jsonData.personal_info.email) {
      await showAlert('Name and email are required', 'Validation Error');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const payload = {
        ...jsonData,
        personal_info: {
          ...jsonData.personal_info,
          resume_format: createFormat,
          custom_field_defs: customFieldDefs
        }
      };

      const response = await axios.post(
        'http://127.0.0.1:5000/resume/upload',
        payload,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.meta.success) {
        localStorage.removeItem('resume_create_draft_v1');
        await showAlert('Resume created successfully!', 'Resume Created');
        navigate('/resume/view');
      }
    } catch (err) {
      console.error("Error creating resume:", err);
      await showAlert(err.response?.data?.meta?.message || 'Failed to create resume', 'Create Failed');
    } finally {
      setLoading(false);
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

      <div className="resume-form-scroll-area">
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
            <h3>Create Resume Format</h3>
            <div className="form-group">
              <label>Choose Format</label>
              <select
                value={createFormat}
                onChange={(e) => handleFormatChange(e.target.value)}
              >
                {FORMAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="helper-text">{activeDefinition.description}</p>
            </div>
            {autosaveNotice && <p className="autosave-notice">{autosaveNotice}</p>}
          </div>

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
            {activeDefinition.personalFields.map((field) => (
              <div key={field.key} className="form-group">
                <label>{field.label}{field.required ? ' *' : ''}</label>
                {renderInputByType(
                  field,
                  jsonData.personal_info?.[field.key],
                  (value) => handlePersonalInfoChange(field.key, value)
                )}
              </div>
            ))}
          </div>

          <div className="form-section">
            <h3>Skills</h3>
            {activeDefinition.skillFields.map((field) => (
              <div key={field.key} className="form-group">
                <label>{field.label} (comma-separated)</label>
                <input
                  type="text"
                  value={skillInputs[field.key] || skillsArrayToText(jsonData.skills, field.key)}
                  onChange={(e) => handleSkillsChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>

          <div className="form-section">
            <h3>Experience Details</h3>
            {(Array.isArray(jsonData.experiences) ? jsonData.experiences : []).map((exp, index) => (
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
            {(Array.isArray(jsonData.education) ? jsonData.education : []).map((edu, index) => (
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
            {activeDefinition.listSections
              .filter((section) => !['experiences', 'education'].includes(section.key))
              .map((section) => (
              <div className="form-group" key={section.key}>
                <label>{section.label} (one line per item)</label>
                <textarea
                  rows={4}
                  value={listInputs[section.key] || listToText(jsonData[section.key])}
                  onChange={(e) => handleListSectionChange(section.key, e.target.value)}
                  placeholder={section.placeholder}
                />
              </div>
              ))}
          </div>

          {createFormat === 'custom' && (
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
                    jsonData.personal_info?.custom_fields?.[field.key],
                    (value) => handleCustomFieldValue(field.key, value)
                  )}
                </div>
              ))}
            </div>
          )}

          <div className={`resume-preview preview-${createFormat}`}>
            <h3>Live Preview</h3>
            <h4>{jsonData.title || 'Untitled Resume'}</h4>
            <p>{jsonData.personal_info?.name || 'Your Name'}</p>
            <p>{jsonData.personal_info?.email || 'email@example.com'}{jsonData.personal_info?.phone ? ` | ${jsonData.personal_info.phone}` : ''}</p>
            {jsonData.personal_info?.summary && <p>{jsonData.personal_info.summary}</p>}
            {Object.values(jsonData.skills || {}).some((arr) => Array.isArray(arr) && arr.length) && (
              <div>
                <strong>Skills:</strong>
                <p>
                  {Object.entries(jsonData.skills)
                    .filter(([, arr]) => Array.isArray(arr) && arr.length)
                    .map(([key, arr]) => `${key}: ${arr.join(', ')}`)
                    .join(' | ')}
                </p>
              </div>
            )}
          </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create Resume'}
            </button>
          </form>
        )}
      </div>

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

export default UploadResume;
