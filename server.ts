import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import cors from "cors";
import { body, validationResult } from "express-validator";
import axios from "axios";
import * as cheerio from "cheerio";

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
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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
