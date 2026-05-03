// ============================================
//  AURACHAT v3 — Anonymous IDs + Coupon Codes
//              + Groups + Mobile Keyboard Fix
// ============================================

// ===== FIREBASE =====
const firebaseConfig={
  apiKey:"AIzaSyBEnL-jzxZ89rT9vdqHHNcgjSrFXtGz6ho",
  authDomain:"whats-app-4f3d7.firebaseapp.com",
  projectId:"whats-app-4f3d7",
  databaseURL:"https://whats-app-4f3d7-default-rtdb.firebaseio.com"
};
firebase.initializeApp(firebaseConfig);
const db=firebase.database();
const usersRef=db.ref("users");       // keyed by uniqueId
const msgsRef=db.ref("messages");
const statusRef=db.ref("status");
const typingRef=db.ref("typingStatus");
const reactRef=db.ref("reactions");
const storiesRef=db.ref("stories");
const callsRef=db.ref("calls");
const groupsRef=db.ref("groups");
const couponsRef=db.ref("coupons");   // coupon -> uniqueId mapping

// ===== STATE =====
let currentUser=null;       // full user object
let currentChatUser=null;   // user object OR group object
let currentChatIsGroup=false;
let isAdmin=false, isMuted=false;
let typingTimeout=null, replyTo=null;
let currentTab="chats", allUsers=[], allGroups=[];
let unreadCounts={};
let searchMatches=[], searchIdx=-1;
let activeListeners={};
let destructTime=0;
let editingMsgId=null, editingChatId=null;
let forwardMsgText=null;
let storyBgColor="#1E1E35";
let currentStories=[], currentStoryIdx=0, storyAutoTimer=null;
let destructTimers={};
let mediaRecorder=null, audioChunks=[], voiceRecTimer=null, voiceRecSeconds=0;
let localStream=null, callTimerInterval=null, callSeconds=0;
let chatLockPin=localStorage.getItem("aurachat_pin")||null;
let notifPrefs={messages:true,sound:true,stories:true};
let blockedUsers=JSON.parse(localStorage.getItem("aurachat_blocked")||"[]");
let selectedGroupMembers=new Set();
let currentGroupId=null;   // when viewing group info

const EMOJIS=["😀","😂","🥰","😍","🤩","😎","🥺","😭","😤","🤔","🙄","😴","🤗","😇","🤯","🥳",
  "👍","👎","❤️","🔥","💯","🎉","✨","⭐","💫","🌟","💥","🎯","🚀","🏆","🎁","🎊",
  "😋","😛","🤣","😆","😅","😔","😟","😕","☹️","😣","😖","😫","😩","🥱","💀","🫶",
  "🙌","👏","🤝","💪","🫂","✌️","🤞","🤙","👋","🫡","💅","🧠","👀","🎵","🎶","💔"];

const WALLPAPERS=[
  {value:"linear-gradient(135deg,#0D0D1A,#1A1A2E)",label:"🌌"},
  {value:"linear-gradient(135deg,#0f2027,#203a43,#2c5364)",label:"🌊"},
  {value:"linear-gradient(135deg,#1a0533,#2d1b69,#11998e)",label:"🔮"},
  {value:"linear-gradient(135deg,#f093fb,#f5576c)",label:"🌸"},
  {value:"linear-gradient(135deg,#4facfe,#00f2fe)",label:"💎"},
  {value:"linear-gradient(135deg,#43e97b,#38f9d7)",label:"🍃"},
  {value:"linear-gradient(135deg,#fa709a,#fee140)",label:"🌅"},
  {value:"linear-gradient(135deg,#30cfd0,#667eea)",label:"🎆"},
  {value:"#0D0D1A",label:"⬛"},{value:"#FAFAFA",label:"⬜"},
  {value:"#1a1a2e",label:"🟦"},{value:"#2d1b69",label:"🟣"},
];
const STORY_BG=["#6C63FF","#FF6B9D","#00D4AA","#FF9500","#FF3B30","#34C759","#007AFF","#5856D6","#111","#fff"];

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
  loadNotifPrefs();
});

// ===== MOBILE KEYBOARD FIX =====
// Scroll to bottom when keyboard opens (input focused)
function fixKeyboardScroll(){
  const inp=document.getElementById("messageInput");
  if(!inp)return;
  inp.addEventListener("focus",()=>{
    // Small delay to let keyboard open fully
    setTimeout(()=>{
      inp.scrollIntoView({block:"nearest"});
      const msgs=document.getElementById("messages");
      if(msgs) msgs.scrollTop=msgs.scrollHeight;
    },300);
  });
}

// Visual viewport resize handler — keeps composer above keyboard
if(window.visualViewport){
  window.visualViewport.addEventListener("resize",()=>{
    const composer=document.getElementById("composer");
    const voiceBar=document.getElementById("voiceRecordingBar");
    const h=window.visualViewport.height;
    // On mobile when keyboard opens, viewport shrinks
    // The flex layout handles this automatically with our CSS,
    // but we scroll messages to bottom
    const msgs=document.getElementById("messages");
    if(msgs&&document.activeElement===document.getElementById("messageInput")){
      setTimeout(()=>msgs.scrollTop=msgs.scrollHeight,100);
    }
  });
}

// ===== LOCK SCREEN =====
let pinBuffer="";
function showLockIfNeeded(){
  if(chatLockPin){document.getElementById("lockScreen").style.display="flex";pinBuffer="";updatePinDots();}
}
function pinInput(v){
  if(v==="C"){pinBuffer="";updatePinDots();document.getElementById("pinError").textContent="";return;}
  if(v==="DEL"){pinBuffer=pinBuffer.slice(0,-1);updatePinDots();return;}
  if(pinBuffer.length>=4)return;
  pinBuffer+=String(v);updatePinDots();
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
    s.classList.toggle("filled",i<pinBuffer.length);s.style.background="";
  });
}
function openChatLockSetup(){document.getElementById("chatLockModal").style.display="flex";closeDropdowns();}
function saveChatLock(){
  const p=document.getElementById("newPinInput").value.trim();
  const c=document.getElementById("confirmPinInput").value.trim();
  if(p.length!==4||!/^\d{4}$/.test(p))return showToast("Enter a 4-digit PIN");
  if(p!==c)return showToast("PINs don't match");
  chatLockPin=p;localStorage.setItem("aurachat_pin",p);
  closeModal("chatLockModal");showToast("🔒 Chat Lock enabled");
}
function removeChatLock(){
  chatLockPin=null;localStorage.removeItem("aurachat_pin");
  closeModal("chatLockModal");showToast("🔓 Lock removed");
}

// ===== ROLE SWITCH =====
let selectedRole="user";
function switchRole(role){
  selectedRole=role;
  document.querySelectorAll(".role-tab").forEach(b=>b.classList.remove("active"));
  document.querySelector(`[data-role="${role}"]`).classList.add("active");
  document.getElementById("adminFields").style.display=role==="admin"?"block":"none";
}

// Profile photo preview
document.getElementById("profilePic").addEventListener("change",function(){
  const f=this.files[0];if(!f)return;
  const r=new FileReader();r.onload=e=>document.getElementById("profilePreview").src=e.target.result;
  r.readAsDataURL(f);
});

