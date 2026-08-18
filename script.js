// Sure Plug - Freemium with Naira payments + manual WhatsApp verification

const STORAGE_KEY = 'sureplug_listings';
const PREMIUM_KEY = 'sureplug_premium';

// Unlock codes (give these to users after you verify their payment on WhatsApp)
const UNLOCK_CODES = {
  'WEEK3000':    { hours: 24 * 7,     label: '1 Week' },
  'MONTH5000':   { hours: 24 * 30,    label: '1 Month' },
  'LIFETIME10K': { hours: 24 * 365 * 10, label: 'Lifetime' }
};

// Your WhatsApp (no +)
const WHATSAPP_NUMBER = '2348105275986';

// Seed data
const SEED = [
  {
    id: 1,
    name: "Maya",
    age: 27,
    looking: "men",
    vibe: "chill",
    location: "Downtown",
    message: "Just got off work. Looking for someone to share a bottle of wine and whatever happens after.",
    time: Date.now() - 1000 * 60 * 45,
    blocked: false
  },
  {
    id: 2,
    name: "Jordan",
    age: 31,
    looking: "women",
    vibe: "wild",
    location: "East Side",
    message: "In town for one night. Hotel room already booked. Prefer someone who knows what they want.",
    time: Date.now() - 1000 * 60 * 20,
    blocked: false
  },
  {
    id: 3,
    name: "Sam & Riley",
    age: 29,
    looking: "couples",
    vibe: "discreet",
    location: "West End",
    message: "Couple looking for another couple or adventurous single. Very selective, very private.",
    time: Date.now() - 1000 * 60 * 90,
    blocked: false
  },
  {
    id: 4,
    name: "Alex",
    age: 24,
    looking: "anyone",
    vibe: "chill",
    location: "Midtown",
    message: "New in the city. Down for drinks and seeing where the night goes. No pressure.",
    time: Date.now() - 1000 * 60 * 15,
    blocked: false
  }
];

// ---------- Premium helpers ----------
function isPremium() {
  const data = localStorage.getItem(PREMIUM_KEY);
  if (!data) return false;
  const { expires } = JSON.parse(data);
  return Date.now() < expires;
}

function setPremium(hours) {
  const expires = Date.now() + hours * 60 * 60 * 1000;
  localStorage.setItem(PREMIUM_KEY, JSON.stringify({ expires }));
  updatePremiumUI();
}

function updatePremiumUI() {
  const btn = document.getElementById('premium-status');
  if (isPremium()) {
    btn.textContent = 'Premium ✓';
    btn.classList.add('is-premium');
  } else {
    btn.textContent = 'Upgrade';
    btn.classList.remove('is-premium');
  }
}

// ---------- Listings helpers ----------
function getListings() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
    return [...SEED];
  }
  return JSON.parse(raw);
}

