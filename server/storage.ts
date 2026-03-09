import {
  type User, type InsertUser,
  type Client, type InsertClient,
  type Budget, type InsertBudget,
  type Finance, type InsertFinance,
  type Meeting, type InsertMeeting,
  type Marketing, type InsertMarketing,
  type Note, type InsertNote,
  type Text, type InsertText,
} from "@shared/schema";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(
  supabaseUrl || "https://wvncdusvpfbdsnclynxl.supabase.co",
  supabaseKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bmNkdXN2cGZiZHNuY2x5bnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMjQyNjEsImV4cCI6MjA4NzYwMDI2MX0.aSNumnERTQ8L-74raclsbdIh3NDF6gDZKOn3mm8gEcg"
);

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;

  // Budgets
  getBudgets(): Promise<Budget[]>;
  getBudget(id: string): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: string, budget: Partial<InsertBudget>): Promise<Budget | undefined>;
  deleteBudget(id: string): Promise<boolean>; // soft delete → lixeira
  getTrashedBudgets(): Promise<Budget[]>; // orçamentos na lixeira
  restoreBudget(id: string): Promise<boolean>; // restaura da lixeira
  permanentDeleteBudget(id: string): Promise<boolean>; // exclui permanentemente

  // Finances
  getFinances(): Promise<Finance[]>;
  getFinance(id: string): Promise<Finance | undefined>;
  createFinance(finance: InsertFinance): Promise<Finance>;
  updateFinance(id: string, finance: Partial<InsertFinance>): Promise<Finance | undefined>;
  deleteFinance(id: string): Promise<boolean>;

  // Meetings
  getMeetings(): Promise<Meeting[]>;
  getMeeting(id: string): Promise<Meeting | undefined>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: string, meeting: Partial<InsertMeeting>): Promise<Meeting | undefined>;
  deleteMeeting(id: string): Promise<boolean>;

  // Marketing
  getMarketingCampaigns(): Promise<Marketing[]>;
  getMarketingCampaign(id: string): Promise<Marketing | undefined>;
  createMarketingCampaign(campaign: InsertMarketing): Promise<Marketing>;
  updateMarketingCampaign(id: string, campaign: Partial<InsertMarketing>): Promise<Marketing | undefined>;
  deleteMarketingCampaign(id: string): Promise<boolean>;

  // Notes
  getNotes(): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;

  // Texts
  getTexts(): Promise<Text[]>;
  getText(id: string): Promise<Text | undefined>;
  createText(text: InsertText): Promise<Text>;
  updateText(id: string, text: Partial<InsertText>): Promise<Text | undefined>;
  deleteText(id: string): Promise<boolean>;
}

export class SupabaseStorage implements IStorage {
  // --- Mappers to map snake_case DB columns to camelCase TS fields ---
  private mapClient(row: any): Client {
    if (!row) return row;
    return {
      id: row.id, name: row.name, email: row.email, phone: row.phone,
      company: row.company, birthday: row.birthday, notes: row.notes, createdAt: new Date(row.created_at)
    };
  }

  private mapBudget(row: any): Budget {
    if (!row) return row;
    // Fallbacks para campos que podem estar ausentes em esquemas antigos/quebrados
    return {
      id: row.id || "",
      proposalId: row.proposal_id || null,
      clientId: row.client_id || null,
      clientName: row.client_name || "Desconhecido",
      title: row.title || "Sem título",
      status: (row.status || "rascunho") as any,
      totalValue: row.total_value || 0,
      currency: row.currency || "BRL",
      validityDate: row.validity_date || null,
      paymentTerms: row.payment_terms || null,
      notes: row.notes || null,
      items: row.items || [],
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    };
  }

  private mapFinance(row: any): Finance {
    if (!row) return row;
    return {
      id: row.id, description: row.description, type: row.type as any, category: row.category,
      amount: row.amount, date: row.date, notes: row.notes, createdAt: new Date(row.created_at)
    };
  }

  private mapMeeting(row: any): Meeting {
    if (!row) return row;
    return {
      id: row.id, title: row.title, description: row.description, date: row.date,
      time: row.time, duration: row.duration, participants: row.participants,
      location: row.location, status: row.status as any, notes: row.notes, createdAt: new Date(row.created_at)
    };
  }

  private mapMarketing(row: any): Marketing {
    if (!row) return row;
    return {
      id: row.id, name: row.name, type: row.type as any, status: row.status as any,
      budget: row.budget, spent: row.spent, startDate: row.start_date, endDate: row.end_date,
      description: row.description, notes: row.notes, createdAt: new Date(row.created_at)
    };
  }

