import { google } from 'googleapis';
import { GOOGLE_CREDENTIALS, SPREADSHEET_ID } from './google-credentials';

// Initialize Google Sheets API client
function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: GOOGLE_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

// Interface for person data
export interface PersonData {
  rowIndex: number;
  name: string;
  phone?: string;
  address?: string;
  fy2627TakaJama?: string;
  paymentType?: string;
  paymentDate?: string;
  status?: string;
  givenAmount?: string;
  returnAmount?: string;
  returnAmountType?: string;
}

// Interface for update data
export interface UpdatePaymentData {
  rowIndex: number;
  amount: string;
  paymentType: 'cash' | 'online';
  paymentDate?: string;
  status?: string;
  givenAmount?: string;
  returnAmount?: string;
  returnAmountType?: string;
}

// Interface for new entry data
export interface NewEntryData {
  name: string;
  address?: string;
  amount?: string;
  paymentType?: 'cash' | 'online';
  paymentDate?: string;
}

// Interface for collection stats
export interface CollectionStats {
  totalCollection: number;
  onlineCollection: number;
  cashCollection: number;
  totalPeople: number;
  paidPeople: number;
  duePeople: number;
  totalExpenses: number;
  netBalance: number;
}

// Interface for expense data
export interface ExpenseData {
  rowIndex: number;
  description: string;
  amount: string;
  date: string;
  paymentType?: string;
  category?: string;
}

// Interface for new expense
export interface NewExpenseData {
  description: string;
  amount: string;
  date: string;
  paymentType?: 'cash' | 'online';
  category?: string;
}

// Interface for date-wise collection
export interface DateWiseCollection {
  date: string;
  total: number;
  cash: number;
  online: number;
  count: number;
}

// Find column index by checking multiple possible header names
function findColumnIndex(headers: string[], patterns: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (!header) continue;
    const headerLower = header.toLowerCase();
    for (const pattern of patterns) {
      if (headerLower.includes(pattern.toLowerCase()) || header.includes(pattern)) {
        return i;
      }
    }
  }
  return -1;
}

// Column name patterns (English and Bengali)
const NAME_COLUMN_PATTERNS = ['name', 'নাম'];
const ADDRESS_COLUMN_PATTERNS = ['address', 'ঠিকানা'];
const FY2627_COLUMN_PATTERNS = ['fy 26-27', 'taka jama', 'fy26-27'];
const PAYMENT_TYPE_COLUMN_PATTERNS = ['payment type', 'paymenttype'];
const PAYMENT_DATE_COLUMN_PATTERNS = ['payment date', 'paymentdate', 'date'];
const STATUS_COLUMN_PATTERNS = ['status', 'due', 'paid'];
const GIVEN_AMOUNT_COLUMN_PATTERNS = ['given amount', 'givenamount'];
const RETURN_AMOUNT_COLUMN_PATTERNS = ['return amount', 'returnamount'];
const RETURN_TYPE_COLUMN_PATTERNS = ['return type', 'returntype', 'return amount type'];

// Convert column index to letter (0 = A, 1 = B, etc.)
function columnToLetter(column: number): string {
  let temp = '';
  while (column >= 0) {
    temp = String.fromCharCode((column % 26) + 65) + temp;
    column = Math.floor(column / 26) - 1;
  }
  return temp;
}

