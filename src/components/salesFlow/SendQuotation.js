import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  useTheme,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Avatar,
  Fade,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  LinearProgress,
  Zoom
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import salesFlowService from '../../services/salesFlowService';
import sheetService from '../../services/sheetService';
import config from '../../config/config';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Save, 
  ArrowBack, 
  Person, 
  Business, 
  Email, 
  Phone, 
  ShoppingCart, 
  Source, 
  PriorityHigh, 
  CheckCircle, 
  Notes, 
  AutoAwesome,
  Diamond,
  WorkspacePremium,
  TrendingUp,
  Call,
  Assignment,
  Visibility,
  Send,
  CheckCircleOutline,
  Schedule,
  LocationOn,
  Download,
  Mail,
  AttachMoney,
  Receipt,
  Description,
  Print
} from '@mui/icons-material';

const SendQuotation = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [products, setProducts] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [quotationData, setQuotationData] = useState({
    products: [],
    totalPrice: 0,
    customerInfo: null
  });

  useEffect(() => {
    loadLeadsForStep6();
  }, []);

  const loadLeadsForStep6 = async () => {
    try {
      setLoading(true);
      const [leadsData, productsData] = await Promise.all([
        salesFlowService.getLeadsByNextStep(6),
        salesFlowService.getProducts()
      ]);
      setLeads(leadsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading leads:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load leads',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMail = (email) => {
    if (email) {
      const subject = encodeURIComponent('Quotation for Your Requirements');
      const body = encodeURIComponent(`Dear Customer,\n\nPlease find attached our quotation for your requirements.\n\nBest regards,\n${user?.name || 'Sales Team'}`);
      window.open(`mailto:${email}?subject=${subject}&body=${body}`);
    }
  };

  const handleViewDetails = (lead) => {
    setSelectedLead(lead);
    setDetailsDialogOpen(true);
  };

  const handleDownloadQuotation = async (lead) => {
    try {
      // Parse products interested from the lead
      let productsInterested = [];
      try {
        // Check if it's already an array
        if (Array.isArray(lead.ProductsInterested)) {
          productsInterested = lead.ProductsInterested;
        } else {
          productsInterested = JSON.parse(lead.ProductsInterested || '[]');
        }
      } catch (e) {
        // If parsing fails, try to extract product names from string
        if (lead.ProductsInterested && typeof lead.ProductsInterested === 'string') {
          productsInterested = lead.ProductsInterested.split(',').map(p => p.trim());
        }
      }

      // Generate sample prices for products (in real app, these would come from database)
      const productsWithPrices = productsInterested.map((product, index) => ({
        name: product,
        quantity: 1,
        unitPrice: Math.floor(Math.random() * 1000) + 100, // Random price between 100-1100
        total: 0
      }));

      // Calculate totals
      productsWithPrices.forEach(product => {
        product.total = product.quantity * product.unitPrice;
      });

      const totalPrice = productsWithPrices.reduce((sum, product) => sum + product.total, 0);

      // Create PDF using jsPDF
      const doc = new jsPDF('p', 'pt', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      let y = 40;
      
      // Header
      doc.setFillColor(102, 126, 234);
      doc.rect(0, 0, pageWidth, 70, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('QUOTATION', pageWidth / 2, 40, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      
      // Customer info
      y = 100;
      doc.setFontSize(12);
      doc.text(`Customer: ${lead.FullName || lead.CustomerName || 'N/A'}`, 40, y); y += 18;
      doc.text(`Company: ${lead.CompanyName || 'N/A'}`, 40, y); y += 18;
      doc.text(`Email: ${lead.Email || lead.EmailId || 'N/A'}`, 40, y); y += 18;
      doc.text(`Phone: ${lead.PhoneNumber || lead.MobileNumber || 'N/A'}`, 40, y); y += 22;
      
      // Products table
      const rows = productsWithPrices.map(p => [p.name, String(p.quantity), `₹${p.unitPrice.toFixed(2)}`, `₹${p.total.toFixed(2)}`]);
      autoTable(doc, {
        startY: y,
        head: [["Product", "Qty", "Unit Price", "Total"]],
        body: rows,
        theme: 'grid'
      });
      
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : y + 20;
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129);
      doc.text(`Total Amount: ₹${totalPrice.toFixed(2)}`, 40, finalY);
      doc.setTextColor(0, 0, 0);
      
      // Convert PDF to blob and File
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], `Quotation_${lead.LogId}.pdf`, { type: 'application/pdf' });
      
      // Upload to Drive, get fileId
      const fileId = await sheetService.uploadFile(pdfFile);
      
      // Store quotation data in session storage for later submission
      const quotationData = {
        logId: lead.LogId,
        customerName: lead.FullName || lead.CustomerName,
        companyName: lead.CompanyName,
        email: lead.Email || lead.EmailId,
        phoneNumber: lead.PhoneNumber || lead.MobileNumber,
        productsInterested: lead.ProductsInterested,
        requirement: lead.Requirement,
        quotationItems: productsWithPrices,
        totalAmount: totalPrice,
        quotationDocumentId: fileId,
        createdBy: user?.email
      };

      // Store in session storage for later submission
      sessionStorage.setItem('pendingQuotationData', JSON.stringify(quotationData));
      
      // Trigger a download for the user
      doc.save(`Quotation_${lead.LogId}.pdf`);

      setSnackbar({
        open: true,
        message: 'Quotation downloaded successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error downloading quotation:', error);
      setSnackbar({
        open: true,
        message: 'Failed to download quotation',
        severity: 'error'
      });
    }
  };

  const generateQuotationPDF = (lead, products, totalPrice) => {
    const currentDate = new Date().toLocaleDateString();
    const quotationNumber = `QT-${lead.LogId}-${Date.now()}`;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Quotation - ${lead.LogId}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 1.2em;
            opacity: 0.9;
        }
        .content {
            padding: 40px;
        }
        .customer-info {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            border-left: 5px solid #667eea;
        }
        .customer-info h3 {
            margin: 0 0 20px 0;
            color: #667eea;
            font-size: 1.5em;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        .info-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .info-item strong {
            color: #333;
            min-width: 120px;
        }
        .products-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .products-table th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: left;
            font-weight: 600;
        }
        .products-table td {
            padding: 20px;
            border-bottom: 1px solid #eee;
        }
        .products-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        .total-section {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin-top: 30px;
            text-align: right;
        }
        .total-section h2 {
            margin: 0;
            font-size: 2em;
            font-weight: 700;
        }
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #eee;
        }
        .footer p {
            margin: 5px 0;
            color: #666;
        }
        .quotation-number {
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
            font-weight: 600;
            margin-bottom: 20px;
        }
        .date-info {
            color: #666;
            font-size: 0.9em;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>QUOTATION</h1>
            <p>Professional Solutions for Your Business Needs</p>
            <div class="quotation-number">${quotationNumber}</div>
            <div class="date-info">Date: ${currentDate}</div>
        </div>
        
        <div class="content">
            <div class="customer-info">
                <h3>Customer Information</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Customer Name:</strong>
                        <span>${lead.FullName || lead.CustomerName || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Company:</strong>
                        <span>${lead.CompanyName || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Email:</strong>
                        <span>${lead.Email || lead.EmailId || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Phone:</strong>
                        <span>${lead.PhoneNumber || lead.MobileNumber || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Location:</strong>
                        <span>${lead.CustomerLocation || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Customer Type:</strong>
                        <span>${lead.CustomerType || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <h3 style="color: #667eea; margin-bottom: 20px;">Products & Pricing</h3>
            <table class="products-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price (₹)</th>
                        <th>Total (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td><strong>${product.name}</strong></td>
                            <td>${product.quantity}</td>
                            <td>₹${product.unitPrice.toLocaleString()}</td>
                            <td><strong>₹${product.total.toLocaleString()}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="total-section">
                <h2>Total Amount: ₹${totalPrice.toLocaleString()}</h2>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">All prices are inclusive of applicable taxes</p>
            </div>

            <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 10px; border-left: 5px solid #ffc107;">
                <h4 style="margin: 0 0 10px 0; color: #856404;">Terms & Conditions</h4>
                <ul style="margin: 0; padding-left: 20px; color: #856404;">
                    <li>This quotation is valid for 30 days from the date of issue</li>
                    <li>Payment terms: 50% advance, 50% before delivery</li>
                    <li>Delivery timeline: 15-20 working days from order confirmation</li>
                    <li>Warranty: 1 year from date of delivery</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p><strong>Thank you for your interest in our products!</strong></p>
            <p>For any queries, please contact us at sales@reyanshops.com</p>
            <p>Generated on ${currentDate} by ${user?.name || 'Sales Team'}</p>
        </div>
    </div>
</body>
</html>
    `;
  };

  const handleSubmit = async () => {
    if (!selectedLead) {
      setSnackbar({
        open: true,
        message: 'Please select a lead first',
        severity: 'warning'
      });
      return;
    }

    try {
      setLoading(true);
      
      // Check if there's pending quotation data from download
      const pendingQuotationData = sessionStorage.getItem('pendingQuotationData');
      let quotationData;
      
      if (pendingQuotationData) {
        // Use the pending quotation data if it exists
        quotationData = JSON.parse(pendingQuotationData);
        
        // Verify it matches the selected lead
        if (quotationData.logId === selectedLead.LogId) {
          // Clear the pending data
          sessionStorage.removeItem('pendingQuotationData');
        } else {
          // If it doesn't match, generate new data
          quotationData = null;
        }
      }
      
      if (!quotationData) {
        // Generate new quotation data if no pending data or mismatch
        let productsInterested = [];
        try {
          if (Array.isArray(selectedLead.ProductsInterested)) {
            productsInterested = selectedLead.ProductsInterested;
          } else {
            productsInterested = JSON.parse(selectedLead.ProductsInterested || '[]');
          }
        } catch (e) {
          if (selectedLead.ProductsInterested && typeof selectedLead.ProductsInterested === 'string') {
            productsInterested = selectedLead.ProductsInterested.split(',').map(p => p.trim());
          }
        }

        // Generate sample prices for products
        const productsWithPrices = productsInterested.map((product, index) => ({
          name: product,
          quantity: 1,
          unitPrice: Math.floor(Math.random() * 1000) + 100,
          total: 0
        }));

        // Calculate totals
        productsWithPrices.forEach(product => {
          product.total = product.quantity * product.unitPrice;
        });

        const totalPrice = productsWithPrices.reduce((sum, product) => sum + product.total, 0);
        
        // Prepare quotation data for the service
        quotationData = {
          logId: selectedLead.LogId,
          customerName: selectedLead.FullName || selectedLead.CustomerName,
          companyName: selectedLead.CompanyName,
          email: selectedLead.Email || selectedLead.EmailId,
          phoneNumber: selectedLead.PhoneNumber || selectedLead.MobileNumber,
          productsInterested: selectedLead.ProductsInterested,
          requirement: selectedLead.Requirement,
          quotationItems: productsWithPrices,
          totalAmount: totalPrice,
          quotationDocumentId: '', // Will be set after PDF generation
          createdBy: user?.email
        };
      }

      // Use the new salesFlowService function to handle the complete flow
      await salesFlowService.saveSendQuotation(quotationData);

      setSnackbar({
        open: true,
        message: 'Quotation sent successfully! Lead moved to next step.',
        severity: 'success'
      });

      // Refresh the leads list
      await loadLeadsForStep6();
      setDetailsDialogOpen(false);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error submitting quotation:', error);
      const detail = error?.message || error?.details || String(error);
      setSnackbar({
        open: true,
        message: detail ? `Failed to submit quotation: ${detail}` : 'Failed to submit quotation',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in progress':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'new':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && leads.length === 0) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          p: 4
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
        <Typography variant="h6" color="white" sx={{ fontWeight: 300 }}>
          Loading Quotation Data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: 3,
    }}>
      <Container maxWidth="xl">
        <Fade in timeout={800}>
          <Box>
            {/* Enhanced Header */}
            <Card sx={{ 
              mb: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h3" component="h1" sx={{ 
                      fontWeight: 700,
                      mb: 1,
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      Send Quotation
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      opacity: 0.9,
                      fontWeight: 300
                    }}>
                      Generate and send professional quotations to qualified leads
                    </Typography>
                  </Box>
                  <Box display="flex" gap={2}>
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBack />}
                      onClick={() => navigate('/sales-flow')}
                      sx={{ 
                        color: 'white',
                        borderColor: 'white',
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      Back to Sales Flow
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {leads.length}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Pending Quotations
                        </Typography>
                      </Box>
                      <Receipt sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)'
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {leads.filter(l => l.Priority === 'High').length}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          High Priority
                        </Typography>
                      </Box>
                      <PriorityHigh sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {leads.filter(l => l.CustomerType === 'New').length}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          New Customers
                        </Typography>
                      </Box>
                      <Person sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {leads.filter(l => l.CustomerType === 'Existing').length}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Existing Customers
                        </Typography>
                      </Box>
                      <Business sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Enhanced Table */}
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Log ID</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Customer</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Company</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Products</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Priority</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Status</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Created</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                            <Avatar sx={{ 
                              width: 80, 
                              height: 80, 
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              mb: 2
                            }}>
                              <Receipt sx={{ fontSize: 40 }} />
                            </Avatar>
                            <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 500 }}>
                              No quotations pending
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              All leads have been processed or no leads are ready for quotation
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      leads.map((lead, index) => {
                        let productsInterested = [];
                        try {
                          // Check if it's already an array
                          if (Array.isArray(lead.ProductsInterested)) {
                            productsInterested = lead.ProductsInterested;
                          } else {
                            productsInterested = JSON.parse(lead.ProductsInterested || '[]');
                          }
                        } catch (e) {
                          // If parsing fails, try to extract product names from string
                          if (lead.ProductsInterested && typeof lead.ProductsInterested === 'string') {
                            productsInterested = lead.ProductsInterested.split(',').map(p => p.trim());
                          }
                        }

                        return (
                          <Fade in timeout={300 + index * 100} key={`${lead.LogId}-${index}`}>
                            <TableRow 
                              hover 
                              sx={{ 
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  backgroundColor: 'rgba(102, 126, 234, 0.04)',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold" color="primary" sx={{ fontSize: '1rem' }}>
                                  {lead.LogId}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Avatar sx={{ 
                                    width: 40, 
                                    height: 40, 
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                  }}>
                                    {(lead.FullName || lead.CustomerName || 'C').charAt(0)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {lead.FullName || lead.CustomerName || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {lead.Email || lead.EmailId || 'N/A'}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {lead.CompanyName || 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box>
                                  {productsInterested.slice(0, 2).map((product, idx) => (
                                    <Chip 
                                      key={idx}
                                      label={product} 
                                      size="small" 
                                      sx={{ 
                                        mr: 0.5, 
                                        mb: 0.5,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white'
                                      }} 
                                    />
                                  ))}
                                  {productsInterested.length > 2 && (
                                    <Chip 
                                      label={`+${productsInterested.length - 2} more`} 
                                      size="small" 
                                      variant="outlined"
                                      sx={{ ml: 0.5 }}
                                    />
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={lead.Priority || 'Medium'} 
                                  size="small" 
                                  color={getPriorityColor(lead.Priority)}
                                  sx={{ fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={lead.Status || 'New'} 
                                  size="small" 
                                  color={getStatusColor(lead.Status)}
                                  sx={{ fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                                  {formatDate(lead.CreatedAt || lead.DateOfEntry)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box display="flex" gap={1}>
                                  <Tooltip title="View Details">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleViewDetails(lead)}
                                      sx={{ 
                                        color: 'primary.main',
                                        '&:hover': {
                                          backgroundColor: 'rgba(102, 126, 234, 0.1)'
                                        }
                                      }}
                                    >
                                      <Visibility />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Download Quotation">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDownloadQuotation(lead)}
                                      sx={{ 
                                        color: 'success.main',
                                        '&:hover': {
                                          backgroundColor: 'rgba(16, 185, 129, 0.1)'
                                        }
                                      }}
                                    >
                                      <Download />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Send Email">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleSendMail(lead.Email || lead.EmailId)}
                                      sx={{ 
                                        color: 'info.main',
                                        '&:hover': {
                                          backgroundColor: 'rgba(59, 130, 246, 0.1)'
                                        }
                                      }}
                                    >
                                      <Mail />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          </Fade>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            {/* Details Dialog */}
            <Dialog 
              open={detailsDialogOpen} 
              onClose={() => setDetailsDialogOpen(false)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Person />
                  <Typography variant="h6">Lead Details</Typography>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ p: 3 }}>
                {selectedLead && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                          Customer Information
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={1}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="textSecondary">Name:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {selectedLead.FullName || selectedLead.CustomerName || 'N/A'}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="textSecondary">Company:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {selectedLead.CompanyName || 'N/A'}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="textSecondary">Email:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {selectedLead.Email || selectedLead.EmailId || 'N/A'}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="textSecondary">Phone:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {selectedLead.PhoneNumber || selectedLead.MobileNumber || 'N/A'}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="textSecondary">Location:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {selectedLead.CustomerLocation || 'N/A'}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="textSecondary">Customer Type:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {selectedLead.CustomerType || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Card sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                          Lead Information
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={1}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="textSecondary">Log ID:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {selectedLead.LogId}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="textSecondary">Priority:</Typography>
                            <Chip 
                              label={selectedLead.Priority || 'Medium'} 
                              size="small" 
                              color={getPriorityColor(selectedLead.Priority)}
                            />
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="textSecondary">Status:</Typography>
                            <Chip 
                              label={selectedLead.Status || 'New'} 
                              size="small" 
                              color={getStatusColor(selectedLead.Status)}
                            />
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="textSecondary">Created:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatDate(selectedLead.CreatedAt || selectedLead.DateOfEntry)}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="textSecondary">Assigned To:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {selectedLead.AssignedTo || selectedLead.LeadAssignedTo || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Card sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                          Products Interested
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {(() => {
                            let productsInterested = [];
                            try {
                              // Check if it's already an array
                              if (Array.isArray(selectedLead.ProductsInterested)) {
                                productsInterested = selectedLead.ProductsInterested;
                              } else {
                                productsInterested = JSON.parse(selectedLead.ProductsInterested || '[]');
                              }
                            } catch (e) {
                              // If parsing fails, try to extract product names from string
                              if (selectedLead.ProductsInterested && typeof selectedLead.ProductsInterested === 'string') {
                                productsInterested = selectedLead.ProductsInterested.split(',').map(p => p.trim());
                              }
                            }
                            return productsInterested.map((product, index) => (
                              <Chip 
                                key={index}
                                label={product} 
                                sx={{ 
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  fontWeight: 600
                                }} 
                              />
                            ));
                          })()}
                        </Box>
                      </Card>
                    </Grid>
                    
                    {selectedLead.Requirement && (
                      <Grid item xs={12}>
                        <Card sx={{ p: 2 }}>
                          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                            Requirements
                          </Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                            {selectedLead.Requirement}
                          </Typography>
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                )}
              </DialogContent>
              <DialogActions sx={{ p: 3, gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setDetailsDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={() => {
                    handleDownloadQuotation(selectedLead);
                    setDetailsDialogOpen(false);
                  }}
                  sx={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                    }
                  }}
                >
                  Download Quotation
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Mail />}
                  onClick={() => {
                    handleSendMail(selectedLead.Email || selectedLead.EmailId);
                    setDetailsDialogOpen(false);
                  }}
                  sx={{ 
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                    }
                  }}
                >
                  Send Email
                </Button>
                <Button
                  variant="contained"
                  startIcon={<CheckCircle />}
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Complete & Move to Next Step'}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Enhanced Snackbar */}
            <Snackbar
              open={snackbar.open}
              autoHideDuration={6000}
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Alert 
                onClose={() => setSnackbar({ ...snackbar, open: false })} 
                severity={snackbar.severity}
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                {snackbar.message}
              </Alert>
            </Snackbar>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default SendQuotation;
