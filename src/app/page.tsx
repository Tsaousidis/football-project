import Link from "next/link";
import styles from "./home.module.css";

const features = [
  { number: "01", title: "Your clubs. Your perspective.", text: "Choose up to three teams across leagues. Keep their fixtures, results and standings together in one personal dashboard." },
  { number: "02", title: "The story behind the score.", text: "Catch up with concise, English-language news researched with Claude. Follow the source links when you want the full story." },
  { number: "03", title: "Take the briefing with you.", text: "Connect your private Telegram chat and send your latest saved briefing with a tap. You decide when it arrives." },
];
const questions = [
  ["Is this a live scores app?", "No. Your dashboard shows a saved research snapshot, with its update time. Refresh when you want a new briefing; scores and stories do not stream live."],
  ["What happens when I create an account?", "Verify your email, choose up to three teams, then request your first research update. Creating an account does not enable automatic research."],
  ["Can I schedule my updates?", "Yes. Enable and save a daily or weekly schedule in Profile. While enabled, it checks every 15 minutes and runs after your chosen local time. Disable and save to remove your scheduled job. An update already in progress may finish."],
  ["Will Telegram send me messages automatically?", "No. Connect the bot in Profile, then use Send briefing to Telegram on your dashboard. Scheduled research and Telegram delivery are separate."],
  ["Where does the information come from?", "Claude researches public web sources and returns a concise briefing. Stories include source links when available. AI can make mistakes, so check the original sources for important details."],
];

export default function Home() {
  return <div className={styles.home}>
    <a href="#main" className={styles.skip}>Skip to content</a>
    <header className={styles.header}>
      <Link href="/" className={styles.brand}><span className={styles.mark} aria-hidden="true">FI<span /></span><span>FOOTBALL<br />INTELLIGENCE</span></Link>
      <nav aria-label="Main navigation" className={styles.nav}>
        <a href="#how-it-works" className={styles.sectionLink}>How it works</a>
        <Link href="/auth/login">Sign in</Link>
        <Link href="/auth/signup" className={styles.smallCta}>Get started <span aria-hidden="true">?</span></Link>
      </nav>
    </header>
    <main id="main">
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span /> FOR THE FANS WHO FOLLOW THE STORY</p>
          <h1 id="hero-title">Your teams.<br />Your game.<br /><em>Your briefing.</em></h1>
          <p className={styles.intro}>Less searching. More football. The fixtures, results and stories that matter to you, in one personal briefing.</p>
          <div className={styles.actions}><Link href="/auth/signup" className={styles.primary}>Build your briefing <span aria-hidden="true">?</span></Link><a href="#preview" className={styles.textLink}>Take a look <span aria-hidden="true">?</span></a></div>
          <p className={styles.caption}>Up to 3 teams. English briefings. Your pace.</p>
        </div>
        <div className={styles.heroVisual} aria-label="Decorative football pitch illustration">
          <div className={styles.visualTop}><span>THE BEAUTIFUL GAME,<br />A CLEARER VIEW.</span><span>FI / 01</span></div>
          <div className={styles.pitch} aria-hidden="true"><div className={styles.halfway} /><div className={styles.centre} /><div className={styles.boxTop} /><div className={styles.boxBottom} /><span className={styles.playerOne}>01</span><span className={styles.playerTwo}>02</span><span className={styles.playerThree}>03</span></div>
          <div className={styles.visualBottom}><span>THREE CLUBS.<br /><strong>ONE PLACE.</strong></span><span className={styles.ball} aria-hidden="true">?</span></div>
        </div>
      </section>
      <div className={styles.strip}><span>FOLLOW THE MATCH.</span><span>UNDERSTAND THE STORY.</span><span>STAY IN CONTROL.</span></div>
      <section className={styles.section} id="preview" aria-labelledby="preview-title">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>YOUR FOOTBALL, AT A GLANCE</p><h2 id="preview-title">Everything worth<br />catching up on.</h2></div><p>A quick look before kick-off.<br />A deeper read when you have time.</p></div>
        <div className={styles.previewGrid}>
          <div className={styles.preview}>
            <div className={styles.previewHeader}><span>YOUR TEAM BRIEFING</span><span className={styles.sample}>Illustrative preview</span></div>
            <div className={styles.club}><span className={styles.clubBadge}>FC</span><div><h3>Your favourite club</h3><p>Your selection. All in one place.</p></div></div>
            <div className={styles.stats}><div><span>NEXT MATCH</span><strong>Who&apos;s next?</strong><p>Opponent ? kick-off ? venue</p></div><div><span>LAST RESULT</span><strong>The final word.</strong><p>Latest score ? competition</p></div><div><span>STANDING</span><strong>The bigger picture.</strong><p>Position ? points ? games</p></div></div>
            <div className={styles.story}><span className={styles.storyTag}>TEAM NEWS</span><h3>The stories beyond the touchline.</h3><p>Short summaries of recent coverage, with links back to the sources. Read the briefing, then go deeper.</p><span className={styles.sourceLabel}>Source links accompany available stories ?</span></div>
            <p className={styles.previewNote}>Layout illustration, not live football data.</p>
          </div>
          <div className={styles.featureList}>{features.map((feature) => <article key={feature.number}><span>{feature.number}</span><div><h3>{feature.title}</h3><p>{feature.text}</p></div></article>)}</div>
        </div>
      </section>
      <section className={styles.stepsSection} id="how-it-works" aria-labelledby="steps-title">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>A SIMPLE MATCH PLAN</p><h2 id="steps-title">From following to<br />fully caught up.</h2></div><Link href="/auth/signup" className={styles.textLink}>Make it yours ?</Link></div>
        <ol className={styles.steps}><li><span>01 / PICK</span><h3>Choose your clubs.</h3><p>Create your account, verify your email and build a shortlist of up to three teams.</p></li><li><span>02 / RESEARCH</span><h3>Get the full picture.</h3><p>Request a fresh briefing. See upcoming games, recent results, standings and club news.</p></li><li><span>03 / TAKE IT WITH YOU</span><h3>Send it to Telegram.</h3><p>Connect your chat and send your saved update whenever you want to read it on the go.</p></li></ol>
      </section>
      <section className={styles.faqSection} aria-labelledby="faq-title"><div><p className={styles.eyebrow}>BEFORE THE WHISTLE</p><h2 id="faq-title">A few things<br />to know.</h2></div><div className={styles.faq}>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
      <section className={styles.finalCta}><p className={styles.eyebrow}>YOUR NEXT BRIEFING STARTS HERE</p><h2>Stay close<br />to your clubs.</h2><Link href="/auth/signup" className={styles.darkCta}>Choose your teams <span aria-hidden="true">?</span></Link></section>
    </main>
    <footer className={styles.footer}><Link href="/" className={styles.footerBrand}>FOOTBALL INTELLIGENCE</Link><p>Made for following the game.</p><Link href="/auth/login">Sign in ?</Link></footer>
  </div>;
}
