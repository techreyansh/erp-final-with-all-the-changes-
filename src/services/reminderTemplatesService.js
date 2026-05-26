// Reminder Templates Service
// Provides pre-built templates in English and Hindi for payment reminders

const reminderTemplates = {
  // English Templates
  en: {
    friendly: {
      email: {
        subject: 'Payment Reminder - Invoice #{invoice_no}',
        body: `Hi {name},

This is {crm_name} from Reyansh International. Invoice #{invoice_no} of ₹{amount} is due on {due_date}. 

Please confirm if payment will be via RTGS/cheque. If RTGS, share UTR so we can reconcile. Payment details: {bank_details}.

Thank you.

Best regards,
{crm_name}
Reyansh International`
      },
      whatsapp: {
        body: `Hi {name},

This is {crm_name} from Reyansh International. Invoice #{invoice_no} of ₹{amount} is due on {due_date}. Please confirm if payment will be via RTGS/cheque. If RTGS, share UTR so we can reconcile. Payment details: {bank_details}.

Thank you.`
      }
    },
    early: {
      email: {
        subject: 'Payment Reminder - Invoice #{invoice_no} (Due in 7 days)',
        body: `Hi {name},

This is {crm_name} from Reyansh International. 

Invoice #{invoice_no} of ₹{amount} is due on {due_date} (in 7 days). Please arrange payment via RTGS/cheque. 

If paying via RTGS, please share the UTR once payment is made. Payment details: {bank_details}.

Thank you.

Best regards,
{crm_name}
Reyansh International`
      },
      whatsapp: {
        body: `Hi {name},

This is {crm_name} from Reyansh International. Invoice #{invoice_no} of ₹{amount} is due on {due_date} (in 7 days). Please arrange payment via RTGS/cheque. If RTGS, share UTR once payment is made. Payment details: {bank_details}.

Thank you.`
      }
    },
    final: {
      email: {
        subject: 'Final Reminder - Invoice #{invoice_no} (Due Tomorrow)',
        body: `Hi {name},

This is {crm_name} from Reyansh International. 

Invoice #{invoice_no} of ₹{amount} is due TOMORROW ({due_date}). Please ensure payment is arranged via RTGS/cheque. 

If paying via RTGS, please share the UTR immediately after payment. Payment details: {bank_details}.

Thank you.

Best regards,
{crm_name}
Reyansh International`
      },
      whatsapp: {
        body: `Hi {name},

This is {crm_name} from Reyansh International. Invoice #{invoice_no} of ₹{amount} is due TOMORROW ({due_date}). Please ensure payment is arranged via RTGS/cheque. If RTGS, share UTR immediately after payment. Payment details: {bank_details}.

Thank you.`
      }
    },
    overdue: {
      email: {
        subject: 'URGENT: Overdue Payment - Invoice #{invoice_no}',
        body: `Hi {name},

This is {crm_name} from Reyansh International. 

Invoice #{invoice_no} of ₹{amount} was due on {due_date} and is now OVERDUE. Please arrange payment immediately via RTGS/cheque. 

If paying via RTGS, please share the UTR immediately. Payment details: {bank_details}.

Please contact us if there are any issues.

Best regards,
{crm_name}
Reyansh International`
      },
      whatsapp: {
        body: `Hi {name},

This is {crm_name} from Reyansh International. Invoice #{invoice_no} of ₹{amount} was due on {due_date} and is now OVERDUE. Please arrange payment immediately via RTGS/cheque. If RTGS, share UTR immediately. Payment details: {bank_details}.

Please contact us if there are any issues.`
      }
    }
  },

  // Hindi Templates
  hi: {
    friendly: {
      email: {
        subject: 'भुगतान अनुस्मारक - इनवॉइस #{invoice_no}',
        body: `नमस्ते {name},

यह {crm_name} Reyansh International से है। इनवॉइस #{invoice_no} (₹{amount}) की भुगतान तिथि {due_date} है। 

कृपया पुष्टि करें — भुगतान चेक से होगा या RTGS? UTR मिलने पर हम तुरंत मिलान कर लेंगे। भुगतान विवरण: {bank_details}।

धन्यवाद।

सादर,
{crm_name}
Reyansh International`
      },
      whatsapp: {
        body: `नमस्ते {name},

यह {crm_name} Reyansh से है। इनवॉइस #{invoice_no} (₹{amount}) की भुगतान तिथि {due_date} है। कृपया पुष्टि करें — भुगतान चेक से होगा या RTGS? UTR मिलने पर हम तुरंत मिलान कर लेंगे। भुगतान विवरण: {bank_details}।

धन्यवाद।`
      }
    },
    early: {
      email: {
        subject: 'भुगतान अनुस्मारक - इनवॉइस #{invoice_no} (7 दिन बाद देय)',
        body: `नमस्ते {name},

यह {crm_name} Reyansh International से है।

इनवॉइस #{invoice_no} (₹{amount}) की भुगतान तिथि {due_date} है (7 दिन बाद)। कृपया RTGS/चेक से भुगतान की व्यवस्था करें।

RTGS से भुगतान करने पर, कृपया भुगतान के बाद UTR साझा करें। भुगतान विवरण: {bank_details}।

धन्यवाद।

सादर,
{crm_name}
Reyansh International`
      },
      whatsapp: {
        body: `नमस्ते {name},

यह {crm_name} Reyansh International से है। इनवॉइस #{invoice_no} (₹{amount}) की भुगतान तिथि {due_date} है (7 दिन बाद)। कृपया RTGS/चेक से भुगतान की व्यवस्था करें। RTGS से भुगतान करने पर, UTR साझा करें। भुगतान विवरण: {bank_details}।

धन्यवाद।`
      }
    },
    final: {
      email: {
        subject: 'अंतिम अनुस्मारक - इनवॉइस #{invoice_no} (कल देय)',
        body: `नमस्ते {name},

यह {crm_name} Reyansh International से है।

इनवॉइस #{invoice_no} (₹{amount}) की भुगतान तिथि कल ({due_date}) है। कृपया RTGS/चेक से भुगतान सुनिश्चित करें।

RTGS से भुगतान करने पर, कृपया भुगतान के तुरंत बाद UTR साझा करें। भुगतान विवरण: {bank_details}।

धन्यवाद।

सादर,
{crm_name}
Reyansh International`
      },
      whatsapp: {
        body: `नमस्ते {name},

यह {crm_name} Reyansh International से है। इनवॉइस #{invoice_no} (₹{amount}) की भुगतान तिथि कल ({due_date}) है। कृपया RTGS/चेक से भुगतान सुनिश्चित करें। RTGS से भुगतान करने पर, तुरंत UTR साझा करें। भुगतान विवरण: {bank_details}।

धन्यवाद।`
      }
    },
    overdue: {
      email: {
        subject: 'जरूरी: अतिदेय भुगतान - इनवॉइस #{invoice_no}',
        body: `नमस्ते {name},

यह {crm_name} Reyansh International से है।

इनवॉइस #{invoice_no} (₹{amount}) की भुगतान तिथि {due_date} थी और अब अतिदेय है। कृपया तुरंत RTGS/चेक से भुगतान की व्यवस्था करें।

RTGS से भुगतान करने पर, कृपया तुरंत UTR साझा करें। भुगतान विवरण: {bank_details}।

कृपया कोई समस्या होने पर हमसे संपर्क करें।

सादर,
{crm_name}
Reyansh International`
      },
      whatsapp: {
        body: `नमस्ते {name},

यह {crm_name} Reyansh International से है। इनवॉइस #{invoice_no} (₹{amount}) की भुगतान तिथि {due_date} थी और अब अतिदेय है। कृपया तुरंत RTGS/चेक से भुगतान की व्यवस्था करें। RTGS से भुगतान करने पर, तुरंत UTR साझा करें। भुगतान विवरण: {bank_details}।

कृपया कोई समस्या होने पर हमसे संपर्क करें।`
      }
    }
  },

  // Call Script Templates
  callScripts: {
    firstCall: {
      intro: 'Hello {contact_name}, this is {crm_name} from Reyansh International. How are you?',
      purpose: 'I\'m calling about invoice #{invoice_no} for ₹{amount} due on {due_date}. I wanted to check payment status.',
      rtgs: 'Could you please share the UTR once payment is made? We\'ll reconcile it immediately.',
      cheque: 'When can we expect the cheque? Do you want us to collect or shall we wait for deposit?',
      close: 'Thanks — I\'ll follow up as discussed. I\'ll send a confirmation message.'
    }
  },

  // Helper function to replace placeholders
  replacePlaceholders(template, data) {
    let result = template;
    const placeholders = {
      name: data.customerName || data.name || 'Customer',
      crm_name: data.crmName || 'CRM Team',
      invoice_no: data.invoiceNo || data.invoice_no || '',
      amount: data.amount || '0',
      due_date: data.dueDate || data.due_date || '',
      bank_details: data.bankDetails || data.bank_details || 'Please contact us for bank details',
      contact_name: data.contactName || data.customerName || 'Customer',
      payment_instructions: data.paymentInstructions || 'Please contact us for payment instructions'
    };

    Object.keys(placeholders).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, placeholders[key]);
    });

    return result;
  },

  // Get template by type and language
  getTemplate(type, language = 'en', channel = 'email') {
    const lang = language.toLowerCase();
    const templates = this[lang];
    
    if (!templates || !templates[type]) {
      // Fallback to English
      return this.en[type] || this.en.friendly;
    }

    const template = templates[type];
    return template[channel] || template.email;
  }
};

export default reminderTemplates;

