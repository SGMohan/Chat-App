import { createContext, useContext, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import { useEffect } from "react";


export const ChatContext = createContext();

export const ChatProvider = ({ children }) => { 

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const [typingUsers, setTypingUsers] = useState([]); // List of user IDs currently typing to me

    const { socket, axios, authUser } = useContext(AuthContext)

    // function to get all users for sidebar
    const getUsers = async () => { 
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessageCounts);
            }
            
        } catch (error) {
            toast.error(error.message);
        }
    }

    // function to get messaages for selected user
    const getMessages = async (userId) => { 
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) { 
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // function to send message to selected user
    const sendMessage = async (message) => { 
        try {
            const { data } = await axios.post(
              `/api/messages/send/${selectedUser._id}`,
              message,
            );
            if (data.success) { 
                setMessages((prevMessages) => [...prevMessages, data.newMessage]);
            }
            else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // Typing indicators
    const sendTypingStatus = (isTyping) => {
        if (!socket || !selectedUser) return;
        socket.emit(isTyping ? "typing" : "stopTyping", {
            receiverId: selectedUser._id
        });
    }

    // function to subscribe to messages for selected user
    const subscribeToMessages = () => { 
        if (!socket) return;
        
        socket.on("newMessage", (newMessage) => { 
            // Check if current user is receiver
            if (selectedUser && newMessage.senderId === selectedUser._id) { 
                newMessage.seen = true;
                setMessages((prevMessages) => [...prevMessages, newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);
            } else {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages,
                    [newMessage.senderId]: (prevUnseenMessages[newMessage.senderId] || 0) + 1,
                 }) );
            }
        });

        socket.on("userTyping", ({ senderId }) => {
             setTypingUsers((prev) => prev.includes(senderId) ? prev : [...prev, senderId]);
        });


        socket.on("userStopTyping", ({ senderId }) => {
            setTypingUsers((prev) => prev.filter(id => id !== senderId));
        });
    }

    // function to unsubscribe from messages
    const unsubscribeFromMessages = () => { 
        if (socket) {
            socket.off("newMessage");
            socket.off("userTyping");
            socket.off("userStopTyping");
        }
    }

    useEffect(() => {
        if (socket) {
            subscribeToMessages();
            return () => unsubscribeFromMessages();
        }
      },[socket, selectedUser]);


    const value = {
        messages,
        users,
        selectedUser,
        getUsers,
        getMessages,
        sendMessage,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
        typingUsers,
        sendTypingStatus
    }


    return (
        <ChatContext.Provider value={value}>
            { children }
        </ChatContext.Provider>
    )
}