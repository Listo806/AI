import React, { useEffect, useState } from "react";

const t = {
  en: {
    title: "TERMS OF SERVICE",
    effectiveDate: "Effective Date: April 22, 2026",
    intro:
      'These Terms of Service ("Terms") govern your access to and use of CORTEXA AI Revenue OS ("CORTEXA", "we", "our", or "us"), operated by Listo Qasa S.A.S. By accessing, using, or subscribing to the platform, you agree to be bound by these Terms.',
    sections: [
      {
        title: "1. ELIGIBILITY",
        paragraphs: ["You must:"],
        lists: [[
          "Be at least 18 years old.",
          "Operate a legitimate business, professional service, or organization.",
          "Have the legal authority to enter into this agreement.",
        ]],
        after: ["You may not use CORTEXA AI Revenue OS for illegal, fraudulent, abusive, deceptive, or prohibited activities."],
      },
      {
        title: "2. SERVICES",
        paragraphs: ["CORTEXA AI Revenue OS provides business automation and customer management tools, including but not limited to:"],
        lists: [[
          "CRM functionality",
          "Lead management",
          "Pipeline management",
          "AI-powered assistance",
          "WhatsApp automation",
          "Contact management",
          "Team collaboration tools",
          "Analytics and reporting",
          "Workflow automation",
          "Appointment booking",
          "Integrations with third-party services",
        ]],
        after: ["We may modify, improve, suspend, or discontinue features at any time."],
      },
      {
        title: "3. ACCOUNT RESPONSIBILITY",
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
        title: "4. ACCEPTABLE USE",
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
        title: "5. FREE TRIAL, SETUP FEE & BILLING",
        groups: [
          {
            heading: "Free Trial",
            text: "CORTEXA AI Revenue OS includes a 14-day free trial that begins after you complete signup and any applicable activation requirements. Your monthly plan is not billed during the 14-day trial.",
          },
          {
            heading: "Setup Fee",
            text: "Where applicable, a one-time setup and activation fee may be charged at signup before the trial begins. Any applicable setup fee, price, and payment terms will be clearly displayed before purchase.",
          },
          {
            heading: "Subscription Plans",
            text: "Available subscription plans, pricing, included users, features, and applicable limits are displayed on the Cortexa website or during checkout.",
          },
          {
            heading: "Pricing Changes",
            text: "Pricing may be updated from time to time. Existing customers will receive notice of material pricing changes where required by applicable law.",
          },
          {
            heading: "Additional Users",
            text: "Additional users may be available for an additional recurring charge as displayed at the time of purchase.",
          },
          {
            heading: "How Billing Works",
            text: "Where a paid subscription is selected, billing information and recurring subscription terms will be clearly displayed before checkout. Subscriptions renew according to the billing cycle selected unless canceled in accordance with these Terms and our Refund Policy.",
          },
        ],
      },
      {
        title: "6. AI FAIR USAGE POLICY",
        paragraphs: [
          "CORTEXA AI Revenue OS includes AI-powered functionality.",
          "AI usage may be subject to reasonable fair-use limits.",
          "Unusually high workloads or enterprise-scale processing may require a higher-tier plan or additional AI capacity.",
          "Customers will be notified before usage-related upgrade requirements are implemented where applicable.",
        ],
      },
      {
        title: "7. CONTACT DATABASE USAGE",
        paragraphs: [
          "CORTEXA AI Revenue OS does not charge solely based on the number of contacts stored unless otherwise stated for a particular product or plan.",
          "Reasonable storage, usage, and platform limits may apply to ensure performance and reliability.",
        ],
      },
      {
        title: "8. THIRD-PARTY SERVICES",
        paragraphs: ["CORTEXA may integrate with third-party providers such as WhatsApp, Google, Microsoft, email providers, AI providers, automation platforms, and payment processors.", "CORTEXA is not responsible for:"],
        lists: [[
          "Third-party outages",
          "Third-party pricing",
          "Third-party policies",
          "Third-party performance",
          "Independent third-party data handling practices",
        ]],
        after: ["Your use of third-party services remains subject to their respective terms and policies."],
      },
      {
        title: "9. CANCELLATION & REFUND POLICY",
        paragraphs: [
          "Customers may cancel subscriptions in accordance with the cancellation terms applicable to their purchase.",
          "Cancellation prevents future renewals after the applicable cancellation becomes effective.",
          "Refunds and cancellation rights are governed by our separate Refund Policy, applicable law, and, where Paddle processes the transaction as Merchant of Record, the applicable Paddle checkout and buyer terms.",
        ],
        groups: [{
          heading: "IMPORTANT FOR DEVELOPER:",
          text: "This section must be kept consistent with the dedicated Refund Policy page. The final Refund Policy language will be supplied separately before Paddle verification is completed.",
        }],
      },
      {
        title: "10. USER DATA & RESPONSIBILITY",
        paragraphs: [
          "You retain ownership of your data.",
          "CORTEXA processes customer data to provide platform functionality and services.",
          "Customer data must:",
        ],
        lists: [[
          "Be lawfully obtained.",
          "Be lawfully processed.",
          "Comply with applicable regulations.",
          "Not infringe the rights of others.",
        ]],
        after: ["We do not sell customer data."],
      },
      {
        title: "11. INTELLECTUAL PROPERTY",
        paragraphs: [
          "All software, content, branding, platform designs, functionality, workflows, and technology associated with CORTEXA remain the property of Listo Qasa S.A.S. or its applicable licensors.",
          "Without prior authorization, you may not:",
        ],
        lists: [[
          "Copy",
          "Reproduce",
          "Distribute",
          "Modify",
          "Resell",
          "Reverse engineer",
          "Create derivative works",
        ]],
      },
      {
        title: "12. SERVICE AVAILABILITY",
        paragraphs: ["While we strive to provide reliable service, we do not guarantee uninterrupted or error-free availability.", "Service may be affected by:"],
        lists: [[
          "Maintenance",
          "Updates",
          "Infrastructure issues",
          "Third-party outages",
          "Security events",
          "Events beyond our reasonable control",
        ]],
      },
      {
        title: "13. LIMITATION OF LIABILITY",
        paragraphs: ["To the maximum extent permitted by applicable law, CORTEXA and Listo Qasa S.A.S. shall not be liable for:"],
        lists: [[
          "Lost profits",
          "Lost revenue",
          "Lost business opportunities",
          "Loss of data",
          "Business interruption",
          "Indirect damages",
          "Consequential damages",
          "Special or incidental damages",
        ]],
        after: [
          "To the extent permitted by applicable law, our total liability shall not exceed the amount paid by you during the preceding twelve (12) months.",
          "Nothing in these Terms excludes or limits liability or consumer rights that cannot legally be excluded or limited.",
        ],
      },
      {
        title: "14. INDEMNIFICATION",
        paragraphs: ["To the extent permitted by applicable law, you agree to defend, indemnify, and hold harmless Listo Qasa S.A.S., CORTEXA, and their owners, employees, contractors, and affiliates from claims arising from:"],
        lists: [[
          "Your use of the platform",
          "Your content or data",
          "Violations of these Terms",
          "Violations of applicable laws",
        ]],
      },
      {
        title: "15. TERMINATION",
        paragraphs: ["We may suspend or terminate accounts for:"],
        lists: [[
          "Violation of these Terms",
          "Fraudulent activity",
          "Abuse of the platform",
          "Security concerns",
          "Legal or regulatory requirements",
          "Non-payment",
        ]],
        after: ["Termination may occur with or without notice where legally permitted."],
      },
      {
        title: "16. CHANGES TO TERMS",
        paragraphs: [
          "We may update these Terms periodically.",
          "Where required, we will provide appropriate notice of material changes. Continued use of the platform after updated Terms become effective constitutes acceptance to the extent permitted by applicable law.",
        ],
      },
      {
        title: "17. GOVERNING LAW",
        paragraphs: ["These Terms are governed by applicable law, subject to any mandatory consumer protections or other rights that apply based on the customer's jurisdiction."],
      },
      {
        title: "18. CONTACT INFORMATION",
        contacts: [
          ["Support Email", "support@cortexaaicrm.com"],
          ["Platform", "CORTEXA AI Revenue OS"],
          ["Legal Business Name", "Listo Qasa S.A.S."],
          ["Trade Name / Brand", "CORTEXA Agentic AI Revenue OS"],
          ["RUC", "1793234655001"],
          ["Country of Registration", "Ecuador"],
        ],
        after: [
          "For questions regarding these Terms, billing, platform usage, or legal matters, please contact:",
          "support@cortexaaicrm.com",
        ],
      },
    ],
  },

  es: {
    title: "TÉRMINOS DE SERVICIO",
    effectiveDate: "Fecha de entrada en vigor: 22 de abril de 2026",
    intro:
      'Estos Términos de Servicio ("Términos") regulan su acceso y uso de CORTEXA AI Revenue OS ("CORTEXA", "nosotros", "nuestro" o "nos"), operado por Listo Qasa S.A.S. Al acceder, utilizar o suscribirse a la plataforma, usted acepta quedar sujeto a estos Términos.',
    sections: [
      { title: "1. ELEGIBILIDAD", paragraphs: ["Usted debe:"], lists: [["Tener al menos 18 años.", "Operar un negocio, servicio profesional u organización legítima.", "Tener la autoridad legal para celebrar este acuerdo."]], after: ["No puede utilizar CORTEXA AI Revenue OS para actividades ilegales, fraudulentas, abusivas, engañosas o prohibidas."] },
      { title: "2. SERVICIOS", paragraphs: ["CORTEXA AI Revenue OS proporciona herramientas de automatización empresarial y gestión de clientes, incluidas, entre otras:"], lists: [["Funcionalidad CRM", "Gestión de prospectos", "Gestión de pipeline", "Asistencia impulsada por IA", "Automatización de WhatsApp", "Gestión de contactos", "Herramientas de colaboración en equipo", "Analítica e informes", "Automatización de flujos de trabajo", "Reserva de citas", "Integraciones con servicios de terceros"]], after: ["Podemos modificar, mejorar, suspender o discontinuar funciones en cualquier momento."] },
      { title: "3. RESPONSABILIDAD DE LA CUENTA", paragraphs: ["Usted es responsable de:"], lists: [["Mantener la seguridad de su cuenta.", "Todas las actividades que ocurran bajo su cuenta.", "Proporcionar información precisa y actualizada.", "Mantener seguras sus credenciales de acceso."]], after: ["Podemos suspender o cancelar cuentas involucradas en actividades sospechosas, abusivas, fraudulentas o prohibidas."] },
      { title: "4. USO ACEPTABLE", paragraphs: ["Usted acepta NO:"], lists: [["Participar en fraude o actividades ilegales.", "Enviar spam o mensajes no autorizados.", "Violar leyes de privacidad o protección de datos.", "Falsear su identidad o la de su negocio.", "Acosar, abusar o engañar a usuarios.", "Intentar obtener acceso no autorizado a sistemas.", "Realizar ingeniería inversa, explotar o interrumpir la plataforma."]], after: ["La violación de estos Términos puede resultar en suspensión o terminación inmediata."] },
      { title: "5. PRUEBA GRATUITA, TARIFA DE CONFIGURACIÓN Y FACTURACIÓN", groups: [
        { heading: "Prueba Gratuita", text: "CORTEXA AI Revenue OS incluye una prueba gratuita de 14 días que comienza después de completar el registro y cualquier requisito de activación aplicable. Su plan mensual no se factura durante la prueba de 14 días." },
        { heading: "Tarifa de Configuración", text: "Cuando corresponda, se puede cobrar una tarifa única de configuración y activación al registrarse antes de que comience la prueba. Cualquier tarifa, precio y condición de pago aplicable se mostrará claramente antes de la compra." },
        { heading: "Planes de Suscripción", text: "Los planes de suscripción disponibles, precios, usuarios incluidos, funciones y límites aplicables se muestran en el sitio web de Cortexa o durante el checkout." },
        { heading: "Cambios de Precios", text: "Los precios pueden actualizarse periódicamente. Los clientes existentes recibirán aviso de cambios materiales de precios cuando lo exija la legislación aplicable." },
        { heading: "Usuarios Adicionales", text: "Pueden estar disponibles usuarios adicionales por un cargo recurrente adicional, según se muestre en el momento de la compra." },
        { heading: "Cómo Funciona la Facturación", text: "Cuando se selecciona una suscripción de pago, la información de facturación y los términos de suscripción recurrente se mostrarán claramente antes del checkout. Las suscripciones se renuevan según el ciclo de facturación seleccionado, salvo que se cancelen de acuerdo con estos Términos y nuestra Política de Reembolsos." },
      ]},
      { title: "6. POLÍTICA DE USO JUSTO DE IA", paragraphs: ["CORTEXA AI Revenue OS incluye funcionalidad impulsada por IA.", "El uso de IA puede estar sujeto a límites razonables de uso justo.", "Las cargas de trabajo inusualmente altas o el procesamiento a escala empresarial pueden requerir un plan superior o capacidad adicional de IA.", "Los clientes serán notificados antes de implementar requisitos de actualización relacionados con el uso cuando corresponda."] },
      { title: "7. USO DE LA BASE DE DATOS DE CONTACTOS", paragraphs: ["CORTEXA AI Revenue OS no cobra únicamente en función del número de contactos almacenados, salvo que se indique lo contrario para un producto o plan específico.", "Pueden aplicarse límites razonables de almacenamiento, uso y plataforma para garantizar el rendimiento y la fiabilidad."] },
      { title: "8. SERVICIOS DE TERCEROS", paragraphs: ["CORTEXA puede integrarse con proveedores externos como WhatsApp, Google, Microsoft, proveedores de correo electrónico, proveedores de IA, plataformas de automatización y procesadores de pagos.", "CORTEXA no es responsable de:"], lists: [["Interrupciones de terceros", "Precios de terceros", "Políticas de terceros", "Rendimiento de terceros", "Prácticas independientes de tratamiento de datos de terceros"]], after: ["El uso de servicios de terceros sigue sujeto a sus respectivos términos y políticas."] },
      { title: "9. POLÍTICA DE CANCELACIÓN Y REEMBOLSO", paragraphs: ["Los clientes pueden cancelar suscripciones de acuerdo con los términos de cancelación aplicables a su compra.", "La cancelación evita futuras renovaciones una vez que la cancelación aplicable entre en vigor.", "Los derechos de reembolso y cancelación se rigen por nuestra Política de Reembolsos separada, la legislación aplicable y, cuando Paddle procese la transacción como Merchant of Record, los términos aplicables de checkout y comprador de Paddle."], groups: [{ heading: "IMPORTANTE PARA EL DESARROLLADOR:", text: "Esta sección debe mantenerse coherente con la página dedicada de Política de Reembolsos. El lenguaje final de la Política de Reembolsos se proporcionará por separado antes de completar la verificación de Paddle." }] },
      { title: "10. DATOS DEL USUARIO Y RESPONSABILIDAD", paragraphs: ["Usted conserva la propiedad de sus datos.", "CORTEXA procesa los datos del cliente para proporcionar la funcionalidad y los servicios de la plataforma.", "Los datos del cliente deben:"], lists: [["Ser obtenidos legalmente.", "Ser procesados legalmente.", "Cumplir con las regulaciones aplicables.", "No infringir los derechos de terceros."]], after: ["No vendemos datos de clientes."] },
      { title: "11. PROPIEDAD INTELECTUAL", paragraphs: ["Todo el software, contenido, marca, diseños de plataforma, funcionalidad, flujos de trabajo y tecnología asociados con CORTEXA siguen siendo propiedad de Listo Qasa S.A.S. o de sus licenciantes correspondientes.", "Sin autorización previa, usted no puede:"], lists: [["Copiar", "Reproducir", "Distribuir", "Modificar", "Revender", "Realizar ingeniería inversa", "Crear obras derivadas"]] },
      { title: "12. DISPONIBILIDAD DEL SERVICIO", paragraphs: ["Aunque nos esforzamos por proporcionar un servicio fiable, no garantizamos una disponibilidad ininterrumpida o libre de errores.", "El servicio puede verse afectado por:"], lists: [["Mantenimiento", "Actualizaciones", "Problemas de infraestructura", "Interrupciones de terceros", "Eventos de seguridad", "Eventos fuera de nuestro control razonable"]] },
      { title: "13. LIMITACIÓN DE RESPONSABILIDAD", paragraphs: ["En la máxima medida permitida por la legislación aplicable, CORTEXA y Listo Qasa S.A.S. no serán responsables de:"], lists: [["Pérdida de beneficios", "Pérdida de ingresos", "Pérdida de oportunidades comerciales", "Pérdida de datos", "Interrupción del negocio", "Daños indirectos", "Daños consecuentes", "Daños especiales o incidentales"]], after: ["En la medida permitida por la legislación aplicable, nuestra responsabilidad total no excederá el importe pagado por usted durante los doce (12) meses anteriores.", "Nada de estos Términos excluye o limita responsabilidades o derechos del consumidor que legalmente no puedan excluirse o limitarse."] },
      { title: "14. INDEMNIZACIÓN", paragraphs: ["En la medida permitida por la legislación aplicable, usted acepta defender, indemnizar y mantener indemnes a Listo Qasa S.A.S., CORTEXA y sus propietarios, empleados, contratistas y afiliados frente a reclamaciones derivadas de:"], lists: [["Su uso de la plataforma", "Su contenido o datos", "Violaciones de estos Términos", "Violaciones de las leyes aplicables"]] },
      { title: "15. TERMINACIÓN", paragraphs: ["Podemos suspender o cancelar cuentas por:"], lists: [["Violación de estos Términos", "Actividad fraudulenta", "Abuso de la plataforma", "Problemas de seguridad", "Requisitos legales o regulatorios", "Falta de pago"]], after: ["La terminación puede ocurrir con o sin aviso cuando esté legalmente permitido."] },
      { title: "16. CAMBIOS EN LOS TÉRMINOS", paragraphs: ["Podemos actualizar estos Términos periódicamente.", "Cuando sea necesario, proporcionaremos un aviso apropiado de cambios materiales. El uso continuado de la plataforma después de que los Términos actualizados entren en vigor constituye aceptación en la medida permitida por la legislación aplicable."] },
      { title: "17. LEGISLACIÓN APLICABLE", paragraphs: ["Estos Términos se rigen por la legislación aplicable, sujetos a cualquier protección obligatoria del consumidor u otros derechos que correspondan según la jurisdicción del cliente."] },
      { title: "18. INFORMACIÓN DE CONTACTO", contacts: [["Correo electrónico de soporte", "support@cortexaaicrm.com"], ["Plataforma", "CORTEXA AI Revenue OS"], ["Nombre legal de la empresa", "Listo Qasa S.A.S."], ["Nombre comercial / Marca", "CORTEXA Agentic AI Revenue OS"], ["RUC", "1793234655001"], ["País de registro", "Ecuador"]], after: ["Para preguntas sobre estos Términos, facturación, uso de la plataforma o asuntos legales, comuníquese con:", "support@cortexaaicrm.com"] },
    ],
  },

  pt: {
    title: "TERMOS DE SERVIÇO",
    effectiveDate: "Data de vigência: 22 de abril de 2026",
    intro:
      'Estes Termos de Serviço ("Termos") regem seu acesso e uso do CORTEXA AI Revenue OS ("CORTEXA", "nós", "nosso" ou "nos"), operado pela Listo Qasa S.A.S. Ao acessar, utilizar ou assinar a plataforma, você concorda em ficar vinculado a estes Termos.',
    sections: [
      { title: "1. ELEGIBILIDADE", paragraphs: ["Você deve:"], lists: [["Ter pelo menos 18 anos.", "Operar um negócio, serviço profissional ou organização legítima.", "Ter autoridade legal para celebrar este acordo."]], after: ["Você não pode usar o CORTEXA AI Revenue OS para atividades ilegais, fraudulentas, abusivas, enganosas ou proibidas."] },
      { title: "2. SERVIÇOS", paragraphs: ["O CORTEXA AI Revenue OS fornece ferramentas de automação empresarial e gestão de clientes, incluindo, entre outras:"], lists: [["Funcionalidade de CRM", "Gestão de leads", "Gestão de pipeline", "Assistência com IA", "Automação do WhatsApp", "Gestão de contatos", "Ferramentas de colaboração em equipe", "Análises e relatórios", "Automação de fluxos de trabalho", "Agendamento de compromissos", "Integrações com serviços de terceiros"]], after: ["Podemos modificar, melhorar, suspender ou descontinuar recursos a qualquer momento."] },
      { title: "3. RESPONSABILIDADE DA CONTA", paragraphs: ["Você é responsável por:"], lists: [["Manter a segurança da sua conta.", "Todas as atividades que ocorram em sua conta.", "Fornecer informações precisas e atualizadas.", "Manter as credenciais de acesso em segurança."]], after: ["Podemos suspender ou encerrar contas envolvidas em atividades suspeitas, abusivas, fraudulentas ou proibidas."] },
      { title: "4. USO ACEITÁVEL", paragraphs: ["Você concorda em NÃO:"], lists: [["Praticar fraude ou atividade ilegal.", "Enviar spam ou mensagens não autorizadas.", "Violar leis de privacidade ou proteção de dados.", "Deturpar sua identidade ou seu negócio.", "Assediar, abusar ou enganar usuários.", "Tentar obter acesso não autorizado a sistemas.", "Realizar engenharia reversa, explorar ou interromper a plataforma."]], after: ["A violação destes Termos pode resultar em suspensão ou encerramento imediato."] },
      { title: "5. TESTE GRATUITO, TAXA DE CONFIGURAÇÃO E COBRANÇA", groups: [
        { heading: "Teste Gratuito", text: "O CORTEXA AI Revenue OS inclui um teste gratuito de 14 dias que começa após a conclusão do cadastro e de quaisquer requisitos de ativação aplicáveis. Seu plano mensal não é cobrado durante o teste de 14 dias." },
        { heading: "Taxa de Configuração", text: "Quando aplicável, uma taxa única de configuração e ativação poderá ser cobrada no cadastro antes do início do teste. Qualquer taxa, preço e condição de pagamento aplicável será claramente exibida antes da compra." },
        { heading: "Planos de Assinatura", text: "Os planos de assinatura disponíveis, preços, usuários incluídos, recursos e limites aplicáveis são exibidos no site da Cortexa ou durante o checkout." },
        { heading: "Alterações de Preços", text: "Os preços podem ser atualizados periodicamente. Clientes existentes receberão aviso sobre alterações materiais de preços quando exigido pela legislação aplicável." },
        { heading: "Usuários Adicionais", text: "Usuários adicionais podem estar disponíveis mediante uma cobrança recorrente adicional, conforme exibido no momento da compra." },
        { heading: "Como Funciona a Cobrança", text: "Quando uma assinatura paga é selecionada, as informações de cobrança e os termos da assinatura recorrente serão claramente exibidos antes do checkout. As assinaturas são renovadas de acordo com o ciclo de cobrança selecionado, salvo se canceladas de acordo com estes Termos e nossa Política de Reembolso." },
      ]},
      { title: "6. POLÍTICA DE USO JUSTO DE IA", paragraphs: ["O CORTEXA AI Revenue OS inclui funcionalidades baseadas em IA.", "O uso de IA pode estar sujeito a limites razoáveis de uso justo.", "Cargas de trabalho excepcionalmente altas ou processamento em escala empresarial podem exigir um plano de nível superior ou capacidade adicional de IA.", "Os clientes serão notificados antes da implementação de requisitos de upgrade relacionados ao uso, quando aplicável."] },
      { title: "7. USO DO BANCO DE DADOS DE CONTATOS", paragraphs: ["O CORTEXA AI Revenue OS não cobra exclusivamente com base no número de contatos armazenados, salvo indicação em contrário para um produto ou plano específico.", "Limites razoáveis de armazenamento, uso e plataforma podem ser aplicados para garantir desempenho e confiabilidade."] },
      { title: "8. SERVIÇOS DE TERCEIROS", paragraphs: ["O CORTEXA pode integrar-se a provedores terceiros como WhatsApp, Google, Microsoft, provedores de e-mail, provedores de IA, plataformas de automação e processadores de pagamento.", "O CORTEXA não é responsável por:"], lists: [["Indisponibilidade de terceiros", "Preços de terceiros", "Políticas de terceiros", "Desempenho de terceiros", "Práticas independentes de tratamento de dados de terceiros"]], after: ["O uso de serviços de terceiros permanece sujeito aos respectivos termos e políticas."] },
      { title: "9. POLÍTICA DE CANCELAMENTO E REEMBOLSO", paragraphs: ["Os clientes podem cancelar assinaturas de acordo com os termos de cancelamento aplicáveis à sua compra.", "O cancelamento impede renovações futuras após a entrada em vigor do cancelamento aplicável.", "Os direitos de reembolso e cancelamento são regidos por nossa Política de Reembolso separada, pela legislação aplicável e, quando a Paddle processar a transação como Merchant of Record, pelos termos aplicáveis de checkout e comprador da Paddle."], groups: [{ heading: "IMPORTANTE PARA O DESENVOLVEDOR:", text: "Esta seção deve ser mantida consistente com a página dedicada da Política de Reembolso. A redação final da Política de Reembolso será fornecida separadamente antes da conclusão da verificação da Paddle." }] },
      { title: "10. DADOS DO USUÁRIO E RESPONSABILIDADE", paragraphs: ["Você mantém a propriedade dos seus dados.", "O CORTEXA processa dados dos clientes para fornecer funcionalidades e serviços da plataforma.", "Os dados do cliente devem:"], lists: [["Ser obtidos legalmente.", "Ser processados legalmente.", "Cumprir as regulamentações aplicáveis.", "Não infringir os direitos de terceiros."]], after: ["Não vendemos dados de clientes."] },
      { title: "11. PROPRIEDADE INTELECTUAL", paragraphs: ["Todo software, conteúdo, marca, designs da plataforma, funcionalidades, fluxos de trabalho e tecnologia associados ao CORTEXA permanecem propriedade da Listo Qasa S.A.S. ou de seus licenciadores aplicáveis.", "Sem autorização prévia, você não pode:"], lists: [["Copiar", "Reproduzir", "Distribuir", "Modificar", "Revender", "Realizar engenharia reversa", "Criar obras derivadas"]] },
      { title: "12. DISPONIBILIDADE DO SERVIÇO", paragraphs: ["Embora nos esforcemos para fornecer um serviço confiável, não garantimos disponibilidade ininterrupta ou livre de erros.", "O serviço pode ser afetado por:"], lists: [["Manutenção", "Atualizações", "Problemas de infraestrutura", "Indisponibilidade de terceiros", "Eventos de segurança", "Eventos além do nosso controle razoável"]] },
      { title: "13. LIMITAÇÃO DE RESPONSABILIDADE", paragraphs: ["Na máxima extensão permitida pela legislação aplicável, CORTEXA e Listo Qasa S.A.S. não serão responsáveis por:"], lists: [["Perda de lucros", "Perda de receita", "Perda de oportunidades de negócios", "Perda de dados", "Interrupção dos negócios", "Danos indiretos", "Danos consequenciais", "Danos especiais ou incidentais"]], after: ["Na medida permitida pela legislação aplicável, nossa responsabilidade total não excederá o valor pago por você durante os doze (12) meses anteriores.", "Nada nestes Termos exclui ou limita responsabilidades ou direitos do consumidor que legalmente não possam ser excluídos ou limitados."] },
      { title: "14. INDENIZAÇÃO", paragraphs: ["Na medida permitida pela legislação aplicável, você concorda em defender, indenizar e isentar a Listo Qasa S.A.S., CORTEXA e seus proprietários, funcionários, contratados e afiliados de reclamações decorrentes de:"], lists: [["Seu uso da plataforma", "Seu conteúdo ou dados", "Violações destes Termos", "Violações das leis aplicáveis"]] },
      { title: "15. ENCERRAMENTO", paragraphs: ["Podemos suspender ou encerrar contas por:"], lists: [["Violação destes Termos", "Atividade fraudulenta", "Abuso da plataforma", "Preocupações de segurança", "Requisitos legais ou regulatórios", "Falta de pagamento"]], after: ["O encerramento pode ocorrer com ou sem aviso quando legalmente permitido."] },
      { title: "16. ALTERAÇÕES NOS TERMOS", paragraphs: ["Podemos atualizar estes Termos periodicamente.", "Quando exigido, forneceremos aviso adequado sobre alterações materiais. O uso contínuo da plataforma após a entrada em vigor dos Termos atualizados constitui aceitação na medida permitida pela legislação aplicável."] },
      { title: "17. LEI APLICÁVEL", paragraphs: ["Estes Termos são regidos pela legislação aplicável, sujeitos a quaisquer proteções obrigatórias do consumidor ou outros direitos aplicáveis com base na jurisdição do cliente."] },
      { title: "18. INFORMAÇÕES DE CONTATO", contacts: [["E-mail de suporte", "support@cortexaaicrm.com"], ["Plataforma", "CORTEXA AI Revenue OS"], ["Nome jurídico da empresa", "Listo Qasa S.A.S."], ["Nome comercial / Marca", "CORTEXA Agentic AI Revenue OS"], ["RUC", "1793234655001"], ["País de registro", "Equador"]], after: ["Para perguntas sobre estes Termos, cobrança, uso da plataforma ou assuntos jurídicos, entre em contato com:", "support@cortexaaicrm.com"] },
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
    fontWeight: 700,
    color: "#111827",
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