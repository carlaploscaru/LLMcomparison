import React from 'react'
import { useAuth } from '../contexts'
import Header from "../Components/other/header";
import EmotionModel from "../Components/other/EmotionModel";

const Home = () => {
    const { currentUser } = useAuth();
  
    if (!currentUser) {
      return <div className="text-2xl font-bold pt-14">Loading...</div>;
    }
//fixes the logout error triggerd by: trying to access currentUser.displayName when currentUser is null hello
    return (
      <div className="pt-14">
        <Header />
        <p className="text-2xl font-bold px-6 mb-6">
          Hello {currentUser.displayName || currentUser.email}, you are now logged in.
        </p>
        <EmotionModel />
      </div>
    );
  };

export default Home;