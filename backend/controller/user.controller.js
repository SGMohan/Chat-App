const bcrypt = require("bcryptjs");
const UserModel = require("../model/user.model");
const { generateToken } = require("../config/utils");
const cloudinary = require("cloudinary").v2;

// Health check
const getStatus = async (_, res) => {
  return res.status(200).json({
    message: "User API is operational",
    success: true,
  });
};

// Signup
const signupUser = async (req, res) => {
  const { email, fullName, password, bio } = req.body;

  try {
    if (!email || !fullName || !password || !bio) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists",
        success: false,
        data: {
          _id: existingUser._id,
          fullName: existingUser.fullName,
          email: existingUser.email,
        },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await UserModel.create({
      email,
      fullName,
      password: hashedPassword,
      bio,
    });

    const token = generateToken(newUser); // Pass the necessary user details to generateToken

    return res.status(201).json({
      message: "Account created successfully",
      success: true,
      data: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
      },
      token,
    });

  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// Login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Both email and password are required",
      success: false,
    });
  }

  try {
    const user = await UserModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "User not found. Please Sign up and Login",
        success: false,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid Password",
        success: false,
      });
    }

    const token = generateToken(user); // Don't the pass id here, pass the whole user object and let the generateToken function handle it

    return res.status(200).json({
      message: "Login Successfully",
      success: true,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Check Auth
const checkAuth = async (req, res) => {
  try {
      return res.status(200).json({
        message: "User Authenticated",
        success: true,
        data: {
          _id: req.user._id,
          fullName: req.user.fullName,
          email: req.user.email,
          profilePic: req.user.profilePic,
          bio: req.user.bio,
        },
      });

  } catch (error) {
      console.error("Auth check error:", error);
      return res.status(500).json({
          message: "Internal Server Error",
          success: false,
      });
  }
};

// Update profile details
const updateProfile = async (req, res) => { 
    try {
        const { profilePic, bio, fullName } = req.body;
        const userId = req.user._id;

        let updatedUser;

        if (!profilePic) {
            updatedUser =  await UserModel.findByIdAndUpdate(
                userId,
                { fullName, bio },
                { new: true }
            );
        }
        else {
            const upload = await cloudinary.uploader.upload(profilePic);
            updatedUser = await UserModel.findByIdAndUpdate(
                userId,
                { fullName, bio, profilePic: upload.secure_url },
                { new: true }
            );
        }
        return res.status(200).json({
            message: "Profile updated successfully",
            success: true,
            data: updatedUser,
        });
    } catch (error) {
        console.error("Profile update error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
}

module.exports = {
  getStatus,
  signupUser,
  loginUser,
  checkAuth,
  updateProfile,
};
