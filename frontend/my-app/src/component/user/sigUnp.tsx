import React, { useState } from 'react';
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
    };

    const validateSingleUser = () => {
        if (!firstName || !lastName || !email) {
            alert('Please complete all fields');
            return false;
        }
        return true;
    };

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

    const getCsrfToken = (): string => {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        return cookieValue || '';
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

                console.error("Registration error:", errorMessage);
                setError(errorMessage);
            }
        } else {
            if (!file) {
                setError("No file selected.");
                return;
            }

            try {
                await axios.get('http://localhost:8000/api/CheckAuthentification/', {
                    withCredentials: true
                });

                const jsonData = await readCSVFile(file);
                console.log('CSV data:', jsonData);
                
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

    const containerStyle: React.CSSProperties = {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: '#f5f5f5'
    };

    const cardStyle: React.CSSProperties = {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '600px'
    };

    const formGroupStyle: React.CSSProperties = {
        marginBottom: '1.5rem'
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: 'bold',
        fontSize: '14px',
        color: '#333'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px',
        boxSizing: 'border-box'
    };

    const radioContainerStyle: React.CSSProperties = {
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap'
    };

    const radioItemStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    };

    const rowStyle: React.CSSProperties = {
        display: 'flex',
        gap: '1rem',
        marginBottom: '1rem'
    };

    const colStyle: React.CSSProperties = {
        flex: 1
    };

    const buttonStyle: React.CSSProperties = {
        backgroundColor: '#052c65',
        color: 'white',
        padding: '12px 30px',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        cursor: 'pointer',
        width: '100%'
    };

    const errorStyle: React.CSSProperties = {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        padding: '0.5rem',
        borderRadius: '4px',
        marginTop: '0.5rem',
        fontSize: '14px'
    };

    const titleStyle: React.CSSProperties = {
        textAlign: 'center',
        marginBottom: '2rem',
        fontSize: '24px',
        color: '#333'
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h2 style={titleStyle}>Register</h2>
                
                <form onSubmit={handleSubmit}>
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Registration Type:</label>
                        <div style={radioContainerStyle}>
                            <div style={radioItemStyle}>
                                <input
                                    type="radio"
                                    name="registrationType"
                                    id="singleUser"
                                    value="single_user"
                                    checked={!toggle}
                                    onChange={(e) => setToggle(e.target.value === "more_than_one")}
                                />
                                <label htmlFor="singleUser">Register one user</label>
                            </div>
                            <div style={radioItemStyle}>
                                <input
                                    type="radio"
                                    name="registrationType"
                                    id="multipleUsers"
                                    value="more_than_one"
                                    checked={toggle}
                                    onChange={(e) => setToggle(e.target.value === "more_than_one")}
                                />
                                <label htmlFor="multipleUsers">Register multiple users</label>
                            </div>
                        </div>
                    </div>

                    {toggle ? (
                        <div style={formGroupStyle}>
                            <label style={labelStyle} htmlFor="csvFile">User CSV File</label>
                            <input
                                type="file"
                                id="csvFile"
                                style={inputStyle}
                                onChange={handleFileChange}
                                accept=".csv"
                                required={toggle}
                            />
                            {error && <div style={errorStyle}>{error}</div>}
                        </div>
                    ) : (
                        <>
                            <div style={rowStyle}>
                                <div style={colStyle}>
                                    <input
                                        type="text"
                                        placeholder="First name"
                                        style={inputStyle}
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required={!toggle}
                                    />
                                </div>
                                <div style={colStyle}>
                                    <input
                                        type="text"
                                        placeholder="Last name"
                                        style={inputStyle}
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required={!toggle}
                                    />
                                </div>
                            </div>
                            <div style={formGroupStyle}>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    style={inputStyle}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required={!toggle}
                                />
                            </div>
                        </>
                    )}

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>User Role:</label>
                        <div style={radioContainerStyle}>
                            <div style={radioItemStyle}>
                                <input
                                    type="radio"
                                    name="userRole"
                                    id="roleLearner"
                                    value="AP"
                                    checked={selectedRole === 'AP'}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                />
                                <label htmlFor="roleLearner">Apprenant</label>
                            </div>
                            <div style={radioItemStyle}>
                                <input
                                    type="radio"
                                    name="userRole"
                                    id="roleTrainer"
                                    value="F"
                                    checked={selectedRole === 'F'}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                />
                                <label htmlFor="roleTrainer">Formateur</label>
                            </div>
                            <div style={radioItemStyle}>
                                <input
                                    type="radio"
                                    name="userRole"
                                    id="roleAdmin"
                                    value="A"
                                    checked={selectedRole === 'A'}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                />
                                <label htmlFor="roleAdmin">Admin</label>
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <button 
                            type="submit"
                            style={buttonStyle}
                        >
                            Register
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SignUp;