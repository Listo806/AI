import React, { useState } from "react";

const t = {
  en: {
    title: "Cancellation Policy",
    effectiveDate: "Effective Date: July 20, 2026",
    intro:
      'This Cancellation Policy explains how you may cancel your account or subscription to CORTEXA AI Revenue OS ("Cortexa", "we", "our", "us"). By using our Services, you agree to this policy.',
    sections: [
      {
        title: "1. Setup Fee, Free Trial, and Cancellation",
        blocks: [
          {
            type: "ul",
            items: [
              "A one-time $97 USD setup fee is charged today at signup, and a payment method (PayPal) is required.",
              "Your 14-day free trial begins after the setup fee is paid, and your monthly plan is billed automatically when the trial ends.",
              "You can cancel during the 14-day free trial to stop your subscription before the first monthly charge.",
            ],
          },
        ],
      },
      {
        title: "2. Cancelling a Paid Subscription",
        blocks: [
          {
            type: "p",
            text: "If you have chosen to start a paid subscription, you may cancel it at any time:",
          },
          {
            type: "ul",
            items: [
              "Through your account settings within the platform, OR",
            ],
          },
          {
            type: "p",
            text: "By contacting support via:",
          },
          {
            type: "ul",
            items: [
              "AI Support (Contact page)",
              "Email: support@cortexaaicrm.com",
            ],
          },
        ],
      },
      {
        title: "3. Timing & Effect of Cancellation",
        blocks: [
          {
            type: "ul",
            items: [
              "Cancel before your next billing date to avoid the next billing cycle.",
              "You retain access to paid features until the end of the current paid billing period.",
              "After that period ends, paid features may be limited, downgraded, or deactivated.",
              "Cancellation stops future monthly charges but does not refund the one-time $97 setup fee or a monthly period already paid (see the Refund Policy).",
            ],
          },
        ],
      },
      {
        title: "4. Account Deletion vs Cancellation",
        blocks: [
          {
            type: "ul",
            items: [
              "Cancelling a subscription stops future billing only.",
              "It does not automatically delete your account or data.",
            ],
          },
          {
            type: "p",
            text: "To request full account deletion, contact support at support@cortexaaicrm.com.",
          },
        ],
      },
      {
        title: "5. Payment Disputes",
        blocks: [
          {
            type: "p",
            text: "If you have a billing issue:",
          },
          {
            type: "ul",
            items: [
              "Please contact Cortexa support before initiating a dispute or chargeback.",
            ],
          },
          {
            type: "p",
            text: "Unresolved or unjustified disputes may result in:",
          },
          {
            type: "ul",
            items: [
              "Account suspension",
              "Permanent account termination",
            ],
          },
        ],
      },
      {
        title: "6. Changes to This Policy",
        blocks: [
          {
            type: "p",
            text: "We may update this Cancellation Policy at any time.",
          },
          {
            type: "p",
            text: "Continued use of Cortexa after updates constitutes acceptance of the revised policy.",
          },
        ],
      },
      {
        title: "7. Contact",
        blocks: [
          {
            type: "p",
            text: "For cancellation or billing inquiries:",
          },
          {
            type: "p",
            text: "AI Support: Available via the Contact page",
          },
          {
            type: "p",
            text: "Email: support@cortexaaicrm.com",
          },
          {
            type: "p",
            text: "Company: CORTEXA AI Revenue OS",
          },
        ],
      },
    ],
  },

  es: {
    title: "Política de Cancelación",
    effectiveDate: "Fecha de entrada en vigor: 20 de julio de 2026",
    intro:
      'Esta Política de Cancelación explica cómo puede cancelar su cuenta o suscripción a CORTEXA AI Revenue OS ("Cortexa", "nosotros", "nuestro", "nos"). Al utilizar nuestros Servicios, usted acepta esta política.',
    sections: [
      {
        title: "1. Tarifa de Configuración, Prueba Gratuita y Cancelación",
        blocks: [
          {
            type: "ul",
            items: [
              "Hoy se cobra una tarifa única de configuración de $97 USD al registrarte, y se requiere un método de pago (PayPal).",
              "Tu prueba gratuita de 14 días comienza después de pagar la tarifa de configuración, y tu plan mensual se cobra automáticamente cuando termina la prueba.",
              "Puedes cancelar durante la prueba gratuita de 14 días para detener tu suscripción antes del primer cobro mensual.",
            ],
          },
        ],
      },
      {
        title: "2. Cancelación de una Suscripción de Pago",
        blocks: [
          {
            type: "p",
            text: "Si ha decidido iniciar una suscripción de pago, puede cancelarla en cualquier momento:",
          },
          {
            type: "ul",
            items: [
              "Desde la configuración de su cuenta dentro de la plataforma, O",
            ],
          },
          {
            type: "p",
            text: "Contactando al equipo de soporte mediante:",
          },
          {
            type: "ul",
            items: [
              "Soporte de IA (página de Contacto)",
              "Correo electrónico: support@cortexaaicrm.com",
            ],
          },
        ],
      },
      {
        title: "3. Momento y Efecto de la Cancelación",
        blocks: [
          {
            type: "ul",
            items: [
              "Cancele antes de la próxima fecha de facturación para evitar el siguiente ciclo de cobro.",
              "Conservará el acceso a las funciones de pago hasta el final del periodo de facturación ya pagado.",
              "Cuando finalice dicho periodo, las funciones de pago podrán limitarse, degradarse o desactivarse.",
              "La cancelación detiene los cobros mensuales futuros, pero no reembolsa la tarifa única de configuración de $97 ni un periodo mensual ya pagado (consulte la Política de Reembolsos).",
            ],
          },
        ],
      },
      {
        title: "4. Eliminación de Cuenta frente a Cancelación",
        blocks: [
          {
            type: "ul",
            items: [
              "Cancelar una suscripción únicamente detiene la facturación futura.",
              "No elimina automáticamente su cuenta ni sus datos.",
            ],
          },
          {
            type: "p",
            text: "Para solicitar la eliminación completa de su cuenta, contacte a support@cortexaaicrm.com.",
          },
        ],
      },
      {
        title: "5. Disputas de Pago",
        blocks: [
          {
            type: "p",
            text: "Si tiene un problema de facturación:",
          },
          {
            type: "ul",
            items: [
              "Contacte al equipo de soporte de Cortexa antes de iniciar una disputa o contracargo.",
            ],
          },
          {
            type: "p",
            text: "Las disputas no resueltas o injustificadas pueden resultar en:",
          },
          {
            type: "ul",
            items: [
              "Suspensión de la cuenta",
              "Cancelación permanente de la cuenta",
            ],
          },
        ],
      },
      {
        title: "6. Cambios en esta Política",
        blocks: [
          {
            type: "p",
            text: "Podemos actualizar esta Política de Cancelación en cualquier momento.",
          },
          {
            type: "p",
            text: "El uso continuado de Cortexa después de una actualización constituye la aceptación de la política revisada.",
          },
        ],
      },
      {
        title: "7. Contacto",
        blocks: [
          {
            type: "p",
            text: "Para consultas sobre cancelaciones o facturación:",
          },
          {
            type: "p",
            text: "Soporte de IA: disponible mediante la página de Contacto",
          },
          {
            type: "p",
            text: "Correo electrónico: support@cortexaaicrm.com",
          },
          {
            type: "p",
            text: "Empresa: CORTEXA AI Revenue OS",
          },
        ],
      },
    ],
  },

  pt: {
    title: "Política de Cancelamento",
    effectiveDate: "Data de vigência: 20 de julho de 2026",
    intro:
      'Esta Política de Cancelamento explica como você pode cancelar sua conta ou assinatura do CORTEXA AI Revenue OS ("Cortexa", "nós", "nosso", "conosco"). Ao utilizar nossos Serviços, você concorda com esta política.',
    sections: [
      {
        title: "1. Taxa de Configuração, Teste Gratuito e Cancelamento",
        blocks: [
          {
            type: "ul",
            items: [
              "Hoje é cobrada uma taxa única de configuração de $97 USD no cadastro, e um método de pagamento (PayPal) é necessário.",
              "Seu teste gratuito de 14 dias começa após o pagamento da taxa de configuração, e seu plano mensal é cobrado automaticamente quando o teste termina.",
              "Você pode cancelar durante o teste gratuito de 14 dias para interromper sua assinatura antes da primeira cobrança mensal.",
            ],
          },
        ],
      },
      {
        title: "2. Cancelamento de uma Assinatura Paga",
        blocks: [
          {
            type: "p",
            text: "Se você optou por iniciar uma assinatura paga, poderá cancelá-la a qualquer momento:",
          },
          {
            type: "ul",
            items: [
              "Pelas configurações da sua conta dentro da plataforma, OU",
            ],
          },
          {
            type: "p",
            text: "Entrando em contato com o suporte por meio de:",
          },
          {
            type: "ul",
            items: [
              "Suporte por IA (página de Contato)",
              "E-mail: support@cortexaaicrm.com",
            ],
          },
        ],
      },
      {
        title: "3. Momento e Efeito do Cancelamento",
        blocks: [
          {
            type: "ul",
            items: [
              "Cancele antes da próxima data de cobrança para evitar o próximo ciclo de faturamento.",
              "Você continuará com acesso aos recursos pagos até o final do período de cobrança já pago.",
              "Após o término desse período, os recursos pagos poderão ser limitados, rebaixados ou desativados.",
              "O cancelamento interrompe cobranças mensais futuras, mas não reembolsa a taxa única de configuração de $97 nem um período mensal já pago (consulte a Política de Reembolso).",
            ],
          },
        ],
      },
      {
        title: "4. Exclusão da Conta versus Cancelamento",
        blocks: [
          {
            type: "ul",
            items: [
              "Cancelar uma assinatura interrompe apenas cobranças futuras.",
              "Isso não exclui automaticamente sua conta ou seus dados.",
            ],
          },
          {
            type: "p",
            text: "Para solicitar a exclusão completa da conta, entre em contato pelo e-mail support@cortexaaicrm.com.",
          },
        ],
      },
      {
        title: "5. Disputas de Pagamento",
        blocks: [
          {
            type: "p",
            text: "Se você tiver um problema de cobrança:",
          },
          {
            type: "ul",
            items: [
              "Entre em contato com o suporte da Cortexa antes de iniciar uma disputa ou contestação de pagamento.",
            ],
          },
          {
            type: "p",
            text: "Disputas não resolvidas ou injustificadas podem resultar em:",
          },
          {
            type: "ul",
            items: [
              "Suspensão da conta",
              "Encerramento permanente da conta",
            ],
          },
        ],
      },
      {
        title: "6. Alterações nesta Política",
        blocks: [
          {
            type: "p",
            text: "Podemos atualizar esta Política de Cancelamento a qualquer momento.",
          },
          {
            type: "p",
            text: "O uso contínuo do Cortexa após as atualizações constitui aceitação da política revisada.",
          },
        ],
      },
      {
        title: "7. Contato",
        blocks: [
          {
            type: "p",
            text: "Para dúvidas sobre cancelamento ou cobrança:",
          },
          {
            type: "p",
            text: "Suporte por IA: disponível pela página de Contato",
          },
          {
            type: "p",
            text: "E-mail: support@cortexaaicrm.com",
          },
          {
            type: "p",
            text: "Empresa: CORTEXA AI Revenue OS",
          },
        ],
      },
    ],
  },
};

