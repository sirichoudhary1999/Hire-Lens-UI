import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DataTable from '../../Components/DataTable/DataTable';
import { FaEdit, FaTrash, FaEye, FaStar, FaRegStar } from 'react-icons/fa';
import ConfirmationModal from '../../Components/ConfirmationModal/ConfirmationModal';
import { useConfirmationModal } from '../../hooks/useConfirmationModal';
import './ViewResumes.css';

const ViewResumes = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const { modalState, showAlert, showConfirm, onConfirm, onCancel } = useConfirmationModal();
  const navigate = useNavigate();

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
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
        `http://127.0.0.1:5000/resume/${resumeId}`,
        `http://127.0.0.1:5000/resume/deleteResume/${resumeId}`
      ];

      let isDeleted = false;
      for (const endpoint of deleteEndpoints) {
        try {
          const response = await axios.delete(endpoint, {
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

  const handleEdit = (resumeId) => {
    navigate(`/resume/edit/${resumeId}`);
  };

  // const handleOptimize = (resumeId) => {
  //   navigate(`/resume/optimize/${resumeId}`);
  // };

  const handleView = (resumeId) => {
    navigate(`/resume/view/${resumeId}`);
  };

  const handleSetPrimary = async (resumeId) => {
    try {
      setSettingPrimaryId(resumeId);
      const token = localStorage.getItem('access_token');
      const response = await axios.put(`http://127.0.0.1:5000/resume/set-primary/${resumeId}`, {}, {
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

  const filteredResumes = resumes.filter((resume) =>
    (resume.title || '').toLowerCase().includes(searchText.toLowerCase())
  );

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
            className="action-btn view-btn"
            onClick={() => handleView(row.original.id)}
            title="View Resume"
          >
            <FaEye />
          </button>
          <button
            className="action-btn edit-btn"
            onClick={() => handleEdit(row.original.id)}
            title="Edit Resume"
          >
            <FaEdit />
          </button>
          <button
            className="action-btn primary-btn"
            onClick={() => handleSetPrimary(row.original.id)}
            disabled={settingPrimaryId === row.original.id || row.original.is_primary}
            title={row.original.is_primary ? 'Primary Resume' : 'Set as Primary'}
          >
            {row.original.is_primary ? <FaStar /> : <FaRegStar />}
          </button>
          {/* <button
            className="action-btn optimize-btn"
            onClick={() => handleOptimize(row.original.id)}
            title="Optimize Resume"
          >
            <FaRobot />
          </button> */}
          <button
            className="action-btn delete-btn"
            onClick={() => handleDelete(row.original.id)}
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
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="resume-search-input"
            placeholder="Search by resume title"
          />
          <button
            className="add-resume-btn"
            onClick={() => navigate('/resume/upload')}
          >
            + Upload New Resume
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
        <DataTable columns={columns} data={filteredResumes} />
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
    </div>
  );
};

export default ViewResumes;
