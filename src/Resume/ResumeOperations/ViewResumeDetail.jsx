import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ConfirmationModal from '../../Components/ConfirmationModal/ConfirmationModal';
import { useConfirmationModal } from '../../hooks/useConfirmationModal';
import './ViewResumeDetail.css';

const API_BASE = 'http://127.0.0.1:5000';

const ViewResumeDetail = () => {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { modalState, showAlert, showConfirm, onConfirm, onCancel } = useConfirmationModal();

  useEffect(() => {
    fetchResume();
  }, [resumeId]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  const toAbsoluteUrl = (value) => {
    if (!value || typeof value !== 'string') {
      return '';
    }

    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    return value.startsWith('/') ? `${API_BASE}${value}` : `${API_BASE}/${value}`;
  };

  const collectCandidateUrls = (resumeData) => {
    const possibleKeys = [
      'pdf_url',
      'file_url',
      'download_url',
      'resume_url',
      'document_url',
      'file_path',
      'filepath',
      'path',
      'url'
    ];

    const dynamicUrls = possibleKeys
      .map((key) => resumeData?.[key])
      .filter(Boolean)
      .map((value) => toAbsoluteUrl(value));

    const fallbackUrls = [
      `${API_BASE}/resume/preview/${resumeId}`,
      `${API_BASE}/resume/download/${resumeId}?inline=true`,
      `${API_BASE}/resume/download/${resumeId}`,
      `${API_BASE}/resume/${resumeId}/download`,
      `${API_BASE}/resume/file/${resumeId}`,
      `${API_BASE}/resume/pdf/${resumeId}`
    ];

    return [...new Set([...dynamicUrls, ...fallbackUrls])];
  };

  const blobLooksLikePdf = async (blob) => {
    try {
      const bytes = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
      const signature = String.fromCharCode(...bytes);
      return signature === '%PDF-';
    } catch {
      return false;
    }
  };

  const fetchPdfPreview = async (resumeData) => {
    setPreviewLoading(true);
    setPreviewError('');

    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl('');
    }

    const token = localStorage.getItem('access_token');
    const candidateUrls = collectCandidateUrls(resumeData);

    for (const url of candidateUrls) {
      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          responseType: 'blob'
        });

        const blob = response.data;
        if (!blob || blob.size === 0) {
          continue;
        }

        const contentType = (response.headers?.['content-type'] || '').toLowerCase();
        const disposition = (response.headers?.['content-disposition'] || '').toLowerCase();
        const blobType = (blob.type || '').toLowerCase();

        if (contentType.includes('application/json') || blobType.includes('application/json')) {
          continue;
        }

        const isPdfBlob =
          contentType.includes('pdf') ||
          disposition.includes('.pdf') ||
          blobType.includes('pdf') ||
          url.toLowerCase().includes('.pdf') ||
          await blobLooksLikePdf(blob);

        if (!isPdfBlob) {
          continue;
        }

        const objectUrl = URL.createObjectURL(blob);
        setPdfPreviewUrl(objectUrl);
        setPreviewLoading(false);
        return;
      } catch {
        // Try next URL until one returns an accessible PDF.
      }
    }

    setPreviewError('Unable to load PDF preview for this resume.');
    setPreviewLoading(false);
  };

  const fetchResume = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`http://127.0.0.1:5000/resume/${resumeId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.data.meta.success) {
        const resumeData = response.data.data.resume;
        setResume(resumeData);
        await fetchPdfPreview(resumeData);
      }
    } catch (err) {
      console.error("Error fetching resume:", err);
      await showAlert(err.response?.data?.meta?.message || 'Failed to fetch resume', 'Load Failed');
      navigate('/resume/view');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadForEditing = async () => {
    if (!resume.file_path) {
      await showAlert(
        'This resume has no uploaded file. It was created using manual JSON entry. Use "Edit JSON Data" instead.',
        'Download Unavailable'
      );
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_BASE}/resume/download/${resumeId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resume.original_filename || `resume_${resumeId}.${resume.file_type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading resume:", err);
      await showAlert('Failed to download resume file', 'Download Failed');
    }
  };

  const handleDeleteResume = async () => {
    const shouldDelete = await showConfirm('Are you sure you want to delete this resume?', {
      title: 'Delete Resume',
      confirmText: 'Delete'
    });

    if (!shouldDelete) {
      return;
    }

    try {
      setDeleting(true);
      const token = localStorage.getItem('access_token');
      const id = resume?.id || resumeId;
      const deleteEndpoints = [
        `${API_BASE}/resume/${id}`,
        `${API_BASE}/resume/deleteResume/${id}`
      ];

      let isDeleted = false;
      for (const endpoint of deleteEndpoints) {
        try {
          const response = await axios.delete(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
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

      if (!isDeleted) {
        throw new Error('Delete endpoint unavailable');
      }

      await showAlert('Resume deleted successfully', 'Deleted');
      navigate('/resume/view');
    } catch (err) {
      console.error('Error deleting resume:', err);
      await showAlert(err.response?.data?.meta?.message || 'Failed to delete resume', 'Delete Failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading resume...</div>;
  }

  if (!resume) {
    return <div className="error">Resume not found</div>;
  }

  return (
    <div className="view-resume-detail-container">
      <div className="resume-header">
        <h2>{resume.title}</h2>
        <div className="resume-meta">
          <span className="version-badge">Version {resume.version}</span>
          {resume.file_type && <span className="file-badge">{resume.file_type.toUpperCase()}</span>}
        </div>
      </div>

      <div className="pdf-viewer-shell">
        {previewLoading ? (
          <div className="preview-state">Loading PDF preview...</div>
        ) : previewError ? (
          <div className="preview-state error">{previewError}</div>
        ) : (
          <iframe
            title="Resume PDF Preview"
            src={pdfPreviewUrl}
            className="resume-pdf-frame"
          />
        )}
      </div>

      <div className="action-buttons">
        <button className="btn-primary" onClick={() => navigate('/dashboard')}>
          Home
        </button>
        <button className="btn-secondary" onClick={() => navigate('/resume/view')}>
          Back to List
        </button>
        {resume.file_path && (
          <button className="btn-info" onClick={handleDownloadForEditing}>
            Download {resume.file_type?.toUpperCase()} for Editing
          </button>
        )}
        <button className="btn-warning" onClick={() => navigate(`/resume/edit/${resume.id || resumeId}`)}>
          Edit JSON Data
        </button>
        <button className="btn-danger" onClick={handleDeleteResume} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete Resume'}
        </button>
        {/* <button className="btn-success" onClick={() => navigate(`/resume/optimize/${resume.id || resumeId}`)}>
          Optimize Resume
        </button> */}
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

export default ViewResumeDetail;
