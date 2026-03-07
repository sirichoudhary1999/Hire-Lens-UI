import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import Login from './Components/Login/Login.jsx';
import Dashboard from './Components/Dashboard/Dashboard.jsx';
import UserProfile from "./Components/UserProfile/UserProfile.jsx";

const App = () => {


  return (
    <div className="App">
      <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login />}/>
        <Route path='/login' element={<Login />}/>
        <Route path='/dashboard' element={<Dashboard />}/>
        <Route path='/updateProfile' element={<UserProfile />}/>
      </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
