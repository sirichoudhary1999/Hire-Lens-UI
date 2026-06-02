import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './App.css';
import Login from './Login/Login.jsx';
import Dashboard from './Dashboard/Dashboard.jsx';
import UserProfile from "./UserProfile/UserProfile.jsx";
import AddJob from "./JobTracker/JobOperations/AddorUpdateJob.jsx";
import ViewJobs from "./JobTracker/JobOperations/ViewJob.jsx";
import JobAnalytics from "./JobTracker/JobOperations/JobAnalytics.jsx";
import JobSearch from "./JobTracker/JobOperations/JobSearch.jsx";
import UploadResume from "./Resume/ResumeOperations/UploadResume.jsx";
import ViewResumes from "./Resume/ResumeOperations/ViewResumes.jsx";
import ViewResumeDetail from "./Resume/ResumeOperations/ViewResumeDetail.jsx";
import EditResume from "./Resume/ResumeOperations/EditResume.jsx";
// import OptimizeResume from "./Resume/ResumeOperations/OptimizeResume.jsx";

const App = () => {

  return (
    <div className="App">
      <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login />}/>
        <Route path='/login' element={<Login />}/>
        <Route path='/dashboard' element={<Dashboard />}/>
        <Route path='/profile/update' element={<UserProfile />}/>
        <Route path="/jobs" element={<Navigate to="/jobs/view" replace />} />
        <Route path="/jobs/add" element={<AddJob />} />
        <Route path="/jobs/view" element={<ViewJobs/>}/>
        <Route path="/jobs/analytics" element={<JobAnalytics/>}/>
        <Route path="/jobs/search" element={<JobSearch/>}/>
        <Route path="/resume" element={<Navigate to="/resume/view" replace />} />
        <Route path="/resume/upload" element={<UploadResume />} />
        <Route path="/resume/view" element={<ViewResumes />} />
        <Route path="/resume/view/:resumeId" element={<ViewResumeDetail />} />
        <Route path="/resume/edit/:resumeId" element={<EditResume />} />
        {/* <Route path="/resume/optimize/:resumeId?" element={<OptimizeResume />} /> */}
      </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