// ===== LOGIN =====
document.getElementById("submitUser").addEventListener("click",async()=>{
  const privateLoginName=document.getElementById("displayName").value.trim();
  const publicName=document.getElementById("publicDisplayName").value.trim();
  const pwd=document.getElementById("adminPassword").value.trim();

  if(!privateLoginName)return showToast("⚠️ Enter your login name");

  if(selectedRole==="admin"){
    if(pwd!=="Ali-sec")return showToast("❌ Wrong admin password!");
    isAdmin=true;
  }

  // Check if this private login name already has an account (return user)
  // We store a mapping: privateLoginName -> uniqueId in a separate ref
  const loginMapRef=db.ref("loginMap");
  const existingSnap=await loginMapRef.child(btoa(privateLoginName)).get();

  let uniqueId, couponCode;

  if(existingSnap.exists()){
    // Returning user — get their existing uniqueId
    const saved=existingSnap.val();
    uniqueId=saved.uniqueId;
    couponCode=saved.couponCode;
  } else {
    // New user — generate fresh anonymous identity
    uniqueId=generateUniqueId();
    couponCode=generateCouponCode();
    await loginMapRef.child(btoa(privateLoginName)).set({uniqueId,couponCode});
    // Register coupon -> uniqueId mapping
    await couponsRef.child(couponCode.replace(/-/g,"_")).set(uniqueId);
  }

  // Display name: public name > saved display name > uniqueId
  const picFile=document.getElementById("profilePic").files[0];
  let photoURL=`https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(uniqueId)}`;
  if(picFile){
    photoURL=await new Promise(res=>{const r=new FileReader();r.onload=e=>res(e.target.result);r.readAsDataURL(picFile);});
  }

  // Fetch existing user data (may have saved displayName)
  const userSnap=await usersRef.child(uniqueId).get();
  let savedDisplayName=uniqueId;
  let savedPhoto=photoURL;
  if(userSnap.exists()){
    const ud=userSnap.val();
    savedDisplayName=ud.displayName||uniqueId;
    savedPhoto=ud.photoURL||photoURL;
  }

  // If user entered a new public name, use it
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

  // Update UI
  document.getElementById("currentUserName").textContent=finalDisplayName;
  document.getElementById("currentUserAvatar").src=finalPhoto;
  document.getElementById("myUniqueId").textContent=uniqueId;
  document.getElementById("myStatusText").textContent="🟢 Available";
  document.getElementById("loginScreen").style.display="none";
  document.getElementById("chatInterface").style.display="flex";

  if(isAdmin){
    document.getElementById("adminControls").style.display="flex";
    document.getElementById("dashboardNavBtn").style.display="block";
  }

  // Online presence
  const goOnline=()=>statusRef.child(uniqueId).set({online:true,lastSeen:Date.now(),status:"🟢 Available"});
  goOnline();setInterval(goOnline,25000);
  window.addEventListener("beforeunload",()=>{
    statusRef.child(uniqueId).set({online:false,lastSeen:Date.now()});
    typingRef.child(uniqueId).remove();
  });

  initEmojiPicker();initWallpaperGrid();initStoryBgPicker();
  loadUsers();loadGroups();loadStories();listenCalls();
  showLockIfNeeded();
  requestPushPermissionSilent();
  fixKeyboardScroll();
});

// ===== COUPON CODE SYSTEM =====
function openCouponSearch(){
  document.getElementById("couponModal").style.display="flex";
  setTimeout(()=>document.getElementById("couponInput").focus(),200);
}

async function findByCoupon(){
  const raw=document.getElementById("couponInput").value.trim().toUpperCase().replace(/\s/g,"");
  if(!raw)return showToast("Enter a coupon code");

  // Format: XXXX-XXXX or with spaces
  const formatted=raw.replace(/-/g,"_");
  const snap=await couponsRef.child(formatted).get();

  if(!snap.exists())return showToast("❌ Invalid coupon code");

  const targetId=snap.val();
  if(targetId===currentUser.uniqueId)return showToast("That's your own code!");

  // Check if blocked
  if(blockedUsers.includes(targetId))return showToast("This user is blocked");

  const userSnap=await usersRef.child(targetId).get();
  if(!userSnap.exists())return showToast("User not found");

  const user=userSnap.val();
  closeModal("couponModal");
  document.getElementById("couponInput").value="";
  showToast(`✅ Connected with ${user.displayName}!`);
  openChat(user);
}

function showMyCoupon(){
  document.getElementById("myCouponDisplay").textContent=currentUser.couponCode;
  document.getElementById("myCouponModal").style.display="flex";
  closeDropdowns();
}

function copyCoupon(){
  navigator.clipboard.writeText(currentUser.couponCode).then(()=>showToast("✅ Coupon code copied!"));
}

// ===== LOAD USERS =====
function loadUsers(){
  usersRef.on("value",snap=>{
    allUsers=[];
    snap.forEach(child=>{
      const u=child.val();
      if(u.uniqueId===currentUser.uniqueId)return;
      if(!isAdmin&&u.role!=="admin")return;
      if(blockedUsers.includes(u.uniqueId))return;
      allUsers.push(u);
    });

    const loginTime=Date.now();
    allUsers.forEach(u=>{
      const chatId=getChatId2(currentUser.uniqueId,u.uniqueId);
      // Load existing unread count
      msgsRef.child(chatId).orderByChild("read").equalTo(false).once("value",uSnap=>{
        let count=0;
        uSnap.forEach(m=>{if(m.val().sender!==currentUser.uniqueId)count++;});
        if(count>0){unreadCounts[u.uniqueId]=count;renderContacts();}
      });
      // Listen for new messages
      msgsRef.child(chatId).orderByChild("timestamp").startAt(loginTime).on("child_added",mSnap=>{
        const msg=mSnap.val();
        if(!msg||msg.sender===currentUser.uniqueId||isMuted)return;
        if(!currentChatUser||currentChatUser.uniqueId!==u.uniqueId||currentChatIsGroup){
          unreadCounts[u.uniqueId]=(unreadCounts[u.uniqueId]||0)+1;
          renderContacts();playNotifSound();
          showToast(`💬 ${u.displayName}: ${(msg.text||"📷 Photo").slice(0,35)}`);
        }
      });
    });
    renderContacts();
  });
}

// ===== LOAD GROUPS =====
function loadGroups(){
  groupsRef.on("value",snap=>{
    allGroups=[];
    snap.forEach(child=>{
      const g=child.val();
      // Only show groups where current user is a member
      if(g.members&&g.members[currentUser.uniqueId]){
        allGroups.push({...g,id:child.key});
      }
    });
    if(currentTab==="groups")renderContacts();
  });
}

