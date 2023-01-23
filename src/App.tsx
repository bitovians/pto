import React from "react";

import Dashboard from "./components/Dashboard";
import StateManagement from "./context/StateManagement";
import "./styles.css";

const App = () => {
  return (
    <StateManagement>
      <Dashboard />
    </StateManagement>
  );
};

export default App;
