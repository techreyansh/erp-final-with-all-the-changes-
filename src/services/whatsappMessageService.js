/**
 * WhatsApp Message Service
 * Generates WhatsApp-ready messages with placeholders
 * NO API integration - only generates messages and URLs
 */

import { getAllClients } from './clientService';

class WhatsAppMessageService {
  constructor() {
    this.companyName = 'Reyansh Industries'; // Can be made configurable
    this.baseTrackingUrl = 'https://tracking.reyansh.com'; // Can be made configurable
  }

  /**
   * Get default message template for a workflow stage
   * Supports: Production Flow, Sales Flow, Purchase Flow, Dispatch
   */
  getDefaultTemplate(stageName, status) {
    const templates = {
      // ========== SALES FLOW TEMPLATES ==========
      'LOG_AND_QUALIFY_LEADS': {
        NEW: `Hello {CustomerName},

Thank you for your interest! We have received your enquiry (ID: {OrderID}).
Status: Lead Logged
Next step: Initial call and requirement gathering

We'll contact you shortly.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Your enquiry (ID: {OrderID}) has been qualified.
Status: Lead Qualified ✓
Next step: Initial call scheduled

Our team will reach out to you soon.
Thank you,
{CompanyName}`
      },
      'INITIAL_CALL': {
        NEW: `Hello {CustomerName},

We have scheduled an initial call to discuss your requirements for enquiry {OrderID}.
Status: Call Scheduled
Next step: Requirement gathering

Looking forward to speaking with you.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Thank you for the initial call regarding enquiry {OrderID}.
Status: Requirements Gathered ✓
Next step: Evaluation and feasibility check

We'll review your requirements and get back to you.
Thank you,
{CompanyName}`
      },
      'EVALUATE_PROSPECTS': {
        NEW: `Hello {CustomerName},

Your enquiry {OrderID} is being evaluated as a high-value prospect.
Status: Under Evaluation
Next step: Detailed feasibility analysis

We'll update you on the evaluation results.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Your enquiry {OrderID} has been evaluated.
Status: Evaluation Complete ✓
Next step: Feasibility check

Our team is proceeding with feasibility analysis.
Thank you,
{CompanyName}`
      },
      'CHECK_FEASIBILITY': {
        NEW: `Hello {CustomerName},

We are checking the feasibility of your requirements for enquiry {OrderID}.
Status: Feasibility Check In Progress
Next step: Standards confirmation

This may take 1-2 days.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Feasibility check completed for enquiry {OrderID}.
Status: {CurrentStatus}
Next step: {NextStep}

{FeasibilityStatus === 'Feasible' ? 'Great news! Your requirements are feasible. We will proceed with quotation preparation.' : 'We need to discuss some modifications to your requirements.'}

Thank you,
{CompanyName}`
      },
      'CONFIRM_STANDARDS': {
        NEW: `Hello {CustomerName},

We are confirming standards and compliance for enquiry {OrderID}.
Status: Standards Verification
Next step: Quotation preparation

Ensuring all quality standards are met.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Standards confirmed for enquiry {OrderID}.
Status: Standards Verified ✓
Next step: Quotation will be sent shortly

We'll send you a detailed quotation soon.
Thank you,
{CompanyName}`
      },
      'SEND_QUOTATION': {
        NEW: `Hello {CustomerName},

We are preparing your quotation for enquiry {OrderID}.
Status: Quotation Being Prepared
Next step: Quotation review and approval

You'll receive the quotation shortly.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Your quotation for enquiry {OrderID} has been sent!
Status: Quotation Sent ✓
Next step: Payment terms approval

Please review the quotation and let us know if you have any questions.
Thank you,
{CompanyName}`
      },
      'APPROVE_PAYMENT_TERMS': {
        NEW: `Hello {CustomerName},

Payment terms for enquiry {OrderID} are under approval.
Status: Payment Terms Review
Next step: Approval decision

We'll update you once approved.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Payment terms approved for enquiry {OrderID}.
Status: Payment Terms Approved ✓
Next step: Sample submission (if applicable)

We can now proceed with sample preparation.
Thank you,
{CompanyName}`
      },
      'SAMPLE_SUBMISSION': {
        NEW: `Hello {CustomerName},

We are preparing a sample for enquiry {OrderID}.
Status: Sample Preparation
Next step: Sample delivery

Sample will be ready soon.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Sample for enquiry {OrderID} has been submitted.
Status: Sample Submitted ✓
Next step: Awaiting your approval

Please review the sample and provide your feedback.
Thank you,
{CompanyName}`
      },
      'GET_SAMPLE_APPROVAL': {
        NEW: `Hello {CustomerName},

We are awaiting your approval for the sample submitted for enquiry {OrderID}.
Status: Awaiting Sample Approval
Next step: Your feedback

Please review and approve the sample.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Sample approved for enquiry {OrderID}!
Status: Sample Approved ✓
Next step: Strategic deal approval

We'll proceed with order booking.
Thank you,
{CompanyName}`
      },
      'APPROVE_STRATEGIC_DEALS': {
        NEW: `Hello {CustomerName},

Your enquiry {OrderID} is under strategic review.
Status: Strategic Review
Next step: Management approval

This is a high-value deal and requires management approval.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Strategic approval granted for enquiry {OrderID}!
Status: Approved ✓
Next step: Order booking

We're ready to proceed with order booking.
Thank you,
{CompanyName}`
      },
      'ORDER_BOOKING': {
        NEW: `Hello {CustomerName},

We are processing your order booking for enquiry {OrderID}.
Status: Order Booking In Progress
Next step: Order confirmation

Your order is being finalized.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

🎉 Your order has been booked! (Order ID: {OrderID})
Status: Order Confirmed ✓
Next step: Manufacturing planning

We'll start production planning immediately.
Thank you for your business!
{CompanyName}`
      },
      'PLAN_MANUFACTURING': {
        NEW: `Hello {CustomerName},

Manufacturing planning has started for order {OrderID}.
Status: Production Planning
Next step: Material procurement and scheduling

We'll keep you updated on progress.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Manufacturing plan ready for order {OrderID}.
Status: Production Plan Complete ✓
Next step: Production execution

Production will begin shortly.
Thank you,
{CompanyName}`
      },
      'PACK_DISPATCH': {
        NEW: `Hello {CustomerName},

Your order {OrderID} is being packed for dispatch.
Status: Packing In Progress
Next step: Dispatch preparation

Order will be dispatched soon.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Your order {OrderID} has been dispatched!
Status: Dispatched ✓
Expected delivery: {DeliveryDate}

Track your order: {TrackingLink}
Thank you,
{CompanyName}`
      },
      'GENERATE_INVOICE': {
        NEW: `Hello {CustomerName},

Invoice is being generated for order {OrderID}.
Status: Invoice Preparation
Next step: Invoice will be sent shortly

Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Invoice generated for order {OrderID}.
Status: Invoice Sent ✓
Amount: {InvoiceAmount}

Please process payment as per terms.
Thank you,
{CompanyName}`
      },
      'FOLLOW_UP_PAYMENT': {
        NEW: `Hello {CustomerName},

This is a friendly reminder regarding payment for order {OrderID}.
Status: Payment Pending
Amount: {InvoiceAmount}
Due Date: {DueDate}

Please process payment at your earliest convenience.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Thank you! Payment received for order {OrderID}.
Status: Payment Received ✓

We appreciate your prompt payment.
Thank you,
{CompanyName}`
      },
      // ========== PURCHASE FLOW TEMPLATES ==========
      'RAISE_INDENT': {
        NEW: `Hello,

A new purchase indent has been raised.
Indent Number: {OrderID}
Status: Indent Created
Next step: Approval process

Please review and approve.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

Indent {OrderID} has been submitted for approval.
Status: Submitted ✓
Next step: Process Coordinator review

Awaiting approval.
Thank you,
{CompanyName}`
      },
      'APPROVE_INDENT': {
        NEW: `Hello,

Indent {OrderID} is pending your approval.
Status: Awaiting Approval
Next step: Your decision

Please review and approve/reject.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

Indent {OrderID} has been {ApprovalStatus}.
Status: {ApprovalStatus} ✓
Next step: {NextStep}

{ApprovalStatus === 'Approved' ? 'Proceeding with RFQ process.' : 'Please review and resubmit.'}
Thank you,
{CompanyName}`
      },
      'FLOAT_RFQ': {
        NEW: `Hello,

RFQ has been floated for indent {OrderID}.
Status: RFQ Sent to Vendors
Next step: Vendor quotations

Vendors will respond with quotations.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

RFQ process completed for indent {OrderID}.
Status: RFQ Complete ✓
Next step: Follow-up for quotations

Awaiting vendor responses.
Thank you,
{CompanyName}`
      },
      'FOLLOWUP_QUOTATIONS': {
        NEW: `Hello,

Following up with vendors for quotations on indent {OrderID}.
Status: Follow-up In Progress
Next step: Collect quotations

We'll update you once quotations are received.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

Quotation follow-up completed for indent {OrderID}.
Status: Quotations Received ✓
Next step: Comparative statement preparation

Proceeding with vendor comparison.
Thank you,
{CompanyName}`
      },
      'COMPARATIVE_STATEMENT': {
        NEW: `Hello,

Comparative statement is being prepared for indent {OrderID}.
Status: Analysis In Progress
Next step: Vendor comparison

We'll share the comparison shortly.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

Comparative statement ready for indent {OrderID}.
Status: Statement Complete ✓
Next step: Quotation approval

Ready for management review.
Thank you,
{CompanyName}`
      },
      'APPROVE_QUOTATION': {
        NEW: `Hello,

Quotation approval pending for indent {OrderID}.
Status: Awaiting Approval
Next step: Management decision

Please review and approve quotation.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

Quotation approved for indent {OrderID}.
Status: Approved ✓
Next step: Sample request (if needed)

Proceeding with procurement.
Thank you,
{CompanyName}`
      },
      'REQUEST_SAMPLE': {
        NEW: `Hello,

Sample requested from vendor for indent {OrderID}.
Status: Sample Requested
Next step: Vendor to send sample

Sample will arrive in 3-5 days.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

Sample request sent for indent {OrderID}.
Status: Request Sent ✓
Next step: Sample inspection upon arrival

Awaiting sample delivery.
Thank you,
{CompanyName}`
      },
      'INSPECT_SAMPLE': {
        NEW: `Hello,

Sample received for indent {OrderID} - inspection in progress.
Status: QC Inspection
Next step: Quality check

Sample will be inspected shortly.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

Sample inspection completed for indent {OrderID}.
Status: {InspectionResult} ✓
Next step: {NextStep}

{InspectionResult === 'Approved' ? 'Sample approved. Proceeding with PO.' : 'Sample rejected. Vendor will resend.'}
Thank you,
{CompanyName}`
      },
      'SORT_VENDORS': {
        NEW: `Hello,

Vendor sorting in progress for indent {OrderID}.
Status: Vendor Evaluation
Next step: Final vendor selection

Selecting best vendor based on criteria.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

Vendor selected for indent {OrderID}.
Status: Vendor Selected ✓
Next step: Place purchase order

Proceeding with PO creation.
Thank you,
{CompanyName}`
      },
      'PLACE_PO': {
        NEW: `Hello,

Purchase order is being created for indent {OrderID}.
Status: PO Preparation
Next step: PO will be sent to vendor

PO will be finalized shortly.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

Purchase order placed for indent {OrderID}!
Status: PO Placed ✓
PO Number: {PONumber}
Next step: Follow-up for delivery

Vendor will deliver as per PO terms.
Thank you,
{CompanyName}`
      },
      'FOLLOWUP_DELIVERY': {
        NEW: `Hello,

Following up with vendor for delivery of PO {OrderID}.
Status: Delivery Follow-up
Next step: Vendor to confirm delivery date

We'll update you on delivery status.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

Delivery follow-up completed for PO {OrderID}.
Status: Delivery Scheduled ✓
Expected Date: {DeliveryDate}

Material will arrive on scheduled date.
Thank you,
{CompanyName}`
      },
      'RECEIVE_MATERIAL': {
        NEW: `Hello,

Material received for PO {OrderID} - inspection in progress.
Status: Material Received
Next step: Quality inspection

Material is being inspected.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

Material received and inspected for PO {OrderID}.
Status: Inspection Complete ✓
Next step: Material approval

Awaiting QC approval.
Thank you,
{CompanyName}`
      },
      'MATERIAL_APPROVAL': {
        NEW: `Hello,

Material approval pending for PO {OrderID}.
Status: QC Review
Next step: Approval decision

QC team is reviewing the material.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

Material {ApprovalStatus} for PO {OrderID}.
Status: {ApprovalStatus} ✓
Next step: {NextStep}

{ApprovalStatus === 'Approved' ? 'Material approved. GRN will be generated.' : 'Material rejected. Return process will be initiated.'}
Thank you,
{CompanyName}`
      },
      'DECISION_ON_REJECTION': {
        NEW: `Hello,

Decision required on rejected material for PO {OrderID}.
Status: Decision Pending
Next step: Return or resend decision

Please decide on next action.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

Decision made for PO {OrderID} rejected material.
Status: Decision Complete ✓
Action: {Decision}
Next step: {NextStep}

Proceeding with {Decision}.
Thank you,
{CompanyName}`
      },
      'RETURN_REJECTED_MATERIAL': {
        NEW: `Hello,

Rejected material return process started for PO {OrderID}.
Status: Return In Progress
Next step: Material will be returned to vendor

Return documentation being prepared.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

Rejected material returned for PO {OrderID}.
Status: Returned ✓
Next step: Vendor to resend material

Vendor will send replacement material.
Thank you,
{CompanyName}`
      },
      'RESEND_MATERIAL': {
        NEW: `Hello,

Vendor will resend material for PO {OrderID}.
Status: Resend Requested
Next step: Awaiting replacement material

Replacement material will arrive in 3-5 days.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

Resend request sent to vendor for PO {OrderID}.
Status: Request Sent ✓
Next step: Receive replacement material

Awaiting replacement delivery.
Thank you,
{CompanyName}`
      },
      'GENERATE_GRN': {
        NEW: `Hello,

GRN is being generated for PO {OrderID}.
Status: GRN Preparation
Next step: GRN will be finalized

GRN will be ready shortly.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

GRN generated for PO {OrderID}!
Status: GRN Generated ✓
GRN Number: {GRNNumber}
Next step: Final GRN

Material received and documented.
Thank you,
{CompanyName}`
      },
      'FINAL_GRN': {
        NEW: `Hello,

Final GRN is being prepared for PO {OrderID}.
Status: Final GRN In Progress
Next step: GRN finalization

Final GRN will be completed shortly.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

Final GRN completed for PO {OrderID}!
Status: Final GRN Complete ✓
Next step: Invoice submission

Procurement process complete.
Thank you,
{CompanyName}`
      },
      'SUBMIT_INVOICE': {
        NEW: `Hello,

Invoice submitted to accounts for PO {OrderID}.
Status: Invoice Submitted
Next step: Payment scheduling

Accounts will schedule payment.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

Invoice submitted for PO {OrderID}.
Status: Submitted ✓
Next step: Payment will be scheduled

Payment will be processed as per terms.
Thank you,
{CompanyName}`
      },
      'SCHEDULE_PAYMENT': {
        NEW: `Hello,

Payment is being scheduled for PO {OrderID}.
Status: Payment Scheduling
Next step: Payment schedule will be finalized

Payment will be scheduled as per credit terms.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

Payment scheduled for PO {OrderID}.
Status: Scheduled ✓
Due Date: {DueDate}
Amount: {Amount}

Payment will be released on due date.
Thank you,
{CompanyName}`
      },
      'RELEASE_PAYMENT': {
        NEW: `Hello,

Payment release is being processed for PO {OrderID}.
Status: Payment Processing
Next step: Payment will be released

Payment will be processed shortly.
Thank you,
{CompanyName}`,
        COMPLETED: `Hello,

Payment released for PO {OrderID}!
Status: Payment Released ✓
Amount: {Amount}
Transaction ID: {TransactionId}

Payment process complete.
Thank you,
{CompanyName}`
      },
      // ========== PRODUCTION FLOW TEMPLATES (Already defined) ==========
      'STORE1': {
        NEW: `Hello {CustomerName},

Your order (ID: {OrderID}) has been received and is now in Store 1.
Status: Material Received
Next step: Material verification and quality check

Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Your order (ID: {OrderID}) has completed Store 1 processing.
Status: Material Verified ✓
Next step: Moving to {NextStep}

Thank you,
{CompanyName}`
      },
      'CABLE_PRODUCTION': {
        NEW: `Hello {CustomerName},

Your order (ID: {OrderID}) has entered Cable Production stage.
Status: Production Started
Next step: Cable manufacturing in progress

Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Your order (ID: {OrderID}) has completed Cable Production.
Status: Production Complete ✓
Next step: Moving to {NextStep}

Thank you,
{CompanyName}`
      },
      'STORE2': {
        NEW: `Hello {CustomerName},

Your order (ID: {OrderID}) has entered Store 2.
Status: Intermediate Storage
Next step: Material preparation for next stage

Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Your order (ID: {OrderID}) has completed Store 2 processing.
Status: Ready for Next Stage ✓
Next step: Moving to {NextStep}

Thank you,
{CompanyName}`
      },
      'MOULDING': {
        NEW: `Hello {CustomerName},

Your order (ID: {OrderID}) has entered Moulding Production.
Status: Moulding Started
Next step: Power cord moulding in progress

Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Your order (ID: {OrderID}) has completed Moulding Production.
Status: Moulding Complete ✓
Next step: Moving to {NextStep}

Thank you,
{CompanyName}`
      },
      'FG_SECTION': {
        NEW: `Hello {CustomerName},

Your order (ID: {OrderID}) has entered Finished Goods Section.
Status: Final Processing
Next step: Quality check and packaging

Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Your order (ID: {OrderID}) has completed Finished Goods processing.
Status: Ready for Dispatch ✓
Next step: Moving to Dispatch

Thank you,
{CompanyName}`
      },
      'DISPATCH': {
        NEW: `Hello {CustomerName},

Your order (ID: {OrderID}) is ready for dispatch.
Status: Dispatching Soon
Next step: Preparing for shipment

Track your order: {TrackingLink}

Thank you,
{CompanyName}`,
        COMPLETED: `Hello {CustomerName},

Great news! Your order (ID: {OrderID}) has been dispatched.
Status: Dispatched ✓
Expected delivery: {DeliveryDate}

Track your order: {TrackingLink}

Thank you,
{CompanyName}`
      },
      'DELIVERED': {
        COMPLETED: `Hello {CustomerName},

Your order (ID: {OrderID}) has been delivered successfully!
Status: Delivered ✓

We hope you're satisfied with your purchase. If you need any assistance, please don't hesitate to contact us.

Thank you for choosing {CompanyName}!`
      },
      'DELAYED': {
        NEW: `Hello {CustomerName},

We wanted to inform you that your order (ID: {OrderID}) is experiencing a delay.
Status: Delayed
Reason: {DelayReason}
New expected date: {NewDueDate}

We apologize for any inconvenience and will keep you updated.

Thank you,
{CompanyName}`
      },
      'ISSUE_RAISED': {
        NEW: `Hello {CustomerName},

We have received an issue report for your order (ID: {OrderID}).
Status: Issue Reported
Issue: {IssueDescription}
Our team is investigating and will update you shortly.

Thank you,
{CompanyName}`
      }
    };

    return templates[stageName]?.[status] || this.getGenericTemplate(stageName, status);
  }

