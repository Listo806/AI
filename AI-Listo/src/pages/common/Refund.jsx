import React, { useState } from "react";

const t = {
  en: {
    title: "Refund Policy",
    effectiveDate: "Effective Date: July 20, 2026",
    sections: [
      {
        title: "1. Setup Fee and 14-Day Free Trial",
        blocks: [
          {
            p: "Cortexa charges a one-time setup fee at signup, then gives you a 14-day free trial before monthly billing begins.",
          },
          {
            ul: [
              "A payment method (PayPal) is required to sign up.",
              "Your 14-day free trial begins after the setup fee is paid, with no monthly charge during the trial.",
              "After the free trial, your monthly plan is billed automatically until you cancel.",
            ],
          },
          {
            p: "",
          },
        ],
      },
      {
        title: "2. Subscription Pricing",
        blocks: [
          {
            p: "Your selected plan begins after your 14-day free trial and is billed automatically each month until you cancel.",
          },
          {
            p: "Current plan pricing:",
          },
          {
            ul: [
              "Solo Plan: $197 USD/month",
              "Team Plan: $347 USD/month",
              "Growth Plan: $497 USD/month",
            ],
          },
          {
            p: "Your subscription renews automatically each month until you cancel. You can cancel anytime to stop future charges.",
          },
        ],
      },
      {
        title: "3. Refunds on Paid Subscriptions",
        blocks: [
          {
            ul: [
              "You may cancel anytime to prevent future charges.",
              "Cancelling during the 14-day free trial stops your subscription before the first monthly charge.",
              "",
            ],
          },
          {
            p: "Please contact support first so we can resolve billing issues quickly.",
          },
        ],
      },
      {
        title: "4. Chargebacks & Payment Disputes",
        blocks: [
          {
            p: "Please contact support before initiating a chargeback. Unresolved or unjustified disputes may result in suspension or termination.",
          },
        ],
      },
      {
        title: "5. Contact",
        blocks: [
          {
            p: "AI Support: Available via the Contact page",
          },
          {
            p: "Email: support@cortexaaicrm.com",
          },
        ],
      },
    ],
  },

  es: {
    title: "Política de Reembolsos",
    effectiveDate: "Fecha de entrada en vigor: 20 de julio de 2026",
    sections: [
      {
        title: "1. Tarifa de Configuración y Prueba Gratuita de 14 Días",
        blocks: [
          {
            p: "Cortexa cobra una tarifa única de configuración al registrarte y luego te da una prueba gratuita de 14 días antes de que comience la facturación mensual.",
          },
          {
            ul: [
              "Se requiere un método de pago (PayPal) para registrarte.",
              "Tu prueba gratuita de 14 días comienza después de pagar la tarifa de configuración, sin cargo mensual durante la prueba.",
              "Al terminar la prueba, tu plan mensual se cobra automáticamente hasta que canceles.",
            ],
          },
          {
            p: "",
          },
        ],
      },
      {
        title: "2. Precios de Suscripción",
        blocks: [
          {
            p: "Tu plan seleccionado comienza después de tu prueba gratuita de 14 días y se cobra automáticamente cada mes hasta que canceles.",
          },
          {
            p: "Planes:",
          },
          {
            ul: [
              "Solo: $197 USD/mes",
              "Team: $347 USD/mes",
              "Growth: $497 USD/mes",
            ],
          },
          {
            p: "Tu suscripción se renueva automáticamente cada mes hasta que canceles. Puedes cancelar en cualquier momento para evitar cobros futuros.",
          },
        ],
      },
      {
        title: "3. Reembolsos",
        blocks: [
          {
            ul: [
              "Puede cancelar en cualquier momento para evitar cobros futuros.",
              "Cancelar durante la prueba gratuita de 14 días detiene la suscripción antes del primer cobro mensual.",
            ],
          },
        ],
      },
      {
        title: "4. Contracargos",
        blocks: [
          {
            p: "Contáctenos antes de iniciar un contracargo.",
          },
        ],
      },
      {
        title: "5. Contacto",
        blocks: [
          {
            p: "AI Support: Página Contact",
          },
          {
            p: "Email: support@cortexaaicrm.com",
          },
        ],
      },
    ],
  },

  pt: {
    title: "Política de Reembolso",
    effectiveDate: "Data de vigência: 20 de julho de 2026",
    sections: [
      {
        title: "1. Taxa de Configuração e Teste Gratuito de 14 Dias",
        blocks: [
          {
            p: "A Cortexa cobra uma taxa única de configuração no cadastro e depois oferece um teste gratuito de 14 dias antes do início da cobrança mensal.",
          },
          {
            ul: [
              "Um método de pagamento (PayPal) é necessário para o cadastro.",
              "Seu teste gratuito de 14 dias começa após o pagamento da taxa de configuração, sem cobrança mensal durante o teste.",
              "Ao terminar o teste, seu plano mensal é cobrado automaticamente até você cancelar.",
            ],
          },
          {
            p: "",
          },
        ],
      },
      {
        title: "2. Preços de Assinatura",
        blocks: [
          {
            p: "Seu plano selecionado começa após seu teste gratuito de 14 dias e é cobrado automaticamente a cada mês até você cancelar.",
          },
          {
            p: "Planos:",
          },
          {
            ul: [
              "Solo: $197 USD/mês",
              "Team: $347 USD/mês",
              "Growth: $497 USD/mês",
            ],
          },
          {
            p: "Sua assinatura é renovada automaticamente a cada mês até você cancelar. Você pode cancelar a qualquer momento para evitar cobranças futuras.",
          },
        ],
      },
      {
        title: "3. Reembolsos",
        blocks: [
          {
            ul: [
              "Você pode cancelar a qualquer momento para evitar cobranças futuras.",
              "Cancelar durante o teste gratuito de 14 dias interrompe a assinatura antes da primeira cobrança mensal.",
            ],
          },
        ],
      },
      {
        title: "4. Contestação de Pagamento",
        blocks: [
          {
            p: "Entre em contato conosco antes de abrir uma contestação.",
          },
        ],
      },
      {
        title: "5. Contato",
        blocks: [
          {
            p: "AI Support: Página Contact",
          },
          {
            p: "Email: support@cortexaaicrm.com",
          },
        ],
      },
    ],
  },
};

const Section = ({ s }) => (
  <div style={styles.section}>
    <h2 style={styles.sectionTitle}>{s.title}</h2>

    <div>
      {s.blocks.map((block, index) =>
        block.p ? (
          <p key={index}>{block.p}</p>
        ) : (
          <ul key={index} style={styles.ul}>
            {block.ul.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )
      )}
    </div>
  </div>
);

export default function Refund() {
  const [lang] = useState(
    () => localStorage.getItem("cortexa_lang") || "en"
  );

  const tr = t[lang] || t.en;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{tr.title}</h1>
      <p style={styles.effectiveDate}>{tr.effectiveDate}</p>

      {tr.sections.map((section, index) => (
        <Section key={index} s={section} />
      ))}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 900,
    margin: "40px auto",
    padding: 20,
    fontFamily: "Arial",
    lineHeight: 1.6,
    color: "#333",
  },

  title: {
    fontSize: 36,
    marginBottom: 10,
  },

  effectiveDate: {
    color: "#777",
    marginBottom: 20,
  },

  section: {
    marginTop: 30,
  },

  sectionTitle: {
    fontSize: 22,
    marginBottom: 10,
  },

  ul: {
    paddingLeft: 24,
    marginTop: 8,
    marginBottom: 12,
  },
};