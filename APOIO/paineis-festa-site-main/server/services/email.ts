import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = "noreply@painelsexpress.com";

export async function sendOrderConfirmationEmail(
  customerEmail: string,
  customerName: string,
  orderId: number,
  totalAmount: number
) {
  if (!resend) {
    console.warn("[Email] Resend API key not configured, skipping email");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: "Pedido Confirmado - Painéis Express",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E91E8C;">Pedido Confirmado!</h2>
          <p>Olá <strong>${customerName}</strong>,</p>
          <p>Seu pedido foi confirmado com sucesso.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>ID do Pedido:</strong> #${orderId}</p>
            <p><strong>Valor Total:</strong> R$ ${(totalAmount / 100).toFixed(2)}</p>
            <p><strong>Status:</strong> Pendente de Pagamento</p>
          </div>
          
          <p>Você receberá um email de confirmação de pagamento assim que o pagamento for processado.</p>
          <p>Se tiver dúvidas, entre em contato conosco via WhatsApp.</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Painéis Express - Decoração de Festas em Tecido
          </p>
        </div>
      `,
    });
    console.log(`[Email] Order confirmation sent to ${customerEmail}`);
  } catch (error) {
    console.error("[Email] Error sending order confirmation:", error);
  }
}

export async function sendPaymentConfirmationEmail(
  customerEmail: string,
  customerName: string,
  orderId: number,
  totalAmount: number
) {
  if (!resend) {
    console.warn("[Email] Resend API key not configured, skipping email");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: "Pagamento Confirmado - Painéis Express",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7B2CBF;">Pagamento Confirmado!</h2>
          <p>Olá <strong>${customerName}</strong>,</p>
          <p>Seu pagamento foi processado com sucesso!</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>ID do Pedido:</strong> #${orderId}</p>
            <p><strong>Valor Pago:</strong> R$ ${(totalAmount / 100).toFixed(2)}</p>
            <p><strong>Status:</strong> Processando</p>
          </div>
          
          <p>Seu pedido está sendo preparado e você receberá um email com informações de entrega em breve.</p>
          <p>Obrigado por comprar com a Painéis Express!</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Painéis Express - Decoração de Festas em Tecido
          </p>
        </div>
      `,
    });
    console.log(`[Email] Payment confirmation sent to ${customerEmail}`);
  } catch (error) {
    console.error("[Email] Error sending payment confirmation:", error);
  }
}

export async function sendCustomOrderNotificationEmail(
  customerEmail: string,
  customerName: string,
  customOrderId: number,
  title: string,
  status: string
) {
  if (!resend) {
    console.warn("[Email] Resend API key not configured, skipping email");
    return;
  }

  try {
    const statusLabels: Record<string, string> = {
      draft: "Rascunho",
      submitted: "Enviado para Análise",
      approved: "Aprovado",
      rejected: "Rejeitado",
      completed: "Concluído",
    };

    const statusMessages: Record<string, string> = {
      draft: "Seu pedido personalizado foi criado como rascunho. Você pode continuar editando antes de enviar.",
      submitted: "Seu pedido personalizado foi enviado para análise. Entraremos em contato em breve com um orçamento.",
      approved: "Seu pedido personalizado foi aprovado! Você receberá mais detalhes sobre a produção.",
      rejected: "Seu pedido personalizado foi rejeitado. Verifique as notas do administrador para mais detalhes.",
      completed: "Seu pedido personalizado foi concluído! Ele está pronto para entrega.",
    };

    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Atualização do Pedido Personalizado - ${statusLabels[status]} - Painéis Express`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E91E8C;">Atualização do Seu Pedido Personalizado</h2>
          <p>Olá <strong>${customerName}</strong>,</p>
          <p>${statusMessages[status]}</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Pedido:</strong> ${title}</p>
            <p><strong>ID:</strong> #${customOrderId}</p>
            <p><strong>Status:</strong> ${statusLabels[status]}</p>
          </div>
          
          <p>Acesse sua conta para ver mais detalhes sobre seu pedido personalizado.</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Painéis Express - Decoração de Festas em Tecido
          </p>
        </div>
      `,
    });
    console.log(`[Email] Custom order notification sent to ${customerEmail}`);
  } catch (error) {
    console.error("[Email] Error sending custom order notification:", error);
  }
}

