const express = require("express");
const UserRouter = express.Router();
const protectedRoute = require("../middleware/auth.middleware");

const {
    getStatus,
    signupUser,
    loginUser,
    checkAuth,
    updateProfile,
} = require("../controller/user.controller");

UserRouter.post("/signup", signupUser);
UserRouter.post("/login", loginUser);
UserRouter.get("/check-auth", protectedRoute, checkAuth);
UserRouter.put("/update-profile", protectedRoute, updateProfile);
UserRouter.get("/status", getStatus);

module.exports = UserRouter;