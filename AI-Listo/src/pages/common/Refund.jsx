import React, { useState } from "react";

const t = {
  en: {
    title: "CORTEXA REFUND & CANCELLATION POLICY",
    effectiveDate: "Effective Date: April 22, 2026",
    intro:
      "This Refund & Cancellation Policy applies to purchases of CORTEXA AI Revenue OS products and services operated by Listo Qasa S.A.S. Payments processed through Paddle are also subject to Paddle's applicable Buyer Terms and Refund Policy.",
    sections: [
      {
        title: "1. 14-DAY REFUND PERIOD",
        blocks: [
          {
            type: "p",
            text: "Customers may request a refund within 14 calendar days of an eligible initial purchase or initial subscription payment.",
          },
          {
            type: "p",
            text: "Where applicable law or Paddle's Buyer Terms or Refund Policy provides the customer with additional or greater cancellation, withdrawal, or refund rights, those rights will apply.",
          },
          {
            type: "p",
            text: "Nothing in this policy limits any mandatory consumer rights.",
          },
        ],
      },
      {
        title: "2. SUBSCRIPTIONS",
        blocks: [
          {
            type: "p",
            text: "Cortexa subscriptions automatically renew according to the billing period disclosed at checkout unless canceled.",
          },
          {
            type: "p",
            text: "Customers may cancel their subscription at any time.",
          },
          {
            type: "p",
            text: "Cancellation stops future renewals and normally takes effect at the end of the current billing period unless applicable law or Paddle's terms require otherwise.",
          },
          {
            type: "p",
            text: "Cancellation of a subscription does not automatically create a refund for previous subscription periods.",
          },
          {
            type: "p",
            text: "Refund requests made within an applicable 14-day refund or withdrawal period will be handled in accordance with this policy, Paddle's applicable terms, and applicable law.",
          },
        ],
      },
      {
        title: "3. FREE TRIALS",
        blocks: [
          {
            type: "p",
            text: "If a Cortexa subscription includes a free trial, the applicable trial and billing terms will be clearly disclosed before purchase.",
          },
          {
            type: "p",
            text: "Customers may cancel before the trial converts to a paid subscription to prevent the applicable subscription charge.",
          },
          {
            type: "p",
            text: "Any additional withdrawal or refund rights following a free trial will be honored where required by Paddle's terms or applicable law.",
          },
        ],
      },
      {
        title: "4. WORKSPACES, ADD-ONS AND OTHER CORTEXA PRODUCTS",
        blocks: [
          {
            type: "p",
            text: "Refund eligibility for paid Cortexa Workspaces, add-ons, activation purchases, and other digital products or services follows the same applicable refund rules unless different terms are clearly disclosed before purchase or applicable law provides greater rights.",
          },
        ],
      },
      {
        title: "5. DEFECTIVE OR UNAVAILABLE SERVICES",
        blocks: [
          {
            type: "p",
            text: "If a purchased Cortexa product or service is not delivered, is materially defective, or cannot reasonably be provided as described, customers may contact us for assistance.",
          },
          {
            type: "p",
            text: "Any refund rights provided by applicable law or Paddle will be honored.",
          },
        ],
      },
      {
        title: "6. HOW TO REQUEST A REFUND",
        blocks: [
          {
            type: "p",
            text: "For purchases processed by Paddle, customers may request a refund through the Paddle buyer-support and subscription-management options provided with their transaction or receipt.",
          },
          {
            type: "p",
            text: "Customers may also contact Cortexa support at:",
          },
          {
            type: "p",
            text: "support@cortexaaicrm.com",
          },
          {
            type: "p",
            text: "Please provide sufficient information for us to identify the applicable account and transaction.",
          },
          {
            type: "p",
            text: "Eligible refunds for Paddle-processed transactions will be processed through Paddle and returned through the applicable payment method in accordance with Paddle's procedures.",
          },
        ],
      },
      {
        title: "7. FRAUD AND REFUND ABUSE",
        blocks: [
          {
            type: "p",
            text: "Refund requests may be denied where permitted by law if there is evidence of fraud, abuse, manipulation, or misuse of refund or payment-protection systems.",
          },
          {
            type: "p",
            text: "This does not limit any mandatory consumer rights.",
          },
        ],
      },
      {
        title: "8. ACCESS FOLLOWING A REFUND",
        blocks: [
          {
            type: "p",
            text: "When a purchase is refunded, access to the refunded paid subscription, Workspace, add-on, or other paid product may be terminated or returned to the customer's otherwise applicable Cortexa access level.",
          },
          {
            type: "p",
            text: "Refunding one Workspace or add-on does not automatically cancel unrelated Cortexa products or subscriptions unless otherwise required.",
          },
        ],
      },
      {
        title: "9. CHARGEBACKS AND PAYMENT DISPUTES",
        blocks: [
          {
            type: "p",
            text: "Customers are encouraged to contact Cortexa or Paddle regarding billing concerns before initiating a chargeback or payment dispute so that the matter can be reviewed promptly.",
          },
          {
            type: "p",
            text: "Nothing in this section limits a customer's lawful rights with their bank, payment provider, card issuer, Paddle, or under applicable consumer-protection law.",
          },
        ],
      },
      {
        title: "10. CHANGES TO THIS POLICY",
        blocks: [
          {
            type: "p",
            text: "We may update this Refund & Cancellation Policy periodically.",
          },
          {
            type: "p",
            text: "The policy and mandatory legal rights applicable to a transaction will be determined according to the terms and laws applicable to that transaction.",
          },
        ],
      },
      {
        title: "11. CONTACT INFORMATION",
        blocks: [
          {
            type: "p",
            text: "Support Email: support@cortexaaicrm.com",
          },
          {
            type: "p",
            text: "Legal Business Name: Listo Qasa S.A.S.",
          },
          {
            type: "p",
            text: "Trade Name / Brand: CORTEXA Agentic AI Revenue OS",
          },
          {
            type: "p",
            text: "RUC: 1793234655001",
          },
          {
            type: "p",
            text: "Country of Registration: Ecuador",
          },
        ],
      },
    ],
  },

  es: {
    title: "POLÍTICA DE REEMBOLSOS Y CANCELACIONES DE CORTEXA",
    effectiveDate: "Fecha de entrada en vigor: 22 de abril de 2026",
    intro:
      "Esta Política de Reembolsos y Cancelaciones se aplica a las compras de productos y servicios de CORTEXA AI Revenue OS operados por Listo Qasa S.A.S. Los pagos procesados a través de Paddle también están sujetos a los Términos del Comprador y a la Política de Reembolsos aplicables de Paddle.",
    sections: [
      {
        title: "1. PERÍODO DE REEMBOLSO DE 14 DÍAS",
        blocks: [
          {
            type: "p",
            text: "Los clientes pueden solicitar un reembolso dentro de los 14 días calendario posteriores a una compra inicial elegible o al pago inicial de una suscripción.",
          },
          {
            type: "p",
            text: "Cuando la legislación aplicable o los Términos del Comprador o la Política de Reembolsos de Paddle otorguen al cliente derechos adicionales o mayores de cancelación, desistimiento o reembolso, se aplicarán dichos derechos.",
          },
          {
            type: "p",
            text: "Nada de lo dispuesto en esta política limita los derechos obligatorios de los consumidores.",
          },
        ],
      },
      {
        title: "2. SUSCRIPCIONES",
        blocks: [
          {
            type: "p",
            text: "Las suscripciones de Cortexa se renuevan automáticamente según el período de facturación indicado al finalizar la compra, salvo que se cancelen.",
          },
          {
            type: "p",
            text: "Los clientes pueden cancelar su suscripción en cualquier momento.",
          },
          {
            type: "p",
            text: "La cancelación detiene las renovaciones futuras y normalmente entra en vigor al final del período de facturación actual, salvo que la legislación aplicable o los términos de Paddle exijan lo contrario.",
          },
          {
            type: "p",
            text: "La cancelación de una suscripción no genera automáticamente un reembolso por períodos de suscripción anteriores.",
          },
          {
            type: "p",
            text: "Las solicitudes de reembolso realizadas dentro de un período aplicable de 14 días para reembolso o desistimiento se gestionarán de acuerdo con esta política, los términos aplicables de Paddle y la legislación aplicable.",
          },
        ],
      },
      {
        title: "3. PRUEBAS GRATUITAS",
        blocks: [
          {
            type: "p",
            text: "Si una suscripción de Cortexa incluye una prueba gratuita, los términos aplicables de la prueba y la facturación se comunicarán claramente antes de la compra.",
          },
          {
            type: "p",
            text: "Los clientes pueden cancelar antes de que la prueba se convierta en una suscripción de pago para evitar el cargo correspondiente.",
          },
          {
            type: "p",
            text: "Se respetarán los derechos adicionales de desistimiento o reembolso posteriores a una prueba gratuita cuando así lo exijan los términos de Paddle o la legislación aplicable.",
          },
        ],
      },
      {
        title: "4. ESPACIOS DE TRABAJO, COMPLEMENTOS Y OTROS PRODUCTOS CORTEXA",
        blocks: [
          {
            type: "p",
            text: "La elegibilidad para reembolsos de Espacios de Trabajo de Cortexa de pago, complementos, compras de activación y otros productos o servicios digitales sigue las mismas reglas de reembolso aplicables, salvo que se indiquen claramente términos diferentes antes de la compra o que la legislación aplicable otorgue mayores derechos.",
          },
        ],
      },
      {
        title: "5. SERVICIOS DEFECTUOSOS O NO DISPONIBLES",
        blocks: [
          {
            type: "p",
            text: "Si un producto o servicio de Cortexa adquirido no se entrega, presenta defectos materiales o no puede proporcionarse razonablemente según lo descrito, los clientes pueden contactarnos para recibir asistencia.",
          },
          {
            type: "p",
            text: "Se respetarán todos los derechos de reembolso previstos por la legislación aplicable o por Paddle.",
          },
        ],
      },
      {
        title: "6. CÓMO SOLICITAR UN REEMBOLSO",
        blocks: [
          {
            type: "p",
            text: "Para las compras procesadas por Paddle, los clientes pueden solicitar un reembolso mediante las opciones de soporte al comprador y gestión de suscripciones de Paddle proporcionadas con su transacción o recibo.",
          },
          {
            type: "p",
            text: "Los clientes también pueden contactar al soporte de Cortexa en:",
          },
          {
            type: "p",
            text: "support@cortexaaicrm.com",
          },
          {
            type: "p",
            text: "Proporcione información suficiente para que podamos identificar la cuenta y la transacción correspondientes.",
          },
          {
            type: "p",
            text: "Los reembolsos elegibles de transacciones procesadas por Paddle se procesarán a través de Paddle y se devolverán mediante el método de pago correspondiente de acuerdo con los procedimientos de Paddle.",
          },
        ],
      },
      {
        title: "7. FRAUDE Y ABUSO DE REEMBOLSOS",
        blocks: [
          {
            type: "p",
            text: "Las solicitudes de reembolso pueden ser rechazadas cuando la ley lo permita si existen pruebas de fraude, abuso, manipulación o uso indebido de los sistemas de reembolso o protección de pagos.",
          },
          {
            type: "p",
            text: "Esto no limita ningún derecho obligatorio de los consumidores.",
          },
        ],
      },
      {
        title: "8. ACCESO DESPUÉS DE UN REEMBOLSO",
        blocks: [
          {
            type: "p",
            text: "Cuando se reembolsa una compra, el acceso a la suscripción de pago, Espacio de Trabajo, complemento u otro producto de pago reembolsado puede finalizar o volver al nivel de acceso de Cortexa que corresponda al cliente.",
          },
          {
            type: "p",
            text: "El reembolso de un Espacio de Trabajo o complemento no cancela automáticamente otros productos o suscripciones de Cortexa no relacionados, salvo que se requiera lo contrario.",
          },
        ],
      },
      {
        title: "9. CONTRACARGOS Y DISPUTAS DE PAGO",
        blocks: [
          {
            type: "p",
            text: "Se recomienda a los clientes contactar a Cortexa o Paddle por cualquier inquietud de facturación antes de iniciar un contracargo o disputa de pago, para que el asunto pueda revisarse con prontitud.",
          },
          {
            type: "p",
            text: "Nada de lo dispuesto en esta sección limita los derechos legales del cliente frente a su banco, proveedor de pagos, emisor de tarjeta, Paddle o conforme a la legislación aplicable de protección al consumidor.",
          },
        ],
      },
      {
        title: "10. CAMBIOS EN ESTA POLÍTICA",
        blocks: [
          {
            type: "p",
            text: "Podemos actualizar periódicamente esta Política de Reembolsos y Cancelaciones.",
          },
          {
            type: "p",
            text: "La política y los derechos legales obligatorios aplicables a una transacción se determinarán de acuerdo con los términos y las leyes aplicables a dicha transacción.",
          },
        ],
      },
      {
        title: "11. INFORMACIÓN DE CONTACTO",
        blocks: [
          {
            type: "p",
            text: "Correo electrónico de soporte: support@cortexaaicrm.com",
          },
          {
            type: "p",
            text: "Nombre legal de la empresa: Listo Qasa S.A.S.",
          },
          {
            type: "p",
            text: "Nombre comercial / Marca: CORTEXA Agentic AI Revenue OS",
          },
          {
            type: "p",
            text: "RUC: 1793234655001",
          },
          {
            type: "p",
            text: "País de registro: Ecuador",
          },
        ],
      },
    ],
  },

  pt: {
    title: "POLÍTICA DE REEMBOLSO E CANCELAMENTO DA CORTEXA",
    effectiveDate: "Data de vigência: 22 de abril de 2026",
    intro:
      "Esta Política de Reembolso e Cancelamento aplica-se às compras de produtos e serviços do CORTEXA AI Revenue OS operados pela Listo Qasa S.A.S. Os pagamentos processados pela Paddle também estão sujeitos aos Termos do Comprador e à Política de Reembolso aplicáveis da Paddle.",
    sections: [
      {
        title: "1. PERÍODO DE REEMBOLSO DE 14 DIAS",
        blocks: [
          {
            type: "p",
            text: "Os clientes podem solicitar um reembolso dentro de 14 dias corridos após uma compra inicial elegível ou o pagamento inicial de uma assinatura.",
          },
          {
            type: "p",
            text: "Quando a legislação aplicável ou os Termos do Comprador ou a Política de Reembolso da Paddle concederem ao cliente direitos adicionais ou mais amplos de cancelamento, desistência ou reembolso, esses direitos serão aplicados.",
          },
          {
            type: "p",
            text: "Nada nesta política limita quaisquer direitos obrigatórios do consumidor.",
          },
        ],
      },
      {
        title: "2. ASSINATURAS",
        blocks: [
          {
            type: "p",
            text: "As assinaturas da Cortexa são renovadas automaticamente de acordo com o período de cobrança informado no checkout, salvo se forem canceladas.",
          },
          {
            type: "p",
            text: "Os clientes podem cancelar sua assinatura a qualquer momento.",
          },
          {
            type: "p",
            text: "O cancelamento interrompe futuras renovações e normalmente entra em vigor ao final do período de cobrança atual, salvo se a legislação aplicável ou os termos da Paddle exigirem o contrário.",
          },
          {
            type: "p",
            text: "O cancelamento de uma assinatura não gera automaticamente um reembolso por períodos anteriores da assinatura.",
          },
          {
            type: "p",
            text: "Solicitações de reembolso feitas dentro de um período aplicável de 14 dias para reembolso ou desistência serão tratadas de acordo com esta política, os termos aplicáveis da Paddle e a legislação aplicável.",
          },
        ],
      },
      {
        title: "3. TESTES GRATUITOS",
        blocks: [
          {
            type: "p",
            text: "Se uma assinatura da Cortexa incluir um teste gratuito, os termos aplicáveis do teste e da cobrança serão claramente informados antes da compra.",
          },
          {
            type: "p",
            text: "Os clientes podem cancelar antes que o teste seja convertido em uma assinatura paga para evitar a cobrança correspondente.",
          },
          {
            type: "p",
            text: "Quaisquer direitos adicionais de desistência ou reembolso após um teste gratuito serão respeitados quando exigidos pelos termos da Paddle ou pela legislação aplicável.",
          },
        ],
      },
      {
        title: "4. WORKSPACES, COMPLEMENTOS E OUTROS PRODUTOS CORTEXA",
        blocks: [
          {
            type: "p",
            text: "A elegibilidade para reembolso de Workspaces pagos da Cortexa, complementos, compras de ativação e outros produtos ou serviços digitais segue as mesmas regras de reembolso aplicáveis, salvo se termos diferentes forem claramente informados antes da compra ou se a legislação aplicável conceder direitos mais amplos.",
          },
        ],
      },
      {
        title: "5. SERVIÇOS COM DEFEITO OU INDISPONÍVEIS",
        blocks: [
          {
            type: "p",
            text: "Se um produto ou serviço da Cortexa adquirido não for entregue, apresentar defeito material ou não puder ser razoavelmente fornecido conforme descrito, os clientes poderão entrar em contato conosco para obter assistência.",
          },
          {
            type: "p",
            text: "Quaisquer direitos de reembolso previstos pela legislação aplicável ou pela Paddle serão respeitados.",
          },
        ],
      },
      {
        title: "6. COMO SOLICITAR UM REEMBOLSO",
        blocks: [
          {
            type: "p",
            text: "Para compras processadas pela Paddle, os clientes podem solicitar um reembolso por meio das opções de suporte ao comprador e gerenciamento de assinaturas da Paddle fornecidas com sua transação ou recibo.",
          },
          {
            type: "p",
            text: "Os clientes também podem entrar em contato com o suporte da Cortexa em:",
          },
          {
            type: "p",
            text: "support@cortexaaicrm.com",
          },
          {
            type: "p",
            text: "Forneça informações suficientes para que possamos identificar a conta e a transação correspondentes.",
          },
          {
            type: "p",
            text: "Reembolsos elegíveis de transações processadas pela Paddle serão processados pela Paddle e devolvidos pelo método de pagamento aplicável, de acordo com os procedimentos da Paddle.",
          },
        ],
      },
      {
        title: "7. FRAUDE E ABUSO DE REEMBOLSO",
        blocks: [
          {
            type: "p",
            text: "As solicitações de reembolso podem ser negadas, quando permitido por lei, se houver evidências de fraude, abuso, manipulação ou uso indevido de sistemas de reembolso ou proteção de pagamentos.",
          },
          {
            type: "p",
            text: "Isso não limita quaisquer direitos obrigatórios do consumidor.",
          },
        ],
      },
      {
        title: "8. ACESSO APÓS UM REEMBOLSO",
        blocks: [
          {
            type: "p",
            text: "Quando uma compra é reembolsada, o acesso à assinatura paga, Workspace, complemento ou outro produto pago reembolsado poderá ser encerrado ou retornar ao nível de acesso da Cortexa aplicável ao cliente.",
          },
          {
            type: "p",
            text: "O reembolso de um Workspace ou complemento não cancela automaticamente produtos ou assinaturas da Cortexa não relacionados, salvo se exigido de outra forma.",
          },
        ],
      },
      {
        title: "9. CHARGEBACKS E DISPUTAS DE PAGAMENTO",
        blocks: [
          {
            type: "p",
            text: "Os clientes são incentivados a entrar em contato com a Cortexa ou a Paddle sobre questões de cobrança antes de iniciar um chargeback ou disputa de pagamento, para que a questão possa ser analisada prontamente.",
          },
          {
            type: "p",
            text: "Nada nesta seção limita os direitos legais do cliente perante seu banco, provedor de pagamento, emissor do cartão, Paddle ou conforme a legislação aplicável de proteção ao consumidor.",
          },
        ],
      },
      {
        title: "10. ALTERAÇÕES NESTA POLÍTICA",
        blocks: [
          {
            type: "p",
            text: "Podemos atualizar periodicamente esta Política de Reembolso e Cancelamento.",
          },
          {
            type: "p",
            text: "A política e os direitos legais obrigatórios aplicáveis a uma transação serão determinados de acordo com os termos e as leis aplicáveis a essa transação.",
          },
        ],
      },
      {
        title: "11. INFORMAÇÕES DE CONTATO",
        blocks: [
          {
            type: "p",
            text: "E-mail de suporte: support@cortexaaicrm.com",
          },
          {
            type: "p",
            text: "Nome jurídico da empresa: Listo Qasa S.A.S.",
          },
          {
            type: "p",
            text: "Nome comercial / Marca: CORTEXA Agentic AI Revenue OS",
          },
          {
            type: "p",
            text: "RUC: 1793234655001",
          },
          {
            type: "p",
            text: "País de registro: Equador",
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
    color: "#111827",
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