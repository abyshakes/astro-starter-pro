---
title: "Building AI-Powered Laravel Apps with the Laravel AI SDK"
pubDate: "2026-02-24"
description: "A practical guide to integrating AI into Laravel applications using the Laravel AI SDK — from installation to building your first AI-driven feature."
author: "Abhishek Prabhu"
category: "Development"
tags: ["laravel", "ai", "sdk", "php", "integration"]
image: "/blog/blog_post_3_1768848720552.webp"
---

There's a difference between using AI as a developer tool and shipping AI as a product feature. The first changes how you write code. The second changes what your application can do for users.

The Laravel AI SDK is for the second category. It gives you a clean, Laravel-idiomatic interface to large language models — fitting naturally into the service/controller/queue architecture you already know.

## Installation

```bash
composer require laravel-ai/sdk
php artisan vendor:publish --provider="LaravelAI\ServiceProvider"
```

Add your credentials to `.env`:

```env
ANTHROPIC_API_KEY=your-key-here
AI_DEFAULT_MODEL=claude-sonnet-4-6
```

The published config at `config/ai.php` gives you control over default models, timeouts, retry behaviour, and per-feature overrides.

## Your first AI call

The `AI` facade is the primary entry point:

```php
use LaravelAI\Facades\AI;

$response = AI::prompt('Summarise this support ticket in one sentence.')
    ->withContext($ticket->body)
    ->generate();

echo $response->text();
```

The fluent interface reads cleanly and maps directly to the underlying API. No raw HTTP calls, no JSON wrangling.

## Structuring AI features as services

I treat AI features the same way I'd treat any external dependency — behind a service class, injected via the container, mockable in tests.

```php
// app/Services/AI/TicketClassifierService.php

namespace App\Services\AI;

use App\Models\SupportTicket;
use LaravelAI\Facades\AI;

class TicketClassifierService
{
    public function classify(SupportTicket $ticket): string
    {
        $response = AI::prompt($this->buildPrompt($ticket))
            ->withModel('claude-haiku-4-5')
            ->generate();

        return $response->text();
    }

    private function buildPrompt(SupportTicket $ticket): string
    {
        return <<<PROMPT
        Classify the following support ticket into one of these categories:
        billing, technical, account, general.

        Respond with only the category name, lowercase.

        Ticket: {$ticket->body}
        PROMPT;
    }
}
```

Injecting this into a controller or job keeps the logic isolated and testable without hitting the API in unit tests.

## Streaming responses

For features where latency matters — chat interfaces, live content generation — the SDK supports streaming out of the box:

```php
return response()->stream(function () use ($prompt) {
    AI::prompt($prompt)
        ->stream(function (string $chunk) {
            echo $chunk;
            ob_flush();
            flush();
        });
}, 200, ['Content-Type' => 'text/event-stream']);
```

This works well with Alpine.js or Livewire on the frontend, where you can consume the stream and update the UI progressively.

## Queuing AI jobs

For non-interactive processing — bulk document summarisation, nightly report generation, background classification — wrap your AI calls in standard Laravel jobs:

```php
class ClassifyTicketJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public SupportTicket $ticket) {}

    public function handle(TicketClassifierService $classifier): void
    {
        $category = $classifier->classify($this->ticket);
        $this->ticket->update(['category' => $category]);
    }
}
```

Rate limiting, retries, and exponential backoff are all handled by Laravel's queue system, which is exactly where that logic belongs.

## Testing

Mock the `AI` facade in tests to avoid live API calls:

```php
AI::fake([
    'billing',
]);

$ticket = SupportTicket::factory()->create(['body' => 'I was charged twice.']);
ClassifyTicketJob::dispatchSync($ticket);

expect($ticket->fresh()->category)->toBe('billing');
```

The fake respects the order of responses you provide, making multi-step AI interactions straightforward to test.

## What to build first

The most immediately valuable AI features in a typical web application tend to be:

- **Content summarisation** — long documents, support tickets, meeting notes
- **Classification and tagging** — categorising user-generated content at scale
- **Copy assistance** — generating first drafts, subject lines, descriptions
- **Semantic search preparation** — generating embeddings for vector search

These map cleanly to the prompt/generate pattern and have obvious, measurable value that's easy to validate with stakeholders.

The SDK gets you to a working prototype of any of these in an afternoon. Getting it to production-quality requires the same care as any feature — but the foundation is solid.
