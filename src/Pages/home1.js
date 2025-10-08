import React from 'react'
import { useAuth } from '../contexts'
import Header from "../Components/other/header";

const Home = () => {
    const { currentUser } = useAuth();
  
    if (!currentUser) {
      return <div className="text-2xl font-bold pt-14">Loading...</div>;
    }
//fixes the logout error triggerd by: trying to access currentUser.displayName when currentUser is null  
    return (
      <div className="text-2xl font-bold pt-14">
        <Header />
        Hello {currentUser.displayName || currentUser.email}, you are now logged in.
      </div>
    );
  };

export default Home;