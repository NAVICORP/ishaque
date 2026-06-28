/* ===== rule-based chat assistant with WhatsApp escalation ===== */
(function(){
  var launch=document.getElementById('chatLaunch'),panel=document.getElementById('chatPanel'),
      closeBtn=document.getElementById('chatClose'),body=document.getElementById('chatBody'),
      chips=document.getElementById('chatChips'),form=document.getElementById('chatForm'),input=document.getElementById('chatText');
  if(!launch||!panel)return;
  var WA='https://wa.me/917827087878?text='+encodeURIComponent("Hi Ishaque, I'd like to talk about a deck.");
  var FIVERR='https://www.fiverr.com/s/2K339vV';
  var waBtn='<a class="chat-wa" href="'+WA+'" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1a7.7 7.7 0 0 1-2.3-1.4 8.6 8.6 0 0 1-1.6-2c-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.4-.5-.6-.5h-.6c-.2 0-.5.1-.7.3-.3.3-1 .9-1 2.3s1 2.7 1.2 2.9c.1.2 2 3.1 4.9 4.3 2.9 1.1 2.9.8 3.4.7.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2z"/></svg>Chat on WhatsApp</a>';
  var fiverrBtn='<a class="chat-wa fiverr" href="'+FIVERR+'" target="_blank" rel="noopener">Start on Fiverr</a>';

  var intents=[
    {k:['who is ishaque','about ishaque','about him','tell me about','his background','who is he'],r:"Ishaque Nv is a Fiverr Vetted Pro &amp; Top-Rated presentation designer with 7+ years of experience and 2,700+ decks delivered since 2020. He's the Co-Founder &amp; Art Director of SkiFi Designs, based in Kerala, India and working with clients worldwide."},
    {k:['client','brand','worked with','companies','who have you','big name','famous'],r:"Ishaque has designed for global brands like Coca-Cola, Lenovo, Cambridge University Press, ADNOC Group and LinkedIn, plus many high-growth startups across tech, healthcare, finance, energy, education and real estate."},
    {k:['service','offer','do you do','what do you','help with','type of','kind of','can you'],r:"Ishaque designs investor &amp; fundraising pitch decks, corporate &amp; executive presentations, sales decks, data visualization &amp; infographics, and Arabic / RTL decks, plus full deck redesigns. Which one do you need?"},
    {k:['price','pricing','cost','budget','rate','charge','how much','quote','expensive','afford','hourly','per slide','redesign price'],r:"Pricing depends on the project: deck redesigns are about <b>$15 per slide</b>, his hourly rate is <b>$75/hr</b>, and new investor decks are project-priced (a few hundred dollars and up). Share your slide count or brief for an exact quote.",wa:1,extra:fiverrBtn},
    {k:['time','turnaround','how long','deadline','fast','urgent','rush','days','deliver','quick'],r:"Most decks take about 3 to 7 days depending on length and revisions. Rush delivery is available; just share your deadline.",wa:1},
    {k:['start','begin','hire','get started','order','work with','book','how do i'],r:"Easy! Tap “Start a project” to go to Ishaque's Fiverr, or message him on WhatsApp with your goal, audience and deadline.",wa:1,extra:fiverrBtn},
    {k:['revision','revise','changes','edit ','feedback','tweak'],r:"Yes, projects include revisions so we get it exactly right. The exact number depends on the package, and Ishaque will confirm for your project."},
    {k:['fiverr','vetted','top rated','top-rated','level'],r:"Yes, Ishaque is a Fiverr Vetted Pro and Top-Rated presentation designer. You can hire him on Fiverr below.",extra:fiverrBtn},
    {k:['portfolio','work','example','sample','behance','previous','past'],r:"You can see selected projects in the Work section above, or the full portfolio on <a href=\"https://www.behance.net/skifidesigns\" target=\"_blank\" rel=\"noopener\">Behance</a>."},
    {k:['format','powerpoint','keynote','editable','google slide','file','source','ppt','tool','software','program'],r:"Decks are built in PowerPoint, Keynote and Google Slides (plus Photoshop, Illustrator &amp; InDesign) and delivered fully editable, with a source kit."},
    {k:['arabic','rtl','right to left','bilingual','language','speak','malayalam','hindi','urdu','tamil'],r:"Ishaque speaks English, Arabic, Hindi, Malayalam, Tamil and Urdu, and designs Arabic / RTL decks with the same polish as everything else."},
    {k:['education','study','degree','university','college','qualif','school'],r:"Ishaque holds an MA in Arabic Language &amp; Literature (Jamia Millia Islamia) and a BA in Linguistics (University of Calicut), which sharpens his storytelling and bilingual design."},
    {k:['skifi','studio','agency','team'],r:"SkiFi Designs is the creative studio Ishaque co-founded and art-directs; your on-demand creative team for business growth, with 2,700+ projects delivered since 2020. See <a href=\"https://skifidesigns.com\" target=\"_blank\" rel=\"noopener\">skifidesigns.com</a>."},
    {k:['where','location','based','country','remote','timezone','from'],r:"Ishaque is based in Kerala, India, and works with clients worldwide."},
    {k:['experience','years','how long have','senior','career'],r:"7+ years in presentation design: Senior Presentation Design Specialist at V360 Group (Delhi), Fiverr Vetted Pro, and now Co-Founder &amp; Art Director of SkiFi Designs."},
    {k:['email','contact','reach','phone','call','number','whatsapp'],r:"You can email <a href=\"mailto:contact@skifidesigns.com\">contact@skifidesigns.com</a> or message on WhatsApp.",wa:1},
    {k:['who are you','your name','what are you','are you a bot','are you human','are you ai','who is zaak','what is zaak','about zaak','zaak'],r:"I'm Zaak, Ishaque's AI assistant. I can tell you about his presentation work, services and pricing, and connect you to him on WhatsApp anytime."},
    {k:['hi','hello','hey','yo','salam','assalam','good morning','good evening'],r:"Hi there! I can tell you about Ishaque's work, services, pricing, turnaround or how to get started. What would you like to know?"},
    {k:['thank','thanks','great','awesome','cool','perfect','nice'],r:"You're welcome! Anything else I can help with?"}
  ];
  var defReply="That's a great question, and best answered by Ishaque directly. Let me connect you on WhatsApp so he can help you properly.";
  var quick=['About Ishaque','Services','Pricing','Turnaround','Talk to Ishaque'];

  function add(html,who){var d=document.createElement('div');d.className='msg '+who;d.innerHTML=html;body.appendChild(d);body.scrollTop=body.scrollHeight;return d;}
  function botReply(text,wa,extra){
    var t=add('<span class="typing-i"><i></i><i></i><i></i></span>','bot');
    setTimeout(function(){t.innerHTML=text+(wa?waBtn:'')+(extra||'');body.scrollTop=body.scrollHeight;},620+Math.random()*480);
  }
  function answer(q){
    if(q==='Talk to Ishaque'){botReply("Sure! Here's the fastest way to reach Ishaque directly:",1);return;}
    var s=' '+q.toLowerCase()+' ';
    for(var i=0;i<intents.length;i++)for(var j=0;j<intents[i].k.length;j++)if(s.indexOf(intents[i].k[j])>-1){botReply(intents[i].r,intents[i].wa,intents[i].extra);return;}
    botReply(defReply,1);
  }
  function send(q){add(q,'user');answer(q);}
  function renderChips(){chips.innerHTML='';quick.forEach(function(q){var b=document.createElement('button');b.type='button';b.className='chip-q';b.textContent=q;b.addEventListener('click',function(){send(q);});chips.appendChild(b);});}

  var started=false;
  function open(){
    panel.classList.add('open');launch.style.display='none';
    if(!started){started=true;renderChips();
      botReply("Hi, I'm Zaak AI, Ishaque's assistant. Ask me about his work, services, pricing or turnaround, and I'll connect you straight to Ishaque on WhatsApp for anything detailed.",0);}
    setTimeout(function(){input.focus();},320);
  }
  function close(){panel.classList.remove('open');launch.style.display='grid';}
  launch.addEventListener('click',open);
  closeBtn.addEventListener('click',close);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&panel.classList.contains('open'))close();});
  form.addEventListener('submit',function(e){e.preventDefault();var v=input.value.trim();if(!v)return;input.value='';send(v);});
})();
