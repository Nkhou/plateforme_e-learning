import React, { useState } from 'react';
import {
    MDBBtn,
    MDBContainer,
    MDBRow,
    MDBCol,
    MDBCard,
    MDBCardBody,
    MDBInput,
    MDBRadio,
    MDBFile
}
    from 'mdb-react-ui-kit';

function SignUp() {
    const [toggle, stToggle] = useState(true);
    const [file, setFile] = useState(null);
    const [error, setError] = useState('')
    const [firstName, setFirstName] = useState('');
    const [LastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [SelectedRole, setSelectedRole] = useState('');
    const handallfillchange = (e: any) => {
        const selectedFile = e.target.files[0];

        if (!selectedFile) {
            setError('No file selected.');
            setFile(null);
            return;
        } if (selectedFile.size > 2 * 1024 * 1024) {
            setError('File is too large. Maximum size is 2MB.');
            setFile(null);
            return;
        }

        const allowedTypes = ['text/csv', 'application/vnd.ms-excel'];
        const isCSV =
            selectedFile.type === allowedTypes ||
            selectedFile.name.toLowerCase().endsWith('.csv');

        if (!isCSV) {
            setError('Invalid file type. Only CSV files are allowed.');
            setFile(null);
            return;
        }

        setError('');
        setFile(selectedFile);

    }
    const handleSubmit = () => {
        if (!file) {
            alert('Please upload a valid CSV file first.');
            return;
        }
        console.log('CSV file ready:', file);
    };
    const handallFirstName = (e:any) =>{
        const value = e.target.value;
        setFirstName(value);
    }
    const handalllastName = (e:any) =>{
         const value = e.target.value;
        setLastName(value);
    }
    const handallEmail = (e:any) =>{
        const value = e.target.value;
        setEmail(value)
    }
    const handleRoleChange = (e:any) => {
    setSelectedRole(e.target.value);
    console.log('Selected Role:', e.target.value);
  };
    return (
        <MDBContainer fluid>

            <MDBRow className='justify-content-center align-items-center m-5'>

                <MDBCard>
                    <MDBCardBody className='px-4'>
                        <h2>Register</h2>
                        <MDBRow>

                            <MDBCol md='6'>
                                <MDBInput wrapperClass='mb-4' label='First Name' size='lg' id='form1' type='text' onChange={handallFirstName} />
                            </MDBCol>

                            <MDBCol md='6'>
                                <MDBInput wrapperClass='mb-4' label='Last Name' size='lg' id='form2' type='text' onChange={handalllastName} />
                            </MDBCol>

                        </MDBRow>

                        <MDBRow>

                            <MDBCol md='6'>
                                <MDBInput wrapperClass='mb-4' label='Email' size='lg' id='form4' type='email' onChange={handallEmail}/>
                            </MDBCol>
                        </MDBRow>
                        <MDBRow className="align-items-end mb-4">
                            <MDBCol md="6">
                                <MDBFile
                                    label="File of user"
                                    id="customFile"
                                    onChange={handallfillchange}
                                    className="form-control-sm"
                                />
                                {error && <p style={{ color: 'red', marginTop: '5px' }}>{error}</p>}
                            </MDBCol>

                        </MDBRow>
                        <MDBRow>
                            <MDBCol md='6' className='mb-4'>
                                <h6 className="fw-bold">Role: </h6>
                                <MDBRadio name='inlineRadio' id='inlineRadio1' value='Apprenant' label='Apprenant' inline onChange={ handleRoleChange} />
                                <MDBRadio name='inlineRadio' id='inlineRadio2' value='Formateur' label='Formateur' inline onChange={ handleRoleChange} />
                                <MDBRadio name='inlineRadio' id='inlineRadio3' value='Admin' label='Admin' inline onChange={ handleRoleChange} />
                            </MDBCol>

                        </MDBRow>

                        <MDBCol md="3">
                            <MDBBtn size="lg" onClick={handleSubmit}>
                                Submit
                            </MDBBtn>
                        </MDBCol>
                    </MDBCardBody>
                </MDBCard>

            </MDBRow>
        </MDBContainer>
    );
}

export default SignUp;