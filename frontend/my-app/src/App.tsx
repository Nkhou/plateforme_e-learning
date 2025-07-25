import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./component/user/login";
import Dashboard from "./component/dashboard/dashboard";
import AuthGuard from "./layout";
import axios from "axios";

function App() {
  axios.defaults.withCredentials = true;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