function saveListings(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function timeAgo(ts) {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ---------- Render cards ----------
function renderCards() {
  const container = document.getElementById('cards');
  const lookingFilter = document.getElementById('filter-looking').value;
  const vibeFilter = document.getElementById('filter-vibe').value;

  let listings = getListings().filter(l => !l.blocked);
  listings.sort((a, b) => b.time - a.time);

  if (lookingFilter !== 'all') {
    listings = listings.filter(l => l.looking === lookingFilter || l.looking === 'anyone');
  }
  if (vibeFilter !== 'all') {
    listings = listings.filter(l => l.vibe === vibeFilter);
  }

  if (listings.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <p>No listings match right now.</p>
        <p style="font-size:0.9rem">Be the first to post for tonight.</p>
      </div>`;
    return;
  }

  const premium = isPremium();

  container.innerHTML = listings.map(l => `
    <article class="card">
      <div class="card-header">
        <div>
          <div class="card-name">${escapeHtml(l.name)}, ${l.age}</div>
          <div class="card-meta">${escapeHtml(l.location)}</div>
        </div>
        <span class="badge ${l.vibe}">${capitalize(l.vibe)}</span>
      </div>
      <p class="card-message">${escapeHtml(l.message)}</p>
      <div class="card-footer">
        <span class="card-looking">Looking for ${l.looking}</span>
        <span>${timeAgo(l.time)}</span>
      </div>
      <div class="card-actions">
        ${premium 
          ? `<button class="msg-btn" data-name="${escapeHtml(l.name)}" data-id="${l.id}">
               💬 Message
             </button>`
          : `<button class="msg-btn locked" data-locked="true">
               <span class="lock">🔒</span> Message
             </button>`
        }
      </div>
    </article>
  `).join('');

  container.querySelectorAll('.msg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.locked) {
        openLockedModal();
      } else {
        openChat(btn.dataset.name);
      }
    });
  });
}

// ---------- Navigation ----------
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    btn.classList.add('active');
    const view = btn.dataset.view;
    document.getElementById(`${view}-view`).classList.add('active');
  });
});

// ---------- Filters ----------
document.getElementById('filter-looking').addEventListener('change', renderCards);
document.getElementById('filter-vibe').addEventListener('change', renderCards);

// ---------- Post form ----------
document.getElementById('post-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const listing = {
    id: Date.now(),
    name: document.getElementById('name').value.trim(),
    age: parseInt(document.getElementById('age').value, 10),
    looking: document.getElementById('looking').value,
    vibe: document.getElementById('vibe').value,
    location: document.getElementById('location').value.trim(),
    message: document.getElementById('message').value.trim(),
    time: Date.now(),
    blocked: false
  };

  if (listing.age < 18) {
    showToast("You must be 18+");
    return;
  }

  const listings = getListings();
  listings.push(listing);
  saveListings(listings);

  e.target.reset();
  document.querySelector('[data-view="browse"]').click();
  renderCards();
  showToast("Posted for tonight 🔥", true);
});

// ---------- Pricing selection ----------
let selectedPlan = 'month';
let selectedPrice = 5000;
let selectedLabel = '1 Month';

document.querySelectorAll('.price-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.price-option').forEach(o => o.classList.remove('recommended'));
    opt.classList.add('recommended');
    selectedPlan = opt.dataset.plan;
    selectedPrice = parseInt(opt.dataset.price, 10);
    selectedLabel = opt.dataset.label;
    updateWhatsAppLink();
  });
});

function updateWhatsAppLink() {
  const message = encodeURIComponent(
    `Hi! I just paid ₦${selectedPrice.toLocaleString()} for *${selectedLabel}* Premium on Sure Plug.\n\nPlease verify my payment and send me the unlock code.\n\nThank you!`
  );
  const btn = document.getElementById('whatsapp-btn');
  btn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
}

// ---------- Redeem unlock code ----------
document.getElementById('redeem-btn').addEventListener('click', () => {
  const input = document.getElementById('unlock-code');
  const code = input.value.trim().toUpperCase();

  if (!code) {
    showToast("Enter a code first");
    return;
  }

  const plan = UNLOCK_CODES[code];
  if (!plan) {
    showToast("Invalid code. Check with admin.");
    return;
  }

  setPremium(plan.hours);
  input.value = '';
  showToast(`Unlocked: ${plan.label} 🎉`, true);

  document.querySelector('[data-view="browse"]').click();
  renderCards();
});

// ---------- Locked modal ----------
function openLockedModal() {
  document.getElementById('locked-modal').classList.remove('hidden');
}

document.getElementById('close-locked').addEventListener('click', () => {
  document.getElementById('locked-modal').classList.add('hidden');
});

document.getElementById('go-upgrade').addEventListener('click', () => {
  document.getElementById('locked-modal').classList.add('hidden');
  document.querySelector('[data-view="upgrade"]').click();
});

// ---------- Chat modal ----------
function openChat(name) {
  document.getElementById('chat-with').textContent = name;
  document.getElementById('chat-messages').innerHTML = `
    <div class="msg them">Hey 👋 saw your listing. Still free tonight?</div>
  `;
  document.getElementById('chat-input').value = '';
  document.getElementById('chat-modal').classList.remove('hidden');
}

document.getElementById('close-chat').addEventListener('click', () => {
  document.getElementById('chat-modal').classList.add('hidden');
});

document.getElementById('send-chat').addEventListener('click', sendMessage);
document.getElementById('chat-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  const messages = document.getElementById('chat-messages');
  messages.innerHTML += `<div class="msg me">${escapeHtml(text)}</div>`;
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  setTimeout(() => {
    const replies = [
      "Nice, where are you at?",
      "Sounds good 😏",
      "I'm free in about an hour",
      "Send me your number?",
      "What are you into?"
    ];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    messages.innerHTML += `<div class="msg them">${reply}</div>`;
    messages.scrollTop = messages.scrollHeight;
  }, 800 + Math.random() * 1200);
}

// ---------- Toast ----------
function showToast(msg, success = false) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.toggle('success', success);
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ---------- Init ----------
updatePremiumUI();
updateWhatsAppLink();
renderCards();
