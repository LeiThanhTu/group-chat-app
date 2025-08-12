import React, {useState} from "react";
import "./App.css";
import JoinCreateChat from "./components/JoinCreateChat";
import { ToastContainer } from "react-toastify";

function App() {
  const [count, setCount] = useState(0);
  return (

    <div>
      <ToastContainer />
      <JoinCreateChat />
    </div>
  );
}

export default App;