  /**
   * Generic template fallback
   */
  getGenericTemplate(stageName, status) {
    const statusText = status === 'COMPLETED' ? 'completed' : 'in progress';
    return `Hello {CustomerName},

Your order (ID: {OrderID}) status has been updated.
Current Status: {CurrentStatus}
Next step: {NextStep}

Thank you,
{CompanyName}`;
  }

  /**
   * Replace placeholders in message template
   */
  replacePlaceholders(template, data) {
    let message = template;
    
    // Replace all placeholders
    message = message.replace(/{OrderID}/g, data.orderId || 'N/A');
    message = message.replace(/{CustomerName}/g, data.customerName || 'Valued Customer');
    message = message.replace(/{CurrentStatus}/g, data.currentStatus || 'Updated');
    message = message.replace(/{NextStep}/g, data.nextStep || 'Processing');
    message = message.replace(/{CompanyName}/g, data.companyName || this.companyName);
    message = message.replace(/{TrackingLink}/g, data.trackingLink || this.baseTrackingUrl);
    message = message.replace(/{DeliveryDate}/g, data.deliveryDate || 'TBD');
    message = message.replace(/{DelayReason}/g, data.delayReason || 'Processing delay');
    message = message.replace(/{NewDueDate}/g, data.newDueDate || 'TBD');
    message = message.replace(/{IssueDescription}/g, data.issueDescription || 'Issue reported');
    
    return message;
  }

