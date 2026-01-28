#!/usr/bin/env bash
set -euo pipefail

mkdir -p public/assets/css public/assets/js public/assets/img

# Backups
[ -f public/index.html ] && cp public/index.html public/index.html.bak
[ -f public/style.css ] && cp public/style.css public/style.css.bak
[ -f public/assets/css/global.css ] && cp public/assets/css/global.css public/assets/css/global.css.bak
[ -f public/assets/js/main.js ] && cp public/assets/js/main.js public/assets/js/main.js.bak

# JS
cat > public/assets/js/main.js << 'EOF'
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const parallaxElements = document.querySelectorAll('.floating-card');

  parallaxElements.forEach((el, index) => {
    const speed = 0.3 + (index * 0.1);
    const direction = index % 2 === 0 ? 1 : -1;
    el.style.transform = `translateY(${scrolled * speed * direction}px) rotate(${scrolled * 0.02}deg)`;
  });
});

const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.hero, .services-section, .process-preview, .cta-section');
  sections.forEach(section => observer.observe(section));

  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
    observer.observe(card);
  });

  const processSteps = document.querySelectorAll('.process-step');
  processSteps.forEach((step, index) => {
    step.style.transitionDelay = `${index * 0.15}s`;
    observer.observe(step);
  });

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});

console.log("UWD site loaded");
EOF

# Global CSS
cat > public/assets/css/global.css << 'EOF'
:root{
  --bg:#0b0f14;
  --text:#e8eef7;
  --muted:#aab6c5;
  --card:rgba(255,255,255,0.06);
  --border:rgba(255,255,255,0.12);
  --radius:14px;
  --accent:#4a9eff;
}

*{box-sizing:border-box}

body{
  margin:0;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
  background:var(--bg);
  color:var(--text);
  overflow-x:hidden;
}

.container{width:min(1100px, calc(100% - 32px)); margin:0 auto;}

.site-header{
  position:sticky; top:0;
  background:rgba(11,15,20,0.85);
  backdrop-filter:blur(10px);
  border-bottom:1px solid var(--border);
  z-index:1000;
  animation:slideDown 0.5s ease-out;
}

@keyframes slideDown{
  from{transform:translateY(-100%)}
  to{transform:translateY(0)}
}

.site-header .container{
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 0;
}

.logo{margin:0;font-size:18px;letter-spacing:.4px}

.nav a{
  color:var(--muted);
  text-decoration:none;
  margin-left:20px;
  position:relative;
  transition:color 0.3s;
}

.nav a::after{
  content:'';
  position:absolute;
  bottom:-4px;
  left:0;
  width:0;
  height:2px;
  background:var(--accent);
  transition:width 0.3s;
}

.nav a:hover{color:var(--text)}
.nav a:hover::after{width:100%}

.btn{
  border:1px solid var(--border);
  background:rgba(255,255,255,0.08);
  color:var(--text);
  padding:12px 24px;
  border-radius:12px;
  cursor:pointer;
  text-decoration:none;
  display:inline-block;
  transition:all 0.3s ease;
  font-weight:500;
}

.btn:hover{
  background:rgba(255,255,255,0.12);
  transform:translateY(-2px);
  box-shadow:0 4px 12px rgba(0,0,0,0.2);
}

.btn-primary{
  background:var(--accent);
  border-color:var(--accent);
  color:#fff;
}

.btn-primary:hover{
  background:#3d8de6;
  border-color:#3d8de6;
}

.btn-secondary{
  background:transparent;
  border-color:var(--border);
}

.card{
  border:1px solid var(--border);
  background:var(--card);
  border-radius:var(--radius);
  padding:24px;
  transition:all 0.3s;
}

.site-footer{
  border-top:1px solid var(--border);
  padding:60px 0 24px;
  margin-top:120px;
  background:rgba(255,255,255,0.02);
}

.footer-grid{
  display:grid;
  grid-template-columns:2fr 1fr 1fr 1fr;
  gap:40px;
  margin-bottom:40px;
}

.footer-col h3{margin:0 0 12px;font-size:18px;}
.footer-col h4{margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;color:var(--muted);}
.footer-col p{color:var(--muted);margin:0;line-height:1.6;}

.footer-col ul{list-style:none;padding:0;margin:0;}
.footer-col ul li{margin-bottom:10px;}
.footer-col ul li a{color:var(--muted);text-decoration:none;transition:color 0.2s;}
.footer-col ul li a:hover{color:var(--text);}

