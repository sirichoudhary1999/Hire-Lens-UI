import "../JobTracker.css"
import { useEffect, useState } from "react";
import api from '../../utils/api';
import { useLocation, useNavigate } from "react-router-dom";
import ConfirmationModal from '../../Components/ConfirmationModal/ConfirmationModal';
import { useConfirmationModal } from '../../hooks/useConfirmationModal';

const AddJob = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const editingJob = location.state?.job || null;
    const prefillJob = location.state?.prefill || null;
    const [formData, setFormData] = useState({
        company: "",
        role: "",
        status: "applied",
        notes: ""
    });
    const [loading, setLoading] = useState(false);
    const { modalState, showAlert, onConfirm, onCancel } = useConfirmationModal();
    const jobStatuses = ["Applied", "Interview", "Waiting for Response", "Rejected", "Offer"];

    useEffect(() => {
        if (editingJob) {
            setFormData({
                company: editingJob.company || "",
                role: editingJob.role || "",
                status: editingJob.status || "applied",
                notes: editingJob.notes || ""
            });
            return;
        }

        if (prefillJob) {
            setFormData({
                company: prefillJob.company || "",
                role: prefillJob.role || "",
                status: prefillJob.status || "applied",
                notes: prefillJob.notes || ""
            });
        }
    }, [editingJob, prefillJob]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            const token = localStorage.getItem("access_token");
            const endpoint = editingJob
                ? `/jobs/updateJob/${editingJob.job_id}`
                : "/jobs/add";
            const requestMethod = editingJob ? api.put : api.post;

            const res = await requestMethod(endpoint, formData, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (res.data.meta.success) { 
                await showAlert(editingJob ? "Job updated successfully" : "Job added successfully", "Success");
                navigate("/jobs/view");
            }
        } catch (err) {
            console.error(err);
            console.error("ERROR:", err.response?.data);
            await showAlert(err.response?.data?.msg || "Something went wrong!", 'Job Save Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-job-container">
            <div className="add-job-header"><h2>{editingJob ? "Update Job" : "Add New Job"}</h2></div>

            <form onSubmit={handleSubmit} className="add-job-form">
                <div className="form-group"><label htmlFor="company">Company Name *</label>
                    <input
                        type="text"
                        name="company"
                        placeholder="Company Name"
                        value={formData.company}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group"><label htmlFor="role">Role *</label>
                    <input
                        type="text"
                        name="role"
                        placeholder="Role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group"><label htmlFor="status">Application Status</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                    >
                        {jobStatuses.map(status => (
                            <option key={status} value={status.toLowerCase()}>{status}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group"><label htmlFor="notes">Notes</label>

                    <textarea
                        name="notes"
                        placeholder="Notes (optional)"
                        value={formData.notes}
                        onChange={handleChange}
                    />
                </div>

                <div className="button-group">
                    <button type="button" onClick={() => navigate("/dashboard")} disabled={loading}>Home</button>
                    <button type="button" onClick={()=> navigate("/jobs")} disabled={loading}>Cancel</button>
                    <button type="submit" disabled={loading}>
                        {loading ? (editingJob ? "Updating..." : "Adding...") : (editingJob ? "Update Job" : "Add Job")}
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

export default AddJob;