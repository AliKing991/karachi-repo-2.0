/* ===========================
   AURACHAT — PREMIUM CSS v3
   =========================== */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

:root {
  --primary:#6C63FF; --primary-dark:#4B44CC; --primary-glow:rgba(108,99,255,.25);
  --accent:#FF6B9D; --accent2:#00D4AA; --danger:#FF5C5C;
  --bg:#0D0D1A; --bg2:#12121F; --bg3:#1A1A2E;
  --surface:#1E1E35; --surface2:#252540;
  --border:rgba(255,255,255,.07);
  --text:#F0EFFF; --text2:#9B99BB; --text3:#5A5880;
  --msg-out:linear-gradient(135deg,#6C63FF,#9B59B6);
  --msg-in:#1E1E35;
  --shadow:0 8px 32px rgba(0,0,0,.4);
  --radius:16px; --radius-sm:8px;
  --font-head:'Syne',sans-serif; --font-body:'DM Sans',sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0;}

/* MOBILE KEYBOARD FIX: use dvh (dynamic viewport height) so layout adjusts when keyboard opens */
html { height: 100%; }
body {
  font-family:var(--font-body);
  background:var(--bg);
  color:var(--text);
  height: 100%;
  /* dvh adjusts when keyboard opens on mobile */
  min-height: -webkit-fill-available;
  overflow:hidden;
  transition:background .3s,color .3s;
}

/* LIGHT MODE */
body.light-mode{
  --bg:#F5F4FF;--bg2:#EEEEFF;--bg3:#E8E8FF;
  --surface:#fff;--surface2:#F0EFFF;
  --border:rgba(108,99,255,.15);
  --text:#1A1A2E;--text2:#5A5880;--text3:#9B99BB;
  --msg-in:#fff;--shadow:0 8px 32px rgba(108,99,255,.1);
}
body.light-mode .sidebar,.light-mode .chat-header,.light-mode .message-composer,
.light-mode .search-bar,.light-mode .stories-bar,.light-mode .sidebar-bottom,
.light-mode .sidebar-tabs,.light-mode .sidebar-header{background:var(--surface);border-color:var(--border);}
body.light-mode .message-area{background:var(--bg2);}
body.light-mode .msg-wrap.in .bubble{background:#fff;color:var(--text);box-shadow:0 2px 8px rgba(0,0,0,.08);}

::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-thumb{background:var(--surface2);border-radius:4px;}

/* ===== SPLASH ===== */
.splash{position:fixed;inset:0;background:var(--bg);display:flex;align-items:center;justify-content:center;z-index:9999;transition:opacity .6s,transform .6s;}
.splash.fade-out{opacity:0;transform:scale(1.05);pointer-events:none;}
.splash-inner{text-align:center;}
.splash-logo{position:relative;width:100px;height:100px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;}
.logo-ring{position:absolute;inset:0;border-radius:50%;border:2px solid var(--primary);animation:ringPulse 2s ease-in-out infinite;}
.logo-ring.ring2{border-color:var(--accent);animation-delay:.5s;inset:10px;}
@keyframes ringPulse{0%,100%{opacity:.4;transform:scale(1);}50%{opacity:1;transform:scale(1.05);}}
.logo-icon{font-size:36px;color:var(--primary);position:relative;z-index:1;}
.splash-title{font-family:var(--font-head);font-size:36px;font-weight:800;background:linear-gradient(135deg,var(--primary),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.splash-sub{color:var(--text2);font-size:13px;margin-top:6px;letter-spacing:2px;text-transform:uppercase;}
.splash-loader{width:120px;height:3px;background:var(--surface2);border-radius:3px;margin:20px auto 0;overflow:hidden;}
.splash-bar{height:100%;background:linear-gradient(90deg,var(--primary),var(--accent));border-radius:3px;animation:barLoad 1.8s ease forwards;}
@keyframes barLoad{from{width:0;}to{width:100%;}}

/* ===== LOCK SCREEN ===== */
.lock-screen{position:fixed;inset:0;background:var(--bg);z-index:8000;display:flex;align-items:center;justify-content:center;}
.lock-box{text-align:center;padding:40px;background:var(--surface);border:1px solid var(--border);border-radius:24px;max-width:340px;width:90%;box-shadow:var(--shadow);}
.lock-icon{width:64px;height:64px;background:linear-gradient(135deg,var(--primary),var(--accent));border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 16px;}
.lock-box h2{font-family:var(--font-head);font-size:22px;margin-bottom:6px;}
.lock-box p{color:var(--text2);font-size:13px;margin-bottom:20px;}
.pin-dots{display:flex;justify-content:center;gap:12px;margin-bottom:24px;}
.pin-dots span{width:14px;height:14px;border-radius:50%;border:2px solid var(--primary);transition:background .2s;}
.pin-dots span.filled{background:var(--primary);}
.pin-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:240px;margin:0 auto;}
.pin-pad button{padding:16px;background:var(--surface2);border:1px solid var(--border);border-radius:12px;color:var(--text);font-family:var(--font-head);font-size:20px;cursor:pointer;transition:all .15s;}
.pin-pad button:hover,.pin-pad button:active{background:var(--primary);border-color:var(--primary);}
.pin-clear{color:var(--accent)!important;}
.pin-del{color:var(--text2)!important;}
.pin-error{color:var(--danger);font-size:12px;margin-top:12px;min-height:16px;}
.lock-input{width:100%;padding:12px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;color:var(--text);font-family:var(--font-body);font-size:15px;outline:none;text-align:center;letter-spacing:6px;}
.lock-input:focus{border-color:var(--primary);}

/* ===== APP CONTAINER ===== */
/* MOBILE KEYBOARD FIX: fill-available keeps layout correct */
.app-container{
  height:100%;
  height:-webkit-fill-available;
  display:flex;
  flex-direction:column;
}

/* ===== LOGIN ===== */
.login-screen{display:flex;align-items:center;justify-content:center;height:100%;height:-webkit-fill-available;position:relative;overflow:hidden auto;}
.login-bg{position:absolute;inset:0;pointer-events:none;}
.orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:.3;}
.orb1{width:400px;height:400px;background:var(--primary);top:-100px;left:-100px;animation:orbFloat 8s ease-in-out infinite;}
.orb2{width:300px;height:300px;background:var(--accent);bottom:-80px;right:-80px;animation:orbFloat 10s ease-in-out infinite reverse;}
.orb3{width:200px;height:200px;background:var(--accent2);top:50%;left:50%;transform:translate(-50%,-50%);animation:orbFloat 6s ease-in-out infinite;}
@keyframes orbFloat{0%,100%{transform:translate(0,0);}50%{transform:translate(20px,-20px);}}
.login-container{background:var(--surface);border:1px solid var(--border);border-radius:24px;padding:36px 28px;width:100%;max-width:420px;position:relative;z-index:1;backdrop-filter:blur(20px);box-shadow:var(--shadow),0 0 0 1px var(--primary-glow);animation:loginFadeIn .6s ease;margin:20px;}
@keyframes loginFadeIn{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
.login-brand{text-align:center;margin-bottom:24px;}
.brand-icon{width:56px;height:56px;background:linear-gradient(135deg,var(--primary),var(--accent));border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 12px;box-shadow:0 8px 24px var(--primary-glow);}
.login-brand h1{font-family:var(--font-head);font-size:28px;font-weight:800;background:linear-gradient(135deg,var(--primary),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.login-brand p{color:var(--text2);font-size:13px;margin-top:4px;}
.login-hint{font-size:11px;color:var(--text3);text-align:center;margin-bottom:10px;}

.role-tabs{display:flex;gap:8px;background:var(--bg2);border-radius:12px;padding:4px;margin-bottom:20px;}
.role-tab{flex:1;padding:10px;border:none;border-radius:8px;background:transparent;color:var(--text2);font-family:var(--font-body);font-size:14px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:6px;}
.role-tab.active{background:var(--primary);color:#fff;box-shadow:0 4px 12px var(--primary-glow);}

.input-group{position:relative;margin-bottom:14px;}
.input-group i{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text3);font-size:14px;}
.input-group input{width:100%;padding:13px 14px 13px 40px;background:var(--bg2);border:1px solid var(--border);border-radius:12px;color:var(--text);font-family:var(--font-body);font-size:14px;outline:none;transition:border-color .2s,box-shadow .2s;
  /* MOBILE KEYBOARD FIX: prevent zoom on iOS by setting font-size >= 16px */
  font-size:16px;}
.input-group input:focus{border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-glow);}

.profile-upload-area{text-align:center;margin-bottom:16px;}
.avatar-upload{position:relative;display:inline-block;cursor:pointer;}
.avatar-upload img{width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--primary);display:block;}
.upload-overlay{position:absolute;inset:0;border-radius:50%;background:rgba(108,99,255,.6);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;color:#fff;font-size:20px;}
.avatar-upload:hover .upload-overlay,.avatar-upload:active .upload-overlay{opacity:1;}
.upload-hint{font-size:12px;color:var(--text3);margin-top:6px;}

/* BUTTONS */
.btn-primary{width:100%;padding:14px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));border:none;border-radius:12px;color:#fff;font-family:var(--font-body);font-size:16px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:all .2s;box-shadow:0 8px 24px var(--primary-glow);margin-top:8px;}
.btn-primary:hover,.btn-primary:active{transform:translateY(-1px);box-shadow:0 12px 32px var(--primary-glow);}
.btn-small{padding:8px 16px;background:var(--primary);border:none;border-radius:8px;color:#fff;font-family:var(--font-body);font-size:13px;cursor:pointer;transition:background .2s;}
.btn-small:hover{background:var(--primary-dark);}
.icon-btn{background:transparent;border:none;color:var(--text2);width:36px;height:36px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;transition:background .2s,color .2s;}
.icon-btn:hover,.icon-btn:active{background:var(--surface2);color:var(--text);}

/* UNIQUE ID TEXT */
.unique-id-text{font-family:var(--font-head);font-size:11px;color:var(--primary);letter-spacing:1px;background:var(--primary-glow);padding:2px 8px;border-radius:20px;display:inline-block;}

/* ===== CHAT INTERFACE ===== */
/* MOBILE KEYBOARD FIX: use fill-available height */
.chat-interface{
  display:flex;
  height:100%;
  height:-webkit-fill-available;
  overflow:hidden;
}

/* ===== SIDEBAR ===== */
.sidebar{width:320px;min-width:280px;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;height:100%;overflow:hidden;}
.sidebar-header{padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);flex-shrink:0;}
.my-profile{display:flex;align-items:center;gap:10px;cursor:pointer;flex:1;min-width:0;}
.avatar-wrap{position:relative;flex-shrink:0;}
.avatar-wrap img{width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid var(--primary);}
.online-badge{position:absolute;bottom:1px;right:1px;width:10px;height:10px;background:var(--accent2);border-radius:50%;border:2px solid var(--bg2);}
.my-info{min-width:0;}
.my-info span{font-family:var(--font-head);font-weight:600;font-size:15px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.my-info small{color:var(--text2);font-size:10px;}
.sidebar-actions{display:flex;align-items:center;gap:2px;flex-shrink:0;}

/* DROPDOWN */
.dropdown-wrap{position:relative;}
.dropdown-menu{position:absolute;top:calc(100% + 8px);right:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);min-width:200px;z-index:100;display:none;box-shadow:var(--shadow);overflow:hidden;}
.dropdown-menu.open{display:block;animation:dropIn .15s ease;}
@keyframes dropIn{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:translateY(0);}}
.dropdown-menu button{width:100%;padding:10px 16px;background:none;border:none;color:var(--text);font-family:var(--font-body);font-size:13px;text-align:left;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background .15s;}
.dropdown-menu button:hover,.dropdown-menu button:active{background:var(--surface2);}
.dropdown-menu hr{border:none;border-top:1px solid var(--border);margin:4px 0;}
.danger-item{color:var(--danger)!important;}

/* EDIT NAME */
.edit-name-box{display:none;padding:10px 16px;gap:8px;background:var(--surface);border-bottom:1px solid var(--border);flex-direction:row;align-items:center;flex-shrink:0;}
.edit-name-box input{flex:1;padding:8px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--font-body);font-size:16px;outline:none;}
.edit-name-box input:focus{border-color:var(--primary);}

/* STORIES BAR */
.stories-bar{padding:10px 12px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border);overflow-x:auto;background:var(--bg2);flex-shrink:0;}
.stories-bar::-webkit-scrollbar{height:0;}
.story-add-btn{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;flex-shrink:0;}
.story-add-btn span{font-size:10px;color:var(--text2);}
.story-ring{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.add-ring{background:var(--surface2);border:2px dashed var(--primary);color:var(--primary);font-size:16px;}
.story-item{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;flex-shrink:0;}
.story-item span{font-size:10px;color:var(--text2);max-width:50px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.story-avatar-ring{width:46px;height:46px;border-radius:50%;padding:2px;background:linear-gradient(135deg,var(--primary),var(--accent));}
.story-avatar-ring img{width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid var(--bg2);}
.story-avatar-ring.seen{background:var(--surface2);}
.stories-scroll{display:flex;gap:10px;overflow-x:auto;}
.stories-scroll::-webkit-scrollbar{height:0;}

/* SEARCH BAR */
.search-bar{padding:10px 16px;background:var(--bg2);display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border);flex-shrink:0;}
.search-bar i{color:var(--text3);}
.search-bar input{flex:1;background:none;border:none;outline:none;color:var(--text);font-family:var(--font-body);font-size:16px;}
.search-bar input::placeholder{color:var(--text3);}

/* SIDEBAR TABS */
.sidebar-tabs{display:flex;padding:8px 10px;gap:4px;border-bottom:1px solid var(--border);flex-shrink:0;}
.stab{flex:1;padding:6px 4px;border:none;border-radius:8px;background:transparent;color:var(--text2);font-family:var(--font-body);font-size:11px;cursor:pointer;transition:all .2s;white-space:nowrap;}
.stab.active{background:var(--primary-glow);color:var(--primary);font-weight:600;}

/* CONTACTS LIST */
.contacts-list{flex:1;overflow-y:auto;padding:6px;}
.contact-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:var(--radius-sm);cursor:pointer;transition:background .15s;}
.contact-item:hover,.contact-item:active{background:var(--surface);}
.contact-item.active{background:var(--surface2);}
.contact-item .avatar-wrap img{width:44px;height:44px;}
.contact-info{flex:1;min-width:0;}
.cname{font-weight:500;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.clast{font-size:12px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;}
.contact-meta{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;}
.contact-time{font-size:11px;color:var(--text3);}
.unread-badge{background:var(--primary);color:#fff;font-size:11px;font-weight:700;padding:2px 7px;border-radius:10px;min-width:20px;text-align:center;}
.group-badge{font-size:10px;color:var(--accent2);background:rgba(0,212,170,.1);padding:2px 6px;border-radius:6px;display:inline-block;}

/* SIDEBAR BOTTOM */
.sidebar-bottom{padding:10px;border-top:1px solid var(--border);display:flex;justify-content:space-around;flex-shrink:0;}
.bottom-nav{background:none;border:none;color:var(--text2);font-size:18px;cursor:pointer;padding:8px 12px;border-radius:10px;transition:all .2s;}
.bottom-nav.active,.bottom-nav:hover,.bottom-nav:active{color:var(--primary);background:var(--primary-glow);}

/* ===== MAIN CHAT ===== */
/* MOBILE KEYBOARD FIX: flex column with overflow hidden, let children handle scroll */
.main-chat{
  flex:1;
  display:flex;
  flex-direction:column;
  overflow:hidden;
  background:var(--bg);
  min-width:0;
  position:relative;
}

.empty-state{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--text3);text-align:center;padding:20px;}
.empty-icon{width:80px;height:80px;background:var(--surface);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;color:var(--primary);border:1px solid var(--border);}
.empty-state h2{font-family:var(--font-head);font-size:22px;color:var(--text2);}
.empty-state p{font-size:14px;}

/* CHAT HEADER */
.chat-header{padding:12px 16px;background:var(--bg2);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;z-index:10;flex-shrink:0;}
.back-btn{display:none;background:none;border:none;color:var(--text2);font-size:16px;cursor:pointer;padding:6px;border-radius:8px;transition:all .2s;flex-shrink:0;}
.back-btn:hover,.back-btn:active{background:var(--surface2);color:var(--text);}
.chat-partner{display:flex;align-items:center;gap:10px;flex:1;cursor:pointer;min-width:0;}
.partner-info h3{font-family:var(--font-head);font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.status-text{font-size:12px;color:var(--text2);}
.chat-header-actions{display:flex;align-items:center;gap:2px;flex-shrink:0;}

/* MSG SEARCH */
.msg-search-box{padding:8px 14px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;flex-shrink:0;animation:slideDown .2s ease;}
@keyframes slideDown{from{transform:translateY(-10px);opacity:0;}to{transform:translateY(0);opacity:1;}}
.msg-search-box i{color:var(--text3);flex-shrink:0;}
.msg-search-box input{flex:1;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:6px 12px;color:var(--text);font-family:var(--font-body);font-size:16px;outline:none;min-width:0;}
.msg-search-box button{background:none;border:none;color:var(--text2);cursor:pointer;padding:6px 8px;border-radius:6px;transition:background .2s;flex-shrink:0;}
.msg-search-box button:hover{background:var(--surface2);}
#searchCount{font-size:12px;color:var(--text3);white-space:nowrap;flex-shrink:0;}

/* MESSAGE AREA */
/* MOBILE KEYBOARD FIX: flex:1 with overflow-y:auto, messages scroll normally */
.message-area{
  flex:1;
  overflow-y:auto;
  -webkit-overflow-scrolling:touch; /* smooth scroll on iOS */
  padding:16px;
  display:flex;
  flex-direction:column;
  gap:2px;
  background:var(--bg);
  background-size:cover;
  background-position:center;
}

/* DATE DIVIDER */
.date-divider{text-align:center;margin:10px 0;}
.date-divider span{background:var(--surface);color:var(--text2);font-size:11px;padding:4px 12px;border-radius:20px;border:1px solid var(--border);}

/* MESSAGE WRAP */
.msg-wrap{display:flex;flex-direction:column;max-width:65%;margin-bottom:2px;position:relative;}
.msg-wrap.out{align-self:flex-end;align-items:flex-end;}
.msg-wrap.in{align-self:flex-start;align-items:flex-start;}
.msg-sender{font-size:11px;color:var(--accent);margin-bottom:2px;padding-left:4px;}

/* BUBBLE */
.bubble{padding:10px 14px;border-radius:18px;position:relative;word-break:break-word;line-height:1.5;font-size:15px;}
.msg-wrap.out .bubble{background:var(--msg-out);color:#fff;border-bottom-right-radius:4px;box-shadow:0 4px 16px rgba(108,99,255,.3);}
.msg-wrap.in .bubble{background:var(--msg-in);color:var(--text);border-bottom-left-radius:4px;border:1px solid var(--border);}
.bubble img{max-width:220px;border-radius:12px;display:block;cursor:zoom-in;}
.bubble .edited-tag{font-size:10px;color:rgba(255,255,255,.6);font-style:italic;margin-left:4px;}
.msg-wrap.in .bubble .edited-tag{color:var(--text3);}

/* REPLY REF */
.reply-ref{background:rgba(255,255,255,.1);border-left:3px solid var(--accent);border-radius:4px;padding:4px 8px;margin-bottom:6px;font-size:12px;color:rgba(255,255,255,.7);}
.msg-wrap.in .reply-ref{background:var(--surface2);color:var(--text2);}

/* VOICE MESSAGE */
.voice-msg{display:flex;align-items:center;gap:8px;min-width:160px;}
.voice-play-btn{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.2);border:none;color:#fff;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.msg-wrap.in .voice-play-btn{background:var(--primary);}
.voice-waves{flex:1;height:24px;display:flex;align-items:center;gap:2px;}
.voice-wave-bar{width:3px;border-radius:3px;background:rgba(255,255,255,.5);animation:waveDance 1s ease-in-out infinite;}
.msg-wrap.in .voice-wave-bar{background:var(--primary);}
@keyframes waveDance{0%,100%{height:4px;}50%{height:18px;}}
.voice-duration{font-size:11px;color:rgba(255,255,255,.7);flex-shrink:0;}
.msg-wrap.in .voice-duration{color:var(--text2);}

/* MSG META */
.msg-meta{display:flex;align-items:center;gap:4px;margin-top:3px;padding:0 4px;}
.msg-meta .time{font-size:10px;color:var(--text3);}
.msg-meta .ticks{font-size:12px;color:var(--text3);}
.msg-meta .ticks.read{color:var(--accent2);}
.destruct-countdown{font-size:10px;color:var(--accent);}

/* REACTIONS */
.reactions{display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;}
.react-chip{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:2px 8px;font-size:13px;cursor:pointer;transition:transform .15s;}
.react-chip:active{transform:scale(1.15);}

/* MSG ACTIONS */
.msg-actions{display:none;position:absolute;top:-34px;right:0;background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:4px 8px;gap:2px;align-items:center;box-shadow:var(--shadow);z-index:5;white-space:nowrap;}
.msg-wrap:hover .msg-actions{display:flex;}
.msg-wrap.in .msg-actions{right:auto;left:0;}
.msg-actions button{background:none;border:none;font-size:15px;cursor:pointer;padding:3px 5px;border-radius:4px;color:var(--text2);}
.msg-actions button:hover{color:var(--text);background:var(--surface2);}

/* HIGHLIGHT */
.bubble.highlight{outline:2px solid var(--accent);animation:hlBlink .8s ease 2;}
@keyframes hlBlink{0%,100%{outline-color:var(--accent);}50%{outline-color:var(--accent2);}}

/* TYPING */
.typing-indicator{display:flex;align-items:center;gap:4px;padding:8px 14px;background:var(--msg-in);border:1px solid var(--border);border-radius:18px;border-bottom-left-radius:4px;width:fit-content;margin-bottom:8px;}
.typing-dot{width:7px;height:7px;background:var(--text3);border-radius:50%;animation:typeBounce 1.2s ease infinite;}
.typing-dot:nth-child(2){animation-delay:.2s;}.typing-dot:nth-child(3){animation-delay:.4s;}
@keyframes typeBounce{0%,80%,100%{transform:translateY(0);}40%{transform:translateY(-6px);}}

/* REPLY PREVIEW */
.reply-preview{background:var(--surface);border-left:3px solid var(--primary);padding:8px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);flex-shrink:0;}
.reply-label{font-size:11px;color:var(--primary);font-weight:600;display:block;}
.reply-content p{font-size:13px;color:var(--text2);margin-top:2px;}
.reply-preview button{background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px;padding:4px;}

/* FORWARD BAR */
.forward-bar{background:var(--surface);border-left:3px solid var(--accent2);padding:8px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border);flex-shrink:0;}
.forward-bar i{color:var(--accent2);flex-shrink:0;}
.forward-bar span{flex:1;font-size:13px;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.forward-bar button{background:none;border:none;color:var(--text3);cursor:pointer;flex-shrink:0;}

/* DESTRUCT INDICATOR */
.destruct-indicator{background:rgba(255,107,157,.08);border-bottom:1px solid rgba(255,107,157,.2);padding:5px 16px;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--accent);flex-shrink:0;}
.destruct-indicator button{background:none;border:1px solid var(--accent);border-radius:6px;color:var(--accent);font-size:11px;padding:2px 8px;cursor:pointer;}

/* COMPOSER */
/* MOBILE KEYBOARD FIX: flex-shrink:0, position stays at bottom when keyboard opens */
.message-composer{
  padding:10px 12px;
  background:var(--bg2);
  border-top:1px solid var(--border);
  display:flex;
  align-items:center;
  gap:6px;
  position:relative;
  flex-shrink:0;
}

.message-composer input{
  flex:1;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:24px;
  padding:12px 16px;
  color:var(--text);
  font-family:var(--font-body);
  /* MOBILE: 16px prevents zoom on iOS */
  font-size:16px;
  outline:none;
  transition:border-color .2s;
  min-width:0;
}
.message-composer input:focus{border-color:var(--primary);}
.message-composer input::placeholder{color:var(--text3);}
.send-btn{width:44px;height:44px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));border:none;border-radius:50%;color:#fff;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;box-shadow:0 4px 12px var(--primary-glow);flex-shrink:0;}
.send-btn:active{transform:scale(0.95);}
.voice-btn.recording{background:rgba(255,92,92,.2)!important;color:var(--danger)!important;animation:recPulse .8s ease-in-out infinite;}
@keyframes recPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,92,92,.4);}50%{box-shadow:0 0 0 8px rgba(255,92,92,0);}}

