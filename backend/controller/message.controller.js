const MessageModel = require("../model/message.model");
const UserModel = require("../model/user.model");
const cloudinary = require("cloudinary").v2;
const { getIO } = require("../socket");



// Get all users except the logged in user
const getUsersForSidebar = async (req, res) => { 
    try {
        const userId = req.user._id; // Assuming req.user is populated by auth middleware
        const filteredUsers = await UserModel.find({ _id: { $ne: userId } }).select("-password"); // Exclude the logged in user and select only necessary fields

        // Count number of messages not seen
        const unseenMessageCounts = {}
        const promises = filteredUsers.map(async (user) => {
            const message = await MessageModel.find({ senderId: user._id, receiverId: userId, seen: false })
            if(message.length > 0) {
                unseenMessageCounts[user._id] = message.length
            }
        })
        await Promise.all(promises)

        return res.status(200).json({
            success: true,
            users: filteredUsers,
            unseenMessageCounts,
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Get all messages for selected user
const getMessages = async (req, res) => { 
    try {
        const { id: selectedUserId } = req.params
        const myId = req.user._id

        const messages = await MessageModel.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ],
        })
        await MessageModel.updateMany(
            { senderId: selectedUserId, receiverId: myId, seen: false },
            { seen: true }
        )
        return res.status(200).json({
            success: true,
            messages,
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// api to mark messages as seen using message id
const markMessageAsSeen = async (req, res) => { 
    try {
        const { id } = req.params;
        await MessageModel.findByIdAndUpdate(id, { seen: true })
        return res.status(200).json({
            success: true,
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Send message to select users
const sendMessage = async (req, res) => { 
    try {
        const { text, image } = req.body;
        const receiverId = req.params.id
        const senderId = req.user._id

        let imageUrl;
        if (image) { 
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url
        }
        const newMessage = await MessageModel.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });

        // Emit the new message to the receiver's room (supports multiple devices/tabs)
        const io = getIO();
        io.to(receiverId).emit("newMessage", newMessage);
        
        // Optional: Emit to the sender's room to sync across multiple tabs of the sender
        // io.to(senderId.toString()).emit("newMessage", newMessage);


        return res.status(201).json({
            success: true,
            newMessage
        });

    } catch (error) {
      console.error(error.message);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
}

module.exports = {
    getUsersForSidebar,
    getMessages,
    markMessageAsSeen,
    sendMessage
}