const ContentBlock = ({ block }) => {
  if (block.type === "ul") {
    return (
      <ul style={styles.ul}>
        {block.items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    );
  }

  return <p>{block.text}</p>;
};

const Section = ({ title, blocks }) => (
  <div style={styles.section}>
    <h2 style={styles.sectionTitle}>{title}</h2>

    <div style={styles.sectionContent}>
      {blocks.map((block, index) => (
        <ContentBlock key={`${title}-${index}`} block={block} />
      ))}
    </div>
  </div>
);

const Cancellation = () => {
  const [lang] = useState(
    () => localStorage.getItem("cortexa_lang") || "en",
  );

  const tr = t[lang] || t.en;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{tr.title}</h1>

      <p style={styles.effectiveDate}>{tr.effectiveDate}</p>

      <p>{tr.intro}</p>

      {tr.sections.map((section) => (
        <Section
          key={section.title}
          title={section.title}
          blocks={section.blocks}
        />
      ))}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "900px",
    margin: "40px auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    lineHeight: "1.6",
    color: "#333",
  },
  title: {
    fontSize: "36px",
    marginBottom: "10px",
  },
  effectiveDate: {
    color: "#777",
    marginBottom: "20px",
  },
  section: {
    marginTop: "30px",
  },
  sectionTitle: {
    fontSize: "22px",
    marginBottom: "10px",
  },
  sectionContent: {
    fontSize: "15px",
  },
  ul: {
    paddingLeft: "24px",
    marginTop: "8px",
    marginBottom: "12px",
  },
};

export default Cancellation;