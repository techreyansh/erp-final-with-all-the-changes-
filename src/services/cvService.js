import jsPDF from 'jspdf';
import 'jspdf-autotable';

class CVService {
  constructor() {
    this.defaultFontSize = 12;
    this.headerFontSize = 16;
    this.subHeaderFontSize = 14;
  }

  // Generate CV PDF from employee data
  generateCV(employeeData) {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;

      // Helper function to add text with word wrapping
      const addText = (text, x, y, maxWidth, fontSize = this.defaultFontSize) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * fontSize * 0.4);
      };

      // Helper function to add section header
      const addSectionHeader = (title, y) => {
        doc.setFontSize(this.headerFontSize);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(title, margin, y);
        
        // Add underline
        doc.setLineWidth(0.5);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        
        return y + 10;
      };

      // Helper function to add field
      const addField = (label, value, y) => {
        if (!value || value === 'N/A') return y;
        
        doc.setFontSize(this.defaultFontSize);
        doc.setFont(undefined, 'bold');
        doc.text(`${label}:`, margin, y);
        
        doc.setFont(undefined, 'normal');
        // Ensure proper spacing and no overlap
        const labelWidth = doc.getTextWidth(`${label}:`);
        const fieldX = margin + labelWidth + 10; // Add 10px spacing
        const maxWidth = pageWidth - fieldX - margin;
        
        const fieldY = addText(value, fieldX, y, maxWidth);
        return fieldY + 5; // Add more spacing between fields
      };

      // Header Section
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text(employeeData.EmployeeName || 'Employee Name', margin, 25);
      
      doc.setFontSize(this.defaultFontSize);
      doc.setFont(undefined, 'normal');
      doc.text(employeeData.Designation || 'Designation', margin, 35);
      
      yPosition = 50;

      // Contact Information
      yPosition = addSectionHeader('Contact Information', yPosition);
      
      if (employeeData.Email) {
        yPosition = addField('Email', employeeData.Email, yPosition);
      }
      if (employeeData.Phone) {
        yPosition = addField('Phone', employeeData.Phone, yPosition);
      }
      if (employeeData.Address) {
        yPosition = addField('Address', employeeData.Address, yPosition);
      }
      
      yPosition += 5;

      // Professional Information
      yPosition = addSectionHeader('Professional Information', yPosition);
      
      if (employeeData.EmployeeCode) {
        yPosition = addField('Employee ID', employeeData.EmployeeCode, yPosition);
      }
      if (employeeData.Department) {
        yPosition = addField('Department', employeeData.Department, yPosition);
      }
      if (employeeData.Designation) {
        yPosition = addField('Designation', employeeData.Designation, yPosition);
      }
      if (employeeData.ReportingManager) {
        yPosition = addField('Reporting Manager', employeeData.ReportingManager, yPosition);
      }
      if (employeeData.JoiningDate) {
        yPosition = addField('Joining Date', this.formatDate(employeeData.JoiningDate), yPosition);
      }
      if (employeeData.Status) {
        yPosition = addField('Status', employeeData.Status, yPosition);
      }
      if (employeeData.EmployeeType) {
        yPosition = addField('Employee Type', employeeData.EmployeeType, yPosition);
      }
      
      yPosition += 5;

      // Educational Background
      if (employeeData.HighestQualification || employeeData.University || employeeData.Specialization) {
        yPosition = addSectionHeader('Educational Background', yPosition);
        
        if (employeeData.HighestQualification) {
          yPosition = addField('Highest Qualification', employeeData.HighestQualification, yPosition);
        }
        if (employeeData.University) {
          yPosition = addField('University', employeeData.University, yPosition);
        }
        if (employeeData.Specialization) {
          yPosition = addField('Specialization', employeeData.Specialization, yPosition);
        }
        if (employeeData.GraduationYear) {
          yPosition = addField('Graduation Year', employeeData.GraduationYear, yPosition);
        }
        
        yPosition += 5;
      }

      // Experience
      if (employeeData.Experience) {
        yPosition = addSectionHeader('Experience', yPosition);
        yPosition = addField('Total Experience', employeeData.Experience, yPosition);
        yPosition += 5;
      }

      // Skills
      if (employeeData.Skills) {
        yPosition = addSectionHeader('Skills', yPosition);
        yPosition = addText(employeeData.Skills, margin, yPosition, pageWidth - 2 * margin);
        yPosition += 10;
      }

      // Certifications
      if (employeeData.Certifications) {
        yPosition = addSectionHeader('Certifications', yPosition);
        yPosition = addText(employeeData.Certifications, margin, yPosition, pageWidth - 2 * margin);
        yPosition += 10;
      }

      // Personal Information
      if (employeeData.DateOfBirth) {
        yPosition = addSectionHeader('Personal Information', yPosition);
        yPosition = addField('Date of Birth', this.formatDate(employeeData.DateOfBirth), yPosition);
        yPosition += 5;
      }

      // Check if we need a new page before adding footer
      const pageHeight = doc.internal.pageSize.getHeight();
      const footerSpace = 30; // Space needed for footer
      
      if (yPosition > pageHeight - footerSpace) {
        doc.addPage();
        yPosition = margin;
      }

      // Add footer
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      
      // Position footer text properly
      const footerY = pageHeight - 10;
      const generatedText = 'Generated on ' + new Date().toLocaleDateString();
      const companyText = 'Reyansh Electronics - Employee CV';
      
      // Calculate text width to position properly
      const generatedTextWidth = doc.getTextWidth(generatedText);
      const companyTextWidth = doc.getTextWidth(companyText);
      
      // Left align generated date
      doc.text(generatedText, margin, footerY);
      
      // Right align company text
      doc.text(companyText, pageWidth - margin - companyTextWidth, footerY);

      return doc;
    } catch (error) {
      console.error('Error generating CV:', error);
      throw new Error('Failed to generate CV: ' + error.message);
    }
  }

  // Download CV as PDF
  downloadCV(employeeData, filename = null) {
    try {
      const doc = this.generateCV(employeeData);
      const defaultFilename = `${employeeData.EmployeeName || 'Employee'}_CV_${new Date().toISOString().split('T')[0]}.pdf`;
      const finalFilename = filename || defaultFilename;
      
      doc.save(finalFilename);
      return true;
    } catch (error) {
      console.error('Error downloading CV:', error);
      throw error;
    }
  }

  // Generate CV as blob for preview
  generateCVBlob(employeeData) {
    try {
      const doc = this.generateCV(employeeData);
      return doc.output('blob');
    } catch (error) {
      console.error('Error generating CV blob:', error);
      throw error;
    }
  }

  // Format date for display
  formatDate(dateString) {
    if (!dateString || dateString.trim() === '') return '';
    
    try {
      // Handle different date formats
      let date;
      if (typeof dateString === 'string') {
        // Try parsing as ISO date first
        date = new Date(dateString);
        if (isNaN(date.getTime())) {
          // Try parsing as MM/DD/YYYY or DD/MM/YYYY
          const parts = dateString.split('/');
          if (parts.length === 3) {
            // Assume MM/DD/YYYY format
            date = new Date(parts[2], parts[0] - 1, parts[1]);
          }
        }
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Date formatting error:', error);
      return dateString;
    }
  }

  // Generate CV with custom template
  generateCustomCV(employeeData, template = 'default') {
    switch (template) {
      case 'minimal':
        return this.generateMinimalCV(employeeData);
      case 'detailed':
        return this.generateDetailedCV(employeeData);
      default:
        return this.generateCV(employeeData);
    }
  }

  // Minimal CV template
  generateMinimalCV(employeeData) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(employeeData.EmployeeName || 'Employee Name', margin, yPosition);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(employeeData.Designation || 'Designation', margin, yPosition + 8);
    
    if (employeeData.Email) {
      doc.text(employeeData.Email, margin, yPosition + 16);
    }
    
    if (employeeData.Phone) {
      doc.text(employeeData.Phone, margin, yPosition + 24);
    }

    yPosition += 40;

    // Experience
    if (employeeData.Experience) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Experience', margin, yPosition);
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(employeeData.Experience, margin, yPosition + 8);
      yPosition += 20;
    }

    // Skills
    if (employeeData.Skills) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Skills', margin, yPosition);
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      const skillsLines = doc.splitTextToSize(employeeData.Skills, pageWidth - 2 * margin);
      doc.text(skillsLines, margin, yPosition + 8);
    }

    return doc;
  }

  // Detailed CV template
  generateDetailedCV(employeeData) {
    // This would be a more comprehensive version with tables, charts, etc.
    // For now, we'll use the default template
    return this.generateCV(employeeData);
  }
}

export default new CVService();
