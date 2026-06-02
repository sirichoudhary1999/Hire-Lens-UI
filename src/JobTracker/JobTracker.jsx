import Tile from "../Components/Tile/Tile";
import "./JobTracker.css";
import { useNavigate } from "react-router-dom";

const JobTracker = () => {
      const navigate = useNavigate();

    return (
        <div className="jobtracker-container jobtracker-home">
            <div className="jobtracker-heading-block">
                <h2 className="jobtracker-heading">Job Application Management</h2>
                <p className="jobtracker-subheading">Choose an option to manage your applications</p>
            </div>
            <div className="jobtracker-tile-wrapper">
                    <Tile
                        title="Jobs"
                        description="View and edit your job applications"
                        onClick={() => navigate("/jobs/view")}
                    />
                    <Tile
                        title = "Job Analytics"
                        description = "View analytics on your job applications"
                        onClick={() => navigate("/jobs/analytics")}
                    />
            </div>
            <div className="feature-footer-actions">
                <button type="button" onClick={() => navigate("/dashboard")}>Home</button>
                <button type="button" onClick={() => navigate("/dashboard")}>Cancel</button>
            </div>
        </div>
    )
}

export default JobTracker;