  /**
   * Generate message for a workflow stage
   */
  generateMessage(task, stageName, status, additionalData = {}) {
    // Get template
    const template = this.getDefaultTemplate(stageName, status);
    
    // Determine next step
    const nextStep = this.getNextStepName(stageName);
    
    // Build data object
    const data = {
      orderId: task.POId || task.DispatchUniqueId || task.orderId || 'N/A',
      customerName: task.ClientName || task.customerName || 'Valued Customer',
      currentStatus: this.getStatusDisplayName(stageName, status),
      nextStep: nextStep,
      companyName: this.companyName,
      trackingLink: `${this.baseTrackingUrl}/order/${task.POId || task.DispatchUniqueId}`,
      deliveryDate: task.DispatchDate || task.deliveryDate || 'TBD',
      ...additionalData
    };
    
    // Replace placeholders
    return this.replacePlaceholders(template, data);
  }

  /**
   * Get next step display name
   */
  getNextStepName(currentStage) {
    const stageMap = {
      // Production Flow
      'STORE1': 'Cable Production',
      'CABLE_PRODUCTION': 'Store 2',
      'STORE2': 'Moulding Production',
      'MOULDING': 'Finished Goods Section',
      'FG_SECTION': 'Dispatch',
      'DISPATCH': 'Delivery',
      'DELIVERED': 'Completed',
      // Sales Flow
      'LOG_AND_QUALIFY_LEADS': 'Initial Call',
      'INITIAL_CALL': 'Evaluate Prospects',
      'EVALUATE_PROSPECTS': 'Check Feasibility',
      'CHECK_FEASIBILITY': 'Confirm Standards',
      'CONFIRM_STANDARDS': 'Send Quotation',
      'SEND_QUOTATION': 'Approve Payment Terms',
      'APPROVE_PAYMENT_TERMS': 'Sample Submission',
      'SAMPLE_SUBMISSION': 'Get Sample Approval',
      'GET_SAMPLE_APPROVAL': 'Approve Strategic Deals',
      'APPROVE_STRATEGIC_DEALS': 'Order Booking',
      'ORDER_BOOKING': 'Plan Manufacturing',
      'PLAN_MANUFACTURING': 'Pack & Dispatch',
      'PACK_DISPATCH': 'Generate Invoice',
      'GENERATE_INVOICE': 'Follow-up Payment',
      'FOLLOW_UP_PAYMENT': 'Completed',
      // Purchase Flow
      'RAISE_INDENT': 'Approve Indent',
      'APPROVE_INDENT': 'Float RFQ',
      'FLOAT_RFQ': 'Follow-up Quotations',
      'FOLLOWUP_QUOTATIONS': 'Comparative Statement',
      'COMPARATIVE_STATEMENT': 'Approve Quotation',
      'APPROVE_QUOTATION': 'Request Sample',
      'REQUEST_SAMPLE': 'Inspect Sample',
      'INSPECT_SAMPLE': 'Sort Vendors',
      'SORT_VENDORS': 'Place PO',
      'PLACE_PO': 'Follow-up Delivery',
      'FOLLOWUP_DELIVERY': 'Receive Material',
      'RECEIVE_MATERIAL': 'Material Approval',
      'MATERIAL_APPROVAL': 'Generate GRN',
      'DECISION_ON_REJECTION': 'Return Material',
      'RETURN_REJECTED_MATERIAL': 'Resend Material',
      'RESEND_MATERIAL': 'Receive Material',
      'GENERATE_GRN': 'Final GRN',
      'FINAL_GRN': 'Submit Invoice',
      'SUBMIT_INVOICE': 'Schedule Payment',
      'SCHEDULE_PAYMENT': 'Release Payment',
      'RELEASE_PAYMENT': 'Completed'
    };
    
    return stageMap[currentStage] || 'Next Stage';
  }

