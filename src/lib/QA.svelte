<script>
  import { qa } from './qa.js';
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  let selected = qa[0];
  function select(item) {
    selected = item;
    dispatch('answering', { item });
  }
</script>

<section class="qa">
  <div class="chips" role="list">
    {#each qa as item}
      <button
        class:selected={selected?.id === item.id}
        on:click={() => select(item)}
        aria-pressed={selected?.id === item.id}
      >{item.question}</button>
    {/each}
  </div>
  <div class="answer" aria-live="polite">
    <p>{selected?.answer}</p>
  </div>
</section>

<style>
  .qa {
    width: 75%;
    max-width: none;
    margin: 0.5rem auto;
    padding: 0 0 0.75rem;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
    margin-bottom: 0.75rem;
  }
  button {
    background: #0f1115;
    border: 1px solid #2a2f3a;
    color: #e6e8eb;
    padding: 0.6rem 0.9rem;
    border-radius: 999px;
    font-size: 0.95rem;
  }
  button.selected {
    background: #2f6df6;
    border-color: #2f6df6;
    color: white;
  }
  .answer {
    background: rgba(255,255,255,0.03);
    border: 1px solid #2a2f3a;
    border-radius: 12px;
    padding: 1.25rem;
    color: #cfd3d8;
    line-height: 1.6;
  }
</style>
