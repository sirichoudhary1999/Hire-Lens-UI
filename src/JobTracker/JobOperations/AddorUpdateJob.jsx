import "../JobTracker.css"
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddJob = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        company: "",
        role: "",
        status: "applied",
        notes: ""
    });
    const [loading, setLoading] = useState(false);
    const jobStatuses = ["Applied", "Interview", "Waiting for Response", "Rejected", "Offer"];
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
            const res = await axios.post(
                "http://127.0.0.1:5000/jobs/add",
                formData,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );
            if (res.data.meta.success) { 
                navigate("/jobs/view");
            }
        } catch (err) {
            console.error(err);
            console.error("ERROR:", err.response?.data);
            alert(err.response?.data?.msg || "Something went wrong!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-job-container">
            <div className="add-job-header"><h2>Add New Job</h2></div>

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
                        {loading ? "Adding..." : "Add Job"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddJob;