import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Typography,
  Grid,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, ArrowBack } from "@mui/icons-material";

const FinishedGoodsMaster = () => {
  const navigate = useNavigate();
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [formData, setFormData] = useState({
    fg_id: "",
    fg_name: "",
    uom: "",
  });
  const [editIndex, setEditIndex] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = (index) => {
    setFormData(finishedGoods[index]);
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    setFinishedGoods(finishedGoods.filter((_, i) => i !== index));
    if (editIndex === index) setEditIndex(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newFG = {
      ...formData,
      fg_id: formData.fg_id || `FG-${Date.now()}`,
    };
    if (editIndex !== null) {
      const updatedFGs = [...finishedGoods];
      updatedFGs[editIndex] = newFG;
      setFinishedGoods(updatedFGs);
      setEditIndex(null);
    } else {
      setFinishedGoods([...finishedGoods, newFG]);
    }
    setFormData({
      fg_id: '',
      fg_name: '',
      uom: '',
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Tooltip title="Back to Flow Management">
          <IconButton
            onClick={() => navigate('/flow-management')}
            sx={{
              color: '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.2)',
                transform: 'translateX(-3px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <ArrowBack />
          </IconButton>
        </Tooltip>
        <Typography variant="h5" sx={{ flex: 1 }}>
          Finished Goods Master
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="FG Name"
                name="fg_name"
                value={formData.fg_name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Unit of Measurement"
                name="uom"
                value={formData.uom}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary">
                Add Finished Good
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>FG ID</TableCell>
              <TableCell>FG Name</TableCell>
              <TableCell>Unit of Measurement</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {finishedGoods.map((fg, index) => (
              <TableRow key={index}>
                <TableCell>{fg.fg_id}</TableCell>
                <TableCell>{fg.fg_name}</TableCell>
                <TableCell>{fg.uom}</TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleEdit(index)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDelete(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const FGInventory = () => {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    fgName: "",
    quantity: "",
    type: "in",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fgName || !form.quantity) return;
    setEntries([
      ...entries,
      {
        ...form,
        quantity: Number(form.quantity),
        date: new Date().toLocaleString(),
      },
    ]);
    setForm({ fgName: "", quantity: "", type: "in" });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        FG Inventory Log
      </Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Finished Good Name"
                name="fgName"
                value={form.fgName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Quantity"
                name="quantity"
                type="number"
                value={form.quantity}
                onChange={handleChange}
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={form.type}
                  label="Type"
                  onChange={handleChange}
                >
                  <MenuItem value="in">In</MenuItem>
                  <MenuItem value="out">Out</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button type="submit" variant="contained" color="primary" fullWidth>
                Log Entry
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Finished Good</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Type</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry, idx) => (
              <TableRow key={idx}>
                <TableCell>{entry.date}</TableCell>
                <TableCell>{entry.fgName}</TableCell>
                <TableCell>{entry.quantity}</TableCell>
                <TableCell>{entry.type === "in" ? "In" : "Out"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FinishedGoodsMaster;
