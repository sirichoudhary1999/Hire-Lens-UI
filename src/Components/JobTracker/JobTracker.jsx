import Tile from "../Tile/Tile";
import "./JobTracker.css";
import { useNavigate } from "react-router-dom";

const JobTracker = () => {
      const navigate = useNavigate();

    return (
        <div className="jobtracker-container">
            <div className="jobtracker-tile-wrapper">
                    <Tile
                        title="Job Applications"
                        description="Add a new job application"
                        onClick={() => navigate("/jobs/add")}
                    />
                    <Tile
                        title="View/Edit Jobs"
                        description="View and edit your job applications"
                        onClick={() => navigate("/jobs/view")}
                    />
                    <Tile
                        title = "Job Analytics"
                        description = "View analytics on your job applications"
                        onClick={() => navigate("/jobs/analytics")}
                    />
            </div>
        </div>
    )
}

export default JobTracker;