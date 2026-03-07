import Tile from "../Tile/Tile.jsx";
import "./Dashboard.css";
import { FaFileAlt, FaBriefcase, FaUserCircle, FaComments, FaCog, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Dropdown from "../Dropdown/Dropdown.jsx";
import { useState } from "react";

const Dashboard = () => {

  const profilename = localStorage.getItem("profilename")
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("profilename");
    navigate('/login');
  };

  const handleUpdateProfile = () => {
    navigate('/updateProfile');
  };

  return (
    <div className="dashboard-container">
      <div className="header-container">
        <button className="profile-btn" onClick={() => { setOpen(prev => !prev) }}>
          <FaUserCircle size={28} className="profile-icon" />{profilename}</button>
        {open && <Dropdown 
          items={[
            { 
              label: "Update Profile",
              onClick: handleUpdateProfile,
              icon: <FaCog className="settings-icon" />,
              buttonBg: "#fff",
              buttonColor: '#1e3a8a',
              buttonHoverBg: "#1e3a8a",
              buttonHoverColor: "#eee"
            },
            {
              label: "Logout", 
              onClick: handleLogout, 
              icon: <FaSignOutAlt className="logout-icon" />, 
              buttonBg: "#eee",
              buttonColor: "#f00",
              buttonHoverBg: "#ff4c4c",
              buttonHoverColor: "#eee"
            }
          ]}
          closeDropdown={() => setOpen(false)}
          
        />
        }
      </div>
      <div className="tile-wrapper">
        <Tile
          title="Resume Edit"
          description="Edit resume with or without Job Description"
          icon={<FaFileAlt />}
          onClick={() => navigate("/edit-resume")}
        />

        <Tile
          title="Job Tracker"
          description="Manage and track job applications"
          icon={<FaBriefcase />}
          onClick={() => navigate("/jobs")}
        />
        <Tile
          title="Interview Prep"
          description="Prepare for interviews with plan and tracker"
          icon={<FaComments />}
          onClick={() => navigate("/interview-prep")}
        />
      </div>
    </div>
  );
};

export default Dashboard;