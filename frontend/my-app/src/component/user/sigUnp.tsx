import React, { useState } from 'react';
import {
    MDBContainer,
    MDBRow,
    MDBCol,
    MDBCard,
    MDBCardBody,
    MDBInput,
    MDBRadio,
    MDBFile
} from 'mdb-react-ui-kit';
import axios from "axios";
function SignUp() {
    const [toggle, setToggle] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [selectedRole, setSelectedRole] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];

        if (!selectedFile) {
            setError('No file selected.');
            setFile(null);
            return;
        }

        if (selectedFile.size > 2 * 1024 * 1024) {
            setError('File is too large. Maximum size is 2MB.');
            setFile(null);
            return;
        }

        const allowedTypes = ['text/csv', 'application/vnd.ms-excel'];
        const isCSV = allowedTypes.includes(selectedFile.type) ||
            selectedFile.name.toLowerCase().endsWith('.csv');

        if (!isCSV) {
            setError('Invalid file type. Only CSV files are allowed.');
            setFile(null);
            return;
        }

        setError('');
        setFile(selectedFile);
    }

    const validateSingleUser = () => {
        if (!firstName || !lastName || !email) {
            alert('Please complete all fields');
            return false;
        }
        return true;
    }

    const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!toggle) {
        if (!validateSingleUser()) return;

        try {
            // First get CSRF token
            await axios.get('http://localhost:8000/api/CheckAuthentification/', {
                withCredentials: true
            });

            // Then make the POST request
            const response = await axios.post(
                'http://localhost:8000/api/RegisterwithoutFile/',
                {
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                    Privilege: selectedRole,
                },
                {
                    withCredentials: true,
                    headers: {
                        'X-CSRFToken': getCsrfToken(),
                        'Content-Type': 'application/json',
                    }
                }
            );
            console.log("Registration success:", response.data);
        } catch (error: unknown) {
            let errorMessage: string;
            
            if (axios.isAxiosError(error)) {
                // Handle Axios errors
                errorMessage = typeof error.response?.data === 'string' 
                    ? error.response.data
                    : error.response?.data?.error || error.message;
            } else if (error instanceof Error) {
                // Handle native JavaScript errors
                errorMessage = error.message;
            } else {
                // Handle cases where the error isn't an Error object
                errorMessage = "An unknown error occurred";
            }
            
            console.error("Login error:", errorMessage);
            setError(errorMessage);
        }
    }
};

// Helper function to get CSRF token (should be outside handleSubmit)
function getCsrfToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    return cookieValue || '';
}

    const handleRegistrationTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setToggle(e.target.value === "more_than_one");
    };

    return (
        <MDBContainer fluid className="vh-100 d-flex align-items-center">
            <MDBRow className='justify-content-center w-100'>
                <MDBCol md="8" lg="6" xl="5">
                    <MDBCard className="mb-4" style={{ minHeight: 'auto' }}>
                        <MDBCardBody className='p-4'>
                            <h2 className='text-center mb-4'>Register</h2>

                            {/* Registration Type Selection */}
                            <MDBRow className='mb-4'>
                                <MDBCol>
                                    <h6 className="fw-bold">Registration Type: </h6>
                                    <div className="d-flex flex-wrap gap-3">
                                        <MDBRadio
                                            name='registrationType'
                                            id='singleUser'
                                            value='single_user'
                                            label='Register one person'
                                            checked={!toggle}
                                            onChange={handleRegistrationTypeChange}
                                        />
                                        <MDBRadio
                                            name='registrationType'
                                            id='multipleUsers'
                                            value='more_than_one'
                                            label='Register multiple users'
                                            checked={toggle}
                                            onChange={handleRegistrationTypeChange}
                                        />
                                    </div>
                                </MDBCol>
                            </MDBRow>

                            {toggle ? (
                                /* CSV Upload for multiple users */
                                <MDBRow className='mb-4'>
                                    <MDBCol>
                                        <MDBFile
                                            label="User CSV File"
                                            id="userCsvFile"
                                            onChange={handleFileChange}
                                            required={toggle}
                                        />
                                        {error && <div className="text-danger small mt-2">{error}</div>}
                                    </MDBCol>
                                </MDBRow>
                            ) : (
                                /* Form fields for single user */
                                <>
                                    <MDBRow className='mb-3'>
                                        <MDBCol md='6' className='mb-3 mb-md-0'>
                                            <MDBInput
                                                id='firstName'
                                                type='text'
                                                value={firstName}
                                                placeholder='First name'
                                                onChange={(e) => setFirstName(e.target.value)}
                                                required={!toggle}
                                            />
                                        </MDBCol>
                                        <MDBCol md='6'>
                                            <MDBInput
                                                id='lastName'
                                                type='text'
                                                value={lastName}
                                                placeholder='Last name'
                                                onChange={(e) => setLastName(e.target.value)}
                                                required={!toggle}
                                            />
                                        </MDBCol>
                                    </MDBRow>
                                    <MDBRow className='mb-4'>
                                        <MDBCol>
                                            <MDBInput
                                                id='email'
                                                type='email'
                                                placeholder='Email'
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required={!toggle}
                                            />
                                        </MDBCol>
                                    </MDBRow>
                                </>
                            )}

                            {/* User Role Selection */}
                            <MDBRow className='mb-4'>
                                <MDBCol>
                                    <h6 className="fw-bold">User Role: </h6>
                                    <div className="d-flex flex-wrap gap-3">
                                        <MDBRadio
                                            name='userRole'
                                            id='roleLearner'
                                            value='Apprenant'
                                            label='Apprenant'
                                            checked={selectedRole === 'Apprenant'}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                        />
                                        <MDBRadio
                                            name='userRole'
                                            id='roleTrainer'
                                            value='Formateur'
                                            label='Formateur'
                                            checked={selectedRole === 'Formateur'}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                        />
                                        <MDBRadio
                                            name='userRole'
                                            id='roleAdmin'
                                            value='Admin'
                                            label='Admin'
                                            checked={selectedRole === 'Admin'}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                        />
                                    </div>
                                </MDBCol>
                            </MDBRow>

                            <div className="text-center">
                                <div className="text-center">
                                    <button type="submit" className="btn" style={{ backgroundColor: '#6235aaff', color: 'white' }} onClick={handleSubmit}>Register</button>
                                </div>
                            </div>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>
            </MDBRow>
        </MDBContainer>
    );
}

export default SignUp;