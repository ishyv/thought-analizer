# Thought Structure App
## Product Spec Draft

## 1. Purpose

This document defines the **product and design specification draft** for a web-based app that helps users break down a sentence, paragraph, or thought into visible reasoning structure.

The app is not meant to be a truth engine, a therapist, or a formal logic prover. Its role is to help users **see what is happening inside their own phrasing and reasoning** by extracting semantic groups, statement roles, relationships, tensions, and reasoning issues, then presenting them in a visual and minimal interface.

This document covers:
- product intent
- user value
- scope
- core concepts
- information model
- user experience
- UI structure
- interaction model
- output presentation
- requirements for a web MVP

This document does **not** define implementation details yet.

---

## 2. Product Summary

### Working description
A web app that takes a written thought and transforms it into:
- highlighted phrase groups
- concept tags
- polarity indicators
- statement groups
- relationship arrows
- detected tensions, contradictions, and reasoning issues
- an abstract summary of what the thought is structurally about

### Core value
The app helps users answer questions like:
- What is this thought really about?
- What needs, constraints, or judgments are present here?
- Where is the tension?
- What assumption is implied but not said?
- Is this phrased as a contradiction, a false contrast, or an unresolved conflict?
- Why does this thought feel stuck?

### Core promise
**Paste a thought. See its hidden structure.**

---

## 3. Product Goals

### Primary goals
1. Help users visually inspect the internal structure of a thought.
2. Surface relationships between concepts, not just isolated tags.
3. Present reasoning issues in a way that feels insightful, not preachy.
4. Make the output feel elegant, readable, and visual.
5. Keep the product simple enough to understand in one session.

### Secondary goals
1. Make the app suitable for introspection, planning, writing, and idea refinement.
2. Create a portfolio-worthy interface with strong visual identity.
3. Allow progressive depth: users can skim or inspect in detail.

### Non-goals
1. Proving objective truth.
2. Diagnosing mental health states.
3. Replacing note-taking or writing tools.
4. Acting as a formal academic logic engine.
5. Becoming an infinite canvas productivity platform.

---

## 4. Target Users

### Primary users
- people trying to understand their own messy thoughts
- writers and planners
- developers or system-oriented thinkers
- users interested in self-analysis or idea decomposition

### Secondary users
- students analyzing arguments
- creators refining project ideas
- worldbuilders or designers mapping tensions inside systems

### Likely user motivations
- “I feel like I’m saying several things at once.”
- “I know there’s tension in this thought, but I can’t see it clearly.”
- “I want to understand what is blocking action.”
- “I want to see contradictions or framing problems in how I wrote this.”

---

## 5. Scope of the First Version

### Input scope
The first version should accept:
- one sentence
- one short paragraph
- one multi-sentence thought dump

The app should work best when the input contains:
- tension
- conflict
- explanation
- decision-making
- stated needs, constraints, or conclusions

### Output scope
The first version should produce:
1. phrase-level extraction
2. statement-level grouping
3. relationship mapping
4. reasoning issue detection
5. abstract summary

### Constraints for v1
- no account system required
- no collaboration required
- no giant workspace system
- no long-term memory layer
- no claim of perfect logical analysis

---

## 6. Core Product Principles

### 6.1 Visual first
The output should be primarily understood through **design and structure**, not long blocks of explanatory text.

### 6.2 Layered depth
The app should allow multiple levels of understanding:
- immediate skim
- structured inspection
- detailed exploration

### 6.3 Minimal but expressive
The interface should feel restrained, clean, and deliberate. The visual language should communicate structure without noise.

### 6.4 Honest intelligence
The app should present findings as **interpretations and structure cues**, not absolute judgments.

### 6.5 User control
The app should allow the user to inspect, expand, and possibly correct extracted structures in later iterations.

---

## 7. Input Model

### Supported input examples
- introspective thought
- project idea dump
- conflict statement
- decision statement
- argument or opinion
- worldbuilding/system tension

### Example inputs
- “I want to make a useful project, but everything useful feels boring, and everything cool feels too vague or too hard to finish.”
- “I was hungry, but I didn’t want to eat anything. I was too tired to get out of bed, so I stayed there even though I was still hungry.”
- “I want the portfolio to feel playful, but I also don’t want it to look unserious.”

