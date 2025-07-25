import { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import Form from 'react-bootstrap/Form';
import { MDBContainer, MDBRow, MDBCol } from 'mdb-react-ui-kit';
import { useNavigate } from 'react-router-dom';
import axios from "axios";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [responseStore, SetResponseStore] = useState('');
    const [error, setError] = useState('');
    let navigate = useNavigate();
    //useEffect(() => {
    //    axios.get('http://127.0.0.1:8000/api/CheckAuthentification/', { withCredentials: true })
    //        .then(res => {
    //            if (res.data.authenticated) {
    //                if (location.pathname !== '/dashboard') {
    //                    navigate('/dashboard');
    //                }
    //            } else {
    //                navigate('/login');
    //            }
    //        })
    //        .catch(() => {
    //            navigate('/login');
    //        });
    //}, [navigate]);

    const handulEmail = (event: any) => {
        const value = event.target.value;
        setEmail(value);
    }
    const handulPassword = (event: any) => {
        const value = event.target.value;
        setPassword(value);
    }
    const handulSubmit = (event: React.FormEvent) => {
        event.preventDefault();  // <-- Prevent the default form submission behavior
        console.log('Password updated:', password);
        console.log('email updated:', email);
        axios.post('http://localhost:8000/api/login/', {
            email: email,
            password: password
        }, { withCredentials: true })
            .then(function (response) {
                console.log("Login response:", response.data);
                navigate('/dashboard/');
            })
            .catch(function (error) {
                console.error("Login error:", error.response?.data || error.message);
                const errorMsg = typeof error.response?.data === 'string'
                    ? error.response.data
                    : error.response?.data?.error || error.message;
                setError(errorMsg)
            });
    }
    return (
        <MDBContainer fluid className='my-5'>
            <MDBContainer fluid className='my-5 d-flex flex-column align-items-start'>
                <MDBRow className="align-items-center">
                    <MDBCol md='6'>
                        <MDBContainer className='shadow p-5 rounded bg-white'>
                            <img src="studying.jpg" alt="students" />
                        </MDBContainer>
                    </MDBCol>
                    <MDBCol md='6' className='mx-auto'>
                        <MDBContainer className='shadow p-5 rounded bg-white'>

                            <h4 className='mb-4'>Login</h4>
                            <form onSubmit={handulSubmit}>
                                <input className='form-control form-control-lg mb-4' placeholder="Email" type="email" value={email} onChange={handulEmail} />
                                <Form.Group className="mb-3" controlId="formBasicPassword">
                                    <Form.Control type="password" placeholder="Password" value={password} onChange={handulPassword} />
                                    <Form.Text className="text-danger">
                                        {error}
                                    </Form.Text>
                                </Form.Group>
                                <div className="text-center">
                                    <button type="submit" className="btn" style={{ backgroundColor: '#6235aaff', color: 'white' }}>login</button>
                                </div>
                            </form>
                        </MDBContainer>
                    </MDBCol>
                </MDBRow>
            </MDBContainer>
        </MDBContainer>
    )
}

export default Login