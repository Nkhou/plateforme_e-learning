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
    const readCSVFile = (file: File): Promise<Record<string, string>[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                if (!event.target?.result) {
                    reject("File reading failed");
                    return;
                }

                const csvData = event.target.result as string;
                const lines = csvData.trim().split('\n');
                const headers = lines[0].split(',');

                const jsonData: Record<string, string>[] = [];

                for (let i = 1; i < lines.length; i++) {
                    const currentLine = lines[i].split(',');
                    if (currentLine.length !== headers.length) continue;

                    const obj: Record<string, string> = {};
                    for (let j = 0; j < headers.length; j++) {
                        obj[headers[j].trim()] = currentLine[j].trim();
                    }

                    jsonData.push(obj);
                }

                resolve(jsonData);
            };

            reader.onerror = () => reject("File reading error");
            reader.readAsText(file);
        });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!toggle) {
            if (!validateSingleUser()) return;

            try {
                await axios.get('http://localhost:8000/api/CheckAuthentification/', {
                    withCredentials: true
                });

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
                    errorMessage = typeof error.response?.data === 'string'
                        ? error.response.data
                        : error.response?.data?.error || error.message;
                } else if (error instanceof Error) {
                    errorMessage = error.message;
                } else {
                    errorMessage = "An unknown error occurred";
                }

                console.error("Login error:", errorMessage);
                setError(errorMessage);
            }
        }
        else {
            if (!file) {
                setError("No file selected.");
                return;
            }

            try {
                await axios.get('http://localhost:8000/api/CheckAuthentification/', {
                    withCredentials: true
                });

                const jsonData = await readCSVFile(file);
                console.log('hello', jsonData);
                const response = await axios.post(
                    'http://localhost:8000/api/CSVUpload/',
                    { csv_file: jsonData },
                    {
                        withCredentials: true,
                        headers: {
                            'X-CSRFToken': getCsrfToken(),
                            'Content-Type': 'application/json',
                        }
                    }
                );

                console.log("CSV upload success:", response.data);
            } catch (error: unknown) {
                let errorMessage = "An unknown error occurred";
                if (axios.isAxiosError(error)) {
                    errorMessage = typeof error.response?.data === 'string'
                        ? error.response.data
                        : error.response?.data?.error || error.message;
                } else if (error instanceof Error) {
                    errorMessage = error.message;
                }

                console.error("CSV upload error:", errorMessage);
                setError(errorMessage);
            }
        }
    };
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
                            <MDBRow className='mb-4'>
                                <MDBCol>
                                    <h6 className="fw-bold">User Role: </h6>
                                    <div className="d-flex flex-wrap gap-3">
                                        <MDBRadio
                                            name='userRole'
                                            id='roleLearner'
                                            value='AP'
                                            label='Apprenant'
                                            checked={selectedRole === 'Apprenant'}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                        />
                                        <MDBRadio
                                            name='userRole'
                                            id='roleTrainer'
                                            value='F'
                                            label='Formateur'
                                            checked={selectedRole === 'Formateur'}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                        />
                                        <MDBRadio
                                            name='userRole'
                                            id='roleAdmin'
                                            value='A'
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