---

## 8. Extraction Model

The product uses multiple layers of interpretation.

### 8.1 Phrase Groups
Small text spans extracted from the input.

Each phrase group should contain:
- raw text span
- concept label
- polarity
- state type
- confidence or certainty level if available

#### Example
Text span: “too much effort”
- concept: effort barrier
- polarity: negative
- state type: obstacle / judgment

### 8.2 Statement Groups
Larger clause-level units representing the role of a full statement in the thought.

Each statement group should contain:
- text span
- statement role
- local relationship to nearby statements
- optional connector information

#### Example roles
- desire
- goal
- constraint
- obstacle
- resource
- assumption
- conclusion
- contrast
- justification
- action
- outcome
- unresolved outcome

### 8.3 Concept Relationships
Arrows or linked connections between concepts and statement groups.

Relationship types may include:
- supports
- blocks
- causes
- intensifies
- depends on
- contrasts with
- leads to
- fails to resolve
- implies
- reframes

### 8.4 Reasoning Issues
Structural issues or anomalies detected in the thought.

Examples:
- contradiction
- false contrast
- connector mismatch
- missing bridge
- unsupported conclusion
- unresolved tension
- self-undermining framing
- assumption gap

### 8.5 Abstract Summary
A short high-level interpretation of the thought’s structure.

Example:
> A basic need remains unmet because exhaustion increases the perceived cost of action.

---

## 9. Taxonomy Draft

### 9.1 Polarity
Each phrase group should receive a polarity value:
- positive
- negative
- neutral

This should represent general directional tone or functional impact, not moral truth.

### 9.2 State Types
Phrase groups should also receive a state type.

Suggested early types:
- need
- emotion
- physical state
- desire
- aversion
- action
- option
- obstacle
- constraint
- judgment
- resource
- uncertainty
- outcome
- assumption

### 9.3 Statement Roles
Suggested early statement-level roles:
- goal
- desire
- context
- capability
- resource
- obstacle
- tradeoff
- contrast
- explanation
- justification
- decision
- action
- inaction
- result
- unresolved result
- conclusion

### 9.4 Reasoning Issue Types
Suggested early issue categories:
- contradiction
- false contrast
- misleading connector
- unsupported conclusion
- unresolved tension
- self-undermining framing
- missing assumption
- blocked resolution

---

## 10. Information Architecture

The app should organize information into four visible layers.

### Layer A: Original text view
The original text remains visible and central.

### Layer B: Phrase overlays
Meaningful groups inside the text are highlighted and tagged.

### Layer C: Structural map
A visual graph or relationship field shows how concepts and statements connect.

### Layer D: Insight panel
A compact panel shows summaries, tensions, and reasoning issues.

This creates a clear hierarchy:
1. what was said
2. what parts were extracted
3. how they relate
4. what the app thinks is structurally notable

---

## 11. UX Strategy

### 11.1 Desired experience
The user should feel:
- immediate recognition
- visual clarity
- curiosity to inspect deeper
- relief from vague internal fog
- trust in the structure, even if not every label is perfect

### 11.2 UX priorities
1. Preserve the original text as the anchor.
2. Avoid making the graph feel detached from the sentence.
3. Avoid overwhelming the user with too many tags at once.
4. Let the user move from overview to detail naturally.
5. Keep the visual density controlled.

### 11.3 Product flow
1. User enters thought.
2. App processes input.
3. Original text appears with grouped highlights.
4. User sees concept tags and polarity at a glance.
5. User explores statement groups and arrows.
6. User inspects issues and abstract summary.
7. Optional future step: user edits or corrects interpretations.

---

## 12. UI Layout Direction

The interface should be visual, minimal, and layered.

### Recommended desktop layout
A three-panel structure:

#### Left panel: Input / text view
- text input area before analysis
- analyzed text after submission
- highlighted phrase groups
- small inline tags

#### Center panel: Structure canvas
- concept nodes
- statement groups
- arrows showing relations
- visual emphasis on tensions and blockers

