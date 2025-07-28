import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface AuthGuardProps {
    children: ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        axios.get('http://localhost:8000/api/CheckAuthentification/', { withCredentials: true })
            .then(res => {
                console.log('res.data', res.data)
                console.log('wa la assahbi ana lihna');
                const isAuthenticated = res.data.authenticated;
                setLoading(false);


                if (!isAuthenticated && location.pathname !== '/') {
                    navigate('/');
                }

                if (isAuthenticated && location.pathname === '/') {
                    navigate('/dashboard');
                }
            })
            .catch(() => {
                console.log('ana hna');
                setLoading(false);
                if (location.pathname !== '/') {
                    navigate('/');
                }
            });
    }, [navigate, location]);

    if (loading) return <div>Loading...</div>;
    return <>{children}</>;
};

export default AuthGuard;
