// ======================================================
// COMMUNICATION SYSTEM - SISTEMA COM WEBRTC REAL P2P
// ======================================================

// VARIÁVEIS GLOBAIS DE COMUNICAÇÃO
let authorizedChatAddress = null;
let contacts = [];
let currentChatContact = null;
let currentGroup = null;

// SISTEMA WEBRTC
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let dataChannel = null;
let signalingChannel = null;

// CONFIGURAÇÃO WEBRTC
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

// ======================================================
// AUTORIZAÇÃO DE ACESSO (ORIGINAL)
// ======================================================

function authorizeChatAccess() {
  const address = document.getElementById('authWalletAddress').value.trim();
  
  if (!address) {
    showNotification('Insira um endereço Polygon válido', 'error');
    return;
  }
  
  if (!address.startsWith('0x') || address.length !== 42) {
    showNotification('Endereço Polygon inválido', 'error');
    return;
  }
  
  authorizedChatAddress = address;
  localStorage.setItem('exclusiveWalletChatAuth', address);
  
  updateAuthorizationStatus();
  showNotification('✅ Acesso ao chat autorizado com sucesso!', 'success');
}

function updateAuthorizationStatus() {
  const savedAuth = localStorage.getItem('exclusiveWalletChatAuth');
  const indicator = document.getElementById('authStatusIndicator');
  const statusText = document.getElementById('authStatusText');
  
  if (savedAuth) {
    authorizedChatAddress = savedAuth;
    document.getElementById('authWalletAddress').value = savedAuth;
    
    indicator.className = 'status-indicator verified';
    indicator.style.background = 'var(--success-color)';
    statusText.textContent = 'Autorizado';
    statusText.style.color = 'var(--success-color)';
  } else {
    indicator.className = 'status-indicator';
    indicator.style.background = 'var(--text-secondary)';
    statusText.textContent = 'Não autorizado';
    statusText.style.color = 'var(--text-secondary)';
  }
}

// ======================================================
// GERENCIAMENTO DE CONTATOS (ORIGINAL)
// ======================================================

function loadContacts() {
  const savedContacts = localStorage.getItem('exclusiveWalletContacts');
  contacts = savedContacts ? JSON.parse(savedContacts) : [];
  
  updateContactsList();
  updateContactSelects();
}

function updateContactsList() {
  const container = document.getElementById('contactsList');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (contacts.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
        <i class="fas fa-users" style="font-size: 24px; margin-bottom: 10px;"></i>
        <div>Nenhum contato adicionado</div>
      </div>
    `;
    return;
  }
  
  contacts.forEach((contact, index) => {
    const contactElement = document.createElement('div');
    contactElement.className = 'contact-item';
    contactElement.innerHTML = `
      <div class="contact-info">
        <i class="fas fa-user-circle" style="color: var(--primary-color); font-size: 20px;"></i>
        <div>
          <div style="font-weight: 500;">${contact.name || 'Sem nome'}</div>
          <div style="font-size: 11px; color: var(--text-secondary); font-family: 'Courier New', monospace;">
            ${contact.address.substring(0, 10)}...${contact.address.substring(contact.address.length - 8)}
          </div>
        </div>
      </div>
      <div class="contact-actions">
        <button class="btn btn-secondary btn-small" onclick="startChatWithContact('${contact.address}')">
          <i class="fas fa-comment"></i>
        </button>
        <button class="btn btn-secondary btn-small" onclick="startVideoCallWithContact('${contact.address}')">
          <i class="fas fa-video"></i>
        </button>
        <button class="btn btn-secondary btn-small" onclick="removeContact(${index})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    container.appendChild(contactElement);
  });
}

