import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  Calculator,
  LineChart,
  Menu,
  MessageSquareText,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { trackEvent } from "../../utils/track";
import headlogo from "../../assets/cortexa/headlogo.png";
import footlogo from "../../assets/cortexa/p-flogo.png";
import whyImg from "../../assets/cortexa/why.jpg";
import why1Img from "../../assets/cortexa/why1.jpg";
import why2Img from "../../assets/cortexa/why2.jpg";
import why3Img from "../../assets/cortexa/why3.jpg";
import why4Img from "../../assets/cortexa/why4.jpg";
import why5Img from "../../assets/cortexa/why5.jpg";
import why6Img from "../../assets/cortexa/why5.jpg";
import CostComparison from "./CostComparison";
import "./Editorial.css";

const ARTICLE_SECTIONS = [
  { id: "legacy-crm", label: "O fim do CRM tradicional?" },
  {
    id: "revenue-operations",
    label: "Da gestão de relacionamento com clientes às operações de receita",
  },
  { id: "legacy-crm-tax", label: "O custo oculto do CRM tradicional" },
  {
    id: "different-question",
    label: "As empresas estão fazendo uma pergunta diferente",
  },
  { id: "transparent-setup", label: "Configuração transparente" },
  { id: "business-value", label: "Gerando valor para o negócio mais cedo" },
  {
    id: "one-platform",
    label: "Uma plataforma versus várias ferramentas desconectadas",
  },
  {
    id: "crm-cost",
    label: "Compare as plataformas de CRM atuais",
  },
  { id: "migration", label: "Mudar não precisa ser difícil" },
  { id: "forward-momentum", label: "Do acompanhamento ao avanço contínuo" },
  { id: "team-workspace", label: "Sua equipe conectada em torno da receita" },
  { id: "reporting", label: "Relatórios que se transformam em receita" },
  {
    id: "businesses",
    label: "Feito para empresas de todos os tamanhos e setores",
  },
  { id: "dont-get-left-behind", label: "Não fique para trás" },
  {
    id: "next-generation",
    label: "A próxima geração das operações de receita",
  },
];