#### Right panel: Insight rail
- abstract summary
- dominant concepts
- reasoning issues
- detected tensions
- repeated concepts
- connector notes

This layout keeps:
- the text grounded on one side
- the structural visualization central
- the interpretive summary compact and secondary

### Mobile or narrow width direction
Use stacked sections:
1. text
2. summary and issues
3. graph/map
4. detail drawer for selected groups

---

## 13. Visual Design Direction

### 13.1 Overall style
The product should feel:
- minimal
- technical but human
- elegant
- calm
- analytical without becoming sterile

### 13.2 Visual language
Use:
- restrained typography
- subtle grid or panel structure
- low-noise backgrounds
- careful spacing
- sparse accent color
- meaningful color coding

Avoid:
- loud dashboards
- over-glowing graph visuals
- cluttered node maps
- dense paragraph explanations
- exaggerated “AI” aesthetics

### 13.3 Color semantics
Color should communicate role, not decoration.

Possible early system:
- green = positive / enabling
- red = negative / blocking
- white or gray = neutral / contextual
- amber = unresolved / uncertain / warning-level issue
- muted blue = structural / informational

### 13.4 Tag styling
Tags should be small, readable, and secondary to the text.
They should feel like annotations, not buttons screaming for attention.

### 13.5 Arrows and connectors
Arrows should be visually light but semantically legible.
Different relationship types may use:
- line style
- arrowhead form
- line label on hover or selection

---

## 14. Core Screens

### 14.1 Empty state
The app should open with:
- one clear text input area
- a short statement of purpose
- one example thought
- optional preset examples users can click to test the product

### 14.2 Processing state
After submission:
- a short processing transition
- avoid fake loading theatrics
- keep the experience calm and quick

### 14.3 Analysis view
The main result state should show:
- original thought with highlights
- structure map
- insight rail

### 14.4 Focus mode
When a phrase group or statement is selected:
- matching items highlight across all panels
- connected nodes/arrows brighten
- insight rail updates to show details for that item

---

## 15. Interaction Model

### 15.1 Hover behavior
Hovering a phrase group should:
- highlight matching concept node
- show tag details
- dim unrelated parts slightly

Hovering a node should:
- highlight source text fragments
- emphasize connected arrows
- preview relationships

### 15.2 Click behavior
Clicking a phrase group or statement should:
- lock selection
- open a detailed view in the insight rail
- isolate connected structure

### 15.3 Progressive reveal
The interface should not show every label at full strength by default.
Possible approach:
- show main tags and polarity immediately
- reveal deeper metadata on hover/click

### 15.4 Filtering
Users may optionally filter by:
- polarity
- state type
- reasoning issue type
- statement role

This should be secondary, not the main interaction.

---

## 16. Presenting the Extracted Data Beautifully

This is one of the most important parts of the product.

The app will produce a lot of data, but most of it should not be shown as raw JSON or long text explanation. Instead, present it using visual hierarchy.

### 16.1 Principle: anchor everything to the source text
Every visual insight should be traceable back to the original wording.

### 16.2 Principle: show structure through separation and linkage
Use:
- highlight blocks in the source text
- concept tags adjacent to relevant groups
- arrows linking related structures
- panels for summary, not for raw dumps

### 16.3 Principle: let the graph explain shape, not every detail
The graph should show:
- what drives what
- what blocks what
- where the tension is
- what remains unresolved

The graph should not try to show every microscopic label all at once.

### 16.4 Principle: summarize patterns, not every extraction
The insight rail should favor summaries like:
- dominant concept
- main tension
- unresolved need
- possible hidden assumption

Instead of listing 20 extracted values in a flat list.

---

## 17. Recommended Visual Components

### 17.1 Highlighted text blocks
Text spans are highlighted inline with soft color backgrounds or underlays.

### 17.2 Mini tags
Compact tags attached near phrase groups.
Examples:
- need
- obstacle
- judgment
- outcome

### 17.3 Statement strips
Larger clauses can be shown as grouped chips or strips above/below the paragraph.
These represent statement roles.