// ===== RENDER CONTACTS =====
function renderContacts(filter=""){
  const list=document.getElementById("users");list.innerHTML="";

  if(currentTab==="groups"){
    // Show groups
    let groups=allGroups.filter(g=>g.name.toLowerCase().includes(filter.toLowerCase()));
    if(!groups.length){
      list.innerHTML=`<div style="text-align:center;color:var(--text3);padding:20px;font-size:13px;">${isAdmin?"No groups yet. Create one!":"No groups available."}</div>`;
      return;
    }
    groups.forEach(g=>{
      const li=document.createElement("div");
      li.className=`contact-item ${!currentChatIsGroup&&false?"":""}`;
      li.id=`group-${g.id}`;
      li.onclick=()=>openGroupChat(g);
      const memberCount=Object.keys(g.members||{}).length;
      const unread=unreadCounts[`group_${g.id}`]||0;
      li.innerHTML=`
        <div class="group-avatar">👥</div>
        <div class="contact-info">
          <div class="cname">${escHtml(g.name)} <span class="group-badge">Group</span></div>
          <div class="clast">${memberCount} members</div>
        </div>
        <div class="contact-meta">
          ${unread>0?`<span class="unread-badge">${unread}</span>`:""}
        </div>`;
      list.appendChild(li);
    });
    return;
  }

  // Show direct chats
  let filtered=allUsers.filter(u=>
    u.displayName.toLowerCase().includes(filter.toLowerCase())||
    u.uniqueId.toLowerCase().includes(filter.toLowerCase())
  );

  if(currentTab==="online") filtered=filtered.filter(u=>u._online);

  if(!filtered.length){
    list.innerHTML=`<div style="text-align:center;color:var(--text3);padding:20px;font-size:13px;">No contacts found</div>`;
    return;
  }

  filtered.forEach(user=>{
    statusRef.child(user.uniqueId).get().then(sSnap=>{
      const st=sSnap.val()||{};
      user._online=!!st.online;
      const chatId=getChatId2(currentUser.uniqueId,user.uniqueId);
      msgsRef.child(chatId).limitToLast(1).get().then(mSnap=>{
        let lastMsg="",lastTime="";
        mSnap.forEach(m=>{const v=m.val();lastMsg=v.image?"📷 Photo":v.voice?"🎤 Voice":v.text||"";lastTime=formatTime(v.timestamp);});
        const li=document.createElement("div");
        li.className=`contact-item ${!currentChatIsGroup&&currentChatUser?.uniqueId===user.uniqueId?"active":""}`;
        li.id=`contact-${user.uniqueId}`;
        li.onclick=()=>openChat(user);
        const unread=unreadCounts[user.uniqueId]||0;
        li.innerHTML=`
          <div class="avatar-wrap">
            <img src="${user.photoURL||`https://api.dicebear.com/7.x/thumbs/svg?seed=${user.uniqueId}`}" alt=""/>
            ${user._online?`<span class="online-badge"></span>`:""}
          </div>
          <div class="contact-info">
            <div class="cname">${escHtml(user.displayName)}${user.role==="admin"?" 🛡️":""}</div>
            <div class="clast" style="font-size:10px;color:var(--text3);">${user.uniqueId}</div>
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

// ===== OPEN DIRECT CHAT =====
function openChat(user){
  currentChatIsGroup=false;
  document.querySelectorAll(".contact-item").forEach(el=>el.classList.remove("active"));
  const li=document.getElementById(`contact-${user.uniqueId}`);
  if(li)li.classList.add("active");

  currentChatUser=user;
  unreadCounts[user.uniqueId]=0;
  renderContacts();

  document.getElementById("chatHeader").style.display="flex";
  document.getElementById("emptyState").style.display="none";
  document.getElementById("composer").style.display="flex";
  document.getElementById("chatPartnerName").textContent=user.displayName;
  document.getElementById("chatPartnerAvatar").src=user.photoURL||`https://api.dicebear.com/7.x/thumbs/svg?seed=${user.uniqueId}`;

  // Status listener
  statusRef.child(user.uniqueId).on("value",snap=>{
    const st=snap.val()||{};
    const badge=document.getElementById("partnerOnlineBadge");
    if(st.online){document.getElementById("partnerStatus").textContent=st.status||"Online";badge.style.display="block";}
    else{
      const mins=st.lastSeen?Math.floor((Date.now()-st.lastSeen)/60000):null;
      document.getElementById("partnerStatus").textContent=mins!==null?(mins<1?"Last seen just now":`Last seen ${mins}m ago`):"Offline";
      badge.style.display="none";
    }
  });

  // Typing listener
  typingRef.child(user.uniqueId).on("value",snap=>{
    const t=snap.val();
    if(t&&t.to===currentUser.uniqueId&&t.isTyping)showTypingIndicator();
    else hideTypingIndicator();
  });

  document.getElementById("messageInput").disabled=false;
  document.getElementById("sendMessage").disabled=false;
  document.getElementById("messages").innerHTML="";
  document.getElementById("chatInterface").classList.add("mobile-chat");
  updateDestructIndicator();

  if(activeListeners.messages){
    msgsRef.child(activeListeners.chatId).off("child_added",activeListeners.messages);
  }
  loadMessages();
  closeSearch();cancelReply();cancelForward();
}

// ===== OPEN GROUP CHAT =====
function openGroupChat(group){
  currentChatIsGroup=true;
  currentChatUser=group;
  unreadCounts[`group_${group.id}`]=0;

  document.querySelectorAll(".contact-item").forEach(el=>el.classList.remove("active"));
  const li=document.getElementById(`group-${group.id}`);
  if(li)li.classList.add("active");

  document.getElementById("chatHeader").style.display="flex";
  document.getElementById("emptyState").style.display="none";
  document.getElementById("composer").style.display="flex";
  document.getElementById("chatPartnerName").textContent=`👥 ${group.name}`;
  document.getElementById("chatPartnerAvatar").src=`https://api.dicebear.com/7.x/shapes/svg?seed=${group.id}`;
  document.getElementById("partnerStatus").textContent=`${Object.keys(group.members||{}).length} members`;
  document.getElementById("partnerOnlineBadge").style.display="none";

  document.getElementById("messageInput").disabled=false;
  document.getElementById("sendMessage").disabled=false;
  document.getElementById("messages").innerHTML="";
  document.getElementById("chatInterface").classList.add("mobile-chat");

  if(activeListeners.messages){
    msgsRef.child(activeListeners.chatId).off("child_added",activeListeners.messages);
  }
  loadGroupMessages(group.id);
  closeSearch();cancelReply();cancelForward();
}

// ===== CHAT ID =====
function getChatId(u1,u2){
  if(!u1||!u2)return"invalid";
  return[u1.uniqueId,u2.uniqueId].sort().join("__");
}
function getChatId2(id1,id2){return[id1,id2].sort().join("__");}

// ===== LOAD DIRECT MESSAGES =====
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
        const div=document.createElement("div");div.className="date-divider";
        div.innerHTML=`<span>${formatDate(msg.timestamp)}</span>`;
        container.appendChild(div);
      }
      if(msg.sender!==currentUser.uniqueId&&!msg.read)
        msgsRef.child(chatId).child(child.key).update({read:true});
      renderMessage(msg,chatId,false);
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
          const div=document.createElement("div");div.className="date-divider";
          div.innerHTML=`<span>${formatDate(msg.timestamp)}</span>`;
          container.appendChild(div);
        }
        if(msg.sender!==currentUser.uniqueId&&!msg.read)
          msgsRef.child(chatId).child(child.key).update({read:true});
        renderMessage(msg,chatId,false);
        container.scrollTop=container.scrollHeight;
        renderContacts();
        if(msg.destructAfter&&msg.sender===currentUser.uniqueId)
          scheduleDestruct(chatId,child.key,msg.destructAfter);
      });
    activeListeners.messages=handler;
  });
}

// ===== LOAD GROUP MESSAGES =====
function loadGroupMessages(groupId){
  const chatId=`group__${groupId}`;
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
        const div=document.createElement("div");div.className="date-divider";
        div.innerHTML=`<span>${formatDate(msg.timestamp)}</span>`;
        container.appendChild(div);
      }
      renderMessage(msg,chatId,true);
    });
    container.scrollTop=container.scrollHeight;

    const lastTs=Date.now();
    msgsRef.child(chatId).orderByChild("timestamp").startAt(lastTs)
      .on("child_added",child=>{
        const msg={...child.val(),id:child.key};
        if(document.getElementById(`bubble-${msg.id}`))return;
        renderMessage(msg,chatId,true);
        container.scrollTop=container.scrollHeight;
        if(msg.sender!==currentUser.uniqueId){
          unreadCounts[`group_${groupId}`]=(unreadCounts[`group_${groupId}`]||0)+1;
          renderContacts();
        }
      });
  });
}

// ===== RENDER MESSAGE =====
function renderMessage(msg,chatId,isGroup){
  if(msg.deleted){
    const div=document.createElement("div");div.className="sys-msg";
    div.textContent="🚫 Message deleted";
    document.getElementById("messages").appendChild(div);return;
  }
  const container=document.getElementById("messages");
  const isOut=msg.sender===currentUser.uniqueId;
  const wrap=document.createElement("div");
  wrap.className=`msg-wrap ${isOut?"out":"in"}`;
  wrap.dataset.id=msg.id;
  wrap.dataset.text=(msg.text||"").toLowerCase();

  // In group chat, show sender name/ID for incoming
  if(!isOut&&isGroup){
    const s=document.createElement("div");s.className="msg-sender";
    s.textContent=msg.senderDisplay||msg.sender;
    wrap.appendChild(s);
  }

  // Hover actions
  const actions=document.createElement("div");actions.className="msg-actions";
  let actHTML=`<button onclick="replyToMsg('${msg.id}','${escAttr(msg.text||"📷")}')" title="Reply">↩️</button>
    <button onclick="addReaction('${chatId}','${msg.id}')" title="React">😊</button>
    <button onclick="forwardMsg('${escAttr(msg.text||"")}')" title="Forward">📤</button>
    <button onclick="copyMsg('${escAttr(msg.text||"")}')" title="Copy">📋</button>`;
  if(isOut)actHTML+=`<button onclick="openEditMsg('${chatId}','${msg.id}','${escAttr(msg.text||"")}')" title="Edit">✏️</button>`;
  if(isOut||isAdmin)actHTML+=`<button onclick="deleteMsg('${chatId}','${msg.id}')" title="Delete">🗑️</button>`;
  actions.innerHTML=actHTML;wrap.appendChild(actions);

  // Bubble
  const bubble=document.createElement("div");bubble.className="bubble";bubble.id=`bubble-${msg.id}`;
  if(msg.replyTo)bubble.innerHTML+=`<div class="reply-ref">↩ ${escHtml(msg.replyTo)}</div>`;
  if(msg.voice){bubble.appendChild(buildVoicePlayer(msg.voice,msg.voiceDuration||0));}
  else if(msg.image){bubble.innerHTML+=`<img src="${msg.image}" alt="photo" onclick="openImageFull('${msg.image}')"/>`;}
  else{bubble.innerHTML+=`<span>${escHtml(msg.text||"")}</span>`;}
  if(msg.edited)bubble.innerHTML+=`<span class="edited-tag">(edited)</span>`;
  wrap.appendChild(bubble);

  // Meta
  const meta=document.createElement("div");meta.className="msg-meta";
  let metaHTML=`<span class="time">${formatTime(msg.timestamp)}</span>`;
  if(isOut&&!isGroup)metaHTML+=`<span class="ticks ${msg.read?"read":""}">✓✓</span>`;
  if(msg.destructAfter)metaHTML+=`<span class="destruct-countdown" id="dc-${msg.id}">⏱${fmtSec(msg.destructAfter)}</span>`;
  meta.innerHTML=metaHTML;wrap.appendChild(meta);

  // Reactions
  const reactDiv=document.createElement("div");reactDiv.className="reactions";reactDiv.id=`reactions-${msg.id}`;
  wrap.appendChild(reactDiv);
  container.appendChild(wrap);

  reactRef.child(chatId).child(msg.id).on("value",snap=>{
    reactDiv.innerHTML="";
    const counts={};
    snap.forEach(r=>{const v=r.val();counts[v]=(counts[v]||0)+1;});
    Object.entries(counts).forEach(([emoji,count])=>{
      const chip=document.createElement("span");chip.className="react-chip";chip.textContent=`${emoji} ${count}`;
      reactDiv.appendChild(chip);
    });
  });

  if(msg.destructAfter&&msg.sender===currentUser.uniqueId){
    const rem=msg.destructAt?Math.max(0,Math.floor((msg.destructAt-Date.now())/1000)):msg.destructAfter;
    if(rem>0)scheduleDestruct(chatId,msg.id,rem);
    else msgsRef.child(chatId).child(msg.id).update({deleted:true,text:"",image:"",voice:""});
  }
}

