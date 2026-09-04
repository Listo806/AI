import React, { useEffect, useState } from "react";

const t = {
  en: {
    "title": "TERMS OF SERVICE",
    "effectiveDate": "Effective Date: August 12, 2026",
    "intro": [
      "These Terms of Service (\"Terms\") govern access to and use of CORTEXA CRM (\"CORTEXA,\" \"Cortexa,\" \"we,\" \"our,\" or \"us\"), operated by Listo Qasa S.A.S.",
      "By creating an account, accessing or using CORTEXA, or purchasing a paid subscription or add-on, you agree to these Terms."
    ],
    "sections": [
      {
        "title": "1. ELIGIBILITY",
        "blocks": [
          {
            "type": "paragraph",
            "text": "You must:"
          },
          {
            "type": "list",
            "items": [
              "Be at least 18 years old.",
              "Operate or represent a legitimate business, professional service, organization, or other lawful commercial activity.",
              "Have the legal authority to enter into this agreement.",
              "Provide accurate and current account and billing information."
            ]
          },
          {
            "type": "paragraph",
            "text": "You may not use CORTEXA for illegal, fraudulent, abusive, deceptive, unauthorized, or otherwise prohibited activities."
          }
        ]
      },
      {
        "title": "2. SERVICES",
        "blocks": [
          {
            "type": "paragraph",
            "text": "CORTEXA CRM is a business software platform providing tools that may include:"
          },
          {
            "type": "list",
            "items": [
              "CRM functionality",
              "Lead and contact management",
              "Pipeline and opportunity management",
              "AI-powered assistance",
              "Business dashboards",
              "Analytics and reporting",
              "Workflow automation",
              "Tasks and appointments",
              "Calendar functionality",
              "Team collaboration",
              "Customer and business data management",
              "Third-party integrations",
              "Additional Workspaces and add-on functionality"
            ]
          },
          {
            "type": "paragraph",
            "text": "Available functionality depends on the customer's selected plan, applicable usage limits, purchased Workspaces, add-ons, integrations, and other entitlements."
          },
          {
            "type": "paragraph",
            "text": "CORTEXA may modify, improve, add, replace, suspend, or discontinue functionality from time to time."
          }
        ]
      },
      {
        "title": "3. ACCOUNT RESPONSIBILITY",
        "blocks": [
          {
            "type": "paragraph",
            "text": "You are responsible for:"
          },
          {
            "type": "list",
            "items": [
              "Maintaining the security of your account and credentials.",
              "All activity conducted through your account.",
              "Providing accurate and current information.",
              "Maintaining appropriate access controls for authorized users.",
              "Ensuring your use of CORTEXA complies with applicable laws and regulations."
            ]
          },
          {
            "type": "paragraph",
            "text": "You must promptly notify CORTEXA if you believe your account has been accessed without authorization."
          },
          {
            "type": "paragraph",
            "text": "We may restrict, suspend, or terminate accounts involved in fraudulent, abusive, unlawful, unauthorized, or prohibited activity."
          }
        ]
      },
      {
        "title": "4. ACCEPTABLE USE",
        "blocks": [
          {
            "type": "paragraph",
            "text": "You may not use CORTEXA to:"
          },
          {
            "type": "list",
            "items": [
              "Engage in fraud or illegal activity.",
              "Send spam or unauthorized communications.",
              "Conduct unlawful or unauthorized mass marketing.",
              "Violate privacy, data protection, consumer protection, or communications laws.",
              "Harass, threaten, deceive, or abuse another person.",
              "Misrepresent your identity or business.",
              "Collect, use, or process information unlawfully.",
              "Attempt to gain unauthorized access to CORTEXA or third-party systems.",
              "Circumvent security, access, usage, or plan restrictions.",
              "Reverse engineer, exploit, damage, interfere with, or disrupt the platform.",
              "Use third-party integrations in violation of the applicable provider's terms."
            ]
          },
          {
            "type": "paragraph",
            "text": "Violation of this section may result in restriction, suspension, or termination of access."
          }
        ]
      },
      {
        "title": "5. PLANS & PRICING",
        "blocks": [
          
          {
            "type": "subheading",
            "text": "A. SOLO"
          },
          {
            "type": "paragraph",
            "text": "Introductory activation price:"
          },
          {
            "type": "paragraph",
            "text": "$7 USD."
          },
          {
            "type": "paragraph",
            "text": "The Solo plan includes a 14-day trial period."
          },
          {
            "type": "paragraph",
            "text": "After the 14-day trial period, the Solo subscription becomes:"
          },
          {
            "type": "paragraph",
            "text": "$197 USD per month."
          },
          {
            "type": "paragraph",
            "text": "Unless canceled before the first recurring charge becomes due, the Solo plan will automatically continue at $197 USD per month."
          },
          {
            "type": "paragraph",
            "text": "The applicable introductory charge, trial terms, renewal date, and recurring subscription price must be displayed to the customer before checkout."
          },
          {
            "type": "subheading",
            "text": "B. BUSINESS"
          },
          {
            "type": "paragraph",
            "text": "Introductory activation price:"
          },
          {
            "type": "paragraph",
            "text": "$14 USD."
          },
          {
            "type": "paragraph",
            "text": "The Business plan includes a 14-day trial period."
          },
          {
            "type": "paragraph",
            "text": "After the 14-day trial period, the Business subscription becomes:"
          },
          {
            "type": "paragraph",
            "text": "$347 USD per month."
          },
          {
            "type": "paragraph",
            "text": "Unless canceled before the first recurring charge becomes due, the Business plan will automatically continue at $347 USD per month."
          },
          {
            "type": "paragraph",
            "text": "The applicable introductory charge, trial terms, renewal date, and recurring subscription price must be displayed to the customer before checkout."
          },
          {
            "type": "subheading",
            "text": "C. SCALE"
          },
          {
            "type": "paragraph",
            "text": "Introductory activation price:"
          },
          {
            "type": "paragraph",
            "text": "$21 USD."
          },
          {
            "type": "paragraph",
            "text": "The Scale plan includes a 14-day trial period."
          },
          {
            "type": "paragraph",
            "text": "After the 14-day trial period, the Scale subscription becomes:"
          },
          {
            "type": "paragraph",
            "text": "$497 USD per month."
          },
          {
            "type": "paragraph",
            "text": "Unless canceled before the first recurring charge becomes due, the Scale plan will automatically continue at $497 USD per month."
          },
          {
            "type": "paragraph",
            "text": "The applicable introductory charge, trial terms, renewal date, and recurring subscription price must be displayed to the customer before checkout."
          }
        ]
      },
      {
        "title": "6. 14-DAY TRIAL & INTRODUCTORY ACTIVATION CHARGES",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Solo, Business, and Scale include a 14-day introductory trial period."
          },
          {
            "type": "paragraph",
            "text": "The applicable introductory activation charge is collected when the customer selects the applicable paid offer:"
          },
          {
            "type": "list",
            "items": [
              "Solo — $7 USD",
              "Business — $14 USD",
              "Scale — $21 USD"
            ]
          },
          {
            "type": "paragraph",
            "text": "The 14-day trial begins upon successful activation of the applicable paid offer unless a different commencement date is clearly disclosed during checkout."
          },
          {
            "type": "paragraph",
            "text": "The monthly subscription charge is not charged during the 14-day trial period."
          },
          {
            "type": "paragraph",
            "text": "At the end of the trial period, the selected plan automatically converts to its applicable recurring monthly subscription unless canceled before the recurring charge becomes due:"
          },
          {
            "type": "list",
            "items": [
              "Solo — $197/month",
              "Business — $347/month",
              "Scale — $497/month"
            ]
          },
          {
            "type": "paragraph",
            "text": "Before completing checkout, customers must be shown the applicable introductory charge, trial duration, recurring subscription amount, and recurring billing terms."
          },
          {
            "type": "paragraph",
            "text": "Any cancellation or refund rights are subject to Section 10 of these Terms, the CORTEXA Refund Policy, applicable law, and any applicable Merchant of Record buyer terms."
          }
        ]
      },
      {
        "title": "7. RECURRING BILLING",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Paid subscriptions automatically renew according to the billing cycle presented during checkout unless canceled."
          },
          {
            "type": "paragraph",
            "text": "By purchasing a recurring subscription, you authorize the applicable payment provider or Merchant of Record to charge the applicable subscription amount when it becomes due."
          },
          {
            "type": "paragraph",
            "text": "For the current paid plans, following the 14-day trial:"
          },
          {
            "type": "list",
            "items": [
              "Solo renews at $197 USD per month.",
              "Business renews at $347 USD per month.",
              "Scale renews at $497 USD per month."
            ]
          },
          {
            "type": "paragraph",
            "text": "Applicable taxes may be added where required."
          },
          {
            "type": "paragraph",
            "text": "Customers are responsible for maintaining valid payment information."
          },
          {
            "type": "paragraph",
            "text": "A failed or declined payment may result in restriction, suspension, downgrade, or termination of paid functionality in accordance with applicable billing rules."
          }
        ]
      },
      {
        "title": "8. AI USAGE & FAIR USE",
        "blocks": [
          {
            "type": "paragraph",
            "text": "CORTEXA includes AI-powered assistance and AI-enabled functionality."
          },
          {
            "type": "paragraph",
            "text": "AI availability and usage depend on the customer's plan and applicable product entitlements."
          },
          {
            "type": "paragraph",
            "text": "The Free Forever plan provides limited AI usage."
          },
          {
            "type": "paragraph",
            "text": "Free Forever does NOT include unlimited AI usage."
          },
          {
            "type": "paragraph",
            "text": "Paid plans may provide increased or unlimited AI usage subject to the applicable plan description, reasonable technical safeguards, fair-use requirements, security restrictions, and any limitations disclosed for the applicable service."
          },
          {
            "type": "paragraph",
            "text": "CORTEXA may implement reasonable usage limits where necessary to maintain security, performance, availability, or service quality."
          },
          {
            "type": "paragraph",
            "text": "Unusually high-volume or enterprise-scale processing may require additional capacity, an upgraded plan, or a separately negotiated service arrangement."
          },
          {
            "type": "paragraph",
            "text": "Material changes to applicable paid-plan usage terms will be communicated where required by law."
          }
        ]
      },
      {
        "title": "9. WORKSPACES, ADD-ONS & ADDITIONAL SERVICES",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Certain CORTEXA Workspaces, additional users, integrations, functionality, or other services may be offered separately for an additional charge."
          },
          {
            "type": "paragraph",
            "text": "The applicable price and billing terms will be disclosed before purchase."
          },
          {
            "type": "paragraph",
            "text": "Purchasing a Workspace or add-on does not automatically change the customer's underlying base plan unless expressly stated during checkout."
          },
          {
            "type": "paragraph",
            "text": "For example, a Free Forever customer who purchases an eligible paid Workspace may remain on the Free Forever base plan while receiving access to the separately purchased Workspace."
          },
          {
            "type": "paragraph",
            "text": "The customer's base-plan restrictions and usage limits remain applicable unless expressly modified by the purchased product."
          },
          {
            "type": "paragraph",
            "text": "Cancellation of one Workspace or add-on does not automatically cancel the customer's base plan or unrelated active products."
          }
        ]
      },
      {
        "title": "10. CANCELLATION & REFUNDS",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Customers may cancel recurring subscriptions in accordance with the cancellation options available through CORTEXA, the applicable payment provider, or Merchant of Record."
          },
          {
            "type": "paragraph",
            "text": "Cancellation prevents future recurring charges after the cancellation becomes effective but does not remove any mandatory cancellation or refund rights provided by applicable law."
          },
          {
            "type": "paragraph",
            "text": "Refund eligibility and cancellation rights are governed by:"
          },
          {
            "type": "list",
            "items": [
              "The CORTEXA Refund Policy",
              "Applicable consumer-protection law",
              "The terms presented during checkout",
              "Where applicable, the buyer terms of the Merchant of Record processing the transaction"
            ]
          },
          {
            "type": "paragraph",
            "text": "Where Paddle acts as Merchant of Record, applicable Paddle buyer cancellation and refund rights, including any mandatory consumer cancellation period, will apply."
          },
          {
            "type": "paragraph",
            "text": "Nothing in these Terms is intended to restrict a refund, cancellation, withdrawal, or other consumer right that cannot legally be waived."
          },
          {
            "type": "paragraph",
            "text": "The dedicated CORTEXA Refund Policy should be read together with these Terms."
          }
        ]
      },
      {
        "title": "11. CONTACT DATABASE & CUSTOMER DATA",
        "blocks": [
          {
            "type": "paragraph",
            "text": "CORTEXA does not charge solely according to the number of contacts stored unless expressly stated for a particular plan or service."
          },
          {
            "type": "paragraph",
            "text": "Reasonable storage, usage, security, and platform limits may apply."
          },
          {
            "type": "paragraph",
            "text": "Customers retain ownership of the customer and business data they lawfully provide to CORTEXA."
          },
          {
            "type": "paragraph",
            "text": "Customers are responsible for ensuring that data uploaded, connected, imported, or processed through CORTEXA:"
          },
          {
            "type": "list",
            "items": [
              "Was lawfully obtained.",
              "Is lawfully processed.",
              "Complies with applicable privacy and data-protection laws.",
              "Does not infringe the rights of another person.",
              "Is used only for lawful and authorized purposes."
            ]
          },
          {
            "type": "paragraph",
            "text": "CORTEXA does not sell customer data."
          }
        ]
      },
      {
        "title": "12. THIRD-PARTY SERVICES & INTEGRATIONS",
        "blocks": [
          {
            "type": "paragraph",
            "text": "CORTEXA may allow customers to connect third-party services and accounts."
          },
          {
            "type": "paragraph",
            "text": "These may include business applications, communication services, productivity tools, cloud services, AI providers, payment providers, and other integrations."
          },
          {
            "type": "paragraph",
            "text": "Third-party accounts connected to CORTEXA remain subject to the third party's own terms, permissions, policies, restrictions, and applicable laws."
          },
          {
            "type": "paragraph",
            "text": "Customers are responsible for obtaining any required authorization or consent for their use of third-party services."
          },
          {
            "type": "paragraph",
            "text": "CORTEXA does not control independent third-party services and is not responsible for:"
          },
          {
            "type": "list",
            "items": [
              "Third-party outages",
              "Third-party pricing",
              "Third-party policy changes",
              "Third-party availability",
              "Third-party performance",
              "Independent third-party data practices"
            ]
          },
          {
            "type": "paragraph",
            "text": "Availability of an integration within CORTEXA does not authorize the customer to use that integration unlawfully or in violation of the third-party provider's terms."
          }
        ]
      },
      {
        "title": "13. PRIVACY & DATA PROTECTION",
        "blocks": [
          {
            "type": "paragraph",
            "text": "CORTEXA processes personal information in accordance with its Privacy Policy and applicable law."
          },
          {
            "type": "paragraph",
            "text": "Customers are responsible for ensuring that personal information they provide to or process through CORTEXA has been collected and is used lawfully."
          },
          {
            "type": "paragraph",
            "text": "Customers must obtain any notices, permissions, authorizations, or consents required by applicable law for their particular use of customer or prospect information."
          },
          {
            "type": "paragraph",
            "text": "For additional information regarding data collection, processing, retention, security, and user rights, please review the CORTEXA Privacy Policy."
          }
        ]
      },
      {
        "title": "14. INTELLECTUAL PROPERTY",
        "blocks": [
          {
            "type": "paragraph",
            "text": "CORTEXA software, branding, platform designs, interfaces, functionality, workflows, documentation, content, and technology remain the property of Listo Qasa S.A.S. or its applicable licensors."
          },
          {
            "type": "paragraph",
            "text": "Except where expressly permitted, customers may not:"
          },
          {
            "type": "list",
            "items": [
              "Copy",
              "Reproduce",
              "Distribute",
              "Modify",
              "Resell",
              "Reverse engineer",
              "Circumvent technical protections",
              "Create unauthorized derivative works"
            ]
          },
          {
            "type": "paragraph",
            "text": "Nothing in these Terms transfers ownership of CORTEXA intellectual property to the customer."
          }
        ]
      },
      {
        "title": "15. SERVICE AVAILABILITY",
        "blocks": [
          {
            "type": "paragraph",
            "text": "We work to provide a reliable service but do not guarantee uninterrupted or error-free operation."
          },
          {
            "type": "paragraph",
            "text": "Availability may be affected by:"
          },
          {
            "type": "list",
            "items": [
              "Maintenance",
              "Software updates",
              "Infrastructure issues",
              "Third-party outages",
              "Internet or telecommunications failures",
              "Security events",
              "Events beyond our reasonable control"
            ]
          },
          {
            "type": "paragraph",
            "text": "CORTEXA may perform maintenance or make changes necessary to maintain platform security, stability, functionality, or compliance."
          }
        ]
      },
      {
        "title": "16. LIMITATION OF LIABILITY",
        "blocks": [
          {
            "type": "paragraph",
            "text": "To the maximum extent permitted by applicable law, CORTEXA and Listo Qasa S.A.S. shall not be liable for:"
          },
          {
            "type": "list",
            "items": [
              "Lost profits",
              "Lost revenue",
              "Lost business opportunities",
              "Loss of data",
              "Business interruption",
              "Indirect damages",
              "Consequential damages",
              "Special or incidental damages"
            ]
          },
          {
            "type": "paragraph",
            "text": "To the extent permitted by applicable law, our aggregate liability arising from the Services will not exceed the amount paid by the customer to CORTEXA for the applicable Services during the preceding twelve (12) months."
          },
          {
            "type": "paragraph",
            "text": "Nothing in these Terms excludes or limits liability, statutory guarantees, consumer protections, or other rights that cannot legally be excluded or limited."
          }
        ]
      },
      {
        "title": "17. INDEMNIFICATION",
        "blocks": [
          {
            "type": "paragraph",
            "text": "To the extent permitted by applicable law, you agree to defend, indemnify, and hold harmless Listo Qasa S.A.S., CORTEXA, and their applicable owners, employees, contractors, and affiliates from claims arising from:"
          },
          {
            "type": "list",
            "items": [
              "Your unlawful or unauthorized use of CORTEXA.",
              "Your content or data.",
              "Your violation of these Terms.",
              "Your violation of applicable law.",
              "Your infringement of another person's rights."
            ]
          }
        ]
      },
      {
        "title": "18. SUSPENSION & TERMINATION",
        "blocks": [
          {
            "type": "paragraph",
            "text": "CORTEXA may restrict, suspend, or terminate an account where appropriate because of:"
          },
          {
            "type": "list",
            "items": [
              "Violation of these Terms",
              "Fraudulent activity",
              "Abuse of the platform",
              "Security concerns",
              "Legal or regulatory requirements",
              "Non-payment",
              "Unauthorized access or use",
              "Material violations of applicable third-party requirements"
            ]
          },
          {
            "type": "paragraph",
            "text": "Termination may occur with or without advance notice where legally permitted and appropriate under the circumstances."
          },
          {
            "type": "paragraph",
            "text": "Termination does not eliminate payment obligations already lawfully incurred."
          }
        ]
      },
      {
        "title": "19. CHANGES TO PLANS OR SERVICES",
        "blocks": [
          {
            "type": "paragraph",
            "text": "CORTEXA may update its products, functionality, plans, pricing, usage allowances, and services as the platform evolves."
          },
          {
            "type": "paragraph",
            "text": "Existing paid customers will receive notice of material pricing changes where required by applicable law."
          },
          {
            "type": "paragraph",
            "text": "Changes will not eliminate mandatory contractual or consumer rights."
          }
        ]
      },
      {
        "title": "20. CHANGES TO THESE TERMS",
        "blocks": [
          {
            "type": "paragraph",
            "text": "We may update these Terms periodically."
          },
          {
            "type": "paragraph",
            "text": "The current version and effective date will be published through the CORTEXA website or platform."
          },
          {
            "type": "paragraph",
            "text": "Where required by law, we will provide appropriate notice of material changes."
          },
          {
            "type": "paragraph",
            "text": "Continued use after revised Terms become effective constitutes acceptance of those Terms to the extent permitted by applicable law."
          }
        ]
      },
      {
        "title": "21. GOVERNING LAW",
        "blocks": [
          {
            "type": "paragraph",
            "text": "These Terms are governed by applicable law, subject to mandatory consumer-protection, jurisdictional, or other legal rights that may apply based on the customer's location."
          },
          {
            "type": "paragraph",
            "text": "Nothing in these Terms removes rights that cannot legally be waived."
          }
        ]
      },
      {
        "title": "22. ENTIRE AGREEMENT",
        "blocks": [
          {
            "type": "paragraph",
            "text": "These Terms, together with the Privacy Policy, Refund Policy, applicable checkout disclosures, plan descriptions, and any additional terms expressly applicable to a purchased service, constitute the agreement governing use and purchase of CORTEXA services."
          },
          {
            "type": "paragraph",
            "text": "If mandatory law or applicable Merchant of Record buyer terms provide additional rights, those rights remain applicable."
          }
        ]
      },
      {
        "title": "23. CONTACT INFORMATION",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Platform:"
          },
          {
            "type": "paragraph",
            "text": "CORTEXA CRM"
          },
          {
            "type": "paragraph",
            "text": "Legal Business Name:"
          },
          {
            "type": "paragraph",
            "text": "Listo Qasa S.A.S."
          },
          {
            "type": "paragraph",
            "text": "Trade Name / Brand:"
          },
          {
            "type": "paragraph",
            "text": "CORTEXA CRM"
          },
          {
            "type": "paragraph",
            "text": "RUC:"
          },
          {
            "type": "paragraph",
            "text": "1793234655001"
          },
          {
            "type": "paragraph",
            "text": "Country of Registration:"
          },
          {
            "type": "paragraph",
            "text": "Ecuador"
          },
          {
            "type": "paragraph",
            "text": "Support Email:"
          },
          {
            "type": "paragraph",
            "text": "support@cortexaaicrm.com"
          },
          {
            "type": "paragraph",
            "text": "For questions regarding these Terms, billing, subscriptions, platform usage, cancellation, refunds, or legal matters, please contact:"
          },
          {
            "type": "paragraph",
            "text": "support@cortexaaicrm.com"
          }
        ]
      }
    ]
  },

  es: {
    "title": "TÉRMINOS DE SERVICIO",
    "effectiveDate": "Fecha de entrada en vigor: 12 de agosto de 2026",
    "intro": [
      "Estos Términos de Servicio (\"Términos\") regulan el acceso y uso de CORTEXA CRM (\"CORTEXA\", \"Cortexa\", \"nosotros\", \"nuestro\" o \"nos\"), operado por Listo Qasa S.A.S.",
      "Al crear una cuenta, acceder o utilizar CORTEXA, o comprar una suscripción de pago o un complemento, usted acepta estos Términos."
    ],
    "sections": [
      {
        "title": "1. ELEGIBILIDAD",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Usted debe:"
          },
          {
            "type": "list",
            "items": [
              "Tener al menos 18 años.",
              "Operar o representar un negocio legítimo, servicio profesional, organización u otra actividad comercial lícita.",
              "Tener la autoridad legal para celebrar este acuerdo.",
              "Proporcionar información de cuenta y facturación precisa y actualizada."
            ]
          },
          {
            "type": "paragraph",
            "text": "No puede utilizar CORTEXA para actividades ilegales, fraudulentas, abusivas, engañosas, no autorizadas o de otro modo prohibidas."
          }
        ]
      },
      {
        "title": "2. SERVICIOS",
        "blocks": [
          {
            "type": "paragraph",
            "text": "CORTEXA CRM es una plataforma de software empresarial que proporciona herramientas que pueden incluir:"
          },
          {
            "type": "list",
            "items": [
              "Funcionalidad CRM",
              "Gestión de leads y contactos",
              "Gestión de pipeline y oportunidades",
              "Asistencia impulsada por IA",
              "Paneles empresariales",
              "Analítica e informes",
              "Automatización de flujos de trabajo",
              "Tareas y citas",
              "Funcionalidad de calendario",
              "Colaboración en equipo",
              "Gestión de datos de clientes y empresas",
              "Integraciones con terceros",
              "Workspaces adicionales y funcionalidad de complementos"
            ]
          },
          {
            "type": "paragraph",
            "text": "La funcionalidad disponible depende del plan seleccionado por el cliente, los límites de uso aplicables, los Workspaces adquiridos, los complementos, las integraciones y otros derechos de acceso."
          },
          {
            "type": "paragraph",
            "text": "CORTEXA puede modificar, mejorar, añadir, sustituir, suspender o discontinuar funcionalidades periódicamente."
          }
        ]
      },
      {
        "title": "3. RESPONSABILIDAD DE LA CUENTA",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Usted es responsable de:"
          },
          {
            "type": "list",
            "items": [
              "Mantener la seguridad de su cuenta y credenciales.",
              "Toda actividad realizada a través de su cuenta.",
              "Proporcionar información precisa y actualizada.",
              "Mantener controles de acceso adecuados para los usuarios autorizados.",
              "Asegurar que su uso de CORTEXA cumpla con las leyes y regulaciones aplicables."
            ]
          },
          {
            "type": "paragraph",
            "text": "Debe notificar de inmediato a CORTEXA si considera que se ha accedido a su cuenta sin autorización."
          },
          {
            "type": "paragraph",
            "text": "Podemos restringir, suspender o cancelar cuentas involucradas en actividades fraudulentas, abusivas, ilegales, no autorizadas o prohibidas."
          }
        ]
      },
      {
        "title": "4. USO ACEPTABLE",
        "blocks": [
          {
            "type": "paragraph",
            "text": "No puede utilizar CORTEXA para:"
          },
          {
            "type": "list",
            "items": [
              "Participar en fraude o actividades ilegales.",
              "Enviar spam o comunicaciones no autorizadas.",
              "Realizar marketing masivo ilegal o no autorizado.",
              "Violar leyes de privacidad, protección de datos, protección del consumidor o comunicaciones.",
              "Acosar, amenazar, engañar o abusar de otra persona.",
              "Falsear su identidad o negocio.",
              "Recopilar, utilizar o procesar información ilegalmente.",
              "Intentar obtener acceso no autorizado a CORTEXA o a sistemas de terceros.",
              "Eludir restricciones de seguridad, acceso, uso o plan.",
              "Realizar ingeniería inversa, explotar, dañar, interferir o interrumpir la plataforma.",
              "Utilizar integraciones de terceros en violación de los términos del proveedor correspondiente."
            ]
          },
          {
            "type": "paragraph",
            "text": "La violación de esta sección puede resultar en la restricción, suspensión o terminación del acceso."
          }
        ]
      },
      {
        "title": "5. PLANES Y PRECIOS",
        "blocks": [
          
          {
            "type": "subheading",
            "text": "A. SOLO"
          },
          {
            "type": "paragraph",
            "text": "Precio introductorio de activación:"
          },
          {
            "type": "paragraph",
            "text": "$7 USD."
          },
          {
            "type": "paragraph",
            "text": "El plan Solo incluye un período de prueba de 14 días."
          },
          {
            "type": "paragraph",
            "text": "Después del período de prueba de 14 días, la suscripción Solo pasa a ser:"
          },
          {
            "type": "paragraph",
            "text": "$197 USD por mes."
          },
          {
            "type": "paragraph",
            "text": "Salvo que se cancele antes de que venza el primer cargo recurrente, el plan Solo continuará automáticamente a $197 USD por mes."
          },
          {
            "type": "paragraph",
            "text": "El cargo introductorio aplicable, los términos de la prueba, la fecha de renovación y el precio recurrente de la suscripción deben mostrarse al cliente antes del checkout."
          },
          {
            "type": "subheading",
            "text": "B. BUSINESS"
          },
          {
            "type": "paragraph",
            "text": "Precio introductorio de activación:"
          },
          {
            "type": "paragraph",
            "text": "$14 USD."
          },
          {
            "type": "paragraph",
            "text": "El plan Business incluye un período de prueba de 14 días."
          },
          {
            "type": "paragraph",
            "text": "Después del período de prueba de 14 días, la suscripción Business pasa a ser:"
          },
          {
            "type": "paragraph",
            "text": "$347 USD por mes."
          },
          {
            "type": "paragraph",
            "text": "Salvo que se cancele antes de que venza el primer cargo recurrente, el plan Business continuará automáticamente a $347 USD por mes."
          },
          {
            "type": "paragraph",
            "text": "El cargo introductorio aplicable, los términos de la prueba, la fecha de renovación y el precio recurrente de la suscripción deben mostrarse al cliente antes del checkout."
          },
          {
            "type": "subheading",
            "text": "C. SCALE"
          },
          {
            "type": "paragraph",
            "text": "Precio introductorio de activación:"
          },
          {
            "type": "paragraph",
            "text": "$21 USD."
          },
          {
            "type": "paragraph",
            "text": "El plan Scale incluye un período de prueba de 14 días."
          },
          {
            "type": "paragraph",
            "text": "Después del período de prueba de 14 días, la suscripción Scale pasa a ser:"
          },
          {
            "type": "paragraph",
            "text": "$497 USD por mes."
          },
          {
            "type": "paragraph",
            "text": "Salvo que se cancele antes de que venza el primer cargo recurrente, el plan Scale continuará automáticamente a $497 USD por mes."
          },
          {
            "type": "paragraph",
            "text": "El cargo introductorio aplicable, los términos de la prueba, la fecha de renovación y el precio recurrente de la suscripción deben mostrarse al cliente antes del checkout."
          }
        ]
      },
      {
        "title": "6. PRUEBA DE 14 DÍAS Y CARGOS INTRODUCTORIOS DE ACTIVACIÓN",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Solo, Business y Scale incluyen un período de prueba introductorio de 14 días."
          },
          {
            "type": "paragraph",
            "text": "El cargo introductorio de activación aplicable se cobra cuando el cliente selecciona la oferta de pago correspondiente:"
          },
          {
            "type": "list",
            "items": [
              "Solo — $7 USD",
              "Business — $14 USD",
              "Scale — $21 USD"
            ]
          },
          {
            "type": "paragraph",
            "text": "La prueba de 14 días comienza tras la activación exitosa de la oferta de pago correspondiente, salvo que durante el checkout se indique claramente una fecha de inicio diferente."
          },
          {
            "type": "paragraph",
            "text": "El cargo mensual de suscripción no se cobra durante el período de prueba de 14 días."
          },
          {
            "type": "paragraph",
            "text": "Al finalizar el período de prueba, el plan seleccionado se convierte automáticamente en su suscripción mensual recurrente correspondiente, salvo que se cancele antes de que venza el cargo recurrente:"
          },
          {
            "type": "list",
            "items": [
              "Solo — $197/mes",
              "Business — $347/mes",
              "Scale — $497/mes"
            ]
          },
          {
            "type": "paragraph",
            "text": "Antes de completar el checkout, se debe mostrar a los clientes el cargo introductorio aplicable, la duración de la prueba, el importe de la suscripción recurrente y los términos de facturación recurrente."
          },
          {
            "type": "paragraph",
            "text": "Cualquier derecho de cancelación o reembolso está sujeto a la Sección 10 de estos Términos, la Política de Reembolsos de CORTEXA, la legislación aplicable y los términos aplicables del comprador del Merchant of Record."
          }
        ]
      },
      {
        "title": "7. FACTURACIÓN RECURRENTE",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Las suscripciones de pago se renuevan automáticamente según el ciclo de facturación presentado durante el checkout, salvo que se cancelen."
          },
          {
            "type": "paragraph",
            "text": "Al comprar una suscripción recurrente, usted autoriza al proveedor de pagos o Merchant of Record correspondiente a cobrar el importe aplicable de la suscripción cuando venza."
          },
          {
            "type": "paragraph",
            "text": "Para los planes de pago actuales, después de la prueba de 14 días:"
          },
          {
            "type": "list",
            "items": [
              "Solo se renueva a $197 USD por mes.",
              "Business se renueva a $347 USD por mes.",
              "Scale se renueva a $497 USD por mes."
            ]
          },
          {
            "type": "paragraph",
            "text": "Pueden añadirse impuestos aplicables cuando sea obligatorio."
          },
          {
            "type": "paragraph",
            "text": "Los clientes son responsables de mantener información de pago válida."
          },
          {
            "type": "paragraph",
            "text": "Un pago fallido o rechazado puede resultar en restricción, suspensión, degradación o terminación de la funcionalidad de pago de acuerdo con las reglas de facturación aplicables."
          }
        ]
      },
      {
        "title": "8. USO DE IA Y USO JUSTO",
        "blocks": [
          {
            "type": "paragraph",
            "text": "CORTEXA incluye asistencia impulsada por IA y funcionalidad habilitada por IA."
          },
          {
            "type": "paragraph",
            "text": "La disponibilidad y el uso de IA dependen del plan del cliente y de los derechos de producto aplicables."
          },
          {
            "type": "paragraph",
            "text": "El plan Free Forever proporciona un uso limitado de IA."
          },
          {
            "type": "paragraph",
            "text": "Free Forever NO incluye uso ilimitado de IA."
          },
          {
            "type": "paragraph",
            "text": "Los planes de pago pueden proporcionar un uso de IA mayor o ilimitado sujeto a la descripción del plan aplicable, medidas técnicas razonables, requisitos de uso justo, restricciones de seguridad y cualquier limitación divulgada para el servicio correspondiente."
          },
          {
            "type": "paragraph",
            "text": "CORTEXA puede implementar límites de uso razonables cuando sea necesario para mantener la seguridad, el rendimiento, la disponibilidad o la calidad del servicio."
          },
          {
            "type": "paragraph",
            "text": "El procesamiento de volumen inusualmente alto o a escala empresarial puede requerir capacidad adicional, un plan superior o un acuerdo de servicio negociado por separado."
          },
          {
            "type": "paragraph",
            "text": "Los cambios materiales en los términos de uso aplicables a los planes de pago se comunicarán cuando lo exija la ley."
          }
        ]
      },
      {
        "title": "9. WORKSPACES, COMPLEMENTOS Y SERVICIOS ADICIONALES",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Determinados Workspaces, usuarios adicionales, integraciones, funcionalidades u otros servicios de CORTEXA pueden ofrecerse por separado mediante un cargo adicional."
          },
          {
            "type": "paragraph",
            "text": "El precio y los términos de facturación aplicables se informarán antes de la compra."
          },
          {
            "type": "paragraph",
            "text": "La compra de un Workspace o complemento no modifica automáticamente el plan base del cliente, salvo que se indique expresamente durante el checkout."
          },
          {
            "type": "paragraph",
            "text": "Por ejemplo, un cliente de Free Forever que compre un Workspace de pago elegible puede permanecer en el plan base Free Forever mientras recibe acceso al Workspace adquirido por separado."
          },
          {
            "type": "paragraph",
            "text": "Las restricciones y límites de uso del plan base del cliente siguen siendo aplicables salvo que el producto adquirido los modifique expresamente."
          },
          {
            "type": "paragraph",
            "text": "La cancelación de un Workspace o complemento no cancela automáticamente el plan base del cliente ni otros productos activos no relacionados."
          }
        ]
      },
      {
        "title": "10. CANCELACIÓN Y REEMBOLSOS",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Los clientes pueden cancelar suscripciones recurrentes de acuerdo con las opciones de cancelación disponibles a través de CORTEXA, el proveedor de pagos aplicable o el Merchant of Record."
          },
          {
            "type": "paragraph",
            "text": "La cancelación evita futuros cargos recurrentes después de que entre en vigor, pero no elimina ningún derecho obligatorio de cancelación o reembolso previsto por la legislación aplicable."
          },
          {
            "type": "paragraph",
            "text": "La elegibilidad para reembolsos y los derechos de cancelación se rigen por:"
          },
          {
            "type": "list",
            "items": [
              "La Política de Reembolsos de CORTEXA",
              "La legislación aplicable de protección al consumidor",
              "Los términos presentados durante el checkout",
              "Cuando corresponda, los términos del comprador del Merchant of Record que procesa la transacción"
            ]
          },
          {
            "type": "paragraph",
            "text": "Cuando Paddle actúe como Merchant of Record, se aplicarán los derechos de cancelación y reembolso del comprador de Paddle, incluido cualquier período obligatorio de cancelación del consumidor."
          },
          {
            "type": "paragraph",
            "text": "Nada en estos Términos pretende restringir un derecho de reembolso, cancelación, desistimiento u otro derecho del consumidor que legalmente no pueda ser renunciado."
          },
          {
            "type": "paragraph",
            "text": "La Política de Reembolsos específica de CORTEXA debe leerse conjuntamente con estos Términos."
          }
        ]
      },
      {
        "title": "11. BASE DE DATOS DE CONTACTOS Y DATOS DEL CLIENTE",
        "blocks": [
          {
            "type": "paragraph",
            "text": "CORTEXA no cobra únicamente en función del número de contactos almacenados, salvo que se indique expresamente para un plan o servicio concreto."
          },
          {
            "type": "paragraph",
            "text": "Pueden aplicarse límites razonables de almacenamiento, uso, seguridad y plataforma."
          },
          {
            "type": "paragraph",
            "text": "Los clientes conservan la propiedad de los datos de clientes y empresas que proporcionen legalmente a CORTEXA."
          },
          {
            "type": "paragraph",
            "text": "Los clientes son responsables de garantizar que los datos cargados, conectados, importados o procesados a través de CORTEXA:"
          },
          {
            "type": "list",
            "items": [
              "Hayan sido obtenidos legalmente.",
              "Sean procesados legalmente.",
              "Cumplan con las leyes aplicables de privacidad y protección de datos.",
              "No infrinjan los derechos de otra persona.",
              "Se utilicen únicamente para fines legales y autorizados."
            ]
          },
          {
            "type": "paragraph",
            "text": "CORTEXA no vende datos de clientes."
          }
        ]
      },
      {
        "title": "12. SERVICIOS E INTEGRACIONES DE TERCEROS",
        "blocks": [
          {
            "type": "paragraph",
            "text": "CORTEXA puede permitir que los clientes conecten servicios y cuentas de terceros."
          },
          {
            "type": "paragraph",
            "text": "Estos pueden incluir aplicaciones empresariales, servicios de comunicación, herramientas de productividad, servicios en la nube, proveedores de IA, proveedores de pagos y otras integraciones."
          },
          {
            "type": "paragraph",
            "text": "Las cuentas de terceros conectadas a CORTEXA siguen sujetas a los términos, permisos, políticas, restricciones y leyes aplicables del tercero."
          },
          {
            "type": "paragraph",
            "text": "Los clientes son responsables de obtener cualquier autorización o consentimiento necesario para utilizar servicios de terceros."
          },
          {
            "type": "paragraph",
            "text": "CORTEXA no controla los servicios independientes de terceros y no es responsable de:"
          },
          {
            "type": "list",
            "items": [
              "Interrupciones de terceros",
              "Precios de terceros",
              "Cambios en políticas de terceros",
              "Disponibilidad de terceros",
              "Rendimiento de terceros",
              "Prácticas independientes de datos de terceros"
            ]
          },
          {
            "type": "paragraph",
            "text": "La disponibilidad de una integración dentro de CORTEXA no autoriza al cliente a utilizarla ilegalmente o en violación de los términos del proveedor externo."
          }
        ]
      },
      {
        "title": "13. PRIVACIDAD Y PROTECCIÓN DE DATOS",
        "blocks": [
          {
            "type": "paragraph",
            "text": "CORTEXA procesa información personal de acuerdo con su Política de Privacidad y la legislación aplicable."
          },
          {
            "type": "paragraph",
            "text": "Los clientes son responsables de garantizar que la información personal que proporcionen o procesen mediante CORTEXA haya sido recopilada y se utilice legalmente."
          },
          {
            "type": "paragraph",
            "text": "Los clientes deben obtener los avisos, permisos, autorizaciones o consentimientos requeridos por la legislación aplicable para su uso particular de información de clientes o prospectos."
          },
          {
            "type": "paragraph",
            "text": "Para obtener información adicional sobre recopilación, procesamiento, retención, seguridad y derechos de los usuarios, consulte la Política de Privacidad de CORTEXA."
          }
        ]
      },
      {
        "title": "14. PROPIEDAD INTELECTUAL",
        "blocks": [
          {
            "type": "paragraph",
            "text": "El software, la marca, los diseños de plataforma, las interfaces, la funcionalidad, los flujos de trabajo, la documentación, el contenido y la tecnología de CORTEXA siguen siendo propiedad de Listo Qasa S.A.S. o de sus licenciantes correspondientes."
          },
          {
            "type": "paragraph",
            "text": "Salvo cuando esté expresamente permitido, los clientes no pueden:"
          },
          {
            "type": "list",
            "items": [
              "Copiar",
              "Reproducir",
              "Distribuir",
              "Modificar",
              "Revender",
              "Realizar ingeniería inversa",
              "Eludir protecciones técnicas",
              "Crear obras derivadas no autorizadas"
            ]
          },
          {
            "type": "paragraph",
            "text": "Nada en estos Términos transfiere al cliente la propiedad intelectual de CORTEXA."
          }
        ]
      },
      {
        "title": "15. DISPONIBILIDAD DEL SERVICIO",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Trabajamos para proporcionar un servicio fiable, pero no garantizamos un funcionamiento ininterrumpido o libre de errores."
          },
          {
            "type": "paragraph",
            "text": "La disponibilidad puede verse afectada por:"
          },
          {
            "type": "list",
            "items": [
              "Mantenimiento",
              "Actualizaciones de software",
              "Problemas de infraestructura",
              "Interrupciones de terceros",
              "Fallos de Internet o telecomunicaciones",
              "Eventos de seguridad",
              "Eventos fuera de nuestro control razonable"
            ]
          },
          {
            "type": "paragraph",
            "text": "CORTEXA puede realizar mantenimiento o efectuar cambios necesarios para mantener la seguridad, estabilidad, funcionalidad o cumplimiento de la plataforma."
          }
        ]
      },
      {
        "title": "16. LIMITACIÓN DE RESPONSABILIDAD",
        "blocks": [
          {
            "type": "paragraph",
            "text": "En la máxima medida permitida por la legislación aplicable, CORTEXA y Listo Qasa S.A.S. no serán responsables de:"
          },
          {
            "type": "list",
            "items": [
              "Pérdida de beneficios",
              "Pérdida de ingresos",
              "Pérdida de oportunidades comerciales",
              "Pérdida de datos",
              "Interrupción del negocio",
              "Daños indirectos",
              "Daños consecuentes",
              "Daños especiales o incidentales"
            ]
          },
          {
            "type": "paragraph",
            "text": "En la medida permitida por la legislación aplicable, nuestra responsabilidad total derivada de los Servicios no excederá el importe pagado por el cliente a CORTEXA por los Servicios aplicables durante los doce (12) meses anteriores."
          },
          {
            "type": "paragraph",
            "text": "Nada en estos Términos excluye o limita responsabilidades, garantías legales, protecciones del consumidor u otros derechos que legalmente no puedan excluirse o limitarse."
          }
        ]
      },
      {
        "title": "17. INDEMNIZACIÓN",
        "blocks": [
          {
            "type": "paragraph",
            "text": "En la medida permitida por la legislación aplicable, usted acepta defender, indemnizar y mantener indemnes a Listo Qasa S.A.S., CORTEXA y sus respectivos propietarios, empleados, contratistas y afiliados frente a reclamaciones derivadas de:"
          },
          {
            "type": "list",
            "items": [
              "Su uso ilegal o no autorizado de CORTEXA.",
              "Su contenido o datos.",
              "Su violación de estos Términos.",
              "Su violación de la legislación aplicable.",
              "Su infracción de los derechos de otra persona."
            ]
          }
        ]
      },
      {
        "title": "18. SUSPENSIÓN Y TERMINACIÓN",
        "blocks": [
          {
            "type": "paragraph",
            "text": "CORTEXA puede restringir, suspender o cancelar una cuenta cuando corresponda debido a:"
          },
          {
            "type": "list",
            "items": [
              "Violación de estos Términos",
              "Actividad fraudulenta",
              "Abuso de la plataforma",
              "Problemas de seguridad",
              "Requisitos legales o regulatorios",
              "Falta de pago",
              "Acceso o uso no autorizado",
              "Violaciones materiales de requisitos aplicables de terceros"
            ]
          },
          {
            "type": "paragraph",
            "text": "La terminación puede producirse con o sin aviso previo cuando esté legalmente permitido y sea apropiado según las circunstancias."
          },
          {
            "type": "paragraph",
            "text": "La terminación no elimina las obligaciones de pago ya contraídas legalmente."
          }
        ]
      },
      {
        "title": "19. CAMBIOS EN LOS PLANES O SERVICIOS",
        "blocks": [
          {
            "type": "paragraph",
            "text": "CORTEXA puede actualizar sus productos, funcionalidades, planes, precios, límites de uso y servicios a medida que evoluciona la plataforma."
          },
          {
            "type": "paragraph",
            "text": "Los clientes de pago existentes recibirán aviso de cambios materiales de precios cuando lo exija la legislación aplicable."
          },
          {
            "type": "paragraph",
            "text": "Los cambios no eliminarán derechos contractuales o del consumidor obligatorios."
          }
        ]
      },
      {
        "title": "20. CAMBIOS EN ESTOS TÉRMINOS",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Podemos actualizar estos Términos periódicamente."
          },
          {
            "type": "paragraph",
            "text": "La versión vigente y la fecha de entrada en vigor se publicarán a través del sitio web o la plataforma de CORTEXA."
          },
          {
            "type": "paragraph",
            "text": "Cuando lo exija la ley, proporcionaremos un aviso adecuado de los cambios materiales."
          },
          {
            "type": "paragraph",
            "text": "El uso continuado después de que entren en vigor los Términos revisados constituye la aceptación de dichos Términos en la medida permitida por la legislación aplicable."
          }
        ]
      },
      {
        "title": "21. LEGISLACIÓN APLICABLE",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Estos Términos se rigen por la legislación aplicable, sujetos a las protecciones obligatorias del consumidor, derechos jurisdiccionales u otros derechos legales que puedan corresponder según la ubicación del cliente."
          },
          {
            "type": "paragraph",
            "text": "Nada en estos Términos elimina derechos que legalmente no puedan ser renunciados."
          }
        ]
      },
      {
        "title": "22. ACUERDO COMPLETO",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Estos Términos, junto con la Política de Privacidad, la Política de Reembolsos, las divulgaciones aplicables del checkout, las descripciones de los planes y cualquier término adicional expresamente aplicable a un servicio adquirido, constituyen el acuerdo que regula el uso y la compra de los servicios de CORTEXA."
          },
          {
            "type": "paragraph",
            "text": "Si la legislación obligatoria o los términos aplicables del comprador del Merchant of Record proporcionan derechos adicionales, dichos derechos seguirán siendo aplicables."
          }
        ]
      },
      {
        "title": "23. INFORMACIÓN DE CONTACTO",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Plataforma:"
          },
          {
            "type": "paragraph",
            "text": "CORTEXA CRM"
          },
          {
            "type": "paragraph",
            "text": "Nombre legal de la empresa:"
          },
          {
            "type": "paragraph",
            "text": "Listo Qasa S.A.S."
          },
          {
            "type": "paragraph",
            "text": "Nombre comercial / Marca:"
          },
          {
            "type": "paragraph",
            "text": "CORTEXA CRM"
          },
          {
            "type": "paragraph",
            "text": "RUC:"
          },
          {
            "type": "paragraph",
            "text": "1793234655001"
          },
          {
            "type": "paragraph",
            "text": "País de registro:"
          },
          {
            "type": "paragraph",
            "text": "Ecuador"
          },
          {
            "type": "paragraph",
            "text": "Correo electrónico de soporte:"
          },
          {
            "type": "paragraph",
            "text": "support@cortexaaicrm.com"
          },
          {
            "type": "paragraph",
            "text": "Para preguntas sobre estos Términos, facturación, suscripciones, uso de la plataforma, cancelación, reembolsos o asuntos legales, comuníquese con:"
          },
          {
            "type": "paragraph",
            "text": "support@cortexaaicrm.com"
          }
        ]
      }
    ]
  },

  pt: {
    "title": "TERMOS DE SERVIÇO",
    "effectiveDate": "Data de vigência: 12 de agosto de 2026",
    "intro": [
      "Estes Termos de Serviço (\"Termos\") regem o acesso e o uso do CORTEXA CRM (\"CORTEXA\", \"Cortexa\", \"nós\", \"nosso\" ou \"nos\"), operado pela Listo Qasa S.A.S.",
      "Ao criar uma conta, acessar ou usar o CORTEXA, ou adquirir uma assinatura paga ou complemento, você concorda com estes Termos."
    ],
    "sections": [
      {
        "title": "1. ELEGIBILIDADE",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Você deve:"
          },
          {
            "type": "list",
            "items": [
              "Ter pelo menos 18 anos.",
              "Operar ou representar um negócio legítimo, serviço profissional, organização ou outra atividade comercial lícita.",
              "Ter autoridade legal para celebrar este acordo.",
              "Fornecer informações de conta e cobrança precisas e atualizadas."
            ]
          },
          {
            "type": "paragraph",
            "text": "Você não pode usar o CORTEXA para atividades ilegais, fraudulentas, abusivas, enganosas, não autorizadas ou de outra forma proibidas."
          }
        ]
      },
      {
        "title": "2. SERVIÇOS",
        "blocks": [
          {
            "type": "paragraph",
            "text": "O CORTEXA CRM é uma plataforma de software empresarial que fornece ferramentas que podem incluir:"
          },
          {
            "type": "list",
            "items": [
              "Funcionalidade de CRM",
              "Gestão de leads e contatos",
              "Gestão de pipeline e oportunidades",
              "Assistência com IA",
              "Dashboards empresariais",
              "Análises e relatórios",
              "Automação de fluxos de trabalho",
              "Tarefas e compromissos",
              "Funcionalidade de calendário",
              "Colaboração em equipe",
              "Gestão de dados de clientes e empresas",
              "Integrações com terceiros",
              "Workspaces adicionais e funcionalidades de complementos"
            ]
          },
          {
            "type": "paragraph",
            "text": "A funcionalidade disponível depende do plano selecionado pelo cliente, dos limites de uso aplicáveis, dos Workspaces adquiridos, complementos, integrações e outros direitos de acesso."
          },
          {
            "type": "paragraph",
            "text": "O CORTEXA pode modificar, melhorar, adicionar, substituir, suspender ou descontinuar funcionalidades periodicamente."
          }
        ]
      },
      {
        "title": "3. RESPONSABILIDADE DA CONTA",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Você é responsável por:"
          },
          {
            "type": "list",
            "items": [
              "Manter a segurança da sua conta e credenciais.",
              "Toda atividade realizada por meio da sua conta.",
              "Fornecer informações precisas e atualizadas.",
              "Manter controles de acesso adequados para usuários autorizados.",
              "Garantir que seu uso do CORTEXA esteja em conformidade com as leis e regulamentos aplicáveis."
            ]
          },
          {
            "type": "paragraph",
            "text": "Você deve notificar imediatamente o CORTEXA se acreditar que sua conta foi acessada sem autorização."
          },
          {
            "type": "paragraph",
            "text": "Podemos restringir, suspender ou encerrar contas envolvidas em atividades fraudulentas, abusivas, ilegais, não autorizadas ou proibidas."
          }
        ]
      },
      {
        "title": "4. USO ACEITÁVEL",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Você não pode usar o CORTEXA para:"
          },
          {
            "type": "list",
            "items": [
              "Praticar fraude ou atividade ilegal.",
              "Enviar spam ou comunicações não autorizadas.",
              "Realizar marketing em massa ilegal ou não autorizado.",
              "Violar leis de privacidade, proteção de dados, proteção ao consumidor ou comunicações.",
              "Assediar, ameaçar, enganar ou abusar de outra pessoa.",
              "Deturpar sua identidade ou negócio.",
              "Coletar, usar ou processar informações ilegalmente.",
              "Tentar obter acesso não autorizado ao CORTEXA ou a sistemas de terceiros.",
              "Contornar restrições de segurança, acesso, uso ou plano.",
              "Realizar engenharia reversa, explorar, danificar, interferir ou interromper a plataforma.",
              "Usar integrações de terceiros em violação dos termos do respectivo provedor."
            ]
          },
          {
            "type": "paragraph",
            "text": "A violação desta seção pode resultar em restrição, suspensão ou encerramento do acesso."
          }
        ]
      },
      {
        "title": "5. PLANOS E PREÇOS",
        "blocks": [
          
          {
            "type": "subheading",
            "text": "A. SOLO"
          },
          {
            "type": "paragraph",
            "text": "Preço introdutório de ativação:"
          },
          {
            "type": "paragraph",
            "text": "$7 USD."
          },
          {
            "type": "paragraph",
            "text": "O plano Solo inclui um período de teste de 14 dias."
          },
          {
            "type": "paragraph",
            "text": "Após o período de teste de 14 dias, a assinatura Solo passa a ser:"
          },
          {
            "type": "paragraph",
            "text": "$197 USD por mês."
          },
          {
            "type": "paragraph",
            "text": "Salvo cancelamento antes do vencimento da primeira cobrança recorrente, o plano Solo continuará automaticamente por $197 USD por mês."
          },
          {
            "type": "paragraph",
            "text": "A cobrança introdutória aplicável, os termos do teste, a data de renovação e o preço recorrente da assinatura devem ser exibidos ao cliente antes do checkout."
          },
          {
            "type": "subheading",
            "text": "B. BUSINESS"
          },
          {
            "type": "paragraph",
            "text": "Preço introdutório de ativação:"
          },
          {
            "type": "paragraph",
            "text": "$14 USD."
          },
          {
            "type": "paragraph",
            "text": "O plano Business inclui um período de teste de 14 dias."
          },
          {
            "type": "paragraph",
            "text": "Após o período de teste de 14 dias, a assinatura Business passa a ser:"
          },
          {
            "type": "paragraph",
            "text": "$347 USD por mês."
          },
          {
            "type": "paragraph",
            "text": "Salvo cancelamento antes do vencimento da primeira cobrança recorrente, o plano Business continuará automaticamente por $347 USD por mês."
          },
          {
            "type": "paragraph",
            "text": "A cobrança introdutória aplicável, os termos do teste, a data de renovação e o preço recorrente da assinatura devem ser exibidos ao cliente antes do checkout."
          },
          {
            "type": "subheading",
            "text": "C. SCALE"
          },
          {
            "type": "paragraph",
            "text": "Preço introdutório de ativação:"
          },
          {
            "type": "paragraph",
            "text": "$21 USD."
          },
          {
            "type": "paragraph",
            "text": "O plano Scale inclui um período de teste de 14 dias."
          },
          {
            "type": "paragraph",
            "text": "Após o período de teste de 14 dias, a assinatura Scale passa a ser:"
          },
          {
            "type": "paragraph",
            "text": "$497 USD por mês."
          },
          {
            "type": "paragraph",
            "text": "Salvo cancelamento antes do vencimento da primeira cobrança recorrente, o plano Scale continuará automaticamente por $497 USD por mês."
          },
          {
            "type": "paragraph",
            "text": "A cobrança introdutória aplicável, os termos do teste, a data de renovação e o preço recorrente da assinatura devem ser exibidos ao cliente antes do checkout."
          }
        ]
      },
      {
        "title": "6. TESTE DE 14 DIAS E COBRANÇAS INTRODUTÓRIAS DE ATIVAÇÃO",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Solo, Business e Scale incluem um período de teste introdutório de 14 dias."
          },
          {
            "type": "paragraph",
            "text": "A cobrança introdutória de ativação aplicável é feita quando o cliente seleciona a oferta paga correspondente:"
          },
          {
            "type": "list",
            "items": [
              "Solo — $7 USD",
              "Business — $14 USD",
              "Scale — $21 USD"
            ]
          },
          {
            "type": "paragraph",
            "text": "O teste de 14 dias começa após a ativação bem-sucedida da oferta paga aplicável, salvo se uma data de início diferente for claramente informada durante o checkout."
          },
          {
            "type": "paragraph",
            "text": "A cobrança mensal da assinatura não é feita durante o período de teste de 14 dias."
          },
          {
            "type": "paragraph",
            "text": "Ao final do período de teste, o plano selecionado converte-se automaticamente na assinatura mensal recorrente aplicável, salvo cancelamento antes do vencimento da cobrança recorrente:"
          },
          {
            "type": "list",
            "items": [
              "Solo — $197/mês",
              "Business — $347/mês",
              "Scale — $497/mês"
            ]
          },
          {
            "type": "paragraph",
            "text": "Antes de concluir o checkout, os clientes devem visualizar a cobrança introdutória aplicável, a duração do teste, o valor da assinatura recorrente e os termos de cobrança recorrente."
          },
          {
            "type": "paragraph",
            "text": "Quaisquer direitos de cancelamento ou reembolso estão sujeitos à Seção 10 destes Termos, à Política de Reembolso do CORTEXA, à legislação aplicável e aos termos aplicáveis do comprador do Merchant of Record."
          }
        ]
      },
      {
        "title": "7. COBRANÇA RECORRENTE",
        "blocks": [
          {
            "type": "paragraph",
            "text": "As assinaturas pagas são renovadas automaticamente de acordo com o ciclo de cobrança apresentado durante o checkout, salvo cancelamento."
          },
          {
            "type": "paragraph",
            "text": "Ao adquirir uma assinatura recorrente, você autoriza o provedor de pagamento ou Merchant of Record aplicável a cobrar o valor da assinatura quando devido."
          },
          {
            "type": "paragraph",
            "text": "Para os planos pagos atuais, após o teste de 14 dias:"
          },
          {
            "type": "list",
            "items": [
              "Solo renova por $197 USD por mês.",
              "Business renova por $347 USD por mês.",
              "Scale renova por $497 USD por mês."
            ]
          },
          {
            "type": "paragraph",
            "text": "Impostos aplicáveis podem ser adicionados quando exigido."
          },
          {
            "type": "paragraph",
            "text": "Os clientes são responsáveis por manter informações de pagamento válidas."
          },
          {
            "type": "paragraph",
            "text": "Um pagamento recusado ou não realizado pode resultar em restrição, suspensão, downgrade ou encerramento da funcionalidade paga de acordo com as regras de cobrança aplicáveis."
          }
        ]
      },
      {
        "title": "8. USO DE IA E USO JUSTO",
        "blocks": [
          {
            "type": "paragraph",
            "text": "O CORTEXA inclui assistência com IA e funcionalidades habilitadas por IA."
          },
          {
            "type": "paragraph",
            "text": "A disponibilidade e o uso de IA dependem do plano do cliente e dos direitos de produto aplicáveis."
          },
          {
            "type": "paragraph",
            "text": "O plano Free Forever oferece uso limitado de IA."
          },
          {
            "type": "paragraph",
            "text": "O Free Forever NÃO inclui uso ilimitado de IA."
          },
          {
            "type": "paragraph",
            "text": "Os planos pagos podem oferecer uso maior ou ilimitado de IA, sujeito à descrição do plano aplicável, salvaguardas técnicas razoáveis, requisitos de uso justo, restrições de segurança e quaisquer limitações divulgadas para o serviço aplicável."
          },
          {
            "type": "paragraph",
            "text": "O CORTEXA pode implementar limites de uso razoáveis quando necessário para manter segurança, desempenho, disponibilidade ou qualidade do serviço."
          },
          {
            "type": "paragraph",
            "text": "Processamento de volume excepcionalmente alto ou em escala empresarial pode exigir capacidade adicional, um plano superior ou um acordo de serviço negociado separadamente."
          },
          {
            "type": "paragraph",
            "text": "Alterações materiais nos termos de uso aplicáveis aos planos pagos serão comunicadas quando exigido por lei."
          }
        ]
      },
      {
        "title": "9. WORKSPACES, COMPLEMENTOS E SERVIÇOS ADICIONAIS",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Determinados Workspaces, usuários adicionais, integrações, funcionalidades ou outros serviços do CORTEXA podem ser oferecidos separadamente mediante cobrança adicional."
          },
          {
            "type": "paragraph",
            "text": "O preço e os termos de cobrança aplicáveis serão informados antes da compra."
          },
          {
            "type": "paragraph",
            "text": "A compra de um Workspace ou complemento não altera automaticamente o plano base do cliente, salvo indicação expressa durante o checkout."
          },
          {
            "type": "paragraph",
            "text": "Por exemplo, um cliente Free Forever que adquira um Workspace pago elegível pode permanecer no plano base Free Forever enquanto recebe acesso ao Workspace adquirido separadamente."
          },
          {
            "type": "paragraph",
            "text": "As restrições e limites de uso do plano base do cliente permanecem aplicáveis, salvo se expressamente modificados pelo produto adquirido."
          },
          {
            "type": "paragraph",
            "text": "O cancelamento de um Workspace ou complemento não cancela automaticamente o plano base do cliente nem produtos ativos não relacionados."
          }
        ]
      },
      {
        "title": "10. CANCELAMENTO E REEMBOLSOS",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Os clientes podem cancelar assinaturas recorrentes de acordo com as opções de cancelamento disponíveis por meio do CORTEXA, do provedor de pagamento aplicável ou do Merchant of Record."
          },
          {
            "type": "paragraph",
            "text": "O cancelamento impede futuras cobranças recorrentes após entrar em vigor, mas não remove direitos obrigatórios de cancelamento ou reembolso previstos pela legislação aplicável."
          },
          {
            "type": "paragraph",
            "text": "A elegibilidade para reembolso e os direitos de cancelamento são regidos por:"
          },
          {
            "type": "list",
            "items": [
              "A Política de Reembolso do CORTEXA",
              "A legislação aplicável de proteção ao consumidor",
              "Os termos apresentados durante o checkout",
              "Quando aplicável, os termos do comprador do Merchant of Record que processa a transação"
            ]
          },
          {
            "type": "paragraph",
            "text": "Quando a Paddle atuar como Merchant of Record, serão aplicáveis os direitos de cancelamento e reembolso do comprador da Paddle, incluindo qualquer período obrigatório de cancelamento do consumidor."
          },
          {
            "type": "paragraph",
            "text": "Nada nestes Termos pretende restringir um direito de reembolso, cancelamento, desistência ou outro direito do consumidor que legalmente não possa ser renunciado."
          },
          {
            "type": "paragraph",
            "text": "A Política de Reembolso específica do CORTEXA deve ser lida em conjunto com estes Termos."
          }
        ]
      },
      {
        "title": "11. BANCO DE DADOS DE CONTATOS E DADOS DO CLIENTE",
        "blocks": [
          {
            "type": "paragraph",
            "text": "O CORTEXA não cobra exclusivamente de acordo com o número de contatos armazenados, salvo indicação expressa para determinado plano ou serviço."
          },
          {
            "type": "paragraph",
            "text": "Podem ser aplicados limites razoáveis de armazenamento, uso, segurança e plataforma."
          },
          {
            "type": "paragraph",
            "text": "Os clientes mantêm a propriedade dos dados de clientes e empresas que fornecem legalmente ao CORTEXA."
          },
          {
            "type": "paragraph",
            "text": "Os clientes são responsáveis por garantir que os dados carregados, conectados, importados ou processados por meio do CORTEXA:"
          },
          {
            "type": "list",
            "items": [
              "Tenham sido obtidos legalmente.",
              "Sejam processados legalmente.",
              "Estejam em conformidade com as leis aplicáveis de privacidade e proteção de dados.",
              "Não infrinjam os direitos de outra pessoa.",
              "Sejam usados apenas para fins legais e autorizados."
            ]
          },
          {
            "type": "paragraph",
            "text": "O CORTEXA não vende dados de clientes."
          }
        ]
      },
      {
        "title": "12. SERVIÇOS E INTEGRAÇÕES DE TERCEIROS",
        "blocks": [
          {
            "type": "paragraph",
            "text": "O CORTEXA pode permitir que os clientes conectem serviços e contas de terceiros."
          },
          {
            "type": "paragraph",
            "text": "Isso pode incluir aplicativos empresariais, serviços de comunicação, ferramentas de produtividade, serviços em nuvem, provedores de IA, provedores de pagamento e outras integrações."
          },
          {
            "type": "paragraph",
            "text": "As contas de terceiros conectadas ao CORTEXA permanecem sujeitas aos próprios termos, permissões, políticas, restrições e leis aplicáveis do terceiro."
          },
          {
            "type": "paragraph",
            "text": "Os clientes são responsáveis por obter qualquer autorização ou consentimento necessário para o uso de serviços de terceiros."
          },
          {
            "type": "paragraph",
            "text": "O CORTEXA não controla serviços independentes de terceiros e não é responsável por:"
          },
          {
            "type": "list",
            "items": [
              "Indisponibilidade de terceiros",
              "Preços de terceiros",
              "Alterações nas políticas de terceiros",
              "Disponibilidade de terceiros",
              "Desempenho de terceiros",
              "Práticas independentes de dados de terceiros"
            ]
          },
          {
            "type": "paragraph",
            "text": "A disponibilidade de uma integração no CORTEXA não autoriza o cliente a usá-la ilegalmente ou em violação dos termos do provedor terceiro."
          }
        ]
      },
      {
        "title": "13. PRIVACIDADE E PROTEÇÃO DE DADOS",
        "blocks": [
          {
            "type": "paragraph",
            "text": "O CORTEXA processa informações pessoais de acordo com sua Política de Privacidade e a legislação aplicável."
          },
          {
            "type": "paragraph",
            "text": "Os clientes são responsáveis por garantir que as informações pessoais fornecidas ou processadas por meio do CORTEXA tenham sido coletadas e sejam usadas legalmente."
          },
          {
            "type": "paragraph",
            "text": "Os clientes devem obter quaisquer avisos, permissões, autorizações ou consentimentos exigidos pela legislação aplicável para seu uso específico de informações de clientes ou prospects."
          },
          {
            "type": "paragraph",
            "text": "Para informações adicionais sobre coleta, processamento, retenção, segurança e direitos dos usuários, consulte a Política de Privacidade do CORTEXA."
          }
        ]
      },
      {
        "title": "14. PROPRIEDADE INTELECTUAL",
        "blocks": [
          {
            "type": "paragraph",
            "text": "O software, marca, designs da plataforma, interfaces, funcionalidades, fluxos de trabalho, documentação, conteúdo e tecnologia do CORTEXA permanecem propriedade da Listo Qasa S.A.S. ou de seus licenciadores aplicáveis."
          },
          {
            "type": "paragraph",
            "text": "Exceto quando expressamente permitido, os clientes não podem:"
          },
          {
            "type": "list",
            "items": [
              "Copiar",
              "Reproduzir",
              "Distribuir",
              "Modificar",
              "Revender",
              "Realizar engenharia reversa",
              "Contornar proteções técnicas",
              "Criar obras derivadas não autorizadas"
            ]
          },
          {
            "type": "paragraph",
            "text": "Nada nestes Termos transfere a propriedade intelectual do CORTEXA ao cliente."
          }
        ]
      },
      {
        "title": "15. DISPONIBILIDADE DO SERVIÇO",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Trabalhamos para fornecer um serviço confiável, mas não garantimos operação ininterrupta ou livre de erros."
          },
          {
            "type": "paragraph",
            "text": "A disponibilidade pode ser afetada por:"
          },
          {
            "type": "list",
            "items": [
              "Manutenção",
              "Atualizações de software",
              "Problemas de infraestrutura",
              "Indisponibilidade de terceiros",
              "Falhas de Internet ou telecomunicações",
              "Eventos de segurança",
              "Eventos além do nosso controle razoável"
            ]
          },
          {
            "type": "paragraph",
            "text": "O CORTEXA pode realizar manutenção ou fazer alterações necessárias para manter a segurança, estabilidade, funcionalidade ou conformidade da plataforma."
          }
        ]
      },
      {
        "title": "16. LIMITAÇÃO DE RESPONSABILIDADE",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Na máxima extensão permitida pela legislação aplicável, CORTEXA e Listo Qasa S.A.S. não serão responsáveis por:"
          },
          {
            "type": "list",
            "items": [
              "Perda de lucros",
              "Perda de receita",
              "Perda de oportunidades de negócios",
              "Perda de dados",
              "Interrupção dos negócios",
              "Danos indiretos",
              "Danos consequenciais",
              "Danos especiais ou incidentais"
            ]
          },
          {
            "type": "paragraph",
            "text": "Na medida permitida pela legislação aplicável, nossa responsabilidade agregada decorrente dos Serviços não excederá o valor pago pelo cliente ao CORTEXA pelos Serviços aplicáveis durante os doze (12) meses anteriores."
          },
          {
            "type": "paragraph",
            "text": "Nada nestes Termos exclui ou limita responsabilidades, garantias legais, proteções ao consumidor ou outros direitos que legalmente não possam ser excluídos ou limitados."
          }
        ]
      },
      {
        "title": "17. INDENIZAÇÃO",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Na medida permitida pela legislação aplicável, você concorda em defender, indenizar e isentar a Listo Qasa S.A.S., CORTEXA e seus respectivos proprietários, funcionários, contratados e afiliados de reclamações decorrentes de:"
          },
          {
            "type": "list",
            "items": [
              "Seu uso ilegal ou não autorizado do CORTEXA.",
              "Seu conteúdo ou dados.",
              "Sua violação destes Termos.",
              "Sua violação da legislação aplicável.",
              "Sua violação dos direitos de outra pessoa."
            ]
          }
        ]
      },
      {
        "title": "18. SUSPENSÃO E ENCERRAMENTO",
        "blocks": [
          {
            "type": "paragraph",
            "text": "O CORTEXA pode restringir, suspender ou encerrar uma conta quando apropriado devido a:"
          },
          {
            "type": "list",
            "items": [
              "Violação destes Termos",
              "Atividade fraudulenta",
              "Abuso da plataforma",
              "Preocupações de segurança",
              "Requisitos legais ou regulatórios",
              "Falta de pagamento",
              "Acesso ou uso não autorizado",
              "Violações materiais de requisitos aplicáveis de terceiros"
            ]
          },
          {
            "type": "paragraph",
            "text": "O encerramento pode ocorrer com ou sem aviso prévio quando legalmente permitido e apropriado às circunstâncias."
          },
          {
            "type": "paragraph",
            "text": "O encerramento não elimina obrigações de pagamento já legalmente incorridas."
          }
        ]
      },
      {
        "title": "19. ALTERAÇÕES NOS PLANOS OU SERVIÇOS",
        "blocks": [
          {
            "type": "paragraph",
            "text": "O CORTEXA pode atualizar seus produtos, funcionalidades, planos, preços, limites de uso e serviços à medida que a plataforma evolui."
          },
          {
            "type": "paragraph",
            "text": "Clientes pagos existentes receberão aviso de alterações materiais de preços quando exigido pela legislação aplicável."
          },
          {
            "type": "paragraph",
            "text": "As alterações não eliminarão direitos contratuais ou do consumidor obrigatórios."
          }
        ]
      },
      {
        "title": "20. ALTERAÇÕES NESTES TERMOS",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Podemos atualizar estes Termos periodicamente."
          },
          {
            "type": "paragraph",
            "text": "A versão atual e a data de vigência serão publicadas por meio do site ou da plataforma CORTEXA."
          },
          {
            "type": "paragraph",
            "text": "Quando exigido por lei, forneceremos aviso adequado sobre alterações materiais."
          },
          {
            "type": "paragraph",
            "text": "O uso contínuo após a entrada em vigor dos Termos revisados constitui aceitação desses Termos na medida permitida pela legislação aplicável."
          }
        ]
      },
      {
        "title": "21. LEI APLICÁVEL",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Estes Termos são regidos pela legislação aplicável, sujeitos às proteções obrigatórias ao consumidor, direitos jurisdicionais ou outros direitos legais que possam ser aplicáveis com base na localização do cliente."
          },
          {
            "type": "paragraph",
            "text": "Nada nestes Termos remove direitos que legalmente não possam ser renunciados."
          }
        ]
      },
      {
        "title": "22. ACORDO INTEGRAL",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Estes Termos, juntamente com a Política de Privacidade, Política de Reembolso, divulgações aplicáveis do checkout, descrições dos planos e quaisquer termos adicionais expressamente aplicáveis a um serviço adquirido, constituem o acordo que rege o uso e a compra dos serviços CORTEXA."
          },
          {
            "type": "paragraph",
            "text": "Se a legislação obrigatória ou os termos aplicáveis do comprador do Merchant of Record fornecerem direitos adicionais, esses direitos permanecerão aplicáveis."
          }
        ]
      },
      {
        "title": "23. INFORMAÇÕES DE CONTATO",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Plataforma:"
          },
          {
            "type": "paragraph",
            "text": "CORTEXA CRM"
          },
          {
            "type": "paragraph",
            "text": "Nome jurídico da empresa:"
          },
          {
            "type": "paragraph",
            "text": "Listo Qasa S.A.S."
          },
          {
            "type": "paragraph",
            "text": "Nome comercial / Marca:"
          },
          {
            "type": "paragraph",
            "text": "CORTEXA CRM"
          },
          {
            "type": "paragraph",
            "text": "RUC:"
          },
          {
            "type": "paragraph",
            "text": "1793234655001"
          },
          {
            "type": "paragraph",
            "text": "País de registro:"
          },
          {
            "type": "paragraph",
            "text": "Equador"
          },
          {
            "type": "paragraph",
            "text": "E-mail de suporte:"
          },
          {
            "type": "paragraph",
            "text": "support@cortexaaicrm.com"
          },
          {
            "type": "paragraph",
            "text": "Para dúvidas sobre estes Termos, cobrança, assinaturas, uso da plataforma, cancelamento, reembolsos ou assuntos jurídicos, entre em contato com:"
          },
          {
            "type": "paragraph",
            "text": "support@cortexaaicrm.com"
          }
        ]
      }
    ]
  },
};

