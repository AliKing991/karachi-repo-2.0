// ============================================
//  AURACHAT — PREMIUM SCRIPT v2
//  Features: Voice Msg, Stories, Call, Destruct
//            Edit/Forward, Lock, Dashboard, Block
// ============================================

// ===== FIREBASE =====
const firebaseConfig = {
  apiKey:"AIzaSyBEnL-jzxZ89rT9vdqHHNcgjSrFXtGz6ho",
  authDomain:"whats-app-4f3d7.firebaseapp.com",
  projectId:"whats-app-4f3d7",
  databaseURL:"https://whats-app-4f3d7-default-rtdb.firebaseio.com"
};
firebase.initializeApp(firebaseConfig);
const db=firebase.database();
const usersRef=db.ref("users");
const msgsRef=db.ref("messages");
const statusRef=db.ref("status");
const typingRef=db.ref("typingStatus");
const reactRef=db.ref("reactions");
const storiesRef=db.ref("stories");
const callsRef=db.ref("calls");
const blocksRef=db.ref("blocks");

// ===== STATE =====
let currentUser=null, currentChatUser=null;
let isAdmin=false, isMuted=false;
let typingTimeout=null, replyTo=null;
let currentTab="all", allUsers=[], unreadCounts={};
let searchMatches=[], searchIdx=-1;
let activeListeners={};
let destructTime=0; // seconds, 0=off
let editingMsgId=null, editingChatId=null;
let forwardMsgText=null;
let storyBgColor="#1E1E35";
let storyTimers={};
let currentStories=[], currentStoryIdx=0, storyAutoTimer=null;
let mediaRecorder=null, audioChunks=[], voiceRecTimer=null, voiceRecSeconds=0;
let currentCallType=null, localStream=null, callTimerInterval=null, callSeconds=0;
let chatLockPin=localStorage.getItem("aurachat_pin")||null;
let notifPrefs={messages:true,sound:true,stories:true};
let blockedUsers=JSON.parse(localStorage.getItem("aurachat_blocked")||"[]");

// ===== EMOJIS =====
const EMOJIS=["😀","😂","🥰","😍","🤩","😎","🥺","😭","😤","🤔","🙄","😴","🤗","😇","🤯","🥳",
  "👍","👎","❤️","🔥","💯","🎉","✨","⭐","💫","🌟","💥","🎯","🚀","🏆","🎁","🎊",
  "😋","😛","🤣","😆","😅","😓","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥱",
  "👀","🫶","🙌","👏","🤝","💪","🫂","✌️","🤞","🤙","👋","🫡","💅","🧠","👁️","💀"];

const WALLPAPERS=[
  {type:"gradient",value:"linear-gradient(135deg,#0D0D1A,#1A1A2E)",label:"🌌"},
  {type:"gradient",value:"linear-gradient(135deg,#0f2027,#203a43,#2c5364)",label:"🌊"},
  {type:"gradient",value:"linear-gradient(135deg,#1a0533,#2d1b69,#11998e)",label:"🔮"},
  {type:"gradient",value:"linear-gradient(135deg,#f093fb,#f5576c)",label:"🌸"},
  {type:"gradient",value:"linear-gradient(135deg,#4facfe,#00f2fe)",label:"💎"},
  {type:"gradient",value:"linear-gradient(135deg,#43e97b,#38f9d7)",label:"🍃"},
  {type:"gradient",value:"linear-gradient(135deg,#fa709a,#fee140)",label:"🌅"},
  {type:"gradient",value:"linear-gradient(135deg,#30cfd0,#667eea)",label:"🎆"},
  {type:"color",value:"#0D0D1A",label:"⬛"},
  {type:"color",value:"#FAFAFA",label:"⬜"},
  {type:"color",value:"#1a1a2e",label:"🟦"},
  {type:"color",value:"#2d1b69",label:"🟣"},
];
const STORY_BG=["#6C63FF","#FF6B9D","#00D4AA","#FF9500","#FF3B30","#34C759","#007AFF","#5856D6","#000","#fff"];

// ===== SPLASH =====
window.addEventListener("load",()=>{
  setTimeout(()=>{
    document.getElementById("splashScreen").classList.add("fade-out");
    setTimeout(()=>document.getElementById("splashScreen").style.display="none",600);
  },1800);
  loadNotifPrefs();
});

// ===== LOCK SCREEN =====
let pinBuffer="";
function showLockIfNeeded(){
  if(chatLockPin){
    document.getElementById("lockScreen").style.display="flex";
    pinBuffer="";
    updatePinDots();
  }
}
function pinInput(v){
  if(v==="C"){pinBuffer="";updatePinDots();document.getElementById("pinError").textContent="";return;}
  if(v==="DEL"){pinBuffer=pinBuffer.slice(0,-1);updatePinDots();return;}
  if(pinBuffer.length>=4)return;
  pinBuffer+=String(v);
  updatePinDots();
  if(pinBuffer.length===4){
    if(pinBuffer===chatLockPin){
      document.getElementById("lockScreen").style.display="none";
      document.getElementById("pinError").textContent="";
    } else {
      document.getElementById("pinError").textContent="❌ Wrong PIN";
      document.getElementById("pinDots").querySelectorAll("span").forEach(s=>s.style.background="var(--danger)");
      setTimeout(()=>{pinBuffer="";updatePinDots();document.getElementById("pinError").textContent="";},800);
    }
  }
}
function updatePinDots(){
  document.getElementById("pinDots").querySelectorAll("span").forEach((s,i)=>{
    s.classList.toggle("filled",i<pinBuffer.length);
    s.style.background="";
  });
}
function openChatLockSetup(){document.getElementById("chatLockModal").style.display="flex";closeDropdowns();}
function saveChatLock(){
  const p=document.getElementById("newPinInput").value.trim();
  const c=document.getElementById("confirmPinInput").value.trim();
  if(p.length!==4||!/^\d{4}$/.test(p))return showToast("Enter a 4-digit number PIN");
  if(p!==c)return showToast("PINs don't match");
  chatLockPin=p;
  localStorage.setItem("aurachat_pin",p);
  closeModal("chatLockModal");
  showToast("🔒 Chat Lock enabled");
}
function removeChatLock(){
  chatLockPin=null;
  localStorage.removeItem("aurachat_pin");
  closeModal("chatLockModal");
  showToast("🔓 Chat Lock removed");
}

// ===== ROLE SWITCH =====
let selectedRole="user";
function switchRole(role){
  selectedRole=role;
  document.querySelectorAll(".role-tab").forEach(b=>b.classList.remove("active"));
  document.querySelector(`[data-role="${role}"]`).classList.add("active");
  document.getElementById("adminFields").style.display=role==="admin"?"block":"none";
}

// ===== PROFILE PHOTO PREVIEW =====
document.getElementById("profilePic").addEventListener("change",function(){
  const f=this.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=e=>document.getElementById("profilePreview").src=e.target.result;
  r.readAsDataURL(f);
});

