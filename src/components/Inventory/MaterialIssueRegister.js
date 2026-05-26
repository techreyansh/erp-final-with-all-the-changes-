import React, { useState } from "react";
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
  Card,
  CardContent,
  CardActions,
  Stack,
  Container,
  Avatar,
  Badge,
  Fab,
  Zoom,
  LinearProgress,
  Divider,
  useTheme,
  useMediaQuery,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CallMade as IssueIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckIcon,
  TrendingDown as TrendingDownIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  Today as TodayIcon,
  AssignmentInd as AssignmentIndIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const MaterialIssueRegister = () => {
  // Theme and responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  // State management
  const [issueEntries, setIssueEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    issue_id: "",
    item_id: "",
    date: new Date(),
    person: "",
    issued_qty: 0,
    issue_slip_no: "",
  });
  const [editIndex, setEditIndex] = useState(null);

  // Helper functions for UI
  const getTotalIssued = () => {
    return issueEntries.reduce((total, entry) => total + parseFloat(entry.issued_qty || 0), 0);
  };

  const getUniquePersons = () => {
    const persons = new Set(issueEntries.map(entry => entry.person));
    return persons.size;
  };

  const getRecentEntries = () => {
    return issueEntries
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  };

  const getTodaysEntries = () => {
    const today = new Date().toDateString();
    return issueEntries.filter(entry => 
      new Date(entry.date).toDateString() === today
    ).length;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      date,
    }));
  };

  const handleEdit = (index) => {
    setFormData(issueEntries[index]);
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }
    setIssueEntries(issueEntries.filter((_, i) => i !== index));
    if (editIndex === index) setEditIndex(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    const newEntry = {
      ...formData,
      issue_id: formData.issue_id || `ISS-${Date.now()}`,
    };
    
    if (editIndex !== null) {
      const updatedEntries = [...issueEntries];
      updatedEntries[editIndex] = newEntry;
      setIssueEntries(updatedEntries);
      setEditIndex(null);
    } else {
      setIssueEntries([...issueEntries, newEntry]);
    }
    
    setFormData({
      issue_id: '',
      item_id: '',
      date: new Date(),
      person: '',
      issued_qty: 0,
      issue_slip_no: '',
    });
    
    setTimeout(() => setLoading(false), 500);
  };

  const filteredEntries = issueEntries.filter((entry) =>
    search === "" ||
    String(entry.item_id).toLowerCase().includes(search.toLowerCase()) ||
    String(entry.person).toLowerCase().includes(search.toLowerCase()) ||
    String(entry.issue_slip_no).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: theme.palette.error.main, width: 56, height: 56 }}>
          <IssueIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #d32f2f, #ff8a80)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Material Issue Register
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Outgoing Material Management System
          </Typography>
        </Box>
        {loading && (
          <CircularProgress 
            size={24} 
            sx={{ ml: 'auto' }} 
            color="error"
          />
        )}
      </Stack>

      {/* Entry Form Card */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <AddIcon color="error" />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
              {editIndex !== null ? 'Edit Issue Entry' : 'Add New Issue Entry'}
            </Typography>
          </Stack>
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Item ID"
                  name="item_id"
                  value={formData.item_id}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: <InventoryIcon color="action" sx={{ mr: 1 }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Issue Date"
                    value={formData.date}
                    onChange={handleDateChange}
                    renderInput={(params) => 
                      <TextField 
                        {...params} 
                        fullWidth 
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: <TodayIcon color="action" sx={{ mr: 1 }} />
                        }}
                      />
                    }
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Issued To"
                  name="person"
                  value={formData.person}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Issued Quantity"
                  name="issued_qty"
                  value={formData.issued_qty}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: <TrendingDownIcon color="action" sx={{ mr: 1 }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Issue Slip Number"
                  name="issue_slip_no"
                  value={formData.issue_slip_no}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: <ReceiptIcon color="action" sx={{ mr: 1 }} />
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Stack direction="row" spacing={2}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
                    sx={{ 
                      background: 'linear-gradient(45deg, #d32f2f, #ff8a80)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #b71c1c, #d32f2f)',
                      }
                    }}
                  >
                    {editIndex !== null ? 'Update Entry' : 'Add Issue Entry'}
                  </Button>
                  {editIndex !== null && (
                    <Button 
                      variant="outlined" 
                      onClick={() => {
                        setEditIndex(null);
                        setFormData({
                          issue_id: '',
                          item_id: '',
                          date: new Date(),
                          person: '',
                          issued_qty: 0,
                          issue_slip_no: '',
                        });
                      }}
                      startIcon={<CancelIcon />}
                    >
                      Cancel Edit
                    </Button>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {issueEntries.length > 0 && (
        <Card sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <AnalyticsIcon color="error" />
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                Issue Summary
              </Typography>
            </Stack>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Badge badgeContent={issueEntries.length} color="error">
                      <AssignmentIcon color="error" />
                    </Badge>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Entries
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {issueEntries.length}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <TrendingDownIcon color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Issued
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {getTotalIssued()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <AssignmentIndIcon color="info" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Recipients
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {getUniquePersons()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <TodayIcon color="warning" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Today's Entries
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {getTodaysEntries()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Search and Entries Table */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 0 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <IssueIcon color="error" />
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                Issue Entries
              </Typography>
              {filteredEntries.length > 0 && (
                <Chip 
                  label={`${filteredEntries.length} entries`} 
                  color="error" 
                  size="small" 
                />
              )}
            </Stack>
            
            <TextField
              fullWidth
              label="Search Entries"
              variant="outlined"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
              }}
              placeholder="Search by Item ID, Person, or Issue Slip Number..."
              sx={{ mb: 2 }}
            />
          </Box>

          <TableContainer sx={{ mt: 2 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase',
                    bgcolor: 'error.main',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    Entry Details
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase',
                    bgcolor: 'error.main',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    Date & Quantity
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase',
                    bgcolor: 'error.main',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    Recipient Info
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase',
                    bgcolor: 'error.main',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEntries.length > 0 ? (
                  filteredEntries.map((entry, index) => (
                    <TableRow 
                      key={index}
                      sx={{ 
                        '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                        '&:hover': { bgcolor: 'action.selected' },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {entry.item_id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {entry.issue_id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                            -{entry.issued_qty}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(entry.date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {entry.person}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Slip: {entry.issue_slip_no}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit Entry">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(index)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Entry">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(index)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <Stack alignItems="center" spacing={2}>
                        <IssueIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                        <Typography variant="h6" color="text.secondary">
                          No issue entries found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {search ? 
                            `No entries match "${search}". Try a different search term.` :
                            "Create your first issue entry to get started"
                          }
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  );
};

export default MaterialIssueRegister;
