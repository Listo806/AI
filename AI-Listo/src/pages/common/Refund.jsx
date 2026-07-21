import React, { useState } from "react";

const t = {
  en: {
    title: "Refund Policy",
    effectiveDate: "Effective Date: July 20, 2026",
    sections: [
      {
        title: "1. Free Trial — No Payment Collected",
        blocks: [
          {
            p: "Cortexa offers a free trial to new users.",
          },
          {
            ul: [
              "No payment is collected when you start your free trial.",
              "No credit card or payment method is required to sign up.",
              "Your free trial does not automatically convert to a paid subscription.",
              "No charge is ever made automatically.",
            ],
          },
          {
            p: "Because no payment is taken during the free trial, there is nothing to refund for the trial itself.",
          },
        ],
      },
      {
        title: "2. Future Paid Subscriptions",
        blocks: [
          {
            p: "If you later choose to subscribe to a paid plan, you will be asked to add a payment method and actively confirm the purchase at that time. Nothing is charged until you do so.",
          },
          {
            p: "Current plan pricing:",
          },
          {
            ul: [
              "Solo Plan: $197 USD/month",
              "Team Plan: $347 USD/month",
              "Growth Plan: $497 USD/month",
              "One-time setup fee: $97 USD when applicable.",
            ],
          },
          {
            p: "No payment method is charged without your explicit authorization.",
          },
        ],
      },
      {
        title: "3. Refunds on Paid Subscriptions",
        blocks: [
          {
            ul: [
              "You may cancel anytime to prevent future charges.",
              "Paid billing periods are generally non-refundable except where required by law.",
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
        title: "1. Prueba Gratuita — Sin Pago",
        blocks: [
          {
            p: "Cortexa ofrece una prueba gratuita.",
          },
          {
            ul: [
              "No se cobra ningún pago.",
              "No se requiere tarjeta.",
              "La prueba no se convierte automáticamente en una suscripción.",
              "Nunca se realiza un cargo automático.",
            ],
          },
          {
            p: "No existe nada que reembolsar durante la prueba gratuita.",
          },
        ],
      },
      {
        title: "2. Suscripciones de Pago",
        blocks: [
          {
            p: "Si decide suscribirse, deberá agregar un método de pago y confirmar la compra.",
          },
          {
            p: "Planes:",
          },
          {
            ul: [
              "Solo: $197 USD/mes",
              "Team: $347 USD/mes",
              "Growth: $497 USD/mes",
              "Configuración única: $97 USD",
            ],
          },
          {
            p: "Nunca cobramos sin autorización expresa.",
          },
        ],
      },
      {
        title: "3. Reembolsos",
        blocks: [
          {
            ul: [
              "Puede cancelar en cualquier momento.",
              "Los periodos ya facturados normalmente no son reembolsables salvo obligación legal.",
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
        title: "1. Teste Gratuito — Sem Cobrança",
        blocks: [
          {
            p: "A Cortexa oferece um teste gratuito.",
          },
          {
            ul: [
              "Nenhum pagamento é cobrado.",
              "Nenhum cartão é necessário.",
              "O teste não se converte automaticamente.",
              "Nenhuma cobrança automática é realizada.",
            ],
          },
          {
            p: "Não há nada a reembolsar durante o teste.",
          },
        ],
      },
      {
        title: "2. Assinaturas Pagas",
        blocks: [
          {
            p: "Se decidir assinar, você adicionará um método de pagamento e confirmará a compra.",
          },
          {
            p: "Planos:",
          },
          {
            ul: [
              "Solo: $197 USD/mês",
              "Team: $347 USD/mês",
              "Growth: $497 USD/mês",
              "Taxa única de setup: $97 USD",
            ],
          },
          {
            p: "Nunca cobramos sem autorização expressa.",
          },
        ],
      },
      {
        title: "3. Reembolsos",
        blocks: [
          {
            ul: [
              "Você pode cancelar a qualquer momento.",
              "Períodos já pagos normalmente não são reembolsáveis, salvo exigência legal.",
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