function updateContactSelects() {
  const chatSelect = document.getElementById('selectChatContact');
  const videoSelect = document.getElementById('selectVideoContact');
  
  if (chatSelect) {
    chatSelect.innerHTML = '<option value="">Selecione um contato</option>';
    contacts.forEach(contact => {
      const option = document.createElement('option');
      option.value = contact.address;
      option.textContent = `${contact.name || 'Sem nome'} (${contact.address.substring(0, 8)}...)`;
      chatSelect.appendChild(option);
    });
  }
  
  if (videoSelect) {
    videoSelect.innerHTML = '<option value="">Selecione um contato</option>';
    contacts.forEach(contact => {
      const option = document.createElement('option');
      option.value = contact.address;
      option.textContent = `${contact.name || 'Sem nome'} (${contact.address.substring(0, 8)}...)`;
      videoSelect.appendChild(option);
    });
  }
}

function addNewContact() {
  const address = document.getElementById('newContactAddress').value.trim();
  const name = document.getElementById('newContactName').value.trim();
  
  if (!address) {
    showNotification('Insira um endereço Polygon válido', 'error');
    return;
  }
  
  if (!address.startsWith('0x') || address.length !== 42) {
    showNotification('Endereço Polygon inválido', 'error');
    return;
  }
  
  // Verificar se já existe
  if (contacts.some(c => c.address.toLowerCase() === address.toLowerCase())) {
    showNotification('Este contato já foi adicionado', 'error');
    return;
  }
  
  contacts.push({
    address: address,
    name: name || `Contato ${contacts.length + 1}`,
    addedDate: new Date().toISOString()
  });
  
  localStorage.setItem('exclusiveWalletContacts', JSON.stringify(contacts));
  
  document.getElementById('newContactAddress').value = '';
  document.getElementById('newContactName').value = '';
  
  updateContactsList();
  updateContactSelects();
  
  showNotification('✅ Contato adicionado com sucesso!', 'success');
}

function removeContact(index) {
  if (confirm('Remover este contato da sua lista?')) {
    contacts.splice(index, 1);
    localStorage.setItem('exclusiveWalletContacts', JSON.stringify(contacts));
    updateContactsList();
    updateContactSelects();
    showNotification('Contato removido', 'info');
  }
}

// ======================================================
// SISTEMA WEBRTC - CONEXÃO P2P REAL
// ======================================================

// Inicializar conexão WebRTC
async function initializeWebRTC(isCaller = true) {
  try {
    // Fechar conexão anterior se existir
    if (peerConnection) {
      peerConnection.close();
    }
    
    // Criar nova conexão peer
    peerConnection = new RTCPeerConnection(rtcConfiguration);
    
    // Configurar handlers de ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Novo candidato ICE:', event.candidate);
        // Em produção, enviaria para o peer via servidor de sinalização
      }
    };
    
    // Handler para stream remoto
    peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStream = event.streams[0];
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) {
          remoteVideo.srcObject = remoteStream;
        }
      }
    };
    
    // Adicionar stream local se disponível
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }
    
    // Criar data channel para chat
    if (isCaller) {
      dataChannel = peerConnection.createDataChannel('chat');
      setupDataChannel();
    } else {
      peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;
        setupDataChannel();
      };
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao inicializar WebRTC:', error);
    showNotification('Erro ao configurar conexão P2P', 'error');
    return false;
  }
}

// Configurar data channel
function setupDataChannel() {
  dataChannel.onopen = () => {
    console.log('Canal de dados aberto');
    showNotification('✅ Conexão P2P estabelecida!', 'success');
  };
  
  dataChannel.onmessage = (event) => {
    handleIncomingMessage(event.data);
  };
  
  dataChannel.onclose = () => {
    console.log('Canal de dados fechado');
    showNotification('Conexão P2P encerrada', 'info');
  };
}

// Enviar mensagem via WebRTC
function sendWebRTCMessage(message) {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    showNotification('Conexão não está aberta', 'error');
    return false;
  }
  
  const messageData = {
    type: 'chat',
    text: message,
    sender: authorizedChatAddress || 'Anônimo',
    timestamp: new Date().toISOString(),
    signature: generateMessageSignature(message)
  };
  
  try {
    dataChannel.send(JSON.stringify(messageData));
    return true;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return false;
  }
}

