// =============================================
//  AURACHAT — PREMIUM SCRIPT
// =============================================

// ===== FIREBASE INIT =====
const firebaseConfig = {
  apiKey: "AIzaSyBEnL-jzxZ89rT9vdqHHNcgjSrFXtGz6ho",
  authDomain: "whats-app-4f3d7.firebaseapp.com",
  projectId: "whats-app-4f3d7",
  databaseURL: "https://whats-app-4f3d7-default-rtdb.firebaseio.com"
};
firebase.initializeApp(firebaseConfig);

const db        = firebase.database();
const usersRef  = db.ref("users");
const msgsRef   = db.ref("messages");
const statusRef = db.ref("status");
const typingRef = db.ref("typingStatus");
const reactRef  = db.ref("reactions");

// ===== STATE =====
let currentUser     = null;
let currentChatUser = null;
let isAdmin         = false;
let typingTimeout   = null;
let replyTo         = null;
let isMuted         = false;
let currentTab      = "all";
let allUsers        = [];
let searchMatches   = [];
let searchIdx       = -1;
let activeListeners = {};
let unreadCounts    = {};

// ===== EMOJIS =====
const EMOJIS = ["😀","😂","🥰","😍","🤩","😎","🥺","😭","😤","🤔","🙄","😴","🤗","😇","🤯","🥳",
  "👍","👎","❤️","🔥","💯","🎉","✨","⭐","💫","🌟","💥","🎯","🚀","🏆","🎁","🎊",
  "😋","😛","🤣","😆","😅","😓","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥱",
  "👀","🫶","🙌","👏","🤝","💪","🫂","✌️","🤞","🤙","👋","🫡","💅","🧠","👁️","💀"];

// ===== SPLASH =====
window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("splashScreen").classList.add("fade-out");
    setTimeout(() => {
      document.getElementById("splashScreen").style.display = "none";
    }, 600);
  }, 1800);
});

// ===== ROLE SWITCH =====
let selectedRole = "user";

function switchRole(role) {
  selectedRole = role;
  document.querySelectorAll(".role-tab").forEach(b => b.classList.remove("active"));
  document.querySelector(`[data-role="${role}"]`).classList.add("active");
  document.getElementById("adminFields").style.display = role === "admin" ? "block" : "none";
}

// ===== PROFILE PHOTO PREVIEW =====
document.getElementById("profilePic").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById("profilePreview").src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// ===== LOGIN =====
document.getElementById("submitUser").addEventListener("click", async () => {
  const name = document.getElementById("displayName").value.trim();
  const pwd  = document.getElementById("adminPassword").value.trim();

  if (!name) return showToast("⚠️ Enter your name");

  if (selectedRole === "admin") {
    if (pwd !== "Ali-sec") return showToast("❌ Wrong admin password!");
    isAdmin = true;
  }

  // Build user object
  const picFile = document.getElementById("profilePic").files[0];
  let photoURL = `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(name)}`;

  if (picFile) {
    photoURL = await new Promise(res => {
      const r = new FileReader();
      r.onload = e => res(e.target.result);
      r.readAsDataURL(picFile);
    });
  }

  currentUser = {
    displayName: name,
    photoURL,
    role: isAdmin ? "admin" : "user",
    joinedAt: Date.now()
  };

  await usersRef.child(name).set(currentUser);

  // Refetch — keep role from session
  const snap = await usersRef.child(name).get();
  if (snap.exists()) {
    currentUser = { ...snap.val(), role: isAdmin ? "admin" : "user" };
  }

  // Update UI
  document.getElementById("currentUserName").textContent = name;
  document.getElementById("currentUserAvatar").src = currentUser.photoURL;
  document.getElementById("myStatusText").textContent = "🟢 Available";

  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("chatInterface").style.display = "flex";

  if (isAdmin) document.getElementById("adminControls").style.display = "flex";

  // Online presence
  const goOnline = () => statusRef.child(name).set({ online: true, lastSeen: Date.now(), status: "🟢 Available" });
  goOnline();
  setInterval(goOnline, 25000);

  window.addEventListener("beforeunload", () => {
    statusRef.child(name).set({ online: false, lastSeen: Date.now() });
    typingRef.child(name).remove();
  });

  initEmojiPicker();
  loadUsers();
  listenBroadcasts();
});

