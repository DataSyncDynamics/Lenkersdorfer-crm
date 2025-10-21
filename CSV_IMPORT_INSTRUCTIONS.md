# CSV Import Instructions for Lenkersdorfer CRM

## 🚨 CRITICAL: File Format Issue Identified

Your current file is **NOT a true CSV** - it's an **Excel XML file**. That's why the import is failing with "No valid sales records found in CSV".

## ✅ How to Fix This

### Method 1: Export from Excel as CSV (RECOMMENDED)

1. Open your Excel file
2. Click **File → Save As**
3. In the "Save as type" dropdown, select: **CSV (Comma delimited) (*.csv)**
   - ⚠️ **DO NOT** choose "CSV UTF-8 (Comma delimited)"
   - ⚠️ **DO NOT** choose "XML Spreadsheet"
   - ⚠️ **DO NOT** choose "Excel Workbook"
4. Click Save
5. Upload this new .csv file to the CRM

### Method 2: Use Google Sheets

1. Upload your Excel file to Google Sheets
2. Click **File → Download → Comma Separated Values (.csv)**
3. Upload the downloaded file to the CRM

## 📋 Required CSV Format

Your CSV file must have these columns (order doesn't matter, names are flexible):

### Minimum Required Columns:
- **Invoice Number** or **Invoice ID** - The invoice/transaction number
- **Date** - Purchase date (format: MM/DD/YYYY)
- **Watch Description** or **Description** - Full watch description including brand
- **Total** or **Sale Price** - The final sale price
- **Client Name** or **Customer Name** - Full name of the customer

### Optional Columns:
- **Retail Price** - MSRP or retail price
- **Quantity** - Number of items (usually 1)
- **Discount** - Discount amount or percentage
- **Commission %** - Commission rate

## ✨ Example CSV Format

```csv
Invoice Number,Date,Watch Description,Retail Price,Total,Client Name
382392,07/12/2025,ROLEX CPO DATE JUST 26 OYSTER PERPETUAL AUTOMATIC WRISTWATCH,19000,19000,AGNES LEE
378558,06/13/2025,ROLEX CPO DATE JUST 26 CALIBRE 3285 AUTOMATIC WRISTWATCH,18150,19239,Ophelia Udumala
383788,07/23/2025,ROLEX OYSTER PERPETUAL SUBMARINER DATE 41MM CALIBRE 3235,17600,18656,Alan Florez
```

## 📊 What the Import Does

1. **Parses CSV** - Reads your sales data
2. **Groups by Customer** - Combines all purchases per customer
3. **Creates Clients** - Generates client profiles with:
   - Lifetime spend calculation
   - VIP tier assignment (Bronze/Silver/Gold/Platinum)
   - Client tier ranking (1-5 based on percentile)
   - Purchase history
   - Preferred brands analysis
4. **Saves to Database** - Persists all data to Supabase

## 🎯 Column Detection Logic

The importer is smart and flexible with column names:

- **Invoice**: Looks for "invoice" or "number"
- **Date**: Looks for "date"
- **Description**: Looks for "description", "watch", "item", or "product"
- **Retail**: Looks for "retail" (excluding "sale")
- **Total**: Looks for "total", "saleprice", or "amount"
- **Client Name**: Looks for "clientname", "customername", or "name"

## ⚠️ Common Issues

### Issue: "No valid sales records found in CSV"
**Cause**: File is not a true CSV (it's XML, XLSX, or another format)
**Solution**: Re-export from Excel as "CSV (Comma delimited)"

### Issue: "Failed to parse CSV"
**Cause**: Special characters or formatting in Excel
**Solution**:
- Remove any formulas
- Remove any special formatting
- Save as plain CSV

### Issue: Missing client names
**Cause**: Column header doesn't match expected patterns
**Solution**: Rename column to "Client Name" or "Customer Name"

## 📁 Sample Files Provided

I've created two sample CSV files for you in the project root:

1. **`SAMPLE_FORMAT_FOR_JASON.csv`** - Example with simplified format
2. **`CORRECT_CSV_FORMAT.csv`** - Example with all your data

You can use these as templates or test the import with these files first.

## 🧪 Testing the Import

1. Go to http://localhost:3001/import
2. Drag and drop your CSV file
3. Click "Import Data"
4. Check the console for detailed parsing logs
5. Review the import statistics

## 💡 Pro Tips

- **Keep it simple**: Only include the required columns
- **Use plain text**: No formulas, no formatting, just raw data
- **Check the file extension**: It should end in `.csv`, not `.xlsx` or `.xls`
- **View in a text editor**: Open your CSV in Notepad/TextEdit to verify it's plain text
- **Consistent date format**: Use MM/DD/YYYY (e.g., 07/12/2025)
- **No dollar signs in prices**: Just the numbers (e.g., 19000 not $19,000)

## 🆘 Still Having Issues?

If you're still seeing "No valid sales records found", check the browser console (F12) when you upload. The logs will show:
- CSV Headers detected
- Column mapping results
- Which records were skipped and why

Good luck with the import! 🎉
