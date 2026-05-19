import { useState, useEffect, use } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "./Login.css";

const Login = () => {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "email") setEmail(value);
    if (name === "password") setPassword(value);
    if (name === "username") setUsername(value);
  };

  useEffect(() => {
    const isValid = email && password && (!isRegister || username)
    if (isValid) {
      setError("")
    }
  }, [email, username, password, isRegister]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const isValidInputs = email && password && (!isRegister || username)
    const reuestUrl = isRegister ? "http://127.0.0.1:5000/user/register" : "http://127.0.0.1:5000/user/login";
    let requestPayload = {
      "email": email,
      "password": password,
      ...(isRegister && { username })
    };

    if (!isValidInputs) {
      setError("Please enter mandatory data");
      return;
    }

    axios.post(
      reuestUrl,
      requestPayload
    )
      .then(res => {
        let response = res.data;
        if (response.meta.success) {
          setIsRegister(!isRegister)
          navigate('/dashboard')
          const profilename = response.data.user.username.toUpperCase();
          localStorage.setItem("user",  JSON.stringify(response.data.user))
          localStorage.setItem("access_token", response.data.access_token);
          localStorage.setItem("profilename", profilename);
        } else {
          setError(response.meta.message)
        }
      })
      .catch(err => {
        console.log("error", err)
        alert(err.response?.data?.msg || "Something went wrong!");
      })

  };

  const handleRegister = () => {
    setIsRegister(!isRegister)
    setEmail("");
    setPassword("");
    setUsername("")
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        {isRegister &&
          <div>
            <label htmlFor="username">Full Name</label>
            <input
              className="input text-black"
              id='username'
              placeholder="Enter full name"
              name="username"
              value={username}
              onChange={handleChange} />
          </div>
        }
        <div>
          <label htmlFor="email">Email</label>
          <input
            className="input"
            id='email'
            placeholder="Enter email"
            name="email"
            value={email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            className="input"
            placeholder="Enter password"
            id='password'
            value={password}
            name="password"
            onChange={handleChange} />
        </div>
        <button type="submit" className={`login-button ${error ? "disabled" : ""}`}> {isRegister ? "Register" : "Login"}</button>
        {error && <p className="login-error">{error}</p>}
        <p className='register-login-link' onClick={handleRegister}>{isRegister ? "Login here" : "Register here"}</p>
      </form>
    </div>
  )
};

export default Login;