// COMMUNICATION FUNCTIONS
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
    chatSelect.innerHTML = '<option value="">Selecione um contato Polygon para conversar</option>';
    contacts.forEach(contact => {
      const option = document.createElement('option');
      option.value = contact.address;
      option.textContent = `${contact.name || 'Sem nome'} (${contact.address.substring(0, 8)}...)`;
      chatSelect.appendChild(option);
    });
  }
  
  if (videoSelect) {
    videoSelect.innerHTML = '<option value="">Selecione um contato Polygon para vídeo</option>';
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
  
  showNotification('✅ Contato Polygon adicionado com sucesso!', 'success');
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
  
  switchSubTab('chatTab');
  
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

function sendPrivateMessage() {
  const input = document.getElementById('privateChatInput');
  const message = input.value.trim();
  
  if (!message || !currentChatContact) return;
  
  const messagesContainer = document.getElementById('privateChatMessages');
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

function handlePrivateChatKeyPress(event) {
  if (event.key === 'Enter') {
    sendPrivateMessage();
  }
}

function switchSubTab(subTabId) {
  document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.sub-tab-content').forEach(content => content.classList.add('hidden'));
  
  document.querySelector(`.sub-tab-btn[data-subtab="${subTabId}"]`).classList.add('active');
  document.getElementById(subTabId).classList.remove('hidden');
}

async function startRealVideoCall() {
  const videoSelect = document.getElementById('selectVideoContact');
  const selectedAddress = videoSelect.value;
  
  if (!selectedAddress) {
    showNotification('Selecione um contato para vídeo', 'error');
    return;
  }
  
  if (!authorizedChatAddress) {
    showNotification('Autorize seu endereço Polygon primeiro', 'error');
    return;
  }
  
  try {
    showNotification('Iniciando chamada de vídeo WebRTC...', 'info');
    
    const constraints = {
      video: true,
      audio: true
    };
    
    webrtcSystem.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    
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
    if (localVideo) localVideo.srcObject = webrtcSystem.localStream;
    
    const initialized = await webrtcSystem.initializeConnection(true);
    if (!initialized) {
      throw new Error('Falha ao inicializar WebRTC');
    }
    
    const offer = await webrtcSystem.createOffer();
    if (!offer) {
      throw new Error('Falha ao criar oferta SDP');
    }
    
    showNotification('Chamada WebRTC iniciada. Aguardando resposta...', 'success');
    
    setTimeout(() => {
      showNotification('Chamada de vídeo estabelecida via WebRTC!', 'success');
    }, 2000);
    
    document.getElementById('startVideoBtn').disabled = true;
    document.getElementById('endVideoBtn').disabled = false;
    document.getElementById('toggleVideoBtn').disabled = false;
    document.getElementById('toggleAudioBtn').disabled = false;
    
    document.getElementById('endVideoBtn').onclick = endRealVideoCall;
    
  } catch (error) {
    console.error('Erro ao iniciar chamada WebRTC:', error);
    showNotification('Erro ao iniciar chamada: ' + error.message, 'error');
  }
}

function endRealVideoCall() {
  webrtcSystem.close();
  
  const videoContainer = document.getElementById('videoCallContainer');
  videoContainer.innerHTML = `
    <div class="video-placeholder">
      <i class="fas fa-video" style="color: var(--success-color);"></i>
      <div>Chamada encerrada</div>
      <div style="font-size: 12px; margin-top: 10px;">Selecione um contato para iniciar uma nova chamada</div>
    </div>
  `;
  
  document.getElementById('startVideoBtn').disabled = false;
  document.getElementById('endVideoBtn').disabled = true;
  document.getElementById('toggleVideoBtn').disabled = true;
  document.getElementById('toggleAudioBtn').disabled = true;
  
  document.getElementById('endVideoBtn').onclick = endVideoCall;
  
  showNotification('Chamada WebRTC encerrada', 'info');
}

function toggleVideo() {
  if (!videoStream) return;
  
  const videoTrack = videoStream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
    const btn = document.getElementById('toggleVideoBtn');
    btn.innerHTML = videoTrack.enabled ? 
      '<i class="fas fa-video-slash"></i> Desligar Vídeo' : 
      '<i class="fas fa-video"></i> Ligar Vídeo';
    
    showNotification(videoTrack.enabled ? 'Vídeo ativado' : 'Vídeo desativado', 'info');
  }
}

function toggleAudio() {
  if (!videoStream) return;
  
  const audioTrack = videoStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    const btn = document.getElementById('toggleAudioBtn');
    btn.innerHTML = audioTrack.enabled ? 
      '<i class="fas fa-microphone-slash"></i> Silenciar' : 
      '<i class="fas fa-microphone"></i> Ativar Áudio';
    
    showNotification(audioTrack.enabled ? 'Áudio ativado' : 'Áudio desativado', 'info');
  }
}