// ===== LOGIN =====
document.getElementById("submitUser").addEventListener("click",async()=>{
  const name=document.getElementById("displayName").value.trim();
  const pwd=document.getElementById("adminPassword").value.trim();
  if(!name)return showToast("⚠️ Enter your name");
  if(selectedRole==="admin"){
    if(pwd!=="Ali-sec")return showToast("❌ Wrong admin password!");
    isAdmin=true;
  }
  const picFile=document.getElementById("profilePic").files[0];
  let photoURL=`https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(name)}`;
  if(picFile){
    photoURL=await new Promise(res=>{
      const r=new FileReader();r.onload=e=>res(e.target.result);r.readAsDataURL(picFile);
    });
  }
  currentUser={displayName:name,photoURL,role:isAdmin?"admin":"user",joinedAt:Date.now()};
  await usersRef.child(name).set(currentUser);
  const snap=await usersRef.child(name).get();
  if(snap.exists()) currentUser={...snap.val(),role:isAdmin?"admin":"user"};

  document.getElementById("currentUserName").textContent=name;
  document.getElementById("currentUserAvatar").src=currentUser.photoURL;
  document.getElementById("myStatusText").textContent="🟢 Available";
  document.getElementById("loginScreen").style.display="none";
  document.getElementById("chatInterface").style.display="flex";
  if(isAdmin){
    document.getElementById("adminControls").style.display="flex";
    document.getElementById("dashboardNavBtn").style.display="block";
  }

  const goOnline=()=>statusRef.child(name).set({online:true,lastSeen:Date.now(),status:"🟢 Available"});
  goOnline(); setInterval(goOnline,25000);
  window.addEventListener("beforeunload",()=>{
    statusRef.child(name).set({online:false,lastSeen:Date.now()});
    typingRef.child(name).remove();
  });

  initEmojiPicker(); initWallpaperGrid(); initStoryBgPicker();
  loadUsers(); loadStories(); listenCalls();
  showLockIfNeeded();
  requestPushPermissionSilent();
});

// ===== LOAD USERS =====
function loadUsers(){
  usersRef.on("value",snap=>{
    allUsers=[];
    snap.forEach(child=>{
      const u=child.val();
      if(u.displayName===currentUser.displayName)return;
      if(!isAdmin&&u.role!=="admin")return;
      if(blockedUsers.includes(u.displayName))return;
      allUsers.push(u);
    });
    const loginTime=Date.now();
    allUsers.forEach(u=>{
      const chatId=getChatId2(currentUser.displayName,u.displayName);
      msgsRef.child(chatId).orderByChild("read").equalTo(false).once("value",uSnap=>{
        let count=0;
        uSnap.forEach(m=>{if(m.val().sender!==currentUser.displayName)count++;});
        if(count>0){unreadCounts[u.displayName]=count;renderContacts();}
      });
      msgsRef.child(chatId).orderByChild("timestamp").startAt(loginTime).on("child_added",mSnap=>{
        const msg=mSnap.val();
        if(!msg||msg.sender===currentUser.displayName||isMuted)return;
        if(!currentChatUser||currentChatUser.displayName!==msg.sender){
          unreadCounts[msg.sender]=(unreadCounts[msg.sender]||0)+1;
          renderContacts();
          playNotifSound();
          showToast(`💬 ${msg.sender}: ${(msg.text||"📷 Photo").slice(0,35)}`);
        }
      });
    });
    renderContacts();
  });
}