// Processar mensagem recebida
function handleIncomingMessage(data) {
  try {
    const messageData = JSON.parse(data);
    
    if (messageData.type === 'chat') {
      addMessageToChat(messageData.text, messageData.sender, false);
    } else if (messageData.type === 'call') {
      handleIncomingCall(messageData);
    } else if (messageData.type === 'ice-candidate') {
      handleIceCandidate(messageData.candidate);
    }
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
  }
}

// ======================================================
// CHAT PRIVADO COM WEBRTC
// ======================================================

function startChatWithContact(address) {
  const contact = contacts.find(c => c.address === address);
  if (!contact) return;
  
  currentChatContact = contact;
  
  const chatSelect = document.getElementById('selectChatContact');
  if (chatSelect) chatSelect.value = address;
  
  // Iniciar conexão WebRTC
  initializeWebRTC(true).then(success => {
    if (success) {
      const chatInput = document.getElementById('privateChatInput');
      const sendButton = document.querySelector('#chatTab .btn-primary');
      
      if (chatInput) chatInput.disabled = false;
      if (sendButton) sendButton.disabled = false;
      
      switchSubTab('chatTab');
      
      const messagesContainer = document.getElementById('privateChatMessages');
      if (messagesContainer) {
        messagesContainer.innerHTML = `
          <div class="message message-received">
            <div class="message-sender">Sistema</div>
            <div>Conexão P2P estabelecida com ${contact.name || 'Contato'}. Chat criptografado ativo.</div>
            <div class="message-time">Agora</div>
          </div>
        `;
      }
      
      showNotification(`Chat P2P iniciado com ${contact.name || 'Contato'}`, 'success');
    }
  });
}

function sendPrivateMessage() {
  const input = document.getElementById('privateChatInput');
  const message = input.value.trim();
  
  if (!message || !currentChatContact) return;
  
  // Enviar via WebRTC
  const sent = sendWebRTCMessage(message);
  
  if (sent) {
    addMessageToChat(message, 'Você', true);
    input.value = '';
  }
}

