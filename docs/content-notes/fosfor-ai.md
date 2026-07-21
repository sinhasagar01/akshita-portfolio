# Fosfor AI — Case Study Content

> Deduplicated and cleaned from the reference URL + screenshot, extended with the redesign additions (structured IA, phased timeline, new Results section).
>
> **Image paths** are placeholders — reconcile against the actual filenames in `images.zip`, keep the alt text.
> **Results** were illustrative when this note was drafted. **Superseded on 2026-07-21**: the
> owner seeded the real figures, and `content/projects/fosfor-ai.yaml` is now the source of
> truth for them. Read the numbers there, not from the table below.

---

## Meta

- **Title:** Fosfor AI — Designing an AI companion for the data-to-decision journey
- **Description:** A UX case study on Fosfor AI, an AI-guided companion inside the Fosfor Decision Cloud that supports Data, Insight, and Decision Designers across the full data-to-decision workflow.
- **OG image:** `/images/og-fosfor-ai.png`

---

## Hero

**Fosfor AI**

Fosfor AI is an AI-enhanced companion built into the Fosfor Decision Cloud, designed to support users across the full data-to-decision journey. The AI-guided framework serves three primary personas — Data Designer, Insight Designer, and Decision Designer — helping them manage data, extract insights, and reach informed decisions.

---

## Project brief

**Aim:** Design an AI-powered companion that assists users throughout their data-to-decision journey within the Fosfor Decision Cloud platform.

**Background:** Built as part of Fosfor's initiative to rethink how users interact with data and make decisions. The project addresses the need for intelligent assistance across multiple user personas while preserving security and trust.

---

## Problem statement

Users across different roles struggled to interact with complex data workflows and extract meaningful insights. Key pain points surfaced per persona:

- **Data Designer** — Managing and transforming large datasets efficiently.
- **Insight Designer** — Analyzing trends and deriving predictive insights.
- **Decision Designer** — Navigating recommendations and acting on AI-driven insights intuitively.

**Goal:** Design an AI assistant that streamlines these workflows, boosts productivity, and improves the overall experience within the Fosfor ecosystem.

---

## Key objectives

**Primary goal:** Create an AI-powered companion that enhances the data-to-decision journey by boosting productivity and user experience across all Fosfor personas.

### Boost real productivity
- Accelerate the data-to-decision process
- Enable faster data analysis and insight generation
- Automate repetitive tasks and complex workflows
- Reduce time spent on troubleshooting and error resolution

### Enhance user experience
- A smooth, intuitive interface for AI interactions
- A feedback loop for continuous improvement
- An AI cursor for contextual feature access
- Intent-based navigation rather than menu-driven

### Build trust & security
- Ensure data privacy and security
- Support "bring your own model / keys"
- Build guardrails to prevent data leaks
- Keep AI operations transparent

---

## Final design

Final prototype — Fosfor AI in action across the Decision Cloud.

`YouTube embed → https://www.youtube.com/embed/zIXcYbUsfZs`

---

## Project timeline (12 weeks)

| Phase | Weeks | Detail |
|---|---|---|
| Strategy & Research | 1–2 | Interviews, empathy map, user journey map |
| Problem & Goal definition | 2–3 | Problem statement & goal statement |
| Information Architecture | 3–5 | — |
| UX Design — Wireframes | 4–6 | Paper & lo-fi |
| Visual Design & Prototyping | 6–9 | — |
| Usability Testing | 9–11 | — |
| UI Polish & Handoff | 11–12 | — |

---

## Design process

### Research & insights
- Interviews and usability studies with Data, Insight, and Decision Designers.
- Users wanted a conversational, guided AI experience rather than static inputs.
- Context-aware recommendations and automated workflows were essential to efficiency.
- Seamless integration with existing data pipelines and visualization tools was a must-have.

### Ideation & wireframing
- Defined user flows for interacting with Fosfor AI across the data lifecycle.
- Created low-fidelity wireframes exploring conversational and command-based interactions.
- Validated wireframes with stakeholders before high-fidelity design.