// ===== VOICE PLAYER =====
function buildVoicePlayer(dataUrl,duration){
  const wrap=document.createElement("div");wrap.className="voice-msg";
  const bars=Array.from({length:18},(_,i)=>`<div class="voice-wave-bar" style="height:${4+Math.random()*14}px;animation-delay:${i*0.06}s"></div>`).join("");
  wrap.innerHTML=`<button class="voice-play-btn" onclick="playVoice(this,'${dataUrl}')"><i class="fas fa-play"></i></button>
    <div class="voice-waves">${bars}</div><span class="voice-duration">${fmtSec(duration)}</span>`;
  return wrap;
}
function playVoice(btn,dataUrl){
  const audio=new Audio(dataUrl);btn.innerHTML=`<i class="fas fa-pause"></i>`;
  audio.play();audio.onended=()=>btn.innerHTML=`<i class="fas fa-play"></i>`;
}

// ===== VOICE RECORDING =====
function startVoiceRecord(e){
  if(e)e.preventDefault();
  if(!navigator.mediaDevices)return showToast("Mic not supported");
  navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
    localStream=stream;mediaRecorder=new MediaRecorder(stream);audioChunks=[];
    mediaRecorder.ondataavailable=e=>audioChunks.push(e.data);
    mediaRecorder.start();
    document.getElementById("voiceRecordBtn").classList.add("recording");
    document.getElementById("voiceRecordingBar").style.display="flex";
    document.getElementById("composer").style.display="none";
    voiceRecSeconds=0;
    voiceRecTimer=setInterval(()=>{voiceRecSeconds++;document.getElementById("recTimer").textContent=voiceRecSeconds+"s";},1000);
  }).catch(()=>showToast("Cannot access microphone"));
}
function stopVoiceRecord(){
  if(!mediaRecorder||mediaRecorder.state==="inactive")return;
  mediaRecorder.stop();clearInterval(voiceRecTimer);
  document.getElementById("voiceRecordBtn").classList.remove("recording");
  document.getElementById("voiceRecordingBar").style.display="none";
  document.getElementById("composer").style.display="flex";
  if(localStream){localStream.getTracks().forEach(t=>t.stop());localStream=null;}
  mediaRecorder.onstop=()=>{
    const blob=new Blob(audioChunks,{type:"audio/webm"});
    const reader=new FileReader();
    reader.onload=e=>{
      const chatId=currentChatIsGroup?`group__${currentChatUser.id}`:getChatId(currentUser,currentChatUser);
      const payload={voice:e.target.result,voiceDuration:voiceRecSeconds,sender:currentUser.uniqueId,senderDisplay:currentUser.displayName,timestamp:Date.now(),read:false};
      if(destructTime>0){payload.destructAfter=destructTime;payload.destructAt=Date.now()+destructTime*1000;}
      msgsRef.child(chatId).push(payload);renderContacts();
    };
    reader.readAsDataURL(blob);
  };
}
function cancelVoiceRecord(){
  if(mediaRecorder&&mediaRecorder.state!=="inactive")mediaRecorder.stop();
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
  if(forwardMsgText){
    const chatId=currentChatIsGroup?`group__${currentChatUser.id}`:getChatId(currentUser,currentChatUser);
    msgsRef.child(chatId).push({text:`📤 ${forwardMsgText}`,sender:currentUser.uniqueId,senderDisplay:currentUser.displayName,timestamp:Date.now(),read:false});
    cancelForward();renderContacts();return;
  }
  const text=document.getElementById("messageInput").value.trim();
  if(!text||!currentChatUser)return;
  const chatId=currentChatIsGroup?`group__${currentChatUser.id}`:getChatId(currentUser,currentChatUser);
  const payload={text,sender:currentUser.uniqueId,senderDisplay:currentUser.displayName,timestamp:Date.now(),read:false};
  if(replyTo)payload.replyTo=replyTo;
  if(destructTime>0){payload.destructAfter=destructTime;payload.destructAt=Date.now()+destructTime*1000;}
  msgsRef.child(chatId).push(payload);
  document.getElementById("messageInput").value="";
  if(!currentChatIsGroup)typingRef.child(currentUser.uniqueId).set({to:currentChatUser.uniqueId,isTyping:false});
  cancelReply();renderContacts();
}

// ===== IMAGE MESSAGE =====
function triggerImageUpload(){document.getElementById("imageUpload").click();}
function sendImageMessage(input){
  const file=input.files[0];if(!file||!currentChatUser)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const chatId=currentChatIsGroup?`group__${currentChatUser.id}`:getChatId(currentUser,currentChatUser);
    const payload={image:e.target.result,sender:currentUser.uniqueId,senderDisplay:currentUser.displayName,timestamp:Date.now(),read:false};
    if(destructTime>0){payload.destructAfter=destructTime;payload.destructAt=Date.now()+destructTime*1000;}
    msgsRef.child(chatId).push(payload);renderContacts();
  };
  reader.readAsDataURL(file);input.value="";
}
function openImageFull(src){
  const o=document.createElement("div");
  o.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;";
  o.innerHTML=`<img src="${src}" style="max-width:90vw;max-height:90vh;border-radius:12px;"/>`;
  o.onclick=()=>document.body.removeChild(o);document.body.appendChild(o);
}

// ===== TYPING =====
document.getElementById("messageInput").addEventListener("input",()=>{
  if(!currentChatUser||currentChatIsGroup)return;
  typingRef.child(currentUser.uniqueId).set({to:currentChatUser.uniqueId,isTyping:true});
  clearTimeout(typingTimeout);
  typingTimeout=setTimeout(()=>{typingRef.child(currentUser.uniqueId).set({to:currentChatUser.uniqueId,isTyping:false});},2000);
});