  /**
   * Map Purchase Flow step number to stage name
   */
  getPurchaseFlowStageName(stepNumber) {
    const stepMap = {
      1: 'RAISE_INDENT',
      2: 'APPROVE_INDENT',
      3: 'FLOAT_RFQ',
      4: 'FOLLOWUP_QUOTATIONS',
      5: 'COMPARATIVE_STATEMENT',
      6: 'APPROVE_QUOTATION',
      7: 'REQUEST_SAMPLE',
      8: 'INSPECT_SAMPLE',
      9: 'SORT_VENDORS',
      10: 'PLACE_PO',
      11: 'FOLLOWUP_DELIVERY',
      12: 'RECEIVE_MATERIAL',
      13: 'MATERIAL_APPROVAL',
      14: 'DECISION_ON_REJECTION',
      15: 'RETURN_REJECTED_MATERIAL',
      16: 'RESEND_MATERIAL',
      17: 'GENERATE_GRN',
      18: 'FINAL_GRN',
      19: 'SUBMIT_INVOICE',
      20: 'SCHEDULE_PAYMENT',
      21: 'RELEASE_PAYMENT'
    };
    return stepMap[stepNumber] || 'RAISE_INDENT';
  }

  /**
   * Map Sales Flow step number to stage name
   */
  getSalesFlowStageName(stepNumber) {
    const stepMap = {
      1: 'LOG_AND_QUALIFY_LEADS',
      2: 'INITIAL_CALL',
      3: 'EVALUATE_PROSPECTS',
      4: 'CHECK_FEASIBILITY',
      5: 'CONFIRM_STANDARDS',
      6: 'SEND_QUOTATION',
      7: 'APPROVE_PAYMENT_TERMS',
      8: 'SAMPLE_SUBMISSION',
      9: 'GET_SAMPLE_APPROVAL',
      10: 'APPROVE_STRATEGIC_DEALS',
      11: 'ORDER_BOOKING',
      12: 'PLAN_MANUFACTURING',
      13: 'PACK_DISPATCH',
      14: 'GENERATE_INVOICE',
      15: 'FOLLOW_UP_PAYMENT'
    };
    return stepMap[stepNumber] || 'LOG_AND_QUALIFY_LEADS';
  }