  private mapNote(row: any): Note {
    if (!row) return row;
    return {
      id: row.id, title: row.title, content: row.content, category: row.category,
      pinned: row.pinned, color: row.color, createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at)
    };
  }

  private mapText(row: any): Text {
    if (!row) return row;
    return {
      id: row.id, title: row.title, content: row.content, createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at)
    };
  }

  // --- Users ---
  async getUser(id: string): Promise<User | undefined> {
    const { data } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
    return data || undefined;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data } = await supabase.from("users").select("*").eq("username", username).maybeSingle();
    return data || undefined;
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabase.from("users").insert(insertUser).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  // --- Clients ---
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data.map(this.mapClient);
  }
  async getClient(id: string): Promise<Client | undefined> {
    const { data } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
    return data ? this.mapClient(data) : undefined;
  }
  async createClient(client: InsertClient): Promise<Client> {
    const { data, error } = await supabase.from('clients').insert(client).select().single();
    if (error) throw new Error(error.message);
    return this.mapClient(data);
  }
  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined> {
    const { data, error } = await supabase.from('clients').update(client).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return this.mapClient(data);
  }
  async deleteClient(id: string): Promise<boolean> {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  // --- Budgets ---
  async getBudgets(): Promise<Budget[]> {
    // Tenta filtrar por deleted_at IS NULL; se a coluna não existir, retorna todos e filtra em memória
    const { data, error } = await supabase.from('budgets').select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) {
      // Fallback: se a coluna não existir ainda, retorna todos sem filtro
      const { data: allData, error: e2 } = await supabase.from('budgets').select('*').order('created_at', { ascending: false });
      if (e2) throw new Error(e2.message);
      return (allData || []).map(this.mapBudget);
    }
    return (data || []).map(this.mapBudget);
  }
  async getBudget(id: string): Promise<Budget | undefined> {
    const cols = 'id, proposal_id, client_id, client_name, title, status, total_value, currency, validity_date, payment_terms, notes, items, created_at, deleted_at';
    const res = await supabase.from('budgets').select(cols).eq('id', id).maybeSingle();
    let data: any = res.data;
    let error = res.error;

    // Se falhar por causa do cache de colunas (como o erro proposalId), tenta a versão mínima
    if (error && (error.message.includes("cache") || error.message.includes("column"))) {
      console.warn("Falling back to minimal select for getBudget...");
      const minCols = 'id, client_name, title, status, total_value, currency';
      const retry = await supabase.from('budgets').select(minCols).eq('id', id).maybeSingle();
      data = retry.data;
    }

    return data ? this.mapBudget(data) : undefined;
  }
  async createBudget(budget: InsertBudget): Promise<Budget> {
    let nextProposalId = 1;
    try {
      const { data: maxRow, error: selectError } = await supabase
        .from('budgets')
        .select('proposal_id')
        .order('proposal_id', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (!selectError && maxRow) {
        nextProposalId = (maxRow.proposal_id || 0) + 1;
      }
    } catch (e) {
      console.warn("Could not fetch max proposal_id, defaulting to 1");
    }

    const dbPayload: any = {
      client_name: budget.clientName,
      title: budget.title,
      status: budget.status,
      total_value: budget.totalValue,
      currency: budget.currency,
      validity_date: budget.validityDate,
      payment_terms: budget.paymentTerms,
      notes: budget.notes,
      items: budget.items
    };

    // Só adiciona campos extras se as colunas existirem (para evitar erro de esquema no Supabase)
    // Se houve erro ao buscar o max proposal_id por falta de coluna, não tentamos enviar o proposal_id no insert
    if (budget.clientId) dbPayload.client_id = budget.clientId;

    // Tenta incluir proposal_id se o sistema detectou a coluna (ou se nextProposalId > 1)
    // Tenta incluir proposal_id se o sistema detectou a coluna (ou se nextProposalId > 1)
    dbPayload.proposal_id = nextProposalId;

    // A estratégia agora é selecionar APENAS o 'id' para evitar erros de cache em outras colunas
    const insertRes = await supabase.from('budgets').insert(dbPayload).select('id').single();
    let data = insertRes.data;
    let error = insertRes.error;

    // Fallback: se o erro for sobre colunas ausentes ou cache de esquema, removemos os campos novos e tentamos o básico
    const isColumnError = error && (
      error.message.includes("column") ||
      error.message.includes("schema cache") ||
      error.message.includes("does not exist")
    );

    if (isColumnError) {
      console.warn("Detected schema/column error, retrying with minimal payload:", error?.message);
      const fallbackPayload = { ...dbPayload };
      delete fallbackPayload.proposal_id;
      delete fallbackPayload.client_id;
      delete fallbackPayload.deleted_at;

      const retry = await supabase.from('budgets').insert(fallbackPayload).select('id').single();
      data = retry.data;
      error = retry.error;
    }

    if (error || !data) {
      console.error("Supabase Insert Error:", error);
      throw new Error(`Erro ao salvar no banco: ${error?.message || "Sem resposta do servidor"}.`);
    }

    // Retorna o objeto mapeado manualmente
    return {
      id: data.id,
      proposalId: dbPayload.proposal_id || nextProposalId,
      clientId: dbPayload.client_id || null,
      clientName: dbPayload.client_name,
      title: dbPayload.title,
      status: dbPayload.status,
      totalValue: dbPayload.total_value,
      currency: dbPayload.currency,
      validityDate: dbPayload.validity_date,
      paymentTerms: dbPayload.payment_terms,
      notes: dbPayload.notes,
      items: dbPayload.items,
      createdAt: new Date(),
      deletedAt: null
    };
  }

  async updateBudget(id: string, budget: Partial<InsertBudget>): Promise<Budget | undefined> {
    const dbPayload: any = {};
    if (budget.clientId !== undefined) dbPayload.client_id = budget.clientId;
    if (budget.clientName !== undefined) dbPayload.client_name = budget.clientName;
    if (budget.title !== undefined) dbPayload.title = budget.title;
    if (budget.status !== undefined) dbPayload.status = budget.status;
    if (budget.totalValue !== undefined) dbPayload.total_value = budget.totalValue;
    if (budget.currency !== undefined) dbPayload.currency = budget.currency;
    if (budget.validityDate !== undefined) dbPayload.validity_date = budget.validityDate;
    if (budget.paymentTerms !== undefined) dbPayload.payment_terms = budget.paymentTerms;
    if (budget.notes !== undefined) dbPayload.notes = budget.notes;
    if (budget.items !== undefined) dbPayload.items = budget.items;

    // Selecionamos apenas o 'id' para evitar o erro de cache de esquema (proposalId/proposal_id)
    let { data, error } = await supabase.from('budgets').update(dbPayload).eq('id', id).select('id').single();

    // Fallback: se o erro for sobre colunas ausentes ou cache de esquema
    const isColumnError = error && (
      error.message.includes("column") ||
      error.message.includes("schema cache") ||
      error.message.includes("does not exist")
    );

    if (isColumnError) {
      console.warn("Detected schema error on update, retrying with minimal payload:", error?.message);
      const fallbackPayload = { ...dbPayload };
      delete fallbackPayload.proposal_id;
      delete fallbackPayload.client_id;
      delete fallbackPayload.deleted_at;

      const retry = await supabase.from('budgets').update(fallbackPayload).eq('id', id).select('id').single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("Supabase Update Error:", error);
      throw new Error(`Erro ao atualizar no banco: ${error.message}.`);
    }

    return this.getBudget(id);
  }

  // Soft delete: move para lixeira
  async deleteBudget(id: string): Promise<boolean> {
    const { error } = await supabase.from('budgets')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      // Fallback: se a coluna não existir, faz hard delete
      const { error: e2 } = await supabase.from('budgets').delete().eq('id', id);
      if (e2) throw new Error(e2.message);
    }
    return true;
  }

  // Lixeira: retorna orçamentos deletados nos últimos 30 dias
  async getTrashedBudgets(): Promise<Budget[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data, error } = await supabase.from('budgets').select('*')
      .not('deleted_at', 'is', null)
      .gte('deleted_at', thirtyDaysAgo.toISOString())
      .order('deleted_at', { ascending: false });
    if (error) {
      // Se a coluna não existir, retorna lixeira vazia
      return [];
    }
    return (data || []).map(this.mapBudget);
  }

  // Restaura da lixeira
  async restoreBudget(id: string): Promise<boolean> {
    const { error } = await supabase.from('budgets')
      .update({ deleted_at: null })
      .eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  // Exclusão permanente
  async permanentDeleteBudget(id: string): Promise<boolean> {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  // --- Finances ---
  async getFinances(): Promise<Finance[]> {
    const { data, error } = await supabase.from('finances').select('*').order('date', { ascending: false });
    if (error) throw new Error(error.message);
    return data.map(this.mapFinance);
  }
  async getFinance(id: string): Promise<Finance | undefined> {
    const { data } = await supabase.from('finances').select('*').eq('id', id).maybeSingle();
    return data ? this.mapFinance(data) : undefined;
  }
  async createFinance(finance: InsertFinance): Promise<Finance> {
    const { data, error } = await supabase.from('finances').insert(finance).select().single();
    if (error) throw new Error(error.message);
    return this.mapFinance(data);
  }
  async updateFinance(id: string, finance: Partial<InsertFinance>): Promise<Finance | undefined> {
    const { data, error } = await supabase.from('finances').update(finance).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return this.mapFinance(data);
  }
  async deleteFinance(id: string): Promise<boolean> {
    const { error } = await supabase.from('finances').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  // --- Meetings ---
  async getMeetings(): Promise<Meeting[]> {
    const { data, error } = await supabase.from('meetings').select('*').order('date', { ascending: false });
    if (error) throw new Error(error.message);
    return data.map(this.mapMeeting);
  }
  async getMeeting(id: string): Promise<Meeting | undefined> {
    const { data } = await supabase.from('meetings').select('*').eq('id', id).maybeSingle();
    return data ? this.mapMeeting(data) : undefined;
  }
  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const { data, error } = await supabase.from('meetings').insert(meeting).select().single();
    if (error) throw new Error(error.message);
    return this.mapMeeting(data);
  }
  async updateMeeting(id: string, meeting: Partial<InsertMeeting>): Promise<Meeting | undefined> {
    const { data, error } = await supabase.from('meetings').update(meeting).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return this.mapMeeting(data);
  }
  async deleteMeeting(id: string): Promise<boolean> {
    const { error } = await supabase.from('meetings').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  // --- Marketing ---
  async getMarketingCampaigns(): Promise<Marketing[]> {
    const { data, error } = await supabase.from('marketing').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data.map(this.mapMarketing);
  }
  async getMarketingCampaign(id: string): Promise<Marketing | undefined> {
    const { data } = await supabase.from('marketing').select('*').eq('id', id).maybeSingle();
    return data ? this.mapMarketing(data) : undefined;
  }
  async createMarketingCampaign(campaign: InsertMarketing): Promise<Marketing> {
    const dbPayload = {
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      budget: campaign.budget,
      spent: campaign.spent,
      start_date: campaign.startDate,
      end_date: campaign.endDate,
      description: campaign.description,
      notes: campaign.notes
    };
    const { data, error } = await supabase.from('marketing').insert(dbPayload).select().single();
    if (error) throw new Error(error.message);
    return this.mapMarketing(data);
  }
  async updateMarketingCampaign(id: string, campaign: Partial<InsertMarketing>): Promise<Marketing | undefined> {
    const dbPayload: any = {};
    if (campaign.name !== undefined) dbPayload.name = campaign.name;
    if (campaign.type !== undefined) dbPayload.type = campaign.type;
    if (campaign.status !== undefined) dbPayload.status = campaign.status;
    if (campaign.budget !== undefined) dbPayload.budget = campaign.budget;
    if (campaign.spent !== undefined) dbPayload.spent = campaign.spent;
    if (campaign.startDate !== undefined) dbPayload.start_date = campaign.startDate;
    if (campaign.endDate !== undefined) dbPayload.end_date = campaign.endDate;
    if (campaign.description !== undefined) dbPayload.description = campaign.description;
    if (campaign.notes !== undefined) dbPayload.notes = campaign.notes;

    const { data, error } = await supabase.from('marketing').update(dbPayload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return this.mapMarketing(data);
  }
  async deleteMarketingCampaign(id: string): Promise<boolean> {
    const { error } = await supabase.from('marketing').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  // --- Notes ---
  async getNotes(): Promise<Note[]> {
    const { data, error } = await supabase.from('notes').select('*');
    if (error) throw new Error(error.message);
    const sorted = data.map(this.mapNote).sort((a, b) => {
      if (a.pinned === "true" && b.pinned !== "true") return -1;
      if (a.pinned !== "true" && b.pinned === "true") return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return sorted;
  }
  async getNote(id: string): Promise<Note | undefined> {
    const { data } = await supabase.from('notes').select('*').eq('id', id).maybeSingle();
    return data ? this.mapNote(data) : undefined;
  }
  async createNote(note: InsertNote): Promise<Note> {
    const { data, error } = await supabase.from('notes').insert(note).select().single();
    if (error) throw new Error(error.message);
    return this.mapNote(data);
  }
  async updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined> {
    const dbPayload = { ...note, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('notes').update(dbPayload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return this.mapNote(data);
  }
  async deleteNote(id: string): Promise<boolean> {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  // --- Texts ---
  async getTexts(): Promise<Text[]> {
    const { data, error } = await supabase.from('texts').select('*').order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data.map(this.mapText);
  }
  async getText(id: string): Promise<Text | undefined> {
    const { data } = await supabase.from('texts').select('*').eq('id', id).maybeSingle();
    return data ? this.mapText(data) : undefined;
  }
  async createText(text: InsertText): Promise<Text> {
    const { data, error } = await supabase.from('texts').insert(text).select().single();
    if (error) throw new Error(error.message);
    return this.mapText(data);
  }
  async updateText(id: string, text: Partial<InsertText>): Promise<Text | undefined> {
    const dbPayload = { ...text, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('texts').update(dbPayload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return this.mapText(data);
  }
  async deleteText(id: string): Promise<boolean> {
    const { error } = await supabase.from('texts').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }
}

export const storage = new SupabaseStorage();