let typingEl=null;
function showTypingIndicator(){
  if(typingEl)return;typingEl=document.createElement("div");typingEl.className="typing-indicator";
  typingEl.innerHTML=`<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
  document.getElementById("messages").appendChild(typingEl);
  document.getElementById("messages").scrollTop=document.getElementById("messages").scrollHeight;
}
function hideTypingIndicator(){if(typingEl){typingEl.remove();typingEl=null;}}

// ===== GROUPS =====
function openCreateGroup(){
  if(!isAdmin)return showToast("Only admin can create groups");
  const picker=document.getElementById("groupMemberPicker");picker.innerHTML="";
  selectedGroupMembers=new Set();
  allUsers.forEach(u=>{
    const row=document.createElement("label");row.className="member-pick-row";
    row.innerHTML=`<input type="checkbox" value="${u.uniqueId}" onchange="toggleGroupMember('${u.uniqueId}')"/>
      <img src="${u.photoURL||`https://api.dicebear.com/7.x/thumbs/svg?seed=${u.uniqueId}`}"/>
      <span>${escHtml(u.displayName)} <small style="color:var(--text3);font-size:10px;">${u.uniqueId}</small></span>`;
    picker.appendChild(row);
  });
  document.getElementById("groupNameInput").value="";
  document.getElementById("createGroupModal").style.display="flex";
}

function toggleGroupMember(id){
  if(selectedGroupMembers.has(id))selectedGroupMembers.delete(id);
  else selectedGroupMembers.add(id);
}

async function createGroup(){
  const name=document.getElementById("groupNameInput").value.trim();
  if(!name)return showToast("Enter a group name");
  if(selectedGroupMembers.size<1)return showToast("Select at least 1 member");

  const members={[currentUser.uniqueId]:true};
  selectedGroupMembers.forEach(id=>members[id]=true);

  const groupData={
    name,members,
    createdBy:currentUser.uniqueId,
    createdAt:Date.now()
  };
  const ref=await groupsRef.push(groupData);
  closeModal("createGroupModal");
  showToast(`✅ Group "${name}" created!`);
  // Switch to groups tab
  switchTab("groups",document.querySelector(".stab:nth-child(2)"));
}

function viewGroupInfo(group){
  currentGroupId=group.id;
  document.getElementById("groupInfoName").textContent=group.name;
  const memberIds=Object.keys(group.members||{});
  document.getElementById("groupInfoCount").textContent=`${memberIds.length} members`;
  const memberList=document.getElementById("groupMemberList");memberList.innerHTML="";
  memberIds.forEach(id=>{
    usersRef.child(id).get().then(snap=>{
      const u=snap.val()||{};
      const row=document.createElement("div");row.className="group-member-row";
      row.innerHTML=`<img src="${u.photoURL||`https://api.dicebear.com/7.x/thumbs/svg?seed=${id}`}"/>
        <div><div class="gmname">${escHtml(u.displayName||id)}</div><div class="gmid">${id}</div></div>
        ${isAdmin?`<button onclick="removeMemberFromGroup('${id}')" style="background:rgba(255,92,92,.15);border:none;color:var(--danger);padding:4px 8px;border-radius:6px;cursor:pointer;font-size:12px;">Remove</button>`:""}`;
      memberList.appendChild(row);
    });
  });
  document.getElementById("groupAdminActions").style.display=isAdmin?"block":"none";
  document.getElementById("groupInfoModal").style.display="flex";
}

function removeMemberFromGroup(memberId){
  if(!currentGroupId)return;
  groupsRef.child(currentGroupId).child("members").child(memberId).remove();
  showToast("Member removed");
  viewGroupInfo({...currentChatUser,id:currentGroupId});
}

function deleteGroup(){
  if(!currentGroupId)return;
  if(!confirm("Delete this group?"))return;
  groupsRef.child(currentGroupId).remove();
  msgsRef.child(`group__${currentGroupId}`).remove();
  closeModal("groupInfoModal");
  document.getElementById("chatHeader").style.display="none";
  document.getElementById("emptyState").style.display="flex";
  document.getElementById("composer").style.display="none";
  currentChatUser=null;currentChatIsGroup=false;
  showToast("🗑️ Group deleted");
}

function addMemberToGroup(){
  if(!currentGroupId)return;
  const id=prompt("Enter user's Unique ID (AURA-XXXX-XXXX):");
  if(!id)return;
  groupsRef.child(currentGroupId).child("members").child(id.trim()).set(true);
  showToast("✅ Member added");
}

// ===== SELF-DESTRUCT =====
function openDestructTimer(){document.getElementById("destructModal").style.display="flex";closeDropdowns();}
function setDestructTime(secs){
  destructTime=secs;
  const status=document.getElementById("destructStatus");
  if(secs===0)status.textContent="Self-destruct: Off";
  else status.textContent=`✅ Messages delete after ${fmtSec(secs)}`;
  updateDestructIndicator();closeModal("destructModal");
}
function updateDestructIndicator(){
  const ind=document.getElementById("destructIndicator");if(!ind)return;
  if(destructTime>0){ind.style.display="flex";document.getElementById("destructLabel").textContent=`Self-destruct: ${fmtSec(destructTime)}`;}
  else ind.style.display="none";
}
function scheduleDestruct(chatId,msgId,seconds){
  if(destructTimers[msgId])return;
  let rem=seconds;
  const dcEl=document.getElementById(`dc-${msgId}`);
  destructTimers[msgId]=setInterval(()=>{
    rem--;if(dcEl)dcEl.textContent=`⏱${fmtSec(rem)}`;
    if(rem<=0){
      clearInterval(destructTimers[msgId]);delete destructTimers[msgId];
      msgsRef.child(chatId).child(msgId).update({deleted:true,text:"",image:"",voice:""});
    }
  },1000);
}

// ===== EDIT / DELETE / COPY / FORWARD / REPLY =====
function openEditMsg(chatId,msgId,text){editingMsgId=msgId;editingChatId=chatId;document.getElementById("editMsgInput").value=text;document.getElementById("editMsgModal").style.display="flex";}
function saveEditedMsg(){
  const newText=document.getElementById("editMsgInput").value.trim();
  if(!newText||!editingMsgId)return;
  msgsRef.child(editingChatId).child(editingMsgId).update({text:newText,edited:true});
  closeModal("editMsgModal");showToast("✅ Edited");editingMsgId=null;editingChatId=null;
}
function deleteMsg(chatId,msgId){
  if(!confirm("Delete?"))return;
  msgsRef.child(chatId).child(msgId).update({deleted:true,text:"",image:"",voice:""});
  showToast("Deleted");
}
function copyMsg(text){navigator.clipboard.writeText(text).then(()=>showToast("✅ Copied!"));}
function forwardMsg(text){
  forwardMsgText=text;
  document.getElementById("forwardBar").style.display="flex";
  document.getElementById("forwardPreview").textContent=text.slice(0,40)+(text.length>40?"...":"");
  showToast("Select a chat to forward");
}
function cancelForward(){forwardMsgText=null;document.getElementById("forwardBar").style.display="none";}
function replyToMsg(id,text){replyTo=text;document.getElementById("replyText").textContent=text;document.getElementById("replyPreview").style.display="flex";document.getElementById("messageInput").focus();}
function cancelReply(){replyTo=null;document.getElementById("replyPreview").style.display="none";}

// ===== REACTIONS =====
function addReaction(chatId,msgId){
  const p=document.createElement("div");
  p.style.cssText="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:10px 14px;display:flex;flex-wrap:wrap;gap:6px;z-index:999;max-width:300px;box-shadow:var(--shadow);";
  ["❤️","😂","😮","😢","👍","👎","🔥","🎉","😍","🤯"].forEach(emoji=>{
    const btn=document.createElement("span");btn.textContent=emoji;btn.style.cssText="font-size:26px;cursor:pointer;padding:4px;";
    btn.onclick=()=>{reactRef.child(chatId).child(msgId).child(currentUser.uniqueId).set(emoji);document.body.removeChild(p);};
    p.appendChild(btn);
  });
  const cl=document.createElement("span");cl.textContent="✕";cl.style.cssText="font-size:16px;cursor:pointer;color:var(--text3);align-self:center;margin-left:6px;";
  cl.onclick=()=>document.body.removeChild(p);p.appendChild(cl);document.body.appendChild(p);
}

// ===== SEARCH =====
function openSearch(){const box=document.getElementById("searchBox");box.style.display=box.style.display==="flex"?"none":"flex";if(box.style.display==="flex")document.getElementById("searchInput").focus();}
function closeSearch(){document.getElementById("searchBox").style.display="none";document.querySelectorAll(".bubble").forEach(b=>b.classList.remove("highlight"));searchMatches=[];searchIdx=-1;document.getElementById("searchCount").textContent="";}
document.getElementById("searchInput").addEventListener("input",()=>{
  const q=document.getElementById("searchInput").value.toLowerCase().trim();
  searchMatches=[];searchIdx=-1;
  document.querySelectorAll(".msg-wrap").forEach(w=>{w.querySelector(".bubble")?.classList.remove("highlight");if(q&&w.dataset.text?.includes(q))searchMatches.push(w);});
  document.getElementById("searchCount").textContent=q?`${searchMatches.length} found`:"";
  if(searchMatches.length>0){searchIdx=0;highlightMatch();}
});
function searchMessage(dir){if(!searchMatches.length)return;dir==="next"?searchIdx=(searchIdx+1)%searchMatches.length:searchIdx=(searchIdx-1+searchMatches.length)%searchMatches.length;highlightMatch();}
function highlightMatch(){document.querySelectorAll(".bubble").forEach(b=>b.classList.remove("highlight"));const bubble=searchMatches[searchIdx]?.querySelector(".bubble");if(bubble){bubble.classList.add("highlight");bubble.scrollIntoView({behavior:"smooth",block:"center"});}document.getElementById("searchCount").textContent=`${searchIdx+1} / ${searchMatches.length}`;}

// ===== STORIES =====
function loadStories(){
  storiesRef.on("value",snap=>{
    const list=document.getElementById("storiesList");list.innerHTML="";
    const stories={};
    snap.forEach(child=>{const s=child.val();if(Date.now()-s.timestamp>86400000)return;if(!stories[s.authorId])stories[s.authorId]=[];stories[s.authorId].push({...s,id:child.key});});
    Object.entries(stories).forEach(([authorId,items])=>{
      if(authorId===currentUser.uniqueId)return;
      const item=document.createElement("div");item.className="story-item";item.onclick=()=>openStory(authorId,items);
      item.innerHTML=`<div class="story-avatar-ring"><img src="${items[0].authorPhoto||`https://api.dicebear.com/7.x/thumbs/svg?seed=${authorId}`}"/></div><span>${escHtml(items[0].authorDisplay||authorId)}</span>`;
      list.appendChild(item);
    });
  });
}
function initStoryBgPicker(){
  const grid=document.getElementById("storyBgOptions");
  STORY_BG.forEach(color=>{
    const sw=document.createElement("div");sw.className="story-bg-swatch";sw.style.background=color;
    sw.onclick=()=>{storyBgColor=color;document.querySelectorAll(".story-bg-swatch").forEach(s=>s.classList.remove("active"));sw.classList.add("active");};
    grid.appendChild(sw);
  });
}
function openStoryCreator(){document.getElementById("storyModal").style.display="flex";}
function previewStoryImage(input){const f=input.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{const img=document.getElementById("storyImagePreview");img.src=e.target.result;img.style.display="block";};r.readAsDataURL(f);}
function postStory(){
  const text=document.getElementById("storyText").value.trim();
  const img=document.getElementById("storyImagePreview");const imgSrc=img.style.display!=="none"?img.src:"";
  if(!text&&!imgSrc)return showToast("Add text or photo");
  storiesRef.push({text,image:imgSrc,bg:storyBgColor,authorId:currentUser.uniqueId,authorDisplay:currentUser.displayName,authorPhoto:currentUser.photoURL,timestamp:Date.now()});
  closeModal("storyModal");document.getElementById("storyText").value="";img.style.display="none";showToast("📖 Story posted!");
}
function openStoriesView(){storiesRef.once("value",snap=>{const all=[];snap.forEach(child=>{const s=child.val();if(Date.now()-s.timestamp<86400000)all.push({...s,id:child.key});});if(!all.length)return showToast("No stories yet");openStory(all[0].authorId,[all[0]]);});}
function openStory(authorId,items){currentStories=items;currentStoryIdx=0;document.getElementById("storiesViewer").style.display="flex";renderStorySlide();}
function renderStorySlide(){
  const s=currentStories[currentStoryIdx];if(!s){closeStoriesViewer();return;}
  document.getElementById("svAvatar").src=s.authorPhoto||`https://api.dicebear.com/7.x/thumbs/svg?seed=${s.authorId}`;
  document.getElementById("svName").textContent=s.authorDisplay||s.authorId;
  document.getElementById("svTime").textContent=timeAgo(s.timestamp);
  const content=document.getElementById("svContent");content.innerHTML="";
  if(s.image){const img=document.createElement("img");img.src=s.image;content.appendChild(img);}
  else if(s.text){const p=document.createElement("p");p.textContent=s.text;p.style.background=s.bg||"#1E1E35";content.appendChild(p);}
  const bar=document.getElementById("svProgressBar");bar.innerHTML=currentStories.map((_,i)=>`<div style="flex:1;height:3px;background:${i<currentStoryIdx?"#fff":i===currentStoryIdx?"":"rgba(255,255,255,.3)"};margin:0 2px;border-radius:3px;overflow:hidden;">${i===currentStoryIdx?`<div style="width:0%;height:100%;background:#fff;transition:width 5s linear;"></div>`:""}</div>`).join("");
  clearTimeout(storyAutoTimer);storyAutoTimer=setTimeout(()=>storyNav(1),5000);
  setTimeout(()=>{const fill=bar.querySelector("div div");if(fill)fill.style.width="100%";},50);
}
function storyNav(dir){clearTimeout(storyAutoTimer);currentStoryIdx+=dir;if(currentStoryIdx<0)currentStoryIdx=0;if(currentStoryIdx>=currentStories.length){closeStoriesViewer();return;}renderStorySlide();}
function closeStoriesViewer(){document.getElementById("storiesViewer").style.display="none";clearTimeout(storyAutoTimer);}

