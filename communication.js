// ======================================================
// COMMUNICATION TAB – LOGIC FILE
// ======================================================

// -------------------- STATE --------------------
let authorizedChatAddress = null;
let contacts = [];
let currentChatContact = null;
let webrtc = null;

// -------------------- AUTH --------------------
window.authorizeChatAccess = function () {
  const input = document.getElementById('authWalletAddress');
  const address = input.value.trim();

  if (!address.startsWith('0x') || address.length !== 42) {
    alert('Endereço inválido');
    return;
  }

  authorizedChatAddress = address;
  localStorage.setItem('exclusiveWalletChatAuth', address);
};

// -------------------- CONTACTS --------------------
function loadContacts() {
  contacts = JSON.parse(localStorage.getItem('exclusiveWalletContacts') || '[]');
}

window.startChatWithContact = function (address) {
  currentChatContact = address;
  document.getElementById('privateChatInput').disabled = false;
  initWebRTC(true);
};

// -------------------- CHAT --------------------
window.sendPrivateMessage = function () {
  const input = document.getElementById('privateChatInput');
  const msg = input.value.trim();
  if (!msg || !webrtc) return;

  webrtc.send(msg);
  input.value = '';
};

// -------------------- WEBRTC --------------------
class WebRTC {
  constructor() {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    this.channel = null;

    this.pc.ondatachannel = e => {
      this.channel = e.channel;
      this.channel.onmessage = ev => {
        console.log('Mensagem recebida:', ev.data);
      };
    };
  }

  async initMedia() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach(t => this.pc.addTrack(t, stream));
    document.getElementById('localVideo').srcObject = stream;
  }

  createChannel() {
    this.channel = this.pc.createDataChannel('chat');
  }

  async createOffer() {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    console.log('SDP OFFER', JSON.stringify(offer));
  }

  send(msg) {
    if (this.channel?.readyState === 'open') {
      this.channel.send(msg);
    }
  }
}

async function initWebRTC(isCaller) {
  webrtc = new WebRTC();
  await webrtc.initMedia();

  if (isCaller) {
    webrtc.createChannel();
    await webrtc.createOffer();
  }
}

// -------------------- INIT --------------------
document.addEventListener('DOMContentLoaded', () => {
  loadContacts();
});
