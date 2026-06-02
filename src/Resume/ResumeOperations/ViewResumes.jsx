import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import DataTable from '../../Components/DataTable/DataTable';
import { FaChartBar, FaEdit, FaTrash, FaStar, FaRegStar } from 'react-icons/fa';
import ConfirmationModal from '../../Components/ConfirmationModal/ConfirmationModal';
import { useConfirmationModal } from '../../hooks/useConfirmationModal';
import './ViewResumes.css';

const ViewResumes = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState(null);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [atsJobDescription, setAtsJobDescription] = useState('');
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsResult, setAtsResult] = useState(null);
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);
  const { modalState, showAlert, showConfirm, onConfirm, onCancel } = useConfirmationModal();
  const navigate = useNavigate();

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await api.get('/resume/all', {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.data.meta.success) {
        const nextResumes = response.data.data.resumes;
        setResumes(nextResumes);
        if (!selectedResumeId && nextResumes.length > 0) {
          setSelectedResumeId(String(nextResumes[0].id));
        }
      }
    } catch (err) {
      console.error("Error fetching resumes:", err);
      await showAlert(err.response?.data?.meta?.message || 'Failed to fetch resumes', 'Load Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resumeId) => {
    const shouldDelete = await showConfirm('Are you sure you want to delete this resume?', {
      title: 'Delete Resume',
      confirmText: 'Delete'
    });

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingId(resumeId);
      const token = localStorage.getItem("access_token");
      const deleteEndpoints = [
        `/resume/${resumeId}`,
        `/resume/deleteResume/${resumeId}`
      ];

      let isDeleted = false;
      for (const endpoint of deleteEndpoints) {
        try {
          const response = await api.delete(endpoint, {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });

          if (response.data?.meta?.success) {
            isDeleted = true;
            break;
          }
        } catch (deleteError) {
          if (![404, 405].includes(deleteError?.response?.status)) {
            throw deleteError;
          }
        }
      }

      if (isDeleted) {
        await showAlert('Resume deleted successfully', 'Deleted');
        setResumes((prev) => prev.filter((resume) => resume.id !== resumeId));
      } else {
        throw new Error("Delete endpoint unavailable");
      }
    } catch (err) {
      console.error("Error deleting resume:", err);
      await showAlert(err.response?.data?.meta?.message || 'Failed to delete resume', 'Delete Failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRowClick = (resume) => {
    navigate(`/resume/view/${resume.id}`);
  };

  const openAtsModal = (resumeIdOverride = '') => {
    const nextResumeId = resumeIdOverride || selectedResumeId || (resumes[0] ? String(resumes[0].id) : '');
    setSelectedResumeId(nextResumeId);
    setIsAtsModalOpen(true);
  };

  const closeAtsModal = () => {
    if (atsLoading) {
      return;
    }

    setIsAtsModalOpen(false);
  };

  const handleCheckAts = async () => {
    const resumeId = selectedResumeId;

    if (!resumeId) {
      await showAlert('Please select a resume to analyze', 'Validation Error');
      return;
    }

    setAtsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.post(
        `/resume/analyze/${resumeId}`,
        {
          job_description: atsJobDescription,
          permission_mode: 'manual',
          apply_changes: false
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.meta?.success) {
        setAtsResult(response.data.data);
        await showAlert(
          `ATS score calculated successfully: ${response.data.data.analysis.ats_score}/100${response.data.data.analysis.analysis_mode === 'generic' ? ' (generic resume readiness score)' : ''}`,
          'ATS Analysis Complete'
        );
        setIsAtsModalOpen(false);
      }
    } catch (err) {
      console.error('Error checking ATS score:', err);
      await showAlert(err.response?.data?.meta?.message || 'Failed to calculate ATS score', 'ATS Check Failed');
    } finally {
      setAtsLoading(false);
    }
  };

  const handleEdit = (resumeId) => {
    navigate(`/resume/edit/${resumeId}`);
  };

  const handleSetPrimary = async (resumeId) => {
    try {
      setSettingPrimaryId(resumeId);
      const token = localStorage.getItem('access_token');
      const response = await api.put(`/resume/set-primary/${resumeId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data?.meta?.success) {
        setResumes((prev) => prev.map((resume) => ({
          ...resume,
          is_primary: resume.id === resumeId
        })));
        await showAlert('Primary resume updated successfully', 'Primary Updated');
      }
    } catch (err) {
      console.error('Error setting primary resume:', err);
      await showAlert(err.response?.data?.meta?.message || 'Failed to update primary resume', 'Update Failed');
    } finally {
      setSettingPrimaryId(null);
    }
  };

  const filteredResumes = resumes;

  const columns = [
    {
      header: 'Title',
      accessorKey: 'title',
      cell: ({ row }) => (
        <div>
          <div className="resume-title">{row.original.title}</div>
          {row.original.is_primary && <span className="primary-badge">Primary</span>}
        </div>
      )
    },
    {
      header: 'Version',
      accessorKey: 'version',
      cell: ({ getValue }) => `v${getValue()}`
    },
    {
      header: 'File Type',
      accessorKey: 'file_type',
      cell: ({ getValue }) => getValue() ? getValue().toUpperCase() : 'JSON'
    },
    {
      header: 'Last Optimized',
      accessorKey: 'last_optimized_at',
      cell: ({ getValue }) => {
        const date = getValue();
        return date ? new Date(date).toLocaleDateString() : 'Never';
      }
    },
    {
      header: 'Optimizations',
      accessorKey: 'optimization_count',
      cell: ({ getValue }) => getValue() || 0
    },
    {
      header: 'Created',
      accessorKey: 'created_at',
      cell: ({ getValue }) => new Date(getValue()).toLocaleDateString()
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: ({ row }) => (
        <div className="action-buttons">
          <button
            className="action-btn edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row.original.id);
            }}
            title="Edit Resume"
          >
            <FaEdit />
          </button>
          <button
            className="action-btn primary-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleSetPrimary(row.original.id);
            }}
            disabled={settingPrimaryId === row.original.id || row.original.is_primary}
            title={row.original.is_primary ? 'Primary Resume' : 'Set as Primary'}
          >
            {row.original.is_primary ? <FaStar /> : <FaRegStar />}
          </button>
          <button
            className="action-btn delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.original.id);
            }}
            disabled={deletingId === row.original.id}
            title="Delete Resume"
          >
            <FaTrash />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="view-resumes-container">
      <div className="view-resumes-header">
        <h2>My Resumes</h2>
        <div className="view-resume-controls">
          <button
            className="add-resume-btn"
            onClick={() => navigate('/resume/upload')}
          >
            + Upload New Resume
          </button>
          <button
            className="ats-trigger-btn"
            onClick={() => openAtsModal()}
          >
            <FaChartBar /> Check ATS Score
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading resumes...</div>
      ) : filteredResumes.length === 0 ? (
        <div className="no-resumes">
          <p>No resumes found. Upload your first resume to get started!</p>
          <button
            className="upload-first-btn"
            onClick={() => navigate('/resume/upload')}
          >
            Upload Resume
          </button>
        </div>
      ) : (
        <DataTable columns={columns} data={filteredResumes} onRowClick={handleRowClick} />
      )}

      <div className="footer-actions">
        <button className="nav-btn home-btn" onClick={() => navigate('/dashboard')}>
          Home
        </button>
        <button className="nav-btn cancel-btn" onClick={() => navigate('/resume')}>
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

      {isAtsModalOpen && (
        <div className="ats-modal-overlay" role="presentation" onClick={closeAtsModal}>
          <div className="ats-modal" role="dialog" aria-modal="true" aria-labelledby="ats-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="ats-modal-header">
              <h3 id="ats-modal-title">Check ATS Score</h3>
              <button type="button" className="ats-modal-close" onClick={closeAtsModal} disabled={atsLoading}>
                ×
              </button>
            </div>

            <div className="form-group">
              <label>Select Resume</label>
              <select value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)}>
                <option value="">-- Select a Resume --</option>
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.title} (v{resume.version})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Job Description (optional)</label>
              <textarea
                rows="8"
                value={atsJobDescription}
                onChange={(e) => setAtsJobDescription(e.target.value)}
                placeholder="Leave blank for a generic ATS readiness score"
              />
            </div>

            <div className="ats-modal-actions">
              <button type="button" className="secondary-btn" onClick={closeAtsModal} disabled={atsLoading}>
                Cancel
              </button>
              <button
                type="button"
                className="add-resume-btn"
                onClick={handleCheckAts}
                disabled={atsLoading || resumes.length === 0}
              >
                {atsLoading ? (
                  <>
                    <FaChartBar /> Calculating ATS...
                  </>
                ) : (
                  <>
                    <FaChartBar /> Run ATS Check
                  </>
                )}
              </button>
            </div>

            {atsResult?.analysis && (
              <div className="analysis-result ats-modal-result">
                <h4>ATS Result</h4>
                <p><strong>ATS Score:</strong> {atsResult.analysis.ats_score}/100 {atsResult.analysis.analysis_mode === 'generic' ? '(generic readiness)' : ''}</p>
                <p><strong>Missing Skills:</strong> {atsResult.analysis.missing_skills?.join(', ') || 'None detected'}</p>
                <p><strong>Recommended Keywords:</strong> {atsResult.analysis.recommended_keywords?.join(', ') || 'None'}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ViewResumes;
