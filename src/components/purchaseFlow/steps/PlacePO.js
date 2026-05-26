import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Pagination,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  Zoom,
  Avatar,
  Collapse,
  useTheme,
  alpha
} from '@mui/material';
import {
  Download as DownloadIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  AttachMoney as AttachMoneyIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import purchaseFlowService from '../../../services/purchaseFlowService';
import sheetService from '../../../services/sheetService';
import { useAuth } from '../../../context/AuthContext';

const vendorFieldLabels = [
  { key: 'vendorName', label: 'Vendor Name', icon: BusinessIcon },
  { key: 'vendorCode', label: 'Vendor Code', icon: ReceiptIcon },
  { key: 'vendorContact', label: 'Vendor Contact', icon: BusinessIcon },
  { key: 'vendorEmail', label: 'Vendor Email', icon: EmailIcon },
  { key: 'vendorAddress', label: 'Address', icon: BusinessIcon },
  { key: 'vendorState', label: 'State', icon: BusinessIcon },
  { key: 'vendorStateCode', label: 'State Code', icon: ReceiptIcon },
  { key: 'vendorAccountCode', label: 'A/C Code', icon: ReceiptIcon },
  { key: 'vendorGSTIN', label: 'GSTIN', icon: ReceiptIcon },
  { key: 'vendorPAN', label: 'PAN No.', icon: ReceiptIcon }
];

const PlacePO = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [pos, setPos] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [expandedPO, setExpandedPO] = useState({});
  const [downloadDialog, setDownloadDialog] = useState({ open: false, po: null, progress: 0, status: 'preparing' });
  const [emailDialog, setEmailDialog] = useState({ open: false, po: null, pdfBlob: null, pdfUrl: null });
  const [emailSent, setEmailSent] = useState({}); // Track which POs have had email sent

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const data = await purchaseFlowService.getPOsForPlacement();
      setPos(data);
      setPage(1); // Reset to first page when data changes
    } catch (err) {
      console.error('Error fetching POs:', err);
      setSnackbar({ 
        open: true, 
        message: 'Failed to fetch POs: ' + (err.message || 'Unknown error'), 
        severity: 'error' 
      });
      setPos([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  // Pagination calculations with useMemo
  const paginatedPOs = useMemo(() => {
    if (!pos || !Array.isArray(pos)) return [];
    return pos.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }, [pos, page, rowsPerPage]);

  const totalPages = useMemo(() => {
    if (!pos || !Array.isArray(pos)) return 0;
    return Math.ceil(pos.length / rowsPerPage);
  }, [pos, rowsPerPage]);

  // Calculate pagination indices for display
  const startIndex = useMemo(() => {
    return (page - 1) * rowsPerPage;
  }, [page, rowsPerPage]);

  const endIndex = useMemo(() => {
    return startIndex + rowsPerPage;
  }, [startIndex, rowsPerPage]);

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleExpand = (poId) => {
    setExpandedPO(prev => ({
      ...prev,
      [poId]: !prev[poId]
    }));
  };

  const calculateTotalAmount = (items) => {
    return items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      return sum + (quantity * price);
    }, 0);
  };

  const handleDownloadPO = async (po) => {
    // Open download dialog
    setDownloadDialog({ 
      open: true, 
      po: po, 
      progress: 0, 
      status: 'preparing' 
    });

    try {
      // Simulate progress for better UX
      setDownloadDialog(prev => ({ ...prev, progress: 20, status: 'generating' }));
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setDownloadDialog(prev => ({ ...prev, progress: 60, status: 'finalizing' }));
      
      // Generate PDF
    const doc = generatePOPDF(po);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setDownloadDialog(prev => ({ ...prev, progress: 90, status: 'downloading' }));
      
      // Save the PDF
    doc.save(`PO_${po.POId}.pdf`);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setDownloadDialog(prev => ({ ...prev, progress: 100, status: 'completed' }));
      
      // Close dialog after a short delay
      setTimeout(() => {
        setDownloadDialog({ open: false, po: null, progress: 0, status: 'preparing' });
        setSnackbar({ open: true, message: `PO ${po.POId} downloaded successfully!`, severity: 'success' });
      }, 800);
      
    } catch (error) {
      console.error('Error downloading PO:', error);
      setDownloadDialog({ open: false, po: null, progress: 0, status: 'preparing' });
      setSnackbar({ open: true, message: 'Failed to download PO', severity: 'error' });
    }
  };

  const handleSendEmail = async (po) => {
    if (!po.VendorDetails?.vendorEmail) {
      setSnackbar({ open: true, message: 'Vendor email is missing.', severity: 'error' });
      return;
    }

    try {
      // Generate PDF
    const doc = generatePOPDF(po);
      
      // Convert PDF to blob
      const pdfBlob = doc.output('blob');
      
      // Create object URL for attachment
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Open email dialog with PDF ready (NO automatic download)
      setEmailDialog({
        open: true,
        po: po,
        pdfBlob: pdfBlob,
        pdfUrl: pdfUrl
      });
      
    } catch (error) {
      console.error('Error preparing email:', error);
      setSnackbar({ open: true, message: 'Failed to prepare email', severity: 'error' });
    }
  };

  const handleOpenEmailClient = (po, pdfUrl) => {
    // First, download the PDF so user can attach it
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `PO_${po.POId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    const subject = `Purchase Order - PO #${po.POId}`;
    const body = `Dear ${po.VendorDetails?.vendorName || 'Supplier'},

Please find the attached Purchase Order (${po.POId}) for your review.

Purchase Order Details:
- PO Number: ${po.POId}
- Total Amount: ₹${calculateTotalAmount(po.Items || []).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
- Items: ${po.Items?.length || 0} item(s)

Please attach the PDF file (PO_${po.POId}.pdf) from your Downloads folder before sending this email.

Thank you,
Reyansh International Pvt Ltd`;

    const mailtoLink = `mailto:${po.VendorDetails?.vendorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    
    // Mark email as sent for this PO
    setEmailSent(prev => ({
      ...prev,
      [po.POId]: true
    }));
    
    // Close dialog after a short delay
    setTimeout(() => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      setEmailDialog({ open: false, po: null, pdfBlob: null, pdfUrl: null });
      setSnackbar({ 
        open: true, 
        message: 'Email client opened. Please attach the PDF and send the email to complete this step.', 
        severity: 'info' 
      });
    }, 500);
  };

  const handleDownloadPDFForEmail = (pdfUrl, poId) => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `PO_${poId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSnackbar({ 
      open: true, 
      message: 'PDF downloaded. Please attach it to your email.', 
      severity: 'success' 
    });
  };

  const validatePOForCompletion = (po) => {
    // Check if PO has vendor details
    if (!po.VendorDetails || !po.VendorDetails.vendorName) {
      return {
        isValid: false,
        error: 'Cannot complete PO: Missing vendor information'
      };
    }
    
    // Check if PO has items
    const items = po.Items || [];
    if (!Array.isArray(items) || items.length === 0) {
      return {
        isValid: false,
        error: 'Cannot complete PO: PO must have at least one item'
      };
    }
    
    // Check if all items have required fields
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.itemCode && !item.ItemCode) {
        return {
          isValid: false,
          error: `Cannot complete PO: Item ${i + 1} is missing item code`
        };
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        return {
          isValid: false,
          error: `Cannot complete PO: Item ${i + 1} has invalid quantity`
        };
      }
      if (!item.price || parseFloat(item.price) <= 0) {
        return {
          isValid: false,
          error: `Cannot complete PO: Item ${i + 1} has invalid price`
        };
      }
    }
    
    return { isValid: true };
  };

  const handleCompleteStep = async (po) => {
    // Validate PO data
    const validation = validatePOForCompletion(po);
    if (!validation.isValid) {
      setSnackbar({ 
        open: true, 
        message: validation.error, 
        severity: 'error' 
      });
      return;
    }
    
    // Check if email has been sent
    if (!emailSent[po.POId]) {
      setSnackbar({ 
        open: true, 
        message: 'Please send the email with PDF attachment before completing this step.', 
        severity: 'warning' 
      });
      return;
    }

    try {
      // Generate the PO PDF
      const pdfDoc = generatePOPDF(po);
      
      // Convert PDF to blob
      const pdfBlob = pdfDoc.output('blob');
      
      // Create a File object from the blob
      const pdfFile = new File([pdfBlob], `PO_${po.POId}.pdf`, { type: 'application/pdf' });
      
      // Upload the PDF file and get the document ID
      const poDocumentId = await sheetService.uploadFile(pdfFile);
      
      // Place the PO with the uploaded document
      await purchaseFlowService.placePOWithDocument({
        poId: po.POId,
        poDocumentId: poDocumentId,
        userEmail: user?.email || 'Purchase Executive'
      });
      
      setSnackbar({ open: true, message: `PO ${po.POId} completed successfully!`, severity: 'success' });
      
      // Remove the completed PO from the list immediately
      setPos(prev => prev.filter(p => p.POId !== po.POId));
      
      // Refetch POs to ensure UI is updated and completed PO is not shown
      await fetchPOs();
      
    } catch (err) {
      console.error('Error completing PO step:', err);
      setSnackbar({ 
        open: true, 
        message: 'Failed to complete PO step: ' + (err.message || 'Unknown error. Please try again.'), 
        severity: 'error' 
      });
    }
  };

  const generatePOPDF = (po) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setLanguage('en-US');
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 15; // 15mm margins
    const contentWidth = pageWidth - (2 * margin);
    let y = margin;
    let pageNumber = 1;
    
    // Calculate total amount
    const totalAmount = (po.Items || []).reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      return sum + (quantity * price);
    }, 0);

    // Helper function to format currency (ensures plain ASCII, no special characters)
    const formatCurrency = (amount) => {
      const num = parseFloat(amount);
      // Format with commas for thousands and 2 decimal places
      const formatted = num.toLocaleString('en-IN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
      return 'Rs ' + formatted;
    };

    // Helper function to format number with commas
    const formatNumber = (num) => {
      return parseFloat(num).toLocaleString('en-IN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    };

    // Helper function to split long text into multiple lines (for mm units)
    const splitText = (text, maxWidth) => {
      if (!text) return [''];
      const words = text.toString().split(' ');
      const lines = [];
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        // Convert mm to approximate character width (assuming 1mm ≈ 2.5 chars for font size 8)
        const testWidth = doc.getTextWidth(testLine) * 0.35; // Approximate conversion
        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines.length > 0 ? lines : [text || ''];
    };

    // Helper function to check if new page is needed
    const checkNewPage = (requiredSpace) => {
      if (y + requiredSpace > pageHeight - 30) {
        doc.addPage();
        pageNumber++;
        y = margin;
        return true;
      }
      return false;
    };

    // Helper function to add page numbers
    const addPageNumbers = () => {
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }
    };

    // --- HEADER: COMPANY INFO ---
    y = margin;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('REYANSH INTERNATIONAL PVT LTD', pageWidth / 2, y, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('J-61, Sector 63, Noida, 201301, Uttar Pradesh', pageWidth / 2, y + 5, { align: 'center' });
    doc.text('Phone: 9818079750 | Email: REYANSHINTERNATIONAL63@GMAIL.COM', pageWidth / 2, y + 9, { align: 'center' });
    
    // Light separator line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 13, pageWidth - margin, y + 13);
    
    // --- TITLE: PURCHASE ORDER ---
    y += 20;
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    const poTitle = `PURCHASE ORDER — ${po.POId || 'PO6724'}`;
    doc.text(poTitle, pageWidth / 2, y, { align: 'center' });
    
    // Light underline
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    const titleWidth = doc.getTextWidth(poTitle);
    doc.line(pageWidth / 2 - titleWidth / 2, y + 2, pageWidth / 2 + titleWidth / 2, y + 2);
    
    // --- PO DETAILS ---
    y += 12;
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, y, contentWidth, 15, 'F');
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentWidth, 15);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Date:', margin + 2, y + 6);
    doc.setTextColor(0, 0, 0);
    const poDate = po.CreatedAt ? new Date(po.CreatedAt).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }) : new Date().toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    doc.text(poDate, margin + 15, y + 6);
    
    doc.setTextColor(80, 80, 80);
    doc.text('Status:', margin + 100, y + 6);
    doc.setTextColor(76, 175, 80);
    doc.setFont('helvetica', 'bold');
    doc.text('Active', margin + 120, y + 6);
    doc.setTextColor(0, 0, 0);
    
    // --- SUPPLIER/VENDOR INFO ---
    y += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 70, 70);
    doc.text('SUPPLIER INFORMATION', margin, y);
    doc.setTextColor(0, 0, 0);
    
    y += 7;
    doc.setFillColor(252, 252, 252);
    doc.rect(margin, y, contentWidth, 45, 'F');
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentWidth, 45);
    
    const vendorDetails = [
      { label: 'Name', value: po.VendorDetails?.vendorName || 'N/A' },
      { label: 'Code', value: po.VendorDetails?.vendorCode || 'N/A' },
      { label: 'Contact', value: po.VendorDetails?.vendorContact || 'N/A' },
      { label: 'Email', value: po.VendorDetails?.vendorEmail || 'N/A' },
      { label: 'Address', value: po.VendorDetails?.vendorAddress || 'N/A' },
      { label: 'GSTIN', value: po.VendorDetails?.vendorGSTIN || 'N/A' },
      { label: 'PAN', value: po.VendorDetails?.vendorPAN || 'N/A' }
    ];
    
    doc.setFontSize(8);
    let currentY = y + 5;
    const labelWidth = 25;
    const col2StartX = margin + 95;
    let col1Y = currentY;
    let col2Y = currentY;
    
    vendorDetails.forEach((detail, index) => {
      const value = (detail.value || 'N/A').toString().substring(0, 35);
      
      if (index < 4) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(detail.label + ':', margin + 3, col1Y);
        doc.setTextColor(0, 0, 0);
        doc.text(value, margin + 3 + labelWidth, col1Y);
        col1Y += 6;
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(detail.label + ':', col2StartX, col2Y);
        doc.setTextColor(0, 0, 0);
        doc.text(value, col2StartX + labelWidth, col2Y);
        col2Y += 6;
      }
    });
    
    // --- ITEMS TABLE ---
    y = y + 50;
    checkNewPage(100);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 70, 70);
    doc.text('ITEMS', margin, y);
    doc.setTextColor(0, 0, 0);
    
    y += 6;
    
    // Table with all necessary columns
    const itemRows = (po.Items || []).map((item, idx) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      const total = quantity * price;
      return [
        (idx + 1).toString(),
        (item.itemCode || 'N/A').substring(0, 15),
        (item.itemName || 'N/A').substring(0, 30),
        (item.specifications || 'N/A').substring(0, 25),
        quantity.toString(),
        formatNumber(price),
        formatNumber(total)
      ];
    });
    
    autoTable(doc, {
      startY: y,
      head: [['#', 'Item Code', 'Item Name', 'Specifications', 'Qty', 'Unit Price', 'Total']],
      body: itemRows,
      theme: 'striped',
      headStyles: { 
        fillColor: [245, 245, 245], 
        textColor: [60, 60, 60], 
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        cellPadding: 3,
        lineColor: [220, 220, 220],
        lineWidth: 0.3
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [240, 240, 240],
        lineWidth: 0.2,
        textColor: [50, 50, 50]
      },
      alternateRowStyles: {
        fillColor: [252, 252, 252]
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 3,
        lineColor: [230, 230, 230],
        lineWidth: 0.2,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 28, halign: 'left' },
        2: { cellWidth: 55, halign: 'left' },
        3: { cellWidth: 45, halign: 'left' },
        4: { cellWidth: 12, halign: 'center' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 27, halign: 'right', fontStyle: 'bold', textColor: [60, 60, 60] }
      },
      margin: { left: margin, right: margin, top: y },
      pageBreak: 'auto',
      rowPageBreak: 'avoid',
      showHead: 'everyPage'
    });
    
    // --- TOTALS SECTION ---
    let finalY = doc.lastAutoTable.finalY + 10;
    checkNewPage(50);
    if (finalY > pageHeight - 50) {
      finalY = margin;
    }
    
    // Calculate tax amounts
    const taxableAmount = totalAmount;
    const cgst = taxableAmount * 0.09;
    const sgst = taxableAmount * 0.09;
    const grandTotal = taxableAmount + cgst + sgst;
    
    // Totals box - right aligned, light design
    const totalsBoxWidth = 75;
    const totalsBoxX = pageWidth - margin - totalsBoxWidth;
    const totalsBoxHeight = 35;
    
    doc.setFillColor(250, 250, 250);
    doc.rect(totalsBoxX, finalY, totalsBoxWidth, totalsBoxHeight, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.rect(totalsBoxX, finalY, totalsBoxWidth, totalsBoxHeight);
    
    finalY += 6;
    const labelX = totalsBoxX + 3;
    const valueX = totalsBoxX + totalsBoxWidth - 3;
    const lineSpacing = 5;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Subtotal:', labelX, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(taxableAmount), valueX, finalY, { align: 'right' });
    
    finalY += lineSpacing;
    doc.setTextColor(80, 80, 80);
    doc.text('CGST (9%):', labelX, finalY);
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(cgst), valueX, finalY, { align: 'right' });
    
    finalY += lineSpacing;
    doc.setTextColor(80, 80, 80);
    doc.text('SGST (9%):', labelX, finalY);
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(sgst), valueX, finalY, { align: 'right' });
    
    // Divider
    finalY += 3;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(totalsBoxX + 3, finalY, totalsBoxX + totalsBoxWidth - 3, finalY);
    
    finalY += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text('TOTAL:', labelX, finalY);
    doc.text(formatCurrency(grandTotal), valueX, finalY, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    
    // --- TERMS & CONDITIONS ---
    finalY = doc.lastAutoTable.finalY + 50;
    checkNewPage(50);
    if (finalY > pageHeight - 50) {
      finalY = margin;
    }
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 70, 70);
    doc.text('TERMS & CONDITIONS', margin, finalY);
    doc.setTextColor(0, 0, 0);
    
    // Light underline
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, finalY + 2, margin + 70, finalY + 2);
    
    finalY += 7;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const terms = [
      '1. PO Number must be mentioned in all invoices and correspondence.',
      '2. Delivery must be made within the specified delivery time.',
      '3. All disputes will be subject to Delhi jurisdiction.',
      '4. Payment terms: As per agreed terms.',
      '5. Quality standards must be maintained as per specifications.',
      '6. This PO is valid for 30 days from the date of issue.'
    ];
    
    terms.forEach((term) => {
      if (checkNewPage(8)) {
        finalY = margin;
      }
      doc.text(term, margin + 2, finalY);
      finalY += 5;
    });
    
    // --- SIGNATURE AREA ---
    finalY += 8;
    checkNewPage(40);
    if (finalY > pageHeight - 40) {
      finalY = margin;
        }
    
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.3);
    
    // Buyer signature
    doc.rect(margin, finalY, 85, 30);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Authorized Signature', margin + 42.5, finalY + 5, { align: 'center' });
    doc.text('(Buyer)', margin + 42.5, finalY + 10, { align: 'center' });
    doc.setDrawColor(200, 200, 200);
    doc.line(margin + 5, finalY + 20, margin + 80, finalY + 20);
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(7);
    doc.text('Name & Date', margin + 42.5, finalY + 25, { align: 'center' });
    
    // Supplier signature
    doc.setDrawColor(230, 230, 230);
    doc.rect(margin + 95, finalY, 85, 30);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Authorized Signature', margin + 137.5, finalY + 5, { align: 'center' });
    doc.text('(Supplier)', margin + 137.5, finalY + 10, { align: 'center' });
    doc.setDrawColor(200, 200, 200);
    doc.line(margin + 100, finalY + 20, margin + 175, finalY + 20);
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(7);
    doc.text('Name & Date', margin + 137.5, finalY + 25, { align: 'center' });
    
    // --- FOOTER ---
    const footerY = pageHeight - 8;
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('This is a computer generated document', pageWidth / 2, footerY + 4, { align: 'center' });
    
    // Add page numbers to all pages
    addPageNumbers();
    
    return doc;
  };

  return (
    <Box sx={{ 
      p: 4, 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh'
    }}>
      {/* Header with Stats */}
      <Box sx={{ mb: 4 }}>
        <Card sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
          color: 'white',
          borderRadius: 3,
          boxShadow: '0 8px 32px ${alpha(theme.palette.success.main, 0.3)'
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 56, height: 56 }}>
                <ReceiptIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Place Purchase Orders
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Manage and process purchase orders from approved vendors
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'rgba(255, 255, 255, 0.15)', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 2
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                      {pos.length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Total POs
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'rgba(255, 255, 255, 0.15)', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 2
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                      {Object.keys(emailSent).filter(poId => emailSent[poId]).length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Email Sent
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'rgba(255, 255, 255, 0.15)', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 2
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                      Step 10
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Place PO
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'rgba(255, 255, 255, 0.15)', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 2
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                      {pos.reduce((sum, po) => sum + (po.Items?.length || 0), 0)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Total Items
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* POs Table */}
      <Card sx={{ 
        background: 'white',
        boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.1)}`,
        border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
        borderRadius: 3,
        overflow: 'hidden'
      }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ 
            p: 3, 
            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
              <InventoryIcon />
              Purchase Orders List
            </Typography>
            {pos.length > 0 && (
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Showing {startIndex + 1}-{Math.min(endIndex, pos.length)} of {pos.length} POs
              </Typography>
            )}
          </Box>
          
          {loading ? (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress size={60} />
            </Box>
          ) : pos.length === 0 ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
                        <Box sx={{ 
                          width: 80, 
                          height: 80, 
                          borderRadius: '50%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.dark, 0.1)})`,
                          display: 'flex',
                          alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
                        }}>
                <ReceiptIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />
                        </Box>
              <Typography variant="h6" sx={{ color: theme.palette.success.main, fontWeight: 600, mb: 1 }}>
                          No POs Available
                        </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                          All purchase orders have been processed or none are ready for placement
                        </Typography>
                      </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
                {paginatedPOs.map((po, index) => {
                  const totalAmount = calculateTotalAmount(po.Items || []);
                  const isExpanded = expandedPO[po.POId] || false;
                  
                  return (
                    <Fade in={true} timeout={300 + (index * 100)} key={po.POId}>
                      <Card 
                        sx={{ 
                          borderRadius: 3,
                          overflow: 'hidden',
                          boxShadow: '0 4px 20px ${alpha(theme.palette.success.main, 0.1)',
                          border: '1px solid ${alpha(theme.palette.success.main, 0.1)',
                          transition: 'all 0.3s ease',
                          background: 'white',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 40px ${alpha(theme.palette.success.main, 0.2)'
                          }
                        }}
                      >
                        <CardContent sx={{ p: 0 }}>
                          {/* PO Header */}
                          <Box sx={{ 
                            p: 3, 
                            background: 'linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05), ${alpha(theme.palette.success.dark, 0.05))',
                            borderBottom: '1px solid ${alpha(theme.palette.success.main, 0.1)'
                          }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} md={4}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar sx={{ 
                                    bgcolor: theme.palette.success.main, 
                                    width: 48, 
                                    height: 48,
                                    boxShadow: '0 4px 12px ${alpha(theme.palette.success.main, 0.3)'
                                  }}>
                                    <BusinessIcon />
                                  </Avatar>
                                  <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                                      PO #{po.POId}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#666' }}>
                                      Created: {new Date(po.CreatedAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} md={4}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar sx={{ 
                                    bgcolor: '${alpha(theme.palette.success.main, 0.1)', 
                                    width: 48, 
                                    height: 48 
                                  }}>
                                    <BusinessIcon sx={{ color: theme.palette.success.main }} />
                                  </Avatar>
                                  <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.success.main, mb: 0.5 }}>
                                      {po.VendorDetails?.vendorName || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#666' }}>
                                      {po.VendorDetails?.vendorCode || 'N/A'} • {po.Items?.length || 0} items
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} md={4}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <Box>
                                    <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                                      Total Amount
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff9800' }}>
                                      Rs {totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                      <Chip
                                        icon={emailSent[po.POId] ? <CheckCircleIcon /> : <EmailIcon />}
                                        label={emailSent[po.POId] ? 'Email Sent' : 'Email Pending'}
                                        size="small"
                                        color={emailSent[po.POId] ? 'success' : 'default'}
                                        sx={{ fontSize: '0.7rem', height: 24 }}
                                      />
                                    </Box>
                                  </Box>
                                  <Tooltip title={isExpanded ? "Hide Details" : "View Details"} arrow>
                                    <IconButton
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleExpand(po.POId);
                                      }}
                                      sx={{ 
                                        bgcolor: '${alpha(theme.palette.success.main, 0.1)',
                                        color: theme.palette.success.main,
                                        '&:hover': {
                                          bgcolor: '${alpha(theme.palette.success.main, 0.2)',
                                          transform: 'scale(1.1)'
                                        }
                                      }}
                                    >
                                      <ExpandMoreIcon sx={{ 
                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s'
                                      }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Grid>
                            </Grid>
                          </Box>

                          {/* Expanded Details */}
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 3 }}>
                              <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                      <Card sx={{ 
                        background: '${alpha(theme.palette.success.main, 0.02)',
                        border: '1px solid ${alpha(theme.palette.success.main, 0.1)',
                        borderRadius: 2
                      }}>
                                <CardContent>
                          <Typography variant="subtitle2" sx={{ 
                            fontWeight: 700, 
                            color: theme.palette.success.main, 
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            <BusinessIcon fontSize="small" />
                            Vendor Information
                          </Typography>
                          <Grid container spacing={1}>
                            {vendorFieldLabels.map(f => (
                              <Grid item xs={12} sm={6} key={f.key}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <f.icon sx={{ fontSize: 16, color: theme.palette.success.main }} />
                                  <Typography variant="caption" sx={{ 
                                    fontWeight: 600, 
                                    color: theme.palette.success.main,
                                            minWidth: 100
                                  }}>
                                    {f.label}:
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#333' }}>
                                    {po.VendorDetails[f.key] || 'N/A'}
                                  </Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </CardContent>
                      </Card>
                            </Grid>
                            <Grid item xs={12} md={6}>
                      <Card sx={{ 
                        background: '${alpha(theme.palette.success.main, 0.02)',
                        border: '1px solid ${alpha(theme.palette.success.main, 0.1)',
                        borderRadius: 2
                      }}>
                                <CardContent>
                          <Typography variant="subtitle2" sx={{ 
                            fontWeight: 700, 
                            color: theme.palette.success.main, 
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            <InventoryIcon fontSize="small" />
                            Items ({po.Items?.length || 0})
                          </Typography>
                                  <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ 
                                background: 'linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1), ${alpha(theme.palette.success.dark, 0.1))'
                              }}>
                                <TableCell sx={{ fontWeight: 700, color: theme.palette.success.main, fontSize: '0.75rem' }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: theme.palette.success.main, fontSize: '0.75rem' }}>Code</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: theme.palette.success.main, fontSize: '0.75rem' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: theme.palette.success.main, fontSize: '0.75rem' }}>Qty</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: theme.palette.success.main, fontSize: '0.75rem' }}>Price</TableCell>
                                          <TableCell sx={{ fontWeight: 700, color: theme.palette.success.main, fontSize: '0.75rem' }}>Total</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                                        {(po.Items || []).map((item, idx) => {
                                          const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
                                          return (
                                <TableRow key={idx} sx={{ 
                                  '&:hover': { background: '${alpha(theme.palette.success.main, 0.05)' }
                                }}>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{idx + 1}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    <Chip 
                                      label={item.itemCode} 
                                      size="small" 
                                      variant="outlined"
                                      sx={{ 
                                        fontSize: '0.7rem',
                                        borderColor: theme.palette.success.main,
                                        color: theme.palette.success.main
                                      }}
                                    />
                                  </TableCell>
                                              <TableCell sx={{ fontSize: '0.75rem', maxWidth: 150 }}>
                                    <Typography variant="caption" sx={{ 
                                      display: 'block',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {item.itemName}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    <Chip 
                                      label={item.quantity} 
                                      size="small" 
                                      sx={{ 
                                        fontSize: '0.7rem',
                                        background: 'linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})',
                                        color: 'white'
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                    ₹{item.price}
                                  </TableCell>
                                              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '${theme.palette.success.main}' }}>
                                                ₹{itemTotal.toFixed(2)}
                                              </TableCell>
                                </TableRow>
                                          );
                                        })}
                            </TableBody>
                          </Table>
                                  </TableContainer>
                        </CardContent>
                      </Card>
                            </Grid>
                          </Grid>
                          
                          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Tooltip title="Download PO as PDF">
                          <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownloadPO(po)}
                            sx={{ 
                              borderColor: '${theme.palette.success.main}',
                              color: theme.palette.success.main,
                              '&:hover': {
                                borderColor: '${theme.palette.success.dark}',
                                background: '${alpha(theme.palette.success.main, 0.05)'
                              }
                            }}
                          >
                            Download
                          </Button>
                        </Tooltip>
                        <Tooltip title="Send PO via Email">
                          <Button
                            variant="contained"
                            startIcon={<EmailIcon />}
                            onClick={() => handleSendEmail(po)}
                            sx={{ 
                              background: 'linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})',
                              '&:hover': {
                                background: 'linear-gradient(135deg, ${theme.palette.success.dark}, #0d47a1)'
                              }
                            }}
                          >
                            Send Email
                          </Button>
                        </Tooltip>
                            <Tooltip title={!emailSent[po.POId] ? "Please send email with PDF attachment first" : "Complete Step - Move to Next Step"}>
                              <span>
                          <Button
                            variant="contained"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleCompleteStep(po)}
                                  disabled={!emailSent[po.POId]}
                            sx={{ 
                                    background: emailSent[po.POId] 
                                      ? 'linear-gradient(135deg, #4caf50, #66bb6a)' 
                                      : 'linear-gradient(135deg, #9e9e9e, #757575)',
                              color: 'white',
                              '&:hover': {
                                      background: emailSent[po.POId]
                                        ? 'linear-gradient(135deg, #66bb6a, #81c784)'
                                        : 'linear-gradient(135deg, #757575, #616161)'
                                    },
                                    '&.Mui-disabled': {
                                      background: 'linear-gradient(135deg, #9e9e9e, #757575)',
                                      color: 'white'
                                    }
                                  }}
                                >
                                  {emailSent[po.POId] ? 'Complete Step' : 'Send Email First'}
                          </Button>
                              </span>
                        </Tooltip>
                      </Box>
                            </Box>
                          </Collapse>
                        </CardContent>
                      </Card>
                    </Fade>
                  );
                })}
              </Box>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                    sx={{
                      '& .MuiPaginationItem-root': {
                        fontSize: '1rem',
                        fontWeight: 600,
                        '&.Mui-selected': {
                          background: 'linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})',
                          color: 'white',
                          '&:hover': {
                            background: 'linear-gradient(135deg, ${theme.palette.success.dark}, #0d47a1)'
                          }
                        }
                      }
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <Dialog
        open={emailDialog.open}
        onClose={() => {
          if (emailDialog.pdfUrl) {
            URL.revokeObjectURL(emailDialog.pdfUrl);
          }
          setEmailDialog({ open: false, po: null, pdfBlob: null, pdfUrl: null });
        }}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Zoom}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px ${alpha(theme.palette.success.main, 0.3)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EmailIcon sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Send Purchase Order via Email
              </Typography>
              {emailDialog.po && (
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  {emailDialog.po.POId}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton
            onClick={() => {
              if (emailDialog.pdfUrl) {
                URL.revokeObjectURL(emailDialog.pdfUrl);
              }
              setEmailDialog({ open: false, po: null, pdfBlob: null, pdfUrl: null });
            }}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          {emailDialog.po && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Ready to send email with PDF attachment
                </Typography>
                <Typography variant="body2">
                  Click "Open Email Client" to compose an email. The PDF will be downloaded automatically 
                  and you can attach it (PO_{emailDialog.po.POId}.pdf) from your Downloads folder.
                </Typography>
              </Alert>

              <Card sx={{ mb: 3, background: '${alpha(theme.palette.success.main, 0.02)', border: '1px solid ${alpha(theme.palette.success.main, 0.1)' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '${theme.palette.success.main}', mb: 2 }}>
                    Email Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 100 }}>
                          To:
                        </Typography>
                        <Typography variant="body2">
                          {emailDialog.po.VendorDetails?.vendorEmail || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 100 }}>
                          Vendor:
                        </Typography>
                        <Typography variant="body2">
                          {emailDialog.po.VendorDetails?.vendorName || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 100 }}>
                          Subject:
                        </Typography>
                        <Typography variant="body2">
                          Purchase Order - PO #{emailDialog.po.POId}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Box sx={{ 
                p: 2, 
                background: 'rgba(255, 152, 0, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(255, 152, 0, 0.3)',
                mb: 3
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#ff9800', mb: 1 }}>
                  📎 How to attach the PDF:
                </Typography>
                <Typography variant="body2" component="div" sx={{ pl: 2 }}>
                  <ol style={{ margin: 0, paddingLeft: 20 }}>
                    <li>Click "Open Email Client" below</li>
                    <li>PDF will be downloaded automatically</li>
                    <li>Your email client will open with recipient and subject pre-filled</li>
                    <li>Attach the downloaded file: <strong>PO_{emailDialog.po.POId}.pdf</strong> from your Downloads folder</li>
                    <li>Review and send the email</li>
                  </ol>
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, justifyContent: 'space-between', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => emailDialog.pdfUrl && handleDownloadPDFForEmail(emailDialog.pdfUrl, emailDialog.po?.POId)}
            sx={{
              borderColor: '${theme.palette.success.main}',
              color: '${theme.palette.success.main}',
              '&:hover': {
                borderColor: '${theme.palette.success.dark}',
                background: '${alpha(theme.palette.success.main, 0.05)'
              }
            }}
          >
            Download PDF Again
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                if (emailDialog.pdfUrl) {
                  URL.revokeObjectURL(emailDialog.pdfUrl);
                }
                setEmailDialog({ open: false, po: null, pdfBlob: null, pdfUrl: null });
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<EmailIcon />}
              onClick={() => emailDialog.po && emailDialog.pdfUrl && handleOpenEmailClient(emailDialog.po, emailDialog.pdfUrl)}
              sx={{
                background: 'linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})',
                px: 3,
                '&:hover': {
                  background: 'linear-gradient(135deg, ${theme.palette.success.dark}, #0d47a1)'
                }
              }}
            >
              Open Email Client
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Download Dialog */}
      <Dialog
        open={downloadDialog.open}
        onClose={() => {
          if (downloadDialog.status === 'completed') {
            setDownloadDialog({ open: false, po: null, progress: 0, status: 'preparing' });
          }
        }}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Zoom}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px ${alpha(theme.palette.success.main, 0.3)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PictureAsPdfIcon sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Downloading Purchase Order
              </Typography>
              {downloadDialog.po && (
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  {downloadDialog.po.POId}
                </Typography>
              )}
            </Box>
          </Box>
          {downloadDialog.status === 'completed' && (
            <IconButton
              onClick={() => setDownloadDialog({ open: false, po: null, progress: 0, status: 'preparing' })}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        
        <DialogContent sx={{ p: 4, textAlign: 'center' }}>
          {downloadDialog.status === 'completed' ? (
            <Fade in={true}>
              <Box>
                <Box sx={{ 
                  width: 100, 
                  height: 100, 
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  boxShadow: '0 4px 20px rgba(76, 175, 80, 0.4)'
                }}>
                  <CheckCircleIcon sx={{ fontSize: 60, color: 'white' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#4caf50', mb: 1 }}>
                  Download Complete!
                </Typography>
                <Typography variant="body1" sx={{ color: '#666', mb: 2 }}>
                  Your Purchase Order PDF has been downloaded successfully.
                </Typography>
                {downloadDialog.po && (
                  <Chip 
                    label={`PO_${downloadDialog.po.POId}.pdf`}
                    icon={<PictureAsPdfIcon />}
                    sx={{ 
                      background: '${alpha(theme.palette.success.main, 0.1)',
                      color: '${theme.palette.success.main}',
                      fontWeight: 600
                    }}
                  />
                )}
              </Box>
            </Fade>
          ) : (
            <Box>
              <Box sx={{ 
                width: 120, 
                height: 120, 
                borderRadius: '50%',
                background: 'linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1), ${alpha(theme.palette.success.dark, 0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                position: 'relative'
              }}>
                <CircularProgress 
                  variant="determinate" 
                  value={downloadDialog.progress} 
                  size={100}
                  thickness={4}
                  sx={{
                    color: '${theme.palette.success.main}',
                    position: 'absolute'
                  }}
                />
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PictureAsPdfIcon sx={{ fontSize: 40, color: '${theme.palette.success.main}' }} />
                </Box>
              </Box>
              
              <Typography variant="h6" sx={{ fontWeight: 600, color: '${theme.palette.success.main}', mb: 1 }}>
                {downloadDialog.status === 'preparing' && 'Preparing PDF...'}
                {downloadDialog.status === 'generating' && 'Generating PDF...'}
                {downloadDialog.status === 'finalizing' && 'Finalizing document...'}
                {downloadDialog.status === 'downloading' && 'Downloading file...'}
              </Typography>
              
              <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
                {downloadDialog.progress}% Complete
              </Typography>
              
              <LinearProgress 
                variant="determinate" 
                value={downloadDialog.progress} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  background: '${alpha(theme.palette.success.main, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, ${theme.palette.success.main}, #42a5f5)',
                    borderRadius: 4
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>
        
        {downloadDialog.status === 'completed' && (
          <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => setDownloadDialog({ open: false, po: null, progress: 0, status: 'preparing' })}
              sx={{
                background: 'linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})',
                px: 4,
                py: 1.5,
                '&:hover': {
                  background: 'linear-gradient(135deg, ${theme.palette.success.dark}, #0d47a1)'
                }
              }}
            >
              Done
            </Button>
          </DialogActions>
        )}
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: 2
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PlacePO; 