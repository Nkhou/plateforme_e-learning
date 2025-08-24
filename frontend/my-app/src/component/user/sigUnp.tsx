import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
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

    return (
        <Container fluid className="vh-100 d-flex align-items-center">
            <Row className="justify-content-center w-100">
                <Col md={8} lg={6} xl={5}>
                    <Card className="mb-4">
                        <Card.Body className="p-4">
                            <h2 className="text-center mb-4">Register</h2>
                            
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">Registration Type:</Form.Label>
                                    <div className="d-flex gap-3">
                                        <Form.Check
                                            type="radio"
                                            name="registrationType"
                                            id="singleUser"
                                            value="single_user"
                                            label="Register one person"
                                            checked={!toggle}
                                            onChange={(e) => setToggle(e.target.value === "more_than_one")}
                                        />
                                        <Form.Check
                                            type="radio"
                                            name="registrationType"
                                            id="multipleUsers"
                                            value="more_than_one"
                                            label="Register multiple users"
                                            checked={toggle}
                                            onChange={(e) => setToggle(e.target.value === "more_than_one")}
                                        />
                                    </div>
                                </Form.Group>

                                {toggle ? (
                                    <Form.Group className="mb-4">
                                        <Form.Label>User CSV File</Form.Label>
                                        <Form.Control
                                            type="file"
                                            onChange={handleFileChange}
                                            accept=".csv"
                                            required={toggle}
                                        />
                                        {error && <Alert variant="danger" className="mt-2 small">{error}</Alert>}
                                    </Form.Group>
                                ) : (
                                    <>
                                        <Row className="mb-3">
                                            <Col md={6} className="mb-3 mb-md-0">
                                                <Form.Control
                                                    type="text"
                                                    placeholder="First name"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    required={!toggle}
                                                />
                                            </Col>
                                            <Col md={6}>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Last name"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    required={!toggle}
                                                />
                                            </Col>
                                        </Row>
                                        <Form.Group className="mb-4">
                                            <Form.Control
                                                type="email"
                                                placeholder="Email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required={!toggle}
                                            />
                                        </Form.Group>
                                    </>
                                )}

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">User Role:</Form.Label>
                                    <div className="d-flex gap-3">
                                        <Form.Check
                                            type="radio"
                                            name="userRole"
                                            id="roleLearner"
                                            value="AP"
                                            label="Apprenant"
                                            checked={selectedRole === 'AP'}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                        />
                                        <Form.Check
                                            type="radio"
                                            name="userRole"
                                            id="roleTrainer"
                                            value="F"
                                            label="Formateur"
                                            checked={selectedRole === 'F'}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                        />
                                        <Form.Check
                                            type="radio"
                                            name="userRole"
                                            id="roleAdmin"
                                            value="A"
                                            label="Admin"
                                            checked={selectedRole === 'A'}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                        />
                                    </div>
                                </Form.Group>

                                <div className="text-center">
                                    <Button 
                                        type="submit"
                                        style={{ backgroundColor: '#6235aaff', borderColor: '#6235aaff' }}
                                        size="lg"
                                    >
                                        Register
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default SignUp;