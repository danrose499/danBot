<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  let messages = [
    { role: 'assistant', content: "Hi! I'm danBot. Ask me anything." }
  ];
  let input = '';
  let loading = false;
  let error = '';
  const WORKER_URL = import.meta.env?.DEV
    ? '/api'
    : 'https://openai-proxy.danielrosenthal.workers.dev';

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    error = '';
    input = '';
    messages = [...messages, { role: 'user', content: text }];
    loading = true;
    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: text }] })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const assistant = data?.choices?.[0]?.message?.content?.trim?.();
      if (!assistant) throw new Error('No content');
      messages = [...messages, { role: 'assistant', content: assistant }];
      dispatch('answering', { item: { answer: assistant } });
    } catch (err) {
      console.error(err);
      error = 'Something went wrong. Please try again.';
    } finally {
      loading = false;
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }
</script>

<section class="qa">
  <div class="chat" role="log" aria-live="polite">
    {#each messages as m}
      <div class="msg {m.role}">
        <p>{m.content}</p>
      </div>
    {/each}
    {#if loading}
      <div class="msg assistant">
        <p>...</p>
      </div>
    {/if}
  </div>
  {#if error}
    <div class="error">{error}</div>
  {/if}
  <form class="input" on:submit|preventDefault={send}>
    <input
      type="text"
      placeholder="Ask me anything"
      bind:value={input}
      on:keydown={onKey}
      aria-label="Message"
    />
    <button type="submit" disabled={loading || !input.trim()}>Send</button>
  </form>
</section>

<style>
  .qa {
    width: 75%;
    max-width: none;
    margin: 0.5rem auto;
    padding: 0 0 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .chat {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid #2a2f3a;
    border-radius: 12px;
    padding: 1rem;
    height: min(40vh, 28rem);
    overflow-y: auto;
  }
  .msg {
    display: flex;
  }
  .msg p {
    margin: 0;
    padding: 0.6rem 0.9rem;
    border-radius: 10px;
    line-height: 1.6;
    max-width: 100%;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  .msg.user { justify-content: flex-end; }
  .msg.user p {
    background: #2f6df6;
    color: white;
  }
  .msg.assistant { justify-content: flex-start; }
  .msg.assistant p {
    background: #0f1115;
    border: 1px solid #2a2f3a;
    color: #cfd3d8;
  }
  .input {
    display: flex;
    gap: 0.5rem;
  }
  .input input {
    flex: 1;
    background: #0f1115;
    border: 1px solid #2a2f3a;
    color: #e6e8eb;
    padding: 0.6rem 0.9rem;
    border-radius: 10px;
  }
  .input button {
    background: #2f6df6;
    border: 1px solid #2f6df6;
    color: white;
    padding: 0.6rem 0.9rem;
    border-radius: 10px;
    font-size: 0.95rem;
  }
  .input button[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .error {
    color: #ff7b7b;
    font-size: 0.9rem;
  }
</style>