// ===== LOAD USERS =====
function loadUsers() {
  usersRef.on("value", snap => {
    allUsers = [];
    snap.forEach(child => {
      const u = child.val();
      if (u.displayName === currentUser.displayName) return;
      if (!isAdmin && u.role !== "admin") return;
      allUsers.push(u);
    });
    renderContacts();
  });
}

function renderContacts(filter = "") {
  const list = document.getElementById("users");
  list.innerHTML = "";

  let filtered = allUsers.filter(u =>
    u.displayName.toLowerCase().includes(filter.toLowerCase())
  );

  if (currentTab === "online") {
    filtered = filtered.filter(u => u._online);
  } else if (currentTab === "unread") {
    filtered = filtered.filter(u => unreadCounts[u.displayName] > 0);
  }

  if (filtered.length === 0) {
    list.innerHTML = `<div style="text-align:center; color:var(--text3); padding:20px; font-size:13px;">No contacts found</div>`;
    return;
  }

  filtered.forEach(user => {
    statusRef.child(user.displayName).get().then(sSnap => {
      const st = sSnap.val() || {};
      user._online = !!st.online;

      // Last message preview
      const chatId = getChatId2(currentUser.displayName, user.displayName);
      msgsRef.child(chatId).limitToLast(1).get().then(mSnap => {
        let lastMsg = "";
        let lastTime = "";
        mSnap.forEach(m => {
          const v = m.val();
          lastMsg = v.image ? "📷 Photo" : (v.text || "");
          lastTime = formatTime(v.timestamp);
        });

        const li = document.createElement("div");
        li.className = `contact-item ${currentChatUser?.displayName === user.displayName ? "active" : ""}`;
        li.id = `contact-${user.displayName}`;
        li.onclick = () => openChat(user);

        const unread = unreadCounts[user.displayName] || 0;

        li.innerHTML = `
          <div class="avatar-wrap">
            <img src="${user.photoURL || `https://api.dicebear.com/7.x/thumbs/svg?seed=${user.displayName}`}" alt="${user.displayName}"/>
            ${user._online ? `<span class="online-badge"></span>` : ""}
          </div>
          <div class="contact-info">
            <div class="cname">${user.displayName}${user.role === "admin" ? " 🛡️" : ""}</div>
            <div class="clast">${lastMsg || "Start a conversation"}</div>
          </div>
          <div class="contact-meta">
            ${lastTime ? `<span class="contact-time">${lastTime}</span>` : ""}
            ${unread > 0 ? `<span class="unread-badge">${unread}</span>` : ""}
          </div>
        `;

        list.appendChild(li);
      });
    });
  });
}

function filterContacts(val) { renderContacts(val); }

function switchTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll(".stab").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderContacts();
}

// ===== OPEN CHAT =====
function openChat(user) {
  // Remove active from previous
  document.querySelectorAll(".contact-item").forEach(el => el.classList.remove("active"));
  const li = document.getElementById(`contact-${user.displayName}`);
  if (li) li.classList.add("active");

  currentChatUser = user;
  unreadCounts[user.displayName] = 0;
  renderContacts();

  // Header
  document.getElementById("chatHeader").style.display = "flex";
  document.getElementById("emptyState").style.display  = "none";
  document.getElementById("composer").style.display    = "flex";
  document.getElementById("chatPartnerName").textContent = user.displayName;
  document.getElementById("chatPartnerAvatar").src = user.photoURL || `https://api.dicebear.com/7.x/thumbs/svg?seed=${user.displayName}`;

  // Status listener
  statusRef.child(user.displayName).on("value", snap => {
    const st = snap.val() || {};
    const badge = document.getElementById("partnerOnlineBadge");
    if (st.online) {
      document.getElementById("partnerStatus").textContent = st.status || "Online";
      badge.style.display = "block";
    } else {
      const mins = st.lastSeen ? Math.floor((Date.now() - st.lastSeen) / 60000) : null;
      document.getElementById("partnerStatus").textContent =
        mins !== null ? `Last seen ${mins < 1 ? "just now" : mins + " min ago"}` : "Offline";
      badge.style.display = "none";
    }
  });

  // Typing listener
  typingRef.child(user.displayName).on("value", snap => {
    const t = snap.val();
    if (t && t.to === currentUser.displayName && t.isTyping) {
      showTypingIndicator();
    } else {
      hideTypingIndicator();
    }
  });

  document.getElementById("messageInput").disabled = false;
  document.getElementById("sendMessage").disabled  = false;
  document.getElementById("messages").innerHTML    = "";

  // Mobile
  document.getElementById("chatInterface").classList.add("mobile-chat");

  // Detach old listener
  if (activeListeners.messages) {
    msgsRef.child(activeListeners.chatId).off("value", activeListeners.messages);
  }

  loadMessages();
  closeSearch();
  cancelReply();
}

// ===== CHAT ID =====
function getChatId(u1, u2) {
  if (!u1 || !u2) return "invalid";
  return [u1.displayName, u2.displayName].sort().join("__");
}

function getChatId2(n1, n2) {
  return [n1, n2].sort().join("__");
}

// ===== LOAD MESSAGES =====
function loadMessages() {
  const chatId = getChatId(currentUser, currentChatUser);
  activeListeners.chatId = chatId;

  const handler = snap => {
    const container = document.getElementById("messages");
    container.innerHTML = "";
    let lastDate = "";

    snap.forEach(child => {
      const msg = { ...child.val(), id: child.key };

      // Date divider
      const msgDate = new Date(msg.timestamp).toDateString();
      if (msgDate !== lastDate) {
        lastDate = msgDate;
        const div = document.createElement("div");
        div.className = "date-divider";
        div.innerHTML = `<span>${formatDate(msg.timestamp)}</span>`;
        container.appendChild(div);
      }

      // Unread tracking
      if (msg.sender !== currentUser.displayName && !msg.read) {
        msgsRef.child(chatId).child(child.key).update({ read: true });
      }

      renderMessage(msg, chatId);
    });

    container.scrollTop = container.scrollHeight;
  };

  activeListeners.messages = handler;
  msgsRef.child(chatId).on("value", handler);
}

// ===== RENDER MESSAGE =====
function renderMessage(msg, chatId) {
  const container = document.getElementById("messages");
  const isOut = msg.sender === currentUser.displayName;

  const wrap = document.createElement("div");
  wrap.className = `msg-wrap ${isOut ? "out" : "in"}`;
  wrap.dataset.id = msg.id;
  wrap.dataset.text = (msg.text || "").toLowerCase();

  // Admin name label in group view
  if (!isOut && isAdmin) {
    const sender = document.createElement("div");
    sender.className = "msg-sender";
    sender.textContent = msg.sender;
    wrap.appendChild(sender);
  }

  // Hover actions
  const actions = document.createElement("div");
  actions.className = "msg-actions";
  actions.innerHTML = `
    <button onclick="replyToMsg('${msg.id}', '${escHtml(msg.text || "📷 Photo")}')" title="Reply">↩️</button>
    <button onclick="addReaction('${chatId}','${msg.id}')" title="React">😊</button>
    <button onclick="copyMsg('${escHtml(msg.text || "")}')" title="Copy">📋</button>
    ${isOut || isAdmin ? `<button onclick="deleteMsg('${chatId}','${msg.id}')" title="Delete">🗑️</button>` : ""}
  `;
  wrap.appendChild(actions);

  // Bubble
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.id = `bubble-${msg.id}`;

  // Reply ref
  if (msg.replyTo) {
    bubble.innerHTML += `<div class="reply-ref">↩ ${escHtml(msg.replyTo)}</div>`;
  }

  if (msg.image) {
    bubble.innerHTML += `<img src="${msg.image}" alt="photo" onclick="openImageFull('${msg.image}')"/>`;
  } else {
    bubble.innerHTML += `<span>${escHtml(msg.text)}</span>`;
  }

  wrap.appendChild(bubble);

  // Meta
  const meta = document.createElement("div");
  meta.className = "msg-meta";
  meta.innerHTML = `
    <span class="time">${formatTime(msg.timestamp)}</span>
    ${isOut ? `<span class="ticks ${msg.read ? "read" : ""}">✓✓</span>` : ""}
  `;
  wrap.appendChild(meta);

  // Reactions
  const reactDiv = document.createElement("div");
  reactDiv.className = "reactions";
  reactDiv.id = `reactions-${msg.id}`;
  wrap.appendChild(reactDiv);

  container.appendChild(wrap);

  // Load reactions live
  reactRef.child(chatId).child(msg.id).on("value", snap => {
    reactDiv.innerHTML = "";
    const counts = {};
    snap.forEach(r => { const v = r.val(); counts[v] = (counts[v] || 0) + 1; });
    Object.entries(counts).forEach(([emoji, count]) => {
      const chip = document.createElement("span");
      chip.className = "react-chip";
      chip.textContent = `${emoji} ${count}`;
      chip.title = "React";
      reactDiv.appendChild(chip);
    });
  });
}

// ===== SEND MESSAGE =====
document.getElementById("sendMessage").addEventListener("click", sendMsg);
document.getElementById("messageInput").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); }
});

function sendMsg() {
  const text = document.getElementById("messageInput").value.trim();
  if (!text || !currentChatUser) return;

  const chatId = getChatId(currentUser, currentChatUser);
  const payload = {
    text,
    sender: currentUser.displayName,
    timestamp: Date.now(),
    read: false
  };

  if (replyTo) { payload.replyTo = replyTo; cancelReply(); }

  msgsRef.child(chatId).push(payload);
  document.getElementById("messageInput").value = "";
  typingRef.child(currentUser.displayName).set({ to: currentChatUser.displayName, isTyping: false });
  renderContacts();
}

// ===== IMAGE MESSAGE =====
function triggerImageUpload() {
  document.getElementById("imageUpload").click();
}

function sendImageMessage(input) {
  const file = input.files[0];
  if (!file || !currentChatUser) return;

  const reader = new FileReader();
  reader.onload = e => {
    const chatId = getChatId(currentUser, currentChatUser);
    msgsRef.child(chatId).push({
      image: e.target.result,
      sender: currentUser.displayName,
      timestamp: Date.now(),
      read: false
    });
    renderContacts();
  };
  reader.readAsDataURL(file);
  input.value = "";
}

function openImageFull(src) {
  const overlay = document.createElement("div");
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;`;
  overlay.innerHTML = `<img src="${src}" style="max-width:90vw;max-height:90vh;border-radius:12px;"/>`;
  overlay.onclick = () => document.body.removeChild(overlay);
  document.body.appendChild(overlay);
}

// ===== TYPING =====
document.getElementById("messageInput").addEventListener("input", () => {
  if (!currentChatUser) return;
  typingRef.child(currentUser.displayName).set({ to: currentChatUser.displayName, isTyping: true });
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    typingRef.child(currentUser.displayName).set({ to: currentChatUser.displayName, isTyping: false });
  }, 2000);
});

let typingEl = null;

function showTypingIndicator() {
  if (typingEl) return;
  typingEl = document.createElement("div");
  typingEl.className = "typing-indicator";
  typingEl.id = "typingEl";
  typingEl.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
  document.getElementById("messages").appendChild(typingEl);
  document.getElementById("messages").scrollTop = document.getElementById("messages").scrollHeight;
}

function hideTypingIndicator() {
  if (typingEl) { typingEl.remove(); typingEl = null; }
}

// ===== SEARCH =====
function openSearch() {
  const box = document.getElementById("searchBox");
  box.style.display = box.style.display === "flex" ? "none" : "flex";
  if (box.style.display === "flex") document.getElementById("searchInput").focus();
}

function closeSearch() {
  document.getElementById("searchBox").style.display = "none";
  document.querySelectorAll(".bubble").forEach(b => b.classList.remove("highlight"));
  searchMatches = []; searchIdx = -1;
  document.getElementById("searchCount").textContent = "";
}

document.getElementById("searchInput").addEventListener("input", () => {
  const q = document.getElementById("searchInput").value.toLowerCase().trim();
  searchMatches = [];
  searchIdx = -1;

  document.querySelectorAll(".msg-wrap").forEach(wrap => {
    wrap.querySelector(".bubble").classList.remove("highlight");
    if (q && wrap.dataset.text && wrap.dataset.text.includes(q)) {
      searchMatches.push(wrap);
    }
  });

  document.getElementById("searchCount").textContent =
    q ? `${searchMatches.length} found` : "";

  if (searchMatches.length > 0) { searchIdx = 0; highlightMatch(); }
});

function searchMessage(dir) {
  if (searchMatches.length === 0) return;
  if (dir === "next") searchIdx = (searchIdx + 1) % searchMatches.length;
  else searchIdx = (searchIdx - 1 + searchMatches.length) % searchMatches.length;
  highlightMatch();
}

function highlightMatch() {
  document.querySelectorAll(".bubble").forEach(b => b.classList.remove("highlight"));
  if (searchMatches[searchIdx]) {
    const bubble = searchMatches[searchIdx].querySelector(".bubble");
    bubble.classList.add("highlight");
    bubble.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById("searchCount").textContent = `${searchIdx + 1} / ${searchMatches.length}`;
  }
}

// ===== REPLY =====
function replyToMsg(id, text) {
  replyTo = text;
  document.getElementById("replyText").textContent = text;
  document.getElementById("replyPreview").style.display = "flex";
  document.getElementById("messageInput").focus();
}

function cancelReply() {
  replyTo = null;
  document.getElementById("replyPreview").style.display = "none";
}

// ===== REACTIONS =====
function addReaction(chatId, msgId) {
  const picker = document.createElement("div");
  picker.style.cssText = `
    position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
    background:var(--surface); border:1px solid var(--border); border-radius:20px;
    padding:10px 14px; display:flex; flex-wrap:wrap; gap:6px; z-index:999;
    max-width:300px; box-shadow:var(--shadow);
  `;
  ["❤️","😂","😮","😢","👍","👎","🔥","🎉"].forEach(emoji => {
    const btn = document.createElement("span");
    btn.textContent = emoji;
    btn.style.cssText = "font-size:24px; cursor:pointer; padding:4px;";
    btn.onclick = () => {
      reactRef.child(chatId).child(msgId).child(currentUser.displayName).set(emoji);
      document.body.removeChild(picker);
    };
    picker.appendChild(btn);
  });
  const close = document.createElement("span");
  close.textContent = "✕";
  close.style.cssText = "font-size:16px; cursor:pointer; color:var(--text3); align-self:center; margin-left:6px;";
  close.onclick = () => document.body.removeChild(picker);
  picker.appendChild(close);
  document.body.appendChild(picker);
}

// ===== DELETE MESSAGE =====
function deleteMsg(chatId, msgId) {
  if (!confirm("Delete this message?")) return;
  msgsRef.child(chatId).child(msgId).remove();
  reactRef.child(chatId).child(msgId).remove();
  showToast("Message deleted");
}

// ===== COPY MESSAGE =====
function copyMsg(text) {
  navigator.clipboard.writeText(text).then(() => showToast("✅ Copied!"));
}

// ===== MUTE =====
function toggleMute() {
  isMuted = !isMuted;
  const btn = document.getElementById("muteBtn");
  btn.innerHTML = isMuted ? '<i class="fas fa-bell-slash"></i>' : '<i class="fas fa-bell"></i>';
  showToast(isMuted ? "🔕 Muted" : "🔔 Unmuted");
}

// ===== CLEAR CHAT =====
function clearChat() {
  if (!currentChatUser) return;
  if (!confirm("Clear entire chat? This cannot be undone.")) return;
  const chatId = getChatId(currentUser, currentChatUser);
  msgsRef.child(chatId).remove();
  reactRef.child(chatId).remove();
  showToast("🧹 Chat cleared");
}

// ===== EXPORT CHAT =====
function exportChat() {
  if (!currentChatUser) return;
  const msgs = document.querySelectorAll(".msg-wrap");
  let text = `AuraChat Export — ${currentUser.displayName} & ${currentChatUser.displayName}\n`;
  text += `Exported: ${new Date().toLocaleString()}\n${"─".repeat(40)}\n\n`;
  msgs.forEach(w => {
    const isOut = w.classList.contains("out");
    const who   = isOut ? currentUser.displayName : currentChatUser.displayName;
    const time  = w.querySelector(".time")?.textContent || "";
    const msg   = w.querySelector(".bubble span")?.textContent || "[📷 Photo]";
    text += `[${time}] ${who}: ${msg}\n`;
  });
  const blob = new Blob([text], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `chat-${currentChatUser.displayName}.txt`; a.click();
  URL.revokeObjectURL(url);
  showToast("📥 Chat exported");
}

// ===== COPY LAST MESSAGE =====
function copyLastMessage() {
  const msgs = document.querySelectorAll(".msg-wrap");
  if (!msgs.length) return;
  const last = msgs[msgs.length - 1];
  const text = last.querySelector(".bubble span")?.textContent || "";
  if (text) copyMsg(text);
}

// ===== VIEW PROFILE (partner) =====
function viewProfile() {
  if (!currentChatUser) return;
  document.getElementById("modalAvatar").src = currentChatUser.photoURL || `https://api.dicebear.com/7.x/thumbs/svg?seed=${currentChatUser.displayName}`;
  document.getElementById("modalName").textContent = currentChatUser.displayName;
  document.getElementById("modalRole").textContent = currentChatUser.role === "admin" ? "🛡️ Admin" : "👤 User";

  statusRef.child(currentChatUser.displayName).get().then(snap => {
    const st = snap.val() || {};
    document.getElementById("modalStatus").textContent = st.status || (st.online ? "🟢 Online" : "🔴 Offline");
  });

  document.getElementById("modalJoined").textContent =
    currentChatUser.joinedAt ? `Joined: ${new Date(currentChatUser.joinedAt).toLocaleDateString()}` : "";

  document.getElementById("profileModal").style.display = "flex";
}

// ===== MY PROFILE =====
function openMyProfile() {
  document.getElementById("modalAvatar").src = currentUser.photoURL;
  document.getElementById("modalName").textContent = currentUser.displayName;
  document.getElementById("modalRole").textContent = isAdmin ? "🛡️ Admin" : "👤 User";
  document.getElementById("modalStatus").textContent = document.getElementById("myStatusText").textContent;
  document.getElementById("modalJoined").textContent =
    currentUser.joinedAt ? `Joined: ${new Date(currentUser.joinedAt).toLocaleDateString()}` : "";
  document.getElementById("profileModal").style.display = "flex";
  closeDropdowns();
}

// ===== STATUS =====
function setMyStatus() { document.getElementById("statusModal").style.display = "flex"; closeDropdowns(); }

function saveStatus(status) {
  document.getElementById("myStatusText").textContent = status;
  statusRef.child(currentUser.displayName).update({ status });
  usersRef.child(currentUser.displayName).update({ status });
  closeModal("statusModal");
  showToast("✅ Status updated");
}

function saveCustomStatus() {
  const s = document.getElementById("customStatus").value.trim();
  if (s) saveStatus(s);
}

// ===== ADMIN ACTIONS =====
function adminDeleteUser() {
  if (!currentChatUser) return showToast("Select a user first");
  if (!confirm(`Delete ${currentChatUser.displayName}?`)) return;
  usersRef.child(currentChatUser.displayName).remove();
  msgsRef.get().then(snap => {
    const updates = {};
    snap.forEach(s => { if (s.key.includes(currentChatUser.displayName)) updates[s.key] = null; });
    msgsRef.update(updates);
  });
  document.getElementById("messages").innerHTML = "";
  currentChatUser = null;
  document.getElementById("chatHeader").style.display   = "none";
  document.getElementById("emptyState").style.display   = "flex";
  document.getElementById("composer").style.display     = "none";
  showToast("🗑️ User deleted");
}

function adminUnsend() {
  if (!currentChatUser) return showToast("Select a chat first");
  const chatId = getChatId(currentUser, currentChatUser);
  msgsRef.child(chatId).limitToLast(1).get().then(snap => {
    snap.forEach(child => {
      if (child.val().sender === currentUser.displayName || isAdmin) {
        msgsRef.child(chatId).child(child.key).remove();
        showToast("⛔ Message unsent");
      }
    });
  });
}

function adminBroadcast() {
  document.getElementById("broadcastModal").style.display = "flex";
}

function sendBroadcast() {
  const text = document.getElementById("broadcastText").value.trim();
  if (!text) return showToast("Enter a message");

  usersRef.get().then(snap => {
    snap.forEach(child => {
      const u = child.val();
      if (u.displayName === currentUser.displayName) return;
      const chatId = getChatId2(currentUser.displayName, u.displayName);
      msgsRef.child(chatId).push({
        text: `📢 Broadcast: ${text}`,
        sender: currentUser.displayName,
        timestamp: Date.now(),
        read: false
      });
    });
    showToast("📢 Broadcast sent!");
    closeModal("broadcastModal");
    document.getElementById("broadcastText").value = "";
  });
}

// ===== BROADCAST LISTENER (for users) =====
function listenBroadcasts() {
  if (isAdmin) return;
  usersRef.get().then(snap => {
    snap.forEach(child => {
      const u = child.val();
      if (u.role !== "admin") return;
      const chatId = getChatId2(currentUser.displayName, u.displayName);
      msgsRef.child(chatId).on("child_added", snap => {
        const msg = snap.val();
        if (msg.sender !== currentUser.displayName && !isMuted) {
          if (!currentChatUser || currentChatUser.displayName !== msg.sender) {
            unreadCounts[msg.sender] = (unreadCounts[msg.sender] || 0) + 1;
            renderContacts();
            showToast(`💬 ${msg.sender}: ${msg.text?.slice(0, 30) || "Photo"}`);
          }
        }
      });
    });
  });
}

// ===== DARK / LIGHT TOGGLE =====
document.getElementById("toggleDark").addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  const isLight = document.body.classList.contains("light-mode");
  document.getElementById("toggleDark").innerHTML = isLight
    ? '<i class="fas fa-moon"></i>'
    : '<i class="fas fa-sun"></i>';
  showToast(isLight ? "☀️ Light mode" : "🌙 Dark mode");
});

