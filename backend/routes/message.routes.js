const express = require("express");
const protectedRoute = require("../middleware/auth.middleware");
const MsgRouter = express.Router();

const {
    getUsersForSidebar,
    getMessages,
    markMessageAsSeen,
    sendMessage
} = require("../controller/message.controller");

MsgRouter.get("/users", protectedRoute, getUsersForSidebar)
MsgRouter.get("/:id", protectedRoute, getMessages)
MsgRouter.put("/mark/:id", protectedRoute, markMessageAsSeen)
MsgRouter.post("/send/:id", protectedRoute, sendMessage)


module.exports = MsgRouter;