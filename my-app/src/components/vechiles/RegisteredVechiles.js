// src/components/RegisteredVehicles.js
import React, { useState } from 'react';
import { Grid2, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, Container } from '@mui/material';

const RegisteredVehicles = () => {
  const [vehicles, setVehicles] = useState([
    { number: 'AB123CD', owner: 'John Doe', model: 'Toyota Camry', year: 2020 },
    { number: 'EF456GH', owner: 'Jane Smith', model: 'Honda Accord', year: 2019 },
  ]);

  const [newVehicle, setNewVehicle] = useState({ number: '', owner: '', model: '', year: '' });
  const [showForm, setShowForm] = useState(false);

  const handleInputChange = (e) => setNewVehicle({ ...newVehicle, [e.target.name]: e.target.value });
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setVehicles([...vehicles, newVehicle]);
    setNewVehicle({ number: '', owner: '', model: '', year: '' });
    setShowForm(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Vehicle Number</TableCell>
            <TableCell>Owner</TableCell>
            <TableCell>Model</TableCell>
            <TableCell>Year</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vehicles.map((vehicle, index) => (
            <TableRow key={index}>
              <TableCell>{vehicle.number}</TableCell>
              <TableCell>{vehicle.owner}</TableCell>
              <TableCell>{vehicle.model}</TableCell>
              <TableCell>{vehicle.year}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {showForm && (
        <form onSubmit={handleFormSubmit}>
          <Grid2 container spacing={2} sx={{ my: 2 }}>
            <Grid2 size={{xs:12,sm:6}}>
              <TextField label="Vehicle Number" name="number" value={newVehicle.number} onChange={handleInputChange} required fullWidth />
            </Grid2>
            <Grid2 size={{xs:12,sm:6}} >
              <TextField label="Owner" name="owner" value={newVehicle.owner} onChange={handleInputChange} required fullWidth />
            </Grid2>
            <Grid2 size={{xs:12,sm:6}} >
              <TextField label="Model" name="model" value={newVehicle.model} onChange={handleInputChange} required fullWidth />
            </Grid2>
            <Grid2 size={{xs:12,sm:6}} >
              <TextField label="Year" name="year" value={newVehicle.year} onChange={handleInputChange} required type="number" fullWidth />
            </Grid2>
          </Grid2>
          <Button type="submit" variant="contained" color="primary">Add Vehicle</Button>
        </form>
      )}

      <Button variant="contained" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Register New Vehicle'}
      </Button>
    </Container>
  );
};

export default RegisteredVehicles;
