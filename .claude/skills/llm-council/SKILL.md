---
name: llm-council
description: Convene a council of independent Claude subagents to answer a hard question. Members answer separately, review and rank each other's anonymized answers, then a chairman synthesizes one final answer. Use when the user invokes /llm-council or asks for a "council", "panel", "second opinions", or a multi-model / multi-perspective answer to a question or decision.
argument-hint: "[--quick] [--members N] <question or decision>"
---

# LLM Council

A three-stage deliberation modeled on Karpathy's `llm-council`:

1. **Answer.** Several council members answer the question independently.
2. **Peer review.** Each member reviews and ranks every answer without knowing who wrote it.
3. **Synthesis.** You act as chairman and write one final answer from the answers and the reviews.

Invoking this skill counts as the user explicitly asking for subagents, so spawn them with the Agent tool.

## Input

The arguments are: `$ARGUMENTS`

- `--quick` skips Stage 2. Use it for cheaper, faster runs.
- `--members N` sets the council size (default 4, min 2, max 6).
- Everything else is the question.

If no question was given, ask the user for one and stop. If the question is about this repository, gather the relevant facts first (file paths, short excerpts) and put them into a shared **context brief**. Members start cold, so the brief must stand on its own.

## Council seats

Give each seat a different lens and, where possible, a different model so the answers really differ. Fill seats in this order:

| Seat | Model | Lens |
|------|-------|------|
| 1 | `opus` | **First-principles analyst.** Reasons from fundamentals. Is explicit about assumptions. |
| 2 | `sonnet` | **Pragmatic practitioner.** Asks what works in practice, what it costs, and what is simplest to ship. |
| 3 | `fable` | **Skeptic / red team.** Looks for failure modes, hidden risks, and why the obvious answer is wrong. |
| 4 | `haiku` | **Plain-language generalist.** Gives the clearest, shortest correct answer a newcomer would understand. |
| 5 | `opus` | **Contrarian.** Argues for the strongest credible alternative to the conventional answer. |
| 6 | `sonnet` | **Domain expert.** Takes the role of a senior expert in the question's field (name the field). |

If a model isn't available, run that seat on the default model and keep its lens.

## Stage 1: Independent answers

Spawn all members **in one message, in parallel**, with `run_in_background: false` so you get every answer before continuing. Use `subagent_type: "general-purpose"`, the seat's `model`, and a prompt like this:

```
You are a member of an expert council. Your lens: <LENS>.
Answer the question below on your own. Other members are answering it separately.

<CONTEXT BRIEF, if any>

QUESTION:
<QUESTION>

Requirements:
- Give a direct answer or recommendation first, then your reasoning.
- State key assumptions and your confidence (low/medium/high).
- Flag what would change your mind.
- At most ~400 words. Don't hedge for the sake of balance; commit to a position.
- Research (read files, search the web) only if the question needs facts you don't have.
```

## Stage 2: Anonymous peer review (skipped with --quick)

1. Shuffle the Stage 1 answers and label them `Response A`, `Response B`, … Keep a private map of label → seat. Never show the map to reviewers.
2. Spawn one reviewer per seat, in parallel, on the same models. Prompt:

```
You are reviewing anonymized answers to a question from an expert council.
Judge them on accuracy, depth of reasoning, practical usefulness, and honesty about uncertainty.

QUESTION:
<QUESTION>

<Response A>
...
</Response A>
<Response B>
...
</Response B>
...

Output exactly:
1. For each response: one or two lines on its biggest strength and biggest flaw.
2. Points that any response got wrong, or that every response missed.
3. A final line in this format and nothing after it:
FINAL RANKING: <best label>, <next>, ..., <worst label>
```

3. Parse each `FINAL RANKING` line. Score each response by its average position across reviewers (lower is better). If a reviewer's ranking can't be parsed, leave it out and say so.

## Stage 3: Chairman synthesis

Now act as chairman and write the final answer yourself. Don't just pick the top-ranked response. Combine the strongest reasoning, fix the errors that reviewers found, and settle disagreements with a clear call. Where the council truly split, say so and explain which side you came down on and why.

Present it to the user in this format:

```
## Council verdict
<The synthesized answer: recommendation first, then the essential reasoning.>

## Where the council agreed / disagreed
- Consensus: ...
- Dissent: <seat lens> argued ..., because ...

## Peer ranking            (omit with --quick)
| Rank | Member (lens · model) | Avg position |
|------|-----------------------|--------------|

## Confidence
<low/medium/high> and the main open question.
```

Keep the whole reply readable at a glance. Don't paste the raw member answers unless the user asks. Offer them in one line instead.
