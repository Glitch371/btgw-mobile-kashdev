export default {
  async fetch(request, env, ctx) {
    const upstream = 'https://www.narutobtgw.altervista.org';
    const url = new URL(request.url);
    const targetUrl = new URL(url.pathname + url.search, upstream);

    // 1. Proxy della richiesta
    let reqToUpstream = new Request(targetUrl, request);
    reqToUpstream.headers.set('Host', targetUrl.hostname);
    reqToUpstream.headers.set('Referer', upstream);

    const response = await fetch(reqToUpstream, { redirect: 'manual' });

    // 2. Gestione Redirect
    const newHeaders = new Headers(response.headers);
    if (newHeaders.has('Location')) {
      const loc = newHeaders.get('Location');
      if (loc.startsWith(upstream)) {
        newHeaders.set('Location', loc.replace(upstream, url.origin));
      }
    }

    // Pulizia Header
    newHeaders.delete('Content-Security-Policy');
    newHeaders.delete('X-Frame-Options');

    const contentType = newHeaders.get('Content-Type') || '';
    if (!contentType.includes('text/html')) {
      return new Response(response.body, { status: response.status, headers: newHeaders });
    }

    // 3. CSS "INTELLIGENTE"
    const cssInject = `
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <style>
      /* --- GLOBAL --- */
      body, html { margin: 0; padding: 0; width: 100%; height: 100%; -webkit-text-size-adjust: 100%; }
      
      /* --- LAYOUT ESTERNO (HOME) --- */
      .div_home { width: 100vw !important; height: 100dvh !important; display: block !important; overflow: hidden; }
      
      /* IFRAME CENTRALE */
      #centro_scheletro {
        position: absolute; top: 0; left: 0; right: 0; bottom: 50px; /* Spazio per la barra */
        width: 100% !important; height: auto !important;
        z-index: 1; background: #222;
      }
      iframe[name="iframe"] { width: 100%; height: 100%; border: 0; display: block; }

      /* SIDEBARS (MENU E SCHEDA) */
      .colonna_scheletro {
        position: fixed !important; top: 0; bottom: 50px;
        width: 300px !important; max-width: 85%;
        background: #d8cdb6; z-index: 2000;
        overflow-y: auto; -webkit-overflow-scrolling: touch;
        transition: transform 0.3s ease;
        box-shadow: 0 0 15px rgba(0,0,0,0.8);
        display: block !important;
      }
      .colonna_scheletro.sx { left: 0; transform: translateX(-100%); }
      .colonna_scheletro.dx { right: 0; transform: translateX(100%); }
      .colonna_scheletro.sx.is-open { transform: translateX(0); }
      .colonna_scheletro.dx.is-open { transform: translateX(0); }
      .toggle-arrow { display: none !important; }

      /* NAVBAR */
      #mobile-nav-bar {
        position: fixed; bottom: 0; left: 0; right: 0; height: 50px;
        background: #1a1a1a; display: flex; z-index: 9999; border-top: 1px solid #444;
      }
      #mobile-nav-bar button {
        background: transparent; border: none; color: #aaa;
        font-weight: bold; font-size: 13px; flex: 1; text-transform: uppercase;
      }
      #mobile-nav-bar button.active { background: #333; color: #ffcc00; border-top: 3px solid #ffcc00; }

      /* --- FIX PER LA MAPPA INTERNA --- */
      
      /* Permette lo scroll quando l'immagine diventa grande */
      .mappa_body {
        overflow: auto !important; 
        -webkit-overflow-scrolling: touch;
      }
      
      .mappa_container {
        width: 100%; height: 100%;
        position: relative;
        overflow: auto !important; /* FONDAMENTALE: permette il Pan */
      }

      /* Gestione Immagine Mappa */
      #mappa {
        /* Stato iniziale: adatta allo schermo */
        width: 100%; 
        height: auto; 
        display: block;
        
        /* Transizione fluida gestita dal JS del gioco, 
           ma noi ci assicuriamo che il CSS non blocchi l'espansione */
        max-width: none !important; 
        max-height: none !important;
      }

      /* Quando il JS del gioco aggiunge lo stile inline width: 1972px, 
         il nostro CSS sopra (width: 100%) viene sovrascritto dallo stile inline. 
         Perfetto. */

      /* Gestione Pointer (Pin) */
      #location {
        /* Assicura che i pin non vengano tagliati */
        overflow: visible !important; 
        pointer-events: none; /* Lascia cliccare attraverso il container */
      }
      
      #location > div {
        pointer-events: auto; /* Riabilita il click sui singoli pin */
        z-index: 100;
      }

      /* Rendiamo i pin più facili da toccare su mobile */
      #location img {
        width: 32px; /* Un po' più grandi */
        height: auto;
        filter: drop-shadow(0 0 2px black);
      }

      /* CHAT */
      /* Se non siamo nella mappa ma in chat, adattiamo le immagini */
      form img { max-width: 100% !important; height: auto !important; }
    </style>
    `;

    // 4. JS: Navigazione Mobile
    const jsInject = `
    <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Setup Navbar solo nel frame principale
      const colSx = document.querySelector('.colonna_scheletro.sx');
      const colDx = document.querySelector('.colonna_scheletro.dx');
      
      if (colSx && colDx && !document.getElementById('mobile-nav-bar')) {
        const nav = document.createElement('div');
        nav.id = 'mobile-nav-bar';
        nav.innerHTML = \`
          <button onclick="toggleMobileMenu('sx')" id="btn-sx">Menu</button>
          <button onclick="toggleMobileMenu('mid')" id="btn-mid" class="active">Gioco</button>
          <button onclick="toggleMobileMenu('dx')" id="btn-dx">Scheda</button>
        \`;
        document.body.appendChild(nav);

        window.toggleMobileMenu = function(side) {
          document.querySelectorAll('#mobile-nav-bar button').forEach(b => b.classList.remove('active'));
          if (side === 'sx') {
            colSx.classList.toggle('is-open'); colDx.classList.remove('is-open');
            if(colSx.classList.contains('is-open')) document.getElementById('btn-sx').classList.add('active');
            else document.getElementById('btn-mid').classList.add('active');
          } else if (side === 'dx') {
            colDx.classList.toggle('is-open'); colSx.classList.remove('is-open');
            if(colDx.classList.contains('is-open')) document.getElementById('btn-dx').classList.add('active');
            else document.getElementById('btn-mid').classList.add('active');
          } else {
            colSx.classList.remove('is-open'); colDx.classList.remove('is-open');
            document.getElementById('btn-mid').classList.add('active');
          }
        };
      }
      
      // Fix per lo scroll iniziale dell'iframe
      const iframe = document.querySelector('iframe[name="iframe"]');
      if(iframe) {
         iframe.onload = function() { window.scrollTo(0,0); };
      }
    });
    </script>
    `;

    // 5. Rewriter
    const rewriter = new HTMLRewriter()
      .on('head', { element(el) { el.append(cssInject, { html: true }); }})
      .on('body', { element(el) { el.append(jsInject, { html: true }); }})
      .on('a[href], area[href], link[href], script[src], img[src], iframe[src], form[action]', {
        element(el) {
          const attrs = ['href', 'src', 'action'];
          for (const attr of attrs) {
            if (el.hasAttribute(attr)) {
              const val = el.getAttribute(attr);
              if (val && val.startsWith(upstream)) {
                el.setAttribute(attr, val.replace(upstream, url.origin));
              }
            }
          }
        }
      });

    return rewriter.transform(new Response(response.body, { status: response.status, headers: newHeaders }));
  }
};
