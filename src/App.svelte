<script>
  import FaceViewer from './lib/FaceViewer.svelte'
  import QA from './lib/QA.svelte'
  const title = 'danBot'
  const subtitle = 'Ask me anything'
  let speaking = false
  let speakTimer
  function onAnswering(e) {
    const answer = e?.detail?.item?.answer || ''
    const dur = Math.min(6000, Math.max(1500, answer.length * 35))
    speaking = true
    clearTimeout(speakTimer)
    speakTimer = setTimeout(() => { speaking = false }, dur)
  }
</script>

<main class="wrap">
  <header class="hero">
    <h1>{title}</h1>
    <p>{subtitle}</p>
  </header>
  <FaceViewer {speaking} />
  <QA on:answering={onAnswering} />
  <footer class="foot">
    <a href="https://github.com/danrose499/danBot" target="_blank" rel="noreferrer">GitHub</a>
  </footer>
</main>

<style>
  .wrap {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    min-height: 100svh;
    width: 100%;
    margin: 0;
    padding: 0;
    text-align: center;
    background: radial-gradient(1200px 600px at 50% -10%, rgba(47,109,246,0.22), transparent 60%),
                linear-gradient(180deg, #0b0e14 0%, #0b0e14 100%);
  }
  .hero, .foot { width: 100%; }
  .hero h1 {
    margin: 0.5rem 0 0.25rem;
    font-size: clamp(1.8rem, 3.5vw, 3rem);
    letter-spacing: 0.5px;
  }
  .hero p {
    margin: 0;
    color: #9aa3b2;
  }
  .foot {
    margin-top: auto;
    margin-bottom: 5rem;
    opacity: 0.8;
  }
  .foot a { color: #7aa2ff; }
</style>
