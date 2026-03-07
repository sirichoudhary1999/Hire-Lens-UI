const UserProfile = () => {

    return (
        <div className="userprofile-container">
            {/* <div className="userprofile-photo" style={{color:"red"}}>Upload Photo</div> */}
            <form className="userprofile-form"> 
                <div>
                    <label for="name">Full Name</label>
                    <input className="input" id='name' placeholder="Enter full name" name="name" />
                </div>
            </form>
        </div>
    )
}

export default UserProfile;