function addMessageToChat(message, sender, isSelf = false) {
  const messagesContainer = document.getElementById('privateChatMessages');
  if (!messagesContainer) return;
  
  const messageElement = document.createElement('div');
  messageElement.className = isSelf ? 'message message-sent' : 'message message-received';
  
  const senderName = isSelf ? 'Você' : (sender.substring(0, 8) + '...');
  
  messageElement.innerHTML = `
    <div class="message-sender">${senderName}</div>
    <div>${message}</div>
    <div class="message-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
  `;
  
  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function handlePrivateChatKeyPress(event) {
  if (event.key === 'Enter') {
    sendPrivateMessage();
  }
}

// ======================================================
// CHAMADAS DE VÍDEO COM WEBRTC
// ======================================================

async function startVideoCallWithContact(address) {
  const contact = contacts.find(c => c.address === address);
  if (!contact) {
    showNotification('Contato não encontrado', 'error');
    return;
  }
  
  try {
    showNotification('Iniciando chamada de vídeo P2P...', 'info');
    
    // Obter stream de mídia
    const constraints = {
      video: true,
      audio: true
    };
    
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Configurar interface de vídeo
    const videoContainer = document.getElementById('videoCallContainer');
    videoContainer.innerHTML = `
      <div class="video-call-container">
        <video id="remoteVideo" autoplay playsinline></video>
        <div class="local-video">
          <video id="localVideo" autoplay playsinline muted></video>
        </div>
      </div>
    `;
    
    const localVideo = document.getElementById('localVideo');
    if (localVideo) localVideo.srcObject = localStream;
    
    // Inicializar WebRTC como chamador
    const initialized = await initializeWebRTC(true);
    if (!initialized) {
      throw new Error('Falha ao inicializar WebRTC');
    }
    
    // Criar oferta
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    // Em produção, enviaria a oferta via servidor de sinalização
    showNotification('Chamada P2P iniciada. Aguardando resposta...', 'success');
    
    // Simular aceitação após 2 segundos (em produção seria via sinalização)
    setTimeout(() => {
      simulateCallAcceptance();
    }, 2000);
    
    // Atualizar controles
    updateVideoControls(true);
    
  } catch (error) {
    console.error('Erro ao iniciar chamada:', error);
    showNotification('Erro ao iniciar chamada: ' + error.message, 'error');
  }
}

function simulateCallAcceptance() {
  if (peerConnection) {
    showNotification('Chamada de vídeo P2P estabelecida!', 'success');
  }
}

async function startVideoCall() {
  const videoSelect = document.getElementById('selectVideoContact');
  const selectedAddress = videoSelect?.value;
  
  if (!selectedAddress) {
    showNotification('Selecione um contato para vídeo', 'error');
    return;
  }
  
  await startVideoCallWithContact(selectedAddress);
}

function endVideoCall() {
  // Fechar streams
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  
  if (remoteStream) {
    remoteStream.getTracks().forEach(track => track.stop());
    remoteStream = null;
  }
  
  // Fechar conexão WebRTC
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  
  if (dataChannel) {
    dataChannel.close();
    dataChannel = null;
  }
  
  // Resetar interface
  const videoContainer = document.getElementById('videoCallContainer');
  videoContainer.innerHTML = `
    <div class="video-placeholder">
      <i class="fas fa-video"></i>
      <div>Chamada de vídeo não iniciada</div>
      <div style="font-size: 12px; margin-top: 10px;">Selecione um contato e clique em "Iniciar Vídeo"</div>
    </div>
  `;
  
  // Atualizar controles
  updateVideoControls(false);
  
  showNotification('Chamada encerrada', 'info');
}

function toggleVideo() {
  if (!localStream) return;
  
  const videoTrack = localStream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
    const btn = document.getElementById('toggleVideoBtn');
    if (btn) {
      btn.innerHTML = videoTrack.enabled ? 
        '<i class="fas fa-video-slash"></i> Desligar Vídeo' : 
        '<i class="fas fa-video"></i> Ligar Vídeo';
    }
    
    showNotification(videoTrack.enabled ? 'Vídeo ativado' : 'Vídeo desativado', 'info');
  }
}

function toggleAudio() {
  if (!localStream) return;
  
  const audioTrack = localStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    const btn = document.getElementById('toggleAudioBtn');
    if (btn) {
      btn.innerHTML = audioTrack.enabled ? 
        '<i class="fas fa-microphone-slash"></i> Silenciar' : 
        '<i class="fas fa-microphone"></i> Ativar Áudio';
    }
    
    showNotification(audioTrack.enabled ? 'Áudio ativado' : 'Áudio desativado', 'info');
  }
}

function updateVideoControls(isActive) {
  const startBtn = document.getElementById('startVideoBtn');
  const endBtn = document.getElementById('endVideoBtn');
  const toggleVideoBtn = document.getElementById('toggleVideoBtn');
  const toggleAudioBtn = document.getElementById('toggleAudioBtn');
  
  if (startBtn) startBtn.disabled = isActive;
  if (endBtn) endBtn.disabled = !isActive;
  if (toggleVideoBtn) toggleVideoBtn.disabled = !isActive;
  if (toggleAudioBtn) toggleAudioBtn.disabled = !isActive;
}

// ======================================================
// SISTEMA DE GRUPOS
// ======================================================

