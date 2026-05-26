import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Check as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import * as db from '../../lib/db';
import config from '../../config/config';

const SheetInitializer = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const handleInitialize = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const sheetDefinitions = {
        [config.sheets.purchaseFlow]: [
          'FlowId', 'IndentNumber', 'ItemName', 'Quantity', 'Specifications',
          'CurrentStep', 'Status', 'CreatedBy', 'CreatedAt', 'UpdatedAt',
          'ExpectedDelivery', 'Priority', 'Department', 'Budget', 'VendorDetails',
          'Documents', 'Comments', 'TATBreaches', 'ApprovalChain', 'FinalAmount',
          'PaymentStatus', 'LastModifiedBy'
        ],
        [config.sheets.purchaseFlowSteps]: [
          'StepId', 'FlowId', 'StepNumber', 'Role', 'Action', 'Status',
          'AssignedTo', 'StartTime', 'EndTime', 'TAT', 'TATStatus', 'Documents',
          'Comments', 'ApprovalStatus', 'RejectionReason', 'NextStep',
          'PreviousStep', 'Dependencies', 'LastModifiedBy', 'LastModifiedAt'
        ],
        [config.sheets.purchaseFlowDocuments]: [
          'DocumentId', 'FlowId', 'StepId', 'DocumentType', 'FileName', 'FileUrl',
          'UploadedBy', 'UploadedAt', 'Version', 'Status', 'Comments',
          'LastModifiedBy', 'LastModifiedAt'
        ],
        [config.sheets.purchaseFlowVendors]: [
          'VendorId', 'FlowId', 'VendorName', 'ContactPerson', 'Email', 'Phone',
          'Address', 'QuotationAmount', 'QuotationDate', 'DeliveryTime',
          'PaymentTerms', 'Status', 'Rating', 'LastModifiedBy', 'LastModifiedAt'
        ],
        [config.sheets.purchaseFlowApprovals]: [
          'ApprovalId', 'FlowId', 'StepId', 'ApproverRole', 'ApproverName',
          'ApprovalStatus', 'ApprovalDate', 'Comments', 'RejectionReason',
          'LastModifiedBy', 'LastModifiedAt'
        ],
        [config.sheets.purchaseFlowPayments]: [
          'PaymentId', 'FlowId', 'InvoiceNumber', 'InvoiceDate', 'Amount',
          'DueDate', 'PaymentStatus', 'PaymentDate', 'PaymentMethod',
          'TransactionId', 'ApprovedBy', 'ApprovalDate', 'Comments',
          'LastModifiedBy', 'LastModifiedAt'
        ],
        [config.sheets.vendor]: [
          'SKU Code', 'SKU Description', 'Category', 'UOM', 'Vendor Name',
          'Alternate Vendors', 'Vendor Code', 'Vendor Contact', 'Vendor Email',
          'Address', 'State', 'State Code', 'A/C Code', 'GSTIN', 'PAN No.',
          'MOQ', 'Lead Time (Days)', 'Last Purchase Rate (₹)', 'Rate Validity',
          'Payment Terms', 'Remarks',
        ],
        [config.sheets.placePO]: [
          'POId', 'IndentNumber', 'ItemName', 'Specifications', 'VendorCode',
          'Price', 'DeliveryTime', 'Terms', 'LeadTime', 'VendorName',
          'VendorContact', 'VendorEmail', 'PlacedAt', 'PODocumentId',
        ],
        [config.sheets.materialApproval]: [
          'IndentNumber', 'ItemName', 'Specifications', 'Quantity', 'Price',
          'VendorCode', 'VendorName', 'VendorContact', 'VendorEmail', 'Status',
          'ApprovalDate', 'ApprovedBy', 'RejectionNote',
        ],
        [config.sheets.followUpQuotations]: [
          'IndentNumber', 'Vendor', 'QuotationDocument', 'CreatedBy', 'CreatedAt',
        ],
        [config.sheets.inspectMaterial]: [
          'IndentNumber', 'ItemName', 'Specifications', 'Quantity', 'Price',
          'VendorCode', 'VendorName', 'VendorContact', 'VendorEmail',
          'DCDocumentId', 'InvoiceDocumentId', 'PODocumentId', 'InspectionDate',
          'InspectedBy', 'Status',
        ],
        [config.sheets.generateGrn]: [
          'GRNId', 'IndentNumber', 'ItemName', 'Specifications', 'Quantity',
          'Price', 'VendorCode', 'VendorName', 'VendorContact', 'VendorEmail',
          'DCDocumentId', 'InvoiceDocumentId', 'PODocumentId', 'InspectionDate',
          'InspectedBy', 'GRNDate', 'GeneratedBy', 'GRNDocumentId', 'Status',
        ],
        [config.sheets.initialCall]: [
          'LogId', 'FullName', 'CompanyName', 'Email', 'PhoneNumber',
          'ProductsInterested', 'LeadSource', 'Priority', 'QualificationStatus',
          'Notes', 'Needs', 'ContactedBy', 'ContactedAt', 'Status'
        ],
        [config.sheets.evaluateHighValueProspects]: [
          'logId', 'fullName', 'companyName', 'email', 'phoneNumber',
          'productsInterested', 'leadSource', 'priority', 'qualificationStatus',
          'notes', 'evaluationValue', 'evaluationNotes', 'evaluatedBy',
          'evaluatedAt', 'status'
        ],
        // ✅ Employee Management Sheets (from features/update)
        [config.sheets.employees]: [
          'EmployeeCode', 'EmployeeName', 'Email', 'Phone', 'Department',
          'Designation', 'JoiningDate', 'DateOfBirth', 'Address', 'Status',
          'EmployeeType', 'ReportingManager', 'SalaryGrade',
          'HighestQualification', 'University', 'GraduationYear',
          'Specialization', 'Experience', 'Skills', 'Certifications',
          'EmployeeId', 'CreatedAt', 'UpdatedAt'
        ],
        [config.sheets.timeTracking]: [
          'EmployeeCode', 'Date', 'ClockIn', 'ClockOut', 'Status',
          'WorkingHours', 'BreakTime', 'OvertimeHours', 'Location', 'Notes',
          'CreatedAt'
        ],
        [config.sheets.attendance]: [
          'EmployeeCode', 'Date', 'Status', 'ClockIn', 'ClockOut',
          'WorkingHours', 'BreakTime', 'OvertimeHours', 'LeaveType',
          'LeaveReason', 'ApprovedBy', 'Notes', 'Remarks', 'CreatedAt'
        ],
        [config.sheets.performance]: [
          'EmployeeCode', 'Date', 'Metric', 'Score', 'Target', 'Achievement',
          'Category', 'ReviewPeriod', 'ReviewedBy', 'Comments',
          'ImprovementAreas', 'Goals', 'CreatedAt'
        ],
        [config.sheets.employeeTasks]: [
          'TaskId', 'TaskTitle', 'TaskDescription', 'AssignedTo', 'AssignedBy',
          'Priority', 'Status', 'StartDate', 'DueDate', 'CompletedDate',
          'EstimatedHours', 'ActualHours', 'Progress', 'Category', 'Project',
          'Notes', 'CreatedAt', 'UpdatedAt'
        ],
        [config.sheets.notifications]: [
          'Id', 'EmployeeCode', 'Title', 'Message', 'Type', 'Priority', 'Read',
          'ReadAt', 'ActionRequired', 'ActionUrl', 'ExpiryDate', 'CreatedBy',
          'CreatedAt'
        ],
        [config.sheets.checkFeasibility]: [
          'LogId', 'FullName', 'CompanyName', 'Email', 'PhoneNumber',
          'Requirement', 'LeadSource', 'Priority', 'QualificationStatus',
          'Notes', 'FeasibilityStatus', 'FeasibilityNotes', 'CheckedBy',
          'CheckedAt', 'Status'
        ],
        [config.sheets.approvePaymentTerms]: [
          'LogId', 'CustomerName', 'CompanyName', 'Email', 'PhoneNumber',
          'ProductsInterested', 'Requirement', 'QuotationDocumentId',
          'TotalAmount', 'PaymentMethod', 'EstimatedPaymentDate',
          'PaymentTerms', 'Notes', 'ApprovedBy', 'ApprovedAt', 'Status'
        ],
        [config.sheets.sampleSubmission]: [
          'LogId', 'CustomerName', 'CompanyName', 'Email', 'PhoneNumber',
          'ProductsInterested', 'Requirement', 'QuotationDocumentId',
          'TotalAmount', 'SampleType', 'SampleMethod', 'SampleNotes',
          'SubmittedBy', 'SubmittedAt', 'Status'
        ],
        [config.sheets.getApprovalForSample]: [
          'LogId', 'CustomerName', 'CompanyName', 'Email', 'PhoneNumber',
          'ProductsInterested', 'Requirement', 'QuotationDocumentId',
          'TotalAmount', 'SampleType', 'SampleMethod', 'SampleSubmittedAt',
          'SampleApprovalStatus', 'ApprovalNotes', 'ApprovedBy', 'ApprovedAt',
          'Status'
        ],
        [config.sheets.approveStrategicDeals]: [
          'LogId', 'CustomerName', 'CompanyName', 'Email', 'PhoneNumber',
          'ProductsInterested', 'Requirement', 'QuotationDocumentId',
          'TotalAmount', 'SampleType', 'SampleMethod', 'SampleSubmittedAt',
          'SampleApprovalStatus', 'SampleApprovalNotes',
          'StrategicDealApprovalStatus', 'StrategicDealNotes', 'ApprovedBy',
          'ApprovedAt', 'Status'
        ],
      };

      const results = [];
      for (const [sheetName, headers] of Object.entries(sheetDefinitions)) {
        try {
          const tableName = db.getTableName(sheetName);
          const rows = await db.getTableRows(tableName);
          if (rows.length === 0 && headers?.length) {
            const headerRow = Object.fromEntries((headers || []).map((h) => [h, '']));
            await db.insertTableRow(tableName, headerRow);
          }
          results.push({ sheet: sheetName, status: 'created', message: 'Initialized' });
        } catch (err) {
          results.push({ sheet: sheetName, status: 'error', message: err.message });
        }
      }
      setResults(results);
    } catch (error) {
      console.error('Error initializing sheets:', error);
      setError(error.message || 'Failed to initialize sheets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', my: 4 }}>
      <Typography variant="h5" gutterBottom>
        Database initializer
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Tables are managed by Supabase migrations. This page only verifies table access.
      </Alert>
      <Typography variant="body1" paragraph>
        This tool verifies that required data tables exist and are accessible.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={handleInitialize}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
        sx={{ mb: 3 }}
      >
        {loading ? 'Initializing...' : 'Initialize tables'}
      </Button>

      {results.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>
            Initialization Results
          </Typography>
          <List>
            {results.map((result, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {result.status === 'created' ? (
                    <CheckIcon color="success" />
                  ) : result.status === 'error' ? (
                    <ErrorIcon color="error" />
                  ) : (
                    <CheckIcon color="info" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={result.sheet}
                  secondary={result.message}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Paper>
  );
};

export default SheetInitializer;
