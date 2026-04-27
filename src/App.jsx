import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import Login from './Components/Login/Login.jsx';
import Dashboard from './Components/Dashboard/Dashboard.jsx';
import UserProfile from "./Components/UserProfile/UserProfile.jsx";
import JobTracker from "./Components/JobTracker/JobTracker.jsx";
import AddJob from "./Components/JobTracker/JobOperations/AddorUpdateJob.jsx";
import ViewJobs from "./Components/JobTracker/JobOperations/ViewJob.jsx"

const App = () => {


  return (
    <div className="App">
      <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login />}/>
        <Route path='/login' element={<Login />}/>
        <Route path='/dashboard' element={<Dashboard />}/>
        <Route path='/profile/update' element={<UserProfile />}/>
        <Route path ="/jobs" element={<JobTracker />} />
        <Route path = "/jobs/add" element={<AddJob />} />
        <Route path ="/jobs/view" element={<ViewJobs/>}/>
      </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
