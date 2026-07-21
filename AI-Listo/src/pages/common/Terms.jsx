import React, { useEffect, useState } from "react";

const t = {
  en: {
    title: "Terms of Service",
    effectiveDate: "Effective Date: April 22, 2026",
    intro:
      'These Terms of Service ("Terms") govern your access to and use of CORTEXA AI Revenue OS ("CORTEXA", "we", "our", or "us"). By accessing, using, or subscribing to the platform, you agree to be bound by these Terms.',
    sections: [
      {
        title: "Eligibility",
        paragraphs: ["You must:"],
        lists: [[
          "Be at least 18 years old.",
          "Operate a legitimate business, professional service, or organization.",
          "Have the legal authority to enter into this agreement.",
        ]],
        after: ["You may not use CORTEXA AI Revenue OS for illegal, fraudulent, abusive, deceptive, or prohibited activities."],
      },
      {
        title: "Services",
        paragraphs: ["CORTEXA AI Revenue OS provides business automation and customer management tools, including but not limited to:"],
        lists: [[
          "CRM functionality", "Lead management", "Pipeline management",
          "AI-powered assistance", "WhatsApp automation", "Contact management",
          "Team collaboration tools", "Analytics and reporting",
          "Workflow automation", "Appointment booking",
          "Integrations with third-party services",
        ]],
        after: ["We may modify, improve, suspend, or discontinue features at any time."],
      },
      {
        title: "Account Responsibility",
        paragraphs: ["You are responsible for:"],
        lists: [[
          "Maintaining the security of your account.",
          "All activities that occur under your account.",
          "Providing accurate and current information.",
          "Maintaining access credentials securely.",
        ]],
        after: ["We may suspend or terminate accounts involved in suspicious, abusive, fraudulent, or prohibited activity."],
      },
      {
        title: "Acceptable Use",
        paragraphs: ["You agree NOT to:"],
        lists: [[
          "Engage in fraud or illegal activity.",
          "Send spam or unauthorized messages.",
          "Violate privacy or data protection laws.",
          "Misrepresent yourself or your business.",
          "Harass, abuse, or deceive users.",
          "Attempt to gain unauthorized access to systems.",
          "Reverse engineer, exploit, or disrupt the platform.",
        ]],
        after: ["Violation of these Terms may result in immediate suspension or termination."],
      },
      {
        title: "Free Trial, Setup Fee & Billing",
        groups: [
          { heading: "Free Trial", text: "CORTEXA AI Revenue OS offers a free trial to new users. No payment is collected to start the trial, no card or payment method is required, and the trial does not automatically convert to a paid plan." },
          { heading: "Setup Fee", text: "A one-time setup and activation fee of $97 USD applies only if and when you choose to activate a paid subscription. It is not charged during the free trial. The setup fee covers onboarding, account provisioning, platform configuration, and activation services." },
          { heading: "Subscription Plans", text: "Solo: $197 USD/month for 1 user. Team: $347 USD/month for up to 3 users. Growth: $497 USD/month for up to 5 users. All plans include access to the same core platform features." },
          { heading: "Feature Access", text: "Plan differences are based primarily on included users, team size, supported business scale, platform capacity, and usage requirements. Core functionality is not restricted solely by plan tier." },
          { heading: "Additional Users", text: "Customers may add additional users to any plan for $97 USD per user per month." },
          { heading: "Pricing Changes", text: "Pricing may be updated from time to time. Existing customers will receive notice of material pricing changes where required by law." },
          { heading: "How Billing Works", text: "The free trial collects no payment and stores no payment method. It does not automatically convert to a paid plan. To subscribe, you must actively choose a plan, add a payment method, and confirm the purchase. Billing continues until cancellation." },
        ],
      },
      {
        title: "AI Fair Usage Policy",
        paragraphs: ["CORTEXA AI Revenue OS includes AI-powered functionality as part of your subscription. Normal business usage is included."],
        lists: [[
          "AI usage may be subject to reasonable fair-use limits.",
          "Unusually high workloads or enterprise-scale processing may require a higher-tier plan or additional AI capacity.",
          "Customers will be notified before usage-related upgrade requirements are implemented.",
        ]],
        after: ["Standard subscriptions do not use customer-facing AI credit systems."],
      },
      {
        title: "Contact Database Usage",
        paragraphs: [
          "CORTEXA AI Revenue OS does not charge solely based on the number of contacts stored.",
          "Customers may manage contacts within plan limits without per-contact billing fees.",
          "Reasonable storage and platform limits may apply to ensure performance and reliability.",
        ],
      },
      {
        title: "Third-Party Services",
        paragraphs: ["CORTEXA may integrate with third-party providers such as WhatsApp, Google, Microsoft, email providers, CRM platforms, automation platforms, and payment processors."],
        lists: [[
          "Third-party outages", "Third-party pricing", "Third-party policies",
          "Third-party performance", "Third-party data handling practices",
        ]],
        after: ["Your use of third-party services remains subject to their respective terms and policies."],
      },
      {
        title: "Cancellation & Refund Policy",
        paragraphs: [
          "You may cancel your subscription at any time.",
          "Cancellation prevents future billing but does not retroactively refund charges already processed.",
        ],
        groups: [{ heading: "Non-Refundable Fees", text: "Setup and activation fees, subscription fees already billed, completed onboarding services, and professional services already delivered are generally non-refundable. Refunds may be provided where required by law." }],
      },
      {
        title: "User Data & Responsibility",
        paragraphs: [
          "You retain ownership of your data.",
          "CORTEXA processes customer data solely to provide platform functionality and services.",
        ],
        lists: [[
          "Data must be lawfully obtained.", "Data must be lawfully processed.",
          "Data must comply with applicable regulations.",
          "Data must not infringe the rights of others.",
        ]],
        after: ["We do not sell customer data."],
      },
      {
        title: "Intellectual Property",
        paragraphs: ["All software, content, branding, platform designs, functionality, workflows, and technology associated with CORTEXA remain its exclusive property."],
        lists: [["Copy", "Reproduce", "Distribute", "Modify", "Resell", "Reverse engineer", "Create derivative works"]],
        after: ["These actions are prohibited without prior written authorization."],
      },
      {
        title: "Service Availability",
        paragraphs: ["While we strive for reliable service, we do not guarantee uninterrupted or error-free availability."],
        lists: [["Maintenance", "Updates", "Infrastructure issues", "Third-party outages", "Security events", "Events beyond our reasonable control"]],
      },
      {
        title: "Limitation of Liability",
        paragraphs: ["To the maximum extent permitted by law, CORTEXA shall not be liable for:"],
        lists: [["Lost profits", "Lost revenue", "Lost business opportunities", "Loss of data", "Business interruption", "Indirect damages", "Consequential damages", "Special or incidental damages"]],
        after: ["Our total liability shall not exceed the amount paid by you during the preceding twelve (12) months."],
      },
      {
        title: "Indemnification",
        paragraphs: ["You agree to defend, indemnify, and hold harmless CORTEXA, its owners, employees, contractors, and affiliates from claims arising from:"],
        lists: [["Your use of the platform", "Your content or data", "Violations of these Terms", "Violations of applicable laws"]],
      },
      {
        title: "Termination",
        paragraphs: ["We may suspend or terminate accounts for:"],
        lists: [["Violation of these Terms", "Fraudulent activity", "Abuse of the platform", "Security concerns", "Legal or regulatory requirements", "Non-payment"]],
        after: ["Termination may occur with or without notice where legally permitted."],
      },
      {
        title: "Changes to Terms",
        paragraphs: ["We may update these Terms periodically. Continued use of the platform after updates become effective constitutes acceptance of the revised Terms."],
      },
      {
        title: "Governing Law",
        paragraphs: ["These Terms shall be governed by the laws applicable to the jurisdiction in which CORTEXA AI Revenue OS operates, without regard to conflict of law principles."],
      },
      {
        title: "Contact Information",
        contacts: [
          ["Support Email", "support@cortexaaicrm.com"],
          ["Platform", "CORTEXA AI Revenue OS"],
          ["Legal Business Name", "Listo Qasa S.A."],
          ["Trade Name / Brand", "CORTEXA Agentic AI Revenue OS"],
          ["RUC", "1793234655001"],
          ["Country of Registration", "Ecuador"],
        ],
        after: ["For questions regarding these Terms, billing, platform usage, or legal matters, contact support@cortexaaicrm.com."],
      },
    ],
  },

  es: {
    title: "Términos de Servicio",
    effectiveDate: "Fecha de entrada en vigor: 22 de abril de 2026",
    intro: 'Estos Términos de Servicio ("Términos") regulan su acceso y uso de CORTEXA AI Revenue OS ("CORTEXA", "nosotros" o "nuestro"). Al acceder, utilizar o suscribirse a la plataforma, usted acepta estos Términos.',
    sections: [
      { title: "Elegibilidad", paragraphs: ["Usted debe:"], lists: [["Tener al menos 18 años.", "Operar un negocio, servicio profesional u organización legítima.", "Tener autoridad legal para celebrar este acuerdo."]], after: ["No puede utilizar CORTEXA para actividades ilegales, fraudulentas, abusivas, engañosas o prohibidas."] },
      { title: "Servicios", paragraphs: ["CORTEXA proporciona herramientas de automatización empresarial y gestión de clientes, entre ellas:"], lists: [["Funcionalidad de CRM", "Gestión de prospectos", "Gestión de pipeline", "Asistencia con IA", "Automatización de WhatsApp", "Gestión de contactos", "Colaboración en equipo", "Analítica e informes", "Automatización de flujos", "Reserva de citas", "Integraciones con terceros"]], after: ["Podemos modificar, mejorar, suspender o discontinuar funciones en cualquier momento."] },
      { title: "Responsabilidad de la Cuenta", paragraphs: ["Usted es responsable de:"], lists: [["Mantener la seguridad de su cuenta.", "Todas las actividades realizadas desde su cuenta.", "Proporcionar información precisa y actualizada.", "Mantener seguras sus credenciales."]], after: ["Podemos suspender o cancelar cuentas relacionadas con actividades sospechosas, abusivas, fraudulentas o prohibidas."] },
      { title: "Uso Aceptable", paragraphs: ["Usted acepta NO:"], lists: [["Participar en fraude o actividades ilegales.", "Enviar spam o mensajes no autorizados.", "Infringir leyes de privacidad o protección de datos.", "Falsear su identidad o empresa.", "Acosar, abusar o engañar a usuarios.", "Intentar acceder sin autorización a sistemas.", "Realizar ingeniería inversa, explotar o interrumpir la plataforma."]], after: ["El incumplimiento puede provocar la suspensión o cancelación inmediata."] },
      { title: "Prueba Gratuita, Configuración y Facturación", groups: [
        { heading: "Prueba Gratuita", text: "No se cobra ningún pago para iniciar la prueba, no se requiere tarjeta y la prueba no se convierte automáticamente en un plan de pago." },
        { heading: "Tarifa de Configuración", text: "Se aplica una tarifa única de $97 USD únicamente cuando usted activa una suscripción de pago. Cubre incorporación, aprovisionamiento, configuración y activación." },
        { heading: "Planes", text: "Solo: $197 USD/mes para 1 usuario. Team: $347 USD/mes para hasta 3 usuarios. Growth: $497 USD/mes para hasta 5 usuarios. Todos incluyen las funciones principales." },
        { heading: "Acceso a Funciones", text: "Las diferencias se basan principalmente en usuarios, tamaño del equipo, escala, capacidad y uso. Las funciones principales no se restringen únicamente por nivel." },
        { heading: "Usuarios Adicionales", text: "$97 USD por usuario al mes." },
        { heading: "Cambios de Precios", text: "Los precios pueden actualizarse. Los clientes existentes recibirán aviso cuando la ley lo exija." },
        { heading: "Cómo Funciona la Facturación", text: "La prueba no cobra ni almacena un método de pago. Para suscribirse, debe elegir un plan, agregar un método de pago y confirmar la compra. La facturación continúa hasta la cancelación." },
      ] },
      { title: "Política de Uso Justo de IA", paragraphs: ["Las funciones de IA están incluidas para un uso empresarial normal."], lists: [["Pueden aplicarse límites razonables de uso justo.", "Las cargas inusualmente altas pueden requerir un plan superior o capacidad adicional.", "Los clientes recibirán aviso antes de aplicar requisitos de actualización."]], after: ["Las suscripciones estándar no utilizan créditos de IA orientados al cliente."] },
      { title: "Uso de la Base de Datos de Contactos", paragraphs: ["CORTEXA no cobra únicamente por la cantidad de contactos almacenados.", "Los contactos pueden gestionarse dentro de los límites del plan sin cargos por contacto.", "Pueden aplicarse límites razonables para garantizar el rendimiento."] },
      { title: "Servicios de Terceros", paragraphs: ["CORTEXA puede integrarse con WhatsApp, Google, Microsoft, proveedores de correo, CRM, automatización y procesadores de pago."], lists: [["Interrupciones de terceros", "Precios de terceros", "Políticas de terceros", "Rendimiento de terceros", "Tratamiento de datos de terceros"]], after: ["El uso de servicios externos está sujeto a sus propios términos y políticas."] },
      { title: "Cancelación y Reembolsos", paragraphs: ["Puede cancelar en cualquier momento.", "La cancelación evita futuros cobros, pero no reembolsa cargos ya procesados."], groups: [{ heading: "Tarifas No Reembolsables", text: "Las tarifas de configuración, suscripciones ya facturadas, incorporación completada y servicios ya prestados generalmente no son reembolsables, salvo obligación legal." }] },
      { title: "Datos del Usuario y Responsabilidad", paragraphs: ["Usted conserva la propiedad de sus datos.", "CORTEXA procesa los datos solo para prestar sus servicios."], lists: [["Los datos deben obtenerse legalmente.", "Deben procesarse legalmente.", "Deben cumplir la normativa aplicable.", "No deben infringir derechos de terceros."]], after: ["No vendemos datos de clientes."] },
      { title: "Propiedad Intelectual", paragraphs: ["Todo el software, contenido, marca, diseños, funcionalidad, flujos y tecnología de CORTEXA son propiedad exclusiva de CORTEXA."], lists: [["Copiar", "Reproducir", "Distribuir", "Modificar", "Revender", "Realizar ingeniería inversa", "Crear obras derivadas"]], after: ["Estas acciones requieren autorización previa por escrito."] },
      { title: "Disponibilidad del Servicio", paragraphs: ["No garantizamos disponibilidad ininterrumpida ni libre de errores."], lists: [["Mantenimiento", "Actualizaciones", "Problemas de infraestructura", "Interrupciones de terceros", "Eventos de seguridad", "Eventos fuera de nuestro control"]] },
      { title: "Limitación de Responsabilidad", paragraphs: ["En la máxima medida permitida por la ley, CORTEXA no será responsable de:"], lists: [["Pérdida de beneficios", "Pérdida de ingresos", "Pérdida de oportunidades", "Pérdida de datos", "Interrupción del negocio", "Daños indirectos", "Daños consecuentes", "Daños especiales o incidentales"]], after: ["Nuestra responsabilidad total no excederá el importe pagado durante los doce (12) meses anteriores."] },
      { title: "Indemnización", paragraphs: ["Usted acepta indemnizar a CORTEXA y sus propietarios, empleados, contratistas y afiliados por reclamaciones derivadas de:"], lists: [["Su uso de la plataforma", "Su contenido o datos", "Incumplimiento de estos Términos", "Incumplimiento de las leyes aplicables"]] },
      { title: "Terminación", paragraphs: ["Podemos suspender o cancelar cuentas por:"], lists: [["Incumplimiento de estos Términos", "Actividad fraudulenta", "Abuso de la plataforma", "Problemas de seguridad", "Requisitos legales o regulatorios", "Falta de pago"]], after: ["La terminación puede producirse con o sin aviso cuando la ley lo permita."] },
      { title: "Cambios en los Términos", paragraphs: ["Podemos actualizar estos Términos. El uso continuado después de su entrada en vigor constituye aceptación."] },
      { title: "Legislación Aplicable", paragraphs: ["Estos Términos se regirán por las leyes aplicables en la jurisdicción donde opera CORTEXA, sin considerar principios de conflicto de leyes."] },
      { title: "Información de Contacto", contacts: [["Correo de soporte", "support@cortexaaicrm.com"], ["Plataforma", "CORTEXA AI Revenue OS"], ["Nombre legal", "Listo Qasa S.A."], ["Marca", "CORTEXA Agentic AI Revenue OS"], ["RUC", "1793234655001"], ["País de registro", "Ecuador"]], after: ["Para consultas sobre estos Términos, facturación, uso o asuntos legales, escriba a support@cortexaaicrm.com."] },
    ],
  },

  pt: {
    title: "Termos de Serviço",
    effectiveDate: "Data de vigência: 22 de abril de 2026",
    intro: 'Estes Termos de Serviço ("Termos") regem seu acesso e uso do CORTEXA AI Revenue OS ("CORTEXA", "nós" ou "nosso"). Ao acessar, utilizar ou assinar a plataforma, você concorda com estes Termos.',
    sections: [
      { title: "Elegibilidade", paragraphs: ["Você deve:"], lists: [["Ter pelo menos 18 anos.", "Operar um negócio, serviço profissional ou organização legítima.", "Ter autoridade legal para celebrar este acordo."]], after: ["Você não pode utilizar o CORTEXA para atividades ilegais, fraudulentas, abusivas, enganosas ou proibidas."] },
      { title: "Serviços", paragraphs: ["O CORTEXA fornece ferramentas de automação empresarial e gestão de clientes, incluindo:"], lists: [["Funcionalidade de CRM", "Gestão de leads", "Gestão de pipeline", "Assistência com IA", "Automação do WhatsApp", "Gestão de contatos", "Colaboração em equipe", "Análises e relatórios", "Automação de fluxos", "Agendamento de compromissos", "Integrações com terceiros"]], after: ["Podemos modificar, melhorar, suspender ou descontinuar recursos a qualquer momento."] },
      { title: "Responsabilidade da Conta", paragraphs: ["Você é responsável por:"], lists: [["Manter a segurança da sua conta.", "Todas as atividades realizadas na conta.", "Fornecer informações precisas e atualizadas.", "Manter suas credenciais seguras."]], after: ["Podemos suspender ou encerrar contas ligadas a atividades suspeitas, abusivas, fraudulentas ou proibidas."] },
      { title: "Uso Aceitável", paragraphs: ["Você concorda em NÃO:"], lists: [["Praticar fraude ou atividade ilegal.", "Enviar spam ou mensagens não autorizadas.", "Violar leis de privacidade ou proteção de dados.", "Deturpar sua identidade ou empresa.", "Assediar, abusar ou enganar usuários.", "Tentar acessar sistemas sem autorização.", "Realizar engenharia reversa, explorar ou interromper a plataforma."]], after: ["A violação pode resultar em suspensão ou encerramento imediato."] },
      { title: "Teste Gratuito, Configuração e Cobrança", groups: [
        { heading: "Teste Gratuito", text: "Nenhum pagamento é cobrado para iniciar o teste, nenhum cartão é exigido e o teste não é convertido automaticamente em plano pago." },
        { heading: "Taxa de Configuração", text: "Uma taxa única de $97 USD aplica-se apenas quando você ativa uma assinatura paga. Ela cobre onboarding, provisionamento, configuração e ativação." },
        { heading: "Planos", text: "Solo: $197 USD/mês para 1 usuário. Team: $347 USD/mês para até 3 usuários. Growth: $497 USD/mês para até 5 usuários. Todos incluem os principais recursos." },
        { heading: "Acesso aos Recursos", text: "As diferenças baseiam-se principalmente em usuários, tamanho da equipe, escala, capacidade e uso. Os recursos principais não são limitados apenas pelo nível do plano." },
        { heading: "Usuários Adicionais", text: "$97 USD por usuário por mês." },
        { heading: "Alterações de Preços", text: "Os preços podem ser atualizados. Clientes existentes receberão aviso quando exigido por lei." },
        { heading: "Como Funciona a Cobrança", text: "O teste não cobra nem armazena um método de pagamento. Para assinar, você deve escolher um plano, adicionar um método de pagamento e confirmar a compra. A cobrança continua até o cancelamento." },
      ] },
      { title: "Política de Uso Justo de IA", paragraphs: ["As funções de IA estão incluídas para uso empresarial normal."], lists: [["Podem ser aplicados limites razoáveis de uso justo.", "Cargas muito altas podem exigir plano superior ou capacidade adicional.", "Os clientes serão avisados antes de requisitos de upgrade."]], after: ["As assinaturas padrão não utilizam créditos de IA voltados ao cliente."] },
      { title: "Uso do Banco de Dados de Contatos", paragraphs: ["O CORTEXA não cobra apenas pela quantidade de contatos armazenados.", "Os contatos podem ser gerenciados dentro dos limites do plano sem cobrança por contato.", "Limites razoáveis podem ser aplicados para garantir desempenho."] },
      { title: "Serviços de Terceiros", paragraphs: ["O CORTEXA pode integrar-se ao WhatsApp, Google, Microsoft, provedores de e-mail, CRM, automação e processadores de pagamento."], lists: [["Indisponibilidade de terceiros", "Preços de terceiros", "Políticas de terceiros", "Desempenho de terceiros", "Tratamento de dados de terceiros"]], after: ["O uso de serviços externos está sujeito aos respectivos termos e políticas."] },
      { title: "Cancelamento e Reembolsos", paragraphs: ["Você pode cancelar a qualquer momento.", "O cancelamento impede cobranças futuras, mas não reembolsa cobranças já processadas."], groups: [{ heading: "Taxas Não Reembolsáveis", text: "Taxas de configuração, assinaturas já cobradas, onboarding concluído e serviços já prestados geralmente não são reembolsáveis, salvo exigência legal." }] },
      { title: "Dados do Usuário e Responsabilidade", paragraphs: ["Você mantém a propriedade dos seus dados.", "O CORTEXA processa dados apenas para prestar seus serviços."], lists: [["Os dados devem ser obtidos legalmente.", "Devem ser processados legalmente.", "Devem cumprir as normas aplicáveis.", "Não devem infringir direitos de terceiros."]], after: ["Não vendemos dados de clientes."] },
      { title: "Propriedade Intelectual", paragraphs: ["Todo software, conteúdo, marca, design, funcionalidade, fluxos e tecnologia do CORTEXA são propriedade exclusiva do CORTEXA."], lists: [["Copiar", "Reproduzir", "Distribuir", "Modificar", "Revender", "Realizar engenharia reversa", "Criar obras derivadas"]], after: ["Essas ações exigem autorização prévia por escrito."] },
      { title: "Disponibilidade do Serviço", paragraphs: ["Não garantimos disponibilidade ininterrupta ou livre de erros."], lists: [["Manutenção", "Atualizações", "Problemas de infraestrutura", "Indisponibilidade de terceiros", "Eventos de segurança", "Eventos fora do nosso controle"]] },
      { title: "Limitação de Responsabilidade", paragraphs: ["Na máxima extensão permitida por lei, o CORTEXA não será responsável por:"], lists: [["Perda de lucros", "Perda de receita", "Perda de oportunidades", "Perda de dados", "Interrupção dos negócios", "Danos indiretos", "Danos consequenciais", "Danos especiais ou incidentais"]], after: ["Nossa responsabilidade total não excederá o valor pago durante os doze (12) meses anteriores."] },
      { title: "Indenização", paragraphs: ["Você concorda em indenizar o CORTEXA e seus proprietários, funcionários, contratados e afiliados por reclamações decorrentes de:"], lists: [["Seu uso da plataforma", "Seu conteúdo ou dados", "Violações destes Termos", "Violações das leis aplicáveis"]] },
      { title: "Encerramento", paragraphs: ["Podemos suspender ou encerrar contas por:"], lists: [["Violação destes Termos", "Atividade fraudulenta", "Abuso da plataforma", "Preocupações de segurança", "Requisitos legais ou regulatórios", "Falta de pagamento"]], after: ["O encerramento pode ocorrer com ou sem aviso quando permitido por lei."] },
      { title: "Alterações nos Termos", paragraphs: ["Podemos atualizar estes Termos. O uso contínuo após sua entrada em vigor constitui aceitação."] },
      { title: "Lei Aplicável", paragraphs: ["Estes Termos serão regidos pelas leis aplicáveis na jurisdição onde o CORTEXA opera, sem considerar princípios de conflito de leis."] },
      { title: "Informações de Contato", contacts: [["E-mail de suporte", "support@cortexaaicrm.com"], ["Plataforma", "CORTEXA AI Revenue OS"], ["Razão social", "Listo Qasa S.A."], ["Marca", "CORTEXA Agentic AI Revenue OS"], ["RUC", "1793234655001"], ["País de registro", "Equador"]], after: ["Para dúvidas sobre estes Termos, cobrança, uso ou assuntos jurídicos, escreva para support@cortexaaicrm.com."] },
    ],
  },
};