/* VOICE RECORDING BAR */
.voice-recording-bar{padding:10px 16px;background:rgba(255,92,92,.08);border-top:1px solid rgba(255,92,92,.2);display:flex;align-items:center;gap:10px;flex-shrink:0;}
.rec-pulse{width:10px;height:10px;border-radius:50%;background:var(--danger);animation:recPulse .8s ease-in-out infinite;flex-shrink:0;}
.voice-recording-bar span{flex:1;font-size:13px;color:var(--danger);}
.voice-recording-bar button{background:none;border:none;color:var(--text3);cursor:pointer;font-size:16px;}

/* EMOJI PICKER */
.emoji-btn{position:relative;}
.emoji-picker{position:absolute;bottom:60px;left:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;display:none;z-index:50;box-shadow:var(--shadow);width:280px;}
.emoji-picker.open{display:block;animation:dropIn .15s ease;}
.emoji-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:4px;max-height:180px;overflow-y:auto;}
.emoji-grid span{font-size:22px;cursor:pointer;text-align:center;border-radius:6px;padding:2px;transition:background .15s;line-height:1.4;}
.emoji-grid span:hover{background:var(--surface2);}

/* ADMIN CONTROLS */
.admin-controls{padding:8px 12px;background:rgba(255,92,92,.06);border-top:1px solid rgba(255,92,92,.15);display:flex;gap:6px;flex-wrap:wrap;flex-shrink:0;}
.admin-controls button{padding:6px 10px;background:rgba(255,92,92,.12);border:1px solid rgba(255,92,92,.25);border-radius:8px;color:var(--danger);font-family:var(--font-body);font-size:11px;cursor:pointer;display:flex;align-items:center;gap:4px;}
.admin-controls button:active{background:rgba(255,92,92,.22);}

