/**
 * WhatsApp Business API Integration
 * 
 * Este serviço envia mensagens automáticas via WhatsApp quando eventos importantes ocorrem.
 * Requer configuração de WhatsApp Business Account e número de telefone verificado.
 */

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "https://graph.instagram.com/v18.0";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "";

interface WhatsAppMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "template" | "text";
  template?: {
    name: string;
    language: {
      code: string;
    };
    parameters?: {
      body: {
        parameters: Array<{
          type: "text";
          text: string;
        }>;
      };
    };
  };
  text?: {
    preview_url: boolean;
    body: string;
  };
}

export async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn("[WhatsApp] WhatsApp credentials not configured, skipping message");
    return false;
  }

  try {
    const payload: WhatsAppMessage = {
      messaging_product: "whatsapp",
      to: phoneNumber.replace(/\D/g, ""), // Remove non-digits
      type: "text",
      text: {
        preview_url: false,
        body: message,
      },
    };

    const response = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[WhatsApp] Error sending message:", error);
      return false;
    }

    console.log(`[WhatsApp] Message sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error("[WhatsApp] Error sending message:", error);
    return false;
  }
}

export async function sendNewLeadNotificationWhatsApp(lead: {
  name: string;
  phone?: string;
  message?: string;
}) {
  if (!lead.phone) {
    console.warn("[WhatsApp] No phone number provided for lead");
    return false;
  }

  const message = `Olá ${lead.name}! 👋\n\nRecebemos sua mensagem com sucesso! 🎉\n\nNossos especialistas entrarão em contato em breve para ajudá-lo com seus painéis de festa.\n\nMentre isso, confira nosso catálogo: https://painelexpress.com.br/catalogo\n\nAtenciosamente,\nEquipe Painéis Express 🎨`;

  return await sendWhatsAppMessage(lead.phone, message);
}

export async function sendOrderStatusUpdateWhatsApp(
  phoneNumber: string,
  orderStatus: string,
  orderId: number
) {
  const statusMessages: Record<string, string> = {
    pending: "Seu pedido foi recebido e está aguardando confirmação de pagamento.",
    paid: "Pagamento confirmado! Seu pedido está sendo preparado.",
    processing: "Seu pedido está sendo preparado com cuidado.",
    shipped: "Seu pedido foi enviado! 🚚 Acompanhe a entrega.",
    delivered: "Seu pedido foi entregue! Obrigado por comprar conosco! 🎉",
    cancelled: "Seu pedido foi cancelado. Entre em contato para mais informações.",
  };

  const message = `Atualização do Pedido #${orderId}\n\n${statusMessages[orderStatus] || "Seu pedido foi atualizado."}\n\nAcompanhe em: https://painelexpress.com.br/meus-pedidos\n\nAtenciosamente,\nEquipe Painéis Express`;

  return await sendWhatsAppMessage(phoneNumber, message);
}

export async function sendCustomOrderNotificationWhatsApp(
  phoneNumber: string,
  orderTitle: string,
  status: string,
  estimatedPrice?: number
) {
  const statusMessages: Record<string, string> = {
    draft: "Seu pedido personalizado foi criado como rascunho.",
    submitted: "Seu pedido foi enviado para análise. Entraremos em contato com um orçamento.",
    approved: "Seu pedido foi aprovado! Você receberá mais detalhes sobre a produção.",
    rejected: "Seu pedido foi rejeitado. Verifique as notas para mais detalhes.",
    completed: "Seu pedido personalizado foi concluído! 🎉",
  };

  const priceInfo = estimatedPrice ? `\nPreço Estimado: R$ ${(estimatedPrice / 100).toFixed(2)}` : "";
  const message = `Atualização do Pedido Personalizado: ${orderTitle}\n\n${statusMessages[status] || "Seu pedido foi atualizado."}${priceInfo}\n\nAcompanhe em: https://painelexpress.com.br/pedidos-personalizados\n\nAtenciosamente,\nEquipe Painéis Express`;

  return await sendWhatsAppMessage(phoneNumber, message);
}
