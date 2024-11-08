import React, { useState, useEffect } from "react";
import { chat } from "../services/apiService"; // Assumed API service
import AnalysisChart from "./AnalysisChart"; // Assumed chart component
import { FiMenu } from "react-icons/fi"; // For menu icon
import { MdLogout } from "react-icons/md"; // For logout icon
import botImage from "../assets/bot.jpg"; // Add bot image path
import userImage from "../assets/user.png"; // Add user image path
import { ImCross } from "react-icons/im";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [menuOpen, setMenuOpen] = useState(false); // To control sidebar menu

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await chat(token, "");
        if (response && response.history) {
          setMessages(response.history);
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };
    fetchChatHistory();
  }, [token]);

  const handleSendMessage = async () => {
    if (!userInput) return;

    const newMessages = [...messages, { sender: "user", text: userInput }];
    setMessages(newMessages);

    try {
      const response = await chat(token, userInput);

      if (response && response.response) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "bot", text: response.response },
        ]);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "bot", text: "I couldn't get a response from the bot." },
        ]);
      }
      setUserInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "bot", text: "Error communicating with the bot." },
      ]);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setUserInput("");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    window.location.href = "/";
  };

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen); // Toggle menu open/close
  };

  return (
    <div className="flex flex-col items-center  bg-gray-100 ">
      {/* Top Navigation Bar */}
      <div className="w-full flex justify-between items-center p-4 bg-blue-600 text-white shadow-md">
        {/* Menu Icon */}
        <button onClick={handleMenuToggle}>
          {menuOpen ? (
            // X icon when menu is open
            <ImCross size={28} className="font-light" />
          ) : (
            // Menu icon when menu is closed
            <FiMenu size={28} />
          )}
        </button>

        {/* Title */}
        <h2 className="text-2xl font-semibold">Chat with the Bot</h2>

        {/* Logout Icon */}
        <button onClick={handleLogout}>
          <MdLogout size={28} />
        </button>
      </div>

      {/* Sidebar Menu */}
      {menuOpen && (
        <div className="absolute left-0 mt-[65px] top-0 h-full w-64 bg-white shadow-md p-4 z-10">
          <ul>
            <li className="py-2 hover:bg-gray-200 cursor-pointer">Profile</li>
            <li className="py-2 hover:bg-gray-200 cursor-pointer">Settings</li>
            <li className="py-2 hover:bg-gray-200 cursor-pointer">Help</li>
            <li
              className="py-2 hover:bg-gray-200 cursor-pointer"
              onClick={handleLogout}
            >
              Logout
            </li>
          </ul>
        </div>
      )}

      {/* Chat Box & Analysis Chart */}
      <div className="flex gap-10 justify-center p-4 w-full">
        <div className="flex justify-center gap-[100px] ">
          <div className="flex flex-col h-[650px] w-[900px]">
            <div className="bg-white p-6 rounded shadow-md w-[900px] overflow-y-auto  h-3/4 mb-4">
              <div className="messages   mb-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex mb-2 ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.sender === "bot" && (
                      <img
                        src={botImage}
                        alt="Bot"
                        className="w-10 h-10 rounded-full mr-2"
                      />
                    )}
                    <p
                      className={`inline-block rounded-lg px-3 py-2 text-sm ${
                        msg.sender === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-black"
                      }`}
                    >
                      {msg.text}
                    </p>
                    {msg.sender === "user" && (
                      <img
                        src={userImage}
                        alt="User"
                        className="w-10 h-10 rounded-full ml-2"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Input Field */}
            </div>
          </div>

          <AnalysisChart />
        </div>
      </div>
      <div className="flex mt-[-160px]  sticky z-50 t-0 w-full">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message..."
          className="border rounded-l py-2 px-3 w-full"
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-500 text-white rounded-r py-2 px-4"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
