import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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
  app.get("/api/budgets/:id", async (req, res) => {
    const r = await storage.getBudget(req.params.id);
    r ? res.json(r) : res.status(404).json({ message: "Not found" });
  });
  app.post("/api/budgets", async (req, res) => {
    try { res.status(201).json(await storage.createBudget(req.body)); } catch (e: any) { res.status(400).json({ message: e.message }); }
  });
  app.put("/api/budgets/:id", async (req, res) => {
    const r = await storage.updateBudget(req.params.id, req.body);
    r ? res.json(r) : res.status(404).json({ message: "Not found" });
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

  return httpServer;
}