### 17.4 Concept nodes
Nodes represent extracted concepts in the structure canvas.
Node size may reflect:
- repetition
- importance
- centrality

### 17.5 Relationship arrows
Arrows connect concepts and statement groups.
They should show relation direction and type.

### 17.6 Insight cards
Compact cards in the right panel for:
- abstract summary
- tensions
- reasoning issues
- assumptions
- dominant axis

---

## 18. Reasoning Issue Presentation

Reasoning issues should not be shown like error messages.
They should feel like interpretive flags.

### Good presentation style
- “Possible false contrast”
- “Connector may imply opposition where the clauses actually align”
- “A goal is present, but the blocker is not fully explained”
- “This thought appears unresolved”

### Bad presentation style
- “Logical fallacy detected”
- “Contradiction found” without nuance
- absolute-sounding claims

This product should feel observant, not accusatory.

---

## 19. Core Use Cases

### Use case 1: introspective thought
The user pastes a messy emotional or practical thought and wants clarity.

### Use case 2: project idea refinement
The user pastes a project concept and wants to see its tensions, assumptions, and structure.

### Use case 3: decision conflict
The user pastes a decision dilemma and wants to see goals, blockers, and unresolved factors.

### Use case 4: argument inspection
The user pastes an opinion or argument and wants to inspect reasoning structure and framing.

---

## 20. MVP Requirements

### Functional requirements
1. Accept text input from the user.
2. Display the original text after processing.
3. Show phrase-level highlights.
4. Show concept tags and polarity per phrase group.
5. Show statement groups.
6. Show relationships between groups.
7. Show a compact set of reasoning issues.
8. Show one abstract summary.
9. Link all visual elements back to the source text.

### UX requirements
1. Output must be understandable in under 30 seconds.
2. The original text must remain visible at all times.
3. The graph must not overwhelm the text.
4. The summary panel must remain concise.
5. Hover and click interactions must create clarity, not noise.

### Design requirements
1. Use a restrained visual system.
2. Use polarity and structural color intentionally.
3. Keep the interface minimal and spacious.
4. Avoid dashboard clutter.
5. Preserve a strong sense of alignment between text and structure.

---

## 21. Risks and Design Challenges

### 21.1 Over-extraction
If too many groups are extracted, the UI becomes unreadable.

### 21.2 Overconfidence
If the app sounds too certain, users will lose trust.

### 21.3 Graph clutter
Too many nodes and arrows can destroy clarity fast.

### 21.4 Tag noise
Too many visible labels at once can flatten the user experience.

### 21.5 Detached analysis
If the user cannot easily trace output back to the input, the system feels fake.

---

## 22. Design Responses to Risks

### Response to over-extraction
- prioritize major groups
- allow secondary groups on expansion

### Response to graph clutter
- show only primary relationships by default
- reveal secondary edges on selection

### Response to overconfidence
- use cautious language
- frame outputs as interpretation cues

### Response to tag noise
- keep tags compact
- reveal deep metadata only when selected

---

## 23. Potential Future Features

These are not required for the first version but may be considered later.

- user editing of concept tags
- manual correction of relationship arrows
- multiple interpretation modes
- decision mode
- argument mode
- project-planning mode
- compare two thoughts
- export analysis as image or card
- session history
- collaborative review

---

## 24. Open Questions

1. What is the ideal maximum length for input before readability breaks?
2. How many phrase groups should be visible by default?
3. Should statement groups appear above the text, below it, or in a side band?
4. Should the graph be freeform or partially structured?
5. How many relationship types are realistic for v1?
6. Should the app expose confidence values or keep them internal?
7. How much of the AI output should be hidden vs visible?

---

## 25. Draft Conclusion

This product should be designed as a **visual reasoning lens** for short written thoughts.

Its strength is not in pretending to know the truth, but in helping users see:
- what their thought contains
- how its parts relate
- where the tension is
- what is unresolved
- what framing or reasoning issues may be present

The product should feel:
- clear
- minimal
- intelligent
- visual
- calm
- slightly curious rather than authoritative

The main design challenge is not extraction. It is **turning rich structural interpretation into a visual experience that remains elegant and understandable**.

That is the product problem this spec is built around.

