import DataTable from "../../Components/DataTable/DataTable";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import "../JobTracker.css"
import { useState, useEffect } from "react";

const ViewJob = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
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
            id: "actions", // required (no accessorKey)
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

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        axios.get("http://127.0.0.1:5000/jobs/fetchAllJobs",
            {
                "headers": {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }

            }).then(response => {
                let responseData = response.data
                console.log(responseData.jobs);
                setJobs(responseData.jobs);
            })
    }, [])

    return (
        <div className="jobtracker-container">
            <div className="jobtracker-tile-wrapper">
                <div className="view-job">
                    <h2 className="job-header">Job Applications</h2>
                    <button className="add-new-job" onClick={() => navigate("/jobs/add")}>
                        <FaPlus /> Add Job
                    </button>
                    <div className="table-container">
                        <DataTable columns={jobCoulmns} data={jobs} />
                    </div>
                    <div className="button-group">
                        <button type="button" onClick={() => navigate("/dashboard")}>Home</button>
                        {/* <button type="button" onClick={() => navigate("/jobs")}>Cancel</button> */}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ViewJob;
