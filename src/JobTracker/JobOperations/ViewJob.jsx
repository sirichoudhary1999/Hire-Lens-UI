import DataTable from "../../Components/DataTable/DataTable";
import api from '../../utils/api';
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import "../JobTracker.css"
import { useMemo, useState, useEffect } from "react";
import ConfirmationModal from '../../Components/ConfirmationModal/ConfirmationModal';
import { useConfirmationModal } from '../../hooks/useConfirmationModal';

const ViewJob = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const { modalState, showAlert, showConfirm, onConfirm, onCancel } = useConfirmationModal();

    const handleEdit = (job) => {
        navigate('/jobs/add', { state: { job } });
    };

    const handleDelete = async (jobId) => {
        const shouldDelete = await showConfirm('Delete this job application?', {
            title: 'Delete Job',
            confirmText: 'Delete'
        });

        if (!shouldDelete) {
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await api.delete(`/jobs/deleteJob/${jobId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.meta?.success) {
                setJobs((prev) => prev.filter((job) => job.job_id !== jobId));
                await showAlert('Job deleted successfully', 'Deleted');
            }
        } catch (err) {
            console.error('Delete failed:', err);
            await showAlert(err.response?.data?.meta?.message || 'Failed to delete job', 'Delete Failed');
        }
    };

    const jobCoulmns = [
        {
            header: "Role",
            accessorKey: "role",
            enableColumnFilter: true
        },
        {
            header: "Company",
            accessorKey: "company",
            enableColumnFilter: true
        },
        {
            header: "Status",
            accessorKey: "status",
            enableColumnFilter: true
        },
        {
            header: "Applied On",
            accessorKey: "applied_at",
            cell: info => new Date(info.getValue()).toLocaleDateString()
        },
        {
            header: "Notes",
            accessorKey: "notes",
        },
        {
            header: "Actions",
            id: "actions",
            cell: ({ row }) => {
                const job = row.original;

                return (
                    <div className="table-actions">
                        <span onClick={() => handleEdit(job)} className="icon edit">
                            <FaEdit />
                        </span>

                        <span onClick={() => handleDelete(job.job_id)} className="icon delete">
                            <FaTrash />
                        </span>
                    </div>
                );
            }
        }
    ]

    const filteredJobs = useMemo(() => {
        const text = searchText.trim().toLowerCase();
        return jobs.filter((job) => {
            const matchesSearch = !text ||
                (job.company || '').toLowerCase().includes(text) ||
                (job.role || '').toLowerCase().includes(text);

            const matchesStatus = statusFilter === 'all' || (job.status || '').toLowerCase() === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [jobs, searchText, statusFilter]);

    const stats = useMemo(() => {
        const normalized = jobs.map((job) => (job.status || '').toLowerCase());
        return {
            total: jobs.length,
            interview: normalized.filter((status) => status === 'interview').length,
            offer: normalized.filter((status) => status === 'offer').length,
            rejected: normalized.filter((status) => status === 'rejected').length
        };
    }, [jobs]);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('access_token');
                const response = await api.get('/jobs/fetchAllJobs', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                setJobs(response.data?.jobs || []);
            } catch (err) {
                console.error('Failed to fetch jobs:', err);
                await showAlert(err.response?.data?.meta?.message || 'Failed to fetch jobs', 'Load Failed');
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    return (
        <div className="jobtracker-container">
            <div className="jobtracker-tile-wrapper">
                <div className="view-job">
                    <h2 className="job-header">Job Applications</h2>
                    <button className="add-new-job" onClick={() => navigate("/jobs/add")}>
                        <FaPlus /> Add Job
                    </button>
                    <div className="job-stats-grid">
                        <div className="job-stat-card"><p>Total</p><h3>{stats.total}</h3></div>
                        <div className="job-stat-card"><p>Interviews</p><h3>{stats.interview}</h3></div>
                        <div className="job-stat-card"><p>Offers</p><h3>{stats.offer}</h3></div>
                        <div className="job-stat-card"><p>Rejected</p><h3>{stats.rejected}</h3></div>
                    </div>

                    <div className="table-container">
                        {loading ? (
                            <p className="job-table-loading">Loading jobs...</p>
                        ) : (
                            <DataTable columns={jobCoulmns} data={filteredJobs} />
                        )}
                    </div>
                    <div className="button-group">
                        <button type="button" onClick={() => navigate("/dashboard")}>Home</button>
                    </div>
                </div>
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
    )
}

export default ViewJob;
