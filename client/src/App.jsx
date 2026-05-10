import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import AiChatWidget from "./components/AiChatWidget";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MyCourses from "./pages/MyCourses";
import CourseLearning from "./pages/CourseLearning";
import LessonPage from "./pages/LessonPage";
import Profile from "./pages/Profile";
import Progress from "./pages/Progress";
import AdminCourses from "./pages/AdminCourses";
import AdminCourseForm from "./pages/AdminCourseForm";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/my-courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
        <Route path="/learn/:id" element={<ProtectedRoute><CourseLearning /></ProtectedRoute>} />
        <Route path="/lessons/:id" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin/courses" element={<RoleRoute><AdminCourses /></RoleRoute>} />
        <Route path="/admin/courses/:id" element={<RoleRoute><AdminCourseForm /></RoleRoute>} />
      </Routes>
      <Footer />
      <AiChatWidget />
    </BrowserRouter>
  );
}
