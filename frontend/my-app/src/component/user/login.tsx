import React from "react";
import { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import Form from 'react-bootstrap/Form';
import { MDBContainer, MDBRow, MDBCol } from 'mdb-react-ui-kit';


const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    useEffect(() => {
        
    }, [password, email]);
    const handulEmail = (event: any) => {
        const value = event.target.value;
        setEmail(value);
        
    }
    const handulPassword = (event: any) => {
        const value = event.target.value;
        setPassword(value);
    }
    const handulSubmit = () => {
        console.log('Password updated:', password);
        console.log('email updated:', email);

    }
    return (
        <MDBContainer fluid className='my-5'>
            <MDBContainer fluid className='my-5 d-flex flex-column align-items-start'>
                <MDBRow className="align-items-center">
                    <MDBCol md='6'>
                        <MDBContainer className='shadow p-5 rounded bg-white'>
                            <img src="studying.jpg" alt="Studying girl" />
                        </MDBContainer>
                    </MDBCol>
                    <MDBCol md='6' className='mx-auto'>
                        <MDBContainer className='shadow p-5 rounded bg-white'>

                            <h4 className='mb-4'>Login</h4>
                            <form onSubmit={handulSubmit}>
                                <input className='form-control form-control-lg mb-4' placeholder="Email" type="email" value={email} onChange={handulEmail} />
                                <Form.Group className="mb-3" controlId="formBasicPassword">
                                    <Form.Control type="password" placeholder="Password" value={password} onChange={handulPassword} />
                                    <Form.Text muted>
                                        Your password must be at least 8 characters long.
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