/* ===== COUPON CODE ===== */
.coupon-display{font-family:var(--font-head);font-size:24px;font-weight:800;color:var(--primary);background:var(--primary-glow);border:2px dashed var(--primary);border-radius:12px;padding:16px 20px;letter-spacing:3px;cursor:pointer;transition:all .2s;}
.coupon-display:hover,.coupon-display:active{background:rgba(108,99,255,.2);}

/* ===== GROUP CHAT ===== */
.group-member-picker{display:flex;flex-direction:column;gap:6px;max-height:200px;overflow-y:auto;margin-bottom:8px;}
.member-pick-row{display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--surface2);border-radius:10px;cursor:pointer;transition:background .15s;}
.member-pick-row:hover,.member-pick-row:active{background:var(--primary-glow);}
.member-pick-row input{width:18px;height:18px;accent-color:var(--primary);cursor:pointer;flex-shrink:0;}
.member-pick-row img{width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--primary);}
.member-pick-row span{font-size:14px;}

.group-member-list{display:flex;flex-direction:column;gap:6px;max-height:200px;overflow-y:auto;}
.group-member-row{display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--surface2);border-radius:10px;}
.group-member-row img{width:36px;height:36px;border-radius:50%;object-fit:cover;}
.group-member-row .gmname{font-size:13px;flex:1;}
.group-member-row .gmid{font-size:11px;color:var(--text3);}

