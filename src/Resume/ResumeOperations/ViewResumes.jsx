import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DataTable from '../../Components/DataTable/DataTable';
import { FaEdit, FaTrash, FaRobot, FaEye } from 'react-icons/fa';
import './ViewResumes.css';

const ViewResumes = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
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
      alert(err.response?.data?.meta?.message || "Failed to fetch resumes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resumeId) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) {
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.delete(`http://127.0.0.1:5000/resume/${resumeId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.data.meta.success) {
        alert("Resume deleted successfully");
        fetchResumes(); // Refresh list
      }
    } catch (err) {
      console.error("Error deleting resume:", err);
      alert(err.response?.data?.meta?.message || "Failed to delete resume");
    }
  };

  const handleEdit = (resumeId) => {
    navigate(`/resume/edit/${resumeId}`);
  };

  const handleOptimize = (resumeId) => {
    navigate(`/resume/optimize/${resumeId}`);
  };

  const handleView = (resumeId) => {
    navigate(`/resume/view/${resumeId}`);
  };

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
            className="action-btn optimize-btn"
            onClick={() => handleOptimize(row.original.id)}
            title="Optimize Resume"
          >
            <FaRobot />
          </button>
          <button
            className="action-btn delete-btn"
            onClick={() => handleDelete(row.original.id)}
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
        <button
          className="add-resume-btn"
          onClick={() => navigate('/resume/upload')}
        >
          + Upload New Resume
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading resumes...</div>
      ) : resumes.length === 0 ? (
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
        <DataTable columns={columns} data={resumes} />
      )}

      <div className="footer-actions">
        <button className="nav-btn home-btn" onClick={() => navigate('/dashboard')}>
          Home
        </button>
        <button className="nav-btn cancel-btn" onClick={() => navigate('/resume')}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ViewResumes;