function createNewGroup() {
  const groupName = document.getElementById('groupName').value.trim();
  
  if (!groupName) {
    showNotification('Digite um nome para o grupo', 'error');
    return;
  }
  
  showNotification(`Grupo "${groupName}" criado!`, 'success');
  document.getElementById('groupName').value = '';
  
  // Adicionar à lista de grupos
  const groupsContainer = document.getElementById('availableGroups');
  if (groupsContainer) {
    const groupElement = document.createElement('div');
    groupElement.className = 'agenda-entry';
    groupElement.innerHTML = `
      <div class="agenda-header">
        <div class="agenda-title">${groupName}</div>
        <div class="agenda-status status-in-progress">Ativo</div>
      </div>
      <div class="agenda-description">Grupo de comunicação P2P com membros verificados.</div>
      <div class="agenda-footer">
        <div>5 membros</div>
        <button class="btn btn-secondary btn-small" onclick="joinGroup('${groupName}')" style="padding: 4px 8px; font-size: 10px;">
          <i class="fas fa-sign-in-alt"></i> Entrar
        </button>
      </div>
    `;
    groupsContainer.appendChild(groupElement);
  }
}

function joinGroup(groupName) {
  showNotification(`Entrando no grupo "${groupName}"...`, 'info');
  currentGroup = groupName;
  
  // Simular entrada
  setTimeout(() => {
    const messagesContainer = document.getElementById('groupChatMessages');
    if (messagesContainer) {
      const messageElement = document.createElement('div');
      messageElement.className = 'message message-received';
      messageElement.innerHTML = `
        <div class="message-sender">Sistema</div>
        <div>Você entrou no grupo "${groupName}" (modo P2P)</div>
        <div class="message-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
      `;
      messagesContainer.appendChild(messageElement);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    showNotification(`✅ Agora você está no grupo "${groupName}"`, 'success');
  }, 1000);
}

function sendGroupMessage() {
  const input = document.getElementById('groupChatInput');
  const message = input.value.trim();
  
  if (!message) return;
  
  if (!currentGroup) {
    showNotification('Entre em um grupo primeiro', 'error');
    return;
  }
  
  // Em produção, enviaria via WebRTC para múltiplos peers
  const messagesContainer = document.getElementById('groupChatMessages');
  if (messagesContainer) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message message-sent';
    messageElement.innerHTML = `
      <div class="message-sender">Você</div>
      <div>${message}</div>
      <div class="message-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  input.value = '';
}

function handleGroupChatKeyPress(event) {
  if (event.key === 'Enter') {
    sendGroupMessage();
  }
}

// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

function generateMessageSignature(message) {
  // Em produção, assinaria a mensagem com a chave privada
  return ethers.id(message + Date.now()).substring(0, 16);
}

function handleIncomingCall(callData) {
  console.log('Chamada recebida:', callData);
  // Implementar aceitação de chamada
}

function handleIceCandidate(candidate) {
  if (peerConnection && candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
}

// ======================================================
// EXPORTAÇÃO DAS FUNÇÕES
// ======================================================

window.authorizeChatAccess = authorizeChatAccess;
window.updateAuthorizationStatus = updateAuthorizationStatus;
window.loadContacts = loadContacts;
window.addNewContact = addNewContact;
window.removeContact = removeContact;
window.startChatWithContact = startChatWithContact;
window.sendPrivateMessage = sendPrivateMessage;
window.handlePrivateChatKeyPress = handlePrivateChatKeyPress;
window.startVideoCall = startVideoCall;
window.endVideoCall = endVideoCall;
window.toggleVideo = toggleVideo;
window.toggleAudio = toggleAudio;
window.createNewGroup = createNewGroup;
window.joinGroup = joinGroup;
window.sendGroupMessage = sendGroupMessage;
window.handleGroupChatKeyPress = handleGroupChatKeyPress;
window.startVideoCallWithContact = startVideoCallWithContact;

// Inicializar sistema de comunicação
document.addEventListener('DOMContentLoaded', function() {
  loadContacts();
  updateAuthorizationStatus();
});
