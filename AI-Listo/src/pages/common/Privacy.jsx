import React, { useState } from "react";

const t = {
  en: {
    title: "PRIVACY POLICY",
    effectiveDate: "Effective Date: April 22, 2026",
    intro1:
      'This Privacy Policy explains how CORTEXA AI Revenue OS ("Cortexa", "we", "our", "us"), operated by Listo Qasa S.A.S., collects, uses, and protects your information when you use our platform and services ("Services").',
    intro2: "By using CORTEXA AI Revenue OS, you agree to this Privacy Policy.",
    sections: [
      { title: "1. INFORMATION WE COLLECT", blocks: [
        { type: "p", text: "We may collect the following categories of information:" },
        { type: "h4", text: "A. Personal Information" },
        { type: "ul", items: ["Name", "Email address", "Phone number (if provided)", "Billing and payment details (processed via third-party providers)"] },
        { type: "h4", text: "B. Business & CRM Data" },
        { type: "ul", items: ["Leads, contacts, and customer data you input into the platform", "Messages, notes, and activity within your CRM workspace"] },
        { type: "h4", text: "C. Technical & Usage Data" },
        { type: "ul", items: ["IP address", "Browser type and device information", "Pages visited, actions taken, and usage behavior", "Log data and performance metrics"] },
      ]},
      { title: "2. HOW WE USE YOUR INFORMATION", blocks: [
        { type: "p", text: "We use your information to:" },
        { type: "ul", items: ["Provide, operate, and maintain the Services", "Process payments and manage subscriptions", "Automate workflows and CRM functionality", "Improve performance, features, and user experience", "Communicate with you regarding support, updates, and notifications", "Respond to support requests, including AI-assisted support", "Monitor for fraud, abuse, or security risks", "Comply with legal obligations"] },
      ]},
      { title: "3. DATA OWNERSHIP & CONTROL", blocks: [
        { type: "p", text: "You retain ownership of all data you input into Cortexa." },
        { type: "p", text: "Cortexa does NOT sell your personal or business data." },
        { type: "p", text: "We process your data only as necessary to provide, operate, secure, and improve our Services." },
        { type: "p", text: "You are responsible for ensuring that data you provide to Cortexa:" },
        { type: "ul", items: ["Is lawfully collected", "Is lawfully processed", "Complies with applicable privacy and data-protection laws"] },
      ]},
      { title: "4. DATA SHARING", blocks: [
        { type: "p", text: "We may share information only as necessary with:" },
        { type: "ul", items: ["Payment processors", "Cloud hosting and infrastructure providers", "AI and technology providers supporting platform functionality", "Communication and integration providers", "Legal authorities when required by law or necessary to protect legal rights"] },
        { type: "p", text: "We do NOT sell, rent, or trade your data." },
      ]},
      { title: "5. THIRD-PARTY INTEGRATIONS", blocks: [
        { type: "p", text: "Cortexa may integrate with third-party services, including messaging platforms, email services, AI providers, payment providers, and automation tools." },
        { type: "p", text: "When you connect third-party services:" },
        { type: "ul", items: ["You authorize us to exchange data with those services as necessary to provide the requested functionality", "Their respective privacy policies and terms may also apply", "Cortexa is not responsible for independent third-party data practices"] },
      ]},
      { title: "6. DATA SECURITY", blocks: [
        { type: "p", text: "We implement reasonable administrative, technical, and security measures designed to protect your data." },
        { type: "p", text: "However:" },
        { type: "ul", items: ["No system can guarantee 100% security", "You are responsible for maintaining the security of your account credentials"] },
      ]},
      { title: "7. DATA RETENTION", blocks: [
        { type: "p", text: "We retain data only as long as reasonably necessary to:" },
        { type: "ul", items: ["Provide our Services", "Maintain your account", "Comply with legal obligations", "Resolve disputes", "Enforce agreements"] },
        { type: "p", text: "We may delete or anonymize data when it is no longer required." },
      ]},
      { title: "8. COOKIES & TRACKING TECHNOLOGIES", blocks: [
        { type: "p", text: "We use cookies and similar technologies to:" },
        { type: "ul", items: ["Improve functionality and performance", "Analyze usage and behavior", "Support marketing and advertising, including Google Ads tracking"] },
        { type: "p", text: "You may manage cookie preferences through your browser settings and any consent controls provided by Cortexa where applicable." },
      ]},
      { title: "9. YOUR RIGHTS", blocks: [
        { type: "p", text: "Depending on your location and applicable law, you may have rights to:" },
        { type: "ul", items: ["Access your personal data", "Correct inaccurate personal data", "Request deletion", "Restrict or object to certain processing", "Request data portability"] },
        { type: "p", text: "To exercise applicable rights, contact us using the information below." },
      ]},
      { title: "10. INTERNATIONAL USERS", blocks: [
        { type: "p", text: "Cortexa may use service providers and infrastructure located in different jurisdictions. As a result, information may be transferred to or processed in countries outside your country of residence, subject to applicable legal requirements." },
      ]},
      { title: "11. CHANGES TO THIS POLICY", blocks: [
        { type: "p", text: "We may update this Privacy Policy periodically." },
        { type: "p", text: "Where required, we will provide appropriate notice of material changes. Continued use of the Services after an updated policy becomes effective constitutes acceptance to the extent permitted by applicable law." },
      ]},
      { title: "12. CONTACT", blocks: [
        { type: "p", text: "Support Email: support@cortexaaicrm.com" },
        { type: "p", text: "Legal Business Name: Listo Qasa S.A.S." },
        { type: "p", text: "Trade Name / Brand: CORTEXA Agentic AI Revenue OS" },
        { type: "p", text: "RUC: 1793234655001" },
        { type: "p", text: "Country of Registration: Ecuador" },
      ]},
    ],
  },

  es: {
    title: "POLÍTICA DE PRIVACIDAD",
    effectiveDate: "Fecha de entrada en vigor: 22 de abril de 2026",
    intro1:
      'Esta Política de Privacidad explica cómo CORTEXA AI Revenue OS ("Cortexa", "nosotros", "nuestro", "nos"), operado por Listo Qasa S.A.S., recopila, utiliza y protege su información cuando utiliza nuestra plataforma y servicios ("Servicios").',
    intro2: "Al utilizar CORTEXA AI Revenue OS, usted acepta esta Política de Privacidad.",
    sections: [
      { title: "1. INFORMACIÓN QUE RECOPILAMOS", blocks: [
        { type: "p", text: "Podemos recopilar las siguientes categorías de información:" },
        { type: "h4", text: "A. Información Personal" },
        { type: "ul", items: ["Nombre", "Dirección de correo electrónico", "Número de teléfono (si se proporciona)", "Datos de facturación y pago (procesados mediante proveedores externos)"] },
        { type: "h4", text: "B. Datos Empresariales y de CRM" },
        { type: "ul", items: ["Prospectos, contactos y datos de clientes que introduce en la plataforma", "Mensajes, notas y actividad dentro de su espacio de trabajo de CRM"] },
        { type: "h4", text: "C. Datos Técnicos y de Uso" },
        { type: "ul", items: ["Dirección IP", "Tipo de navegador e información del dispositivo", "Páginas visitadas, acciones realizadas y comportamiento de uso", "Datos de registro y métricas de rendimiento"] },
      ]},
      { title: "2. CÓMO UTILIZAMOS SU INFORMACIÓN", blocks: [
        { type: "p", text: "Utilizamos su información para:" },
        { type: "ul", items: ["Proporcionar, operar y mantener los Servicios", "Procesar pagos y gestionar suscripciones", "Automatizar flujos de trabajo y funciones de CRM", "Mejorar el rendimiento, las funciones y la experiencia del usuario", "Comunicarnos con usted sobre soporte, actualizaciones y notificaciones", "Responder a solicitudes de soporte, incluido el soporte asistido por IA", "Supervisar fraude, abuso o riesgos de seguridad", "Cumplir obligaciones legales"] },
      ]},
      { title: "3. PROPIEDAD Y CONTROL DE LOS DATOS", blocks: [
        { type: "p", text: "Usted conserva la propiedad de todos los datos que introduce en Cortexa." },
        { type: "p", text: "Cortexa NO vende sus datos personales ni empresariales." },
        { type: "p", text: "Procesamos sus datos únicamente cuando sea necesario para proporcionar, operar, proteger y mejorar nuestros Servicios." },
        { type: "p", text: "Usted es responsable de garantizar que los datos que proporciona a Cortexa:" },
        { type: "ul", items: ["Se recopilen legalmente", "Se procesen legalmente", "Cumplan con las leyes aplicables de privacidad y protección de datos"] },
      ]},
      { title: "4. INTERCAMBIO DE DATOS", blocks: [
        { type: "p", text: "Podemos compartir información únicamente cuando sea necesario con:" },
        { type: "ul", items: ["Procesadores de pagos", "Proveedores de alojamiento en la nube e infraestructura", "Proveedores de IA y tecnología que respaldan la funcionalidad de la plataforma", "Proveedores de comunicación e integración", "Autoridades legales cuando lo exija la ley o sea necesario para proteger derechos legales"] },
        { type: "p", text: "NO vendemos, alquilamos ni comercializamos sus datos." },
      ]},
      { title: "5. INTEGRACIONES DE TERCEROS", blocks: [
        { type: "p", text: "Cortexa puede integrarse con servicios de terceros, incluidas plataformas de mensajería, servicios de correo electrónico, proveedores de IA, proveedores de pagos y herramientas de automatización." },
        { type: "p", text: "Cuando conecta servicios de terceros:" },
        { type: "ul", items: ["Nos autoriza a intercambiar datos con esos servicios según sea necesario para proporcionar la funcionalidad solicitada", "También pueden aplicarse sus respectivas políticas de privacidad y términos", "Cortexa no es responsable de las prácticas independientes de datos de terceros"] },
      ]},
      { title: "6. SEGURIDAD DE LOS DATOS", blocks: [
        { type: "p", text: "Implementamos medidas administrativas, técnicas y de seguridad razonables diseñadas para proteger sus datos." },
        { type: "p", text: "Sin embargo:" },
        { type: "ul", items: ["Ningún sistema puede garantizar una seguridad del 100 %", "Usted es responsable de mantener seguras las credenciales de su cuenta"] },
      ]},
      { title: "7. CONSERVACIÓN DE DATOS", blocks: [
        { type: "p", text: "Conservamos los datos solo durante el tiempo razonablemente necesario para:" },
        { type: "ul", items: ["Proporcionar nuestros Servicios", "Mantener su cuenta", "Cumplir obligaciones legales", "Resolver disputas", "Hacer cumplir acuerdos"] },
        { type: "p", text: "Podemos eliminar o anonimizar los datos cuando ya no sean necesarios." },
      ]},
      { title: "8. COOKIES Y TECNOLOGÍAS DE SEGUIMIENTO", blocks: [
        { type: "p", text: "Utilizamos cookies y tecnologías similares para:" },
        { type: "ul", items: ["Mejorar la funcionalidad y el rendimiento", "Analizar el uso y el comportamiento", "Apoyar el marketing y la publicidad, incluido el seguimiento de Google Ads"] },
        { type: "p", text: "Puede administrar las preferencias de cookies mediante la configuración de su navegador y cualquier control de consentimiento proporcionado por Cortexa cuando corresponda." },
      ]},
      { title: "9. SUS DERECHOS", blocks: [
        { type: "p", text: "Dependiendo de su ubicación y de la legislación aplicable, puede tener derecho a:" },
        { type: "ul", items: ["Acceder a sus datos personales", "Corregir datos personales inexactos", "Solicitar la eliminación", "Restringir u oponerse a determinados tratamientos", "Solicitar la portabilidad de los datos"] },
        { type: "p", text: "Para ejercer los derechos aplicables, contáctenos utilizando la información que aparece a continuación." },
      ]},
      { title: "10. USUARIOS INTERNACIONALES", blocks: [
        { type: "p", text: "Cortexa puede utilizar proveedores de servicios e infraestructura ubicados en diferentes jurisdicciones. Como resultado, la información puede transferirse o procesarse en países fuera de su país de residencia, sujeto a los requisitos legales aplicables." },
      ]},
      { title: "11. CAMBIOS EN ESTA POLÍTICA", blocks: [
        { type: "p", text: "Podemos actualizar esta Política de Privacidad periódicamente." },
        { type: "p", text: "Cuando sea necesario, proporcionaremos un aviso apropiado de cambios materiales. El uso continuado de los Servicios después de que una política actualizada entre en vigor constituye aceptación en la medida permitida por la legislación aplicable." },
      ]},
      { title: "12. CONTACTO", blocks: [
        { type: "p", text: "Correo electrónico de soporte: support@cortexaaicrm.com" },
        { type: "p", text: "Nombre legal de la empresa: Listo Qasa S.A.S." },
        { type: "p", text: "Nombre comercial / Marca: CORTEXA Agentic AI Revenue OS" },
        { type: "p", text: "RUC: 1793234655001" },
        { type: "p", text: "País de registro: Ecuador" },
      ]},
    ],
  },

  pt: {
    title: "POLÍTICA DE PRIVACIDADE",
    effectiveDate: "Data de vigência: 22 de abril de 2026",
    intro1:
      'Esta Política de Privacidade explica como o CORTEXA AI Revenue OS ("Cortexa", "nós", "nosso", "nos"), operado pela Listo Qasa S.A.S., coleta, utiliza e protege suas informações quando você usa nossa plataforma e serviços ("Serviços").',
    intro2: "Ao utilizar o CORTEXA AI Revenue OS, você concorda com esta Política de Privacidade.",
    sections: [
      { title: "1. INFORMAÇÕES QUE COLETAMOS", blocks: [
        { type: "p", text: "Podemos coletar as seguintes categorias de informações:" },
        { type: "h4", text: "A. Informações Pessoais" },
        { type: "ul", items: ["Nome", "Endereço de e-mail", "Número de telefone (se fornecido)", "Dados de cobrança e pagamento (processados por provedores terceiros)"] },
        { type: "h4", text: "B. Dados Empresariais e de CRM" },
        { type: "ul", items: ["Leads, contatos e dados de clientes inseridos na plataforma", "Mensagens, observações e atividades dentro do espaço de trabalho do CRM"] },
        { type: "h4", text: "C. Dados Técnicos e de Uso" },
        { type: "ul", items: ["Endereço IP", "Tipo de navegador e informações do dispositivo", "Páginas visitadas, ações realizadas e comportamento de uso", "Dados de registro e métricas de desempenho"] },
      ]},
      { title: "2. COMO UTILIZAMOS SUAS INFORMAÇÕES", blocks: [
        { type: "p", text: "Utilizamos suas informações para:" },
        { type: "ul", items: ["Fornecer, operar e manter os Serviços", "Processar pagamentos e gerenciar assinaturas", "Automatizar fluxos de trabalho e funcionalidades de CRM", "Melhorar desempenho, recursos e experiência do usuário", "Comunicar-nos com você sobre suporte, atualizações e notificações", "Responder a solicitações de suporte, inclusive com assistência de IA", "Monitorar fraude, abuso ou riscos de segurança", "Cumprir obrigações legais"] },
      ]},
      { title: "3. PROPRIEDADE E CONTROLE DOS DADOS", blocks: [
        { type: "p", text: "Você mantém a propriedade de todos os dados inseridos no Cortexa." },
        { type: "p", text: "O Cortexa NÃO vende seus dados pessoais ou empresariais." },
        { type: "p", text: "Processamos seus dados apenas conforme necessário para fornecer, operar, proteger e melhorar nossos Serviços." },
        { type: "p", text: "Você é responsável por garantir que os dados fornecidos ao Cortexa:" },
        { type: "ul", items: ["Sejam coletados legalmente", "Sejam processados legalmente", "Estejam em conformidade com as leis aplicáveis de privacidade e proteção de dados"] },
      ]},
      { title: "4. COMPARTILHAMENTO DE DADOS", blocks: [
        { type: "p", text: "Podemos compartilhar informações somente quando necessário com:" },
        { type: "ul", items: ["Processadores de pagamento", "Provedores de hospedagem em nuvem e infraestrutura", "Provedores de IA e tecnologia que apoiam a funcionalidade da plataforma", "Provedores de comunicação e integração", "Autoridades legais quando exigido por lei ou necessário para proteger direitos legais"] },
        { type: "p", text: "NÃO vendemos, alugamos ou comercializamos seus dados." },
      ]},
      { title: "5. INTEGRAÇÕES DE TERCEIROS", blocks: [
        { type: "p", text: "O Cortexa pode integrar-se a serviços de terceiros, incluindo plataformas de mensagens, serviços de e-mail, provedores de IA, provedores de pagamento e ferramentas de automação." },
        { type: "p", text: "Quando você conecta serviços de terceiros:" },
        { type: "ul", items: ["Você nos autoriza a trocar dados com esses serviços conforme necessário para fornecer a funcionalidade solicitada", "As respectivas políticas de privacidade e termos também podem ser aplicáveis", "O Cortexa não é responsável pelas práticas independentes de dados de terceiros"] },
      ]},
      { title: "6. SEGURANÇA DOS DADOS", blocks: [
        { type: "p", text: "Implementamos medidas administrativas, técnicas e de segurança razoáveis destinadas a proteger seus dados." },
        { type: "p", text: "No entanto:" },
        { type: "ul", items: ["Nenhum sistema pode garantir 100% de segurança", "Você é responsável por manter a segurança das credenciais da sua conta"] },
      ]},
      { title: "7. RETENÇÃO DE DADOS", blocks: [
        { type: "p", text: "Mantemos os dados apenas pelo tempo razoavelmente necessário para:" },
        { type: "ul", items: ["Fornecer nossos Serviços", "Manter sua conta", "Cumprir obrigações legais", "Resolver disputas", "Fazer cumprir acordos"] },
        { type: "p", text: "Podemos excluir ou anonimizar dados quando eles não forem mais necessários." },
      ]},
      { title: "8. COOKIES E TECNOLOGIAS DE RASTREAMENTO", blocks: [
        { type: "p", text: "Utilizamos cookies e tecnologias semelhantes para:" },
        { type: "ul", items: ["Melhorar funcionalidade e desempenho", "Analisar uso e comportamento", "Apoiar marketing e publicidade, incluindo rastreamento do Google Ads"] },
        { type: "p", text: "Você pode gerenciar as preferências de cookies por meio das configurações do navegador e de quaisquer controles de consentimento fornecidos pelo Cortexa, quando aplicável." },
      ]},
      { title: "9. SEUS DIREITOS", blocks: [
        { type: "p", text: "Dependendo da sua localização e da legislação aplicável, você pode ter direito a:" },
        { type: "ul", items: ["Acessar seus dados pessoais", "Corrigir dados pessoais incorretos", "Solicitar exclusão", "Restringir ou se opor a determinados tratamentos", "Solicitar portabilidade dos dados"] },
        { type: "p", text: "Para exercer os direitos aplicáveis, entre em contato conosco usando as informações abaixo." },
      ]},
      { title: "10. USUÁRIOS INTERNACIONAIS", blocks: [
        { type: "p", text: "O Cortexa pode utilizar provedores de serviços e infraestrutura localizados em diferentes jurisdições. Como resultado, as informações podem ser transferidas ou processadas em países fora do seu país de residência, sujeitas aos requisitos legais aplicáveis." },
      ]},
      { title: "11. ALTERAÇÕES NESTA POLÍTICA", blocks: [
        { type: "p", text: "Podemos atualizar esta Política de Privacidade periodicamente." },
        { type: "p", text: "Quando exigido, forneceremos aviso adequado sobre alterações materiais. O uso contínuo dos Serviços após a entrada em vigor de uma política atualizada constitui aceitação na medida permitida pela legislação aplicável." },
      ]},
      { title: "12. CONTATO", blocks: [
        { type: "p", text: "E-mail de suporte: support@cortexaaicrm.com" },
        { type: "p", text: "Nome jurídico da empresa: Listo Qasa S.A.S." },
        { type: "p", text: "Nome comercial / Marca: CORTEXA Agentic AI Revenue OS" },
        { type: "p", text: "RUC: 1793234655001" },
        { type: "p", text: "País de registro: Equador" },
      ]},
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
    fontWeight: 700,
    color: "#111827",
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