// ===== CALLS =====
function listenCalls(){
  callsRef.child(currentUser.uniqueId).on("value",snap=>{
    const call=snap.val();if(!call||call.status!=="ringing")return;
    if(Date.now()-call.timestamp>30000){callsRef.child(currentUser.uniqueId).remove();return;}
    document.getElementById("incomingCall").style.display="flex";
    document.getElementById("incomingAvatar").src=call.fromPhoto||`https://api.dicebear.com/7.x/thumbs/svg?seed=${call.from}`;
    document.getElementById("incomingName").textContent=call.fromDisplay||call.from;
    document.getElementById("incomingType").textContent=call.type==="video"?"📹 Video Call":"📞 Voice Call";
  });
}
function startVoiceCall(){if(!currentChatUser||currentChatIsGroup)return;showCallUI();callsRef.child(currentChatUser.uniqueId).set({from:currentUser.uniqueId,fromDisplay:currentUser.displayName,fromPhoto:currentUser.photoURL,type:"voice",status:"ringing",timestamp:Date.now()});setTimeout(()=>{if(document.getElementById("callScreen").style.display!=="none"){document.getElementById("callStatus").textContent="Connected";document.getElementById("callTimer").style.display="block";startCallTimer();}},3000);}
function startVideoCall(){if(!currentChatUser||currentChatIsGroup)return;showCallUI();navigator.mediaDevices?.getUserMedia({video:true,audio:true}).then(stream=>{localStream=stream;document.getElementById("localVideo").srcObject=stream;document.getElementById("localVideo").style.display="block";callsRef.child(currentChatUser.uniqueId).set({from:currentUser.uniqueId,fromDisplay:currentUser.displayName,fromPhoto:currentUser.photoURL,type:"video",status:"ringing",timestamp:Date.now()});setTimeout(()=>{document.getElementById("callStatus").textContent="Connected";document.getElementById("callTimer").style.display="block";startCallTimer();},3000);}).catch(()=>showToast("Cannot access camera"));}
function showCallUI(){
  const user=currentChatUser;
  document.getElementById("callScreen").style.display="flex";
  document.getElementById("callAvatar").src=user.photoURL||`https://api.dicebear.com/7.x/thumbs/svg?seed=${user.uniqueId}`;
  document.getElementById("callName").textContent=user.displayName;
  document.getElementById("callStatus").textContent="Calling...";
  document.getElementById("callTimer").style.display="none";
}
function acceptCall(){document.getElementById("incomingCall").style.display="none";callsRef.child(currentUser.uniqueId).update({status:"accepted"});document.getElementById("callScreen").style.display="flex";document.getElementById("callAvatar").src=document.getElementById("incomingAvatar").src;document.getElementById("callName").textContent=document.getElementById("incomingName").textContent;document.getElementById("callStatus").textContent="Connected";document.getElementById("callTimer").style.display="block";startCallTimer();}
function rejectCall(){document.getElementById("incomingCall").style.display="none";callsRef.child(currentUser.uniqueId).remove();}
function endCall(){document.getElementById("callScreen").style.display="none";if(localStream){localStream.getTracks().forEach(t=>t.stop());localStream=null;}clearInterval(callTimerInterval);callSeconds=0;if(currentChatUser&&!currentChatIsGroup)callsRef.child(currentChatUser.uniqueId).remove();callsRef.child(currentUser.uniqueId).remove();showToast("📵 Call ended");}
function startCallTimer(){callSeconds=0;callTimerInterval=setInterval(()=>{callSeconds++;const m=Math.floor(callSeconds/60).toString().padStart(2,"0");const s=(callSeconds%60).toString().padStart(2,"0");document.getElementById("callTimer").textContent=`${m}:${s}`;},1000);}
function toggleCallMute(){const btn=document.getElementById("callMuteBtn");btn.classList.toggle("muted");const m=btn.classList.contains("muted");btn.innerHTML=m?`<i class="fas fa-microphone-slash"></i>`:`<i class="fas fa-microphone"></i>`;if(localStream)localStream.getAudioTracks().forEach(t=>t.enabled=!m);}
function toggleSpeaker(){showToast("🔊 Speaker toggled");}