// Search for names in the sheet
export async function searchNames(searchTerm: string): Promise<PersonData[]> {
  const sheets = getGoogleSheetsClient();
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:Z', // Get all columns
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    // Get header row to find column indices
    const headers = rows[0] as string[];
    
    // Find column indices
    const nameColIndex = findColumnIndex(headers, NAME_COLUMN_PATTERNS);
    const addressColIndex = findColumnIndex(headers, ADDRESS_COLUMN_PATTERNS);
    const fy2627ColIndex = findColumnIndex(headers, FY2627_COLUMN_PATTERNS);
    const paymentTypeColIndex = findColumnIndex(headers, PAYMENT_TYPE_COLUMN_PATTERNS);
    const paymentDateColIndex = findColumnIndex(headers, PAYMENT_DATE_COLUMN_PATTERNS);
    const statusColIndex = findColumnIndex(headers, STATUS_COLUMN_PATTERNS);
    const givenAmountColIndex = findColumnIndex(headers, GIVEN_AMOUNT_COLUMN_PATTERNS);
    const returnAmountColIndex = findColumnIndex(headers, RETURN_AMOUNT_COLUMN_PATTERNS);
    const returnTypeColIndex = findColumnIndex(headers, RETURN_TYPE_COLUMN_PATTERNS);

    const results: PersonData[] = [];
    const searchLower = searchTerm.toLowerCase();

    // Search through rows (starting from row 1 to skip header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (nameColIndex !== -1 && row[nameColIndex]) {
        const name = row[nameColIndex] as string;
        if (name.toLowerCase().includes(searchLower)) {
          const amount = fy2627ColIndex !== -1 ? (row[fy2627ColIndex] as string) || '' : '';
          const statusFromSheet = statusColIndex !== -1 ? (row[statusColIndex] as string) || '' : '';
          
          // Determine status: if amount exists, they're Paid; otherwise use status column or default
          let status = 'Due';
          if (amount && amount.trim() !== '' && parseInt(amount) > 0) {
            status = 'Paid';
          } else if (statusFromSheet) {
            status = statusFromSheet;
          }
          
          results.push({
            rowIndex: i + 1, // 1-indexed for Google Sheets
            name: name,
            phone: '',
            address: addressColIndex !== -1 ? (row[addressColIndex] as string) || '' : '',
            fy2627TakaJama: amount,
            paymentType: paymentTypeColIndex !== -1 ? (row[paymentTypeColIndex] as string) || '' : '',
            paymentDate: paymentDateColIndex !== -1 ? (row[paymentDateColIndex] as string) || '' : '',
            status: status,
            givenAmount: givenAmountColIndex !== -1 ? (row[givenAmountColIndex] as string) || '' : '',
            returnAmount: returnAmountColIndex !== -1 ? (row[returnAmountColIndex] as string) || '' : '',
            returnAmountType: returnTypeColIndex !== -1 ? (row[returnTypeColIndex] as string) || '' : '',
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error searching names:', error);
    throw error;
  }
}

// Get all names from the sheet
export async function getAllNames(): Promise<PersonData[]> {
  const sheets = getGoogleSheetsClient();
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:Z',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    // Get header row to find column indices
    const headers = rows[0] as string[];
    
    // Find column indices
    const nameColIndex = findColumnIndex(headers, NAME_COLUMN_PATTERNS);
    const addressColIndex = findColumnIndex(headers, ADDRESS_COLUMN_PATTERNS);
    const fy2627ColIndex = findColumnIndex(headers, FY2627_COLUMN_PATTERNS);
    const paymentTypeColIndex = findColumnIndex(headers, PAYMENT_TYPE_COLUMN_PATTERNS);
    const paymentDateColIndex = findColumnIndex(headers, PAYMENT_DATE_COLUMN_PATTERNS);
    const statusColIndex = findColumnIndex(headers, STATUS_COLUMN_PATTERNS);
    const givenAmountColIndex = findColumnIndex(headers, GIVEN_AMOUNT_COLUMN_PATTERNS);
    const returnAmountColIndex = findColumnIndex(headers, RETURN_AMOUNT_COLUMN_PATTERNS);
    const returnTypeColIndex = findColumnIndex(headers, RETURN_TYPE_COLUMN_PATTERNS);

    console.log('Column indices:', { nameColIndex, addressColIndex, fy2627ColIndex, paymentTypeColIndex, paymentDateColIndex, statusColIndex });

    const results: PersonData[] = [];

    // Get all rows (starting from row 1 to skip header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (nameColIndex !== -1 && row[nameColIndex]) {
        const name = row[nameColIndex] as string;
        if (name && name.trim() !== '') {
          const amount = fy2627ColIndex !== -1 ? (row[fy2627ColIndex] as string) || '' : '';
          const statusFromSheet = statusColIndex !== -1 ? (row[statusColIndex] as string) || '' : '';
          
          // Determine status: if amount exists and > 0, they're Paid; otherwise use status column
          let status = '';
          if (amount && amount.trim() !== '' && parseInt(amount) > 0) {
            status = 'Paid';
          } else if (statusFromSheet && statusFromSheet.trim() !== '') {
            status = statusFromSheet;
          }
          
          results.push({
            rowIndex: i + 1,
            name: name,
            phone: '',
            address: addressColIndex !== -1 ? (row[addressColIndex] as string) || '' : '',
            fy2627TakaJama: amount,
            paymentType: paymentTypeColIndex !== -1 ? (row[paymentTypeColIndex] as string) || '' : '',
            paymentDate: paymentDateColIndex !== -1 ? (row[paymentDateColIndex] as string) || '' : '',
            status: status,
            givenAmount: givenAmountColIndex !== -1 ? (row[givenAmountColIndex] as string) || '' : '',
            returnAmount: returnAmountColIndex !== -1 ? (row[returnAmountColIndex] as string) || '' : '',
            returnAmountType: returnTypeColIndex !== -1 ? (row[returnTypeColIndex] as string) || '' : '',
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error getting all names:', error);
    throw error;
  }
}

// Update payment information
export async function updatePayment(data: UpdatePaymentData): Promise<boolean> {
  const sheets = getGoogleSheetsClient();
  
  try {
    // First get headers to find column indices
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: '1:1', // Get header row
    });

    const headers = headerResponse.data.values?.[0] as string[];
    if (!headers) {
      throw new Error('Could not find headers');
    }

    // Find column indices
    const fy2627ColIndex = findColumnIndex(headers, FY2627_COLUMN_PATTERNS);
    const paymentTypeColIndex = findColumnIndex(headers, PAYMENT_TYPE_COLUMN_PATTERNS);
    const paymentDateColIndex = findColumnIndex(headers, PAYMENT_DATE_COLUMN_PATTERNS);
    const statusColIndex = findColumnIndex(headers, STATUS_COLUMN_PATTERNS);
    const givenAmountColIndex = findColumnIndex(headers, GIVEN_AMOUNT_COLUMN_PATTERNS);
    const returnAmountColIndex = findColumnIndex(headers, RETURN_AMOUNT_COLUMN_PATTERNS);
    const returnTypeColIndex = findColumnIndex(headers, RETURN_TYPE_COLUMN_PATTERNS);

    console.log('Update column indices:', { fy2627ColIndex, paymentTypeColIndex, paymentDateColIndex, statusColIndex });

    // Update FY 26-27 Taka Jama column (Column D)
    if (fy2627ColIndex !== -1) {
      const colLetter = columnToLetter(fy2627ColIndex);
      console.log(`Updating ${colLetter}${data.rowIndex} with amount: ${data.amount}`);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${colLetter}${data.rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[data.amount]],
        },
      });
    }

    // Update Payment Type column (Column E)
    if (paymentTypeColIndex !== -1) {
      const colLetter = columnToLetter(paymentTypeColIndex);
      console.log(`Updating ${colLetter}${data.rowIndex} with payment type: ${data.paymentType}`);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${colLetter}${data.rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[data.paymentType]],
        },
      });
    }

    // Update Payment Date column (Column F)
    if (paymentDateColIndex !== -1 && data.paymentDate) {
      const colLetter = columnToLetter(paymentDateColIndex);
      console.log(`Updating ${colLetter}${data.rowIndex} with payment date: ${data.paymentDate}`);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${colLetter}${data.rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[data.paymentDate]],
        },
      });
    }

    // Update Status column
    if (statusColIndex !== -1 && data.status) {
      const colLetter = columnToLetter(statusColIndex);
      console.log(`Updating ${colLetter}${data.rowIndex} with status: ${data.status}`);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${colLetter}${data.rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[data.status]],
        },
      });
    }

    // Update Given Amount column
    if (givenAmountColIndex !== -1 && data.givenAmount) {
      const colLetter = columnToLetter(givenAmountColIndex);
      console.log(`Updating ${colLetter}${data.rowIndex} with given amount: ${data.givenAmount}`);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${colLetter}${data.rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[data.givenAmount]],
        },
      });
    }

    // Update Return Amount column
    if (returnAmountColIndex !== -1 && data.returnAmount) {
      const colLetter = columnToLetter(returnAmountColIndex);
      console.log(`Updating ${colLetter}${data.rowIndex} with return amount: ${data.returnAmount}`);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${colLetter}${data.rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[data.returnAmount]],
        },
      });
    }

    // Update Return Amount Type column
    if (returnTypeColIndex !== -1 && data.returnAmountType) {
      const colLetter = columnToLetter(returnTypeColIndex);
      console.log(`Updating ${colLetter}${data.rowIndex} with return amount type: ${data.returnAmountType}`);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${colLetter}${data.rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[data.returnAmountType]],
        },
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating payment:', error);
    throw error;
  }
}

