import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  Link,
  useParams,
} from "react-router-dom";
import Navbar from "./components/Navbar";

const API_URL = "http://localhost:5000/api";

/* ===========================
   Home Pageeeeeee
=========================== */
function Home() {
  const [year, setYear] = useState("");
  const [dept, setDept] = useState("");
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // ✅ NEW

  const departments = ["IT", "CSE", "AIDS", "ECE"];
  const years = [1, 2, 3, 4];

  const fetchStudents = async () => {
    if (year && dept) {
      const res = await axios.get(
        `${API_URL}/students?year=${year}&department=${dept}`
      );
      setStudents(res.data);
    }
  };
  useEffect(() => {
    fetchStudents();
  }, [year, dept]);

  // ✅ Filter students based on searchTerm
  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) || s.regNo.toString().includes(term)
    );
  });

  return (
    <div className="home">
      {/* ===== Navbar ===== */}
      <div className="navbar">
        <div className="rmk-div">
          <img
            src="logo2.gif"
            alt="logo"
            className="me-2"
            style={{ width: "35px" }}
          />
          <h1 className="navbar-brand mb-0 fw-bold">R.M.K</h1>
        </div>
        <div>
          {/* <Link to="/" className="btn btn-warning">Home</Link> |{" "} */}
          <Link to="/signup" className="btn btn-dark">
            Signup
          </Link>{" "}
          |{" "}
          <Link to="/login" className="btn btn-light">
            Login
          </Link>
        </div>
      </div>
      {/* ===== Year & Department ===== */}
      <div className="box-year-dept">
        <div>
          <h3 className="year">Select Year</h3>
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`btn ms-2 ${year === y ? "btn-warning" : "btn-dark"}`}
            >
              {y} Year
            </button>
          ))}
        </div>

        <div>
          {year && (
            <>
              <h3 className="dept">Select Department</h3>
              {departments.map((d) => (
                <button
                  key={d}
                  onClick={() => setDept(d)}
                  className={`btn ms-2 ${
                    dept === d ? "btn-warning" : "btn-light"
                  }`}
                >
                  {d}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {!year && (
        <div
          className="main container d-flex justify-content-center mt-0"
          style={{ minHeight: "650px" }}
          data-aos="zoom-in"
          data-aos-delay="0"
          data-aos-duration="1000"
        >
          <div className="row w-100">
            <div className="col-lg-6 text-center p-md-5 my-md-4 p-1 my-1">
              <h1 className="my-2">RMK ENGINEERING COLLEGE</h1>
              <h1 className="my-md-2 my-1 py-md-3 py-1">
                30 Years of Excellence
              </h1>
              <p className="my-2 text-lg-start">
                30 years. 8 Institutions. One Heart. From cutting-edge to
                leading edge, RMK offers an ever adapting and dynamic learning
                process across all its institutions. A highly qualified faculty,
                across disciplines. Uniform class size and student-to-faculty
                ratio facilitating healthy student-teacher interactions and
                learning partnerships
                <button
                  className="btn btn-primary mx-3"
                  onClick={() =>
                    window.open("https://www.rmkec.ac.in/2023/", "_blank")
                  }
                >
                  Read more...
                </button>
              </p>
            </div>
            <div className="col-lg-6 img"></div>
          </div>
        </div>
      )}

      {/* ===== Students List ===== */}
      <div className="box">
        {students.length > 0 && (
          <>
            <h3 className="list">Students List</h3>

            {/* ✅ Search Bar */}
            <input
              type="text"
              placeholder="🔍 Search by name or reg no"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control mb-3"
            />

            <div className="students-grid">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => (
                  <Link
                    to={`/student/${s._id}`}
                    key={s._id}
                    className="box-link"
                  >
                    <div className="box-item">
                      <h3>{s.name}</h3>
                      <p>{s.regNo}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-light">No students found.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ===========================
   Student Detail Pageeeeeeeee
=========================== */
function StudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [certs, setCerts] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(""); // ✅ NEW
  const [file, setFile] = useState(null);

  // Login state for profile verification
  const [showVerifyBox, setShowVerifyBox] = useState(false);
  const [profilePassword, setProfilePassword] = useState("");
  const [verified, setVerified] = useState(false);

  // Logged-in user (from login page)
  const loggedInUser = JSON.parse(localStorage.getItem("student"));

  const [showDesc, setShowDesc] = useState(false);
  const [activeDesc, setActiveDesc] = useState("");

  useEffect(() => {
    axios.get(`${API_URL}/students/${id}`).then((res) => setStudent(res.data));
    fetchCertificates();
  }, [id]);

  const fetchCertificates = async () => {
    const res = await axios.get(`${API_URL}/certificates/${id}`);
    setCerts(res.data);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!loggedInUser) return alert("Please login first!");

    try {
      const res = await axios.post(`${API_URL}/verify-both/${id}`, {
        loggedInUserRegNo: loggedInUser.regNo,
        loggedInUserPassword: loggedInUser.passwordPlain, // only for demo
        profileOwnerPassword: profilePassword,
      });

      if (res.data.message === "Verified") {
        setVerified(true);
        setShowVerifyBox(false);
      } else {
        alert("Verification failed!");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Verification failed");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description); // ✅ send description

    await axios.post(`${API_URL}/certificates/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setTitle("");
    setDescription(""); // ✅ reset
    setFile(null);
    fetchCertificates();
  };

  if (!student) return <p>Loading...</p>;

  return (
    <div className="home">
      <div className="user-card">
        <div className="user-details">
          <table>
            <tbody>
              <tr>
                <th>Name</th>
                <td>{student.name}</td>
              </tr>
              <tr>
                <th>RegNo</th>
                <td>{student.regNo}</td>
              </tr>
              <tr>
                <th className="gold">1st Sem GPA</th>
                <td>{student.sem1GPA}</td>
              </tr>
              <tr>
                <th className="gold">2nd Sem GPA</th>
                <td>{student.sem2GPA}</td>
              </tr>
              <tr>
                <th className="gold">3rd Sem GPA</th>
                <td>{student.sem3GPA}</td>
              </tr>
              <tr>
                <th className="gold">4th Sem GPA</th>
                <td>{student.sem4GPA}</td>
              </tr>
              <tr>
                <th>Current CGPA</th>
                <td>{student.cgpa}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Section with Verification */}
      <div className="certificate">
        <div className="certificate-body">
          <div className="certificate-upload">
            {!verified ? (
              <>
                <button
                  className="btn btn-danger"
                  onClick={() => setShowVerifyBox(true)}
                >
                  Login to Upload
                </button>
                {showVerifyBox && (
                  <form onSubmit={handleVerify} style={{ marginTop: "10px" }}>
                    <input
                      type="password"
                      placeholder="Enter profile password"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      required
                      style={{ width: "300px" }}
                      className="form-control"
                    />
                    <button type="submit" className="btn btn-warning mt-2">
                      Verify
                    </button>
                  </form>
                )}
              </>
            ) : (
              <>
                <h3 className="text-white">Upload Certificate</h3>
                <form onSubmit={handleUpload}>
                  <input
                    type="text"
                    placeholder="Certificate Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="form-control"
                    style={{ width: "300px" }}
                  />

                  {/* ✅ NEW DESCRIPTION FIELD */}
                  <textarea
                    placeholder="Certificate Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="form-control mt-2"
                    style={{ width: "300px", height: "80px" }}
                  />

                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    required
                    className="btn btn-light mt-2"
                  />
                  <button type="submit" className="btn btn-warning ms-2">
                    Upload
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Certificates List */}
          <h3 className="display-6 text-white my-2">Certificates</h3>
          
          {certs.length === 0 ? (
            <p className="text-white">No certificates uploaded yet.</p>
          ) : (
            <div className="bunch-certificate">
              {certs.map((c) => (
                <div key={c._id} className="certificate-single">
                  <strong className="text-light">{c.title}</strong>
                  <div style={{ marginTop: "0px" }}>
                    {c.filePath.endsWith(".pdf") ? (
                      <embed
                        src={`http://localhost:5000${c.filePath}#toolbar=0&navpanes=0&scrollbar=0`}
                        title={c.title}
                        style={{
                          width: "300px",
                          height: "300px",
                          borderRadius: "8px",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                          overflow: "hidden",
                        }}
                      />
                    ) : (
                      <img
                        src={`http://localhost:5000${c.filePath}`}
                        alt={c.title}
                        style={{
                          width: "300px",
                          height: "300px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        }}
                      />
                    )}
                  </div>

                  <p>
                    <a
                      href={`http://localhost:5000${c.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-warning mt-2"
                    >
                      View Full File
                    </a>
                  </p>
                  {c.description && (
                    <button
                      className="btn btn-success certificate-desc clickable"
                      onClick={() => {
                        setActiveDesc(c.description);
                        setShowDesc(true);
                      }}
                    >
                      View Description
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <Link to="/" className="btn btn-light mt-2">
            Back
          </Link>
        </div>
      </div>
      {/* ✅ DESCRIPTION MODAL — OUTSIDE GRID */}
    {showDesc && (
      <div
        className="desc-modal-backdrop"
        onClick={() => setShowDesc(false)}
      >
        <div
          className="desc-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <h5>Description</h5>
          <p>{activeDesc}</p>
          <button
            className="btn btn-warning mt-3"
            onClick={() => setShowDesc(false)}
          >
            Close
          </button>
        </div>
      </div>
    )}
    </div>
  );
}

/* ===========================
   Login Pageeee
=========================== */
function Login() {
  const [regNo, setRegNo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        regNo: Number(regNo),
        password,
      });

      // Save student + plain password for later verification
      localStorage.setItem(
        "student",
        JSON.stringify({ ...res.data.student, passwordPlain: password })
      );

      navigate(`/student/${res.data.student._id}`);
    } catch (err) {
      if (err.response?.status === 401) {
        setError(
          err.response.data.message === "Please verify your mobile first"
            ? "Please verify your mobile using OTP before login."
            : "Invalid password"
        );
      } else if (err.response?.status === 404) {
        setError("User not found");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home signup">
      <div className="signup-body">
        <h2 className="text-light">Student Login</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Register Number"
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            required
            className="form-control"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-control mt-3"
          />
          <button
            className="btn btn-warning mt-3"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-light my-0 mt-2">
          Don’t have an account? <Link to="/signup">Signup</Link>
        </p>
        <p className="my-0 mt-1">
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>

        <p className="mb-0 mt-1">
          <Link to="/" className="btn btn-light">
            back
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ===========================
   Forget Passworddddddddd
=========================== */
function ForgotPassword() {
  const [regNo, setRegNo] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const sendOtp = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, {
        regNo: Number(regNo),
      });
      alert("OTP sent to your registered mobile.");
      setOtpSent(true);
    } catch (err) {
      alert(err.response?.data?.message || "Error sending OTP");
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        regNo: Number(regNo),
        otp,
        newPassword,
      });
      alert("Password changed successfully. Please login.");
      window.location.href = "/login";
    } catch (err) {
      alert(err.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="home signup">
      <div className="signup-body">
        <h2 className="text-light">Forgot Password</h2>
        {!otpSent ? (
          <form onSubmit={sendOtp}>
            <input
              type="text"
              placeholder="Register Number"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              required
              className="form-control"
            />
            <button type="submit" className="btn btn-warning mt-3">
              Send OTP
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword}>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="form-control"
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="form-control mt-3"
            />
            <button type="submit" className="btn btn-warning mt-3">
              Reset Password
            </button>
          </form>
        )}
        <p>
          <Link to="/" className="btn btn-light mt-2">
            back
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ===========================
   Signup Pageeeeee
=========================== */
function Signup() {
  const [form, setForm] = useState({ regNo: "", mobile: "", password: "" });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/signup`, {
        regNo: Number(form.regNo),
        mobile: form.mobile,
        password: form.password,
      });

      alert(res.data.message);
      setOtpSent(true);
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/auth/verify-otp`, {
        regNo: Number(form.regNo),
        otp,
      });
      alert("Mobile Verified! You can login now.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "OTP Verification failed");
    }
  };

  return (
    <div className="home signup">
      <div className="signup-body">
        <h2 className="text-light">Signup</h2>
        {!otpSent ? (
          <form onSubmit={handleSignup}>
            <input
              type="text"
              placeholder="Register Number"
              value={form.regNo}
              onChange={(e) => setForm({ ...form, regNo: e.target.value })}
              required
              className="form-control"
            />
            <input
              type="text"
              placeholder="Mobile Number"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              required
              className="form-control mt-3"
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="form-control mt-3"
            />
            <button type="submit" className="btn btn-warning mt-3">
              Send OTP
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="form-control"
            />
            <button type="submit" className="btn btn-warning mt-3">
              Verify OTP
            </button>
          </form>
        )}
        <p>
          <Link to="/" className="btn btn-light mb-0 mt-2">
            back
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const isLoggedIn = !!localStorage.getItem("student");

  return (
    <Router>
      {/* <Navbar /> */}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Routes */}
        <Route path="/home" element={isLoggedIn ? <Home /> : <Login />} />
        <Route
          path="/student/:id"
          element={isLoggedIn ? <StudentDetail /> : <Login />}
        />
      </Routes>
    </Router>
  );
}