function Section({ section }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>{section.title}</h2>

      {section.blocks ? (
        section.blocks.map((block, index) => {
          if (block.type === "subheading") {
            return (
              <h3 key={`block-${index}`} style={styles.subheading}>
                {block.text}
              </h3>
            );
          }

          if (block.type === "list") {
            return (
              <ul key={`block-${index}`} style={styles.ul}>
                {block.items.map((item, itemIndex) => (
                  <li key={`${item}-${itemIndex}`}>{item}</li>
                ))}
              </ul>
            );
          }

          return <p key={`block-${index}`}>{block.text}</p>;
        })
      ) : (
        <>
          {(section.paragraphs || []).map((text, index) => (
            <p key={`p-${index}`}>{text}</p>
          ))}

          {(section.groups || []).map((group, index) => (
            <div key={`group-${index}`}>
              <p style={styles.groupTitle}>
                <strong>{group.heading}</strong>
              </p>
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
            <p key={label}>
              <strong>{label}:</strong> {value}
            </p>
          ))}

          {(section.after || []).map((text, index) => (
            <p key={`after-${index}`}>{text}</p>
          ))}
        </>
      )}
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
        {Array.isArray(tr.intro) ? (
          tr.intro.map((paragraph, index) => (
            <p key={`intro-${index}`}>{paragraph}</p>
          ))
        ) : (
          <p>{tr.intro}</p>
        )}

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
  subheading: {
    fontSize: "17px",
    fontWeight: 700,
    color: "#111827",
    marginTop: "22px",
    marginBottom: "8px",
  },
  ul: {
    paddingLeft: "24px",
    marginTop: "8px",
    marginBottom: "12px",
  },
};