.footer-bottom{
  padding-top:24px;
  border-top:1px solid var(--border);
  text-align:center;
  color:var(--muted);
  font-size:14px;
}
.footer-bottom p{margin:0;}

@keyframes float{
  0%, 100%{transform:translateY(0px)}
  50%{transform:translateY(-20px)}
}

@keyframes fadeInUp{
  from{opacity:0;transform:translateY(30px);}
  to{opacity:1;transform:translateY(0);}
}

.hero, .services-section, .process-preview, .cta-section, .service-card{
  opacity:0;
  transform:translateY(30px);
  transition:all 0.6s ease-out;
}

.hero.visible, .services-section.visible, .process-preview.visible, .cta-section.visible, .service-card.visible{
  opacity:1;
  transform:translateY(0);
}

@media(max-width:768px){
  .site-header .container{flex-direction:column;gap:12px;}
  .nav{display:flex;gap:12px;}
  .nav a{margin-left:0}
  .footer-grid{grid-template-columns:1fr;gap:32px;}
}
EOF

# Home CSS
cat > public/style.css << 'EOF'
.hero{padding:100px 0 120px;position:relative;overflow:hidden;}
.hero .container{display:grid;grid-template-columns:1.2fr 1fr;gap:60px;align-items:center;}

.hero-badge{
  display:inline-block;padding:8px 16px;background:rgba(74,158,255,0.1);
  border:1px solid rgba(74,158,255,0.3);border-radius:20px;color:var(--accent);
  font-size:13px;font-weight:500;letter-spacing:0.5px;margin-bottom:24px;
  animation:fadeInUp 0.6s ease-out 0.2s both;
}

.hero-title{font-size:56px;line-height:1.1;margin:0 0 24px;font-weight:700;animation:fadeInUp 0.6s ease-out 0.3s both;}