// ===== BLOCK USER =====
function blockUser(){
  if(!currentChatUser||currentChatIsGroup)return;
  if(!confirm(`Block ${currentChatUser.displayName}?`))return;
  blockedUsers.push(currentChatUser.uniqueId);
  localStorage.setItem("aurachat_blocked",JSON.stringify(blockedUsers));
  showToast(`🚫 Blocked`);
  document.getElementById("chatHeader").style.display="none";
  document.getElementById("emptyState").style.display="flex";
  document.getElementById("composer").style.display="none";
  currentChatUser=null;loadUsers();closeModal("profileModal");
}

// ===== WALLPAPER =====
function initWallpaperGrid(){
  const grid=document.getElementById("wallpaperGrid");grid.innerHTML="";
  WALLPAPERS.forEach(wp=>{
    const div=document.createElement("div");div.className="wp-option";div.style.background=wp.value;div.textContent=wp.label;
    div.onclick=()=>applyWallpaper(wp.value);grid.appendChild(div);
  });
}
function openWallpaperPicker(){document.getElementById("wallpaperModal").style.display="flex";closeDropdowns();}
function applyWallpaper(value){
  const area=document.getElementById("messages");
  if(value.startsWith("linear")||value.startsWith("url")){area.style.backgroundImage=value;area.style.background="";}
  else{area.style.background=value;area.style.backgroundImage="none";}
  localStorage.setItem("aurachat_wallpaper",value);closeModal("wallpaperModal");showToast("🎨 Wallpaper applied");
}
function setCustomWallpaper(input){const f=input.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{const area=document.getElementById("messages");area.style.backgroundImage=`url(${e.target.result})`;area.style.backgroundSize="cover";localStorage.setItem("aurachat_wallpaper",`url(${e.target.result})`);};r.readAsDataURL(f);}
function clearWallpaper(){const area=document.getElementById("messages");area.style.background="var(--bg)";area.style.backgroundImage="none";localStorage.removeItem("aurachat_wallpaper");closeModal("wallpaperModal");showToast("Wallpaper removed");}

// ===== NOTIFICATIONS =====
function requestPushPermission(){"Notification"in window?Notification.requestPermission().then(p=>showToast(p==="granted"?"🔔 Push enabled!":"Notifications blocked")):showToast("Not supported");closeModal("notifModal");}
function requestPushPermissionSilent(){if("Notification"in window&&Notification.permission==="default")Notification.requestPermission();}
function playNotifSound(){if(!notifPrefs.sound)return;try{const ctx=new AudioContext();const osc=ctx.createOscillator();const g=ctx.createGain();osc.connect(g);g.connect(ctx.destination);osc.frequency.setValueAtTime(880,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(440,ctx.currentTime+0.1);g.gain.setValueAtTime(0.08,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.15);osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.15);}catch(e){}}
function openNotifSettings(){document.getElementById("notifModal").style.display="flex";closeDropdowns();}
function saveNotifPref(){notifPrefs.messages=document.getElementById("notifMessages").checked;notifPrefs.sound=document.getElementById("notifSound").checked;notifPrefs.stories=document.getElementById("notifStories").checked;localStorage.setItem("aurachat_notif",JSON.stringify(notifPrefs));showToast("✅ Saved");}
function loadNotifPrefs(){const saved=localStorage.getItem("aurachat_notif");if(saved){notifPrefs={...notifPrefs,...JSON.parse(saved)};document.getElementById("notifMessages").checked=notifPrefs.messages;document.getElementById("notifSound").checked=notifPrefs.sound;document.getElementById("notifStories").checked=notifPrefs.stories;}}

// ===== PROFILE =====
function viewProfile(){
  if(currentChatIsGroup){viewGroupInfo(currentChatUser);return;}
  if(!currentChatUser)return;
  document.getElementById("modalAvatar").src=currentChatUser.photoURL||`https://api.dicebear.com/7.x/thumbs/svg?seed=${currentChatUser.uniqueId}`;
  document.getElementById("modalName").textContent=currentChatUser.displayName;
  document.getElementById("modalUniqueId").textContent=currentChatUser.uniqueId;
  document.getElementById("modalRole").textContent=currentChatUser.role==="admin"?"🛡️ Admin":"👤 User";
  statusRef.child(currentChatUser.uniqueId).get().then(snap=>{const st=snap.val()||{};document.getElementById("modalStatusTxt").textContent=st.status||(st.online?"🟢 Online":"🔴 Offline");});
  document.getElementById("modalJoined").textContent=currentChatUser.joinedAt?`Joined: ${new Date(currentChatUser.joinedAt).toLocaleDateString()}`:"";
  document.getElementById("modalActions").style.display="flex";
  document.getElementById("profileModal").style.display="flex";
}
function openMyProfile(){
  document.getElementById("modalAvatar").src=currentUser.photoURL;
  document.getElementById("modalName").textContent=currentUser.displayName;
  document.getElementById("modalUniqueId").textContent=currentUser.uniqueId;
  document.getElementById("modalRole").textContent=isAdmin?"🛡️ Admin":"👤 User";
  document.getElementById("modalStatusTxt").textContent=document.getElementById("myStatusText").textContent;
  document.getElementById("modalJoined").textContent=currentUser.joinedAt?`Joined: ${new Date(currentUser.joinedAt).toLocaleDateString()}`:"";
  document.getElementById("modalActions").style.display="none";
  document.getElementById("profileModal").style.display="flex";closeDropdowns();
}

// ===== STATUS =====
function setMyStatus(){document.getElementById("statusModal").style.display="flex";closeDropdowns();}
function saveStatus(status){document.getElementById("myStatusText").textContent=status;statusRef.child(currentUser.uniqueId).update({status});usersRef.child(currentUser.uniqueId).update({status});closeModal("statusModal");showToast("✅ Status updated");}
function saveCustomStatus(){const s=document.getElementById("customStatus").value.trim();if(s)saveStatus(s);}

// ===== MUTE / CLEAR / EXPORT =====
function toggleMute(){isMuted=!isMuted;showToast(isMuted?"🔕 Muted":"🔔 Unmuted");}
function clearChat(){
  if(!currentChatUser)return;if(!confirm("Clear entire chat?"))return;
  const chatId=currentChatIsGroup?`group__${currentChatUser.id}`:getChatId(currentUser,currentChatUser);
  msgsRef.child(chatId).remove();reactRef.child(chatId).remove();showToast("🧹 Cleared");
}
function exportChat(){
  if(!currentChatUser)return;
  const msgs=document.querySelectorAll(".msg-wrap");
  let text=`AuraChat Export\n${"─".repeat(40)}\n\n`;
  msgs.forEach(w=>{
    const isOut=w.classList.contains("out");
    const who=isOut?currentUser.displayName:currentChatUser.displayName||currentChatUser.name;
    const time=w.querySelector(".time")?.textContent||"";
    const msg=w.querySelector(".bubble span")?.textContent||"[Media]";
    text+=`[${time}] ${who}: ${msg}\n`;
  });
  const blob=new Blob([text],{type:"text/plain"});const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=`aurachat-export.txt`;a.click();URL.revokeObjectURL(url);
  showToast("📥 Exported");
}

