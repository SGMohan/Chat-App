const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    text: { type: String },
    image: { type: String },
    seen: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const MessageModel = mongoose.model("message", messageSchema);
console.log("MessageModel created successfully", MessageModel);
module.exports = MessageModel;

