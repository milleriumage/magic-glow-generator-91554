import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  type: "signup" | "password_reset" | "email_change" | "support";
  code?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, type, code, message }: EmailRequest = await req.json();
    
    console.log(`Sending email to ${to} with type ${type}`);

    let subject = "";
    let html = "";

    switch (type) {
      case "signup":
        subject = "Confirme seu cadastro - FunFans";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #EF4444; text-align: center;">FUN<span style="color: #333;">FANS</span></h1>
            <div style="background-color: #f5f5f5; padding: 30px; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Confirme seu cadastro</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.5;">
                Obrigado por se cadastrar na FunFans! Use o código abaixo para confirmar seu email:
              </p>
              <div style="background-color: #fff; padding: 20px; border-radius: 5px; text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #EF4444; letter-spacing: 5px;">${code}</span>
              </div>
              <p style="color: #666; font-size: 14px;">
                Este código expira em 15 minutos.
              </p>
              <p style="color: #999; font-size: 12px; margin-top: 30px;">
                Se você não solicitou este cadastro, pode ignorar este email.
              </p>
            </div>
          </div>
        `;
        break;

      case "password_reset":
        subject = "Redefinir sua senha - FunFans";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #EF4444; text-align: center;">FUN<span style="color: #333;">FANS</span></h1>
            <div style="background-color: #f5f5f5; padding: 30px; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Redefinir senha</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.5;">
                Recebemos uma solicitação para redefinir sua senha. Use o código abaixo:
              </p>
              <div style="background-color: #fff; padding: 20px; border-radius: 5px; text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #EF4444; letter-spacing: 5px;">${code}</span>
              </div>
              <p style="color: #666; font-size: 14px;">
                Este código expira em 15 minutos.
              </p>
              <p style="color: #999; font-size: 12px; margin-top: 30px;">
                Se você não solicitou esta alteração, ignore este email. Sua senha permanecerá inalterada.
              </p>
            </div>
          </div>
        `;
        break;

      case "email_change":
        subject = "Confirmar alteração de email - FunFans";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #EF4444; text-align: center;">FUN<span style="color: #333;">FANS</span></h1>
            <div style="background-color: #f5f5f5; padding: 30px; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Confirmar novo email</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.5;">
                Para confirmar a alteração do seu email, use o código abaixo:
              </p>
              <div style="background-color: #fff; padding: 20px; border-radius: 5px; text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #EF4444; letter-spacing: 5px;">${code}</span>
              </div>
              <p style="color: #666; font-size: 14px;">
                Este código expira em 15 minutos.
              </p>
            </div>
          </div>
        `;
        break;

      case "support":
        subject = "Mensagem de suporte - FunFans";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #EF4444; text-align: center;">FUN<span style="color: #333;">FANS</span></h1>
            <div style="background-color: #f5f5f5; padding: 30px; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Nova mensagem do suporte</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.5;">
                ${message}
              </p>
              <p style="color: #999; font-size: 12px; margin-top: 30px;">
                Para responder, acesse sua conta na FunFans.
              </p>
            </div>
          </div>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: "FunFans <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