// ===== EDIT DISPLAY NAME =====
document.getElementById("editNameTrigger").addEventListener("click",()=>{
  const box=document.getElementById("editNameBox");box.style.display=box.style.display==="flex"?"none":"flex";closeDropdowns();
  if(box.style.display==="flex")setTimeout(()=>document.getElementById("newNameInput").focus(),100);
});
document.getElementById("saveNameBtn").addEventListener("click",async()=>{
  const newName=document.getElementById("newNameInput").value.trim();
  if(!newName)return showToast("Enter a display name");
  currentUser.displayName=newName;
  await usersRef.child(currentUser.uniqueId).update({displayName:newName});
  document.getElementById("currentUserName").textContent=newName;
  document.getElementById("editNameBox").style.display="none";
  document.getElementById("newNameInput").value="";
  showToast("✅ Display name updated");
});

// ===== ADMIN ACTIONS =====
function adminDeleteUser(){
  if(!currentChatUser||currentChatIsGroup)return showToast("Select a user first");
  if(!confirm(`Delete ${currentChatUser.displayName}?`))return;
  usersRef.child(currentChatUser.uniqueId).remove();
  document.getElementById("chatHeader").style.display="none";
  document.getElementById("emptyState").style.display="flex";
  document.getElementById("composer").style.display="none";
  currentChatUser=null;showToast("🗑️ User deleted");
}
function adminUnsend(){
  if(!currentChatUser)return showToast("Select a chat first");
  const chatId=currentChatIsGroup?`group__${currentChatUser.id}`:getChatId(currentUser,currentChatUser);
  msgsRef.child(chatId).limitToLast(1).get().then(snap=>{snap.forEach(child=>{msgsRef.child(chatId).child(child.key).update({deleted:true,text:""});});showToast("⛔ Unsent");});
}
function adminBroadcast(){document.getElementById("broadcastModal").style.display="flex";}
function sendBroadcast(){
  const text=document.getElementById("broadcastText").value.trim();if(!text)return showToast("Enter message");
  usersRef.get().then(snap=>{
    snap.forEach(child=>{
      const u=child.val();if(u.uniqueId===currentUser.uniqueId)return;
      const chatId=getChatId2(currentUser.uniqueId,u.uniqueId);
      msgsRef.child(chatId).push({text:`📢 ${text}`,sender:currentUser.uniqueId,senderDisplay:currentUser.displayName,timestamp:Date.now(),read:false});
    });
    showToast("📢 Broadcast sent!");closeModal("broadcastModal");document.getElementById("broadcastText").value="";
  });
}

function openAdminDashboard(){document.getElementById("adminDashboard").style.display="flex";loadDashboard();}
function loadDashboard(){
  usersRef.once("value",uSnap=>{
    let total=0,online=0;const userList=[];
    uSnap.forEach(c=>{total++;userList.push(c.val());});
    msgsRef.once("value",mSnap=>{
      let totalMsgs=0;mSnap.forEach(chat=>{chat.forEach(()=>totalMsgs++);});
      Promise.all(userList.map(u=>statusRef.child(u.uniqueId).get())).then(stats=>{
        stats.forEach(s=>{if(s.val()?.online)online++;});
        document.getElementById("dashboardStats").innerHTML=`
          <div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Users</div></div>
          <div class="stat-card"><div class="stat-num" style="color:var(--accent2)">${online}</div><div class="stat-label">Online</div></div>
          <div class="stat-card"><div class="stat-num" style="color:var(--accent)">${totalMsgs}</div><div class="stat-label">Messages</div></div>`;
        const ul=document.getElementById("dashboardUsers");ul.innerHTML="";
        userList.forEach(u=>{
          const row=document.createElement("div");row.className="dash-user-row";
          row.innerHTML=`<img src="${u.photoURL||`https://api.dicebear.com/7.x/thumbs/svg?seed=${u.uniqueId}`}"/>
            <div class="dash-user-info"><div class="dname">${escHtml(u.displayName)}</div><div class="drole" style="font-size:10px;">${u.uniqueId}</div></div>
            <div class="dash-user-actions">
              <button class="dash-msg-btn" onclick="quickChat('${u.uniqueId}')">💬</button>
              ${u.uniqueId!==currentUser.uniqueId?`<button class="dash-ban-btn" onclick="adminBanUser('${u.uniqueId}')">🚫</button>`:""}
            </div>`;
          ul.appendChild(row);
        });
      });
    });
  });
}
function quickChat(uid){closeModal("adminDashboard");usersRef.child(uid).get().then(snap=>{if(snap.exists())openChat(snap.val());});}
function adminBanUser(uid){if(!confirm("Ban this user?"))return;usersRef.child(uid).remove();showToast("🚫 Banned");loadDashboard();}

// ===== DARK MODE =====
document.getElementById("toggleDark").addEventListener("click",()=>{
  document.body.classList.toggle("light-mode");
  const isLight=document.body.classList.contains("light-mode");
  document.getElementById("toggleDark").innerHTML=isLight?`<i class="fas fa-moon"></i>`:`<i class="fas fa-sun"></i>`;
  showToast(isLight?"☀️ Light mode":"🌙 Dark mode");
});

// ===== SETTINGS DROPDOWN =====
document.getElementById("settingsBtn").addEventListener("click",e=>{e.stopPropagation();document.getElementById("settingsMenu").classList.toggle("open");});
document.addEventListener("click",closeDropdowns);
function closeDropdowns(){document.querySelectorAll(".dropdown-menu").forEach(m=>m.classList.remove("open"));}
function openSettingsPanel(){document.getElementById("settingsMenu").classList.toggle("open");}

// ===== BACK BUTTON (mobile) =====
document.getElementById("backToContactsBtn").addEventListener("click",()=>{document.getElementById("chatInterface").classList.remove("mobile-chat");});

// ===== EMOJI PICKER =====
function initEmojiPicker(){
  const grid=document.getElementById("emojiGrid");
  EMOJIS.forEach(e=>{
    const span=document.createElement("span");span.textContent=e;
    span.onclick=()=>{
      const inp=document.getElementById("messageInput");
      inp.value+=e;inp.focus();
    };
    grid.appendChild(span);
  });
}
function toggleEmojiPicker(){document.getElementById("emojiPicker").classList.toggle("open");}
document.addEventListener("click",e=>{if(!e.target.closest(".emoji-btn")&&!e.target.closest(".emoji-picker"))document.getElementById("emojiPicker").classList.remove("open");});

// ===== LOGOUT =====
function logout(){
  if(!confirm("Logout?"))return;
  statusRef.child(currentUser.uniqueId).set({online:false,lastSeen:Date.now()});
  typingRef.child(currentUser.uniqueId).remove();
  location.reload();
}

// ===== MODAL HELPERS =====
function closeModal(id){document.getElementById(id).style.display="none";}
document.querySelectorAll(".modal-overlay").forEach(o=>{o.addEventListener("click",e=>{if(e.target===o)o.style.display="none";});});

// ===== TOAST =====
let toastTO;
function showToast(msg){
  const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");
  clearTimeout(toastTO);toastTO=setTimeout(()=>t.classList.remove("show"),3000);
}

// ===== UTILS =====
function formatTime(ts){return new Date(ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});}
function formatDate(ts){const d=new Date(ts),today=new Date(),yest=new Date();yest.setDate(today.getDate()-1);if(d.toDateString()===today.toDateString())return"Today";if(d.toDateString()===yest.toDateString())return"Yesterday";return d.toLocaleDateString([],{weekday:"long",month:"short",day:"numeric"});}
function timeAgo(ts){const m=Math.floor((Date.now()-ts)/60000);if(m<1)return"just now";if(m<60)return`${m}m ago`;const h=Math.floor(m/60);if(h<24)return`${h}h ago`;return new Date(ts).toLocaleDateString();}
function fmtSec(s){if(s<60)return`${s}s`;if(s<3600)return`${Math.floor(s/60)}m`;return`${Math.floor(s/3600)}h`;}
function escHtml(str){if(!str)return"";return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function escAttr(str){if(!str)return"";return str.replace(/'/g,"&#39;").replace(/"/g,"&quot;").replace(/\n/g," ").slice(0,80);}