.group-avatar{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;font-size:18px;border:2px solid var(--primary);flex-shrink:0;}

/* ===== CALL SCREEN ===== */
.call-screen{position:fixed;inset:0;z-index:7000;display:flex;align-items:center;justify-content:center;}
.call-bg-blur{position:absolute;inset:0;background:linear-gradient(135deg,#0D0D1A,#1A0D2E);}
.call-content{position:relative;z-index:1;text-align:center;padding:40px 20px;}
.call-avatar-wrap{position:relative;width:120px;height:120px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;}
.call-avatar-wrap img{width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid var(--primary);position:relative;z-index:1;}
.call-pulse{position:absolute;inset:-10px;border-radius:50%;border:2px solid var(--primary);opacity:.5;animation:callPulse 2s ease-in-out infinite;}
.call-pulse.p2{animation-delay:1s;inset:-20px;opacity:.3;}
@keyframes callPulse{0%,100%{transform:scale(1);}50%{transform:scale(1.1);opacity:.2;}}
.call-content h2{font-family:var(--font-head);font-size:26px;color:#fff;}
.call-status-text{color:rgba(255,255,255,.6);font-size:15px;margin-top:6px;}
.call-timer{font-size:20px;color:var(--accent2);margin-top:8px;font-family:var(--font-head);}
.local-video{position:fixed;bottom:120px;right:20px;width:100px;height:140px;border-radius:12px;object-fit:cover;border:2px solid var(--primary);z-index:2;}
.remote-video{position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;opacity:.8;}
.call-controls{display:flex;justify-content:center;gap:20px;margin-top:40px;}
.call-btn{width:58px;height:58px;border-radius:50%;border:none;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.15);color:#fff;backdrop-filter:blur(10px);transition:all .2s;}
.call-btn:active{transform:scale(0.9);}
.call-btn.end-btn{background:var(--danger);}
.call-btn.muted{background:rgba(255,92,92,.3);}

/* INCOMING CALL */
.incoming-call{position:fixed;top:20px;right:20px;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:14px 18px;display:flex;align-items:center;gap:12px;z-index:6000;box-shadow:var(--shadow),0 0 0 2px var(--primary-glow);animation:slideInRight .3s ease;min-width:260px;}
@keyframes slideInRight{from{transform:translateX(120%);opacity:0;}to{transform:translateX(0);opacity:1;}}
.incoming-call img{width:46px;height:46px;border-radius:50%;object-fit:cover;border:2px solid var(--primary);}
.incoming-info{flex:1;min-width:0;}
.incoming-info span{font-family:var(--font-head);font-weight:700;font-size:14px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.incoming-info small{color:var(--text2);font-size:12px;}
.incoming-actions{display:flex;gap:8px;}
.accept-btn,.reject-btn{width:38px;height:38px;border-radius:50%;border:none;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.accept-btn{background:var(--accent2);color:#fff;}
.reject-btn{background:var(--danger);color:#fff;}

/* ===== MODALS ===== */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);z-index:5000;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease;padding:16px;}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
.modal-box{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:24px;width:100%;max-width:420px;position:relative;box-shadow:var(--shadow);animation:modalIn .25s ease;max-height:90vh;overflow-y:auto;}
.modal-box.small{max-width:340px;}
.dashboard-box{max-width:520px;}
@keyframes modalIn{from{transform:scale(.92);opacity:0;}to{transform:scale(1);opacity:1;}}
.modal-close{position:absolute;top:14px;right:14px;background:var(--surface2);border:none;color:var(--text2);width:28px;height:28px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;}
.modal-close:hover,.modal-close:active{background:var(--danger);color:#fff;}
.modal-box h3{font-family:var(--font-head);font-size:18px;margin-bottom:16px;display:flex;align-items:center;gap:8px;}
.modal-box textarea{width:100%;background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:10px 14px;color:var(--text);font-family:var(--font-body);font-size:16px;resize:none;outline:none;}
.modal-box textarea:focus{border-color:var(--primary);}

/* PROFILE MODAL */
.profile-modal-content{text-align:center;}
.profile-big-avatar img{width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid var(--primary);margin-bottom:12px;box-shadow:0 8px 24px var(--primary-glow);}
.profile-modal-content h2{font-family:var(--font-head);font-size:20px;}
.modal-role{display:inline-block;margin-top:6px;padding:3px 12px;background:var(--primary-glow);color:var(--primary);border-radius:20px;font-size:12px;font-weight:600;}
.modal-status,.modal-joined{color:var(--text2);font-size:13px;margin-top:8px;}

/* STATUS */
.status-options{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
.status-options button{padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;color:var(--text);font-family:var(--font-body);font-size:13px;cursor:pointer;}
.status-options button:active{background:var(--primary-glow);border-color:var(--primary);}

/* WALLPAPER */
.wallpaper-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.wp-option{width:100%;aspect-ratio:1;border-radius:10px;cursor:pointer;border:2px solid transparent;transition:all .2s;display:flex;align-items:center;justify-content:center;font-size:20px;}
.wp-option:active,.wp-option.active{border-color:var(--primary);}

/* SELF DESTRUCT */
.destruct-options{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.destruct-options button{padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;color:var(--text);font-family:var(--font-body);font-size:13px;cursor:pointer;text-align:center;}
.destruct-options button:active,.destruct-options button.active-destruct{background:var(--primary-glow);border-color:var(--primary);color:var(--primary);}

/* NOTIFICATIONS */
.notif-options{display:flex;flex-direction:column;gap:14px;}
.toggle-row{display:flex;align-items:center;justify-content:space-between;cursor:pointer;font-size:14px;}
.toggle-wrap{position:relative;}
.toggle-wrap input{opacity:0;width:0;height:0;position:absolute;}
.toggle-slider{display:block;width:44px;height:24px;background:var(--surface2);border-radius:12px;position:relative;transition:background .2s;cursor:pointer;}
.toggle-slider::after{content:'';position:absolute;width:18px;height:18px;background:#fff;border-radius:50%;top:3px;left:3px;transition:transform .2s;}
.toggle-wrap input:checked + .toggle-slider{background:var(--primary);}
.toggle-wrap input:checked + .toggle-slider::after{transform:translateX(20px);}

/* EDIT MSG */
.edit-msg-input{width:100%;padding:12px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;color:var(--text);font-family:var(--font-body);font-size:16px;outline:none;}
.edit-msg-input:focus{border-color:var(--primary);}

/* STORY CREATOR */
.story-creator textarea{width:100%;background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:10px 14px;color:var(--text);font-family:var(--font-body);font-size:16px;resize:none;outline:none;margin-bottom:12px;}
.story-bg-grid{display:flex;gap:8px;flex-wrap:wrap;}
.story-bg-swatch{width:36px;height:36px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:all .2s;}
.story-bg-swatch:active,.story-bg-swatch.active{border-color:var(--text);}

/* STORIES VIEWER */
.stories-viewer{position:fixed;inset:0;background:#000;z-index:6500;display:flex;align-items:center;justify-content:center;}
.sv-progress-bar{position:absolute;top:0;left:0;right:0;height:3px;background:rgba(255,255,255,.2);display:flex;gap:2px;padding:0 8px;}
.sv-progress-fill{height:100%;background:#fff;transition:width linear;}
.sv-close{position:absolute;top:16px;right:16px;background:rgba(255,255,255,.15);border:none;color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;}
.sv-user-info{position:absolute;top:20px;left:16px;display:flex;align-items:center;gap:10px;color:#fff;}
.sv-user-info img{width:38px;height:38px;border-radius:50%;object-fit:cover;border:2px solid #fff;}
.sv-user-info span{font-weight:600;font-size:14px;display:block;}
.sv-user-info small{font-size:11px;opacity:.7;}
.sv-content{max-width:360px;width:90%;text-align:center;}
.sv-content img{max-width:100%;max-height:70vh;border-radius:16px;object-fit:cover;}
.sv-content p{color:#fff;font-size:18px;padding:20px;border-radius:16px;line-height:1.6;}
.sv-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.15);border:none;color:#fff;width:38px;height:38px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;}
.sv-prev{left:12px;}.sv-next{right:12px;}

/* ADMIN DASHBOARD */
.dashboard-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:6px;}
.stat-card{background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:14px;text-align:center;}
.stat-card .stat-num{font-family:var(--font-head);font-size:26px;font-weight:800;color:var(--primary);}
.stat-card .stat-label{font-size:11px;color:var(--text2);margin-top:4px;text-transform:uppercase;letter-spacing:.5px;}
.dashboard-users{display:flex;flex-direction:column;gap:8px;max-height:240px;overflow-y:auto;}
.dash-user-row{display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface2);border-radius:10px;}
.dash-user-row img{width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--primary);}
.dash-user-info{flex:1;min-width:0;}
.dash-user-info .dname{font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dash-user-info .drole{font-size:11px;color:var(--text2);}
.dash-user-actions{display:flex;gap:4px;flex-shrink:0;}
.dash-user-actions button{padding:4px 8px;border-radius:6px;border:none;font-size:11px;cursor:pointer;}
.dash-ban-btn{background:rgba(255,92,92,.15);color:var(--danger);}
.dash-msg-btn{background:var(--primary-glow);color:var(--primary);}

/* SYS MSG */
.sys-msg{text-align:center;color:var(--text3);font-size:11px;margin:8px 0;font-style:italic;}

/* TOAST */
.toast{position:fixed;bottom:30px;left:50%;transform:translateX(-50%) translateY(80px);background:var(--surface);border:1px solid var(--border);border-radius:30px;padding:10px 24px;font-size:13px;color:var(--text);box-shadow:var(--shadow);z-index:9999;transition:transform .3s ease,opacity .3s ease;opacity:0;white-space:nowrap;max-width:90vw;text-overflow:ellipsis;overflow:hidden;}
.toast.show{transform:translateX(-50%) translateY(0);opacity:1;}

/* ===== MOBILE ===== */
@media(max-width:768px){
  /* MOBILE KEYBOARD FIX: slide sidebar/chat, use 100% height not 100vh */
  .chat-interface{position:relative;overflow:hidden;}
  .sidebar{width:100%;height:100%;position:absolute;z-index:2;transition:transform .3s ease;}
  .main-chat{
    width:100%;height:100%;
    position:absolute;top:0;left:0;
    transform:translateX(100%);
    transition:transform .3s ease;
    z-index:3;
  }
  .chat-interface.mobile-chat .sidebar{transform:translateX(-100%);}
  .chat-interface.mobile-chat .main-chat{transform:translateX(0);}
  .back-btn{display:flex!important;}
  .msg-wrap{max-width:82%;}
  .chat-header-actions .icon-btn:nth-child(n+3){display:none;}
  .login-container{margin:12px;padding:24px 20px;border-radius:18px;}
  .dashboard-stats{grid-template-columns:repeat(2,1fr);}
  .wallpaper-grid{grid-template-columns:repeat(3,1fr);}
  .incoming-call{left:10px;right:10px;top:10px;min-width:unset;}
  .emoji-picker{width:260px;}
  /* Keep touch targets large enough */
  .icon-btn{width:40px;height:40px;}
  .send-btn{width:46px;height:46px;}
}

/* Safe area for notch phones */
@supports(padding-bottom: env(safe-area-inset-bottom)){
  .message-composer{padding-bottom:calc(10px + env(safe-area-inset-bottom));}
  .sidebar-bottom{padding-bottom:calc(10px + env(safe-area-inset-bottom));}
}