function renderContacts(filter=""){
  const list=document.getElementById("users"); list.innerHTML="";
  let filtered=allUsers.filter(u=>u.displayName.toLowerCase().includes(filter.toLowerCase()));
  if(currentTab==="online") filtered=filtered.filter(u=>u._online);
  else if(currentTab==="unread") filtered=filtered.filter(u=>unreadCounts[u.displayName]>0);
  if(!filtered.length){
    list.innerHTML=`<div style="text-align:center;color:var(--text3);padding:20px;font-size:13px;">No contacts found</div>`;
    return;
  }
  filtered.forEach(user=>{
    statusRef.child(user.displayName).get().then(sSnap=>{
      const st=sSnap.val()||{};
      user._online=!!st.online;
      const chatId=getChatId2(currentUser.displayName,user.displayName);
      msgsRef.child(chatId).limitToLast(1).get().then(mSnap=>{
        let lastMsg="",lastTime="";
        mSnap.forEach(m=>{const v=m.val();lastMsg=v.image?"📷 Photo":v.voice?"🎤 Voice":v.text||"";lastTime=formatTime(v.timestamp);});
        const li=document.createElement("div");
        li.className=`contact-item ${currentChatUser?.displayName===user.displayName?"active":""}`;
        li.id=`contact-${user.displayName}`;
        li.onclick=()=>openChat(user);
        const unread=unreadCounts[user.displayName]||0;
        li.innerHTML=`
          <div class="avatar-wrap">
            <img src="${user.photoURL||`https://api.dicebear.com/7.x/thumbs/svg?seed=${user.displayName}`}" alt=""/>
            ${user._online?`<span class="online-badge"></span>`:""}
          </div>
          <div class="contact-info">
            <div class="cname">${escHtml(user.displayName)}${user.role==="admin"?" 🛡️":""}</div>
            <div class="clast">${lastMsg||"Start a conversation"}</div>
          </div>
          <div class="contact-meta">
            ${lastTime?`<span class="contact-time">${lastTime}</span>`:""}
            ${unread>0?`<span class="unread-badge">${unread}</span>`:""}
          </div>`;
        list.appendChild(li);
      });
    });
  });
}

function filterContacts(val){renderContacts(val);}
function switchTab(tab,btn){
  currentTab=tab;
  document.querySelectorAll(".stab").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  renderContacts();
}

// ===== OPEN CHAT =====
function openChat(user){
  document.querySelectorAll(".contact-item").forEach(el=>el.classList.remove("active"));
  const li=document.getElementById(`contact-${user.displayName}`);
  if(li) li.classList.add("active");
  currentChatUser=user;
  unreadCounts[user.displayName]=0;
  renderContacts();

  document.getElementById("chatHeader").style.display="flex";
  document.getElementById("emptyState").style.display="none";
  document.getElementById("composer").style.display="flex";
  document.getElementById("chatPartnerName").textContent=user.displayName;
  document.getElementById("chatPartnerAvatar").src=user.photoURL||`https://api.dicebear.com/7.x/thumbs/svg?seed=${user.displayName}`;

  statusRef.child(user.displayName).on("value",snap=>{
    const st=snap.val()||{};
    const badge=document.getElementById("partnerOnlineBadge");
    if(st.online){
      document.getElementById("partnerStatus").textContent=st.status||"Online";
      badge.style.display="block";
    } else {
      const mins=st.lastSeen?Math.floor((Date.now()-st.lastSeen)/60000):null;
      document.getElementById("partnerStatus").textContent=
        mins!==null?(mins<1?"Last seen just now":`Last seen ${mins} min ago`):"Offline";
      badge.style.display="none";
    }
  });
  typingRef.child(user.displayName).on("value",snap=>{
    const t=snap.val();
    if(t&&t.to===currentUser.displayName&&t.isTyping) showTypingIndicator();
    else hideTypingIndicator();
  });

  document.getElementById("messageInput").disabled=false;
  document.getElementById("sendMessage").disabled=false;
  document.getElementById("messages").innerHTML="";
  document.getElementById("chatInterface").classList.add("mobile-chat");

  // Update destruct indicator
  updateDestructIndicator();

  if(activeListeners.messages){
    msgsRef.child(activeListeners.chatId).off("child_added",activeListeners.messages);
  }

  loadMessages();
  closeSearch(); cancelReply(); cancelForward();
}

// ===== CHAT ID =====
function getChatId(u1,u2){
  if(!u1||!u2)return"invalid";
  return[u1.displayName,u2.displayName].sort().join("__");
}
function getChatId2(n1,n2){return[n1,n2].sort().join("__");}

// ===== LOAD MESSAGES (FIXED) =====
function loadMessages(){
  const chatId=getChatId(currentUser,currentChatUser);
  activeListeners.chatId=chatId;
  const container=document.getElementById("messages");
  container.innerHTML="";

  msgsRef.child(chatId).once("value",snap=>{
    let lastDate="";
    snap.forEach(child=>{
      const msg={...child.val(),id:child.key};
      const msgDate=new Date(msg.timestamp).toDateString();
      if(msgDate!==lastDate){
        lastDate=msgDate;
        const div=document.createElement("div");
        div.className="date-divider";
        div.innerHTML=`<span>${formatDate(msg.timestamp)}</span>`;
        container.appendChild(div);
      }
      if(msg.sender!==currentUser.displayName&&!msg.read)
        msgsRef.child(chatId).child(child.key).update({read:true});
      renderMessage(msg,chatId);
    });
    container.scrollTop=container.scrollHeight;

    const lastTs=Date.now();
    const handler=msgsRef.child(chatId).orderByChild("timestamp").startAt(lastTs)
      .on("child_added",child=>{
        const msg={...child.val(),id:child.key};
        if(document.getElementById(`bubble-${msg.id}`))return;
        const msgDate=new Date(msg.timestamp).toDateString();
        const lastDiv=container.querySelector(".date-divider:last-of-type span");
        if(!lastDiv||lastDiv.textContent!==formatDate(msg.timestamp)){
          const div=document.createElement("div");
          div.className="date-divider";
          div.innerHTML=`<span>${formatDate(msg.timestamp)}</span>`;
          container.appendChild(div);
        }
        if(msg.sender!==currentUser.displayName&&!msg.read)
          msgsRef.child(chatId).child(child.key).update({read:true});
        renderMessage(msg,chatId);
        container.scrollTop=container.scrollHeight;
        renderContacts();

        // Auto-delete if self-destruct set
        if(msg.destructAfter&&msg.sender===currentUser.displayName){
          scheduleDestruct(chatId,child.key,msg.destructAfter);
        }
      });
    activeListeners.messages=handler;
  });
}

// ===== RENDER MESSAGE =====
function renderMessage(msg,chatId){
  if(msg.deleted){
    const div=document.createElement("div");
    div.className="sys-msg";
    div.textContent=`🚫 Message deleted`;
    document.getElementById("messages").appendChild(div);
    return;
  }
  const container=document.getElementById("messages");
  const isOut=msg.sender===currentUser.displayName;
  const wrap=document.createElement("div");
  wrap.className=`msg-wrap ${isOut?"out":"in"}`;
  wrap.dataset.id=msg.id;
  wrap.dataset.text=(msg.text||"").toLowerCase();

  if(!isOut&&isAdmin){
    const s=document.createElement("div");
    s.className="msg-sender";s.textContent=msg.sender;wrap.appendChild(s);
  }

  // Hover actions
  const actions=document.createElement("div");
  actions.className="msg-actions";
  let actHTML=`<button onclick="replyToMsg('${msg.id}','${escAttr(msg.text||"📷 Photo")}')" title="Reply">↩️</button>
    <button onclick="addReaction('${chatId}','${msg.id}')" title="React">😊</button>
    <button onclick="forwardMsg('${escAttr(msg.text||"")}')" title="Forward">📤</button>
    <button onclick="copyMsg('${escAttr(msg.text||"")}')" title="Copy">📋</button>`;
  if(isOut) actHTML+=`<button onclick="openEditMsg('${chatId}','${msg.id}','${escAttr(msg.text||"")}')" title="Edit">✏️</button>`;
  if(isOut||isAdmin) actHTML+=`<button onclick="deleteMsg('${chatId}','${msg.id}')" title="Delete">🗑️</button>`;
  actions.innerHTML=actHTML;
  wrap.appendChild(actions);

  // Bubble
  const bubble=document.createElement("div");
  bubble.className="bubble";
  bubble.id=`bubble-${msg.id}`;

  if(msg.replyTo) bubble.innerHTML+=`<div class="reply-ref">↩ ${escHtml(msg.replyTo)}</div>`;

  if(msg.voice){
    bubble.appendChild(buildVoicePlayer(msg.voice,msg.voiceDuration||0));
  } else if(msg.image){
    bubble.innerHTML+=`<img src="${msg.image}" alt="photo" onclick="openImageFull('${msg.image}')"/>`;
  } else {
    bubble.innerHTML+=`<span>${escHtml(msg.text||"")}</span>`;
  }

  if(msg.edited) bubble.innerHTML+=`<span class="edited-tag">(edited)</span>`;
  wrap.appendChild(bubble);

  // Meta
  const meta=document.createElement("div");
  meta.className="msg-meta";
  let metaHTML=`<span class="time">${formatTime(msg.timestamp)}</span>`;
  if(isOut) metaHTML+=`<span class="ticks ${msg.read?"read":""}">✓✓</span>`;
  if(msg.destructAfter) metaHTML+=`<span class="destruct-countdown" id="dc-${msg.id}">⏱${fmtSec(msg.destructAfter)}</span>`;
  meta.innerHTML=metaHTML;
  wrap.appendChild(meta);

  // Reactions
  const reactDiv=document.createElement("div");
  reactDiv.className="reactions";reactDiv.id=`reactions-${msg.id}`;
  wrap.appendChild(reactDiv);
  container.appendChild(wrap);

  reactRef.child(chatId).child(msg.id).on("value",snap=>{
    reactDiv.innerHTML="";
    const counts={};
    snap.forEach(r=>{const v=r.val();counts[v]=(counts[v]||0)+1;});
    Object.entries(counts).forEach(([emoji,count])=>{
      const chip=document.createElement("span");
      chip.className="react-chip";chip.textContent=`${emoji} ${count}`;
      reactDiv.appendChild(chip);
    });
  });

  // Schedule destruct if applicable
  if(msg.destructAfter&&msg.sender===currentUser.displayName){
    const remaining=msg.destructAt?Math.max(0,Math.floor((msg.destructAt-Date.now())/1000)):msg.destructAfter;
    if(remaining>0) scheduleDestruct(chatId,msg.id,remaining);
    else { msgsRef.child(chatId).child(msg.id).update({deleted:true,text:""}); }
  }
}

// ===== VOICE PLAYER =====
function buildVoicePlayer(dataUrl,duration){
  const wrap=document.createElement("div");
  wrap.className="voice-msg";
  const bars=Array.from({length:20},(_,i)=>`<div class="voice-wave-bar" style="height:${4+Math.random()*14}px;animation-delay:${i*0.05}s"></div>`).join("");
  wrap.innerHTML=`
    <button class="voice-play-btn" onclick="playVoice(this,'${dataUrl}')"><i class="fas fa-play"></i></button>
    <div class="voice-waves">${bars}</div>
    <span class="voice-duration">${fmtSec(duration)}</span>`;
  return wrap;
}

function playVoice(btn,dataUrl){
  const audio=new Audio(dataUrl);
  btn.innerHTML=`<i class="fas fa-pause"></i>`;
  audio.play();
  audio.onended=()=>btn.innerHTML=`<i class="fas fa-play"></i>`;
}

// ===== VOICE RECORDING =====
function startVoiceRecord(e){
  if(e)e.preventDefault();
  if(!navigator.mediaDevices)return showToast("Microphone not supported");
  navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
    localStream=stream;
    mediaRecorder=new MediaRecorder(stream);
    audioChunks=[];
    mediaRecorder.ondataavailable=e=>audioChunks.push(e.data);
    mediaRecorder.start();
    document.getElementById("voiceRecordBtn").classList.add("recording");
    document.getElementById("voiceRecordingBar").style.display="flex";
    document.getElementById("composer").style.display="none";
    voiceRecSeconds=0;
    voiceRecTimer=setInterval(()=>{
      voiceRecSeconds++;
      document.getElementById("recTimer").textContent=voiceRecSeconds+"s";
    },1000);
  }).catch(()=>showToast("Cannot access microphone"));
}

function stopVoiceRecord(){
  if(!mediaRecorder||mediaRecorder.state==="inactive")return;
  mediaRecorder.stop();
  clearInterval(voiceRecTimer);
  document.getElementById("voiceRecordBtn").classList.remove("recording");
  document.getElementById("voiceRecordingBar").style.display="none";
  document.getElementById("composer").style.display="flex";
  if(localStream){localStream.getTracks().forEach(t=>t.stop());localStream=null;}
  mediaRecorder.onstop=()=>{
    const blob=new Blob(audioChunks,{type:"audio/webm"});
    const reader=new FileReader();
    reader.onload=e=>{
      const chatId=getChatId(currentUser,currentChatUser);
      const payload={voice:e.target.result,voiceDuration:voiceRecSeconds,sender:currentUser.displayName,timestamp:Date.now(),read:false};
      if(destructTime>0){payload.destructAfter=destructTime;payload.destructAt=Date.now()+destructTime*1000;}
      msgsRef.child(chatId).push(payload);
      renderContacts();
    };
    reader.readAsDataURL(blob);
  };
}

function cancelVoiceRecord(){
  if(mediaRecorder&&mediaRecorder.state!=="inactive") mediaRecorder.stop();
  clearInterval(voiceRecTimer);
  document.getElementById("voiceRecordBtn").classList.remove("recording");
  document.getElementById("voiceRecordingBar").style.display="none";
  document.getElementById("composer").style.display="flex";
  if(localStream){localStream.getTracks().forEach(t=>t.stop());localStream=null;}
  audioChunks=[];
}

// ===== SEND MESSAGE =====
document.getElementById("sendMessage").addEventListener("click",sendMsg);
document.getElementById("messageInput").addEventListener("keydown",e=>{
  if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}
});

function sendMsg(){
  // Check forward mode
  if(forwardMsgText){
    const chatId=getChatId(currentUser,currentChatUser);
    msgsRef.child(chatId).push({text:`📤 ${forwardMsgText}`,sender:currentUser.displayName,timestamp:Date.now(),read:false});
    cancelForward(); renderContacts(); return;
  }
  const text=document.getElementById("messageInput").value.trim();
  if(!text||!currentChatUser)return;
  const chatId=getChatId(currentUser,currentChatUser);
  const payload={text,sender:currentUser.displayName,timestamp:Date.now(),read:false};
  if(replyTo) payload.replyTo=replyTo;
  if(destructTime>0){payload.destructAfter=destructTime;payload.destructAt=Date.now()+destructTime*1000;}
  msgsRef.child(chatId).push(payload);
  document.getElementById("messageInput").value="";
  typingRef.child(currentUser.displayName).set({to:currentChatUser.displayName,isTyping:false});
  cancelReply(); renderContacts();
}

// ===== IMAGE MESSAGE =====
function triggerImageUpload(){document.getElementById("imageUpload").click();}
function sendImageMessage(input){
  const file=input.files[0];if(!file||!currentChatUser)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const chatId=getChatId(currentUser,currentChatUser);
    const payload={image:e.target.result,sender:currentUser.displayName,timestamp:Date.now(),read:false};
    if(destructTime>0){payload.destructAfter=destructTime;payload.destructAt=Date.now()+destructTime*1000;}
    msgsRef.child(chatId).push(payload);
    renderContacts();
  };
  reader.readAsDataURL(file);
  input.value="";
}

function openImageFull(src){
  const o=document.createElement("div");
  o.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;";
  o.innerHTML=`<img src="${src}" style="max-width:90vw;max-height:90vh;border-radius:12px;"/>`;
  o.onclick=()=>document.body.removeChild(o);
  document.body.appendChild(o);
}

// ===== TYPING =====
document.getElementById("messageInput").addEventListener("input",()=>{
  if(!currentChatUser)return;
  typingRef.child(currentUser.displayName).set({to:currentChatUser.displayName,isTyping:true});
  clearTimeout(typingTimeout);
  typingTimeout=setTimeout(()=>{
    typingRef.child(currentUser.displayName).set({to:currentChatUser.displayName,isTyping:false});
  },2000);
});

let typingEl=null;
function showTypingIndicator(){
  if(typingEl)return;
  typingEl=document.createElement("div");
  typingEl.className="typing-indicator";
  typingEl.innerHTML=`<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
  document.getElementById("messages").appendChild(typingEl);
  document.getElementById("messages").scrollTop=document.getElementById("messages").scrollHeight;
}
function hideTypingIndicator(){if(typingEl){typingEl.remove();typingEl=null;}}

// ===== SELF-DESTRUCT =====
function openDestructTimer(){
  document.getElementById("destructModal").style.display="flex";
  closeDropdowns();
}

function setDestructTime(secs){
  destructTime=secs;
  const status=document.getElementById("destructStatus");
  if(secs===0){
    status.textContent="Self-destruct: Off";
    document.querySelectorAll(".destruct-options button").forEach(b=>b.classList.remove("active-destruct"));
  } else {
    status.textContent=`✅ Messages will delete after ${fmtSec(secs)}`;
    document.querySelectorAll(".destruct-options button").forEach(b=>{
      b.classList.toggle("active-destruct",parseInt(b.textContent)===secs||b.textContent.includes(fmtSec(secs)));
    });
  }
  updateDestructIndicator();
  closeModal("destructModal");
}

function updateDestructIndicator(){
  const ind=document.getElementById("destructIndicator");
  if(!ind)return;
  if(destructTime>0){
    ind.style.display="flex";
    document.getElementById("destructLabel").textContent=`Self-destruct: ${fmtSec(destructTime)}`;
  } else {
    ind.style.display="none";
  }
}

function scheduleDestruct(chatId,msgId,seconds){
  if(storyTimers[msgId])return;
  let remaining=seconds;
  const dcEl=document.getElementById(`dc-${msgId}`);
  storyTimers[msgId]=setInterval(()=>{
    remaining--;
    if(dcEl)dcEl.textContent=`⏱${fmtSec(remaining)}`;
    if(remaining<=0){
      clearInterval(storyTimers[msgId]);
      delete storyTimers[msgId];
      msgsRef.child(chatId).child(msgId).update({deleted:true,text:"",image:"",voice:""});
    }
  },1000);
}

// ===== EDIT MESSAGE =====
function openEditMsg(chatId,msgId,text){
  editingMsgId=msgId;editingChatId=chatId;
  document.getElementById("editMsgInput").value=text;
  document.getElementById("editMsgModal").style.display="flex";
}
function saveEditedMsg(){
  const newText=document.getElementById("editMsgInput").value.trim();
  if(!newText||!editingMsgId)return;
  msgsRef.child(editingChatId).child(editingMsgId).update({text:newText,edited:true});
  closeModal("editMsgModal");
  showToast("✅ Message edited");
  editingMsgId=null;editingChatId=null;
}

// ===== FORWARD MESSAGE =====
function forwardMsg(text){
  forwardMsgText=text;
  document.getElementById("forwardBar").style.display="flex";
  document.getElementById("forwardPreview").textContent=text.slice(0,40)+(text.length>40?"...":"");
  showToast("Select a chat to forward");
}
function cancelForward(){forwardMsgText=null;document.getElementById("forwardBar").style.display="none";}

// ===== REPLY =====
function replyToMsg(id,text){
  replyTo=text;
  document.getElementById("replyText").textContent=text;
  document.getElementById("replyPreview").style.display="flex";
  document.getElementById("messageInput").focus();
}
function cancelReply(){replyTo=null;document.getElementById("replyPreview").style.display="none";}

// ===== REACTIONS =====
function addReaction(chatId,msgId){
  const existing=document.createElement("div");
  existing.style.cssText="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:10px 14px;display:flex;flex-wrap:wrap;gap:6px;z-index:999;max-width:300px;box-shadow:var(--shadow);";
  ["❤️","😂","😮","😢","👍","👎","🔥","🎉","😍","🤯"].forEach(emoji=>{
    const btn=document.createElement("span");
    btn.textContent=emoji;btn.style.cssText="font-size:26px;cursor:pointer;padding:4px;";
    btn.onclick=()=>{reactRef.child(chatId).child(msgId).child(currentUser.displayName).set(emoji);document.body.removeChild(existing);};
    existing.appendChild(btn);
  });
  const cl=document.createElement("span");
  cl.textContent="✕";cl.style.cssText="font-size:16px;cursor:pointer;color:var(--text3);align-self:center;margin-left:6px;";
  cl.onclick=()=>document.body.removeChild(existing);
  existing.appendChild(cl);
  document.body.appendChild(existing);
}

// ===== DELETE / COPY =====
function deleteMsg(chatId,msgId){
  if(!confirm("Delete this message?"))return;
  msgsRef.child(chatId).child(msgId).update({deleted:true,text:"",image:"",voice:""});
  showToast("Message deleted");
}
function copyMsg(text){
  navigator.clipboard.writeText(text).then(()=>showToast("✅ Copied!"));
}

// ===== SEARCH =====
function openSearch(){
  const box=document.getElementById("searchBox");
  box.style.display=box.style.display==="flex"?"none":"flex";
  if(box.style.display==="flex") document.getElementById("searchInput").focus();
}
function closeSearch(){
  document.getElementById("searchBox").style.display="none";
  document.querySelectorAll(".bubble").forEach(b=>b.classList.remove("highlight"));
  searchMatches=[];searchIdx=-1;document.getElementById("searchCount").textContent="";
}
document.getElementById("searchInput").addEventListener("input",()=>{
  const q=document.getElementById("searchInput").value.toLowerCase().trim();
  searchMatches=[];searchIdx=-1;
  document.querySelectorAll(".msg-wrap").forEach(w=>{
    w.querySelector(".bubble")?.classList.remove("highlight");
    if(q&&w.dataset.text?.includes(q)) searchMatches.push(w);
  });
  document.getElementById("searchCount").textContent=q?`${searchMatches.length} found`:"";
  if(searchMatches.length>0){searchIdx=0;highlightMatch();}
});
function searchMessage(dir){
  if(!searchMatches.length)return;
  if(dir==="next") searchIdx=(searchIdx+1)%searchMatches.length;
  else searchIdx=(searchIdx-1+searchMatches.length)%searchMatches.length;
  highlightMatch();
}
function highlightMatch(){
  document.querySelectorAll(".bubble").forEach(b=>b.classList.remove("highlight"));
  const bubble=searchMatches[searchIdx]?.querySelector(".bubble");
  if(bubble){bubble.classList.add("highlight");bubble.scrollIntoView({behavior:"smooth",block:"center"});}
  document.getElementById("searchCount").textContent=`${searchIdx+1} / ${searchMatches.length}`;
}

// ===== STORIES =====
function loadStories(){
  storiesRef.on("value",snap=>{
    const list=document.getElementById("storiesList");
    list.innerHTML="";
    const stories={};
    snap.forEach(child=>{
      const s=child.val();
      if(Date.now()-s.timestamp>86400000)return; // 24h expiry
      if(!stories[s.author]) stories[s.author]=[];
      stories[s.author].push({...s,id:child.key});
    });
    Object.entries(stories).forEach(([author,items])=>{
      if(author===currentUser.displayName)return;
      const item=document.createElement("div");
      item.className="story-item";
      item.onclick=()=>openStory(author,items);
      item.innerHTML=`
        <div class="story-avatar-ring"><img src="${items[0].authorPhoto||`https://api.dicebear.com/7.x/thumbs/svg?seed=${author}`}"/></div>
        <span>${escHtml(author)}</span>`;
      list.appendChild(item);
    });
  });
}

function initStoryBgPicker(){
  const grid=document.getElementById("storyBgOptions");
  STORY_BG.forEach(color=>{
    const sw=document.createElement("div");
    sw.className="story-bg-swatch";sw.style.background=color;sw.title=color;
    sw.onclick=()=>{storyBgColor=color;document.querySelectorAll(".story-bg-swatch").forEach(s=>s.classList.remove("active"));sw.classList.add("active");};
    grid.appendChild(sw);
  });
}

function openStoryCreator(){document.getElementById("storyModal").style.display="flex";}

function previewStoryImage(input){
  const f=input.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=e=>{const img=document.getElementById("storyImagePreview");img.src=e.target.result;img.style.display="block";};
  r.readAsDataURL(f);
}

function postStory(){
  const text=document.getElementById("storyText").value.trim();
  const imgPreview=document.getElementById("storyImagePreview");
  const imgSrc=imgPreview.style.display!=="none"?imgPreview.src:"";
  if(!text&&!imgSrc)return showToast("Add text or photo");

  storiesRef.push({
    text,image:imgSrc,bg:storyBgColor,
    author:currentUser.displayName,
    authorPhoto:currentUser.photoURL,
    timestamp:Date.now()
  });
  closeModal("storyModal");
  document.getElementById("storyText").value="";
  document.getElementById("storyImagePreview").style.display="none";
  showToast("📖 Story posted!");
}

function openStoriesView(){
  // Show your own stories + others
  storiesRef.once("value",snap=>{
    const all=[];
    snap.forEach(child=>{
      const s=child.val();
      if(Date.now()-s.timestamp<86400000) all.push({...s,id:child.key});
    });
    if(!all.length)return showToast("No stories yet");
    openStory(all[0].author,[all[0]]);
  });
}

function openStory(author,items){
  currentStories=items;currentStoryIdx=0;
  document.getElementById("storiesViewer").style.display="flex";
  renderStorySlide();
}

function renderStorySlide(){
  const s=currentStories[currentStoryIdx];
  if(!s){closeStoriesViewer();return;}
  document.getElementById("svAvatar").src=s.authorPhoto||`https://api.dicebear.com/7.x/thumbs/svg?seed=${s.author}`;
  document.getElementById("svName").textContent=s.author;
  document.getElementById("svTime").textContent=timeAgo(s.timestamp);
  const content=document.getElementById("svContent");
  content.innerHTML="";
  if(s.image){const img=document.createElement("img");img.src=s.image;content.appendChild(img);}
  else if(s.text){const p=document.createElement("p");p.textContent=s.text;p.style.background=s.bg||"#1E1E35";content.appendChild(p);}

  // Progress bar
  const bar=document.getElementById("svProgressBar");
  bar.innerHTML=currentStories.map((_,i)=>`<div style="flex:1;height:3px;background:${i<currentStoryIdx?'#fff':i===currentStoryIdx?'':'rgba(255,255,255,.3)'};margin:0 2px;border-radius:3px;overflow:hidden;">${i===currentStoryIdx?`<div class="sv-progress-fill" style="width:0%;height:100%;"></div>`:""}</div>`).join("");

  // Auto advance
  clearTimeout(storyAutoTimer);
  storyAutoTimer=setTimeout(()=>storyNav(1),5000);
  const fill=bar.querySelector(".sv-progress-fill");
  if(fill) fill.style.transition="width 5s linear";
  setTimeout(()=>{if(fill)fill.style.width="100%";},50);
}

function storyNav(dir){
  clearTimeout(storyAutoTimer);
  currentStoryIdx+=dir;
  if(currentStoryIdx<0)currentStoryIdx=0;
  if(currentStoryIdx>=currentStories.length){closeStoriesViewer();return;}
  renderStorySlide();
}

function closeStoriesViewer(){
  document.getElementById("storiesViewer").style.display="none";
  clearTimeout(storyAutoTimer);
}

// ===== VOICE/VIDEO CALLS =====
function listenCalls(){
  callsRef.child(currentUser.displayName).on("value",snap=>{
    const call=snap.val();
    if(!call||call.status!=="ringing")return;
    if(Date.now()-call.timestamp>30000){callsRef.child(currentUser.displayName).remove();return;}
    showIncomingCall(call);
  });
}

function startVoiceCall(){
  if(!currentChatUser)return;
  currentCallType="voice";
  showCallScreen(currentChatUser,"Calling...",false);
  callsRef.child(currentChatUser.displayName).set({
    from:currentUser.displayName,fromPhoto:currentUser.photoURL,
    type:"voice",status:"ringing",timestamp:Date.now()
  });
  setTimeout(()=>{
    const cs=document.getElementById("callScreen");
    if(cs.style.display!=="none"){
      document.getElementById("callStatus").textContent="Connected";
      document.getElementById("callTimer").style.display="block";
      startCallTimer();
    }
  },3000);
}

function startVideoCall(){
  if(!currentChatUser)return;
  currentCallType="video";
  showCallScreen(currentChatUser,"Video Calling...",true);
  callsRef.child(currentChatUser.displayName).set({
    from:currentUser.displayName,fromPhoto:currentUser.photoURL,
    type:"video",status:"ringing",timestamp:Date.now()
  });
  navigator.mediaDevices?.getUserMedia({video:true,audio:true}).then(stream=>{
    localStream=stream;
    const lv=document.getElementById("localVideo");
    lv.srcObject=stream;lv.style.display="block";
    setTimeout(()=>{
      document.getElementById("callStatus").textContent="Connected";
      document.getElementById("callTimer").style.display="block";
      startCallTimer();
    },3000);
  }).catch(()=>showToast("Cannot access camera/mic"));
}

function showCallScreen(user,status,isVideo){
  document.getElementById("callScreen").style.display="flex";
  document.getElementById("callAvatar").src=user.photoURL||`https://api.dicebear.com/7.x/thumbs/svg?seed=${user.displayName}`;
  document.getElementById("callName").textContent=user.displayName;
  document.getElementById("callStatus").textContent=status;
  document.getElementById("callTimer").style.display="none";
}

function showIncomingCall(call){
  document.getElementById("incomingCall").style.display="flex";
  document.getElementById("incomingAvatar").src=call.fromPhoto||`https://api.dicebear.com/7.x/thumbs/svg?seed=${call.from}`;
  document.getElementById("incomingName").textContent=call.from;
  document.getElementById("incomingType").textContent=call.type==="video"?"📹 Video Call":"📞 Voice Call";
}

function acceptCall(){
  document.getElementById("incomingCall").style.display="none";
  callsRef.child(currentUser.displayName).update({status:"accepted"});
  const call=document.getElementById("incomingCall");
  showCallScreen({displayName:document.getElementById("incomingName").textContent,photoURL:document.getElementById("incomingAvatar").src},"Connected",false);
  document.getElementById("callTimer").style.display="block";
  startCallTimer();
}

function rejectCall(){
  document.getElementById("incomingCall").style.display="none";
  callsRef.child(currentUser.displayName).remove();
}

function endCall(){
  document.getElementById("callScreen").style.display="none";
  if(localStream){localStream.getTracks().forEach(t=>t.stop());localStream=null;}
  clearInterval(callTimerInterval);callSeconds=0;
  if(currentChatUser) callsRef.child(currentChatUser.displayName).remove();
  callsRef.child(currentUser.displayName).remove();
  showToast("📵 Call ended");
}

function startCallTimer(){
  callSeconds=0;
  callTimerInterval=setInterval(()=>{
    callSeconds++;
    const m=Math.floor(callSeconds/60).toString().padStart(2,"0");
    const s=(callSeconds%60).toString().padStart(2,"0");
    document.getElementById("callTimer").textContent=`${m}:${s}`;
  },1000);
}

function toggleCallMute(){
  const btn=document.getElementById("callMuteBtn");
  btn.classList.toggle("muted");
  const muted=btn.classList.contains("muted");
  btn.innerHTML=muted?`<i class="fas fa-microphone-slash"></i>`:`<i class="fas fa-microphone"></i>`;
  if(localStream) localStream.getAudioTracks().forEach(t=>t.enabled=!muted);
  showToast(muted?"🔇 Muted":"🎙️ Unmuted");
}

function toggleSpeaker(){
  showToast("🔊 Speaker toggled");
}

// ===== BLOCK USER =====
function blockUser(){
  if(!currentChatUser)return;
  if(!confirm(`Block ${currentChatUser.displayName}?`))return;
  blockedUsers.push(currentChatUser.displayName);
  localStorage.setItem("aurachat_blocked",JSON.stringify(blockedUsers));
  db.ref("blocks").child(currentUser.displayName).child(currentChatUser.displayName).set(true);
  showToast(`🚫 ${currentChatUser.displayName} blocked`);
  document.getElementById("chatHeader").style.display="none";
  document.getElementById("emptyState").style.display="flex";
  document.getElementById("composer").style.display="none";
  currentChatUser=null;
  loadUsers();
  closeModal("profileModal");
}

// ===== WALLPAPER =====
function initWallpaperGrid(){
  const grid=document.getElementById("wallpaperGrid");
  grid.innerHTML="";
  WALLPAPERS.forEach((wp,i)=>{
    const div=document.createElement("div");
    div.className="wp-option";
    div.style.background=wp.value;
    div.textContent=wp.label;
    div.onclick=()=>applyWallpaper(wp.value);
    grid.appendChild(div);
  });
}

function openWallpaperPicker(){
  document.getElementById("wallpaperModal").style.display="flex";
  closeDropdowns();
}

function applyWallpaper(value){
  document.getElementById("messages").style.backgroundImage=value.startsWith("linear")?value:"none";
  document.getElementById("messages").style.background=value;
  localStorage.setItem("aurachat_wallpaper",value);
  closeModal("wallpaperModal");
  showToast("🎨 Wallpaper applied");
}

function setCustomWallpaper(input){
  const file=input.files[0];if(!file)return;
  const r=new FileReader();
  r.onload=e=>{applyWallpaper(`url(${e.target.result})`);document.getElementById("messages").style.backgroundSize="cover";}; 
  r.readAsDataURL(file);
}

function clearWallpaper(){
  document.getElementById("messages").style.background="var(--bg)";
  document.getElementById("messages").style.backgroundImage="none";
  localStorage.removeItem("aurachat_wallpaper");
  closeModal("wallpaperModal");
  showToast("Wallpaper removed");
}

function loadSavedWallpaper(){
  const saved=localStorage.getItem("aurachat_wallpaper");
  if(saved){
    const area=document.getElementById("messages");
    if(saved.startsWith("url(")){area.style.backgroundImage=saved;area.style.backgroundSize="cover";}
    else area.style.background=saved;
  }
}

// ===== PUSH NOTIFICATIONS =====
function requestPushPermission(){
  if(!("Notification"in window))return showToast("Notifications not supported");
  Notification.requestPermission().then(p=>{
    if(p==="granted")showToast("🔔 Push notifications enabled!");
    else showToast("Notifications blocked in browser settings");
  });
  closeModal("notifModal");
}

function requestPushPermissionSilent(){
  if("Notification"in window&&Notification.permission==="default") Notification.requestPermission();
}

function sendPushNotif(title,body){
  if(!notifPrefs.messages)return;
  if(Notification.permission==="granted"){
    new Notification(title,{body,icon:currentUser?.photoURL||"",badge:""});
  }
}

function playNotifSound(){
  if(!notifPrefs.sound)return;
  try{
    const ctx=new AudioContext();
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    osc.connect(gain);gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880,ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440,ctx.currentTime+0.1);
    gain.gain.setValueAtTime(0.1,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.15);
    osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.15);
  }catch(e){}
}

