# ROLE-BASED ACCESS CONTROL - COMPLETE DOCUMENTATION

## Available Roles in System

1. **CEO**
2. **Customer Relations Manager (CRM)**
3. **Production Manager**
4. **Process Coordinator**
5. **QC Manager**
6. **NPD (New Product Development)**
7. **Sales Executive**
8. **Store Manager**

---

## 📊 UPDATED ROLE ACCESS SUMMARY

### **CEO**
- **Access Level**: Full (100% of features)
- **Description**: Complete access to all modules, dashboards, workflows, and system tools
- **Key Features**: All dashboards, management modules, workflows, purchase/sales flow steps, inventory, document library, costing, and system tools

---

### **Customer Relations Manager (CRM)**
- **Access Level**: High (70% of features)
- **Description**: Comprehensive access to sales, client management, and dispatch operations
- **Key Features**: 
  - Client Dashboard
  - Products, Clients, Prospects Clients
  - Client Orders, Sales Order Ingestion
  - Dispatch Planning & Management
  - CRM Management
  - Order to Dispatch System
  - Sales Flow, Cable Production, Molding Production
  - Sales Flow Steps: Create Lead, Log & Qualify Leads, Get Approval for Sample, Order Booking

---

### **Production Manager**
- **Access Level**: Limited (20% of features)
- **Description**: Focused on production workflows and manufacturing processes
- **Key Features**:
  - Sales Flow
  - Molding Production
  - Access to production-related steps within Sales Flow

---

### **Process Coordinator**
- **Access Level**: Moderate (40% of features)
- **Description**: Coordinates purchase processes and order-to-dispatch workflows
- **Key Features**:
  - Main Dashboard
  - Order to Dispatch System
  - Purchase Flow
  - Purchase Flow Steps: Approve Indent

---

### **QC Manager**
- **Access Level**: Moderate (45% of features)
- **Description**: Handles quality control and material inspection processes
- **Key Features**:
  - Order to Dispatch System
  - My Tasks
  - Purchase Flow
  - Sales Flow
  - Purchase Flow Steps: Inspect Sample, Receive & Inspect Material, Material Approval, Return Rejected Material, Resend Material

---

### **NPD (New Product Development)**
- **Access Level**: Limited (15% of features)
- **Description**: Focused on feasibility assessment for new products
- **Key Features**:
  - Sales Flow
  - Sales Flow Steps: Check Feasibility

---

### **Sales Executive**
- **Access Level**: Moderate (35% of features)
- **Description**: Handles customer interactions and sales activities
- **Key Features**:
  - Client Orders
  - CRM Management
  - Sales Flow
  - Sales Flow Steps: Initial Call & Requirements, Evaluate High-Value Prospects, Send Quotation, Sample Submission

---

### **Store Manager**
- **Access Level**: High (65% of features)
- **Description**: Manages inventory, material handling, and operational workflows
- **Key Features**:
  - Client Dashboard
  - Inventory (Full Access)
  - Order to Dispatch System
  - My Tasks
  - Purchase Flow
  - Sales Flow
  - Molding Production
  - Purchase Flow Steps: Raise Indent, Receive & Inspect Material, Return Rejected Material, Resend Material, Generate GRN

---

## 📈 Access Level Comparison

| Role | Access Level | Primary Focus | Key Modules |
|------|-------------|---------------|-------------|
| **CEO** | Full (100%) | All modules and features | All dashboards, management, workflows |
| **Customer Relations Manager** | High (70%) | Sales, clients, dispatch, CRM | Client management, sales flow, dispatch |
| **Store Manager** | High (65%) | Inventory, operations, purchase flow | Inventory, purchase flow, dispatch |
| **QC Manager** | Moderate (45%) | Quality control, material inspection | Purchase flow, quality checks |
| **Process Coordinator** | Moderate (40%) | Purchase coordination, order dispatch | Purchase flow, order dispatch |
| **Sales Executive** | Moderate (35%) | Sales operations, client management | Sales flow, CRM, client orders |
| **Production Manager** | Limited (20%) | Production workflows | Sales flow, molding production |
| **NPD** | Limited (15%) | Product feasibility | Sales flow, feasibility checks |

---

## 🔐 Access by Module Category

### **Dashboards**
- **Main Dashboard**: CEO, Process Coordinator
- **Employee Dashboard**: CEO, HR Manager
- **Client Dashboard**: CEO, Customer Relations Manager, Store Manager
- **Costing**: CEO only

### **Management Modules**
- **Products**: CEO, Customer Relations Manager
- **Inventory**: CEO, Store Manager (restricted access)
- **Clients**: CEO, Customer Relations Manager
- **Prospects Clients**: CEO, Customer Relations Manager
- **Client Orders**: CEO, Customer Relations Manager, Sales Executive
- **Sales Order Ingestion**: CEO, Customer Relations Manager
- **Dispatch Planning**: CEO, Customer Relations Manager
- **Dispatch Management**: CEO, Customer Relations Manager
- **Vendors**: CEO, Purchase Executive, Management / HOD
- **Document Library**: CEO only (restricted access)
- **CRM Management**: CEO, Customer Relations Manager, Sales Executive

### **Workflows**
- **Order to Dispatch System**: CEO, Store Manager, Cable Production Supervisor, Moulding Production Supervisor, QC Manager, Process Coordinator, Customer Relations Manager
- **My Tasks**: CEO, Store Manager, Cable Production Supervisor, Moulding Production Supervisor, QC Manager
- **Purchase Flow**: CEO, Process Coordinator, Purchase Executive, Management / HOD, Store Manager, QC Manager, Accounts Executive
- **Sales Flow**: CEO, Customer Relations Manager, Sales Executive, NPD, Quality Engineer, Director, Production Manager, Store Manager, Accounts Executive
- **Cable Production**: CEO, Customer Relations Manager, Cable Production Supervisor
- **Molding Production**: CEO, Customer Relations Manager, Moulding Production Supervisor, Production Manager, Store Manager

---

## 🚨 Special Access Notes

1. **CEO**: Has access to ALL modules and features regardless of role restrictions
2. **Inventory**: Restricted to Store Manager and CEO only (enforced at component level)
3. **Document Library**: CEO only (enforced at component level)
4. **Employee Dashboard**: 
   - CEO and HR Manager can see ALL employees
   - Other roles see only their own profile (view-only)
5. **My Tasks**: Available to all roles that have workflow access
6. **System Tools**: Setup Sheets, Troubleshoot, and Storage Debug are available to ALL authenticated users

---

## 📝 Implementation Notes

- Role-based access is controlled in `src/components/common/Header.js`
- Component-level restrictions are enforced in individual component files
- CEO role bypasses all restrictions and has full access
- Access is checked using `getUserRole()` function from `src/utils/authUtils.js`
- Menu items are filtered based on `roles` array in menu configuration

---

## 🔄 How to Update Role Access

To modify role access for any module:

1. **Update Header.js**: Modify the `roles` array in the `menuGroups` configuration
2. **Update Component**: Add role checks in component files for additional restrictions
3. **Test Access**: Verify access with different user roles
4. **Update Documentation**: Keep this file updated with changes

---

**Last Updated**: Based on current codebase structure
**Main Configuration File**: `src/components/common/Header.js`

