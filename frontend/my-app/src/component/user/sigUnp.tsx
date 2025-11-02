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
    const [selectedDepartment, setSelectedDepartment] = useState('F'); // Default department

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
                        privilege: selectedRole,
                        department: selectedDepartment,
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
                alert('User registered successfully!');
                // Reset form
                setFirstName('');
                setLastName('');
                setEmail('');
                setSelectedRole('');
                setSelectedDepartment('F');
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
                alert(`Registration failed: ${errorMessage}`);
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

                // Add department to each user in CSV data if not present
                const processedData = jsonData.map(user => ({
                    ...user,
                    department: user.department || 'F',
                    privilege: user.privilege || user.Privilege || 'AP',
                }));

                const response = await axios.post(
                    'http://localhost:8000/api/CSVUpload/',
                    { csv_file: processedData },
                    {
                        withCredentials: true,
                        headers: {
                            'X-CSRFToken': getCsrfToken(),
                            'Content-Type': 'application/json',
                        }
                    }
                );

                console.log("CSV upload success:", response.data);
                alert('Users registered successfully from CSV!');
                setFile(null);
                // Reset file input
                const fileInput = document.getElementById('csvFile') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
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
                alert(`CSV upload failed: ${errorMessage}`);
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
        backgroundColor: '#e8edf2',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '800px'
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

    const rowStyle: React.CSSProperties = {
        display: 'flex',
        gap: '1rem',
        marginBottom: '1rem'
    };

    const colStyle: React.CSSProperties = {
        flex: 1
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
        marginBottom: '2rem',
        fontSize: '16px',
        color: '#666',
        fontWeight: 'normal'
    };

    const sectionStyle: React.CSSProperties = {
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '1.5rem'
    };

    const sectionTitleStyle: React.CSSProperties = {
        fontSize: '14px',
        color: '#666',
        marginBottom: '1rem',
        fontWeight: '500'
    };

    const buttonGroupStyle: React.CSSProperties = {
        display: 'flex',
        gap: '0.5rem',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #ddd'
    };

    const optionButtonStyle = (isSelected: boolean): React.CSSProperties => ({
        flex: 1,
        padding: '12px 20px',
        border: 'none',
        backgroundColor: isSelected ? 'white' : '#f5f5f5',
        color: '#333',
        fontSize: '14px',
        cursor: 'pointer',
        position: 'relative',
        fontWeight: isSelected ? '500' : 'normal',
        transition: 'all 0.2s ease'
    });

    const checkmarkStyle: React.CSSProperties = {
        marginRight: '8px',
        fontSize: '16px'
    };

    const actionButtonStyle = (isPrimary: boolean): React.CSSProperties => ({
        padding: '12px 30px',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        cursor: 'pointer',
        fontWeight: '500',
        backgroundColor: isPrimary ? '#2d3e82' : '#6b7280',
        color: 'white',
        transition: 'all 0.2s ease'
    });

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h2 style={titleStyle}>Editer info utilisateur • nouveau</h2>

                <form onSubmit={handleSubmit}>
                    {/* Section 1: Configuration */}
                    <div style={sectionStyle}>
                        <h3 style={sectionTitleStyle}>1. Configuration</h3>
                        
                        <div style={formGroupStyle}>
                            <label style={labelStyle}>Nombre d'utilisateurs</label>
                            <div style={buttonGroupStyle}>
                                <button
                                    type="button"
                                    style={optionButtonStyle(!toggle)}
                                    onClick={() => setToggle(false)}
                                >
                                    {!toggle && <span style={checkmarkStyle}>✓</span>}
                                    Ajouter un utilisateur
                                </button>
                                <button
                                    type="button"
                                    style={optionButtonStyle(toggle)}
                                    onClick={() => setToggle(true)}
                                >
                                    {toggle && <span style={checkmarkStyle}>✓</span>}
                                    Ajouter des utilisateurs multiples
                                </button>
                            </div>
                        </div>

                        <div style={formGroupStyle}>
                            <label style={labelStyle}>Rôle de(s) utilisateur(s)</label>
                            <div style={buttonGroupStyle}>
                                <button
                                    type="button"
                                    style={optionButtonStyle(selectedRole === 'AP')}
                                    onClick={() => setSelectedRole('AP')}
                                >
                                    {selectedRole === 'AP' && <span style={checkmarkStyle}>✓</span>}
                                    Apprenant
                                </button>
                                <button
                                    type="button"
                                    style={optionButtonStyle(selectedRole === 'F')}
                                    onClick={() => setSelectedRole('F')}
                                >
                                    {selectedRole === 'F' && <span style={checkmarkStyle}>✓</span>}
                                    Formateur
                                </button>
                                <button
                                    type="button"
                                    style={optionButtonStyle(selectedRole === 'A')}
                                    onClick={() => setSelectedRole('A')}
                                >
                                    {selectedRole === 'A' && <span style={checkmarkStyle}>✓</span>}
                                    Admin
                                </button>
                            </div>
                        </div>

                        <div style={formGroupStyle}>
                            <label style={labelStyle} htmlFor="department">Department</label>
                            <select
                                id="department"
                                style={inputStyle}
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                required
                            >
                                <option value="F">FINANCE</option>
                                <option value="H">HUMAN RESOURCES</option>
                                <option value="M">MARKETING</option>
                                <option value="O">OPERATIONS/PRODUCTION</option>
                                <option value="S">SALES</option>
                            </select>
                        </div>
                    </div>

                    {/* Section 2: Load Data */}
                    <div style={sectionStyle}>
                        <h3 style={sectionTitleStyle}>2. Charger les données</h3>
                        
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
                                <div style={{ fontSize: '12px', marginTop: '0.5rem', color: '#666' }}>
                                    CSV should include columns: firstName, lastName, email, privilege, department
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={rowStyle}>
                                    <div style={colStyle}>
                                        <label style={labelStyle}>Nom</label>
                                        <input
                                            type="text"
                                            placeholder="Nom"
                                            style={inputStyle}
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            required={!toggle}
                                        />
                                    </div>
                                    <div style={colStyle}>
                                        <label style={labelStyle}>Prénom</label>
                                        <input
                                            type="text"
                                            placeholder="Prénom"
                                            style={inputStyle}
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            required={!toggle}
                                        />
                                    </div>
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Email</label>
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
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                            type="button"
                            style={actionButtonStyle(false)}
                            onClick={() => {
                                setFirstName('');
                                setLastName('');
                                setEmail('');
                                setFile(null);
                                setError('');
                            }}
                        >
                            Fermer
                        </button>
                        <button
                            type="submit"
                            style={actionButtonStyle(true)}
                        >
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SignUp;