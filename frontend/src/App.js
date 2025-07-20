// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import AddUserScreen from './screens/AddUserScreen';
import VerifyEmailScreen from './screens/VerifyEmailScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import StudentDashboard from './screens/StudentDashboard';
import AvatarCreator from './screens/AvatarCreator';
import LecturerJoinRoom from './screens/LecturerJoinRoom';
import LecturerDashboard from './screens/LecturerDashboard';
import StudJoinRoom from './screens/StudJoinRoom';
import SuperviseRoom from './screens/SuperviseRoom';
import MorePage from './components/MorePage';
import VirtualRoom from './screens/VirtualRoom';
import BubbleList from './screens/BubbleList';
import BubbleRoom from './screens/BubbleRoom'; 
import Folder from './components/Folder';  
import TestMonaco from './screens/TestMonaco';




function App() {
  return (
    <Routes>
      <Route path="/" element={<MorePage />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/dashboard" element={<AddUserScreen />} />
      <Route path="/verify-email/:token" element={<VerifyEmailScreen />} />
      <Route path="/reset-password" element={<ResetPasswordScreen />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/student-dashboard/avatar-create" element={<AvatarCreator />} />
      <Route path="/lecturer-dashboard" element={<LecturerDashboard />} />
      <Route path="/lecturer-dashboard/join-room" element={<LecturerJoinRoom />} />
      <Route path="/student-dashboard/join-room" element={<StudJoinRoom />} />
      <Route path="/supervise-room" element={<SuperviseRoom />} />
      <Route path="/more" element={<MorePage />} />
      <Route path="/virtual-room/:roomId" element={<VirtualRoom />} />
      <Route path="/virtual-room/:roomId/bubbles" element={<BubbleList />} />
      <Route path="/bubble-room/:roomId/:bubbleId" element={<BubbleRoom />} />
     <Route path="/test-monaco" element={<TestMonaco />} />

      <Route
  path="/stack/:stackId/folders"
  element={<Folder token={localStorage.getItem('gvle_token')} />}
/>

    </Routes>
  );
}

export default App;




