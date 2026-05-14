// ============================================
//  AURACHAT v4 — FIXED + ADMIN PANEL
//  Bug Fixes + Advanced Moderation System
// ============================================

// FIREBASE CONFIG
const firebaseConfig={
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
const groupsRef=db.ref("groups");
const couponsRef=db.ref("coupons");
const moderationRef=db.ref("moderation"); // BAN, MUTE, WARN, SUSPEND
const actionLogsRef=db.ref("actionLogs");  // Admin action history

// STATE VARIABLES
let currentUser=null;
let currentChatUser=null;
let currentChatIsGroup=false;
let isAdmin=false;
let moderationData={}; // userId -> {status, reason, until}
let actionLogs=[];
let allUsers=[];
let typingTimeout=null;
let replyTo=null;
let currentTab="chats";
let selectedModUser=null;

const EMOJIS=["😀","😂","🥰","😍","🤩","😎","🥺","😭","😤","🤔","🙄","😴","🤗","😇","🤯","🥳",
  "👍","👎","❤️","🔥","💯","🎉","✨","⭐","💫","🌟","💥","🎯","🚀","🏆","🎁","🎊"];

const WALLPAPERS=[
  {value:"linear-gradient(135deg,#0D0D1A,#1A1A2E)",label:"🌌"},
  {value:"linear-gradient(135deg,#0f2027,#203a43,#2c5364)",label:"🌊"},
  {value:"linear-gradient(135deg,#4facfe,#00f2fe)",label:"💎"},
  {value:"#0D0D1A",label:"⬛"}
];

// ===== UNIQUE ID GENERATOR =====
function generateUniqueId(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg=()=>Array.from({length:4},()=>chars[Math.floor(Math.random()*chars.length)]).join("");
  return `AURA-${seg()}-${seg()}`;
}

function generateCouponCode(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg=()=>Array.from({length:4},()=>chars[Math.floor(Math.random()*chars.length)]).join("");
  return `${seg()}-${seg()}`;
}

// ===== SPLASH =====
window.addEventListener("load",()=>{
  setTimeout(()=>{
    document.getElementById("splashScreen").classList.add("fade-out");
    setTimeout(()=>document.getElementById("splashScreen").style.display="none",600);
  },1800);
});

// ===== LOCK SCREEN =====
let pinBuffer="";
function showLockIfNeeded(){
  const pin=localStorage.getItem("aurachat_pin");
  if(pin){document.getElementById("lockScreen").style.display="flex";pinBuffer="";updatePinDots();}
}
function pinInput(v){
  if(v==="C"){pinBuffer="";updatePinDots();return;}
  if(v==="DEL"){pinBuffer=pinBuffer.slice(0,-1);updatePinDots();return;}
  if(pinBuffer.length>=4)return;
  pinBuffer+=String(v);updatePinDots();
  if(pinBuffer.length===4){
    const pin=localStorage.getItem("aurachat_pin");
    if(pinBuffer===pin){document.getElementById("lockScreen").style.display="none";}
    else{
      document.getElementById("pinError").textContent="❌ Wrong PIN";
      setTimeout(()=>{pinBuffer="";updatePinDots();document.getElementById("pinError").textContent="";},800);
    }
  }
}
function updatePinDots(){
  document.getElementById("pinDots").querySelectorAll("span").forEach((s,i)=>{
    s.classList.toggle("filled",i<pinBuffer.length);
  });
}
function openChatLockSetup(){document.getElementById("chatLockModal").style.display="flex";closeDropdowns();}
function saveChatLock(){
  const p=document.getElementById("newPinInput").value.trim();
  const c=document.getElementById("confirmPinInput").value.trim();
  if(p.length!==4||!/^\d{4}$/.test(p))return showToast("Enter a 4-digit PIN");
  if(p!==c)return showToast("PINs don't match");
  localStorage.setItem("aurachat_pin",p);
  closeModal("chatLockModal");showToast("🔒 Chat Lock enabled");
}

// ===== LOGIN =====
let selectedRole="user";
function switchRole(role){
  selectedRole=role;
  document.querySelectorAll(".role-tab").forEach(b=>b.classList.remove("active"));
  document.querySelector(`[data-role="${role}"]`).classList.add("active");
  document.getElementById("adminFields").style.display=role==="admin"?"block":"none";
}

document.getElementById("profilePic").addEventListener("change",function(){
  const f=this.files[0];if(!f)return;
  const r=new FileReader();r.onload=e=>document.getElementById("profilePreview").src=e.target.result;
  r.readAsDataURL(f);
});

document.getElementById("submitUser").addEventListener("click",async()=>{
  const privateLoginName=document.getElementById("displayName").value.trim();
  const publicName=document.getElementById("publicDisplayName").value.trim();
  const pwd=document.getElementById("adminPassword").value.trim();

  if(!privateLoginName)return showToast("⚠️ Enter your login name");

  if(selectedRole==="admin"){
    if(pwd!=="Ali-sec")return showToast("❌ Wrong admin password!");
    isAdmin=true;
  }

  const loginMapRef=db.ref("loginMap");
  const existingSnap=await loginMapRef.child(btoa(privateLoginName)).get();

  let uniqueId, couponCode;

  if(existingSnap.exists()){
    const saved=existingSnap.val();
    uniqueId=saved.uniqueId;
    couponCode=saved.couponCode;
  } else {
    uniqueId=generateUniqueId();
    couponCode=generateCouponCode();
    await loginMapRef.child(btoa(privateLoginName)).set({uniqueId,couponCode});
    await couponsRef.child(couponCode.replace(/-/g,"_")).set(uniqueId);
  }

  const picFile=document.getElementById("profilePic").files[0];
  let photoURL=`https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(uniqueId)}`;
  if(picFile){
    photoURL=await new Promise(res=>{const r=new FileReader();r.onload=e=>res(e.target.result);r.readAsDataURL(picFile);});
  }

  const userSnap=await usersRef.child(uniqueId).get();
  let savedDisplayName=uniqueId;
  let savedPhoto=photoURL;
  if(userSnap.exists()){
    const ud=userSnap.val();
    savedDisplayName=ud.displayName||uniqueId;
    savedPhoto=ud.photoURL||photoURL;
  }

  const finalDisplayName=publicName||savedDisplayName;
  const finalPhoto=picFile?photoURL:savedPhoto;

  currentUser={
    uniqueId,
    couponCode,
    displayName:finalDisplayName,
    photoURL:finalPhoto,
    role:isAdmin?"admin":"user",
    joinedAt:userSnap.exists()?userSnap.val().joinedAt:Date.now()
  };

  await usersRef.child(uniqueId).set(currentUser);

  document.getElementById("currentUserName").textContent=finalDisplayName;
  document.getElementById("currentUserAvatar").src=finalPhoto;
  document.getElementById("myUniqueId").textContent=uniqueId;
  document.getElementById("loginScreen").style.display="none";
  document.getElementById("chatInterface").style.display="flex";

  if(isAdmin){
    document.getElementById("adminControls").style.display="flex";
    document.getElementById("dashboardNavBtn").style.display="block";
  }

  const goOnline=()=>statusRef.child(uniqueId).set({online:true,lastSeen:Date.now()});
  goOnline();setInterval(goOnline,25000);

  window.addEventListener("beforeunload",()=>{
    statusRef.child(uniqueId).set({online:false,lastSeen:Date.now()});
  });

  initEmojiPicker();initWallpaperGrid();loadUsers();loadModeration();
  showLockIfNeeded();
});

// ===== LOAD USERS (FIXED) =====
function loadUsers(){
  usersRef.on("value",snap=>{
    allUsers=[];
    snap.forEach(child=>{
      const u=child.val();
      if(u.uniqueId===currentUser.uniqueId)return; // Skip self
      // FIX: Show all users (not just admins)
      allUsers.push(u);
    });
    renderContacts();
  });
}

// ===== RENDER CONTACTS =====
function renderContacts(filter=""){
  const list=document.getElementById("users");list.innerHTML="";

  let filtered=allUsers.filter(u=>
    u.displayName.toLowerCase().includes(filter.toLowerCase())||
    u.uniqueId.toLowerCase().includes(filter.toLowerCase())
  );

  if(currentTab==="online"){
    filtered=filtered.filter(u=>{
      // Check online status
      statusRef.child(u.uniqueId).get().then(s=>{u._online=s.val()?.online||false;});
      return u._online;
    });
  }

  if(!filtered.length){
    list.innerHTML=`<div style="text-align:center;color:var(--text3);padding:20px;font-size:13px;">No contacts</div>`;
    return;
  }

  filtered.forEach(user=>{
    const li=document.createElement("div");
    li.className=`contact-item ${!currentChatIsGroup&&currentChatUser?.uniqueId===user.uniqueId?"active":""}`;
    li.id=`contact-${user.uniqueId}`;
    li.onclick=()=>openChat(user);
    
    li.innerHTML=`
      <div class="avatar-wrap">
        <img src="${user.photoURL||`https://api.dicebear.com/7.x/thumbs/svg?seed=${user.uniqueId}`}" alt=""/>
      </div>
      <div class="contact-info">
        <div class="cname">${escHtml(user.displayName)}${user.role==="admin"?" 🛡️":""}</div>
        <div class="clast" style="font-size:10px;color:var(--text3);">${user.uniqueId}</div>
      </div>`;
    list.appendChild(li);
  });
}

function filterContacts(val){renderContacts(val);}
function switchTab(tab,btn){
  currentTab=tab;
  document.querySelectorAll(".stab").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  renderContacts();
}

// ===== OPEN CHAT (FIXED) =====
function openChat(user){
  currentChatIsGroup=false;
  document.querySelectorAll(".contact-item").forEach(el=>el.classList.remove("active"));
  const li=document.getElementById(`contact-${user.uniqueId}`);
  if(li)li.classList.add("active");

  currentChatUser=user;

  document.getElementById("chatHeader").style.display="flex";
  document.getElementById("emptyState").style.display="none";
  document.getElementById("composer").style.display="flex";
  document.getElementById("chatPartnerName").textContent=user.displayName;
  document.getElementById("chatPartnerAvatar").src=user.photoURL||`https://api.dicebear.com/7.x/thumbs/svg?seed=${user.uniqueId}`;

  statusRef.child(user.uniqueId).on("value",snap=>{
    const st=snap.val()||{};
    const badge=document.getElementById("partnerOnlineBadge");
    if(st.online){badge.style.display="block";}
    else{badge.style.display="none";}
    document.getElementById("partnerStatus").textContent=st.online?"Online":"Offline";
  });

  document.getElementById("messageInput").disabled=false;
  document.getElementById("sendMessage").disabled=false;
  document.getElementById("messages").innerHTML="";
  document.getElementById("chatInterface").classList.add("mobile-chat");

  loadMessages();
  closeDropdowns();
}

// ===== CHAT ID =====
function getChatId(u1,u2){
  if(!u1||!u2)return"invalid";
  return[u1.uniqueId,u2.uniqueId].sort().join("__");
}
function getChatId2(id1,id2){return[id1,id2].sort().join("__");}

// ===== LOAD MESSAGES =====
function loadMessages(){
  const chatId=getChatId(currentUser,currentChatUser);
  const container=document.getElementById("messages");
  container.innerHTML="";

  msgsRef.child(chatId).once("value",snap=>{
    snap.forEach(child=>{
      const msg={...child.val(),id:child.key};
      renderMessage(msg,chatId);
    });
    container.scrollTop=container.scrollHeight;

    msgsRef.child(chatId).on("child_added",child=>{
      const msg={...child.val(),id:child.key};
      if(document.getElementById(`bubble-${msg.id}`))return;
      renderMessage(msg,chatId);
      container.scrollTop=container.scrollHeight;
    });
  });
}

// ===== RENDER MESSAGE =====
function renderMessage(msg,chatId){
  if(msg.deleted){return;}
  const container=document.getElementById("messages");
  const isOut=msg.sender===currentUser.uniqueId;
  const wrap=document.createElement("div");
  wrap.className=`msg-wrap ${isOut?"out":"in"}`;
  wrap.dataset.id=msg.id;

  const bubble=document.createElement("div");
  bubble.className="bubble";
  bubble.id=`bubble-${msg.id}`;

  if(msg.voice){
    bubble.appendChild(buildVoicePlayer(msg.voice));
  } else if(msg.image){
    const img=document.createElement("img");
    img.src=msg.image;
    img.onclick=()=>openImageFull(msg.image);
    bubble.appendChild(img);
  } else {
    bubble.innerHTML=`<span>${escHtml(msg.text||"")}</span>`;
  }

  wrap.appendChild(bubble);

  const meta=document.createElement("div");
  meta.className="msg-meta";
  meta.innerHTML=`<span class="time">${formatTime(msg.timestamp)}</span>`;
  if(isOut)meta.innerHTML+=`<span class="ticks">✓✓</span>`;
  wrap.appendChild(meta);

  container.appendChild(wrap);
}

// ===== VOICE PLAYER =====
function buildVoicePlayer(dataUrl){
  const wrap=document.createElement("div");
  wrap.className="voice-msg";
  wrap.innerHTML=`<button class="voice-play-btn" onclick="playVoice(this,'${dataUrl}')"><i class="fas fa-play"></i></button>
    <span style="color:var(--text2);font-size:13px;">Voice message</span>`;
  return wrap;
}
function playVoice(btn,dataUrl){
  const audio=new Audio(dataUrl);
  btn.innerHTML=`<i class="fas fa-pause"></i>`;
  audio.play();
  audio.onended=()=>btn.innerHTML=`<i class="fas fa-play"></i>`;
}

// ===== VOICE RECORDING (FIXED) =====
let mediaRecorder=null, audioChunks=[];
function startVoiceRecord(e){
  if(e)e.preventDefault();
  navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
    mediaRecorder=new MediaRecorder(stream);
    audioChunks=[];
    mediaRecorder.ondataavailable=e=>audioChunks.push(e.data);
    mediaRecorder.start();
    document.getElementById("voiceRecordBtn").classList.add("recording");
    document.getElementById("voiceRecordingBar").style.display="flex";
    document.getElementById("composer").style.display="none";
  }).catch(()=>showToast("Mic not available"));
}

function stopVoiceRecord(){
  if(!mediaRecorder||mediaRecorder.state==="inactive")return;
  mediaRecorder.stop();
  document.getElementById("voiceRecordBtn").classList.remove("recording");
  document.getElementById("voiceRecordingBar").style.display="none";
  document.getElementById("composer").style.display="flex"; // FIXED: Show composer again
  
  mediaRecorder.onstop=()=>{
    const blob=new Blob(audioChunks,{type:"audio/webm"});
    const reader=new FileReader();
    reader.onload=e=>{
      if(!currentChatUser)return;
      const chatId=getChatId(currentUser,currentChatUser);
      const payload={voice:e.target.result,sender:currentUser.uniqueId,senderDisplay:currentUser.displayName,timestamp:Date.now()};
      msgsRef.child(chatId).push(payload);
      showToast("🎤 Voice message sent!");
    };
    reader.readAsDataURL(blob);
  };
}

function cancelVoiceRecord(){
  if(mediaRecorder)mediaRecorder.stop();
  document.getElementById("voiceRecordBtn").classList.remove("recording");
  document.getElementById("voiceRecordingBar").style.display="none";
  document.getElementById("composer").style.display="flex";
  audioChunks=[];
}

// ===== SEND MESSAGE =====
document.getElementById("sendMessage").addEventListener("click",sendMsg);
document.getElementById("messageInput").addEventListener("keydown",e=>{
  if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}
});

