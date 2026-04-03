import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import cors from "cors";
import { body, validationResult } from "express-validator";
import axios from "axios";
import * as cheerio from "cheerio";
import { google } from "googleapis";
import ExcelJS from "exceljs";
import cookieSession from "cookie-session";
import dotenv from "dotenv";

dotenv.config();

// Extend Express Request type for session
declare global {
  namespace Express {
    interface Request {
      session: {
        tokens?: any;
      } | null;
    }
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("vatx.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS vat_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    rate REAL NOT NULL,
    category TEXT,
    label TEXT,
    includeVAT BOOLEAN,
    hasInputTaxCredit BOOLEAN,
    inputTaxCreditAmount REAL DEFAULT 0,
    isExport BOOLEAN,
    isReverseCharge BOOLEAN,
    otherCharges REAL DEFAULT 0,
    currencyCode TEXT DEFAULT 'BDT',
    exchangeRate REAL DEFAULT 1,
    baseAmount REAL,
    subtotal REAL,
    vatAmount REAL,
    netVAT REAL,
    totalAmount REAL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tax_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taxYear TEXT NOT NULL,
    entityType TEXT NOT NULL,
    label TEXT,
    totalIncome REAL NOT NULL,
    businessExpenses REAL DEFAULT 0,
    capitalGains REAL DEFAULT 0,
    rentIncome REAL DEFAULT 0,
    interestIncome REAL DEFAULT 0,
    dividendIncome REAL DEFAULT 0,
    agriculturalIncome REAL DEFAULT 0,
    foreignIncome REAL DEFAULT 0,
    totalDeductions REAL DEFAULT 0,
    taxableIncome REAL DEFAULT 0,
    totalTaxLiability REAL DEFAULT 0,
    taxDue REAL DEFAULT 0,
    taxRefund REAL DEFAULT 0,
    effectiveRate REAL DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    planName TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    paymentMethod TEXT,
    amount REAL,
    transactionId TEXT,
    bankSlipUrl TEXT,
    expiresAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT DEFAULT 'Admin',
    category TEXT DEFAULT 'Tax News',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Insert some initial blog posts if empty
  INSERT INTO blog_posts (title, content, category) 
  SELECT 'New VAT Rates for 2025', 'The National Board of Revenue has announced updated VAT rates for the upcoming fiscal year...', 'VAT Updates'
  WHERE NOT EXISTS (SELECT 1 FROM blog_posts);
  
  INSERT INTO blog_posts (title, content, category) 
  SELECT 'Income Tax Filing Deadline Extended', 'Good news for taxpayers! The deadline for filing individual income tax returns has been extended by 30 days.', 'Tax News'
  WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE title = 'Income Tax Filing Deadline Extended');

  CREATE TABLE IF NOT EXISTS invoice_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sellerName TEXT,
    sellerAddress TEXT,
    sellerBin TEXT,
    buyerName TEXT,
    buyerAddress TEXT,
    buyerBin TEXT,
    items TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    bin TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tax_notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    link TEXT NOT NULL UNIQUE,
    category TEXT,
    publishedAt TEXT,
    summary TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS investment_partners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS blockchain_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fileHash TEXT NOT NULL UNIQUE,
    fileName TEXT,
    fileSize INTEGER,
    txHash TEXT,
    network TEXT DEFAULT 'Ethereum Mainnet',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tokenized_certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tokenId TEXT NOT NULL UNIQUE,
    ownerAddress TEXT NOT NULL,
    certType TEXT NOT NULL,
    issueDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',
    metadataUrl TEXT
  );

  CREATE TABLE IF NOT EXISTS mushak91_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taxpayerName TEXT,
    bin TEXT,
    address TEXT,
    taxPeriod TEXT,
    returnType TEXT,
    outputVatTotal REAL DEFAULT 0,
    inputTaxCreditTotal REAL DEFAULT 0,
    vdsTotal REAL DEFAULT 0,
    netPayable REAL DEFAULT 0,
    formData TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS social_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    label TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ocr_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sourceType TEXT DEFAULT 'social_media',
    rawText TEXT,
    extractedData TEXT,
    imageUrl TEXT,
    sourceUrl TEXT,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vds_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendorName TEXT NOT NULL,
    vendorBin TEXT,
    invoiceNo TEXT,
    invoiceDate DATE,
    totalAmount REAL,
    vatAmount REAL,
    vdsAmount REAL,
    mushak66No TEXT,
    mushak66Date DATE,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tds_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payeeName TEXT NOT NULL,
    payeeTin TEXT,
    paymentType TEXT,
    invoiceNo TEXT,
    invoiceDate DATE,
    grossAmount REAL,
    tdsRate REAL,
    tdsAmount REAL,
    challanNo TEXT,
    challanDate DATE,
    certificateNo TEXT,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tds_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    section TEXT,
    rateWithTin REAL,
    rateWithoutTin REAL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS compliance_deadlines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    deadlineDate DATE NOT NULL,
    category TEXT,
    description TEXT,
    isCompleted BOOLEAN DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vat_agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    firmName TEXT,
    licenseNo TEXT,
    location TEXT,
    rating REAL DEFAULT 5.0,
    contactNo TEXT,
    email TEXT,
    specialization TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS challan_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challanNo TEXT NOT NULL,
    bankName TEXT,
    branchName TEXT,
    amount REAL,
    verificationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'verified'
  );

  -- Initial Compliance Deadlines
  INSERT INTO compliance_deadlines (title, deadlineDate, category, description)
  SELECT 'Monthly VAT Return (Mushak 9.1)', '2026-04-15', 'VAT', 'Submission of monthly VAT return for March 2026'
  WHERE NOT EXISTS (SELECT 1 FROM compliance_deadlines WHERE title = 'Monthly VAT Return (Mushak 9.1)' AND deadlineDate = '2026-04-15');

  INSERT INTO compliance_deadlines (title, deadlineDate, category, description)
  SELECT 'Quarterly TDS Return', '2026-04-20', 'Tax', 'Submission of Tax Deducted at Source return for Q1 2026'
  WHERE NOT EXISTS (SELECT 1 FROM compliance_deadlines WHERE title = 'Quarterly TDS Return' AND deadlineDate = '2026-04-20');

  -- Initial Agents
  INSERT INTO vat_agents (name, firmName, licenseNo, location, specialization)
  SELECT 'Abdur Rahman', 'Rahman & Associates', 'VAT-10293', 'Dhaka, Motijheel', 'Manufacturing & Export'
  WHERE NOT EXISTS (SELECT 1 FROM vat_agents WHERE name = 'Abdur Rahman');

  INSERT INTO vat_agents (name, firmName, licenseNo, location, specialization)
  SELECT 'Fatima Begum', 'FB Tax Consulting', 'VAT-20394', 'Chittagong, Agrabad', 'Service Sector'
  WHERE NOT EXISTS (SELECT 1 FROM vat_agents WHERE name = 'Fatima Begum');

  -- Initial Partners
  INSERT INTO investment_partners (name, url, description)
  SELECT 'MetLife (Alico)', 'https://www.metlife.com.bd/', 'Life Insurance & Savings'
  WHERE NOT EXISTS (SELECT 1 FROM investment_partners WHERE name = 'MetLife (Alico)');
  
  INSERT INTO investment_partners (name, url, description)
  SELECT 'Jibon Bima Corp', 'http://www.jbc.gov.bd/', 'Govt. Life Insurance'
  WHERE NOT EXISTS (SELECT 1 FROM investment_partners WHERE name = 'Jibon Bima Corp');
  
  INSERT INTO investment_partners (name, url, description)
  SELECT 'IDLC Finance', 'https://idlc.com/', 'DPS & Mutual Funds'
  WHERE NOT EXISTS (SELECT 1 FROM investment_partners WHERE name = 'IDLC Finance');
  
  INSERT INTO investment_partners (name, url, description)
  SELECT 'Delta Life', 'https://www.deltalife.org/', 'Insurance Solutions'
  WHERE NOT EXISTS (SELECT 1 FROM investment_partners WHERE name = 'Delta Life');

  -- Seed TDS Rates
  INSERT INTO tds_rates (category, section, rateWithTin, rateWithoutTin, description)
  SELECT 'Supply of Goods', '52', 3, 6, 'TDS on supply of goods (general)'
  WHERE NOT EXISTS (SELECT 1 FROM tds_rates WHERE category = 'Supply of Goods');

  INSERT INTO tds_rates (category, section, rateWithTin, rateWithoutTin, description)
  SELECT 'Execution of Contract', '52', 5, 10, 'TDS on execution of contract'
  WHERE NOT EXISTS (SELECT 1 FROM tds_rates WHERE category = 'Execution of Contract');

  INSERT INTO tds_rates (category, section, rateWithTin, rateWithoutTin, description)
  SELECT 'Service Fees', '52AA', 10, 20, 'TDS on professional or technical service fees'
  WHERE NOT EXISTS (SELECT 1 FROM tds_rates WHERE category = 'Service Fees');

  INSERT INTO tds_rates (category, section, rateWithTin, rateWithoutTin, description)
  SELECT 'House Rent', '53A', 5, 10, 'TDS on house rent'
  WHERE NOT EXISTS (SELECT 1 FROM tds_rates WHERE category = 'House Rent');

  INSERT INTO tds_rates (category, section, rateWithTin, rateWithoutTin, description)
  SELECT 'Commission/Brokerage', '53E', 10, 20, 'TDS on commission or brokerage'
  WHERE NOT EXISTS (SELECT 1 FROM tds_rates WHERE category = 'Commission/Brokerage');
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'vatx-secret'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true,
    sameSite: 'none'
  }));

  // Google OAuth Setup
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL}/auth/google/callback`
  );

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Google OAuth Routes
  app.get("/auth/google/url", (req, res) => {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.file', 'profile', 'email'],
      prompt: 'consent'
    });
    res.json({ url });
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      req.session!.tokens = tokens;
      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            </script>
            <p>Authentication successful. You can close this window.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Google Auth Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.get("/api/auth/status", (req, res) => {
    res.json({ isAuthenticated: !!req.session?.tokens });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session = null;
    res.json({ success: true });
  });

  app.post("/api/drive/upload", async (req, res) => {
    const tokens = req.session?.tokens;
    if (!tokens) return res.status(401).json({ error: "Not authenticated" });

    const { content, fileName, mimeType = 'text/plain' } = req.body;
    
    try {
      oauth2Client.setCredentials(tokens);
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      
      const fileMetadata = {
        name: fileName,
      };
      const media = {
        mimeType: mimeType,
        body: content,
      };
      
      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });

      res.json({ success: true, fileId: response.data.id, link: response.data.webViewLink });
    } catch (error) {
      console.error("Drive Upload Error:", error);
      res.status(500).json({ error: "Failed to upload to Google Drive" });
    }
  });

  // VAT Calculation
  app.post("/api/vat/calculate", [
    body('amount').isFloat({ min: 0 }),
    body('rate').isFloat({ min: 0 }),
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      amount, rate, category, includeVAT, hasInputTaxCredit,
      inputTaxCreditAmount = 0, isExport, isReverseCharge,
      otherCharges = 0, currencyCode = 'BDT', exchangeRate = 1
    } = req.body;

    let baseAmount = amount;
    let vatAmount = 0;

    if (includeVAT) {
      baseAmount = amount / (1 + rate / 100);
      vatAmount = amount - baseAmount;
    } else {
      vatAmount = amount * (rate / 100);
    }

    if (isExport) vatAmount = 0;
    if (isReverseCharge) vatAmount = 0;

    const subtotal = baseAmount + otherCharges;
    const netVAT = vatAmount - (hasInputTaxCredit ? inputTaxCreditAmount : 0);
    const totalAmount = subtotal + vatAmount;

    const stmt = db.prepare(`
      INSERT INTO vat_records (
        amount, rate, category, includeVAT, hasInputTaxCredit,
        inputTaxCreditAmount, isExport, isReverseCharge, otherCharges,
        currencyCode, exchangeRate, baseAmount, subtotal, vatAmount,
        netVAT, totalAmount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      amount, rate, category, includeVAT ? 1 : 0, hasInputTaxCredit ? 1 : 0,
      inputTaxCreditAmount, isExport ? 1 : 0, isReverseCharge ? 1 : 0, otherCharges,
      currencyCode, exchangeRate, baseAmount, subtotal, vatAmount,
      netVAT, totalAmount
    );

    res.json({
      id: result.lastInsertRowid,
      baseAmount,
      otherCharges,
      subtotal,
      vatAmount,
      inputTaxCredit: hasInputTaxCredit ? inputTaxCreditAmount : 0,
      netVAT,
      totalAmount,
      effectiveRate: rate
    });
  });

  // Income Tax Calculation (Simplified for demo)
  app.post("/api/tax/income/calculate", (req, res) => {
    const {
      totalIncome, businessExpenses = 0, capitalGains = 0,
      rentIncome = 0, interestIncome = 0, dividendIncome = 0,
      taxYear = '2024-25', entityType = 'individual'
    } = req.body;

    const netIncome = totalIncome - businessExpenses + capitalGains + rentIncome + interestIncome + dividendIncome;
    
    // Simple progressive tax for individual
    let taxableIncome = Math.max(0, netIncome - 300000); // 3L threshold
    let tax = 0;
    
    if (entityType === 'individual') {
      if (taxableIncome > 0) {
        const slab1 = Math.min(taxableIncome, 100000);
        tax += slab1 * 0.05;
        taxableIncome -= slab1;
      }
      if (taxableIncome > 0) {
        const slab2 = Math.min(taxableIncome, 100000);
        tax += slab2 * 0.10;
        taxableIncome -= slab2;
      }
      if (taxableIncome > 0) {
        tax += taxableIncome * 0.15;
      }
    } else {
      tax = netIncome * 0.25; // Corporate flat 25%
    }

    const stmt = db.prepare(`
      INSERT INTO tax_records (
        taxYear, entityType, totalIncome, businessExpenses, capitalGains,
        rentIncome, interestIncome, dividendIncome, taxableIncome,
        totalTaxLiability, effectiveRate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      taxYear, entityType, totalIncome, businessExpenses, capitalGains,
      rentIncome, interestIncome, dividendIncome, Math.max(0, netIncome - 300000),
      tax, (tax / totalIncome) * 100
    );

    res.json({
      id: result.lastInsertRowid,
      totalIncome: netIncome,
      taxableIncome: Math.max(0, netIncome - 300000),
      totalTaxLiability: tax,
      effectiveRate: (tax / totalIncome) * 100
    });
  });

  app.get("/api/history/vat", (req, res) => {
    const records = db.prepare("SELECT * FROM vat_records ORDER BY createdAt DESC LIMIT 50").all();
    res.json(records);
  });

  app.get("/api/history/tax", (req, res) => {
    const records = db.prepare("SELECT * FROM tax_records ORDER BY createdAt DESC LIMIT 50").all();
    res.json(records);
  });

  app.patch("/api/history/vat/:id", (req, res) => {
    const { id } = req.params;
    const { label } = req.body;
    db.prepare("UPDATE vat_records SET label = ? WHERE id = ?").run(label, id);
    res.json({ success: true });
  });

  app.patch("/api/history/tax/:id", (req, res) => {
    const { id } = req.params;
    const { label } = req.body;
    db.prepare("UPDATE tax_records SET label = ? WHERE id = ?").run(label, id);
    res.json({ success: true });
  });

  // Subscription Routes
  app.get("/api/subscription", (req, res) => {
    const sub = db.prepare("SELECT * FROM subscriptions ORDER BY createdAt DESC LIMIT 1").get();
    res.json(sub || { status: 'none' });
  });

  app.post("/api/subscription/subscribe", (req, res) => {
    const { planName, paymentMethod, amount, transactionId } = req.body;
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    
    const result = db.prepare(`
      INSERT INTO subscriptions (planName, status, paymentMethod, amount, transactionId, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(planName, 'active', paymentMethod, amount, transactionId, expiresAt.toISOString());
    
    res.json({ success: true, id: result.lastInsertRowid });
  });

  app.post("/api/subscription/bank-payment", (req, res) => {
    const { planName, amount, bankSlipUrl } = req.body;
    const result = db.prepare(`
      INSERT INTO subscriptions (planName, status, paymentMethod, amount, bankSlipUrl)
      VALUES (?, ?, ?, ?, ?)
    `).run(planName, 'pending', 'bank', amount, bankSlipUrl);
    
    res.json({ success: true, id: result.lastInsertRowid });
  });

  // Blog Routes
  app.get("/api/blog", (req, res) => {
    const posts = db.prepare("SELECT * FROM blog_posts ORDER BY createdAt DESC").all();
    res.json(posts);
  });

  app.post("/api/blog", [
    body('title').notEmpty(),
    body('content').notEmpty(),
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, content, author = 'Admin', category = 'Tax News' } = req.body;
    const stmt = db.prepare("INSERT INTO blog_posts (title, content, author, category) VALUES (?, ?, ?, ?)");
    const result = stmt.run(title, content, author, category);
    res.json({ id: result.lastInsertRowid, title, content, author, category });
  });

  // Invoice Template Routes
  app.get("/api/invoice/templates", (req, res) => {
    const templates = db.prepare("SELECT * FROM invoice_templates ORDER BY createdAt DESC").all();
    res.json(templates.map(t => ({
      ...t,
      items: JSON.parse(t.items || '[]')
    })));
  });

  app.post("/api/invoice/templates", [
    body('name').notEmpty(),
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, sellerName, sellerAddress, sellerBin, buyerName, buyerAddress, buyerBin, items } = req.body;
    const stmt = db.prepare(`
      INSERT INTO invoice_templates (
        name, sellerName, sellerAddress, sellerBin, buyerName, buyerAddress, buyerBin, items
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, sellerName, sellerAddress, sellerBin, buyerName, buyerAddress, buyerBin, JSON.stringify(items));
    res.json({ id: result.lastInsertRowid, name });
  });

  app.delete("/api/invoice/templates/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM invoice_templates WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Client Management Routes
  app.get("/api/clients", (req, res) => {
    const clients = db.prepare("SELECT * FROM clients ORDER BY name ASC").all();
    res.json(clients);
  });

  app.post("/api/clients", [
    body('name').notEmpty(),
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, address, bin } = req.body;
    const stmt = db.prepare("INSERT INTO clients (name, address, bin) VALUES (?, ?, ?)");
    const result = stmt.run(name, address, bin);
    res.json({ id: result.lastInsertRowid, name, address, bin });
  });

  app.delete("/api/clients/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM clients WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.patch("/api/clients/:id", (req, res) => {
    const { id } = req.params;
    const { name, address, bin } = req.body;
    db.prepare("UPDATE clients SET name = ?, address = ?, bin = ? WHERE id = ?").run(name, address, bin, id);
    res.json({ success: true });
  });

  // Tax Notices Routes
  app.get("/api/notices", (req, res) => {
    const notices = db.prepare("SELECT * FROM tax_notices ORDER BY createdAt DESC LIMIT 20").all();
    res.json(notices);
  });

  app.post("/api/notices/summarize/:id", async (req, res) => {
    const { id } = req.params;
    const notice = db.prepare("SELECT * FROM tax_notices WHERE id = ?").get(id) as any;
    
    if (!notice) return res.status(404).json({ error: "Notice not found" });
    if (notice.summary) return res.json({ summary: notice.summary });

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this Bangladesh Tax/VAT notice title and explain its likely impact on taxpayers or businesses in 2-3 concise bullet points. 
        Notice Title: ${notice.title}
        Category: ${notice.category}`,
        config: {
          systemInstruction: "You are a senior tax consultant in Bangladesh. Provide practical, impact-focused summaries.",
        }
      });

      const summary = response.text || "Summary unavailable.";
      db.prepare("UPDATE tax_notices SET summary = ? WHERE id = ?").run(summary, id);
      res.json({ summary });
    } catch (error) {
      console.error("Summarization failed:", error);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  app.get("/api/search", (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== "string") return res.json({ results: [] });

    const searchTerm = `%${q}%`;
    const results: any[] = [];

    // Search Blog Posts
    const blogPosts = db.prepare("SELECT id, title, 'blog' as type FROM blog_posts WHERE title LIKE ? OR content LIKE ? LIMIT 5").all(searchTerm, searchTerm);
    results.push(...blogPosts);

    // Search Clients
    const clients = db.prepare("SELECT id, name as title, 'client' as type FROM clients WHERE name LIKE ? OR bin LIKE ? LIMIT 5").all(searchTerm, searchTerm);
    results.push(...clients);

    // Search Tax Notices
    const notices = db.prepare("SELECT id, title, 'notice' as type, link FROM tax_notices WHERE title LIKE ? LIMIT 5").all(searchTerm);
    results.push(...notices);

    // Search Invoices
    const invoices = db.prepare("SELECT id, name as title, 'invoice' as type FROM invoice_templates WHERE name LIKE ? OR buyerName LIKE ? LIMIT 5").all(searchTerm, searchTerm);
    results.push(...invoices);

    res.json({ results });
  });

  app.post("/api/hscode/search", async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Search for HS Code and duty rates in Bangladesh for: ${query}. 
        Return the result as a JSON array of objects with the following properties:
        - hsCode: string
        - description: string
        - cd: number (Customs Duty %)
        - sd: number (Supplementary Duty %)
        - vat: number (VAT %)
        - ait: number (Advance Income Tax %)
        - rd: number (Regulatory Duty %)
        - at: number (Advance Tax %)
        Limit to 5 results.`,
        config: {
          responseMimeType: "application/json",
        }
      });

      const results = JSON.parse(response.text || "[]");
      res.json(results);
    } catch (error) {
      console.error("HS Code search failed:", error);
      res.status(500).json({ error: "Failed to search HS codes" });
    }
  });

  // Background task to fetch notices
  async function fetchLatestNotices() {
    console.log("Fetching latest tax notices from NBR...");
    const sources = [
      { url: "https://nbr.gov.bd/information-library/publicnotice-details/income-tax/eng", category: "Income Tax" },
      { url: "https://nbr.gov.bd/information-library/publicnotice-details/vat/eng", category: "VAT" },
      { url: "https://nbr.gov.bd/information-library/publicnotice-details/customs/eng", category: "Customs" }
    ];

    let newCount = 0;
    for (const source of sources) {
      try {
        const response = await axios.get(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000
        });
        const $ = cheerio.load(response.data);
        
        $("a").each((i, el) => {
          const title = $(el).text().trim();
          const link = $(el).attr("href");
          
          if (link && title && title.length > 5 && (link.includes("/uploads/publications/") || link.includes("details"))) {
            const fullLink = link.startsWith("http") ? link : `https://nbr.gov.bd${link}`;
            
            try {
              const stmt = db.prepare("INSERT OR IGNORE INTO tax_notices (title, link, category) VALUES (?, ?, ?)");
              const info = stmt.run(title, fullLink, source.category);
              if (info.changes > 0) newCount++;
            } catch (e) {
              // Ignore duplicates
            }
          }
        });
      } catch (error) {
        console.error(`Error fetching notices from ${source.url}:`, error.message);
      }
    }
    console.log(`Notice fetch complete. Added ${newCount} new notices.`);
    return newCount;
  }

  app.post("/api/notices/refresh", async (req, res) => {
    try {
      const count = await fetchLatestNotices();
      res.json({ success: true, newNotices: count });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Investment Partners Routes
  app.get("/api/investment-partners", (req, res) => {
    const partners = db.prepare("SELECT * FROM investment_partners ORDER BY name ASC").all();
    res.json(partners);
  });

  app.post("/api/investment-partners", [
    body('name').notEmpty(),
    body('url').isURL(),
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, url, description } = req.body;
    const stmt = db.prepare("INSERT INTO investment_partners (name, url, description) VALUES (?, ?, ?)");
    const result = stmt.run(name, url, description);
    res.json({ id: result.lastInsertRowid, name, url, description });
  });

  app.delete("/api/investment-partners/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM investment_partners WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Blockchain Verification Routes
  app.post("/api/blockchain/verify", (req, res) => {
    const { fileHash, fileName, fileSize, checkOnly } = req.body;
    const existing = db.prepare("SELECT * FROM blockchain_verifications WHERE fileHash = ?").get(fileHash);
    
    if (existing) {
      return res.json({ verified: true, anchored: false, data: existing });
    }

    if (checkOnly) {
      return res.json({ verified: false, anchored: false });
    }
    
    // Simulate anchoring on blockchain
    const txHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const stmt = db.prepare("INSERT INTO blockchain_verifications (fileHash, fileName, fileSize, txHash) VALUES (?, ?, ?, ?)");
    stmt.run(fileHash, fileName, fileSize, txHash);
    
    res.json({ 
      verified: true, 
      anchored: true,
      data: { fileHash, fileName, fileSize, txHash, network: 'Ethereum Mainnet', createdAt: new Date().toISOString() } 
    });
  });

  app.get("/api/blockchain/history", (req, res) => {
    const history = db.prepare("SELECT * FROM blockchain_verifications ORDER BY createdAt DESC").all();
    res.json(history);
  });

  // Tokenized Certificates Routes
  app.get("/api/blockchain/certificates", (req, res) => {
    const certs = db.prepare("SELECT * FROM tokenized_certificates ORDER BY issueDate DESC").all();
    res.json(certs);
  });

  app.post("/api/blockchain/certificates/mint", (req, res) => {
    const { ownerAddress, certType } = req.body;
    const tokenId = "SBT-" + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const stmt = db.prepare("INSERT INTO tokenized_certificates (tokenId, ownerAddress, certType) VALUES (?, ?, ?)");
    stmt.run(tokenId, ownerAddress, certType);
    res.json({ success: true, tokenId, ownerAddress, certType });
  });

  app.patch("/api/blockchain/certificates/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare("UPDATE tokenized_certificates SET status = ? WHERE id = ?").run(status, id);
    res.json({ success: true });
  });

  // Mushak-9.1 Routes
  app.post("/api/mushak91", (req, res) => {
    const { 
      taxpayerName, bin, address, taxPeriod, returnType, 
      outputVatTotal, inputTaxCreditTotal, vdsTotal, netPayable, 
      formData 
    } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO mushak91_submissions (
        taxpayerName, bin, address, taxPeriod, returnType, 
        outputVatTotal, inputTaxCreditTotal, vdsTotal, netPayable, 
        formData
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      taxpayerName, bin, address, taxPeriod, returnType, 
      outputVatTotal, inputTaxCreditTotal, vdsTotal, netPayable, 
      JSON.stringify(formData)
    );
    
    res.json({ success: true, id: result.lastInsertRowid });
  });

  app.get("/api/mushak91", (req, res) => {
    const submissions = db.prepare("SELECT * FROM mushak91_submissions ORDER BY createdAt DESC").all();
    res.json(submissions.map(s => ({ ...s, formData: JSON.parse(s.formData) })));
  });

  app.get("/api/mushak91/:id", (req, res) => {
    const { id } = req.params;
    const submission = db.prepare("SELECT * FROM mushak91_submissions WHERE id = ?").get(id) as any;
    if (!submission) return res.status(404).json({ error: "Submission not found" });
    res.json({ ...submission, formData: JSON.parse(submission.formData) });
  });

  // Social Integration Routes
  app.get("/api/social/links", (req, res) => {
    const links = db.prepare("SELECT * FROM social_links ORDER BY createdAt DESC").all();
    res.json(links);
  });

  app.post("/api/social/links", (req, res) => {
    const { platform, url, label } = req.body;
    const result = db.prepare("INSERT INTO social_links (platform, url, label) VALUES (?, ?, ?)").run(platform, url, label);
    res.json({ id: result.lastInsertRowid, platform, url, label });
  });

  app.delete("/api/social/links/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM social_links WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/social/ocr", (req, res) => {
    const entries = db.prepare("SELECT * FROM ocr_entries ORDER BY createdAt DESC").all();
    res.json(entries.map(e => ({ ...e, extractedData: JSON.parse(e.extractedData || '{}') })));
  });

  app.post("/api/social/ocr", async (req, res) => {
    const { rawText, extractedData, imageUrl, sourceUrl, sourceType } = req.body;
    const result = db.prepare("INSERT INTO ocr_entries (rawText, extractedData, imageUrl, sourceUrl, sourceType) VALUES (?, ?, ?, ?, ?)")
      .run(rawText, JSON.stringify(extractedData), imageUrl, sourceUrl, sourceType);
    res.json({ id: result.lastInsertRowid, success: true });
  });

  // VDS Tracker Routes
  app.get("/api/vds", (req, res) => {
    const records = db.prepare("SELECT * FROM vds_records ORDER BY createdAt DESC").all();
    res.json(records);
  });

  app.post("/api/vds", (req, res) => {
    const { vendorName, vendorBin, invoiceNo, invoiceDate, totalAmount, vatAmount, vdsAmount, mushak66No, mushak66Date, status } = req.body;
    const stmt = db.prepare(`
      INSERT INTO vds_records (vendorName, vendorBin, invoiceNo, invoiceDate, totalAmount, vatAmount, vdsAmount, mushak66No, mushak66Date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(vendorName, vendorBin, invoiceNo, invoiceDate, totalAmount, vatAmount, vdsAmount, mushak66No, mushak66Date, status || 'pending');
    res.json({ id: result.lastInsertRowid, success: true });
  });

  app.patch("/api/vds/:id", (req, res) => {
    const { id } = req.params;
    const { status, mushak66No, mushak66Date } = req.body;
    db.prepare("UPDATE vds_records SET status = ?, mushak66No = ?, mushak66Date = ? WHERE id = ?").run(status, mushak66No, mushak66Date, id);
    res.json({ success: true });
  });

  // TDS Routes
  app.get("/api/tds", (req, res) => {
    const records = db.prepare("SELECT * FROM tds_records ORDER BY createdAt DESC").all();
    res.json(records);
  });

  app.post("/api/tds", (req, res) => {
    const { payeeName, payeeTin, paymentType, invoiceNo, invoiceDate, grossAmount, tdsRate, tdsAmount } = req.body;
    const result = db.prepare(`
      INSERT INTO tds_records (payeeName, payeeTin, paymentType, invoiceNo, invoiceDate, grossAmount, tdsRate, tdsAmount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(payeeName, payeeTin, paymentType, invoiceNo, invoiceDate, grossAmount, tdsRate, tdsAmount);
    res.json({ id: result.lastInsertRowid });
  });

  app.patch("/api/tds/:id", (req, res) => {
    const { id } = req.params;
    const { status, challanNo, challanDate, certificateNo } = req.body;
    db.prepare("UPDATE tds_records SET status = ?, challanNo = ?, challanDate = ?, certificateNo = ? WHERE id = ?").run(status, challanNo, challanDate, certificateNo, id);
    res.json({ success: true });
  });

  app.get("/api/tds/rates", (req, res) => {
    const rates = db.prepare("SELECT * FROM tds_rates").all();
    res.json(rates);
  });

  app.post("/api/tds/rates", (req, res) => {
    const { category, section, rateWithTin, rateWithoutTin, description } = req.body;
    if (!category) return res.status(400).json({ error: "Category is required" });
    
    const result = db.prepare(`
      INSERT INTO tds_rates (category, section, rateWithTin, rateWithoutTin, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(category, section, rateWithTin, rateWithoutTin, description);
    
    res.status(201).json({ id: result.lastInsertRowid });
  });

  app.put("/api/tds/rates/:id", (req, res) => {
    const { id } = req.params;
    const { category, section, rateWithTin, rateWithoutTin, description } = req.body;
    
    const result = db.prepare(`
      UPDATE tds_rates 
      SET category = ?, section = ?, rateWithTin = ?, rateWithoutTin = ?, description = ?
      WHERE id = ?
    `).run(category, section, rateWithTin, rateWithoutTin, description, id);
    
    if (result.changes === 0) return res.status(404).json({ error: "Rate not found" });
    res.json({ success: true });
  });

  app.delete("/api/tds/rates/:id", (req, res) => {
    const { id } = req.params;
    const result = db.prepare("DELETE FROM tds_rates WHERE id = ?").run(id);
    if (result.changes === 0) return res.status(404).json({ error: "Rate not found" });
    res.json({ success: true });
  });

  // Compliance Calendar Routes
  app.get("/api/compliance", (req, res) => {
    const deadlines = db.prepare("SELECT * FROM compliance_deadlines ORDER BY deadlineDate ASC").all();
    res.json(deadlines);
  });

  app.post("/api/compliance", (req, res) => {
    const { title, date, category, description } = req.body;
    if (!title || !date) return res.status(400).json({ error: "Title and date are required" });
    
    try {
      const result = db.prepare(`
        INSERT INTO compliance_deadlines (title, deadlineDate, category, description)
        VALUES (?, ?, ?, ?)
      `).run(title, date, category, description);
      
      res.status(201).json({ id: result.lastInsertRowid, title, deadlineDate: date, category, description, isCompleted: 0 });
    } catch (err) {
      console.error("Failed to add compliance deadline", err);
      res.status(500).json({ error: "Failed to add compliance deadline" });
    }
  });

  app.patch("/api/compliance/:id", (req, res) => {
    const { id } = req.params;
    const current = db.prepare("SELECT isCompleted FROM compliance_deadlines WHERE id = ?").get(id) as any;
    if (!current) return res.status(404).json({ error: "Deadline not found" });
    
    const newStatus = current.isCompleted ? 0 : 1;
    db.prepare("UPDATE compliance_deadlines SET isCompleted = ? WHERE id = ?").run(newStatus, id);
    res.json({ success: true, isCompleted: newStatus });
  });

  // VAT Agent Routes
  app.get("/api/agents", (req, res) => {
    const agents = db.prepare("SELECT * FROM vat_agents ORDER BY rating DESC").all();
    res.json(agents);
  });

  // Challan Verification Routes
  app.post("/api/challan/verify", (req, res) => {
    const { challanNo } = req.body;
    // Simulate verification
    const existing = db.prepare("SELECT * FROM challan_verifications WHERE challanNo = ?").get(challanNo);
    if (existing) return res.json({ verified: true, data: existing });

    const bankName = "Sonali Bank PLC";
    const branchName = "Local Office, Motijheel";
    const amount = Math.floor(Math.random() * 50000) + 5000;
    
    const stmt = db.prepare("INSERT INTO challan_verifications (challanNo, bankName, branchName, amount) VALUES (?, ?, ?, ?)");
    stmt.run(challanNo, bankName, branchName, amount);
    
    res.json({ 
      verified: true, 
      data: { challanNo, bankName, branchName, amount, verificationDate: new Date().toISOString(), status: 'verified' } 
    });
  });

  // Base (Database Management) Routes
  app.get("/api/base/tables", (req, res) => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    res.json(tables);
  });

  app.get("/api/base/table/:name", (req, res) => {
    const { name } = req.params;
    try {
      const schema = db.prepare(`PRAGMA table_info(${name})`).all();
      const data = db.prepare(`SELECT * FROM ${name} LIMIT 100`).all();
      res.json({ schema, data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/base/query", (req, res) => {
    const { sql } = req.body;
    if (!sql) return res.status(400).json({ error: "SQL query is required" });
    
    // Basic safety check (only for demo/dev purposes)
    const lowerSql = sql.toLowerCase().trim();
    if (lowerSql.startsWith("drop") || lowerSql.startsWith("delete") || lowerSql.startsWith("truncate")) {
      // Allow but warn? Or restrict? 
      // For now, let's allow it but maybe only if it's not a system table.
    }

    try {
      const result = db.prepare(sql).all();
      res.json(result);
    } catch (error) {
      // If it's a non-SELECT query, it might not return results
      try {
        const info = db.prepare(sql).run();
        res.json({ success: true, changes: info.changes });
      } catch (runError) {
        res.status(400).json({ error: runError.message });
      }
    }
  });

  app.get("/api/base/export/:table", async (req, res) => {
    const { table } = req.params;
    try {
      const data = db.prepare(`SELECT * FROM ${table}`).all();
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(table);
      
      if (data.length > 0) {
        const columns = Object.keys(data[0]).map(key => ({ header: key, key }));
        worksheet.columns = columns;
        worksheet.addRows(data);
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${table}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // X (Twitter) Scraper Routes
  const XQUIK_BASE_URL = "https://xquik.com/api/v1";
  const xquikHeaders = {
    "x-api-key": process.env.XQUIK_API_KEY || ""
  };

  app.get("/api/x/search", async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Query is required" });
    try {
      const response = await axios.get(`${XQUIK_BASE_URL}/x/tweets/search`, {
        params: { q },
        headers: xquikHeaders
      });
      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  });

  app.get("/api/x/user/:username", async (req, res) => {
    const { username } = req.params;
    try {
      const response = await axios.get(`${XQUIK_BASE_URL}/x/users/${username}`, {
        headers: xquikHeaders
      });
      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  });

  app.get("/api/x/trends", async (req, res) => {
    try {
      const response = await axios.get(`${XQUIK_BASE_URL}/trends`, {
        headers: xquikHeaders
      });
      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  });

  // WhatsApp Automation Routes (via Composio/Rube)
  const COMPOSIO_BASE_URL = "https://api.composio.ai/v1";
  const composioHeaders = {
    "x-api-key": process.env.COMPOSIO_API_KEY || "",
    "Content-Type": "application/json"
  };

  app.get("/api/whatsapp/numbers", async (req, res) => {
    try {
      // In a real scenario, we'd use the Composio SDK or direct API
      // For this implementation, we'll proxy to the WhatsApp toolkit
      const response = await axios.post(`${COMPOSIO_BASE_URL}/actions/execute`, {
        action: "whatsapp_get_phone_numbers",
        params: {}
      }, { headers: composioHeaders });
      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  });

  app.post("/api/whatsapp/send", async (req, res) => {
    const { to, body, phone_number_id } = req.body;
    try {
      const response = await axios.post(`${COMPOSIO_BASE_URL}/actions/execute`, {
        action: "whatsapp_send_message",
        params: { to, body, phone_number_id }
      }, { headers: composioHeaders });
      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  });

  app.get("/api/whatsapp/templates", async (req, res) => {
    try {
      const response = await axios.post(`${COMPOSIO_BASE_URL}/actions/execute`, {
        action: "whatsapp_get_message_templates",
        params: {}
      }, { headers: composioHeaders });
      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  });

  app.post("/api/whatsapp/send-template", async (req, res) => {
    const { template_name, language_code, to, components, phone_number_id } = req.body;
    try {
      const response = await axios.post(`${COMPOSIO_BASE_URL}/actions/execute`, {
        action: "whatsapp_send_template_message",
        params: { template_name, language_code, to, components, phone_number_id }
      }, { headers: composioHeaders });
      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  });

  // Dropbox Automation Routes (via Composio/Rube)
  app.get("/api/dropbox/list", async (req, res) => {
    const { path = "" } = req.query;
    try {
      const response = await axios.post(`${COMPOSIO_BASE_URL}/actions/execute`, {
        action: "dropbox_list_files_in_folder",
        params: { path }
      }, { headers: composioHeaders });
      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  });

  app.get("/api/dropbox/search", async (req, res) => {
    const { q } = req.query;
    try {
      const response = await axios.post(`${COMPOSIO_BASE_URL}/actions/execute`, {
        action: "dropbox_search_file_or_folder",
        params: { query: q }
      }, { headers: composioHeaders });
      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  });

  app.post("/api/dropbox/upload", async (req, res) => {
    const { path, content } = req.body;
    try {
      const response = await axios.post(`${COMPOSIO_BASE_URL}/actions/execute`, {
        action: "dropbox_upload_file",
        params: { path, content }
      }, { headers: composioHeaders });
      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  });

  app.post("/api/dropbox/share", async (req, res) => {
    const { path } = req.body;
    try {
      const response = await axios.post(`${COMPOSIO_BASE_URL}/actions/execute`, {
        action: "dropbox_create_shared_link",
        params: { path }
      }, { headers: composioHeaders });
      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  });

  // Odoo ERP Integration Routes (via Composio/Rube)
  app.get("/api/odoo/search", async (req, res) => {
    const { model, domain = "[]", fields = "[]" } = req.query;
    try {
      const response = await axios.post(`${COMPOSIO_BASE_URL}/actions/execute`, {
        action: "odoo_search_read",
        params: { 
          model, 
          domain: JSON.parse(domain as string), 
          fields: JSON.parse(fields as string) 
        }
      }, { headers: composioHeaders });
      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  });

  app.post("/api/odoo/create", async (req, res) => {
    const { model, values } = req.body;
    try {
      const response = await axios.post(`${COMPOSIO_BASE_URL}/actions/execute`, {
        action: "odoo_create_record",
        params: { model, values }
      }, { headers: composioHeaders });
      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  });

  app.get("/api/odoo/fields", async (req, res) => {
    const { model } = req.query;
    try {
      const response = await axios.post(`${COMPOSIO_BASE_URL}/actions/execute`, {
        action: "odoo_get_model_fields",
        params: { model }
      }, { headers: composioHeaders });
      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  });

  // ERPNext Integration Routes (via Composio/Rube)
  app.get("/api/erpnext/list", async (req, res) => {
    const { doctype, filters = "{}", fields = '["*"]' } = req.query;
    try {
      const response = await axios.post(`${COMPOSIO_BASE_URL}/actions/execute`, {
        action: "erpnext_list_resource",
        params: { 
          doctype, 
          filters: JSON.parse(filters as string), 
          fields: JSON.parse(fields as string) 
        }
      }, { headers: composioHeaders });
      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  });

  app.get("/api/erpnext/get", async (req, res) => {
    const { doctype, name } = req.query;
    try {
      const response = await axios.post(`${COMPOSIO_BASE_URL}/actions/execute`, {
        action: "erpnext_get_resource",
        params: { doctype, name }
      }, { headers: composioHeaders });
      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  });

  app.post("/api/erpnext/create", async (req, res) => {
    const { doctype, data } = req.body;
    try {
      const response = await axios.post(`${COMPOSIO_BASE_URL}/actions/execute`, {
        action: "erpnext_create_resource",
        params: { doctype, data }
      }, { headers: composioHeaders });
      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  });

  // Run immediately on start and then every 2 hours
  fetchLatestNotices();
  setInterval(fetchLatestNotices, 1000 * 60 * 60 * 2);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
