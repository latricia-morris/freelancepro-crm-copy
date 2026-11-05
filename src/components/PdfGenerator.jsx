import jsPDF from "jspdf";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";

export const downloadPDF = async (item, type, contacts) => {
  const isQuote = type === "quote";
  const doc = new jsPDF();
  
  // Get user settings
  let user = {};
  let business = {};
  try {
    user = await base44.auth.me();
    business = user?.business || {};
  } catch (e) {
    console.error("Failed to load user settings", e);
  }
  
  // Logo if available
  if (business.logo_url) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = business.logo_url;
      await new Promise((resolve) => {
        img.onload = () => {
          try {
            doc.addImage(img, 'PNG', 20, 15, 30, 15);
          } catch (e) {
            console.error("Failed to add image", e);
          }
          resolve();
        };
        img.onerror = () => resolve();
        setTimeout(() => resolve(), 3000);
      });
    } catch (e) {
      // Fallback to text
    }
  }
  
  // Company Name
  doc.setFontSize(business.logo_url ? 14 : 24);
  doc.setFont(undefined, "bold");
  doc.text(business.business_name || "FreelancePro", business.logo_url ? 55 : 20, 20);
  
  // Document Title
  doc.setFontSize(20);
  doc.text(isQuote ? "DEVIS" : "FACTURE", 150, 20);
  
  // Document Number
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(`#${item[isQuote ? "quote_number" : "invoice_number"]}`, 150, 27);
  
  // Company Info (left side)
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  let companyYPos = 35;
  if (business.business_name) {
    doc.text(business.business_name, 20, companyYPos);
    companyYPos += 5;
  }
  doc.setFont(undefined, "normal");
  if (business.address) {
    const addressLines = business.address.split('\n');
    addressLines.forEach((line) => {
      doc.text(line, 20, companyYPos);
      companyYPos += 5;
    });
  }
  const countryName = business.country === "OTHER" ? business.custom_country : business.country;
  if (countryName && countryName !== "US") {
    doc.text(countryName, 20, companyYPos);
    companyYPos += 5;
  }
  if (business.tax_id) {
    doc.text(`${business.tax_label || "TVA"}: ${business.tax_id}`, 20, companyYPos);
    companyYPos += 5;
  }
  
  // Client Info (left side, below company)
  const contact = contacts.find(c => c.id === item.contact_id);
  let clientYPos = Math.max(companyYPos + 10, 65);
  doc.setFont(undefined, "bold");
  doc.text("FACTURÉ À:", 20, clientYPos);
  clientYPos += 5;
  doc.setFont(undefined, "normal");
  if (contact) {
    doc.text(`${contact.first_name} ${contact.last_name}`, 20, clientYPos);
    clientYPos += 5;
    if (contact.company) {
      doc.text(contact.company, 20, clientYPos);
      clientYPos += 5;
    }
    if (contact.email) {
      doc.text(contact.email, 20, clientYPos);
      clientYPos += 5;
    }
    if (contact.address) {
      doc.text(contact.address, 20, clientYPos);
      clientYPos += 5;
    }
  }
  
  // Dates (right side)
  doc.text(`Date: ${item.issue_date ? format(new Date(item.issue_date), "dd/MM/yyyy") : ""}`, 150, 40);
  if (isQuote) {
    doc.text(`Valide jusqu'au: ${item.valid_until ? format(new Date(item.valid_until), "dd/MM/yyyy") : ""}`, 150, 47);
  } else {
    doc.text(`Échéance: ${item.due_date ? format(new Date(item.due_date), "dd/MM/yyyy") : ""}`, 150, 47);
  }
  
  // Table Header
  let yPos = Math.max(clientYPos + 15, 100);
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos, 170, 8, "F");
  doc.setFont(undefined, "bold");
  doc.text("Description", 22, yPos + 5);
  doc.text("Qté", 120, yPos + 5);
  doc.text("Prix", 140, yPos + 5);
  doc.text("Taxe", 160, yPos + 5);
  doc.text("Total", 180, yPos + 5);
  
  // Items
  yPos += 12;
  doc.setFont(undefined, "normal");
  (item.items || []).forEach((lineItem) => {
    const itemTotal = lineItem.quantity * lineItem.unit_price;
    const itemTax = itemTotal * (lineItem.tax_rate / 100);
    const itemTotalWithTax = itemTotal + itemTax;
    
    doc.text(lineItem.description || "", 22, yPos);
    doc.text(String(lineItem.quantity), 120, yPos);
    doc.text(`${lineItem.unit_price.toFixed(2)}`, 140, yPos);
    doc.text(`${lineItem.tax_rate}%`, 160, yPos);
    doc.text(`${itemTotalWithTax.toFixed(2)}`, 180, yPos);
    yPos += 7;
  });
  
  // Totals
  yPos += 10;
  doc.line(20, yPos, 190, yPos);
  yPos += 8;
  
  const formatCurrency = (val) => {
    const formatted = (val || 0).toFixed(2);
    const currencySymbol = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: '$',
      AUD: '$'
    }[item.currency || "USD"] || item.currency || "USD";
    
    const position = business?.currency_position || 'after';
    return position === 'before' 
      ? `${currencySymbol} ${formatted}`
      : `${formatted} ${currencySymbol}`;
  };
  
  doc.text("Sous-total:", 130, yPos);
  doc.text(formatCurrency(item.subtotal), 180, yPos, { align: "right" });
  yPos += 7;
  
  doc.text("Taxe:", 130, yPos);
  doc.text(formatCurrency(item.tax_amount), 180, yPos, { align: "right" });
  yPos += 7;
  
  doc.setFont(undefined, "bold");
  doc.setFontSize(12);
  doc.text("TOTAL:", 130, yPos);
  doc.text(formatCurrency(item.total), 180, yPos, { align: "right" });
  
  // Notes
  if (item.notes) {
    yPos += 15;
    doc.setFontSize(9);
    doc.setFont(undefined, "bold");
    doc.text("NOTES:", 20, yPos);
    yPos += 5;
    doc.setFont(undefined, "normal");
    const splitNotes = doc.splitTextToSize(item.notes, 170);
    doc.text(splitNotes, 20, yPos);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setFont(undefined, "italic");
  doc.text("Merci pour votre confiance!", 105, 280, { align: "center" });
  
  // Save
  doc.save(`${isQuote ? "devis" : "facture"}-${item[isQuote ? "quote_number" : "invoice_number"]}.pdf`);
};