function EditorialVisual({ label, variant = "dashboard", children }) {
  return (
    <figure className={`ed-visual ed-visual-${variant}`}>
      <div className="ed-visual-inner">
        {children || (
          <>
            <span className="ed-visual-kicker">
              Visual editorial da Cortexa
            </span>
            <strong>{label}</strong>
            <span className="ed-visual-note">
              Substitua este bloco pela imagem aprovada da Cortexa.
            </span>
          </>
        )}
      </div>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function CtaCard({ where }) {
  return (
    <div className="ed-cta-card">
      <span className="ed-cta-eyebrow">
        Pronto para ir além do CRM tradicional?
      </span>
      <h3>Veja como a Cortexa ajuda a transformar conversas em receita.</h3>

      <div className="ed-cta-rule" />

      <ul className="ed-cta-benefits">
        <li>
          <MessageSquareText size={21} />
          <span>
            <strong>Conversas com IA</strong>
            Atenda leads instantaneamente em qualquer canal.
          </span>
        </li>
        <li>
          <CalendarDays size={21} />
          <span>
            <strong>Agendamentos automatizados</strong>
            Qualifique leads e agende reuniões automaticamente.
          </span>
        </li>
        <li>
          <LineChart size={21} />
          <span>
            <strong>Inteligência de receita</strong>
            Veja o que funciona e onde focar em seguida.
          </span>
        </li>
        <li>
          <Users size={21} />
          <span>
            <strong>Feito para crescer</strong>
            Escale sua equipe e sua receita sem caos.
          </span>
        </li>
      </ul>

      <Link
        to="/pt/trial"
        className="ed-cta-primary"
        onClick={() =>
          trackEvent("editorial_cta_click", { where, cta: "trial" })
        }
      >
        Comece seu teste grátis
      </Link>

      <Link
        to="/pt/pricing"
        className="ed-cta-secondary ed-view-plans-btn"
        onClick={() =>
          trackEvent("editorial_cta_click", { where, cta: "plans" })
        }
      >
        Ver planos <ArrowRight size={17} />
      </Link>
    </div>
  );
}

function Contents({ activeId, onNavigate }) {
  return (
    <nav className="ed-contents" aria-label="Conteúdo do artigo">
      <span className="ed-contents-title">[ Conteúdo ]</span>
      <ol>
        {ARTICLE_SECTIONS.map((section, index) => (
          <li
            key={section.id}
            className={activeId === section.id ? "is-active" : ""}
          >
            <a href={`#${section.id}`} onClick={() => onNavigate(section.id)}>
              <span>{index + 1}.</span>
              {section.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function EditorialFunnelPt() {
  const [activeId, setActiveId] = useState(ARTICLE_SECTIONS[0].id);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const sectionIds = useMemo(
    () => ARTICLE_SECTIONS.map((section) => section.id),
    [],
  );

  useEffect(() => {
    trackEvent("editorial_view", { page: "why_legacy_crm_pt" });
  }, []);

  useEffect(() => {
    const nodes = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!nodes.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-18% 0px -68% 0px",
        threshold: [0, 0.15, 0.35, 0.65],
      },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [sectionIds]);

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="ed-page">
      <header className="ed-header">
        <div className="ed-header-inner">
          <Link to="/" className="ed-brand" aria-label="Página inicial da Cortexa">
            
          </Link>

          <nav className="ed-main-nav" aria-label="Navegação editorial">
            <a href="#one-platform">Plataforma</a>
            <a href="#forward-momentum">Soluções</a>
            <a href="#migration">Recursos</a>
            <a href="#businesses">Empresa</a>
            <a href="#crm-cost">Preços</a>
          </nav>

          <Link
            to="/pt/trial"
            className="ed-header-cta"
            onClick={() =>
              trackEvent("editorial_cta_click", {
                where: "header",
                cta: "trial",
              })
            }
          >
            Começar teste grátis
          </Link>

          <button
            type="button"
            className="ed-menu-button"
            aria-label="Abrir navegação"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileNavOpen && (
          <div className="ed-mobile-nav">
            <a href="#one-platform" onClick={closeMobileNav}>
              Plataforma
            </a>
            <a href="#forward-momentum" onClick={closeMobileNav}>
              Soluções
            </a>
            <a href="#migration" onClick={closeMobileNav}>
              Recursos
            </a>
            <a href="#businesses" onClick={closeMobileNav}>
              Empresa
            </a>
            <a href="#crm-cost" onClick={closeMobileNav}>
              Preços
            </a>
            <Link to="/pt/trial" onClick={closeMobileNav}>
              Começar teste grátis
            </Link>
          </div>
        )}
      </header>

      <main>
        <div className="ed-breadcrumb-wrap">
          <div className="ed-breadcrumb">
            <span>Editorial</span>
            <b>/</b>
            <span>CRMs tradicionais</span>
          </div>
        </div>

        <section className="ed-hero" id="legacy-crm">
          <div className="ed-hero-heading">
            <h1>O fim do CRM tradicional?</h1>

            <p className="ed-byline">
              24 de julho de 2026 por <strong>Julian S.</strong>
              <span>|</span>
              <a href="https://x.com" target="_blank" rel="noreferrer">
                X
              </a>
              <span>,</span>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer">
                LinkedIn
              </a>
              <span>|</span>
              Última revisão: 24 de julho de 2026
            </p>
          </div>

          <div className="ed-hero-divider" aria-hidden="true" />

          <div className="ed-hero-cover">
            <div className="ed-hero-cover-frame">
              <p>
                Por que as empresas estão reavaliando o Salesforce, o HubSpot e
                a ascensão dos Sistemas Operacionais de Receita com IA Agêntica
              </p>
            </div>
          </div>
        </section>

        <div className="ed-layout">
          <aside className="ed-contents-column">
            <div className="ed-sticky-column">
              <Contents
                activeId={activeId}
                onNavigate={(id) => setActiveId(id)}
              />
            </div>
          </aside>

          <article className="ed-article">
            <section className="ed-section ed-introduction">
              <p>
                Por quase duas décadas, plataformas como Salesforce e HubSpot
                ajudaram a definir como seria a gestão do relacionamento com
                clientes. Elas deram às empresas um lugar para organizar
                contatos, gerenciar pipelines e acompanhar as interações com os
                clientes. Tornaram-se o padrão para organizações de vendas em
                todo o mundo.
              </p>
              <p>Mas os negócios mudaram.</p>
              <p>
                Os clientes esperam respostas instantâneas. As equipes de vendas
                precisam agir mais rápido do que nunca. A IA deixou de ser uma
                novidade e se tornou uma ferramenta prática para os negócios.
                Mesmo assim, muitas organizações ainda dependem de sistemas
                criados originalmente para registrar atividades, em vez de ajudar
                ativamente as oportunidades a avançar.
              </p>
              <p>
                Por isso, mais empresas estão fazendo uma pergunta diferente:
              </p>
              <blockquote>
                Nosso CRM está nos ajudando a crescer ou estamos gastando tempo demais
                para gerenciá-lo?
              </blockquote>
              <p>
                Essa pergunta iniciou uma conversa mais ampla em todo o setor. As
                empresas estão avaliando se as plataformas tradicionais de CRM
                ainda são a melhor opção para um ambiente de vendas orientado por
                IA ou se plataformas nativas de IA podem simplificar as operações
                e acelerar o crescimento.
              </p>
              <p>
                Não se trata de dizer que Salesforce ou HubSpot são produtos “ruins”.
                São plataformas maduras, com recursos amplos e grandes
                ecossistemas. A questão é se toda empresa precisa desse nível de
                complexidade ou se uma abordagem diferente combina melhor com o
                ritmo atual dos negócios.
              </p>
              <p>
                A próxima geração não se concentra apenas em armazenar dados de
                clientes.
              </p>
              <p>
                <strong>
                  Ela se concentra em ajudar equipes a gerar receita.
                </strong>
              </p>
              <p>
                É nesse ponto que os Sistemas Operacionais de Receita com IA Agêntica
                entram na conversa.
              </p>
              <p>
                Em vez de exigir que as equipes de vendas passem horas atualizando
                registros, alternando entre várias ferramentas e acompanhando
                manualmente cada lead, os sistemas nativos de IA foram projetados
                para automatizar o trabalho repetitivo, manter as conversas em
                andamento e apoiar as equipes durante toda a jornada do cliente.
              </p>
              <p>A mudança não é de um fornecedor de CRM para outro.</p>
              <blockquote>
                A mudança é de gerenciar registros para operar receita.
              </blockquote>

              <img src={whyImg} alt="CORTEXA" className="background" />
              <figcaption>
                Painel de inteligência de receita da Cortexa
              </figcaption>
            </section>

            <section className="ed-section" id="revenue-operations">
              <h2>
                Da gestão de relacionamento com clientes às operações de receita
              </h2>
              <p>
                Plataformas de CRM tradicionais foram criadas para organizar
                informações.
              </p>
              <p>
                A próxima geração está sendo construída para ajudar empresas a
                gerar receita.
              </p>
              <p>
                Os sistemas tradicionais de CRM são eficientes para armazenar
                contatos, acompanhar oportunidades e documentar o que aconteceu
                ontem.
              </p>
              <p>
                Os Sistemas Operacionais de Receita modernos e nativos de IA foram
                projetados para ajudar as empresas a decidir o que deve acontecer
                em seguida.
              </p>
              <p>Em vez de apenas armazenar leads, as empresas perguntam:</p>
              <ul>
                <li>A IA pode qualificá-los?</li>
                <li>A IA pode manter as conversas em andamento?</li>
                <li>A IA pode automatizar o acompanhamento?</li>
                <li>A IA pode agendar compromissos?</li>
                <li>
                  A IA pode ajudar equipes a gerar mais receita com menos
                  trabalho manual?
                </li>
              </ul>
              <p>
                A conversa já não é sobre adicionar recursos de IA a um CRM.
              </p>
              <p>
                Trata-se de construir uma empresa em torno de operações de receita
                assistidas por IA.
              </p>

              <img src={why1Img} alt="CORTEXA" className="background" />
              <figcaption>
                Qualificação por agente de IA e agendamento automático
              </figcaption>
            </section>

            <section className="ed-section" id="legacy-crm-tax">
              <h2>O custo oculto do CRM tradicional</h2>
              <p>
                Quando as empresas avaliam um software, geralmente comparam os preços
                das assinaturas mensais.
              </p>
              <p>Mas a assinatura é apenas parte da equação.</p>
              <p>A pergunta maior é:</p>
              <blockquote>
                Quanto realmente custa implementar, manter e operar o sistema ao longo
                do tempo?
              </blockquote>
              <p>
                Muitas empresas descobrem que o custo total de propriedade inclui
                muito mais do que a licença mensal. Dependendo da plataforma, a
                implantação e a operação contínua podem exigir implementação,
                consultoria, integrações, tempo administrativo, treinamento de
                funcionários e manutenção constante.
              </p>
              <p>Pense nisso como o custo oculto do CRM tradicional.</p>
              <p>
                Não porque todas as organizações tenham todos esses custos, mas porque
                o investimento total muitas vezes vai muito além da própria
                assinatura do software.
              </p>
              <p>O custo real pode incluir:</p>
              <ul className="ed-two-column-list">
                <li>Implementação e onboarding</li>
                <li>Treinamento de funcionários</li>
                <li>Integrações personalizadas</li>
                <li>Sobrecarga administrativa</li>
                <li>Configuração contínua</li>
                <li>Ferramentas de terceiros</li>
                <li>Manutenção de fluxos de trabalho</li>
                <li>
                  Custos de oportunidade causados por processos lentos ou
                  manuais
                </li>
              </ul>
              <p>
                Cada hora dedicada à manutenção do software é uma hora que deixa de
                ser usada para atender clientes ou fechar negócios.
              </p>
            </section>

            <section className="ed-section" id="different-question">
              <h2>As empresas estão fazendo uma pergunta diferente</h2>
              <p>As empresas estão começando a fazer uma pergunta diferente.</p>
              <p>
                Em vez de pagar funcionários para gastar horas mantendo
                software...
              </p>
              <blockquote>
                O software pode ajudar funcionários a gerar mais receita?
              </blockquote>
              <p>
                Essa mudança de pensamento é uma das principais razões pelas quais as
                plataformas nativas de IA estão ganhando atenção em diferentes
                setores.
              </p>
              <p>As organizações não estão apenas procurando outro CRM.</p>
              <p>Elas procuram um modelo operacional melhor.</p>
              <blockquote className="ed-pull-quote">
                As empresas não estão simplesmente procurando outro CRM. Elas estão
                buscando um modelo operacional melhor.
              </blockquote>

              <img src={why2Img} alt="CORTEXA" className="background" />
              <figcaption>
                WhatsApp com IA e conversas automatizadas com clientes
              </figcaption>
            </section>

            <section className="ed-section" id="transparent-setup">
              <h2>Configuração transparente</h2>
              <p>
                Projetos tradicionais de software empresarial podem envolver custos
                iniciais significativos de implementação, dependendo do tamanho
                da organização, das personalizações e dos requisitos de
                implantação.
              </p>
              <p>A Cortexa adota uma abordagem diferente.</p>

              <aside
                className="ed-editorial-callout"
                aria-label="Taxa única de configuração"
              >
                <span className="ed-editorial-callout-label">
                  Taxa única de configuração
                </span>
                <p>
                  A Cortexa começa com uma simples{" "}
                  <strong>taxa única de configuração de US$ 97</strong>, oferecendo às
                  empresas um ponto de partida transparente sem transformar o
                  onboarding em um grande projeto de implementação.
                </p>
              </aside>

              <p>
                Um ponto de partida simples e transparente, criado para reduzir
                barreiras e ajudar as empresas a começar a usar um Sistema
                Operacional de Receita nativo de IA sem assumir um grande projeto
                inicial de implementação.
              </p>
              <p>Preço transparente é apenas parte da equação.</p>
              <p>As empresas também querem implantações previsíveis.</p>
              <p>Expectativas claras.</p>
              <p>Poucas surpresas.</p>
              <p>
                E a capacidade de avaliar uma nova plataforma sem assumir um grande
                projeto de implementação antes de ver resultados.
              </p>
            </section>

            <section className="ed-section" id="business-value">
              <h2>Gerando valor para o negócio mais cedo</h2>
              <p>O objetivo não é apenas implementar mais rápido.</p>
              <p>É gerar valor para o negócio mais cedo.</p>
              <p>
                As empresas não compram software porque gostam de implementá-lo.
              </p>
              <p>
                Elas investem em tecnologia porque desejam melhor desempenho de vendas,
                melhores experiências para os clientes e maior eficiência
                operacional.
              </p>
              <p>
                Quanto antes essas melhorias começarem, mais cedo o investimento
                começará a gerar valor.
              </p>

              <img src={why3Img} alt="CORTEXA" className="background" />
              <figcaption>
                Onboarding rápido e conexão do WhatsApp por QR
              </figcaption>
            </section>

            <section className="ed-section" id="one-platform">
              <h2>Uma plataforma versus várias ferramentas desconectadas</h2>
              <p>
                Os sistemas tradicionais geralmente se transformam em várias
                ferramentas e complementos que as empresas precisam manter,
                conectar e pagar separadamente.
              </p>
              <p>
                A Cortexa reúne o fluxo de trabalho essencial de receita em uma única
                plataforma conectada.
              </p>
            </section>

            <section className="ed-section ed-cost-section" id="crm-cost">
              <div className="ed-cost-intro">
                <span className="ed-cost-kicker">[ Comparação de plataformas ]</span>

                <h2>Compare as plataformas de CRM atuais</h2>

                <div className="ed-cost-rule" aria-hidden="true" />

                <h3>
                  Escolher o CRM certo envolve muito mais do que comparar o valor
                  da assinatura mensal.
                </h3>

                <p>
                  Compare Salesforce, HubSpot e Cortexa em recursos de IA,
                  automação, colaboração, implantação e capacidades gerais da
                  plataforma.
                </p>

                <div className="ed-cost-note">
                  <span className="ed-cost-note-icon" aria-hidden="true">
                    <Calculator size={37} strokeWidth={1.8} />
                  </span>
                  <div>
                    <strong>
                      A comparação abaixo destaca as capacidades das plataformas
                      para uma empresa típica com cinco usuários.
                    </strong>
                    <span>
                      Compare como cada plataforma aborda IA, automação,
                      colaboração e operações empresariais.
                    </span>
                  </div>
                </div>
              </div>

              <div className="ed-comparison-transition">
                <span>Comparação de plataformas</span>
                <h3>Compare a experiência completa de cada plataforma</h3>
                <p>
                  Analise recursos, automação, colaboração, implantação e suporte
                  operacional.
                </p>
              </div>

              <div className="ed-comparison-wrap">
                <CostComparison locale="pt" />
              </div>

              <p>
                Ao avaliar plataformas de CRM, compare a experiência completa da
                plataforma em vez de considerar apenas o preço da assinatura
                mensal.
              </p>
              <p>
                As empresas devem comparar recursos, automação, integrações,
                implantação e colaboração ao selecionar um CRM.
              </p>
              <p>
                Cada plataforma de CRM exige diferentes níveis de implementação,
                configuração, integrações, administração e gestão contínua.
              </p>
              <p>
                Por isso, as empresas devem comparar as capacidades completas da
                plataforma, e não apenas o preço da assinatura.
              </p>
              <p>Não apenas o preço da assinatura...</p>
              <p>
                Mas as capacidades completas da plataforma, a automação, a
                implantação e a eficiência operacional.
              </p>
              <p>Os principais recursos a comparar incluem:</p>
              <ul className="ed-two-column-list">
                <li>IA nativa</li>
                <li>Automação</li>
                <li>Gestão de leads</li>
                <li>Gestão de pipeline</li>
                <li>Colaboração em equipe</li>
                <li>Relatórios</li>
                <li>Agendamento de compromissos</li>
                <li>Integrações empresariais</li>
              </ul>
              <blockquote>
                A plataforma mais forte é aquela que ajuda toda a empresa a
                operar com mais eficiência.
              </blockquote>
            </section>

            <section className="ed-section ed-migration-section" id="migration">
              <span className="ed-section-kicker">Migração guiada</span>
              <h2>Mudar não precisa ser difícil</h2>
              <p className="ed-section-intro">
                Migre do Salesforce, HubSpot, Jira ou ClickUp sem começar do zero. O
                processo de migração guiada da Cortexa ajuda a levar seus
                contatos, pipelines, projetos, tarefas e fluxos de trabalho para
                uma única plataforma conectada e impulsionada por IA.
              </p>

              <ul className="ed-migration-checklist">
                <li>Importar contatos e dados de clientes</li>
                <li>Importar pipelines e oportunidades</li>
                <li>Importar projetos e tarefas</li>
                <li>Configurar agentes de IA e fluxos de trabalho</li>
                <li>Conectar integrações</li>
                <li>Preparar a equipe para trabalhar</li>
              </ul>
            </section>

            <section className="ed-section" id="forward-momentum">
              <h2>Do acompanhamento ao avanço contínuo</h2>
              <p>
                O valor de um Sistema Operacional de Receita nativo com IA vai
                muito além de simplesmente armazenar informações dos clientes.
              </p>
              <p>Ele ajuda a manter as oportunidades avançando.</p>
              <p>
                A IA da Cortexa pode responder a novas conversas, qualificar
                leads, automatizar acompanhamentos, gerenciar o agendamento de
                compromissos e transferir a conversa para um membro da equipe
                quando for necessária assistência humana.
              </p>
              <p>
                Em vez de depender totalmente dos colaboradores para lembrar de
                cada acompanhamento, o sistema ajuda a garantir que as
                oportunidades continuem avançando ao longo do processo de
                receita.
              </p>
              <p>A IA cuida do trabalho repetitivo.</p>
              <p>
                Sua equipe pode se concentrar nas conversas e decisões que
                exigem atenção humana.
              </p>

              <img src={why4Img} alt="CORTEXA" className="background" />
            </section>

            <section className="ed-section" id="team-workspace">
              <h2>Sua equipe conectada em torno da receita</h2>
              <p>A receita não passa por apenas um departamento.</p>
              <p>
                As equipes de vendas, atendimento, gestão, operações e suporte
                geralmente precisam ter visibilidade sobre as mesmas conversas,
                compromissos, tarefas, arquivos e oportunidades.
              </p>
              <p>
                O Espaço de Trabalho de Receita para Equipes da Cortexa oferece
                um ambiente conectado onde as equipes podem colaborar, atribuir
                tarefas, compartilhar informações, acompanhar atividades e
                manter os projetos em andamento.
              </p>
              <p>
                O resultado é menos fragmentação entre sistemas e maior
                visibilidade sobre todo o trabalho que impulsiona a receita.
              </p>

              <img src={why5Img} alt="CORTEXA" className="background" />
              <figcaption>Espaço de trabalho de receita da equipe</figcaption>
            </section>

            <section className="ed-section" id="reporting">
              <h2>Relatórios que se transformam em receita</h2>
              <p>As empresas não precisam de mais relatórios desconectados.</p>
              <p>Elas precisam de visibilidade para tomar decisões melhores.</p>
              <p>
                A Cortexa reúne desempenho, atividade do pipeline, visibilidade
                da equipe, movimentação de leads e relatórios de receita para
                que as empresas possam entender o que está acontecendo e decidir
                qual deve ser o próximo passo.
              </p>
              <p>O objetivo não é gerar relatórios por gerar.</p>
              <p>
                Trata-se de usar as informações para identificar oportunidades,
                melhorar o desempenho e manter a receita em crescimento.
              </p>

              <img src={why6Img} alt="CORTEXA" className="background" />
              <figcaption>Relatórios que geram receita</figcaption>
            </section>

            <section className="ed-section" id="businesses">
              <h2>Feito para empresas de todos os tamanhos e setores</h2>
              <p>
                Seja você responsável por uma imobiliária, empresa de
                e-commerce, agência, consultoria, agência de seguros,
                organização financeira ou outro negócio em crescimento, o
                Sistema Operacional de Receita com IA Agêntica da Cortexa ajuda
                as equipes a organizar operações, gerenciar relacionamentos com
                clientes, automatizar a comunicação e melhorar a produtividade
                empresarial.
              </p>
              <p className="ed-legal-note">
                O Cortexa AI CRM é uma plataforma de Software como Serviço
                (SaaS) desenvolvida para organizações de diversos setores. Não
                fornecemos produtos de seguros, produtos financeiros, serviços
                de empréstimo, consultoria de investimentos ou serviços de
                consultoria financeira. A Cortexa fornece software de CRM,
                automação, comunicação e operações de receita para empresas.
              </p>
              <p>
                A plataforma principal está pronta para apoiar empresas que
                dependem da comunicação com clientes, leads, agendamentos,
                pipelines, análises e colaboração entre equipes.
              </p>
              <p>
                Módulos específicos para cada setor podem ser adicionados
                conforme necessário, enquanto a maioria das empresas pode
                começar a utilizar a plataforma principal imediatamente.
              </p>
            </section>

            <section className="ed-section" id="dont-get-left-behind">
              <h2>Não fique para trás</h2>
              <p>
                Veja como nosso Sistema Operacional de Receita integrado ajuda
                as empresas a automatizar mais rapidamente, fechar mais
                oportunidades e aumentar a receita.
              </p>
            </section>

            <section className="ed-section" id="next-generation">
              <h2>A próxima geração das operações de receita</h2>
              <p>
                As empresas que procuram um CRM hoje não estão apenas em busca
                de mais um banco de dados.
              </p>
              <p>Elas estão pesquisando.</p>
              <p>Elas estão comparando.</p>
              <p>
                Estão lendo artigos especializados, guias de compra e análises
                do setor antes de tomar uma decisão.
              </p>
              <p>
                Mais importante ainda, estão fazendo uma pergunta diferente
                daquela de apenas alguns anos atrás.
              </p>
              <p>Elas não perguntam:</p>
              <blockquote>“Qual CRM tem mais recursos?”</blockquote>
              <p>Elas perguntam:</p>
              <blockquote>
                “Qual plataforma nos ajudará a operar com mais eficiência, automatizar mais trabalho e criar mais oportunidades?”
              </blockquote>
              <p>
                Essa é a conversa que os Sistemas Operacionais de Receita
                nativos com IA estão começando a transformar.
              </p>
              <p>
                O objetivo já não é apenas gerenciar o relacionamento com os
                clientes.
              </p>
              <p>
                O objetivo é ajudar as empresas a qualificar leads, automatizar
                conversas, apoiar o agendamento de compromissos, otimizar
                acompanhamentos e administrar a receita de forma mais
                inteligente.
              </p>
              <p>
                O futuro talvez não pertença ao CRM com a maior lista de
                funcionalidades.
              </p>
              <p>
                As plataformas tradicionais foram criadas para uma época em que
                as equipes registravam atividades depois que elas aconteciam. As
                empresas de hoje precisam de sistemas capazes de participar do
                próprio trabalho — respondendo mais rapidamente, mantendo o
                ritmo, conectando equipes e ajudando os líderes a agir com base
                nos sinais de receita enquanto as oportunidades ainda estão
                ativas.
              </p>
              <p>
                É por isso que a transição para um Sistema Operacional de
                Receita com IA Agêntica é muito mais do que uma atualização de
                software. Trata-se de passar de um registro passivo de
                informações para um modelo operacional desenvolvido para ação,
                velocidade e crescimento mensurável.
              </p>
              <p>
                As empresas que fazem essa transição não estão abandonando o
                relacionamento com os clientes. Elas estão oferecendo às suas
                equipes uma maneira mais inteligente de gerenciar e expandir
                esses relacionamentos.
              </p>
              <blockquote className="ed-pull-quote">
                A próxima geração da tecnologia de receita ajudará as empresas a
                gastar menos tempo gerenciando software e mais tempo criando
                impulso para o crescimento.
              </blockquote>
            </section>

            <div className="ed-inline-cta">
              <CtaCard where="inline_mobile" />
            </div>
          </article>

          <aside className="ed-cta-column">
            <div className="ed-sticky-column">
              <CtaCard where="sidebar" />
            </div>
          </aside>
        </div>
      </main>

      <footer className="ed-footer">
        <div className="ed-footer-inner">
          <img src={footlogo} alt="Cortexa" className="ed-footlogo" />
          <div className="ed-footer-links">
            <Link to="/pt/pricing">Preços</Link>
            <Link to="/pt/features">Recursos</Link>
            <Link to="/pt/terms">Termos</Link>
            <Link to="/pt/privacy-policy">Privacidade</Link>
          </div>
          <span className="ed-footer-note">
            <ShieldCheck size={14} /> As estimativas são ilustrativas.
          </span>
        </div>
      </footer>
    </div>
  );
}