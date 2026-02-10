import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import Login from './Components/Login.jsx';
import Dashboard from './Components/Dashboard.jsx';


const App = () => {

  return (
    <div className="App">
      <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login />}/>
        <Route path='/login' element={<Login />}/>
        <Route path='/dashboard' element={<Dashboard />}/>
      </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
