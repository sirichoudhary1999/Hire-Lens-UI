import "./UserProfile.css";
import { FaPlus } from "react-icons/fa";
import axios from "axios";
import { useEffect, useState } from "react";
import DataTable from "../Components/DataTable/DataTable";
import { useNavigate } from "react-router-dom";

const UserProfile = () => {
    const navigate = useNavigate();
    const [skills, setSkills] = useState([]);
    const [skillsInput, setSkillsInput] = useState("");
    const [savedSkills, setSavedSkills] = useState([])
    const [basicInfo, setBasicInfo] = useState({});
    const userId = JSON.parse(localStorage.getItem("user")).id;
    const token = localStorage.getItem("access_token");

    const saveInformation = async(e) => {
      e.preventDefault();

      try{
        const response = await axios.put(
            `http://127.0.0.1:5000/user/updatePrimaryProfileData/${userId}`,
            basicInfo,
            {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
        console.log(response);
        if(response.data.meta.success){
            basicInfoChange(e, true);
        }
      } catch(err) {
        console.log(err);
      }
    };

    const basicInfoChange = (e, clearData) => {
        if (clearData) {
            setBasicInfo({})
        } else {
            setBasicInfo({
                ...basicInfo,
                [e.target.name]: e.target.value
            })
        }
    };

    const setBasicInfoInputTextValue = (name) =>{
        return basicInfo[name] ? basicInfo[name] : "";
    };

    const fetchBasicInfo = () =>{
        axios.get(
            `http://127.0.0.1:5000/user/primaryProfileDatabyId/${userId}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        ).then((response) => {
            console.log(response);
            const infoResponse = response.data.data
            setBasicInfo(infoResponse);
        }).catch((error) => {
            console.log(error);
        })
    }

    const handleAddSkill = () => {
        setSkills([
            ...skills,
            skillsInput
        ]);
        setSkillsInput("");
    };

    const handleSaveSkills = () => {

        axios.put(
            "http://127.0.0.1:5000/profile/updateSkills",
            {
            skill_name: skills
            },
            {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        ).then(response => {
            console.log(response.data);
            let skillsResponse = response.data.data.skills;
            setSkills([]);
            setSavedSkills([
                ...savedSkills,
                skillsResponse]);
        }).catch(error => {
            console.log(error);
        })
    };

    useEffect(() => {
        fetchBasicInfo();
    }, []);

   return (
       <div className="userprofile-container">
           <form className="userprofile-form">
               <div className="profile-section">
                   <div className="section-header">
                       <h3>Basic Information</h3>
                       <button type="button" className="save-section-btn" onClick={saveInformation}>Save Information</button>
                   </div>
                   <div className="form-row">
                       <div className="form-group">
                           <label htmlFor="fullName">Full Name</label>
                           <input
                               type="text"
                               id="fullName"
                               name="full_name"
                               className="input"
                               placeholder="Enter full name"
                               value={setBasicInfoInputTextValue("full_name")}
                               onChange={(e) => basicInfoChange(e, false)}
                           />
                       </div>
                       <div className="form-group">
                           <label htmlFor="username">Username</label>
                           <input
                               type="text"
                               id="username"
                               name="username"
                               className="input"
                               value={setBasicInfoInputTextValue("username")}
                               placeholder="Enter username"
                               onChange={(e) => basicInfoChange(e, false)}
                           />
                       </div>
                   </div>
                   <div className="form-row">
                       <div className="form-group">
                           <label htmlFor="email">Email</label>
                           <input
                               type="email"
                               id="email"
                               name="email"
                               className="input"
                               value={setBasicInfoInputTextValue("email")}
                               placeholder="Enter email"
                               onChange={(e) => basicInfoChange(e, false)}
                           />
                       </div>
                       <div className="form-group">
                           <label htmlFor="phone">Phone Number</label>
                           <input
                               type="text"
                               id="phone"
                               name="phone"
                               className="input"
                               value={setBasicInfoInputTextValue("phone")}
                               placeholder="Enter phone number"
                               onChange={(e) => basicInfoChange(e, false)}
                           />
                       </div>
                   </div>
                   <div className="form-row">
                       <div className="form-group">
                           <label htmlFor="location">Location</label>
                           <input
                               type="text"
                               id="location"
                               name="location"
                               className="input"
                               value={setBasicInfoInputTextValue("location")}
                               placeholder="Enter location"
                               onChange={(e) => basicInfoChange(e, false)}
                           />
                       </div>
                       <div className="form-group">
                           <label htmlFor="experience">Total Experience </label>
                           <input
                               type="text"
                               id="experience"
                               name="total_experience"
                               className="input"
                               value={setBasicInfoInputTextValue("total_experience")}
                               placeholder="Enter total experience"
                               onChange={(e) => basicInfoChange(e, false)}
                           />
                       </div>
                   </div>
               </div>
               <div className="profile-section">
                   <div className="section-header">
                       <h3>Skills</h3>
                       <button type="button" className="save-section-btn" onClick={handleSaveSkills}>Save Skills</button>
                   </div>
                   <div className="form-group">
                       <label htmlFor="skills">Add Skills</label>
                       <div className="skill-input-wrapper">
                           <input
                               type="text"
                               id="skills"
                               name="skills"
                               className="input"
                               placeholder="Enter skill"
                               onChange={(e) =>
                                   setSkillsInput(e.target.value)
                               }
                               value={skillsInput}
                           />
                           <button type="button" className="add-skill-btn" onClick={handleAddSkill}><FaPlus /></button>
                       </div>
                   </div>
                   {
                       skills.length > 0 && (
                           <div className="skills-container">
                               {
                                   skills.map((skill, index) => (
                                       <div key={index} className="skill-chip">{skill}</div>
                                   ))
                               }
                           </div>
                       )
                   }
                   {
                       savedSkills.length > 0 && (
                           <div className="saved-skills-container">
                               <ul className="saved-skills-list">
                                   {
                                       savedSkills.map((skill, index) => (
                                           <li key={index}>{skill}</li>
                                       ))
                                   }
                               </ul>
                           </div>
                       )
                   }
               </div>
           </form>
           <div className="profile-footer-actions">
               <button type="button" onClick={() => navigate('/dashboard')}>Home</button>
               <button type="button" onClick={() => navigate('/dashboard')}>Cancel</button>
           </div>
       </div>
)
};

export default UserProfile;