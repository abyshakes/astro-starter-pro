---
title: "From Blank Project to Working Feature: Laravel Scaffolding with Claude Code"
pubDate: "2026-03-05"
description: "How I combine Claude Code, the Laravel AI SDK, and modern Laravel tooling to move from a blank project to a working AI-powered feature — fast."
author: "Abhishek Prabhu"
category: "Development"
tags: ["laravel", "claude-code", "ai", "scaffolding", "developer-tools"]
image: "/blog/markdown.webp"
---

The gap between knowing how to build something and having it built used to be measured in hours. For certain classes of work — spinning up a new Laravel module, wiring an AI feature into an existing app, writing the boilerplate for a queue-backed service — that gap has collapsed dramatically.

This is what my current setup looks like when I need to move fast without cutting corners.

## The stack

- **Laravel** — backend framework, still the right choice for the kind of work I do
- **Claude Code** — AI pair programmer running in the terminal, with full access to the codebase
- **Laravel AI SDK** — for shipping AI features *inside* the application
- **Laravel Pint + PHPStan** — code quality enforced automatically

These aren't in tension with each other. Claude Code is the dev-time accelerant. The Laravel AI SDK is the runtime layer for user-facing AI features. Pint and PHPStan are the safety net that keeps generated code to the same standard as hand-written code.

## Starting a new feature

My process starts with a short brief — not a massive spec, just enough context for Claude Code to understand the domain.

```
We're adding a document review feature. Users upload a PDF, the system
extracts the text, sends it to Claude via the Laravel AI SDK, and returns
a structured summary with: key points (array), risk flags (array),
recommended action (string). Store results in a document_reviews table.
Write the migration, model, service, job, and controller. Use the existing
User model for ownership. Follow the pattern in OrderService.
```

Claude Code reads the existing codebase, follows the established conventions, and produces all five files. The migration reflects the actual data shape. The service uses the AI SDK correctly. The job is queued. The controller is thin.

It's not perfect on the first pass — it rarely is — but it's close enough that the review is the work, not the writing.

## The review pass

This is where experience matters. I read everything Claude Code produces before it runs. Specifically I'm checking:

- **Business logic correctness** — does the summarisation prompt actually capture what the client needs?
- **Error handling** — AI APIs fail. Is there a sensible fallback?
- **Security** — user-uploaded content needs sanitisation before it goes anywhere near an LLM prompt
- **Test coverage** — are the generated tests actually asserting the right things, or just asserting that code runs?

The last point is easy to miss. Claude Code will write tests that pass even when the underlying logic is wrong, if the prompt doesn't make the expected behaviour explicit. I've learned to describe expected outputs precisely, not just expected execution.

## Running quality gates automatically

After each Claude Code session I run:

```bash
./vendor/bin/pint
./vendor/bin/phpstan analyse
php artisan test
```

Claude Code can run these itself and fix failures before handing off. I configure it to do this as part of the session:

```
After writing the files, run Pint and fix any style issues,
then run PHPStan at level 6 and fix any type errors,
then run the test suite and fix any failures.
```

The result is code that passes the same gates as anything I'd write by hand — because it does pass them.

## The AI SDK integration

For the document review feature, the service that calls the AI SDK looks like this:

```php
class DocumentReviewService
{
    public function review(Document $document): DocumentReviewResult
    {
        $response = AI::prompt($this->buildPrompt($document))
            ->withModel('claude-sonnet-4-6')
            ->generate();

        return $this->parseResponse($response->text());
    }

    private function buildPrompt(Document $document): string
    {
        return <<<PROMPT
        Review the following document and respond with valid JSON only.
        Schema: { "key_points": string[], "risk_flags": string[], "recommended_action": string }

        Document:
        {$document->extracted_text}
        PROMPT;
    }

    private function parseResponse(string $raw): DocumentReviewResult
    {
        $data = json_decode($raw, true, flags: JSON_THROW_ON_ERROR);

        return new DocumentReviewResult(
            keyPoints: $data['key_points'],
            riskFlags: $data['risk_flags'],
            recommendedAction: $data['recommended_action'],
        );
    }
}
```

Asking for structured JSON output and validating it before storing keeps the AI layer predictable. The `DocumentReviewResult` value object is what the rest of the application talks to — the AI implementation detail stays inside the service.

## What this actually changes

The honest answer is that the speed gain is real but not magical. What changes is the *cost* of certain decisions. When adding a new service class takes twenty minutes, you think harder about whether it's worth it. When it takes two, you just do it.

That lower friction means better structure, not worse. I find myself extracting logic into services earlier, writing tests for edge cases I'd previously have left implicit, and trying approaches I'd have abandoned as too time-consuming.

The AI is not writing the application. I am. It's removing the part where I type the same patterns I've typed two hundred times before — so I can spend more time on the part that's actually specific to this problem.

That's the shift. And for the kind of Laravel consulting I do, it's a significant one.
