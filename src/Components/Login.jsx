import { useState, useEffect, use } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
    const reuestUrl = isRegister ? "http://127.0.0.1:5000/users" : "http://127.0.0.1:5000/user/login";
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
          navigate('/dashboard')
        } else {
          setError(response.meta.message)
        }
      })
      .catch(err => {
        console.log("error", err)
        alert("error")
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
            <label for="username">Username</label>
            <input
              className="input"
              id='username'
              placeholder="Enter username"
              name="username"
              value={username}
              onChange={handleChange} />
          </div>
        }
        <div>
          <label for="email">Email</label>
          <input
            className="input text-blue-600"
            id='email'
            placeholder="Enter email"
            name="email"
            value={email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label for="password">Password</label>
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