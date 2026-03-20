const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const axios = require("axios");


require("dotenv").config();
const twilio = require("twilio");
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

const app = express();
app.use(cors());
app.use(express.json());
// =============================
// 📂 Ensure uploads folder exists
// =============================

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use("/uploads", express.static(uploadsDir));

// =============================
// 🌐 MongoDB Connection
// =============================
mongoose
  .connect("mongodb://localhost:27017/rmkDB")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// =============================
// 📦 Schemas & Models
// =============================
const studentSchema = new mongoose.Schema({
  name: String,
  regNo: Number,
  year: Number,
  department: String,
  sem1GPA: { type: Number, default: 0 },
  sem2GPA: { type: Number, default: 0 },
  sem3GPA: { type: Number, default: 0 },
  sem4GPA: { type: Number, default: 0 },
  cgpa: { type: Number, default: 0 },
  number: { type: String, required: true } // ✅ Add this!
});

const Student = mongoose.model("Student", studentSchema);

const userAuthSchema = new mongoose.Schema({
  regNo: { type: Number, required: true },
  mobile: { type: String, required: true, unique: true }, // ✅ NEW
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpiry: Date,
});
const UserAuth = mongoose.model("UserAuth", userAuthSchema);

// Certificate uploads
const certificateSchema = new mongoose.Schema({
  studentId: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  filePath: String,
  uploadedAt: { type: Date, default: Date.now },
});
const Certificate = mongoose.model("Certificate", certificateSchema);

// =============================
// 📂 Multer Setup for File Uploads
// =============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

// =============================
// 🏠 Test Route
// =============================
app.get("/", (req, res) => res.send("✅ Backend is running!"));


