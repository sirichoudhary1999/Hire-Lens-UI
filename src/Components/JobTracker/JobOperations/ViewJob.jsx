import "../JobTracker.css"
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ViewJob = () => { 
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        axios.get("http://127.0.0.1:5000/jobs/fetchAllJobs",
        {
            "headers" : {
                "Authorization" : `Bearer ${token}`,
                "Content-Type"  : "application/json"
            }

        }).then(response => {
            let responseData = response.data
            console.log(responseData);
            setJobs(responseData);
        })
    }, [])
}

export default ViewJob;
