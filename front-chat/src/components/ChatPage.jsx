import React, { useEffect, useState, useRef } from "react";
import { MdAttachFile, MdSend } from "react-icons/md";
import useChatContext from "../context/ChatContext";
import { baseURL } from "../config/AxiosHelper";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { timeAgo } from "../config/helper";
import { getMessages } from "../services/RoomService";
import "react-toastify/dist/ReactToastify.css";

const ChatPage = () => {
  const {
    roomId,
    currentUser,
    connected,
    setConnected,
    setRoomId,
    setCurrentUser,
  } = useChatContext();

  const navigate = useNavigate();
  useEffect(() => {
    if (!connected) {
      navigate("/");
    }
  }, [connected, roomId, currentUser]);

  // const [messages, setMessages] = useState([
  //   {
  //     content: "Hello ?",
  //     sender: "thanhtu",
  //   },
  //   {
  //     content: "Hello ?",
  //     sender: "thanhtu",
  //   },
  //   {
  //     content: "Hello ?",
  //     sender: "ankit",
  //   },
  //   {
  //     content: "Hello ?",
  //     sender: "ankit",
  //   }

  // ]);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatBoxRef = useRef(null);
  const [stompClient, setStompClient] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState(null);
  const fileInputRef = useRef(null);

  // page init
  useEffect(() => {
    async function loadMessages() {
      try {
        const messages = await getMessages(roomId);
        // console.log(messages);
        setMessages(messages);
      } catch {
        ("");
      }
    }
    if (connected) {
      loadMessages();
    }
  }, []);

  //scroll down
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scroll({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    const connectWebSocket = () => {
      // SockJS

      const sock = new SockJS(`${baseURL}/chat`);

      const client = Stomp.over(sock);

      client.connect({}, () => {
        setStompClient(client);
        toast.success("connected");
        // subscribe to the room
        client.subscribe(`/topic/room/${roomId}`, (message) => {
          console.log(message);
          const newMessage = JSON.parse(message.body);
          setMessages((prev) => [...prev, newMessage]);
        });
      });
    };
    if (connected) {
      connectWebSocket();
    }

    // Cleanup function
    return () => {
      if (stompClient) {
        stompClient.disconnect();
      }
    };
  }, [roomId, connected]); // Thêm dependencies


  // Add this style for the hidden file input
  const hiddenFileInput = {
    display: "none",
  };

 const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    setFileName("Uploading...");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://localhost:8081/api/files/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("File upload failed");
    }

    const fileUrl = await response.text();
    setFileName(file.name);
    setFileUrl(fileUrl);
    toast.success(`File "${file.name}" ready to send`);
  } catch (error) {
    console.error("Error uploading file:", error);
    setFileName(null);
    setFileUrl(null);
    toast.error("Failed to upload file");
  }
};
  // Update your sendMessage function
