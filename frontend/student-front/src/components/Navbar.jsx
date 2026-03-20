import { NavLink, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="">
        {/* Logo + Brand */}
        <div className="rmk-div">
          <img
            src="logo2.gif"
            alt="logo"
            className="me-2"
            style={{ width: "35px" }}
          />
          <h1 className="navbar-brand mb-0 fw-bold">R.M.K</h1>
        </div>

        {/* Mobile Toggle Button */}
        {/* <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button> */}

        {/* Nav Links */}

        
        <div className="collapse navbar-collapse justify-content-end"id="navbarNav">
          <ul className="navbar-nav">
           {/* <li className="nav-item mx-3">
              <NavLink className="nav-link" to="/" end>
                Home
              </NavLink>
            </li> */}
            {/*
            <li className="nav-item mx-3">
              <NavLink className="nav-link" to="/first">
                1st Year
              </NavLink>
            </li>
            <li className="nav-item mx-3">
              <NavLink className="nav-link" to="/second">
                2nd Year
              </NavLink>
            </li>
            <li className="nav-item mx-3">
              <NavLink className="nav-link" to="/third">
                3rd Year
              </NavLink>
            </li>
            <li className="nav-item mx-3">
              <NavLink className="nav-link" to="/fourth">
                4th Year
              </NavLink>
            </li> */}

            {/* Show login/signup only if not logged in */}
            {/* {!isLoggedIn && (
              <>
                <li className="nav-item mx-3">
                  <NavLink className="nav-link" to="/login">
                    Login
                  </NavLink>
                </li>
                <li className="nav-item mx-3">
                  <NavLink className="nav-link" to="/signup">
                    Signup
                  </NavLink>
                </li>
              </>
            )}
            */}

            {/* Show logout only if logged in */}
            {/* {isLoggedIn && (
              <li className="nav-item mx-3">
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </li>
            )}  */}
          </ul>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
