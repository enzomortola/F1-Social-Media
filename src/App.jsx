// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';
import LoadingPage from './components/LoadingPage';

const Home       = lazy(() => import('./pages/Home'));
const Races      = lazy(() => import('./pages/Races'));
const RaceDetail = lazy(() => import('./pages/RaceDetail'));
const Drivers    = lazy(() => import('./pages/Drivers'));
const DriverDetail = lazy(() => import('./pages/DriverDetail'));
const Seasons    = lazy(() => import('./pages/Seasons'));
const SeasonDetail = lazy(() => import('./pages/SeasonDetail'));
const Reviews    = lazy(() => import('./pages/Reviews'));
const Login        = lazy(() => import('./pages/Login'));
const Register     = lazy(() => import('./pages/Register'));
const Profile      = lazy(() => import('./pages/Profile'));
const Predictions  = lazy(() => import('./pages/Predictions'));
const About        = lazy(() => import('./pages/About'));
const NotFound     = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <>
      <Navbar />
      <ToastContainer />
      <Suspense fallback={<LoadingPage />}>
        <Routes>
          <Route path="/"                index element={<Home />} />
          <Route path="/races"           element={<Races />} />
          <Route path="/races/:year/:round" element={<RaceDetail />} />
          <Route path="/drivers"         element={<Drivers />} />
          <Route path="/drivers/:id"     element={<DriverDetail />} />
          <Route path="/seasons"         element={<Seasons />} />
          <Route path="/seasons/:year"   element={<SeasonDetail />} />
          <Route path="/reviews"         element={<Reviews />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/profile"         element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/predictions"     element={<Predictions />} />
          <Route path="/about"           element={<About />} />
          <Route path="*"                element={<NotFound />} />
        </Routes>
      </Suspense>
      <Footer />
    </>
  );
}