// Update status only (for Due checkbox)
export async function updateStatus(rowIndex: number, status: string): Promise<boolean> {
  const sheets = getGoogleSheetsClient();
  
  try {
    // First get headers to find column index
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: '1:1',
    });

    const headers = headerResponse.data.values?.[0] as string[];
    if (!headers) {
      throw new Error('Could not find headers');
    }

    const statusColIndex = findColumnIndex(headers, STATUS_COLUMN_PATTERNS);
    
    if (statusColIndex === -1) {
      throw new Error('Status column not found');
    }

    const colLetter = columnToLetter(statusColIndex);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${colLetter}${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[status]],
      },
    });

    return true;
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
}

// Add new entry to Google Sheet
export async function addNewEntry(data: NewEntryData): Promise<{ success: boolean; rowIndex?: number; error?: string }> {
  const sheets = getGoogleSheetsClient();
  
  try {
    // First get headers to find column indices
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: '1:1',
    });

    const headers = headerResponse.data.values?.[0] as string[];
    if (!headers) {
      throw new Error('Could not find headers');
    }

    // Find column indices
    const serialColIndex = findColumnIndex(headers, ['ক্রম', 'serial', 'no']);
    const nameColIndex = findColumnIndex(headers, NAME_COLUMN_PATTERNS);
    const addressColIndex = findColumnIndex(headers, ADDRESS_COLUMN_PATTERNS);
    const fy2627ColIndex = findColumnIndex(headers, FY2627_COLUMN_PATTERNS);
    const paymentTypeColIndex = findColumnIndex(headers, PAYMENT_TYPE_COLUMN_PATTERNS);
    const paymentDateColIndex = findColumnIndex(headers, PAYMENT_DATE_COLUMN_PATTERNS);

    // Get current data to find next row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:A',
    });

    const rows = response.data.values;
    const nextRow = rows ? rows.length + 1 : 2;
    const serialNo = rows ? rows.length : 1;

    // Create row data with all columns
    const rowData: (string | number)[] = [];
    const maxColIndex = Math.max(
      serialColIndex,
      nameColIndex,
      addressColIndex,
      fy2627ColIndex,
      paymentTypeColIndex,
      paymentDateColIndex
    );

    for (let i = 0; i <= maxColIndex; i++) {
      if (i === serialColIndex) {
        rowData.push(serialNo);
      } else if (i === nameColIndex) {
        rowData.push(data.name.trim());
      } else if (i === addressColIndex) {
        rowData.push(data.address?.trim() || '');
      } else if (i === fy2627ColIndex) {
        rowData.push(data.amount || '');
      } else if (i === paymentTypeColIndex) {
        rowData.push(data.paymentType || '');
      } else if (i === paymentDateColIndex) {
        rowData.push(data.paymentDate || '');
      } else {
        rowData.push('');
      }
    }

    const colLetter = columnToLetter(maxColIndex);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `A${nextRow}:${colLetter}${nextRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [rowData],
      },
    });

    return { success: true, rowIndex: nextRow };
  } catch (error) {
    console.error('Error adding new entry:', error);
    throw error;
  }
}

// Get collection statistics
export async function getCollectionStats(): Promise<CollectionStats> {
  const sheets = getGoogleSheetsClient();
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:Z',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { totalCollection: 0, onlineCollection: 0, cashCollection: 0, totalPeople: 0, paidPeople: 0, duePeople: 0, totalExpenses: 0, netBalance: 0 };
    }

    const headers = rows[0] as string[];
    const fy2627ColIndex = findColumnIndex(headers, FY2627_COLUMN_PATTERNS);
    const paymentTypeColIndex = findColumnIndex(headers, PAYMENT_TYPE_COLUMN_PATTERNS);
    const statusColIndex = findColumnIndex(headers, STATUS_COLUMN_PATTERNS);

    let totalCollection = 0;
    let onlineCollection = 0;
    let cashCollection = 0;
    let paidPeople = 0;
    let duePeople = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const amountStr = fy2627ColIndex !== -1 ? (row[fy2627ColIndex] as string) || '' : '';
      const paymentType = paymentTypeColIndex !== -1 ? (row[paymentTypeColIndex] as string) || '' : '';
      const statusStr = statusColIndex !== -1 ? (row[statusColIndex] as string) || '' : '';
      
      const amount = parseInt(amountStr) || 0;
      
      if (amount > 0) {
        totalCollection += amount;
        paidPeople++;
        
        if (paymentType.toLowerCase() === 'online') {
          onlineCollection += amount;
        } else if (paymentType.toLowerCase() === 'cash') {
          cashCollection += amount;
        }
      } else if (statusStr.toLowerCase() === 'due') {
        duePeople++;
      }
    }

    // Get total expenses
    const totalExpenses = await getTotalExpenses();
    const netBalance = totalCollection - totalExpenses;

    return {
      totalCollection,
      onlineCollection,
      cashCollection,
      totalPeople: rows.length - 1,
      paidPeople,
      duePeople,
      totalExpenses,
      netBalance,
    };
  } catch (error) {
    console.error('Error getting collection stats:', error);
    throw error;
  }
}

// Get date-wise collection
export async function getDateWiseCollection(): Promise<DateWiseCollection[]> {
  const sheets = getGoogleSheetsClient();
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:Z',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    const headers = rows[0] as string[];
    const fy2627ColIndex = findColumnIndex(headers, FY2627_COLUMN_PATTERNS);
    const paymentTypeColIndex = findColumnIndex(headers, PAYMENT_TYPE_COLUMN_PATTERNS);
    const paymentDateColIndex = findColumnIndex(headers, PAYMENT_DATE_COLUMN_PATTERNS);

    const dateMap = new Map<string, { total: number; cash: number; online: number; count: number }>();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const amountStr = fy2627ColIndex !== -1 ? (row[fy2627ColIndex] as string) || '' : '';
      const paymentType = paymentTypeColIndex !== -1 ? (row[paymentTypeColIndex] as string) || '' : '';
      const paymentDate = paymentDateColIndex !== -1 ? (row[paymentDateColIndex] as string) || '' : '';
      
      const amount = parseInt(amountStr) || 0;
      
      if (amount > 0 && paymentDate) {
        const existing = dateMap.get(paymentDate) || { total: 0, cash: 0, online: 0, count: 0 };
        existing.total += amount;
        existing.count += 1;
        
        if (paymentType.toLowerCase() === 'online') {
          existing.online += amount;
        } else if (paymentType.toLowerCase() === 'cash') {
          existing.cash += amount;
        }
        
        dateMap.set(paymentDate, existing);
      }
    }

    const result: DateWiseCollection[] = [];
    dateMap.forEach((value, key) => {
      result.push({
        date: key,
        total: value.total,
        cash: value.cash,
        online: value.online,
        count: value.count,
      });
    });

    // Sort by date descending
    result.sort((a, b) => b.date.localeCompare(a.date));

    return result;
  } catch (error) {
    console.error('Error getting date-wise collection:', error);
    throw error;
  }
}

// Get sheet info
export async function getSheetInfo(): Promise<{ headers: string[]; totalRows: number }> {
  const sheets = getGoogleSheetsClient();
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:Z',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { headers: [], totalRows: 0 };
    }

    return {
      headers: rows[0] as string[],
      totalRows: rows.length - 1, // Exclude header
    };
  } catch (error) {
    console.error('Error getting sheet info:', error);
    throw error;
  }
}

// ============================================
// EXPENSE FUNCTIONS
// ============================================

const EXPENSE_SHEET_NAME = 'Expenses';

// Ensure Expenses sheet exists
async function ensureExpenseSheetExists(): Promise<void> {
  const sheets = getGoogleSheetsClient();
  
  try {
    // Get spreadsheet info to check if Expenses sheet exists
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheetExists = spreadsheet.data.sheets?.some(
      sheet => sheet.properties?.title === EXPENSE_SHEET_NAME
    );

    if (!sheetExists) {
      // Create the Expenses sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: EXPENSE_SHEET_NAME,
                },
              },
            },
          ],
        },
      });

      // Add headers to the new sheet
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${EXPENSE_SHEET_NAME}!A1:D1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Description', 'Amount', 'Date', 'Payment Type']],
        },
      });
    }
  } catch (error) {
    console.error('Error ensuring expense sheet exists:', error);
    throw error;
  }
}

// Get all expenses
export async function getAllExpenses(): Promise<ExpenseData[]> {
  const sheets = getGoogleSheetsClient();
  
  try {
    await ensureExpenseSheetExists();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${EXPENSE_SHEET_NAME}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return [];
    }

    // Get headers to find column indices
    const headers = rows[0] as string[];
    
    // Find column indices based on header names
    const findColumnIndex = (patterns: string[]): number => {
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        if (!header) continue;
        const headerLower = header.toLowerCase();
        for (const pattern of patterns) {
          if (headerLower.includes(pattern.toLowerCase())) {
            return i;
          }
        }
      }
      return -1;
    };
    
    const dateColIndex = findColumnIndex(['date']);
    const nameColIndex = findColumnIndex(['member name', 'name', 'description']);
    const amountColIndex = findColumnIndex(['amount']);
    const typeColIndex = findColumnIndex(['type', 'payment type']);

    const results: ExpenseData[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      // Try to get values from expected columns, but also check if values make sense
      let name = nameColIndex !== -1 && row[nameColIndex] ? (row[nameColIndex] as string) : '';
      let amount = amountColIndex !== -1 && row[amountColIndex] ? (row[amountColIndex] as string) : '';
      let date = dateColIndex !== -1 && row[dateColIndex] ? (row[dateColIndex] as string) : '';
      let paymentType = typeColIndex !== -1 && row[typeColIndex] ? (row[typeColIndex] as string) : '';
      
      // Smart detection: if amount looks like a date, swap values
      // Amount should be a number, if it contains '/' it's likely a date
      if (amount && amount.includes('/')) {
        // Amount column has date, need to find actual amount
        // Look for numeric value in other columns
        for (let j = 0; j < row.length; j++) {
          const val = row[j] as string;
          if (val && /^\d+$/.test(val.trim()) && j !== amountColIndex) {
            // Found a pure number, this is likely the amount
            amount = val;
            break;
          }
        }
      }
      
      // If name is empty or looks like a number, find actual name
      if (!name || /^\d+$/.test(name.trim()) || name.includes('/')) {
        // Look for text that's not a date or number
        for (let j = 0; j < row.length; j++) {
          const val = row[j] as string;
          if (val && !/^\d+$/.test(val.trim()) && !val.includes('/') && j !== typeColIndex) {
            name = val;
            break;
          }
        }
      }
      
      // If date is empty or looks like a name, find actual date
      if (!date || !date.includes('/')) {
        for (let j = 0; j < row.length; j++) {
          const val = row[j] as string;
          if (val && val.includes('/') && /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(val.trim())) {
            date = val;
            break;
          }
        }
      }
      
      if (name && amount) {
        results.push({
          rowIndex: i + 1,
          description: name,
          amount: amount,
          date: date,
          paymentType: paymentType,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error getting expenses:', error);
    throw error;
  }
}

// Get total expenses
export async function getTotalExpenses(): Promise<number> {
  try {
    const expenses = await getAllExpenses();
    return expenses.reduce((total, expense) => {
      const amount = parseInt(expense.amount) || 0;
      return total + amount;
    }, 0);
  } catch (error) {
    console.error('Error getting total expenses:', error);
    return 0;
  }
}

// Add new expense
export async function addExpense(data: NewExpenseData): Promise<{ success: boolean; rowIndex?: number; error?: string }> {
  const sheets = getGoogleSheetsClient();
  
  try {
    await ensureExpenseSheetExists();

    // Get headers to find column indices
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${EXPENSE_SHEET_NAME}!1:1`,
    });

    const headers = headerResponse.data.values?.[0] as string[];
    if (!headers) {
      throw new Error('Could not find headers');
    }
    
    // Find column indices based on header names
    const findColumnIndex = (patterns: string[]): number => {
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        if (!header) continue;
        const headerLower = header.toLowerCase();
        for (const pattern of patterns) {
          if (headerLower.includes(pattern.toLowerCase())) {
            return i;
          }
        }
      }
      return -1;
    };
    
    const dateColIndex = findColumnIndex(['date']);
    const nameColIndex = findColumnIndex(['member name', 'name', 'description']);
    const amountColIndex = findColumnIndex(['amount']);
    const typeColIndex = findColumnIndex(['type', 'payment type']);
    const notesColIndex = findColumnIndex(['notes']);

    // Get current data to find next row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${EXPENSE_SHEET_NAME}!A:A`,
    });

    const rows = response.data.values;
    const nextRow = rows ? rows.length + 1 : 2;

    // Create row data with correct column mapping
    const maxColIndex = Math.max(dateColIndex, nameColIndex, amountColIndex, typeColIndex, notesColIndex);
    const rowData: string[] = [];
    
    for (let i = 0; i <= maxColIndex; i++) {
      if (i === dateColIndex) {
        rowData.push(data.date);
      } else if (i === nameColIndex) {
        rowData.push(data.description);
      } else if (i === amountColIndex) {
        rowData.push(data.amount);
      } else if (i === typeColIndex) {
        rowData.push(data.paymentType || 'online');
      } else if (i === notesColIndex) {
        rowData.push('');
      } else {
        rowData.push('');
      }
    }

    // Convert column index to letter
    function columnToLetter(column: number): string {
      let temp = '';
      while (column >= 0) {
        temp = String.fromCharCode((column % 26) + 65) + temp;
        column = Math.floor(column / 26) - 1;
      }
      return temp;
    }
    
    const colLetter = columnToLetter(maxColIndex);

    // Add the expense
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${EXPENSE_SHEET_NAME}!A${nextRow}:${colLetter}${nextRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [rowData],
      },
    });

    return { success: true, rowIndex: nextRow };
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
}