// ===== EDIT NAME =====
document.getElementById("editNameTrigger").addEventListener("click", () => {
  const box = document.getElementById("editNameBox");
  box.style.display = box.style.display === "flex" ? "none" : "flex";
  closeDropdowns();
});

document.getElementById("saveNameBtn").addEventListener("click", async () => {
  const newName = document.getElementById("newNameInput").value.trim();
  const old = currentUser.displayName;
  if (!newName || newName === old) return showToast("Enter a new name");
  if ((await usersRef.child(newName).get()).exists()) return showToast("Name already taken");

  await usersRef.child(newName).set({ ...currentUser, displayName: newName });
  await usersRef.child(old).remove();

  const allMsgs = await msgsRef.get();
  const updates = {};
  allMsgs.forEach(snap => {
    if (snap.key.includes(old)) {
      const newKey = snap.key.replace(old, newName).split("__").sort().join("__");
      updates[newKey] = snap.val();
      updates[snap.key] = null;
    }
  });
  await msgsRef.update(updates);

  currentUser.displayName = newName;
  document.getElementById("currentUserName").textContent = newName;
  document.getElementById("editNameBox").style.display = "none";
  document.getElementById("newNameInput").value = "";
  showToast("✅ Name updated");
  loadUsers();
});

// ===== SETTINGS DROPDOWN =====
document.getElementById("settingsBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  const menu = document.getElementById("settingsMenu");
  menu.classList.toggle("open");
});

