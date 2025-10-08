import React from "react";
import Login from "./Components/auth/Login";
import Register from "./Components/auth/Register";
import ChangePassword from "./Components/auth/ChangePass";


import Home from "./Pages/home1";

import { AuthProvider } from "./contexts";
import { useRoutes } from "react-router-dom";

function App() {
  const routesArray = [
    {
      path: "*",
      element: <Login />,
    },
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
      path: "/passreset",
      element: <ChangePassword />,
    }
  ];
  let routesElement = useRoutes(routesArray);
  return (
    <AuthProvider>
      <div>{routesElement}</div>
    </AuthProvider>
  );
}

export default App;