function Section({ section }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>{section.title}</h2>

      {(section.paragraphs || []).map((text, index) => (
        <p key={`p-${index}`}>{text}</p>
      ))}

      {(section.groups || []).map((group, index) => (
        <div key={`group-${index}`}>
          <p style={styles.groupTitle}><strong>{group.heading}</strong></p>
          <p>{group.text}</p>
        </div>
      ))}

      {(section.lists || []).map((items, listIndex) => (
        <ul key={`list-${listIndex}`} style={styles.ul}>
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{item}</li>
          ))}
        </ul>
      ))}

      {(section.contacts || []).map(([label, value]) => (
        <p key={label}><strong>{label}:</strong> {value}</p>
      ))}

      {(section.after || []).map((text, index) => (
        <p key={`after-${index}`}>{text}</p>
      ))}
    </section>
  );
}

export default function Terms() {
  const [lang] = useState(
    () => localStorage.getItem("cortexa_lang") || "en",
  );

  const tr = t[lang] || t.en;

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [lang]);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>{tr.title}</h1>
        <p style={styles.effectiveDate}>{tr.effectiveDate}</p>
        <p>{tr.intro}</p>

        {tr.sections.map((section) => (
          <Section key={section.title} section={section} />
        ))}
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#ffffff",
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "40px 20px 64px",
    fontFamily: "Arial, sans-serif",
    lineHeight: "1.6",
    color: "#333",
  },
  title: {
    fontSize: "36px",
    margin: "0 0 10px",
  },
  effectiveDate: {
    color: "#777",
    marginBottom: "20px",
  },
  section: {
    marginTop: "30px",
    textAlign: "left",
  },
  sectionTitle: {
    fontSize: "22px",
    marginBottom: "10px",
  },
  groupTitle: {
    marginBottom: "4px",
  },
  ul: {
    paddingLeft: "24px",
    marginTop: "8px",
    marginBottom: "12px",
  },
};