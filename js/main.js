(function(){
  "use strict";
  var toast = document.getElementById('toast'), toastTimer = null;
  function showToast(msg){
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove('show'); }, 3400);
  }

  /* mobile menu */
  var burger = document.getElementById('burger'), mnav = document.getElementById('mobileNav');
  burger.addEventListener('click', function(){
    var open = mnav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  mnav.addEventListener('click', function(e){ if(e.target.tagName === 'A'){ mnav.classList.remove('open'); } });

  /* login -> honest preview message (delegated: also covers store-rendered content) */
  document.addEventListener('click', function(e){
    var el = e.target.closest ? e.target.closest('[data-login]') : null;
    if(!el) return;
    e.preventDefault();
    showToast('Log in lives in the private SheDrives app — this website is a public preview.');
  });

  /* ---- instructor search + filters + sort ---- */
  var grid = document.getElementById('instructorGrid');
  function getCards(){ return Array.prototype.slice.call(document.querySelectorAll('.icard')); }
  var note = document.getElementById('matchNote');
  var fState = { gear:'all', lang:'all', pickup:false, area:'', areaHits:null };
  function norm(s){ return (s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim(); }
  function passFilters(c){
    if(fState.gear !== 'all' && c.getAttribute('data-gear') !== fState.gear) return false;
    if(fState.lang !== 'all' && (' ' + (c.getAttribute('data-lang')||'') + ' ').indexOf(' ' + fState.lang + ' ') === -1) return false;
    if(fState.pickup && c.getAttribute('data-pickup') !== '1') return false;
    return true;
  }
  function refreshCards(){
    var cards = getCards();
    var visible = 0;
    cards.forEach(function(c){
      var pf = passFilters(c) && !c.classList.contains('owner-hidden');
      c.classList.toggle('hidden-card', !pf);
      if(!pf){ c.classList.remove('match','dim'); return; }
      visible++;
      if(fState.area){
        var hit = !!(fState.areaHits && fState.areaHits[c.getAttribute('data-name')]);
        c.classList.toggle('match', hit);
        c.classList.toggle('dim', !hit);
      } else {
        c.classList.remove('match','dim');
      }
    });
    document.getElementById('filterCount').textContent = 'Showing ' + visible + ' of ' + cards.filter(function(x){ return !x.classList.contains('owner-hidden'); }).length + ' instructors';
    return visible;
  }
  function clearFilter(){
    fState.area = ''; fState.areaHits = null;
    note.classList.remove('show'); note.textContent = '';
    refreshCards();
  }
  function applyFilter(raw){
    var cards = getCards();
    var q = norm(raw);
    if(!q){ clearFilter(); return 0; }
    var terms = q.split(' ').filter(function(t){ return t.length > 1 && ['phase','town','the'].indexOf(t) === -1; });
    if(!terms.length) terms = q.split(' ');
    var hitsMap = {}, hits = 0;
    cards.forEach(function(c){
      var hay = norm(c.getAttribute('data-areas') + ' ' + c.getAttribute('data-name'));
      var hit = terms.some(function(t){ return hay.indexOf(t) !== -1; });
      hitsMap[c.getAttribute('data-name')] = hit;
      if(hit && passFilters(c)) hits++;
    });
    fState.area = q; fState.areaHits = hitsMap;
    if(hits){
      note.innerHTML = 'Showing instructors covering <b>&ldquo;' + raw.replace(/</g,'&lt;') + '&rdquo;</b> — ' + hits + ' match' + (hits>1?'es':'') + '.';
      var clear = document.createElement('button'); clear.type='button'; clear.textContent='Show all';
      clear.addEventListener('click', function(){ document.getElementById('areaInput').value=''; clearFilter(); });
      note.appendChild(clear);
    } else {
      note.innerHTML = 'No instructor covers <b>&ldquo;' + raw.replace(/</g,'&lt;') + '&rdquo;</b> yet — we are expanding across Lahore. Try DHA, Gulberg, Model Town, Johar Town or Bahria Town.';
    }
    note.classList.add('show');
    refreshCards();
    return hits;
  }
  document.getElementById('areaSearch').addEventListener('submit', function(e){
    e.preventDefault();
    openFolder('instructors');
    applyFilter(document.getElementById('areaInput').value);
    document.getElementById('instructors').scrollIntoView({behavior:'smooth'});
  });
  document.getElementById('seeAll').addEventListener('click', function(e){
    e.preventDefault();
    openFolder('instructors');
    document.getElementById('areaInput').value='';
    clearFilter();
    document.getElementById('instructors').scrollIntoView({behavior:'smooth'});
  });
  document.getElementById('gearSeg').addEventListener('click', function(e){
    var b = e.target.closest('button'); if(!b) return;
    this.querySelectorAll('button').forEach(function(x){ x.classList.remove('on'); });
    b.classList.add('on');
    fState.gear = b.getAttribute('data-gear');
    refreshCards();
  });
  document.getElementById('langSel').addEventListener('change', function(){ fState.lang = this.value; refreshCards(); });
  document.getElementById('pickupTgl').addEventListener('click', function(){
    fState.pickup = !fState.pickup;
    this.classList.toggle('on', fState.pickup);
    this.setAttribute('aria-pressed', fState.pickup ? 'true' : 'false');
    refreshCards();
  });
  document.getElementById('sortSel').addEventListener('change', function(){
    var mode = this.value;
    if(mode === 'rec') return;
    var sorted = getCards().slice().sort(function(a,b){
      if(mode === 'plo') return (+a.getAttribute('data-price')) - (+b.getAttribute('data-price'));
      if(mode === 'phi') return (+b.getAttribute('data-price')) - (+a.getAttribute('data-price'));
      if(mode === 'rate') return (+b.getAttribute('data-rate')) - (+a.getAttribute('data-rate'));
      return 0;
    });
    sorted.forEach(function(c){ grid.appendChild(c); });
    refreshCards();
  });
  refreshCards();

  /* ---- course recommender ---- */
  document.getElementById('rcBtn').addEventListener('click', function(){
    var exp = document.getElementById('rcExp').value,
        goal = document.getElementById('rcGoal').value,
        time = document.getElementById('rcTime').value,
        out = document.getElementById('rcOut'), html;
    if(exp === 'licence' || goal === 'confidence'){
      html = '<b>Your course: Refresher &amp; Confidence lessons.</b> Short, patient sessions with a verified female instructor to rebuild your road confidence — most returning drivers feel ready again within a few lessons.';
    } else if(exp === 'none'){
      html = '<b>Your course: Beginner package (10 days).</b> Start with a free assessment drive, then daily lessons through the full syllabus — vehicle control, lane discipline, parking, the 8-shape track — finishing with a mock test before your real one.';
    } else {
      html = '<b>Your course: Standard package + mock test.</b> You already have the basics — a 10-day package sharpens test skills (parking, reversing, the 8-shape track) and ends with a full mock test, so test day holds no surprises.';
    }
    if(goal === 'daily' && exp !== 'licence'){
      html += ' We will weight your lessons toward real Lahore traffic — bazaars, rush hour and highway merges — not just the test route.';
    }
    if(time === 'soon'){
      html += ' Short on time? Choose <b>90-minute lessons</b> to cover the syllabus faster.';
    }
    html += ' Book it in the SheDrives app — the instructor confirms your slot, and only then do numbers unlock.';
    out.innerHTML = html;
    out.classList.add('show');
  });

  /* ---- theory mini-quiz ---- */
  var quizState = { answered:0, correct:0 };
  function quizReset(){
    quizState.answered = 0; quizState.correct = 0;
    document.querySelectorAll('#theoryQuiz .q').forEach(function(q){
      q.querySelectorAll('.opt').forEach(function(o){ o.disabled = false; o.classList.remove('right','wrong'); });
    });
    document.getElementById('quizScore').textContent = '';
  }
  document.querySelectorAll('#theoryQuiz .q').forEach(function(q){
    q.addEventListener('click', function(e){
      var btn = e.target.closest('.opt'); if(!btn || btn.disabled) return;
      var right = btn.getAttribute('data-right') === '1';
      q.querySelectorAll('.opt').forEach(function(o){
        o.disabled = true;
        if(o.getAttribute('data-right') === '1') o.classList.add('right');
      });
      if(!right) btn.classList.add('wrong'); else quizState.correct++;
      quizState.answered++;
      var s = document.getElementById('quizScore');
      if(quizState.answered === 3){
        s.textContent = quizState.correct === 3
          ? 'Score: 3 / 3 — test-ready! The full practice set is free in the SheDrives app.'
          : 'Score: ' + quizState.correct + ' / 3 — the correct answers are highlighted. Full theory practice is free in the SheDrives app.';
      } else {
        s.textContent = 'Score: ' + quizState.correct + ' / ' + quizState.answered + ' so far';
      }
    });
  });
  document.getElementById('quizReset').addEventListener('click', quizReset);

  /* ---- earnings calculator ---- */
  function fmt(n){ return 'Rs ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function calcRun(){
    var price = Math.max(0, +document.getElementById('calcPrice').value || 0);
    var lessons = Math.max(0, +document.getElementById('calcLessons').value || 0);
    var week = price * lessons;
    document.getElementById('calcWeek').textContent = fmt(week);
    document.getElementById('calcMonth').textContent = fmt(week * 52 / 12);
  }
  document.getElementById('calcPrice').addEventListener('input', calcRun);
  document.getElementById('calcLessons').addEventListener('input', calcRun);
  calcRun();

  /* ---- whatsapp / support float ---- */
  var waFloat = document.getElementById('waFloat'), waPanel = document.getElementById('waPanel');
  function waToggle(force){
    var open = typeof force === 'boolean' ? force : !waPanel.classList.contains('open');
    waPanel.classList.toggle('open', open);
    waFloat.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  waFloat.addEventListener('click', function(){ waToggle(); });
  document.getElementById('waClose').addEventListener('click', function(){ waToggle(false); });
  document.addEventListener('click', function(e){
    if(waPanel.classList.contains('open') && !waPanel.contains(e.target) && e.target !== waFloat && !waFloat.contains(e.target)) waToggle(false);
  });

  /* ---- callback modal ---- */
  document.addEventListener('click', function(e){
    var btn = e.target.closest ? e.target.closest('[data-callback]') : null;
    if(!btn) return;
    waToggle(false); openOverlay('cbOverlay');
  });
  document.getElementById('cbForm').addEventListener('submit', function(e){
    e.preventDefault();
    var req = ['cbName','cbPhone'].map(function(id){ return document.getElementById(id); });
    var bad = req.filter(function(f){ return !f.value.trim(); });
    if(bad.length){ bad[0].focus(); showToast('Please fill your name and phone number.'); return; }
    if(window.SDStore && !window.SDStore.acceptInquiries()){ showToast('New inquiries are currently closed — please check back soon.'); return; }
    if(window.SDStore){
      window.SDStore.addInquiry({ kind:'Callback',
        name: document.getElementById('cbName').value.trim(),
        phone: document.getElementById('cbPhone').value.trim(),
        area: '',
        course: document.getElementById('cbTopic').value.trim() || 'Callback request',
        time: document.getElementById('cbWhen').value });
    }
    document.getElementById('cbFormWrap').classList.add('hide');
    document.getElementById('cbSuccess').classList.add('show');
  });

  /* ---- modals ---- */
  function openOverlay(id){
    document.getElementById(id).classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeOverlay(ov){
    ov.classList.remove('open');
    document.body.style.overflow = '';
    var wrap = ov.querySelector('.formwrap'), suc = ov.querySelector('.success');
    if(wrap) wrap.classList.remove('hide');
    if(suc) suc.classList.remove('show');
  }
  document.querySelectorAll('.overlay').forEach(function(ov){
    ov.addEventListener('click', function(e){ if(e.target === ov) closeOverlay(ov); });
    ov.querySelectorAll('[data-close]').forEach(function(b){
      b.addEventListener('click', function(){ closeOverlay(ov); });
    });
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      document.querySelectorAll('.overlay.open').forEach(closeOverlay);
    }
  });

  /* booking */
  var currentInstructor = '';
  document.addEventListener('click', function(e){
    var btn = e.target.closest ? e.target.closest('[data-book]') : null;
    if(!btn) return;
    currentInstructor = btn.getAttribute('data-book');
    document.getElementById('bookInstructor').textContent = currentInstructor;
    var areaVal = document.getElementById('areaInput').value.trim();
    if(areaVal) document.getElementById('bkArea').value = areaVal;
    openOverlay('bookOverlay');
  });
  document.getElementById('bookForm').addEventListener('submit', function(e){
    e.preventDefault();
    var name = document.getElementById('bkName'), phone = document.getElementById('bkPhone'),
        area = document.getElementById('bkArea'), date = document.getElementById('bkDate');
    var bad = [name, phone, area, date].filter(function(f){ return !f.value.trim(); });
    if(bad.length){ bad[0].focus(); showToast('Please fill name, phone, area and preferred date.'); return; }
    if(window.SDStore && !window.SDStore.acceptInquiries()){ showToast('New inquiries are currently closed — please check back soon.'); return; }
    if(window.SDStore){
      window.SDStore.addInquiry({ kind:'Lesson enquiry',
        name: name.value.trim(), phone: phone.value.trim(), area: area.value.trim(),
        course: currentInstructor === 'Gift package' ? 'Gift package' : 'Lessons with ' + currentInstructor,
        date: date.value, time: document.getElementById('bkTime').value });
    }
    var successMsg = 'Thank you, ' + name.value.trim().split(' ')[0] + ' — your enquiry for ' + currentInstructor +
      ' (' + date.value + ', ' + document.getElementById('bkTime').value + ') has been saved to the SheDrives Owner Panel on this device (preview). ' +
      'The owner sees it in the panel\u2019s Inquiries folder and confirms your slot — only then do numbers unlock, and your family follows the lesson live until you stop the sharing yourself with your PIN at home.';
    if(window.SDStore && window.SDStore.bookSuccessText){
      successMsg = window.SDStore.bookSuccessText(name.value.trim().split(' ')[0], currentInstructor, date.value, document.getElementById('bkTime').value, successMsg);
    }
    document.getElementById('bookSuccessText').textContent = successMsg;
    document.getElementById('bookFormWrap').classList.add('hide');
    document.getElementById('bookSuccess').classList.add('show');
  });

  /* apply */
  document.addEventListener('click', function(e){
    var btn = e.target.closest ? e.target.closest('[data-apply]') : null;
    if(!btn) return;
    openOverlay('applyOverlay');
  });
  document.getElementById('applyForm').addEventListener('submit', function(e){
    e.preventDefault();
    var req = ['apName','apPhone','apArea','apCar'].map(function(id){ return document.getElementById(id); });
    var bad = req.filter(function(f){ return !f.value.trim(); });
    if(bad.length){ bad[0].focus(); showToast('Please fill name, phone, areas and car.'); return; }
    document.getElementById('applyFormWrap').classList.add('hide');
    document.getElementById('applySuccess').classList.add('show');
  });

  /* ---- folders menu (desktop "All sections" dropdown) ---- */
  var fBtn = document.getElementById('foldersBtn'), fPanel = document.getElementById('foldersPanel');
  function closeFolders(){
    if(fPanel) fPanel.classList.remove('open');
    if(fBtn) fBtn.setAttribute('aria-expanded','false');
  }
  if(fBtn && fPanel){
    fBtn.addEventListener('click', function(e){
      e.stopPropagation();
      var open = fPanel.classList.toggle('open');
      fBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    fPanel.addEventListener('click', function(e){ if(e.target.closest('a')) closeFolders(); });
    document.addEventListener('click', function(e){
      if(fPanel.classList.contains('open') && !fPanel.contains(e.target)) closeFolders();
    });
  }
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeFolders(); });

  /* ---- folder views: the dashboard stays simple; everything detailed lives in a folder ---- */
  var FOLDERS = ['home','instructors','learn','packages','safety','help','panel'];
  function openFolder(name, anchor){
    if(FOLDERS.indexOf(name) === -1) name = 'home';
    document.querySelectorAll('[data-view]').forEach(function(el){
      el.hidden = el.getAttribute('data-view') !== name;
    });
    closeFolders();
    mnav.classList.remove('open');
    burger.setAttribute('aria-expanded','false');
    var target = anchor ? document.getElementById(anchor) : null;
    if(target){ target.scrollIntoView(); }
    else { window.scrollTo(0,0); }
    try{ history.replaceState(null,'', anchor ? '#' + anchor : '#top'); }catch(err){}
  }
  document.addEventListener('click', function(e){
    var a = e.target.closest ? e.target.closest('[data-openfolder]') : null;
    if(!a) return;
    e.preventDefault();
    var href = a.getAttribute('href') || '';
    var anchor = href.charAt(0) === '#' && href.length > 1 ? href.slice(1) : null;
    openFolder(a.getAttribute('data-openfolder'), anchor);
  });
  document.addEventListener('click', function(e){
    var b = e.target.closest ? e.target.closest('[data-home]') : null;
    if(!b) return;
    openFolder('home');
  });
  document.addEventListener('click', function(e){
    var b = e.target.closest ? e.target.closest('.brand') : null;
    if(!b) return;
    e.preventDefault(); openFolder('home');
  });
  /* if the page is opened with a section hash, land inside that section's folder */
  (function(){
    var h = (location.hash || '').slice(1);
    if(!h) return;
    var el = document.getElementById(h);
    var holder = el && el.closest ? el.closest('[data-view]') : null;
    if(holder && holder.getAttribute('data-view') !== 'home'){
      openFolder(holder.getAttribute('data-view'), h);
    }
  })();

  /* "Top Rated" folder item: jump to instructors, sorted by rating */
  document.addEventListener('click', function(e){
    var a = e.target.closest ? e.target.closest('[data-toprated]') : null;
    if(!a) return;
    var sel = document.getElementById('sortSel');
    if(sel && sel.value !== 'rate'){
      sel.value = 'rate';
      sel.dispatchEvent(new Event('change'));
    }
  });

  /* "WhatsApp" folder item: open the support panel */
  document.addEventListener('click', function(e){
    var a = e.target.closest ? e.target.closest('[data-wa]') : null;
    if(!a) return;
    e.preventDefault();
    e.stopPropagation();
    mnav.classList.remove('open');
    closeFolders();
    waToggle(true);
  });

  /* min date = today for booking */
  var d = new Date(), pad = function(n){ return (n<10?'0':'')+n; };
  document.getElementById('bkDate').min = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
})();