// Delete expense
export async function deleteExpense(rowIndex: number): Promise<boolean> {
  const sheets = getGoogleSheetsClient();
  
  try {
    // Clear the row by setting empty values
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${EXPENSE_SHEET_NAME}!A${rowIndex}:D${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['', '', '', '']],
      },
    });

    return true;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
}

// ============================================
// CREDENTIALS / LOGIN FUNCTIONS
// ============================================

const CREDENTIALS_SHEET_NAME = 'Credentials';

// Ensure Credentials sheet exists
async function ensureCredentialsSheetExists(): Promise<void> {
  const sheets = getGoogleSheetsClient();
  
  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheetExists = spreadsheet.data.sheets?.some(
      sheet => sheet.properties?.title === CREDENTIALS_SHEET_NAME
    );

    if (!sheetExists) {
      // Create the Credentials sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: CREDENTIALS_SHEET_NAME,
                },
              },
            },
          ],
        },
      });

      // Add headers to the new sheet
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${CREDENTIALS_SHEET_NAME}!A1:B1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['ID', 'Password']],
        },
      });
    }
  } catch (error) {
    console.error('Error ensuring credentials sheet exists:', error);
    throw error;
  }
}

// Verify login credentials
export async function verifyCredentials(id: string, password: string): Promise<{ success: boolean; error?: string }> {
  const sheets = getGoogleSheetsClient();
  
  try {
    await ensureCredentialsSheetExists();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CREDENTIALS_SHEET_NAME}!A:B`,
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return { success: false, error: 'No credentials found' };
    }

    // Check each row for matching credentials
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const sheetId = row[0] as string;
      const sheetPassword = row[1] as string;
      
      if (sheetId === id && sheetPassword === password) {
        return { success: true };
      }
    }

    return { success: false, error: 'Invalid ID or Password' };
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return { success: false, error: 'Failed to verify credentials' };
  }
}
