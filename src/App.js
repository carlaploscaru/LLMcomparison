import React from "react";
import Login from "./Components/auth/Login";
import Register from "./Components/auth/Register";
import ChangePassword from "./Components/auth/ChangePass";


import Home from "./Pages/home1";
import Docs from "./Pages/docs";

import { AuthProvider } from "./contexts";
import { useRoutes } from "react-router-dom";

function App() {
  const routesArray = [
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/home",
      element: <Home />,
    },
    {
      path: "/docs",
      element: <Docs />,
    },
    {
      path: "/passreset",
      element: <ChangePassword />,
    },
    {
      path: "*",
      element: <Login />,
    },
  ];
  let routesElement = useRoutes(routesArray);
  return (
    <AuthProvider>
      <div>{routesElement}</div>
    </AuthProvider>
  );
}

export default App;


