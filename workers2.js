export default {
  async fetch(request, env, ctx) {
    const upstream = 'https://www.narutobtgw.altervista.org';
    const url = new URL(request.url);
    const targetUrl = new URL(url.pathname + url.search, upstream);

    let reqToUpstream = new Request(targetUrl, request);
    reqToUpstream.headers.set('Host', targetUrl.hostname);
    reqToUpstream.headers.set('Referer', upstream);

    const response = await fetch(reqToUpstream, { redirect: 'manual' });

    const newHeaders = new Headers(response.headers);
    if (newHeaders.has('Location')) {
      const loc = newHeaders.get('Location');
      if (loc.startsWith(upstream)) {
        newHeaders.set('Location', loc.replace(upstream, url.origin));
      }
    }

  

    const contentType = newHeaders.get('Content-Type') || '';
    if (!contentType.includes('text/html')) {
      return new Response(response.body, { status: response.status, headers: newHeaders });
    }

    // --- CSS ---
    const cssInject = `
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <style>
      /* GLOBAL */
      body, html { margin: 0; padding: 0; width: 100%; height: 100%; -webkit-text-size-adjust: 100%; background: #d8cdb6; }
      
      /* LAYOUT */
      .div_home { width: 100vw !important; height: 100dvh !important; display: block !important; overflow: hidden; background: #d8cdb6; }
      
      #centro_scheletro {
        position: absolute !important; top: 0; left: 0; width: 100%; 
        height: calc(100dvh - 50px) !important; z-index: 1; background: #d8cdb6;
      }
      iframe[name="iframe"] { width: 100%; height: 100%; border: 0; display: block; background: #d8cdb6; }

      /* NAVBAR */
      #mobile-nav-bar {
        position: fixed; bottom: 0; left: 0; width: 100%; height: 50px;
        background: #1a1a1a; display: flex; z-index: 20000; border-top: 1px solid #444;
      }
      #mobile-nav-bar button {
        background: transparent; border: none; color: #aaa; font-weight: bold; font-size: 13px; flex: 1; text-transform: uppercase;
      }
      #mobile-nav-bar button.active { background: #333; color: #ffcc00; border-top: 3px solid #ffcc00; }

      /* SIDEBARS */
      .colonna_scheletro {
        position: fixed; top: 0; bottom: 50px; width: 300px; max-width: 85%;
        background: #d8cdb6; z-index: 2000; overflow-y: auto; display: block !important;
        transition: transform 0.2s ease-out;
      }
      .colonna_scheletro.sx { left: 0; transform: translateX(-100%); }
      .colonna_scheletro.dx { right: 0; transform: translateX(100%); }
      .colonna_scheletro.sx.is-open { transform: translateX(0); }
      .colonna_scheletro.dx.is-open { transform: translateX(0); }
      .toggle-arrow { display: none !important; }

      /* MAPPA FIX SFONDO */
      .mappa_body, .mappa_container { overflow: auto !important; background: #d8cdb6 !important; }
      #mappa { width: 100%; height: auto; max-width: none !important; }
      #location { overflow: visible !important; pointer-events: none; }
      #location > div { pointer-events: auto; z-index: 100; }
      #location img { width: 32px; height: auto; }

      /* ========================================= */
      /* === CHAT ROOM (FIX V23) === */
      /* ========================================= */

      #corpo {
        width: 100% !important; padding: 0 !important; margin: 0 !important;
        padding-bottom: 70px !important; box-sizing: border-box;
      }

      #chat_sidebar { 
          position: absolute; top: -9999px; left: -9999px; visibility: hidden;
      }

      /* TOOLBAR */
      #new-mobile-toolbar {
        display: none;
        position: fixed; 
        bottom: 50px; left: 0; width: 100%; height: 60px;
        background: rgba(30, 30, 30, 0.98);
        border-top: 2px solid #e6b800;
        z-index: 30000;
        padding: 5px;
        overflow-x: auto; white-space: nowrap; align-items: center; gap: 15px;
      }
      #new-mobile-toolbar.visible { display: flex; }

      /* Icone Toolbar */
      #new-mobile-toolbar .t-icon {
        width: 45px; height: 45px; background-color: #d8cdb6; border-radius: 50%;
        border: 2px solid #8d8679; display: inline-flex; align-items: center; justify-content: center;
        cursor: pointer; flex-shrink: 0; position: relative;
        background-repeat: no-repeat; background-position: center;
      }
      #new-mobile-toolbar img { width: 28px; height: 28px; pointer-events: none; }

      /* POPUP GLOBALE (CHAT) */
      #global-popup-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85);
        z-index: 2147483647; 
        display: none; justify-content: center; align-items: center;
        backdrop-filter: blur(3px);
      }
      #global-popup-overlay.active { display: flex; }

      #global-popup-content {
        background: #a09785;
        border: 2px solid #e6b800; border-radius: 10px;
        padding: 5px; width: 95%; height: 85vh; 
        overflow: hidden; 
        color: #000; position: relative;
        box-shadow: 0 0 30px rgba(0,0,0,1);
        display: flex; flex-direction: column;
      }
      
      #popup-inner { flex: 1; overflow: hidden; width: 100%; height: 100%; display: flex; flex-direction: column; }
      #popup-close {
        position: absolute; top: 2px; right: 8px; font-size: 30px; 
        color: #700; cursor: pointer; z-index: 2147483647; font-weight: bold;
        background: rgba(255,255,255,0.5); border-radius: 50%; width: 30px; height: 30px;
        line-height: 30px; text-align: center;
      }

      /* FIX BLOCCO NOTE E CHAT OFF */
      #popup-inner .form_note, #popup-inner iframe, #popup-inner .texty {
        display: flex !important; flex-direction: column !important;
        flex: 1; border: 0 !important;
      }
      #popup-inner .form_note > div:first-child { flex: 1; overflow-y: auto; background: #fff; padding: 5px; }
      #popup-inner .form_note .clearfix { flex-shrink: 0; background: #c0b8a8; padding: 8px; border-top: 1px solid #888; }
      #popup-inner textarea { height: 100% !important; width: 100% !important; resize: none; border: 0; }
      
      #popup-inner .dropdown-menu { 
          display: block !important; position: static !important; 
          float: none !important; background: #222 !important; 
          border: none !important; box-shadow: none !important;
          width: 100% !important; padding: 10px; border-radius: 5px;
          overflow-y: auto; height: 100%;
      }
      #popup-inner .dropdown-menu * { color: #fff !important; font-size: 16px !important; white-space: normal !important; }
      #popup-inner select, #popup-inner input { color: #000 !important; width: 100% !important; height: 40px; margin-bottom: 10px; }

      /* BARRA INPUT */
      #fields {
        position: fixed !important; bottom: 0 !important; left: 0 !important;
        width: 100% !important; height: auto !important; min-height: 50px;
        background: #d8cdb6 !important; border-top: 2px solid #a09785;
        z-index: 25000 !important; padding: 5px !important; box-sizing: border-box;
      }
      #fields .row.first-row { display: flex !important; align-items: center; margin: 0 !important; gap: 5px; }
      #fields .col-xs-2, #fields .col-xs-9 { width: auto !important; padding: 0 !important; float: none !important; }

      input#location, input#azione { pointer-events: auto !important; user-select: text !important; border: 1px solid #555; border-radius: 4px; height: 40px !important; }
      input#location { width: 70px !important; font-size: 11px !important; text-align: center; }
      input#azione { flex-grow: 1 !important; font-size: 14px !important; padding-left: 5px; }
      input#chars { display: none !important; }
      input#submit { width: 50px !important; height: 40px !important; background: #8d8679; color: #fff; font-weight: bold; }

      #btn-tools-toggle {
        width: 45px; height: 40px; background: #333; color: #fff; border: 1px solid #000;
        border-radius: 4px; display: flex; align-items: center; justify-content: center;
        font-size: 24px; cursor: pointer; flex-shrink: 0; pointer-events: auto !important;
      }
      
      /* === FIX MODAL BOOTSTRAP === */
      .modal.mobile-popup-fix {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 50px !important;
        width: 100% !important;
        height: auto !important;
        max-height: 100vh !important;
        overflow: auto !important;
        -webkit-overflow-scrolling: touch !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #d8cdb6 !important;
        z-index: 999999 !important;
        transform: none !important;
        border: none !important;
        display: flex !important;
        flex-direction: column !important;
      }

      .mobile-popup-fix .modal-content {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        display: flex !important;
        flex-direction: column !important;
        height: 100% !important;
      }

      .mobile-popup-fix .modal-header {
        background: transparent !important;
        border-bottom: 1px solid #8d8679 !important;
        padding: 10px !important;
        flex-shrink: 0 !important;
      }

      .mobile-popup-fix .modal-body {
        flex: 1 !important;
        overflow: auto !important;
        -webkit-overflow-scrolling: touch !important;
        padding: 10px !important;
        background: #d8cdb6 !important;
      }

      .mobile-popup-fix .close {
        position: absolute !important;
        right: 10px !important;
        top: 10px !important;
        font-size: 24px !important;
        color: #700 !important;
        z-index: 1000 !important;
      }

      .mobile-popup-fix table, 
      .mobile-popup-fix .box-mod {
        width: 100% !important;
        max-width: none !important;
      }

      /* RESPONSIVE: SCHERMO VERTICALE (PORTRAIT) */
      @media screen and (orientation: portrait) {
        .mobile-popup-fix .modal-body {
          overflow-x: auto !important;
          overflow-y: auto !important;
        }
      }

      /* RESPONSIVE: SCHERMO ORIZZONTALE (LANDSCAPE) */
      @media screen and (orientation: landscape) {
        .mobile-popup-fix {
          bottom: 35px !important;
        }

        .mobile-popup-fix .modal-header {
          position: sticky !important;
          top: 0 !important;
          z-index: 1001 !important;
          background: #a09785 !important;
          padding: 10px !important;
        }

        .mobile-popup-fix .modal-body {
          overflow-x: visible !important;
          overflow-y: auto !important;
        }
      }



      /* === LANDSCAPE FIX V23 === */
      @media screen and (orientation: landscape) and (max-height: 500px) {
        #mobile-nav-bar { height: 35px !important; }
        .colonna_scheletro { bottom: 35px !important; }
        #centro_scheletro { height: calc(100dvh - 35px) !important; }
        #fields { padding: 2px !important; min-height: 40px !important; }
        input#azione, input#location, input#submit, #btn-tools-toggle { height: 32px !important; font-size: 12px; }
        #new-mobile-toolbar { bottom: 40px !important; height: 50px; }
        #corpo { padding-bottom: 45px !important; }
        
        /* Adattamento popup in landscape */
        .mobile-popup-fix { bottom: 35px !important; }
      }
    </style>
    `;

    // --- JS ---
    const jsInject = `
    <script>
    document.addEventListener('DOMContentLoaded', function() {
      
      // === FIX POPUP/FAMA OBSERVER (MIRATO) ===
      // === FIX POPUP/FAMA OBSERVER (VERSIONE GIUSTA) ===
      const popupObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) {
              const txt = node.innerText ? node.innerText.toUpperCase() : '';
  
              if (txt.includes('REGISTRO FAMA') || txt.includes('TOTALE PUNTI FAMA')) {
                let modal = null;
  
                if (node.classList.contains('modal')) {
                  modal = node;
                } else {
                  modal = node.closest('.modal');
                }
  
                if (modal && !modal.classList.contains('mobile-popup-fix')) {
                  modal.classList.add('mobile-popup-fix');
                  console.log('✅ FAMA Modal');
      
                  // LISTENER PER CHIUDERE E RIAPRIRE
                  const closeBtn = modal.querySelector('.close');
                  if (closeBtn) {
                    closeBtn.addEventListener('click', function(e) {
                      e.preventDefault();
                      modal.classList.remove('mobile-popup-fix');
                      $(modal).modal('hide');
                    });
                  }
                }
              }
            }
          });
        });
      });
      popupObserver.observe(document.body, { childList: true, subtree: true });

      // === LOGICA CHAT ===
      const fieldsBar = document.getElementById('fields');
      const oldSidebar = document.getElementById('chat_sidebar');
      
      if (fieldsBar && oldSidebar) {
        
        // 1. Toolbar
        const newToolbar = document.createElement('div');
        newToolbar.id = 'new-mobile-toolbar';
        document.body.appendChild(newToolbar);

        // 2. Overlay
        const overlay = document.createElement('div');
        overlay.id = 'global-popup-overlay';
        overlay.innerHTML = '<div id="global-popup-content"><div id="popup-close">&times;</div><div id="popup-inner"></div></div>';
        document.body.appendChild(overlay);
        
        const popupInner = document.getElementById('popup-inner');
        const popupClose = document.getElementById('popup-close');

        // Restore Elements Logic
        let activeElement = null;
        let activeElementParent = null;

        function closePopup() {
            overlay.classList.remove('active');
            if (activeElement && activeElementParent) {
                activeElementParent.appendChild(activeElement);
                activeElement = null;
                activeElementParent = null;
            }
            popupInner.innerHTML = ''; 
        }
        popupClose.onclick = closePopup;
        overlay.onclick = function(e) { if(e.target === overlay) closePopup(); };

        // 3. Estrai Icone
        const items = oldSidebar.querySelectorAll('.dropup');
        
        items.forEach(function(wrapper) {
            const btn = wrapper.querySelector('.btn-chat');
            let content = wrapper.querySelector('.dropdown-menu');
            if(!content) content = wrapper.querySelector('.texty');
            
            if (btn) {
                const newIcon = document.createElement('div');
                newIcon.className = 't-icon';
                newIcon.className = 't-icon ' + btn.className.replace('btn-chat','');
                if(btn.id) newIcon.id = btn.id;
                
                if(btn.innerHTML.trim() !== '') {
                    newIcon.innerHTML = btn.innerHTML;
                }
                
                newToolbar.appendChild(newIcon);
                
                newIcon.onclick = function() {
                    if(activeElement) closePopup();
                    
                    if (content) {
                        activeElement = content;
                        activeElementParent = content.parentNode;
                        popupInner.appendChild(content);
                        overlay.classList.add('active');
                    }
                };
            }
        });

        const toolsBtn = document.createElement('div');
        toolsBtn.id = 'btn-tools-toggle';
        toolsBtn.innerHTML = '⚙️';
        const row = fieldsBar.querySelector('.first-row');
        if(row) row.appendChild(toolsBtn);

        toolsBtn.addEventListener('click', function(e) {
             e.preventDefault();
             e.stopPropagation();
             newToolbar.classList.toggle('visible');
        });
      }

      // === LOGICA MENU HOME ===
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
          const btnSx = document.getElementById('btn-sx');
          const btnMid = document.getElementById('btn-mid');
          const btnDx = document.getElementById('btn-dx');
          
          btnSx.classList.remove('active');
          btnMid.classList.remove('active');
          btnDx.classList.remove('active');

          if (side === 'sx') {
            if(colSx.classList.contains('is-open')) {
                colSx.classList.remove('is-open');
                btnMid.classList.add('active');
            } else {
                colDx.classList.remove('is-open');
                colSx.classList.add('is-open');
                btnSx.classList.add('active');
            }
          } 
          else if (side === 'dx') {
            if(colDx.classList.contains('is-open')) {
                colDx.classList.remove('is-open');
                btnMid.classList.add('active');
            } else {
                colSx.classList.remove('is-open');
                colDx.classList.add('is-open');
                btnDx.classList.add('active');
            }
          } 
          else {
            colSx.classList.remove('is-open');
            colDx.classList.remove('is-open');
            btnMid.classList.add('active');
          }
        };
      }
      
      const iframe = document.querySelector('iframe[name="iframe"]');
      if(iframe) { iframe.onload = function() { window.scrollTo(0,0); }; }
    });
    </script>
    `;

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
