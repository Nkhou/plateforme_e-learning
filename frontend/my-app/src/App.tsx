import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Login from "./component/user/login";
import SignUp from "./component/user/sigUnp";
import Dashboard from "./component/dashboard/dashboard";
import AuthGuard from "./layout";
// import User from "./layout"; // Removed unused import
import NotFound from "./notFound";
import axios from "axios";
import '@coreui/coreui/dist/css/coreui.min.css'
import FirstPage from "./component/user/firstPage";
import './App.css';
import Cours from "./pages/courses";
import AdminDashboard from "./pages/AdminDashboard";
import CourseDetailShow from "./component/courses/apprent/CourseDetailShow";
import CourseDetail from "./component/courses/formateur/CourseDetail";
// import { Import } from "lucide-react";
import CoursesManagement from "./component/admin/courses";
import UsersManagement from "./component/admin/users"
function App() {
  axios.defaults.withCredentials = true;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthGuard><FirstPage /></AuthGuard>} />
        <Route path="/cours" element={
          <AuthGuard>
            <Cours />
          </AuthGuard>
        } />
        <Route path="/admin" element={
          <AuthGuard>
            <AdminDashboard />
          </AuthGuard>
        } />
        <Route path="/formations" element={
          <AuthGuard>
            <CoursesManagement />
          </AuthGuard>
        }
        />
        <Route
          path="/Formation"
          element={
            <AuthGuard>
              <></>
              <Dashboard />
            </AuthGuard>
          }
        />
        <Route
          path="/utilisateurs"
          element={
            <AuthGuard>
              <UsersManagement />
            </AuthGuard>
          }
        />
        <Route
          path="/formations/:id"
          element={
            <AuthGuard>
              <CourseDetail />
            </AuthGuard>
          }
        />
        <Route
          path="/cours/:id"
          element={
            <AuthGuard>
              <CourseDetailShow />
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
