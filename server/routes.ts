import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { google } from "googleapis";
import { Readable } from "stream";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // =================== HEALTH ===================
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString(), node_env: process.env.NODE_ENV });
  });

  // =================== CLIENTS ===================
  app.get("/api/clients", async (_req, res) => { res.json(await storage.getClients()); });
  app.get("/api/clients/:id", async (req, res) => {
    const r = await storage.getClient(req.params.id);
    r ? res.json(r) : res.status(404).json({ message: "Not found" });
  });
  app.post("/api/clients", async (req, res) => {
    try { res.status(201).json(await storage.createClient(req.body)); } catch (e: any) { res.status(400).json({ message: e.message }); }
  });
  app.put("/api/clients/:id", async (req, res) => {
    const r = await storage.updateClient(req.params.id, req.body);
    r ? res.json(r) : res.status(404).json({ message: "Not found" });
  });
  app.delete("/api/clients/:id", async (req, res) => {
    (await storage.deleteClient(req.params.id)) ? res.json({ success: true }) : res.status(404).json({ message: "Not found" });
  });

  // =================== BUDGETS ===================
  app.get("/api/budgets-next-id", async (_req, res) => {
    try {
      const budgets = await storage.getBudgets();
      const maxId = budgets.reduce((max, b) => Math.max(max, b.proposalId || 0), 0);
      res.json({ nextId: maxId + 1 });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.get("/api/budgets", async (_req, res) => { res.json(await storage.getBudgets()); });
  app.get("/api/budgets/trash", async (_req, res) => {
    try { res.json(await storage.getTrashedBudgets()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/budgets/:id", async (req, res) => {
    const r = await storage.getBudget(req.params.id);
    r ? res.json(r) : res.status(404).json({ message: "Not found" });
  });
  app.post("/api/budgets", async (req, res) => {
    try {
      res.status(201).json(await storage.createBudget(req.body));
    } catch (e: any) {
      console.error("Error creating budget:", e);
      res.status(400).json({ message: e.message });
    }
  });
  app.put("/api/budgets/:id", async (req, res) => {
    const r = await storage.updateBudget(req.params.id, req.body);
    r ? res.json(r) : res.status(404).json({ message: "Not found" });
  });
  app.put("/api/budgets/:id/restore", async (req, res) => {
    try { res.json({ success: await storage.restoreBudget(req.params.id) }); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.delete("/api/budgets/:id/permanent", async (req, res) => {
    try { res.json({ success: await storage.permanentDeleteBudget(req.params.id) }); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.delete("/api/budgets/:id", async (req, res) => {
    (await storage.deleteBudget(req.params.id)) ? res.json({ success: true }) : res.status(404).json({ message: "Not found" });
  });

  // =================== FINANCES ===================
  app.get("/api/finances", async (_req, res) => { res.json(await storage.getFinances()); });
  app.get("/api/finances/:id", async (req, res) => {
    const r = await storage.getFinance(req.params.id);
    r ? res.json(r) : res.status(404).json({ message: "Not found" });
  });
  app.post("/api/finances", async (req, res) => {
    try { res.status(201).json(await storage.createFinance(req.body)); } catch (e: any) { res.status(400).json({ message: e.message }); }
  });
  app.put("/api/finances/:id", async (req, res) => {
    const r = await storage.updateFinance(req.params.id, req.body);
    r ? res.json(r) : res.status(404).json({ message: "Not found" });
  });
  app.delete("/api/finances/:id", async (req, res) => {
    (await storage.deleteFinance(req.params.id)) ? res.json({ success: true }) : res.status(404).json({ message: "Not found" });
  });

  // =================== MEETINGS ===================
  app.get("/api/meetings", async (_req, res) => { res.json(await storage.getMeetings()); });
  app.get("/api/meetings/:id", async (req, res) => {
    const r = await storage.getMeeting(req.params.id);
    r ? res.json(r) : res.status(404).json({ message: "Not found" });
  });
  app.post("/api/meetings", async (req, res) => {
    try { res.status(201).json(await storage.createMeeting(req.body)); } catch (e: any) { res.status(400).json({ message: e.message }); }
  });
  app.put("/api/meetings/:id", async (req, res) => {
    const r = await storage.updateMeeting(req.params.id, req.body);
    r ? res.json(r) : res.status(404).json({ message: "Not found" });
  });
  app.delete("/api/meetings/:id", async (req, res) => {
    (await storage.deleteMeeting(req.params.id)) ? res.json({ success: true }) : res.status(404).json({ message: "Not found" });
  });

  // =================== MARKETING ===================
  app.get("/api/marketing", async (_req, res) => { res.json(await storage.getMarketingCampaigns()); });
  app.get("/api/marketing/:id", async (req, res) => {
    const r = await storage.getMarketingCampaign(req.params.id);
    r ? res.json(r) : res.status(404).json({ message: "Not found" });
  });
  app.post("/api/marketing", async (req, res) => {
    try { res.status(201).json(await storage.createMarketingCampaign(req.body)); } catch (e: any) { res.status(400).json({ message: e.message }); }
  });
  app.put("/api/marketing/:id", async (req, res) => {
    const r = await storage.updateMarketingCampaign(req.params.id, req.body);
    r ? res.json(r) : res.status(404).json({ message: "Not found" });
  });
  app.delete("/api/marketing/:id", async (req, res) => {
    (await storage.deleteMarketingCampaign(req.params.id)) ? res.json({ success: true }) : res.status(404).json({ message: "Not found" });
  });

  // =================== NOTES ===================
  app.get("/api/notes", async (_req, res) => { res.json(await storage.getNotes()); });
  app.get("/api/notes/:id", async (req, res) => {
    const r = await storage.getNote(req.params.id);
    r ? res.json(r) : res.status(404).json({ message: "Not found" });
  });
  app.post("/api/notes", async (req, res) => {
    try { res.status(201).json(await storage.createNote(req.body)); } catch (e: any) { res.status(400).json({ message: e.message }); }
  });
  app.put("/api/notes/:id", async (req, res) => {
    const r = await storage.updateNote(req.params.id, req.body);
    r ? res.json(r) : res.status(404).json({ message: "Not found" });
  });
  app.delete("/api/notes/:id", async (req, res) => {
    (await storage.deleteNote(req.params.id)) ? res.json({ success: true }) : res.status(404).json({ message: "Not found" });
  });

  // =================== TEXTS ===================
  app.get("/api/texts", async (_req, res) => { res.json(await storage.getTexts()); });
  app.get("/api/texts/:id", async (req, res) => {
    const r = await storage.getText(req.params.id);
    r ? res.json(r) : res.status(404).json({ message: "Not found" });
  });
  app.post("/api/texts", async (req, res) => {
    try { res.status(201).json(await storage.createText(req.body)); } catch (e: any) { res.status(400).json({ message: e.message }); }
  });
  app.put("/api/texts/:id", async (req, res) => {
    const r = await storage.updateText(req.params.id, req.body);
    r ? res.json(r) : res.status(404).json({ message: "Not found" });
  });
  app.delete("/api/texts/:id", async (req, res) => {
    (await storage.deleteText(req.params.id)) ? res.json({ success: true }) : res.status(404).json({ message: "Not found" });
  });

  // =================== GOOGLE DRIVE ===================
  app.post("/api/drive/upload", async (req, res) => {
    try {
      const { filename, base64Data, mimeType } = req.body;

      const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

      if (!clientEmail || !privateKey) {
        return res.status(400).json({
          message: "Credenciais do Google Drive (Service Account) não configuradas no sistema."
        });
      }

      if (!base64Data) {
        return res.status(400).json({ message: "Nenhum arquivo enviado para upload." });
      }

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
      });

      const drive = google.drive({ version: 'v3', auth });

      const buffer = Buffer.from(base64Data.split(',')[1] || base64Data, 'base64');
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      const fileMetadata: any = {
        name: filename || `Orcamento_${Date.now()}.pdf`,
      };

      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      if (folderId) {
        fileMetadata.parents = [folderId];
      }

      const media = {
        mimeType: mimeType || 'application/pdf',
        body: stream,
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });

      res.json({ success: true, fileId: file.data.id, webViewLink: file.data.webViewLink });
    } catch (e: any) {
      console.error("Error uploading to Google Drive:", e);
      res.status(500).json({ message: e.message || "Failed to upload to Google Drive" });
    }
  });

  return httpServer;
}
