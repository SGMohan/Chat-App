require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http"); 
const connectDB = require("./config/db");
const UserRouter = require("./routes/user.routes");
const connectCloudinary = require("./config/cloudinary");
const MsgRouter = require("./routes/message.routes");
const { initSocket } = require("./socket");


const app = express();
const server = http.createServer(app);

connectDB();
connectCloudinary();

// init socket
initSocket(server);

// Middleware
app.use(express.json({ limit: "4mb" }));
app.use(cors());
app.use("/api/auth", UserRouter);
app.use("/api/messages", MsgRouter);

app.get("/", (_, res) => {
  res.status(200).json({
    message: "Welcome to the Chat App API",
  });
});

// IMPORTANT: use server.listen (NOT app.listen)
server.listen(process.env.PORT, process.env.HOSTNAME, () => {
  console.log(`http://${process.env.HOSTNAME}:${process.env.PORT}`);
});


