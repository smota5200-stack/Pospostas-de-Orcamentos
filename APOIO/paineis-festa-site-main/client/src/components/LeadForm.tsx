import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Mail, Phone, User, MessageSquare, Building2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface LeadFormProps {
  source: "home" | "catalog" | "contact";
  onSuccess?: () => void;
}

export default function LeadForm({ source, onSuccess }: LeadFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });

  const createLeadMutation = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Obrigado! Entraremos em contato em breve.");
      setFormData({ name: "", email: "", phone: "", company: "", message: "" });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao enviar formulário");
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error("Por favor, preencha nome e email");
      return;
    }

    createLeadMutation.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      company: formData.company || undefined,
      message: formData.message || undefined,
      source,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nome */}
      <div className="relative">
        <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          name="name"
          placeholder="Seu nome completo"
          value={formData.name}
          onChange={handleChange}
          className="pl-10 border-gray-300"
          required
        />
      </div>

      {/* Email */}
      <div className="relative">
        <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <Input
          type="email"
          name="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={handleChange}
          className="pl-10 border-gray-300"
          required
        />
      </div>

      {/* Telefone */}
      <div className="relative">
        <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <Input
          type="tel"
          name="phone"
          placeholder="(11) 99999-9999"
          value={formData.phone}
          onChange={handleChange}
          className="pl-10 border-gray-300"
        />
      </div>

      {/* Empresa */}
      <div className="relative">
        <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          name="company"
          placeholder="Sua empresa (opcional)"
          value={formData.company}
          onChange={handleChange}
          className="pl-10 border-gray-300"
        />
      </div>

      {/* Mensagem */}
      <div className="relative">
        <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <textarea
          name="message"
          placeholder="Conte-nos sobre seu evento ou dúvidas..."
          value={formData.message}
          onChange={handleChange}
          rows={4}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={createLeadMutation.isPending}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-2"
      >
        {createLeadMutation.isPending ? "Enviando..." : "Enviar Mensagem"}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Respeitamos sua privacidade. Nunca compartilharemos seus dados.
      </p>
    </form>
  );
}