const sendMessage = async () => {
  if (!stompClient || !connected) return;
  
  if (!input.trim() && !fileUrl) {
    toast.warning("Please enter a message or attach a file");
    return;
  }

  try {
    const message = {
      sender: currentUser,
      content: input || "",
      roomId: roomId,
      timeStamp: new Date().toISOString(),
      fileName: fileUrl ? fileName : null,
      fileUrl: fileUrl || null
    };

    console.log("Sending message:", message);

    stompClient.send(
      `/app/sendMessage/${roomId}`,
      {},
      JSON.stringify(message)
    );
    
    // Reset form
    setInput("");
    setFileUrl(null);
    setFileName(null);
  } catch (error) {
    console.error("Error sending message:", error);
    toast.error("Failed to send message");
  }
};
  

  // handle logout
  function handleLogout() {
    if (stompClient) {
      stompClient.disconnect(() => {
        toast.success("Logged out successfully"); // Toast here
      });
    } else {
      toast.success("Logged out successfully"); // fallback
    }
    setConnected(false);
    setRoomId("");
    setCurrentUser("");
    navigate("/");
  }

  return (
    <div className="">
      {/* this is a header */}
      <header className="dark:border-gray-700 fixed w-full dark:bg-gray-900 py-5 shadow flex justify-around items-center">
        {/* room name container */}
        <div>
          <h1 className="text-xl font-semibold">
            Room : <span>{roomId}</span>
          </h1>
        </div>
        {/*username container */}
        <div>
          <h1 className="text-xl font-semibold">
            User : <span>{currentUser}</span>
          </h1>
        </div>
        {/* button: leave room */}
        <div>
          <button
            onClick={handleLogout}
            className="dark:bg-red-500 dark:hover:bg-red-700 px-3 py-2 rounded-full"
          >
            Leave Room
          </button>
        </div>
      </header>

      <main
        ref={chatBoxRef}
        className="py-20 px-10 w-2/3 dark:bg-slate-600 mx-auto h-screen overflow-auto"
      >
        {/* {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === currentUser ? "justify-end" : "justify-start"
            } `}
          >
            <div
              className={`my-2 ${
                message.sender === currentUser ? "bg-green-800" : "bg-gray-800"
              } p-2 max-w-xs rounded`}
            >
              <div className="flex flex-row gap-2">
                <img
                  className="h-10 w-10"
                  src={"https://avatar.iran.liara.run/public/43"}
                ></img>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold">{message.sender}</p>
                  <p>{message.content}</p>
                  <p className="text-xs text-gray-400">
                    {timeAgo(message.timeStamp)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))} */}
       {messages.map((message, index) => (
  <div
    key={index}
    className={`flex ${
      message.sender === currentUser ? "justify-end" : "justify-start"
    }`}
  >
    <div
      className={`my-2 ${
        message.sender === currentUser ? "bg-green-800" : "bg-gray-800"
      } p-2 max-w-xs rounded`}
    >
      <div className="flex flex-row gap-2">
        <img
          className="h-10 w-10"
          src={"https://avatar.iran.liara.run/public/43"}
          alt="User Avatar"
        />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold">{message.sender}</p>
          {message.content && <p>{message.content}</p>}
          
          {message.fileUrl && (
            <div className="mt-1">
              <a 
                href={`http://localhost:8081${message.fileUrl}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-blue-400 hover:underline"
              >
                <MdAttachFile className="mr-1" />
                <span className="truncate max-w-[200px]">
                  {message.fileName || 'Download File'}
                </span>
              </a>
            </div>
          )}
          
          <p className="text-xs text-gray-400">
            {timeAgo(message.timeStamp)}
          </p>
        </div>
      </div>
    </div>
  </div>
))}
      </main>

    {/* Input message container */}
<div className="fixed bottom-4 w-full h-16">
  <div className="h-full pr-10 gap-4 flex items-center justify-between rounded-full w-1/2 mx-auto dark:bg-gray-900">
    <div className="relative w-full">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            sendMessage();
          }
        }}
        placeholder={fileName ? `File: ${fileName}` : "Type your message here..."}
        className="w-full dark:border-gray-600 b dark:bg-gray-800 px-5 py-2 rounded-full h-full focus:outline-none"
      />
      {/* Show file preview */}
      {fileUrl && (
        <div className="absolute -top-8 left-0 right-0 bg-gray-800 p-1 rounded-lg flex items-center">
          <span className="text-xs text-gray-300 truncate flex-1">
            {fileName}
          </span>
          <button 
            onClick={() => {
              setFileUrl(null);
              setFileName(null);
            }}
            className="text-red-400 hover:text-red-300 ml-2"
          >
            ✕
          </button>
        </div>
      )}
    </div>

    <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileChange}
      style={hiddenFileInput}
    />
    <button
      type="button"
      onClick={() => fileInputRef.current.click()}
      className={`h-10 w-10 flex justify-center items-center rounded-full ${
        fileUrl ? "bg-blue-600" : "dark:bg-purple-600"
      }`}
      title={fileUrl ? "Change file" : "Attach file"}
    >
      <MdAttachFile size={20} />
    </button>

    <button
      onClick={sendMessage}
      className="dark:bg-green-600 h-10 w-10 flex justify-center items-center rounded-full"
      disabled={!input.trim() && !fileUrl}
    >
      <MdSend size={20} />
    </button>
  </div>
</div>
    </div>
  );
};

export default ChatPage;