  /**
   * Get status display name
   */
  getStatusDisplayName(stageName, status) {
    const stageDisplayNames = {
      'STORE1': 'Store 1',
      'CABLE_PRODUCTION': 'Cable Production',
      'STORE2': 'Store 2',
      'MOULDING': 'Moulding Production',
      'FG_SECTION': 'Finished Goods Section',
      'DISPATCH': 'Dispatch',
      'DELIVERED': 'Delivered'
    };
    
    const stageDisplay = stageDisplayNames[stageName] || stageName;
    const statusDisplay = status === 'COMPLETED' ? 'Completed' : 
                         status === 'NEW' ? 'Started' : 
                         status;
    
    return `${stageDisplay} - ${statusDisplay}`;
  }

  /**
   * Get client contacts for a task
   */
  async getClientContacts(clientCode) {
    try {
      const clients = await getAllClients();
      const client = clients.find(c => 
        c.clientCode === clientCode || 
        c.clientCode?.toLowerCase() === clientCode?.toLowerCase()
      );
      
      if (!client || !client.contacts || client.contacts.length === 0) {
        return [];
      }
      
      return client.contacts.map(contact => ({
        name: contact.name || 'Contact',
        phone: contact.number || '',
        email: contact.email || '',
        department: contact.department || '',
        designation: contact.designation || '',
        isPrimary: contact.isPrimary || false
      }));
    } catch (error) {
      console.error('Error fetching client contacts:', error);
      return [];
    }
  }

  /**
   * Generate WhatsApp URL
   */
  generateWhatsAppUrl(phoneNumber, message) {
    // Clean phone number (remove spaces, dashes, parentheses)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Ensure country code (default to +91 for India if not present)
    let formattedPhone = cleanPhone;
    if (!formattedPhone.startsWith('+')) {
      // If starts with 0, remove it
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
      }
      // Add +91 if doesn't start with country code
      if (!formattedPhone.startsWith('91')) {
        formattedPhone = '91' + formattedPhone;
      }
      formattedPhone = '+' + formattedPhone;
    }
    
    // Encode message
    const encodedMessage = encodeURIComponent(message);
    
    // Generate WhatsApp URL
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  }

  /**
   * Open WhatsApp in new tab
   */
  openWhatsApp(phoneNumber, message) {
    const url = this.generateWhatsAppUrl(phoneNumber, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export default new WhatsAppMessageService();