export async function sendAdminNotificationEmail(
  adminEmail: string,
  orderType: "custom_order" | "payment",
  orderData: any
) {
  if (!resend) {
    console.warn("[Email] Resend API key not configured, skipping email");
    return;
  }

  try {
    let subject = "";
    let content = "";

    if (orderType === "custom_order") {
      subject = `Novo Pedido Personalizado - ${orderData.title}`;
      content = `
        <p>Um novo pedido personalizado foi enviado:</p>
        <ul>
          <li><strong>ID:</strong> ${orderData.id}</li>
          <li><strong>Título:</strong> ${orderData.title}</li>
          <li><strong>Cliente:</strong> ${orderData.customerName}</li>
          <li><strong>Email:</strong> ${orderData.customerEmail}</li>
          <li><strong>Data:</strong> ${new Date(orderData.createdAt).toLocaleDateString("pt-BR")}</li>
        </ul>
        <p><a href="https://painelsexpress.com/admin">Acesse o painel de admin</a> para revisar o pedido.</p>
      `;
    } else if (orderType === "payment") {
      subject = `Novo Pagamento Recebido - Pedido #${orderData.orderId}`;
      content = `
        <p>Um novo pagamento foi recebido:</p>
        <ul>
          <li><strong>ID do Pedido:</strong> ${orderData.orderId}</li>
          <li><strong>Valor:</strong> R$ ${(orderData.amount / 100).toFixed(2)}</li>
          <li><strong>Cliente:</strong> ${orderData.customerName}</li>
          <li><strong>Email:</strong> ${orderData.customerEmail}</li>
        </ul>
        <p><a href="https://painelsexpress.com/admin">Acesse o painel de admin</a> para processar o pedido.</p>
      `;
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7B2CBF;">Notificação do Sistema</h2>
          ${content}
        </div>
      `,
    });
    console.log(`[Email] Admin notification sent to ${adminEmail}`);
  } catch (error) {
    console.error("[Email] Error sending admin notification:", error);
  }
}

export async function sendNewLeadNotification(lead: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  source: string;
}) {
  if (!resend) {
    console.warn("[Email] Resend API key not configured, skipping email");
    return false;
  }

  try {
    const adminEmail = "admin@painelexpress.com.br"; // Substituir com email real

    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `Novo Lead: ${lead.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E91E8C;">Novo Lead Capturado</h2>
          <p><strong>Nome:</strong> ${lead.name}</p>
          <p><strong>Email:</strong> ${lead.email}</p>
          ${lead.phone ? `<p><strong>Telefone:</strong> ${lead.phone}</p>` : ""}
          ${lead.company ? `<p><strong>Empresa:</strong> ${lead.company}</p>` : ""}
          ${lead.message ? `<p><strong>Mensagem:</strong> ${lead.message}</p>` : ""}
          <p><strong>Fonte:</strong> ${lead.source}</p>
          <p><a href="https://painelexpress.com.br/admin/leads">Ver no Painel de Admin</a></p>
        </div>
      `,
    });

    console.log("[Email] New lead notification sent");
    return true;
  } catch (error) {
    console.error("[Email] Error sending new lead notification:", error);
    return false;
  }
}

export async function sendLeadConfirmationEmail(email: string, name: string) {
  if (!resend) {
    console.warn("[Email] Resend API key not configured, skipping email");
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Recebemos sua mensagem - Painéis Express",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E91E8C;">Obrigado, ${name}!</h2>
          <p>Recebemos sua mensagem com sucesso. Nossos especialistas entrarão em contato em breve.</p>
          <p>Enquanto isso, confira nosso catálogo de produtos em: <a href="https://painelexpress.com.br/catalogo">Catálogo</a></p>
          <p>Atenciosamente,<br>Equipe Painéis Express</p>
        </div>
      `,
    });

    console.log(`[Email] Lead confirmation email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("[Email] Error sending lead confirmation email:", error);
    return false;
  }
}