function sendMsg(){
  const text=document.getElementById("messageInput").value.trim();
  if(!text||!currentChatUser)return;
  const chatId=getChatId(currentUser,currentChatUser);
  const payload={text,sender:currentUser.uniqueId,senderDisplay:currentUser.displayName,timestamp:Date.now()};
  msgsRef.child(chatId).push(payload);
  document.getElementById("messageInput").value="";
}

// ===== IMAGE =====
function triggerImageUpload(){document.getElementById("imageUpload").click();}
function sendImageMessage(input){
  const file=input.files[0];if(!file||!currentChatUser)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const chatId=getChatId(currentUser,currentChatUser);
    msgsRef.child(chatId).push({image:e.target.result,sender:currentUser.uniqueId,timestamp:Date.now()});
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

// ===== COUPON CODE =====
function openCouponSearch(){
  document.getElementById("couponModal").style.display="flex";
  setTimeout(()=>document.getElementById("couponInput").focus(),200);
}

async function findByCoupon(){
  const raw=document.getElementById("couponInput").value.trim().toUpperCase().replace(/\s/g,"");
  if(!raw)return showToast("Enter a coupon code");
  const formatted=raw.replace(/-/g,"_");
  const snap=await couponsRef.child(formatted).get();
  if(!snap.exists())return showToast("❌ Invalid coupon code");
  const targetId=snap.val();
  if(targetId===currentUser.uniqueId)return showToast("That's your own code!");
  const userSnap=await usersRef.child(targetId).get();
  if(!userSnap.exists())return showToast("User not found");
  const user=userSnap.val();
  closeModal("couponModal");
  document.getElementById("couponInput").value="";
  openChat(user);
}

function showMyCoupon(){
  document.getElementById("myCouponDisplay").textContent=currentUser.couponCode;
  document.getElementById("myCouponModal").style.display="flex";
}

function copyCoupon(){
  navigator.clipboard.writeText(currentUser.couponCode).then(()=>showToast("✅ Copied!"));
}

// ===== BLOCK USER =====
function blockUser(){
  if(!currentChatUser)return;
  if(!confirm(`Block ${currentChatUser.displayName}?`))return;
  showToast(`🚫 Blocked ${currentChatUser.displayName}`);
  document.getElementById("chatHeader").style.display="none";
  document.getElementById("emptyState").style.display="flex";
  currentChatUser=null;
}

// ===== PROFILE =====
function viewProfile(){
  if(!currentChatUser)return;
  document.getElementById("modalAvatar").src=currentChatUser.photoURL||`https://api.dicebear.com/7.x/thumbs/svg?seed=${currentChatUser.uniqueId}`;
  document.getElementById("modalName").textContent=currentChatUser.displayName;
  document.getElementById("modalUniqueId").textContent=currentChatUser.uniqueId;
  document.getElementById("profileModal").style.display="flex";
}

function openMyProfile(){
  document.getElementById("modalAvatar").src=currentUser.photoURL;
  document.getElementById("modalName").textContent=currentUser.displayName;
  document.getElementById("modalUniqueId").textContent=currentUser.uniqueId;
  document.getElementById("profileModal").style.display="flex";
}

// ===== WALLPAPER =====
function initWallpaperGrid(){
  const grid=document.getElementById("wallpaperGrid");grid.innerHTML="";
  WALLPAPERS.forEach(wp=>{
    const div=document.createElement("div");
    div.className="wp-option";
    div.style.background=wp.value;
    div.textContent=wp.label;
    div.onclick=()=>applyWallpaper(wp.value);
    grid.appendChild(div);
  });
}

function openWallpaperPicker(){document.getElementById("wallpaperModal").style.display="flex";}
function applyWallpaper(value){
  const area=document.getElementById("messages");
  area.style.background=value;
  closeModal("wallpaperModal");
  showToast("🎨 Wallpaper applied");
}
function clearWallpaper(){
  const area=document.getElementById("messages");
  area.style.background="var(--bg)";
  closeModal("wallpaperModal");
}

// ===== STATUS =====
function setMyStatus(){document.getElementById("statusModal").style.display="flex";}
function saveStatus(status){
  statusRef.child(currentUser.uniqueId).update({status});
  closeModal("statusModal");
  showToast("✅ Status updated");
}

// ===== CHAT ACTIONS =====
function toggleMute(){showToast("🔕 Muted");}
function clearChat(){
  if(!currentChatUser)return;
  if(!confirm("Clear entire chat?"))return;
  const chatId=getChatId(currentUser,currentChatUser);
  msgsRef.child(chatId).remove();
  showToast("🧹 Cleared");
}

function exportChat(){
  if(!currentChatUser)return;
  const msgs=document.querySelectorAll(".msg-wrap");
  let text=`AuraChat Export\n${"─".repeat(40)}\n\n`;
  msgs.forEach(w=>{
    const isOut=w.classList.contains("out");
    const who=isOut?currentUser.displayName:currentChatUser.displayName;
    const time=w.querySelector(".time")?.textContent||"";
    const msg=w.querySelector(".bubble span")?.textContent||"[Media]";
    text+=`[${time}] ${who}: ${msg}\n`;
  });
  const blob=new Blob([text],{type:"text/plain"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=`aurachat-export.txt`;a.click();
  URL.revokeObjectURL(url);
  showToast("📥 Exported");
}

// ===== NOTIFICATIONS =====
function openNotifSettings(){document.getElementById("notifModal").style.display="flex";}
function saveNotifPref(){showToast("✅ Saved");}

// ===== EDIT NAME =====
document.getElementById("editNameTrigger").addEventListener("click",()=>{
  const box=document.getElementById("editNameBox");
  box.style.display=box.style.display==="flex"?"none":"flex";
  if(box.style.display==="flex")setTimeout(()=>document.getElementById("newNameInput").focus(),100);
});

document.getElementById("saveNameBtn").addEventListener("click",async()=>{
  const newName=document.getElementById("newNameInput").value.trim();
  if(!newName)return showToast("Enter a display name");
  currentUser.displayName=newName;
  await usersRef.child(currentUser.uniqueId).update({displayName:newName});
  document.getElementById("currentUserName").textContent=newName;
  document.getElementById("editNameBox").style.display="none";
  showToast("✅ Display name updated");
});

// ===== DARK MODE =====
document.getElementById("toggleDark").addEventListener("click",()=>{
  document.body.classList.toggle("light-mode");
  const isLight=document.body.classList.contains("light-mode");
  document.getElementById("toggleDark").innerHTML=isLight?`<i class="fas fa-moon"></i>`:`<i class="fas fa-sun"></i>`;
});

// ===== DROPDOWN =====
document.getElementById("settingsBtn").addEventListener("click",e=>{
  e.stopPropagation();
  document.getElementById("settingsMenu").classList.toggle("open");
});
document.addEventListener("click",closeDropdowns);
function closeDropdowns(){
  document.querySelectorAll(".dropdown-menu").forEach(m=>m.classList.remove("open"));
}

// ===== MOBILE BACK =====
document.getElementById("backToContactsBtn").addEventListener("click",()=>{
  document.getElementById("chatInterface").classList.remove("mobile-chat");
});

// ===== EMOJI =====
function initEmojiPicker(){
  const grid=document.getElementById("emojiGrid");
  EMOJIS.forEach(e=>{
    const span=document.createElement("span");
    span.textContent=e;
    span.onclick=()=>{
      document.getElementById("messageInput").value+=e;
    };
    grid.appendChild(span);
  });
}
function toggleEmojiPicker(){
  document.getElementById("emojiPicker").classList.toggle("open");
}
document.addEventListener("click",e=>{
  if(!e.target.closest(".emoji-btn"))
    document.getElementById("emojiPicker").classList.remove("open");
});

// ===== LOGOUT =====
function logout(){
  if(!confirm("Logout?"))return;
  statusRef.child(currentUser.uniqueId).set({online:false,lastSeen:Date.now()});
  location.reload();
}

// ===== ADMIN PANEL =====
function openAdminDashboard(){
  document.getElementById("adminDashboard").style.display="flex";
  loadDashboardStats();
}

function switchDashTab(tab,btn){
  document.querySelectorAll(".dash-tab-content").forEach(t=>t.style.display="none");
  document.getElementById(tab+"-tab").style.display="block";
  document.querySelectorAll(".dash-tab").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
}

function loadDashboardStats(){
  usersRef.once("value",snap=>{
    let total=0,online=0;
    const users=[];
    snap.forEach(child=>{
      total++;
      users.push(child.val());
    });

    statusRef.once("value",statSnap=>{
      statSnap.forEach(child=>{
        if(child.val().online)online++;
      });

      msgsRef.once("value",msgSnap=>{
        let totalMsgs=0;
        msgSnap.forEach(chat=>{
          chat.forEach(()=>totalMsgs++);
        });

        document.getElementById("dashboardStats").innerHTML=`
          <div class="stat-card">
            <div class="stat-num">${total}</div>
            <div class="stat-label">Total Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-num" style="color:var(--accent2)">${online}</div>
            <div class="stat-label">Online Now</div>
          </div>
          <div class="stat-card">
            <div class="stat-num" style="color:var(--accent)">${totalMsgs}</div>
            <div class="stat-label">Messages</div>
          </div>`;

        const ul=document.getElementById("dashboardUsers");
        ul.innerHTML="";
        users.forEach(u=>{
          const row=document.createElement("div");
          row.className="dash-user-row";
          row.innerHTML=`<img src="${u.photoURL||`https://api.dicebear.com/7.x/thumbs/svg?seed=${u.uniqueId}`}"/>
            <div class="dash-user-info">
              <div class="dname">${escHtml(u.displayName)}</div>
              <div class="drole">${u.uniqueId}</div>
            </div>
            <div class="dash-user-actions">
              <button class="dash-msg-btn" onclick="selectModUser('${u.uniqueId}','${u.displayName}')">⚙️</button>
            </div>`;
          ul.appendChild(row);
        });
      });
    });
  });
}

// ===== MODERATION SYSTEM =====
function loadModeration(){
  moderationRef.on("value",snap=>{
    moderationData={};
    snap.forEach(child=>{
      moderationData[child.key]=child.val();
    });
  });
}

function selectModUser(userId,displayName){
  selectedModUser={id:userId,name:displayName};
  document.getElementById("selectedUserMod").style.display="block";
  document.getElementById("selectedModUser").textContent=displayName;
  document.getElementById("moderation-tab").scrollIntoView({behavior:"smooth"});
}

function modAction(action){
  if(!selectedModUser)return showToast("Select a user first");
  
  const userId=selectedModUser.id;
  const reason=prompt(`${action.toUpperCase()} reason:`) || "No reason provided";
  
  const modData={
    action,
    userId,
    by:currentUser.uniqueId,
    timestamp:Date.now(),
    reason
  };

  // Log the action
  actionLogsRef.push(modData);

  // Apply moderation
  moderationRef.child(userId).set({
    status:action, // warn, mute, suspend, ban
    reason,
    until:action==="ban"?0:(Date.now()+7*24*60*60*1000) // 7 days for mute/suspend
  });

  showToast(`✅ User ${action}ed`);
  loadDashboardStats();
  selectedModUser=null;
  document.getElementById("selectedUserMod").style.display="none";
}

function openModeration(){
  document.getElementById("moderationModal").style.display="flex";
}

// ===== MODAL HELPERS =====
function closeModal(id){document.getElementById(id).style.display="none";}
document.querySelectorAll(".modal-overlay").forEach(o=>{
  o.addEventListener("click",e=>{
    if(e.target===o)o.style.display="none";
  });
});

// ===== TOAST =====
let toastTimeout;
function showToast(msg){
  const t=document.getElementById("toast");
  t.textContent=msg;
  t.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout=setTimeout(()=>t.classList.remove("show"),3000);
}

// ===== UTILS =====
function formatTime(ts){
  return new Date(ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
}
function escHtml(str){
  if(!str)return"";
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
