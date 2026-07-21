import React, { useState } from "react";

const t = {
  en: {
    title: "Privacy Policy",
    effectiveDate: "Effective Date: April 22, 2026",
    intro1:
      'This Privacy Policy explains how CORTEXA AI Revenue OS ("Cortexa", "we", "our", "us") collects, uses, and protects your information when you use our platform and services ("Services").',
    intro2:
      "By using CORTEXA AI Revenue OS, you agree to this Privacy Policy.",
    sections: [
      {
        title: "1. Information We Collect",
        blocks: [
          { type: "p", text: "We may collect the following categories of information:" },
          { type: "h4", text: "A. Personal Information" },
          {
            type: "ul",
            items: [
              "Name",
              "Email address",
              "Phone number (if provided)",
              "Billing and payment details (processed via third-party providers)",
            ],
          },
          { type: "h4", text: "B. Business & CRM Data" },
          {
            type: "ul",
            items: [
              "Leads, contacts, and customer data you input into the platform",
              "Messages, notes, and activity within your CRM workspace",
            ],
          },
          { type: "h4", text: "C. Technical & Usage Data" },
          {
            type: "ul",
            items: [
              "IP address",
              "Browser type and device information",
              "Pages visited, actions taken, and usage behavior",
              "Log data and performance metrics",
            ],
          },
        ],
      },
      {
        title: "2. How We Use Your Information",
        blocks: [
          { type: "p", text: "We use your information to:" },
          {
            type: "ul",
            items: [
              "Provide, operate, and maintain the Services",
              "Process payments and manage subscriptions",
              "Automate workflows and CRM functionality",
              "Improve performance, features, and user experience",
              "Communicate with you (support, updates, notifications)",
              "Respond to support requests (including AI-assisted support)",
              "Monitor for fraud, abuse, or security risks",
              "Comply with legal obligations",
            ],
          },
        ],
      },
      {
        title: "3. Data Ownership & Control",
        blocks: [
          {
            type: "ul",
            items: [
              "You retain ownership of all data you input into Cortexa",
              "Cortexa does NOT sell your personal or business data",
              "We process your data only to provide and improve our Services",
            ],
          },
          { type: "p", text: "You are responsible for ensuring that your data:" },
          {
            type: "ul",
            items: [
              "Is lawfully collected",
              "Complies with applicable data protection laws",
            ],
          },
        ],
      },
      {
        title: "4. Data Sharing",
        blocks: [
          { type: "p", text: "We may share information only as necessary with:" },
          {
            type: "ul",
            items: [
              "Payment processors (e.g., PayPal)",
              "Cloud hosting and infrastructure providers",
              "Service providers that support platform functionality",
              "Legal authorities when required by law or to protect rights",
            ],
          },
          { type: "p", text: "We do NOT sell, rent, or trade your data." },
        ],
      },
      {
        title: "5. Third-Party Integrations",
        blocks: [
          {
            type: "p",
            text: "Cortexa may integrate with third-party tools (e.g., messaging platforms, email services, automation tools).",
          },
          { type: "p", text: "When you connect third-party services:" },
          {
            type: "ul",
            items: [
              "You authorize us to exchange data with those services",
              "Their privacy policies will also apply",
            ],
          },
          { type: "p", text: "Cortexa is not responsible for third-party data practices." },
        ],
      },
      {
        title: "6. Data Security",
        blocks: [
          {
            type: "p",
            text: "We implement reasonable administrative, technical, and security measures to protect your data.",
          },
          { type: "p", text: "However:" },
          {
            type: "ul",
            items: [
              "No system is 100% secure",
              "You use the platform at your own risk",
            ],
          },
          {
            type: "p",
            text: "You are responsible for maintaining the security of your account credentials.",
          },
        ],
      },
      {
        title: "7. Data Retention",
        blocks: [
          { type: "p", text: "We retain data only as long as necessary to:" },
          {
            type: "ul",
            items: [
              "Provide our Services",
              "Maintain your account",
              "Comply with legal obligations",
              "Resolve disputes and enforce agreements",
            ],
          },
          { type: "p", text: "We may delete or anonymize data when no longer required." },
        ],
      },
      {
        title: "8. Cookies & Tracking Technologies",
        blocks: [
          { type: "p", text: "We use cookies and similar technologies to:" },
          {
            type: "ul",
            items: [
              "Improve functionality and performance",
              "Analyze usage and behavior",
              "Support marketing and advertising (e.g., Google Ads tracking)",
            ],
          },
          {
            type: "p",
            text: "You can manage cookie preferences through your browser settings.",
          },
        ],
      },
      {
        title: "9. Your Rights",
        blocks: [
          { type: "p", text: "Depending on your location, you may have rights to:" },
          {
            type: "ul",
            items: [
              "Access your personal data",
              "Correct inaccurate data",
              "Request deletion of your data",
              "Restrict or object to certain processing",
              "Request data portability",
            ],
          },
          {
            type: "p",
            text: "To exercise your rights, contact us at the email below.",
          },
        ],
      },
      {
        title: "10. International Users",
        blocks: [
          {
            type: "p",
            text: "If you access Cortexa from outside your country of residence, your data may be transferred and processed in other jurisdictions.",
          },
          { type: "p", text: "By using our Services, you consent to this transfer." },
        ],
      },
      {
        title: "11. Changes to This Policy",
        blocks: [
          { type: "p", text: "We may update this Privacy Policy at any time." },
          {
            type: "p",
            text: "Continued use of the Services after changes means you accept the updated Policy.",
          },
        ],
      },
      {
        title: "12. Contact",
        blocks: [
          { type: "p", text: "Support Email: support@cortexaaicrm.com" },
          { type: "p", text: "Company: CORTEXA AI Revenue OS" },
        ],
      },
    ],
  },

  es: {
    title: "Política de Privacidad",
    effectiveDate: "Fecha de entrada en vigor: 22 de abril de 2026",
    intro1:
      'Esta Política de Privacidad explica cómo CORTEXA AI Revenue OS ("Cortexa", "nosotros", "nuestro", "nos") recopila, utiliza y protege su información cuando utiliza nuestra plataforma y servicios ("Servicios").',
    intro2:
      "Al utilizar CORTEXA AI Revenue OS, usted acepta esta Política de Privacidad.",
    sections: [
      {
        title: "1. Información que Recopilamos",
        blocks: [
          { type: "p", text: "Podemos recopilar las siguientes categorías de información:" },
          { type: "h4", text: "A. Información Personal" },
          {
            type: "ul",
            items: [
              "Nombre",
              "Dirección de correo electrónico",
              "Número de teléfono (si se proporciona)",
              "Datos de facturación y pago (procesados mediante proveedores externos)",
            ],
          },
          { type: "h4", text: "B. Datos Empresariales y de CRM" },
          {
            type: "ul",
            items: [
              "Prospectos, contactos y datos de clientes que ingresa en la plataforma",
              "Mensajes, notas y actividad dentro de su espacio de trabajo de CRM",
            ],
          },
          { type: "h4", text: "C. Datos Técnicos y de Uso" },
          {
            type: "ul",
            items: [
              "Dirección IP",
              "Tipo de navegador e información del dispositivo",
              "Páginas visitadas, acciones realizadas y comportamiento de uso",
              "Datos de registro y métricas de rendimiento",
            ],
          },
        ],
      },
      {
        title: "2. Cómo Utilizamos su Información",
        blocks: [
          { type: "p", text: "Utilizamos su información para:" },
          {
            type: "ul",
            items: [
              "Proporcionar, operar y mantener los Servicios",
              "Procesar pagos y gestionar suscripciones",
              "Automatizar flujos de trabajo y funciones de CRM",
              "Mejorar el rendimiento, las funciones y la experiencia del usuario",
              "Comunicarnos con usted (soporte, actualizaciones y notificaciones)",
              "Responder solicitudes de soporte, incluido el soporte asistido por IA",
              "Supervisar fraude, abuso o riesgos de seguridad",
              "Cumplir obligaciones legales",
            ],
          },
        ],
      },
      {
        title: "3. Propiedad y Control de los Datos",
        blocks: [
          {
            type: "ul",
            items: [
              "Usted conserva la propiedad de todos los datos que introduce en Cortexa",
              "Cortexa NO vende sus datos personales ni empresariales",
              "Procesamos sus datos únicamente para prestar y mejorar nuestros Servicios",
            ],
          },
          { type: "p", text: "Usted es responsable de garantizar que sus datos:" },
          {
            type: "ul",
            items: [
              "Se hayan recopilado legalmente",
              "Cumplan con las leyes aplicables de protección de datos",
            ],
          },
        ],
      },
      {
        title: "4. Intercambio de Datos",
        blocks: [
          { type: "p", text: "Podemos compartir información únicamente cuando sea necesario con:" },
          {
            type: "ul",
            items: [
              "Procesadores de pago, como PayPal",
              "Proveedores de alojamiento en la nube e infraestructura",
              "Proveedores de servicios que respaldan la funcionalidad de la plataforma",
              "Autoridades legales cuando lo exija la ley o para proteger derechos",
            ],
          },
          { type: "p", text: "NO vendemos, alquilamos ni comercializamos sus datos." },
        ],
      },
      {
        title: "5. Integraciones de Terceros",
        blocks: [
          {
            type: "p",
            text: "Cortexa puede integrarse con herramientas de terceros, como plataformas de mensajería, servicios de correo electrónico y herramientas de automatización.",
          },
          { type: "p", text: "Cuando conecta servicios de terceros:" },
          {
            type: "ul",
            items: [
              "Nos autoriza a intercambiar datos con esos servicios",
              "También se aplicarán sus políticas de privacidad",
            ],
          },
          { type: "p", text: "Cortexa no es responsable de las prácticas de datos de terceros." },
        ],
      },
      {
        title: "6. Seguridad de los Datos",
        blocks: [
          {
            type: "p",
            text: "Implementamos medidas administrativas, técnicas y de seguridad razonables para proteger sus datos.",
          },
          { type: "p", text: "Sin embargo:" },
          {
            type: "ul",
            items: [
              "Ningún sistema es 100 % seguro",
              "Usted utiliza la plataforma bajo su propio riesgo",
            ],
          },
          {
            type: "p",
            text: "Usted es responsable de mantener seguras las credenciales de su cuenta.",
          },
        ],
      },
      {
        title: "7. Conservación de Datos",
        blocks: [
          { type: "p", text: "Conservamos los datos solo durante el tiempo necesario para:" },
          {
            type: "ul",
            items: [
              "Prestar nuestros Servicios",
              "Mantener su cuenta",
              "Cumplir obligaciones legales",
              "Resolver disputas y hacer cumplir acuerdos",
            ],
          },
          {
            type: "p",
            text: "Podemos eliminar o anonimizar los datos cuando ya no sean necesarios.",
          },
        ],
      },
      {
        title: "8. Cookies y Tecnologías de Seguimiento",
        blocks: [
          { type: "p", text: "Utilizamos cookies y tecnologías similares para:" },
          {
            type: "ul",
            items: [
              "Mejorar la funcionalidad y el rendimiento",
              "Analizar el uso y el comportamiento",
              "Apoyar el marketing y la publicidad, incluido el seguimiento de Google Ads",
            ],
          },
          {
            type: "p",
            text: "Puede administrar las preferencias de cookies desde la configuración de su navegador.",
          },
        ],
      },
      {
        title: "9. Sus Derechos",
        blocks: [
          { type: "p", text: "Dependiendo de su ubicación, puede tener derecho a:" },
          {
            type: "ul",
            items: [
              "Acceder a sus datos personales",
              "Corregir datos inexactos",
              "Solicitar la eliminación de sus datos",
              "Restringir u oponerse a determinados tratamientos",
              "Solicitar la portabilidad de los datos",
            ],
          },
          {
            type: "p",
            text: "Para ejercer sus derechos, contáctenos mediante el correo indicado a continuación.",
          },
        ],
      },
      {
        title: "10. Usuarios Internacionales",
        blocks: [
          {
            type: "p",
            text: "Si accede a Cortexa desde fuera de su país de residencia, sus datos pueden transferirse y procesarse en otras jurisdicciones.",
          },
          {
            type: "p",
            text: "Al utilizar nuestros Servicios, usted acepta dicha transferencia.",
          },
        ],
      },
      {
        title: "11. Cambios en esta Política",
        blocks: [
          {
            type: "p",
            text: "Podemos actualizar esta Política de Privacidad en cualquier momento.",
          },
          {
            type: "p",
            text: "El uso continuado de los Servicios después de los cambios significa que acepta la Política actualizada.",
          },
        ],
      },
      {
        title: "12. Contacto",
        blocks: [
          { type: "p", text: "Correo de soporte: support@cortexaaicrm.com" },
          { type: "p", text: "Empresa: CORTEXA AI Revenue OS" },
        ],
      },
    ],
  },

  pt: {
    title: "Política de Privacidade",
    effectiveDate: "Data de vigência: 22 de abril de 2026",
    intro1:
      'Esta Política de Privacidade explica como o CORTEXA AI Revenue OS ("Cortexa", "nós", "nosso", "conosco") coleta, utiliza e protege suas informações quando você usa nossa plataforma e serviços ("Serviços").',
    intro2:
      "Ao utilizar o CORTEXA AI Revenue OS, você concorda com esta Política de Privacidade.",
    sections: [
      {
        title: "1. Informações que Coletamos",
        blocks: [
          { type: "p", text: "Podemos coletar as seguintes categorias de informações:" },
          { type: "h4", text: "A. Informações Pessoais" },
          {
            type: "ul",
            items: [
              "Nome",
              "Endereço de e-mail",
              "Número de telefone, se fornecido",
              "Dados de cobrança e pagamento, processados por provedores terceiros",
            ],
          },
          { type: "h4", text: "B. Dados Empresariais e de CRM" },
          {
            type: "ul",
            items: [
              "Leads, contatos e dados de clientes inseridos na plataforma",
              "Mensagens, observações e atividades dentro do espaço de trabalho do CRM",
            ],
          },
          { type: "h4", text: "C. Dados Técnicos e de Uso" },
          {
            type: "ul",
            items: [
              "Endereço IP",
              "Tipo de navegador e informações do dispositivo",
              "Páginas visitadas, ações realizadas e comportamento de uso",
              "Dados de registro e métricas de desempenho",
            ],
          },
        ],
      },
      {
        title: "2. Como Utilizamos suas Informações",
        blocks: [
          { type: "p", text: "Utilizamos suas informações para:" },
          {
            type: "ul",
            items: [
              "Fornecer, operar e manter os Serviços",
              "Processar pagamentos e gerenciar assinaturas",
              "Automatizar fluxos de trabalho e funcionalidades de CRM",
              "Melhorar desempenho, recursos e experiência do usuário",
              "Comunicar-nos com você, incluindo suporte, atualizações e notificações",
              "Responder a solicitações de suporte, inclusive com assistência de IA",
              "Monitorar fraude, abuso ou riscos de segurança",
              "Cumprir obrigações legais",
            ],
          },
        ],
      },
      {
        title: "3. Propriedade e Controle dos Dados",
        blocks: [
          {
            type: "ul",
            items: [
              "Você mantém a propriedade de todos os dados inseridos no Cortexa",
              "O Cortexa NÃO vende seus dados pessoais ou empresariais",
              "Processamos seus dados somente para fornecer e melhorar nossos Serviços",
            ],
          },
          { type: "p", text: "Você é responsável por garantir que seus dados:" },
          {
            type: "ul",
            items: [
              "Sejam coletados legalmente",
              "Estejam em conformidade com as leis aplicáveis de proteção de dados",
            ],
          },
        ],
      },
      {
        title: "4. Compartilhamento de Dados",
        blocks: [
          { type: "p", text: "Podemos compartilhar informações apenas quando necessário com:" },
          {
            type: "ul",
            items: [
              "Processadores de pagamento, como PayPal",
              "Provedores de hospedagem em nuvem e infraestrutura",
              "Prestadores de serviços que apoiam a funcionalidade da plataforma",
              "Autoridades legais quando exigido por lei ou para proteger direitos",
            ],
          },
          { type: "p", text: "NÃO vendemos, alugamos ou comercializamos seus dados." },
        ],
      },
      {
        title: "5. Integrações de Terceiros",
        blocks: [
          {
            type: "p",
            text: "O Cortexa pode integrar-se a ferramentas de terceiros, como plataformas de mensagens, serviços de e-mail e ferramentas de automação.",
          },
          { type: "p", text: "Quando você conecta serviços de terceiros:" },
          {
            type: "ul",
            items: [
              "Você nos autoriza a trocar dados com esses serviços",
              "As políticas de privacidade deles também serão aplicáveis",
            ],
          },
          {
            type: "p",
            text: "O Cortexa não é responsável pelas práticas de dados de terceiros.",
          },
        ],
      },
      {
        title: "6. Segurança dos Dados",
        blocks: [
          {
            type: "p",
            text: "Implementamos medidas administrativas, técnicas e de segurança razoáveis para proteger seus dados.",
          },
          { type: "p", text: "No entanto:" },
          {
            type: "ul",
            items: [
              "Nenhum sistema é 100% seguro",
              "Você utiliza a plataforma por sua própria conta e risco",
            ],
          },
          {
            type: "p",
            text: "Você é responsável por manter a segurança das credenciais da sua conta.",
          },
        ],
      },
      {
        title: "7. Retenção de Dados",
        blocks: [
          { type: "p", text: "Mantemos os dados apenas pelo tempo necessário para:" },
          {
            type: "ul",
            items: [
              "Fornecer nossos Serviços",
              "Manter sua conta",
              "Cumprir obrigações legais",
              "Resolver disputas e fazer cumprir acordos",
            ],
          },
          {
            type: "p",
            text: "Podemos excluir ou anonimizar dados quando eles não forem mais necessários.",
          },
        ],
      },
      {
        title: "8. Cookies e Tecnologias de Rastreamento",
        blocks: [
          { type: "p", text: "Utilizamos cookies e tecnologias semelhantes para:" },
          {
            type: "ul",
            items: [
              "Melhorar funcionalidade e desempenho",
              "Analisar uso e comportamento",
              "Apoiar marketing e publicidade, incluindo rastreamento do Google Ads",
            ],
          },
          {
            type: "p",
            text: "Você pode gerenciar as preferências de cookies nas configurações do seu navegador.",
          },
        ],
      },
      {
        title: "9. Seus Direitos",
        blocks: [
          { type: "p", text: "Dependendo da sua localização, você pode ter direito a:" },
          {
            type: "ul",
            items: [
              "Acessar seus dados pessoais",
              "Corrigir dados incorretos",
              "Solicitar a exclusão dos seus dados",
              "Restringir ou se opor a determinados tratamentos",
              "Solicitar portabilidade dos dados",
            ],
          },
          {
            type: "p",
            text: "Para exercer seus direitos, entre em contato pelo e-mail abaixo.",
          },
        ],
      },
      {
        title: "10. Usuários Internacionais",
        blocks: [
          {
            type: "p",
            text: "Se você acessar o Cortexa fora do seu país de residência, seus dados poderão ser transferidos e processados em outras jurisdições.",
          },
          {
            type: "p",
            text: "Ao utilizar nossos Serviços, você concorda com essa transferência.",
          },
        ],
      },
      {
        title: "11. Alterações nesta Política",
        blocks: [
          {
            type: "p",
            text: "Podemos atualizar esta Política de Privacidade a qualquer momento.",
          },
          {
            type: "p",
            text: "O uso contínuo dos Serviços após alterações significa que você aceita a Política atualizada.",
          },
        ],
      },
      {
        title: "12. Contato",
        blocks: [
          { type: "p", text: "E-mail de suporte: support@cortexaaicrm.com" },
          { type: "p", text: "Empresa: CORTEXA AI Revenue OS" },
        ],
      },
    ],
  },
};

const ContentBlock = ({ block }) => {
  if (block.type === "h4") {
    return <h4>{block.text}</h4>;
  }

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

const Privacy = () => {
  const [lang] = useState(
    () => localStorage.getItem("cortexa_lang") || "en",
  );

  const tr = t[lang] || t.en;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{tr.title}</h1>

      <p style={styles.effectiveDate}>{tr.effectiveDate}</p>

      <p>{tr.intro1}</p>

      <p>{tr.intro2}</p>

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

export default Privacy;