import React from 'react';
import { useNavigate } from 'react-router-dom';
import Tile from '../Components/Tile/Tile';
import { FaFileUpload, FaList } from 'react-icons/fa';
import './Resume.css';

const Resume = () => {
  const navigate = useNavigate();

  const tiles = [
    {
      title: "Upload Resume",
      description: "Upload a new resume or create one from scratch",
      icon: <FaFileUpload size={40} />,
      onClick: () => navigate('/resume/upload')
    },
    {
      title: "View Resumes",
      description: "View and manage all your resumes",
      icon: <FaList size={40} />,
      onClick: () => navigate('/resume/view')
    }
    // {
    //   title: "Optimize Resume",
    //   description: "AI-powered resume optimization for job descriptions",
    //   icon: <FaRobot size={40} />,
    //   onClick: () => navigate('/resume/optimize')
    // }
  ];

  return (
    <div className="resume-container">
      <div className="resume-header">
        <h1>Resume Management</h1>
        <p>Manage and edit your resumes for job applications</p>
      </div>
      <div className="resume-tiles">
        {tiles.map((tile, index) => (
          <Tile
            key={index}
            title={tile.title}
            description={tile.description}
            icon={tile.icon}
            onClick={tile.onClick}
          />
        ))}
      </div>
      <div className="resume-footer-actions">
        <button className="nav-btn home-btn" onClick={() => navigate('/dashboard')}>
          Home
        </button>
        <button className="nav-btn cancel-btn" onClick={() => navigate('/dashboard')}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default Resume;
