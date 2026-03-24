const { verifyToken } = require("../config/utils");
const UserModel = require("../model/user.model");

const protectedRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided",
        success: false,
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    // 🔥 Check user exists in DB
    const user = await UserModel.findById(decoded._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // attach full user (better than just _id)
    req.user = user;

    next();
  } catch (error) {
    console.error("Error in protected route middleware:", error);
    return res.status(401).json({
      message: "Invalid or expired token",
      success: false,
    });
  }
};

module.exports = protectedRoute;