.gradient-text{
  background:linear-gradient(135deg, #4a9eff 0%, #7b61ff 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}

.hero-subtitle{
  font-size:20px;line-height:1.6;color:var(--muted);
  margin:0 0 32px;max-width:520px;
  animation:fadeInUp 0.6s ease-out 0.4s both;
}

.hero-cta{display:flex;gap:16px;animation:fadeInUp 0.6s ease-out 0.5s both;}

.hero-visual{position:relative;height:400px;}
.floating-card{position:absolute;border:1px solid var(--border);background:var(--card);border-radius:var(--radius);backdrop-filter:blur(10px);will-change:transform;}

.card-1{width:220px;height:180px;top:20px;left:20px;background:linear-gradient(135deg, rgba(74,158,255,0.15) 0%, rgba(123,97,255,0.1) 100%);animation:float 6s ease-in-out infinite;}
.card-2{width:200px;height:160px;top:120px;right:40px;background:linear-gradient(135deg, rgba(123,97,255,0.15) 0%, rgba(74,158,255,0.1) 100%);animation:float 7s ease-in-out infinite 0.5s;}
.card-3{width:180px;height:140px;bottom:60px;left:100px;background:linear-gradient(135deg, rgba(74,158,255,0.1) 0%, rgba(123,97,255,0.15) 100%);animation:float 8s ease-in-out infinite 1s;}

.services-section{padding:80px 0;}
.section-header{text-align:center;margin-bottom:60px;}
.section-header h2{font-size:42px;margin:0 0 12px;}
.section-header p{font-size:18px;color:var(--muted);margin:0;}

.services-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:24px;}

.service-card{
  border:1px solid var(--border);background:var(--card);border-radius:var(--radius);
  padding:32px;text-decoration:none;color:inherit;position:relative;overflow:hidden;
  transition:all 0.3s ease;
}

.service-card::before{
  content:'';position:absolute;top:0;left:0;right:0;bottom:0;
  background:linear-gradient(135deg, rgba(74,158,255,0.08) 0%, rgba(123,97,255,0.05) 100%);
  opacity:0;transition:opacity 0.3s;
}
.service-card:hover::before{opacity:1;}
.service-card:hover{transform:translateY(-4px);border-color:rgba(74,158,255,0.4);box-shadow:0 8px 24px rgba(0,0,0,0.2);}

.service-icon{font-size:32px;margin-bottom:16px;}
.service-card h3{margin:0 0 12px;font-size:22px;}
.service-card p{color:var(--muted);margin:0;line-height:1.6;}

.service-arrow{
  position:absolute;bottom:32px;right:32px;font-size:24px;color:var(--accent);
  opacity:0;transform:translateX(-10px);transition:all 0.3s;
}
.service-card:hover .service-arrow{opacity:1;transform:translateX(0);}

.service-card-all{background:linear-gradient(135deg, rgba(74,158,255,0.1) 0%, rgba(123,97,255,0.08) 100%);border-color:rgba(74,158,255,0.3);}

.process-preview{padding:80px 0;background:rgba(255,255,255,0.02);}
.process-content{text-align:center;}
.process-content h2{font-size:42px;margin:0 0 12px;}
.process-subtitle{font-size:18px;color:var(--muted);margin:0 0 60px;}

.process-steps{display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:32px;margin-bottom:48px;}
.process-step{text-align:center;opacity:0;transform:translateY(30px);transition:all 0.6s ease-out;}
.process-step.visible{opacity:1;transform:translateY(0);}

.step-number{
  display:inline-block;width:56px;height:56px;line-height:56px;border-radius:50%;
  background:linear-gradient(135deg, rgba(74,158,255,0.2) 0%, rgba(123,97,255,0.15) 100%);
  border:1px solid rgba(74,158,255,0.4);color:var(--accent);
  font-size:18px;font-weight:700;margin-bottom:16px;
}

.process-step h4{font-size:20px;margin:0 0 8px;}
.process-step p{color:var(--muted);margin:0;line-height:1.6;}

.cta-section{padding:80px 0;}
.cta-card{
  text-align:center;padding:60px 40px;border:1px solid var(--border);
  background:linear-gradient(135deg, rgba(74,158,255,0.08) 0%, rgba(123,97,255,0.06) 100%);
  border-radius:var(--radius);position:relative;overflow:hidden;
}
.cta-card::before{
  content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;
  background:radial-gradient(circle, rgba(74,158,255,0.15) 0%, transparent 70%);
  animation:rotate 20s linear infinite;
}
@keyframes rotate{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
.cta-card h2{font-size:36px;margin:0 0 16px;position:relative;z-index:1;}
.cta-card p{font-size:18px;color:var(--muted);margin:0 0 32px;position:relative;z-index:1;}
.cta-buttons{display:flex;gap:16px;justify-content:center;position:relative;z-index:1;}

@media(max-width:768px){
  .hero{padding:60px 0 80px;}
  .hero .container{grid-template-columns:1fr;gap:40px;}
  .hero-visual{height:300px;}
  .hero-title{font-size:38px;}
  .hero-subtitle{font-size:18px;}
  .hero-cta{flex-direction:column;}
  .section-header h2, .process-content h2, .cta-card h2{font-size:32px;}
  .services-grid{grid-template-columns:1fr;}
  .process-steps{grid-template-columns:1fr;}
  .cta-buttons{flex-direction:column;}
}
EOF

# Home HTML
cat > public/index.html << 'EOF'
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Udoff Web Development - Custom Sites Built Clean, Fast, and Correctly</title>
  <meta name="description" content="Design + development for small businesses, professionals, and startups who need a web presence that actually works.">
  <link rel="stylesheet" href="/assets/css/global.css" />
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <header class="site-header">
    <div class="container">
      <h1 class="logo"><a href="/" style="color:inherit;text-decoration:none;">Udoff Web Development</a></h1>
      <nav class="nav">
        <a href="/services/">Services</a>
        <a href="/work/">Work</a>
        <a href="/process/">Process</a>
        <a href="/about/">About</a>
        <a href="/contact/">Contact</a>
      </nav>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <div class="hero-badge">Web Development Done Right</div>
          <h2 class="hero-title">
            Custom sites built<br/>
            <span class="gradient-text">clean, fast, and correctly</span>
          </h2>
          <p class="hero-subtitle">
            Design + development for small businesses, professionals, and startups who need a web presence that actually works.
          </p>
          <div class="hero-cta">
            <a class="btn btn-primary" href="/contact/">Start a Project</a>
            <a class="btn btn-secondary" href="/work/">View Our Work</a>
          </div>
        </div>
        <div class="hero-visual">
          <div class="floating-card card-1"></div>
          <div class="floating-card card-2"></div>
          <div class="floating-card card-3"></div>
        </div>
      </div>
    </section>

    <section class="services-section">
      <div class="container">
        <div class="section-header">
          <h2>What We Do</h2>
          <p>Full-stack solutions for your web needs</p>
        </div>
        <div class="services-grid">
          <a href="/services/web-design/" class="service-card">
            <div class="service-icon">✦</div>
            <h3>Web Design</h3>
            <p>Beautiful, user-focused designs that convert visitors into customers.</p>
            <span class="service-arrow">→</span>
          </a>
          <a href="/services/web-development/" class="service-card">
            <div class="service-icon">⚡</div>
            <h3>Web Development</h3>
            <p>Clean, performant code built with modern technologies.</p>
            <span class="service-arrow">→</span>
          </a>
          <a href="/services/seo-performance/" class="service-card">
            <div class="service-icon">📈</div>
            <h3>SEO & Performance</h3>
            <p>Get found on Google and load instantly on any device.</p>
            <span class="service-arrow">→</span>
          </a>
          <a href="/services/maintenance-support/" class="service-card">
            <div class="service-icon">🛠</div>
            <h3>Maintenance & Support</h3>
            <p>Ongoing care to keep your site secure, fast, and up-to-date.</p>
            <span class="service-arrow">→</span>
          </a>
          <a href="/services/consulting-audits/" class="service-card">
            <div class="service-icon">🔍</div>
            <h3>Consulting & Audits</h3>
            <p>Expert analysis and recommendations for existing sites.</p>
            <span class="service-arrow">→</span>
          </a>
          <a href="/services/" class="service-card service-card-all">
            <div class="service-icon">➜</div>
            <h3>View All Services</h3>
            <p>Explore our complete range of offerings.</p>
            <span class="service-arrow">→</span>
          </a>
        </div>
      </div>
    </section>

    <section class="process-preview">
      <div class="container">
        <div class="process-content">
          <h2>Our Process</h2>
          <p class="process-subtitle">From idea to launch, we make it simple</p>
          <div class="process-steps">
            <div class="process-step">
              <div class="step-number">01</div>
              <h4>Discovery</h4>
              <p>We learn about your business, goals, and audience.</p>
            </div>
            <div class="process-step">
              <div class="step-number">02</div>
              <h4>Design</h4>
              <p>We create mockups and iterate until it's perfect.</p>
            </div>
            <div class="process-step">
              <div class="step-number">03</div>
              <h4>Development</h4>
              <p>We build your site with clean, maintainable code.</p>
            </div>
            <div class="process-step">
              <div class="step-number">04</div>
              <h4>Launch</h4>
              <p>We deploy, test, and hand off with full training.</p>
            </div>
          </div>
          <a class="btn btn-secondary" href="/process/">See Full Process</a>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="container">
        <div class="cta-card">
          <h2>Ready to build something great?</h2>
          <p>Let's talk about your project. No pressure, just possibilities.</p>
          <div class="cta-buttons">
            <a class="btn btn-primary" href="/contact/">Get in Touch</a>
            <a class="btn btn-secondary" href="/pricing/">View Pricing</a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col">
          <h3>Udoff Web Development</h3>
          <p>Building the web, one site at a time.</p>
        </div>
        <div class="footer-col">
          <h4>Services</h4>
          <ul>
            <li><a href="/services/web-design/">Web Design</a></li>
            <li><a href="/services/web-development/">Web Development</a></li>
            <li><a href="/services/seo-performance/">SEO & Performance</a></li>
            <li><a href="/services/maintenance-support/">Maintenance</a></li>
            <li><a href="/services/consulting-audits/">Consulting</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="/about/">About</a></li>
            <li><a href="/work/">Work</a></li>
            <li><a href="/process/">Process</a></li>
            <li><a href="/pricing/">Pricing</a></li>
            <li><a href="/faq/">FAQ</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Legal</h4>
          <ul>
            <li><a href="/privacy/">Privacy Policy</a></li>
            <li><a href="/terms/">Terms of Service</a></li>
          </ul>
          <h4 style="margin-top:24px;">Connect</h4>
          <ul>
            <li><a href="/contact/">Contact</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 Udoff Web Development. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <script src="/assets/js/main.js"></script>
</body>
</html>
EOF

ls -la public/assets/css/global.css public/style.css public/assets/js/main.js public/index.html
BASHchmod +x scripts/apply-homepage.sh
./scripts/apply-homepage.sh

git status
git add public/index.html public/style.css public/assets/css/global.css public/assets/js/main.js scripts/apply-homepage.sh
git commit -m "Apply homepage (HTML/CSS/JS) via script"
git push




EOF