document.addEventListener("click", closeDropdowns);

function closeDropdowns() {
  document.querySelectorAll(".dropdown-menu").forEach(m => m.classList.remove("open"));
}

// ===== BACK BUTTON (mobile) =====
document.getElementById("backToContactsBtn").addEventListener("click", () => {
  document.getElementById("chatInterface").classList.remove("mobile-chat");
});

// ===== EMOJI PICKER =====
function initEmojiPicker() {
  const grid = document.getElementById("emojiGrid");
  EMOJIS.forEach(e => {
    const span = document.createElement("span");
    span.textContent = e;
    span.onclick = () => {
      document.getElementById("messageInput").value += e;
      document.getElementById("messageInput").focus();
    };
    grid.appendChild(span);
  });
}

function toggleEmojiPicker() {
  document.getElementById("emojiPicker").classList.toggle("open");
}

document.addEventListener("click", e => {
  if (!e.target.closest(".emoji-btn") && !e.target.closest(".emoji-picker")) {
    document.getElementById("emojiPicker").classList.remove("open");
  }
});

// ===== OPEN SETTINGS =====
function openSettings() {
  document.getElementById("settingsMenu").classList.toggle("open");
}

// ===== LOGOUT =====
function logout() {
  if (!confirm("Logout?")) return;
  statusRef.child(currentUser.displayName).set({ online: false, lastSeen: Date.now() });
  typingRef.child(currentUser.displayName).remove();
  location.reload();
}

// ===== MODAL HELPERS =====
function closeModal(id) { document.getElementById(id).style.display = "none"; }

document.querySelectorAll(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", e => {
    if (e.target === overlay) overlay.style.display = "none";
  });
});

// ===== TOAST =====
let toastTimeout;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove("show"), 3000);
}

// ===== UTILS =====
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function escHtml(str) {
  if (!str) return "";
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}