// ======================================================
// SISTEMA DE COMUNICAÇÃO
// ======================================================

// Variáveis globais para comunicação
let authorizedChatAddress = null;
let contacts = [];
let currentChatContact = null;
let videoStream = null;
let peerConnection = null;
let groupVideoStream = null;

// Autorizar acesso ao chat
function authorizeChatAccess() {
  const authWalletAddressInput = document.getElementById('authWalletAddress');
  if (!authWalletAddressInput) return;
  
  const address = authWalletAddressInput.value.trim();
  
  if (!address) {
    showNotification('Insira um endereço Polygon válido', 'error');
    return;
  }
  
  if (!isValidEthereumAddress(address)) {
    showNotification('Endereço Polygon inválido', 'error');
    return;
  }
  
  authorizedChatAddress = address;
  saveToStorage('exclusiveWalletChatAuth', address);
  
  updateAuthorizationStatus();
  showNotification('✅ Acesso ao chat autorizado com sucesso!', 'success');
}

// Atualizar status de autorização
function updateAuthorizationStatus() {
  const savedAuth = loadFromStorage('exclusiveWalletChatAuth');
  const indicator = document.getElementById('authStatusIndicator');
  const statusText = document.getElementById('authStatusText');
  const authWalletAddressInput = document.getElementById('authWalletAddress');
  
  if (savedAuth) {
    authorizedChatAddress = savedAuth;
    if (authWalletAddressInput) authWalletAddressInput.value = savedAuth;
    
    if (indicator) {
      indicator.className = 'status-indicator verified';
      indicator.style.background = 'var(--success-color)';
    }
    if (statusText) {
      statusText.textContent = 'Autorizado';
      statusText.style.color = 'var(--success-color)';
    }
  } else {
    if (indicator) {
      indicator.className = 'status-indicator';
      indicator.style.background = 'var(--text-secondary)';
    }
    if (statusText) {
      statusText.textContent = 'Não autorizado';
      statusText.style.color = 'var(--text-secondary)';
    }
  }
}

// Carregar contatos
function loadContacts() {
  contacts = loadFromStorage('exclusiveWalletContacts', []);
  
  updateContactsList();
  updateContactSelects();
}

// Atualizar lista de contatos
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
            ${formatAddress(contact.address)}
          </div>
        </div>
      </div>
      <div class="contact-actions">
        <button class="btn btn-secondary btn-small" onclick="startChatWithContact('${contact.address}')">
          <i class="fas fa-comment"></i>
        </button>
        <button class="btn btn-secondary btn-small" onclick="removeContact(${index})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    container.appendChild(contactElement);
  });
}

// Atualizar selects de contatos
function updateContactSelects() {
  const chatSelect = document.getElementById('selectChatContact');
  const videoSelect = document.getElementById('selectVideoContact');
  
  if (chatSelect) {
    chatSelect.innerHTML = '<option value="">Selecione um contato Polygon para conversar</option>';
    contacts.forEach(contact => {
      const option = document.createElement('option');
      option.value = contact.address;
      option.textContent = `${contact.name || 'Sem nome'} (${formatAddress(contact.address, 8)})`;
      chatSelect.appendChild(option);
    });
  }
  
  if (videoSelect) {
    videoSelect.innerHTML = '<option value="">Selecione um contato Polygon para vídeo</option>';
    contacts.forEach(contact => {
      const option = document.createElement('option');
      option.value = contact.address;
      option.textContent = `${contact.name || 'Sem nome'} (${formatAddress(contact.address, 8)})`;
      videoSelect.appendChild(option);
    });
  }
}