function openNotifSettings(){document.getElementById("notifModal").style.display="flex";closeDropdowns();}
function saveNotifPref(){
  notifPrefs.messages=document.getElementById("notifMessages").checked;
  notifPrefs.sound=document.getElementById("notifSound").checked;
  notifPrefs.stories=document.getElementById("notifStories").checked;
  localStorage.setItem("aurachat_notif",JSON.stringify(notifPrefs));
  showToast("✅ Preferences saved");
}
function loadNotifPrefs(){
  const saved=localStorage.getItem("aurachat_notif");
  if(saved){notifPrefs={...notifPrefs,...JSON.parse(saved)};
    document.getElementById("notifMessages").checked=notifPrefs.messages;
    document.getElementById("notifSound").checked=notifPrefs.sound;
    document.getElementById("notifStories").checked=notifPrefs.stories;
  }
}

// ===== ADMIN DASHBOARD =====
function openAdminDashboard(){
  document.getElementById("adminDashboard").style.display="flex";
  loadDashboard();
}

function loadDashboard(){
  usersRef.once("value",uSnap=>{
    let totalUsers=0,onlineUsers=0;
    const userList=[];
    uSnap.forEach(c=>{totalUsers++;const u=c.val();userList.push(u);});

    msgsRef.once("value",mSnap=>{
      let totalMsgs=0;
      mSnap.forEach(chat=>{chat.forEach(()=>totalMsgs++);});

      Promise.all(userList.map(u=>statusRef.child(u.displayName).get())).then(statuses=>{
        statuses.forEach(s=>{if(s.val()?.online)onlineUsers++;});
        document.getElementById("dashboardStats").innerHTML=`
          <div class="stat-card"><div class="stat-num">${totalUsers}</div><div class="stat-label">Total Users</div></div>
          <div class="stat-card"><div class="stat-num" style="color:var(--accent2)">${onlineUsers}</div><div class="stat-label">Online Now</div></div>
          <div class="stat-card"><div class="stat-num" style="color:var(--accent)">${totalMsgs}</div><div class="stat-label">Total Messages</div></div>`;

        const duList=document.getElementById("dashboardUsers");
        duList.innerHTML="";
        userList.forEach(u=>{
          const row=document.createElement("div");row.className="dash-user-row";
          row.innerHTML=`
            <img src="${u.photoURL||`https://api.dicebear.com/7.x/thumbs/svg?seed=${u.displayName}`}"/>
            <div class="dash-user-info">
              <div class="dname">${escHtml(u.displayName)}</div>
              <div class="drole">${u.role==="admin"?"🛡️ Admin":"👤 User"} • Joined ${u.joinedAt?new Date(u.joinedAt).toLocaleDateString():"N/A"}</div>
            </div>
            <div class="dash-user-actions">
              <button class="dash-msg-btn" onclick="quickChat('${u.displayName}')">💬 Chat</button>
              ${u.displayName!==currentUser.displayName?`<button class="dash-ban-btn" onclick="adminBanUser('${u.displayName}')">🚫 Ban</button>`:""}
            </div>`;
          duList.appendChild(row);
        });
      });
    });
  });
}

function quickChat(name){
  closeModal("adminDashboard");
  usersRef.child(name).get().then(snap=>{if(snap.exists())openChat(snap.val());});
}

function adminBanUser(name){
  if(!confirm(`Ban ${name}?`))return;
  usersRef.child(name).remove();
  showToast(`🚫 ${name} banned`);
  loadDashboard();
}

// ===== ADMIN ACTIONS =====
function adminDeleteUser(){
  if(!currentChatUser)return showToast("Select a user first");
  if(!confirm(`Delete ${currentChatUser.displayName}?`))return;
  usersRef.child(currentChatUser.displayName).remove();
  msgsRef.once("value",snap=>{
    const updates={};
    snap.forEach(s=>{if(s.key.includes(currentChatUser.displayName))updates[s.key]=null;});
    msgsRef.update(updates);
  });
  document.getElementById("messages").innerHTML="";
  document.getElementById("chatHeader").style.display="none";
  document.getElementById("emptyState").style.display="flex";
  document.getElementById("composer").style.display="none";
  currentChatUser=null;
  showToast("🗑️ User deleted");
}

function adminUnsend(){
  if(!currentChatUser)return showToast("Select a chat first");
  const chatId=getChatId(currentUser,currentChatUser);
  msgsRef.child(chatId).limitToLast(1).get().then(snap=>{
    snap.forEach(child=>{
      if(child.val().sender===currentUser.displayName||isAdmin)
        msgsRef.child(chatId).child(child.key).update({deleted:true,text:""});
    });
    showToast("⛔ Message unsent");
  });
}

function adminBroadcast(){document.getElementById("broadcastModal").style.display="flex";}

function sendBroadcast(){
  const text=document.getElementById("broadcastText").value.trim();
  if(!text)return showToast("Enter a message");
  usersRef.get().then(snap=>{
    snap.forEach(child=>{
      const u=child.val();
      if(u.displayName===currentUser.displayName)return;
      const chatId=getChatId2(currentUser.displayName,u.displayName);
      msgsRef.child(chatId).push({text:`📢 ${text}`,sender:currentUser.displayName,timestamp:Date.now(),read:false});
    });
    showToast("📢 Broadcast sent!");
    closeModal("broadcastModal");
    document.getElementById("broadcastText").value="";
  });
}

// ===== BROADCAST LISTENER (users) =====
function listenBroadcasts(){
  if(isAdmin)return;
  const loginTime=Date.now();
  usersRef.get().then(snap=>{
    snap.forEach(child=>{
      const u=child.val();if(u.role!=="admin")return;
      const chatId=getChatId2(currentUser.displayName,u.displayName);
      msgsRef.child(chatId).orderByChild("read").equalTo(false).once("value",uSnap=>{
        let count=0;uSnap.forEach(m=>{if(m.val().sender!==currentUser.displayName)count++;});
        if(count>0){unreadCounts[u.displayName]=count;renderContacts();}
      });
      msgsRef.child(chatId).orderByChild("timestamp").startAt(loginTime).on("child_added",mSnap=>{
        const msg=mSnap.val();
        if(!msg||msg.sender===currentUser.displayName||isMuted)return;
        if(!currentChatUser||currentChatUser.displayName!==msg.sender){
          unreadCounts[msg.sender]=(unreadCounts[msg.sender]||0)+1;
          renderContacts();
          playNotifSound();
          showToast(`💬 ${msg.sender}: ${(msg.text||"📷 Photo").slice(0,35)}`);
          sendPushNotif(`AuraChat: ${msg.sender}`,msg.text||"Sent a photo");
        }
      });
    });
  });
}

// ===== DARK/LIGHT MODE =====
document.getElementById("toggleDark").addEventListener("click",()=>{
  document.body.classList.toggle("light-mode");
  const isLight=document.body.classList.contains("light-mode");
  document.getElementById("toggleDark").innerHTML=isLight?`<i class="fas fa-moon"></i>`:`<i class="fas fa-sun"></i>`;
  showToast(isLight?"☀️ Light mode":"🌙 Dark mode");
});

// ===== PROFILE =====
function viewProfile(){
  if(!currentChatUser)return;
  document.getElementById("modalAvatar").src=currentChatUser.photoURL||`https://api.dicebear.com/7.x/thumbs/svg?seed=${currentChatUser.displayName}`;
  document.getElementById("modalName").textContent=currentChatUser.displayName;
  document.getElementById("modalRole").textContent=currentChatUser.role==="admin"?"🛡️ Admin":"👤 User";
  statusRef.child(currentChatUser.displayName).get().then(snap=>{
    const st=snap.val()||{};
    document.getElementById("modalStatusTxt").textContent=st.status||(st.online?"🟢 Online":"🔴 Offline");
  });
  document.getElementById("modalJoined").textContent=currentChatUser.joinedAt?`Joined: ${new Date(currentChatUser.joinedAt).toLocaleDateString()}`:"";
  document.getElementById("modalActions").style.display="flex";
  document.getElementById("profileModal").style.display="flex";
}

function openMyProfile(){
  document.getElementById("modalAvatar").src=currentUser.photoURL;
  document.getElementById("modalName").textContent=currentUser.displayName;
  document.getElementById("modalRole").textContent=isAdmin?"🛡️ Admin":"👤 User";
  document.getElementById("modalStatusTxt").textContent=document.getElementById("myStatusText").textContent;
  document.getElementById("modalJoined").textContent=currentUser.joinedAt?`Joined: ${new Date(currentUser.joinedAt).toLocaleDateString()}`:"";
  document.getElementById("modalActions").style.display="none";
  document.getElementById("profileModal").style.display="flex";
  closeDropdowns();
}

// ===== STATUS =====
function setMyStatus(){document.getElementById("statusModal").style.display="flex";closeDropdowns();}
function saveStatus(status){
  document.getElementById("myStatusText").textContent=status;
  statusRef.child(currentUser.displayName).update({status});
  usersRef.child(currentUser.displayName).update({status});
  closeModal("statusModal");showToast("✅ Status updated");
}
function saveCustomStatus(){const s=document.getElementById("customStatus").value.trim();if(s)saveStatus(s);}

// ===== MUTE =====
function toggleMute(){
  isMuted=!isMuted;
  showToast(isMuted?"🔕 Chat muted":"🔔 Chat unmuted");
}

// ===== CLEAR CHAT =====
function clearChat(){
  if(!currentChatUser)return;
  if(!confirm("Clear entire chat?"))return;
  const chatId=getChatId(currentUser,currentChatUser);
  msgsRef.child(chatId).remove();
  reactRef.child(chatId).remove();
  showToast("🧹 Chat cleared");
}

// ===== EXPORT CHAT =====
function exportChat(){
  if(!currentChatUser)return;
  const msgs=document.querySelectorAll(".msg-wrap");
  let text=`AuraChat Export — ${currentUser.displayName} & ${currentChatUser.displayName}\n`;
  text+=`Exported: ${new Date().toLocaleString()}\n${"─".repeat(40)}\n\n`;
  msgs.forEach(w=>{
    const isOut=w.classList.contains("out");
    const who=isOut?currentUser.displayName:currentChatUser.displayName;
    const time=w.querySelector(".time")?.textContent||"";
    const msg=w.querySelector(".bubble span")?.textContent||"[Media]";
    text+=`[${time}] ${who}: ${msg}\n`;
  });
  const blob=new Blob([text],{type:"text/plain"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=`aurachat-${currentChatUser.displayName}.txt`;a.click();
  URL.revokeObjectURL(url);
  showToast("📥 Chat exported");
}

// ===== EDIT NAME =====
document.getElementById("editNameTrigger").addEventListener("click",()=>{
  const box=document.getElementById("editNameBox");
  box.style.display=box.style.display==="flex"?"none":"flex";closeDropdowns();
});
document.getElementById("saveNameBtn").addEventListener("click",async()=>{
  const newName=document.getElementById("newNameInput").value.trim();
  const old=currentUser.displayName;
  if(!newName||newName===old)return showToast("Enter a new name");
  if((await usersRef.child(newName).get()).exists())return showToast("Name already taken");
  await usersRef.child(newName).set({...currentUser,displayName:newName});
  await usersRef.child(old).remove();
  const allMsgs=await msgsRef.get();
  const updates={};
  allMsgs.forEach(snap=>{
    if(snap.key.includes(old)){
      const newKey=snap.key.replace(old,newName).split("__").sort().join("__");
      updates[newKey]=snap.val();updates[snap.key]=null;
    }
  });
  await msgsRef.update(updates);
  currentUser.displayName=newName;
  document.getElementById("currentUserName").textContent=newName;
  document.getElementById("editNameBox").style.display="none";
  document.getElementById("newNameInput").value="";
  showToast("✅ Name updated");
  loadUsers();
});

// ===== SETTINGS DROPDOWN =====
document.getElementById("settingsBtn").addEventListener("click",e=>{
  e.stopPropagation();
  document.getElementById("settingsMenu").classList.toggle("open");
});
document.addEventListener("click",closeDropdowns);
function closeDropdowns(){document.querySelectorAll(".dropdown-menu").forEach(m=>m.classList.remove("open"));}
function openSettingsPanel(){document.getElementById("settingsMenu").classList.toggle("open");}

// ===== BACK (mobile) =====
document.getElementById("backToContactsBtn").addEventListener("click",()=>{
  document.getElementById("chatInterface").classList.remove("mobile-chat");
});

// ===== EMOJI PICKER =====
function initEmojiPicker(){
  const grid=document.getElementById("emojiGrid");
  EMOJIS.forEach(e=>{
    const span=document.createElement("span");span.textContent=e;
    span.onclick=()=>{document.getElementById("messageInput").value+=e;document.getElementById("messageInput").focus();};
    grid.appendChild(span);
  });
}
function toggleEmojiPicker(){document.getElementById("emojiPicker").classList.toggle("open");}
document.addEventListener("click",e=>{
  if(!e.target.closest(".emoji-btn")&&!e.target.closest(".emoji-picker"))
    document.getElementById("emojiPicker").classList.remove("open");
});

// ===== LOGOUT =====
function logout(){
  if(!confirm("Logout?"))return;
  statusRef.child(currentUser.displayName).set({online:false,lastSeen:Date.now()});
  typingRef.child(currentUser.displayName).remove();
  location.reload();
}

// ===== MODAL HELPERS =====
function closeModal(id){document.getElementById(id).style.display="none";}
document.querySelectorAll(".modal-overlay").forEach(o=>{
  o.addEventListener("click",e=>{if(e.target===o)o.style.display="none";});
});

// ===== TOAST =====
let toastTO;
function showToast(msg){
  const t=document.getElementById("toast");
  t.textContent=msg;t.classList.add("show");
  clearTimeout(toastTO);
  toastTO=setTimeout(()=>t.classList.remove("show"),3000);
}

// ===== UTILS =====
function formatTime(ts){return new Date(ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});}
function formatDate(ts){
  const d=new Date(ts),today=new Date(),yest=new Date();yest.setDate(today.getDate()-1);
  if(d.toDateString()===today.toDateString())return"Today";
  if(d.toDateString()===yest.toDateString())return"Yesterday";
  return d.toLocaleDateString([],{weekday:"long",month:"short",day:"numeric"});
}
function timeAgo(ts){
  const mins=Math.floor((Date.now()-ts)/60000);
  if(mins<1)return"just now";if(mins<60)return`${mins}m ago`;
  const hrs=Math.floor(mins/60);if(hrs<24)return`${hrs}h ago`;
  return new Date(ts).toLocaleDateString();
}
function fmtSec(s){
  if(s<60)return`${s}s`;if(s<3600)return`${Math.floor(s/60)}m`;return`${Math.floor(s/3600)}h`;
}
function escHtml(str){
  if(!str)return"";
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function escAttr(str){
  if(!str)return"";
  return str.replace(/'/g,"&#39;").replace(/"/g,"&quot;").replace(/\n/g," ").slice(0,80);
}
