import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./component/user/login";
import SignUp from "./component/user/sigUnp";
import Dashboard from "./component/dashboard/dashboard";
import AuthGuard from "./layout";
import NotFound from "./notFound";
import axios from "axios";
import FirstPage from "./component/user/firstPage";
import './App.css';

function App() {
  axios.defaults.withCredentials = true;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
            <AuthGuard>
              <FirstPage />
            </AuthGuard>
          } />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />
        <Route
          path="/signup"
          element={
            <AuthGuard>
              <SignUp />
            </AuthGuard>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