// Adicionar novo contato
function addNewContact() {
  const newContactAddressInput = document.getElementById('newContactAddress');
  const newContactNameInput = document.getElementById('newContactName');
  
  if (!newContactAddressInput || !newContactNameInput) return;
  
  const address = newContactAddressInput.value.trim();
  const name = newContactNameInput.value.trim();
  
  if (!address) {
    showNotification('Insira um endereço Polygon válido', 'error');
    return;
  }
  
  if (!isValidEthereumAddress(address)) {
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
  
  saveToStorage('exclusiveWalletContacts', contacts);
  
  newContactAddressInput.value = '';
  newContactNameInput.value = '';
  
  updateContactsList();
  updateContactSelects();
  
  showNotification('✅ Contato Polygon adicionado com sucesso!', 'success');
}

// Remover contato
function removeContact(index) {
  if (confirm('Remover este contato da sua lista?')) {
    contacts.splice(index, 1);
    saveToStorage('exclusiveWalletContacts', contacts);
    updateContactsList();
    updateContactSelects();
    showNotification('Contato removido', 'info');
  }
}

// Iniciar chat com contato
function startChatWithContact(address) {
  const contact = contacts.find(c => c.address === address);
  if (!contact) return;
  
  currentChatContact = contact;
  
  const chatSelect = document.getElementById('selectChatContact');
  if (chatSelect) chatSelect.value = address;
  
  const chatInput = document.getElementById('privateChatInput');
  const sendButton = document.querySelector('#chatTab .btn-primary');
  
  if (chatInput) chatInput.disabled = false;
  if (sendButton) sendButton.disabled = false;
  
  if (typeof window.switchSubTab === 'function') {
    window.switchSubTab('chatTab');
  }
  
  const messagesContainer = document.getElementById('privateChatMessages');
  if (messagesContainer) {
    messagesContainer.innerHTML = `
      <div class="message message-received">
        <div class="message-sender">Sistema</div>
        <div>Conversa iniciada com ${contact.name || 'Contato'}. Digite sua mensagem abaixo.</div>
        <div class="message-time">Agora</div>
      </div>
    `;
  }
  
  showNotification(`Chat iniciado com ${contact.name || 'Contato'}`, 'success');
}

// Enviar mensagem privada
function sendPrivateMessage() {
  const input = document.getElementById('privateChatInput');
  if (!input) return;
  
  const message = input.value.trim();
  
  if (!message || !currentChatContact) return;
  
  const messagesContainer = document.getElementById('privateChatMessages');
  if (messagesContainer) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message message-sent';
    messageElement.innerHTML = `
      <div class="message-sender">Você</div>
      <div>${sanitizeInput(message)}</div>
      <div class="message-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  input.value = '';
  
  // Simular resposta (em produção, isso seria via WebRTC)
  setTimeout(() => {
    if (messagesContainer && currentChatContact) {
      const replyElement = document.createElement('div');
      replyElement.className = 'message message-received';
      replyElement.innerHTML = `
        <div class="message-sender">${currentChatContact.name || 'Contato'}</div>
        <div>Mensagem recebida na Polygon Network.</div>
        <div class="message-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
      `;
      messagesContainer.appendChild(replyElement);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, 1000);
}

// Tecla Enter no chat
function handlePrivateChatKeyPress(event) {
  if (event.key === 'Enter') {
    sendPrivateMessage();
  }
}

// Trocar sub-aba
function switchSubTab(subTabId) {
  document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.sub-tab-content').forEach(content => content.classList.add('hidden'));
  
  const activeBtn = document.querySelector(`.sub-tab-btn[data-subtab="${subTabId}"]`);
  const activeContent = document.getElementById(subTabId);
  
  if (activeBtn) activeBtn.classList.add('active');
  if (activeContent) activeContent.classList.remove('hidden');
}

// Iniciar chamada de vídeo
async function startVideoCall() {
  const videoSelect = document.getElementById('selectVideoContact');
  if (!videoSelect) return;
  
  const selectedAddress = videoSelect.value;
  
  if (!selectedAddress) {
    showNotification('Selecione um contato para vídeo', 'error');
    return;
  }
  
  const contact = contacts.find(c => c.address === selectedAddress);
  if (!contact) {
    showNotification('Contato não encontrado', 'error');
    return;
  }
  
  try {
    showNotification('Iniciando chamada de vídeo...', 'info');
    
    const constraints = {
      video: true,
      audio: true
    };
    
    videoStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    const videoContainer = document.getElementById('videoCallContainer');
    if (videoContainer) {
      videoContainer.innerHTML = `
        <div class="video-call-container">
          <video id="remoteVideo" autoplay playsinline></video>
          <div class="local-video">
            <video id="localVideo" autoplay playsinline muted></video>
          </div>
        </div>
      `;
      
      const localVideo = document.getElementById('localVideo');
      if (localVideo) localVideo.srcObject = videoStream;
    }
    
    // Simular vídeo remoto (em produção, isso seria via WebRTC)
    setTimeout(() => {
      showNotification(`Chamada de vídeo com ${contact.name || 'Contato'} estabelecida`, 'success');
    }, 2000);
    
    // Atualizar controles
    const startVideoBtn = document.getElementById('startVideoBtn');
    const endVideoBtn = document.getElementById('endVideoBtn');
    const toggleVideoBtn = document.getElementById('toggleVideoBtn');
    const toggleAudioBtn = document.getElementById('toggleAudioBtn');
    
    if (startVideoBtn) startVideoBtn.disabled = true;
    if (endVideoBtn) endVideoBtn.disabled = false;
    if (toggleVideoBtn) toggleVideoBtn.disabled = false;
    if (toggleAudioBtn) toggleAudioBtn.disabled = false;
    
  } catch (error) {
    console.error('Erro ao acessar câmera/microfone:', error);
    showNotification('Erro ao acessar câmera/microfone: ' + error.message, 'error');
  }
}

// Encerrar chamada de vídeo
function endVideoCall() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  
  const videoContainer = document.getElementById('videoCallContainer');
  if (videoContainer) {
    videoContainer.innerHTML = `
      <div class="video-placeholder">
        <i class="fas fa-video" style="color: var(--success-color);"></i>
        <div>Chamada encerrada</div>
        <div style="font-size: 12px; margin-top: 10px;">Selecione um contato para iniciar uma nova chamada</div>
      </div>
    `;
  }
  
  // Atualizar controles
  const startVideoBtn = document.getElementById('startVideoBtn');
  const endVideoBtn = document.getElementById('endVideoBtn');
  const toggleVideoBtn = document.getElementById('toggleVideoBtn');
  const toggleAudioBtn = document.getElementById('toggleAudioBtn');
  
  if (startVideoBtn) startVideoBtn.disabled = false;
  if (endVideoBtn) endVideoBtn.disabled = true;
  if (toggleVideoBtn) toggleVideoBtn.disabled = true;
  if (toggleAudioBtn) toggleAudioBtn.disabled = true;
  
  showNotification('Chamada de vídeo encerrada', 'info');
}

// Alternar vídeo
function toggleVideo() {
  if (!videoStream) return;
  
  const videoTrack = videoStream.getVideoTracks()[0];
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

// Alternar áudio
function toggleAudio() {
  if (!videoStream) return;
  
  const audioTrack = videoStream.getAudioTracks()[0];
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

// Enviar mensagem de grupo
function sendGroupMessage() {
  const input = document.getElementById('groupChatInput');
  if (!input) return;
  
  const message = input.value.trim();
  
  if (!message) return;
  
  const messagesContainer = document.getElementById('groupChatMessages');
  if (messagesContainer) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message message-sent';
    messageElement.innerHTML = `
      <div class="message-sender">Você</div>
      <div>${sanitizeInput(message)}</div>
      <div class="message-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  input.value = '';
  
  // Simular respostas (em produção, isso seria via WebSocket)
  setTimeout(() => {
    if (messagesContainer) {
      const names = ['Alice', 'Bob', 'Charlie', 'Diana'];
      const randomName = names[Math.floor(Math.random() * names.length)];
      
      const replyElement = document.createElement('div');
      replyElement.className = 'message message-received';
      replyElement.innerHTML = `
        <div class="message-sender">${randomName}</div>
        <div>Concordo com sua mensagem na Polygon Network!</div>
        <div class="message-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
      `;
      messagesContainer.appendChild(replyElement);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, 1500);
}

// Tecla Enter no chat de grupo
function handleGroupChatKeyPress(event) {
  if (event.key === 'Enter') {
    sendGroupMessage();
  }
}

// Criar novo grupo
function createNewGroup() {
  const groupNameInput = document.getElementById('groupName');
  if (!groupNameInput) return;
  
  const groupName = groupNameInput.value.trim();
  
  if (!groupName) {
    showNotification('Digite um nome para o grupo', 'error');
    return;
  }
  
  showNotification(`Grupo "${groupName}" criado na Polygon Network!`, 'success');
  groupNameInput.value = '';
  
  // Adicionar à lista de grupos
  const groupsContainer = document.getElementById('availableGroups');
  if (groupsContainer) {
    const groupElement = document.createElement('div');
    groupElement.className = 'agenda-entry';
    groupElement.innerHTML = `
      <div class="agenda-header">
        <div class="agenda-title">${sanitizeInput(groupName)}</div>
        <div class="agenda-status status-in-progress">Ativo</div>
      </div>
      <div class="agenda-description">Grupo de comunicação Polygon com membros verificados.</div>
      <div class="agenda-footer">
        <div>5 membros</div>
        <button class="btn btn-secondary btn-small" onclick="joinGroup('${sanitizeInput(groupName)}')" style="padding: 4px 8px; font-size: 10px;">
          <i class="fas fa-sign-in-alt"></i> Entrar
        </button>
      </div>
    `;
    groupsContainer.appendChild(groupElement);
  }
}

// Entrar em grupo
function joinGroup(groupName) {
  showNotification(`Entrando no grupo "${groupName}"...`, 'info');
  
  // Simular entrada no grupo
  setTimeout(() => {
    const messagesContainer = document.getElementById('groupChatMessages');
    if (messagesContainer) {
      const messageElement = document.createElement('div');
      messageElement.className = 'message message-received';
      messageElement.innerHTML = `
        <div class="message-sender">Sistema</div>
        <div>Você entrou no grupo "${sanitizeInput(groupName)}"</div>
        <div class="message-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
      `;
      messagesContainer.appendChild(messageElement);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    showNotification(`✅ Agora você está no grupo "${groupName}"`, 'success');
  }, 1000);
}

// Criar vídeo em grupo
async function createGroupVideo() {
  const groupVideoNameInput = document.getElementById('groupVideoName');
  if (!groupVideoNameInput) return;
  
  const meetingName = groupVideoNameInput.value.trim();
  
  if (!meetingName) {
    showNotification('Digite um nome para a reunião', 'error');
    return;
  }
  
  try {
    showNotification(`Criando reunião "${meetingName}"...`, 'info');
    
    const constraints = {
      video: true,
      audio: true
    };
    
    groupVideoStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    const videoContainer = document.getElementById('groupVideoContainer');
    if (videoContainer) {
      videoContainer.innerHTML = `
        <div class="group-video-container">
          <div class="group-video-item">
            <video id="groupLocalVideo" autoplay playsinline muted></video>
            <div class="group-video-overlay">Você</div>
          </div>
          <!-- Vídeos de outros participantes serão adicionados aqui -->
        </div>
      `;
      
      const localVideo = document.getElementById('groupLocalVideo');
      if (localVideo) localVideo.srcObject = groupVideoStream;
    }
    
    // Gerar código de reunião
    const meetingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const groupVideoCodeInput = document.getElementById('groupVideoCode');
    if (groupVideoCodeInput) groupVideoCodeInput.value = meetingCode;
    
    // Mostrar controles de vídeo
    const groupVideoControls = document.getElementById('groupVideoControls');
    const toggleGroupVideoBtn = document.getElementById('toggleGroupVideoBtn');
    const toggleGroupAudioBtn = document.getElementById('toggleGroupAudioBtn');
    const leaveGroupVideoBtn = document.getElementById('leaveGroupVideoBtn');
    
    if (groupVideoControls) groupVideoControls.style.display = 'block';
    if (toggleGroupVideoBtn) toggleGroupVideoBtn.disabled = false;
    if (toggleGroupAudioBtn) toggleGroupAudioBtn.disabled = false;
    if (leaveGroupVideoBtn) leaveGroupVideoBtn.disabled = false;
    
    // Atualizar lista de participantes
    updateParticipantsList(['Você']);
    
    showNotification(`✅ Reunião "${meetingName}" criada! Código: ${meetingCode}`, 'success');
    
  } catch (error) {
    console.error('Erro ao criar reunião:', error);
    showNotification('Erro ao criar reunião: ' + error.message, 'error');
  }
}

// Entrar em vídeo em grupo
async function joinGroupVideo() {
  const groupVideoCodeInput = document.getElementById('groupVideoCode');
  if (!groupVideoCodeInput) return;
  
  const meetingCode = groupVideoCodeInput.value.trim();
  
  if (!meetingCode) {
    showNotification('Digite o código da reunião', 'error');
    return;
  }
  
  try {
    showNotification(`Entrando na reunião ${meetingCode}...`, 'info');
    
    const constraints = {
      video: true,
      audio: true
    };
    
    groupVideoStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    const videoContainer = document.getElementById('groupVideoContainer');
    if (videoContainer) {
      videoContainer.innerHTML = `
        <div class="group-video-container">
          <div class="group-video-item">
            <video id="groupLocalVideo" autoplay playsinline muted></video>
            <div class="group-video-overlay">Você</div>
          </div>
          <div class="group-video-item">
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #222;">
              <i class="fas fa-user" style="color: #fff; font-size: 32px;"></i>
            </div>
            <div class="group-video-overlay">Alice</div>
          </div>
          <div class="group-video-item">
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #222;">
              <i class="fas fa-user" style="color: #fff; font-size: 32px;"></i>
            </div>
            <div class="group-video-overlay">Bob</div>
          </div>
        </div>
      `;
      
      const localVideo = document.getElementById('groupLocalVideo');
      if (localVideo) localVideo.srcObject = groupVideoStream;
    }
    
    // Mostrar controles de vídeo
    const groupVideoControls = document.getElementById('groupVideoControls');
    const toggleGroupVideoBtn = document.getElementById('toggleGroupVideoBtn');
    const toggleGroupAudioBtn = document.getElementById('toggleGroupAudioBtn');
    const leaveGroupVideoBtn = document.getElementById('leaveGroupVideoBtn');
    
    if (groupVideoControls) groupVideoControls.style.display = 'block';
    if (toggleGroupVideoBtn) toggleGroupVideoBtn.disabled = false;
    if (toggleGroupAudioBtn) toggleGroupAudioBtn.disabled = false;
    if (leaveGroupVideoBtn) leaveGroupVideoBtn.disabled = false;
    
    // Atualizar lista de participantes
    updateParticipantsList(['Você', 'Alice', 'Bob', 'Charlie']);
    
    showNotification(`✅ Você entrou na reunião ${meetingCode}`, 'success');
    
  } catch (error) {
    console.error('Erro ao entrar na reunião:', error);
    showNotification('Erro ao entrar na reunião: ' + error.message, 'error');
  }
}

// Atualizar lista de participantes
function updateParticipantsList(participants) {
  const container = document.getElementById('participantsList');
  if (!container) return;
  
  container.innerHTML = '';
  
  participants.forEach(participant => {
    const participantElement = document.createElement('div');
    participantElement.className = 'contact-item';
    participantElement.innerHTML = `
      <div class="contact-info">
        <i class="fas fa-user-circle" style="color: var(--primary-color);"></i>
        <div style="font-weight: 500;">${participant}</div>
      </div>
      <div class="contact-actions">
        <div class="status-indicator verified" style="width: 10px; height: 10px;"></div>
      </div>
    `;
    container.appendChild(participantElement);
  });
}

// Alternar vídeo no grupo
function toggleGroupVideo() {
  if (!groupVideoStream) return;
  
  const videoTrack = groupVideoStream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
    const btn = document.getElementById('toggleGroupVideoBtn');
    if (btn) {
      btn.innerHTML = videoTrack.enabled ? 
        '<i class="fas fa-video-slash"></i> Desligar Vídeo' : 
        '<i class="fas fa-video"></i> Ligar Vídeo';
    }
    
    showNotification(videoTrack.enabled ? 'Vídeo ativado' : 'Vídeo desativado', 'info');
  }
}

// Alternar áudio no grupo
function toggleGroupAudio() {
  if (!groupVideoStream) return;
  
  const audioTrack = groupVideoStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    const btn = document.getElementById('toggleGroupAudioBtn');
    if (btn) {
      btn.innerHTML = audioTrack.enabled ? 
        '<i class="fas fa-microphone-slash"></i> Silenciar' : 
        '<i class="fas fa-microphone"></i> Ativar Áudio';
    }
    
    showNotification(audioTrack.enabled ? 'Áudio ativado' : 'Áudio desativado', 'info');
  }
}

// Sair da reunião de vídeo em grupo
function leaveGroupVideo() {
  if (groupVideoStream) {
    groupVideoStream.getTracks().forEach(track => track.stop());
    groupVideoStream = null;
  }
  
  const videoContainer = document.getElementById('groupVideoContainer');
  if (videoContainer) {
    videoContainer.innerHTML = `
      <div class="video-placeholder">
        <i class="fas fa-users" style="font-size: 48px; color: var(--text-secondary);"></i>
        <div style="font-size: 18px; margin-top: 15px;">Nenhuma reunião ativa</div>
        <div style="font-size: 13px; margin-top: 10px; color: var(--text-secondary); max-width: 400px; line-height: 1.5;">
          Crie uma nova reunião ou entre em uma existente usando os controles ao lado
        </div>
      </div>
    `;
  }
  
  // Esconder controles
  const groupVideoControls = document.getElementById('groupVideoControls');
  if (groupVideoControls) groupVideoControls.style.display = 'none';
  
  // Limpar lista de participantes
  updateParticipantsList([]);
  
  showNotification('Você saiu da reunião de vídeo', 'info');
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.communication = {
    authorizedChatAddress,
    contacts,
    currentChatContact,
    videoStream,
    peerConnection,
    groupVideoStream,
    authorizeChatAccess,
    updateAuthorizationStatus,
    loadContacts,
    updateContactsList,
    updateContactSelects,
    addNewContact,
    removeContact,
    startChatWithContact,
    sendPrivateMessage,
    handlePrivateChatKeyPress,
    switchSubTab,
    startVideoCall,
    endVideoCall,
    toggleVideo,
    toggleAudio,
    sendGroupMessage,
    handleGroupChatKeyPress,
    createNewGroup,
    joinGroup,
    createGroupVideo,
    joinGroupVideo,
    updateParticipantsList,
    toggleGroupVideo,
    toggleGroupAudio,
    leaveGroupVideo
  };
  
  // Exportar funções individualmente para compatibilidade
  window.authorizeChatAccess = authorizeChatAccess;
  window.updateAuthorizationStatus = updateAuthorizationStatus;
  window.loadContacts = loadContacts;
  window.addNewContact = addNewContact;
  window.removeContact = removeContact;
  window.startChatWithContact = startChatWithContact;
  window.sendPrivateMessage = sendPrivateMessage;
  window.handlePrivateChatKeyPress = handlePrivateChatKeyPress;
  window.switchSubTab = switchSubTab;
  window.startVideoCall = startVideoCall;
  window.endVideoCall = endVideoCall;
  window.toggleVideo = toggleVideo;
  window.toggleAudio = toggleAudio;
  window.sendGroupMessage = sendGroupMessage;
  window.handleGroupChatKeyPress = handleGroupChatKeyPress;
  window.createNewGroup = createNewGroup;
  window.joinGroup = joinGroup;
  window.createGroupVideo = createGroupVideo;
  window.joinGroupVideo = joinGroupVideo;
  window.toggleGroupVideo = toggleGroupVideo;
  window.toggleGroupAudio = toggleGroupAudio;
  window.leaveGroupVideo = leaveGroupVideo;
}