// =============================
// 🔑 Signup with Mobile OTP (UPDATED)
// =============================
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { regNo, mobile, password } = req.body;

    if (!regNo || !mobile || !password)
      return res.status(400).json({ message: "Register Number, Mobile and Password required" });

    // ✅ 1. Check if student exists and number matches
    const studentExists = await Student.findOne({ regNo });
    if (!studentExists)
      return res.status(404).json({ message: "RegNo not found in student records" });

    // (OPTIONAL) If Student schema contains a number field, verify it matches
    if (studentExists.number && studentExists.number !== mobile) {
      return res.status(400).json({ message: "Mobile number does not match student record" });
    }

    // ✅ 2. Check if regNo OR mobile already registered in UserAuth
    const existingAuth = await UserAuth.findOne({ $or: [{ regNo }, { mobile }] });
    if (existingAuth)
      return res.status(400).json({ message: "User already exists" });

    // ✅ 3. Proceed with hashing password and generating OTP
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 5 * 60 * 1000;

    await UserAuth.create({
      regNo,
      mobile,
      password: hashedPassword,
      otp,
      otpExpiry,
      isVerified: false,
    });

    //Twilio OTP send
    await client.messages.create({
      body: `Your RMK Verification OTP is ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: `+91${mobile}`,
    });

    console.log(`📲 OTP sent to ${mobile}`);
    res.json({ message: "OTP sent to your mobile number" });

  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(500).json({ message: err.message });
  }
});


// =============================
// ✅ Verify OTP
// =============================
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { regNo, otp } = req.body;

    const user = await UserAuth.findOne({ regNo });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified)
      return res.status(400).json({ message: "Already verified" });

    if (user.otp !== otp || Date.now() > user.otpExpiry)
      return res.status(401).json({ message: "Invalid or expired OTP" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "✅ Mobile number verified successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// =============================
// 📲 Verify OTP Route
// =============================
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { regNo, otp } = req.body;
    const user = await UserAuth.findOne({ regNo });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp || Date.now() > user.otpExpiry)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "Mobile number verified successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================
// 🔑 Login Route
// =============================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { regNo, password } = req.body;
    if (!regNo || !password)
      return res.status(400).json({ message: "RegNo and Password required" });

    const userAuth = await UserAuth.findOne({ regNo });
    if (!userAuth) return res.status(404).json({ message: "User not found" });

    if (!userAuth.isVerified)
      return res.status(401).json({ message: "Please verify your mobile first" });

    const isMatch = await bcrypt.compare(password, userAuth.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    const student = await Student.findOne({ regNo });
    res.json({ message: "Login successful", student });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// =============================
// 🔒 Two-Password Verification
// =============================
app.post("/api/verify-both/:profileId", async (req, res) => {
  try {
    const { loggedInUserRegNo, loggedInUserPassword, profileOwnerPassword } = req.body;

    const loggedInUserAuth = await UserAuth.findOne({ regNo: loggedInUserRegNo });
    if (!loggedInUserAuth)
      return res.status(404).json({ message: "Logged-in user not found" });

    const isLoggedInMatch = await bcrypt.compare(loggedInUserPassword, loggedInUserAuth.password);
    if (!isLoggedInMatch)
      return res.status(401).json({ message: "Your password is incorrect" });

    const profileStudent = await Student.findById(req.params.profileId);
    if (!profileStudent)
      return res.status(404).json({ message: "Profile not found" });

    const profileOwnerAuth = await UserAuth.findOne({ regNo: profileStudent.regNo });
    if (!profileOwnerAuth)
      return res.status(404).json({ message: "Profile user not found" });

    const isOwnerMatch = await bcrypt.compare(profileOwnerPassword, profileOwnerAuth.password);
    if (!isOwnerMatch)
      return res.status(401).json({ message: "Profile password incorrect" });

    res.json({ message: "Verified" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================
// 👨‍🎓 Fetch Students
// =============================
app.get("/api/students", async (req, res) => {
  try {
    const { year, department } = req.query;
    const filter = {};
    if (year) filter.year = Number(year);
    if (department) filter.department = department;

    const students = await Student.find(filter);
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================
// 👨‍🎓 Get Single Student by ID
// =============================
app.get("/api/students/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================
// 📜 Upload Certificate
// =============================
// app.post("/api/certificates/:studentId", upload.single("file"), async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ error: "No file uploaded" });

//     const cert = new Certificate({
//       studentId: req.params.studentId,
//       title: req.body.title,
//       filePath: `/uploads/${req.file.filename}`,
//     });

//     await cert.save();
//     res.json(cert);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

app.post("/api/certificates/:studentId", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const cert = new Certificate({
      studentId: req.params.studentId,
      title: req.body.title,
      description: req.body.description,   // ✅ Save description
      filePath: `/uploads/${req.file.filename}`,
    });

    await cert.save();
    res.json(cert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});




// =============================
// 📜 Get Certificates for a Student
// =============================
app.get("/api/certificates/:studentId", async (req, res) => {
  try {
    const certs = await Certificate.find({ studentId: req.params.studentId });
    res.json(certs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================
// 🔑 Forgot Password - Send OTP
// =============================
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { regNo } = req.body;
    if (!regNo) return res.status(400).json({ message: "Register Number required" });

    const user = await UserAuth.findOne({ regNo });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // ✅ Send OTP via Twilio
    await client.messages.create({
      body: `Your RMK password reset OTP is ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: `+91${user.mobile}`,
    });

    res.json({ message: "OTP sent to your registered mobile number" });
  } catch (err) {
    console.error("❌ Forgot Password Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// =============================
// 🔑 Reset Password with OTP
// =============================
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { regNo, otp, newPassword } = req.body;
    if (!regNo || !otp || !newPassword)
      return res.status(400).json({ message: "All fields required" });

    const user = await UserAuth.findOne({ regNo });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otp || user.otp !== otp || Date.now() > user.otpExpiry)
      return res.status(401).json({ message: "Invalid or expired OTP" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Reset Password Error:", err);
    res.status(500).json({ message: err.message });
  }
});


// =============================
// 🚀 Start Server
// =============================
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