### Prototyping & testing
- Built interactive prototypes simulating AI-driven interactions and real-time feedback.
- Ran A/B tests to refine response accuracy and engagement.
- Performed heuristic evaluations for consistency with the broader Decision Cloud interface.

---

## Research findings

After identifying issues in existing workflows, I researched user needs and technical requirements across the three personas.

**Image:** `/images/research-landscape.png` — *Research synthesis board mapping user needs across the three Fosfor personas.*

| Persona | Needs |
|---|---|
| **Data Designer** | Code generation assistance · Pipeline debugging help · Log analysis and troubleshooting |
| **Insight Designer** | ML model optimization · Experiment tracking · Deployment assistance |
| **Decision Designer** | Semantic model creation · KPI development · Business logic implementation |

---

## Solution areas

### Contextual intelligence
- Smart suggestions based on the current task
- Proactive assistance
- Context-aware responses

### Unified experience
- Consistent interface across modules
- Seamless integration
- Persistent accessibility

### Security & trust
- Clear AI notices
- User permissions
- Transparent operations

---

## Information architecture

**Root:** Fosfor AI → serves *Data Designer*, *Insight Designer*, *Decision Designer*

### Context Layer
- **Module context:** User preference · Session history · Access permission
- **User context:** Current task · Related artifacts · Resource links
- **Task context**

### Interaction Layer
- **Input method:** Text input · Template prompts · Quick action
- **Command type:** Analysis commands · Help commands · Creation commands
- **User controls:** Drawer controls · Response controls · Settings

### Response Layer
- **Response types:** Text responses · Code snippets · Log analysis
- **Visualization:** Data visualization · Charts & graphs · Status indicators
- **Actions:** Copy action · Export options · Share features

### Memory Layer
- **Session memory:** Current session · Session variables · Temporary data
- **User state:** Module state · User state · Task state
- **History:** Conversation history · Action history · Saved items

---

## Wireframes

Ideated on the landing page layout and structure using paper wireframes, then lo-fi wireframes.

**Paper wireframes**
- `/images/wireframe-paper-1.png` — Paper wireframe exploring the AI drawer layout
- `/images/wireframe-paper-2.png` — Paper wireframe of the prompt input and quick actions
- `/images/wireframe-paper-3.png` — Paper wireframe of the response and visualization area

**Lo-fi wireframes**
- `/images/wireframe-lofi-1.png` — Lo-fi wireframe of the Fosfor AI entry point
- `/images/wireframe-lofi-2.png` — Lo-fi wireframe of a conversational AI flow
- `/images/wireframe-lofi-3.png` — Lo-fi wireframe of command-based interaction
- `/images/wireframe-lofi-4.png` — Lo-fi wireframe of the response controls
- `/images/wireframe-lofi-5.png` — Lo-fi wireframe of contextual suggestions
- `/images/wireframe-lofi-6.png` — Lo-fi wireframe of the settings and permissions view

---

## Results & impact

> **Superseded on 2026-07-21.** These were illustrative while the case study was being
> drafted. The owner has since seeded the real figures, so the live numbers live in
> `content/projects/fosfor-ai.yaml` and the table below is kept only as drafting history.

| Metric | Meaning |
|---|---|
| **~40%** | Faster time-to-insight in moderated testing |
| **3** | Personas served by one unified AI surface |
| **8/10** | Task-completion success in usability tests |
| **2×** | Fewer steps to act on an AI recommendation |

- **Data Designer** — Inline code generation and log analysis cut context-switching out of debugging.
- **Insight Designer** — Context-aware model suggestions shortened the path from experiment to deployment.
- **Decision Designer** — Intent-based navigation made acting on recommendations feel immediate, not menu-hunted.

---

## Conclusion

Fosfor AI unified three very different personas under a single, context-aware assistant — replacing menu-driven, static workflows with conversational, intent-based interactions. By pairing automation with clear guardrails and "bring your own model" controls, the design boosted productivity without compromising the trust and security enterprise data teams depend on. The biggest lesson: a shared AI surface only works when each persona feels it was designed for them specifically.