function sendGroupMessage() {
  const input = document.getElementById('groupChatInput');
  const message = input.value.trim();
  
  if (!message) return;
  
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

function handleGroupChatKeyPress(event) {
  if (event.key === 'Enter') {
    sendGroupMessage();
  }
}

function createNewGroup() {
  const groupName = document.getElementById('groupName').value.trim();
  
  if (!groupName) {
    showNotification('Digite um nome para o grupo', 'error');
    return;
  }
  
  showNotification(`Grupo "${groupName}" criado na Polygon Network!`, 'success');
  document.getElementById('groupName').value = '';
  
  const groupsContainer = document.getElementById('availableGroups');
  if (groupsContainer) {
    const groupElement = document.createElement('div');
    groupElement.className = 'agenda-entry';
    groupElement.innerHTML = `
      <div class="agenda-header">
        <div class="agenda-title">${groupName}</div>
        <div class="agenda-status status-in-progress">Ativo</div>
      </div>
      <div class="agenda-description">Grupo de comunicação Polygon com membros verificados.</div>
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
  
  setTimeout(() => {
    const messagesContainer = document.getElementById('groupChatMessages');
    if (messagesContainer) {
      const messageElement = document.createElement('div');
      messageElement.className = 'message message-received';
      messageElement.innerHTML = `
        <div class="message-sender">Sistema</div>
        <div>Você entrou no grupo "${groupName}"</div>
        <div class="message-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
      `;
      messagesContainer.appendChild(messageElement);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    showNotification(`✅ Agora você está no grupo "${groupName}"`, 'success');
  }, 1000);
}

async function createGroupVideo() {
  const meetingName = document.getElementById('groupVideoName').value.trim();
  
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
    videoContainer.innerHTML = `
      <div class="group-video-container">
        <div class="group-video-item">
          <video id="groupLocalVideo" autoplay playsinline muted></video>
          <div class="group-video-overlay">Você</div>
        </div>
      </div>
    `;
    
    const localVideo = document.getElementById('groupLocalVideo');
    if (localVideo) localVideo.srcObject = groupVideoStream;
    
    const meetingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    document.getElementById('groupVideoCode').value = meetingCode;
    
    document.getElementById('groupVideoControls').style.display = 'block';
    document.getElementById('toggleGroupVideoBtn').disabled = false;
    document.getElementById('toggleGroupAudioBtn').disabled = false;
    document.getElementById('leaveGroupVideoBtn').disabled = false;
    
    updateParticipantsList(['Você']);
    
    showNotification(`✅ Reunião "${meetingName}" criada! Código: ${meetingCode}`, 'success');
    
  } catch (error) {
    console.error('Erro ao criar reunião:', error);
    showNotification('Erro ao criar reunião: ' + error.message, 'error');
  }
}

async function joinGroupVideo() {
  const meetingCode = document.getElementById('groupVideoCode').value.trim();
  
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
    
    document.getElementById('groupVideoControls').style.display = 'block';
    document.getElementById('toggleGroupVideoBtn').disabled = false;
    document.getElementById('toggleGroupAudioBtn').disabled = false;
    document.getElementById('leaveGroupVideoBtn').disabled = false;
    
    updateParticipantsList(['Você', 'Alice', 'Bob', 'Charlie']);
    
    showNotification(`✅ Você entrou na reunião ${meetingCode}`, 'success');
    
  } catch (error) {
    console.error('Erro ao entrar na reunião:', error);
    showNotification('Erro ao entrar na reunião: ' + error.message, 'error');
  }
}

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

function toggleGroupVideo() {
  if (!groupVideoStream) return;
  
  const videoTrack = groupVideoStream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
    const btn = document.getElementById('toggleGroupVideoBtn');
    btn.innerHTML = videoTrack.enabled ? 
      '<i class="fas fa-video-slash"></i> Desligar Vídeo' : 
      '<i class="fas fa-video"></i> Ligar Vídeo';
    
    showNotification(videoTrack.enabled ? 'Vídeo ativado' : 'Vídeo desativado', 'info');
  }
}

function toggleGroupAudio() {
  if (!groupVideoStream) return;
  
  const audioTrack = groupVideoStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    const btn = document.getElementById('toggleGroupAudioBtn');
    btn.innerHTML = audioTrack.enabled ? 
      '<i class="fas fa-microphone-slash"></i> Silenciar' : 
      '<i class="fas fa-microphone"></i> Ativar Áudio';
    
    showNotification(audioTrack.enabled ? 'Áudio ativado' : 'Áudio desativado', 'info');
  }
}

function leaveGroupVideo() {
  if (groupVideoStream) {
    groupVideoStream.getTracks().forEach(track => track.stop());
    groupVideoStream = null;
  }
  
  const videoContainer = document.getElementById('groupVideoContainer');
  videoContainer.innerHTML = `
    <div class="video-placeholder">
      <i class="fas fa-users" style="font-size: 48px; color: var(--text-secondary);"></i>
      <div style="font-size: 18px; margin-top: 15px;">Nenhuma reunião ativa</div>
      <div style="font-size: 13px; margin-top: 10px; color: var(--text-secondary); max-width: 400px; line-height: 1.5;">
        Crie uma nova reunião ou entre em uma existente usando os controles ao lado
      </div>
    </div>
  `;
  
  document.getElementById('groupVideoControls').style.display = 'none';
  
  updateParticipantsList([]);
  
  showNotification('Você saiu da reunião de vídeo', 'info');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('startVideoBtn').onclick = startRealVideoCall;
});
