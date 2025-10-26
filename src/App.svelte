<script>
  import FaceViewer from './lib/FaceViewer.svelte'
  import QA from './lib/QA.svelte'
  const title = 'danBot'
  const subtitle = 'Ask me anything'
</script>

<main class="wrap">
  <header class="hero">
    <h1>{title}</h1>
    <p>{subtitle}</p>
  </header>
  <FaceViewer />
  <QA />
  <footer class="foot">
    <a href="https://github.com/danrose499/danBot" target="_blank" rel="noreferrer">GitHub</a>
  </footer>
</main>

<style>
  .wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    min-height: 100vh;
    width: 100%;
    margin: 0 auto;
    padding: 1.5rem 1rem 2rem;
    text-align: center;
    background: radial-gradient(1200px 600px at 50% -10%, rgba(47,109,246,0.22), transparent 60%),
                linear-gradient(180deg, #0b0e14 0%, #0b0e14 100%);
  }
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
    opacity: 0.8;
  }
  .foot a { color: #7aa2ff; }
</style>
