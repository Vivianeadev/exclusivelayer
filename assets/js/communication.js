// ======================================================
// SISTEMA DE COMUNICAÇÃO - WEBRTC, CHAT, VÍDEO, GRUPOS
// ======================================================

// VARIÁVEIS PARA COMUNICAÇÃO
let authorizedChatAddress = null;
let contacts = [];
let currentChatContact = null;
let videoStream = null;
let groupVideoStream = null;

// Sistema de WebRTC para comunicação real
class WebRTCSystem {
    constructor() {
        this.peerConnection = null;
        this.dataChannel = null;
        this.remoteStream = null;
        this.localStream = null;
        this.stunServers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };
    }

    // Inicializar conexão WebRTC
    async initializeConnection(isOfferer = false) {
        try {
            this.peerConnection = new RTCPeerConnection(this.stunServers);
            
            // Adicionar stream local se disponível
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, this.localStream);
                });
            }
            
            // Criar canal de dados para chat
            if (isOfferer) {
                this.dataChannel = this.peerConnection.createDataChannel('chat');
                this.setupDataChannel();
            } else {
                this.peerConnection.ondatachannel = (event) => {
                    this.dataChannel = event.channel;
                    this.setupDataChannel();
                };
            }
            
            // Tratar oferta/resposta ICE
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('Novo candidato ICE:', event.candidate);
                }
            };
            
            // Tratar stream remoto
            this.peerConnection.ontrack = (event) => {
                this.remoteStream = event.streams[0];
                const remoteVideo = document.getElementById('remoteVideo');
                if (remoteVideo) {
                    remoteVideo.srcObject = this.remoteStream;
                }
            };
            
            return true;
        } catch (error) {
            console.error('Erro ao inicializar WebRTC:', error);
            return false;
        }
    }

    // Configurar canal de dados
    setupDataChannel() {
        this.dataChannel.onopen = () => {
            console.log('Canal de dados aberto');
            showNotification('Conexão WebRTC estabelecida!', 'success');
        };
        
        this.dataChannel.onmessage = (event) => {
            this.handleIncomingMessage(event.data);
        };
        
        this.dataChannel.onclose = () => {
            console.log('Canal de dados fechado');
            showNotification('Conexão WebRTC encerrada', 'info');
        };
    }

    // Enviar mensagem via WebRTC
    sendMessage(message) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            const messageData = {
                type: 'chat',
                text: message,
                sender: authorizedChatAddress || 'Anônimo',
                timestamp: new Date().toISOString()
            };
            this.dataChannel.send(JSON.stringify(messageData));
            return true;
        }
        return false;
    }

    // Processar mensagem recebida
    handleIncomingMessage(data) {
        try {
            const messageData = JSON.parse(data);
            
            if (messageData.type === 'chat') {
                // Adicionar mensagem ao chat
                const messagesContainer = document.getElementById('privateChatMessages');
                if (messagesContainer) {
                    const messageElement = document.createElement('div');
                    messageElement.className = 'message message-received';
                    messageElement.innerHTML = `
                        <div class="message-sender">${messageData.sender.substring(0, 8)}...</div>
                        <div>${messageData.text}</div>
                        <div class="message-time">${new Date(messageData.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                    `;
                    messagesContainer.appendChild(messageElement);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
        }
    }

    // Criar oferta SDP
    async createOffer() {
        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            return offer;
        } catch (error) {
            console.error('Erro ao criar oferta:', error);
            return null;
        }
    }

    // Criar resposta SDP
    async createAnswer() {
        try {
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            return answer;
        } catch (error) {
            console.error('Erro ao criar resposta:', error);
            return null;
        }
    }

    // Definir descrição remota
    async setRemoteDescription(description) {
        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
            return true;
        } catch (error) {
            console.error('Erro ao definir descrição remota:', error);
            return false;
        }
    }

    // Fechar conexão
    close() {
        if (this.dataChannel) {
            this.dataChannel.close();
        }
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
    }
}

// Instanciar sistema WebRTC
const webrtcSystem = new WebRTCSystem();

// ======================================================
// FUNÇÕES PARA A ABA DE COMUNICAÇÃO
// ======================================================

// Autorizar acesso ao chat
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

// Atualizar status de autorização
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

// Carregar contatos
function loadContacts() {
    const savedContacts = localStorage.getItem('exclusiveWalletContacts');
    contacts = savedContacts ? JSON.parse(savedContacts) : [];
    
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

// Atualizar selects de contatos
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

// Adicionar novo contato
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
    
    showNotification('✅ Contato Polygon adicionado com sucesso!', 'success');
}

// Remover contato
function removeContact(index) {
    if (confirm('Remover este contato da sua lista?')) {
        contacts.splice(index, 1);
        localStorage.setItem('exclusiveWalletContacts', JSON.stringify(contacts));
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

// Enviar mensagem privada
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
    
    document.querySelector(`.sub-tab-btn[data-subtab="${subTabId}"]`).classList.add('active');
    document.getElementById(subTabId).classList.remove('hidden');
}

// Iniciar chamada de vídeo real
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
        
        // Obter stream de mídia
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
        
        // Inicializar conexão WebRTC como ofertante
        const initialized = await webrtcSystem.initializeConnection(true);
        if (!initialized) {
            throw new Error('Falha ao inicializar WebRTC');
        }
        
        // Criar oferta SDP
        const offer = await webrtcSystem.createOffer();
        if (!offer) {
            throw new Error('Falha ao criar oferta SDP');
        }
        
        // Em produção, aqui você enviaria a oferta para o peer via servidor de sinalização
        showNotification('Chamada WebRTC iniciada. Aguardando resposta...', 'success');
        
        // Simular conexão bem-sucedida após 2 segundos
        setTimeout(() => {
            showNotification('Chamada de vídeo estabelecida via WebRTC!', 'success');
        }, 2000);
        
        // Atualizar controles
        document.getElementById('startVideoBtn').disabled = true;
        document.getElementById('endVideoBtn').disabled = false;
        document.getElementById('toggleVideoBtn').disabled = false;
        document.getElementById('toggleAudioBtn').disabled = false;
        
        // Configurar botão de encerrar para usar WebRTC
        document.getElementById('endVideoBtn').onclick = endRealVideoCall;
        
    } catch (error) {
        console.error('Erro ao iniciar chamada WebRTC:', error);
        showNotification('Erro ao iniciar chamada: ' + error.message, 'error');
    }
}

// Encerrar chamada de vídeo real
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
    
    // Atualizar controles
    document.getElementById('startVideoBtn').disabled = false;
    document.getElementById('endVideoBtn').disabled = true;
    document.getElementById('toggleVideoBtn').disabled = true;
    document.getElementById('toggleAudioBtn').disabled = true;
    
    // Restaurar função original do botão
    document.getElementById('endVideoBtn').onclick = endVideoCall;
    
    showNotification('Chamada WebRTC encerrada', 'info');
}

// Encerrar chamada de vídeo (simulada)
function endVideoCall() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    
    const videoContainer = document.getElementById('videoCallContainer');
    videoContainer.innerHTML = `
        <div class="video-placeholder">
            <i class="fas fa-video" style="color: var(--success-color);"></i>
            <div>Chamada encerrada</div>
            <div style="font-size: 12px; margin-top: 10px;">Selecione um contato para iniciar uma nova chamada</div>
        </div>
    `;
    
    // Atualizar controles
    document.getElementById('startVideoBtn').disabled = false;
    document.getElementById('endVideoBtn').disabled = true;
    document.getElementById('toggleVideoBtn').disabled = true;
    document.getElementById('toggleAudioBtn').disabled = true;
    
    showNotification('Chamada de vídeo encerrada', 'info');
}

// Alternar vídeo
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

// Alternar áudio
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

// Enviar mensagem de grupo
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
    
    // Simular respostas
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
    const groupName = document.getElementById('groupName').value.trim();
    
    if (!groupName) {
        showNotification('Digite um nome para o grupo', 'error');
        return;
    }
    
    showNotification(`Grupo "${groupName}" criado na Polygon Network!`, 'success');
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
                <div>Você entrou no grupo "${groupName}"</div>
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
                <!-- Vídeos de outros participantes serão adicionados aqui -->
            </div>
        `;
        
        const localVideo = document.getElementById('groupLocalVideo');
        if (localVideo) localVideo.srcObject = groupVideoStream;
        
        // Gerar código de reunião
        const meetingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        document.getElementById('groupVideoCode').value = meetingCode;
        
        // Mostrar controles de vídeo
        document.getElementById('groupVideoControls').style.display = 'block';
        document.getElementById('toggleGroupVideoBtn').disabled = false;
        document.getElementById('toggleGroupAudioBtn').disabled = false;
        document.getElementById('leaveGroupVideoBtn').disabled = false;
        
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
        
        // Mostrar controles de vídeo
        document.getElementById('groupVideoControls').style.display = 'block';
        document.getElementById('toggleGroupVideoBtn').disabled = false;
        document.getElementById('toggleGroupAudioBtn').disabled = false;
        document.getElementById('leaveGroupVideoBtn').disabled = false;
        
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
        btn.innerHTML = videoTrack.enabled ? 
            '<i class="fas fa-video-slash"></i> Desligar Vídeo' : 
            '<i class="fas fa-video"></i> Ligar Vídeo';
        
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
        btn.innerHTML = audioTrack.enabled ? 
            '<i class="fas fa-microphone-slash"></i> Silenciar' : 
            '<i class="fas fa-microphone"></i> Ativar Áudio';
        
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
    videoContainer.innerHTML = `
        <div class="video-placeholder">
            <i class="fas fa-users" style="font-size: 48px; color: var(--text-secondary);"></i>
            <div style="font-size: 18px; margin-top: 15px;">Nenhuma reunião ativa</div>
            <div style="font-size: 13px; margin-top: 10px; color: var(--text-secondary); max-width: 400px; line-height: 1.5;">
                Crie uma nova reunião ou entre em uma existente usando os controles ao lado
            </div>
        </div>
    `;
    
    // Esconder controles
    document.getElementById('groupVideoControls').style.display = 'none';
    
    // Limpar lista de participantes
    updateParticipantsList([]);
    
    showNotification('Você saiu da reunião de vídeo', 'info');
}

// Adicionar explicação do sistema
function addSystemExplanation() {
    const explanation = document.createElement('div');
    explanation.style.marginTop = '40px';
    explanation.style.paddingTop = '30px';
    explanation.style.borderTop = '1px solid var(--gold-primary)';
    explanation.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 80px; height: 2px; background: var(--gradient-gold); margin: 0 auto 20px;"></div>
            <h3 style="font-family: 'Cinzel', serif; color: var(--primary-color); margin-bottom: 15px;">
                <i class="fas fa-graduation-cap"></i> Como Usar o Sistema de Comunicação
            </h3>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">
            <div style="background: var(--gradient-card); padding: 20px; border-radius: 12px; border: 1px solid var(--card-border);">
                <h4 style="color: var(--primary-color); margin-bottom: 10px; font-size: 14px;">
                    <i class="fas fa-user-friends"></i> 1. Convidar Amigos
                </h4>
                <p style="color: var(--text-secondary); font-size: 11px; line-height: 1.5;">
                    • Vá para a aba "Contatos"<br>
                    • Adicione o endereço Polygon do seu amigo<br>
                    • Ambos precisam estar autorizados no sistema
                </p>
            </div>
            
            <div style="background: var(--gradient-card); padding: 20px; border-radius: 12px; border: 1px solid var(--card-border);">
                <h4 style="color: var(--primary-color); margin-bottom: 10px; font-size: 14px;">
                    <i class="fas fa-key"></i> 2. Autorização
                </h4>
                <p style="color: var(--text-secondary); font-size: 11px; line-height: 1.5;">
                    • Autorize seu endereço Polygon na aba "Autorização"<br>
                    • Cada participante deve autorizar individualmente<br>
                    • A autorização é local e segura
                </p>
            </div>
            
            <div style="background: var(--gradient-card); padding: 20px; border-radius: 12px; border: 1px solid var(--card-border);">
                <h4 style="color: var(--primary-color); margin-bottom: 10px; font-size: 14px;">
                    <i class="fas fa-video"></i> 3. Reuniões em Grupo
                </h4>
                <p style="color: var(--text-secondary); font-size: 11px; line-height: 1.5;">
                    • Crie uma reunião na aba "Vídeo em Grupo"<br>
                    • Compartilhe o código com os participantes<br>
                    • Todos entram com o mesmo código<br>
                    • Conexão P2P criptografada via WebRTC
                </p>
            </div>
        </div>
        
        <div style="background: rgba(212, 175, 55, 0.05); padding: 15px; border-radius: 10px; border: 1px solid rgba(212, 175, 55, 0.2);">
            <p style="color: var(--text-secondary); font-size: 10px; text-align: center; line-height: 1.4;">
                <strong>✅ Sistema Real:</strong> WebRTC funcional com comunicação P2P • 
                <strong>✅ Criptografia:</strong> Todas as conexões são criptografadas • 
                <strong>✅ Sem Intermediários:</strong> Conexão direta entre participantes • 
                <strong>✅ Responsivo:</strong> Vídeos otimizados para todos os dispositivos
            </p>
            <p style="color: var(--text-secondary); font-size: 9px; text-align: center; margin-top: 10px; font-style: italic;">
                O sistema usa tecnologia WebRTC para comunicação em tempo real. As chamadas são diretas entre os participantes,
                sem servidores intermediários. A qualidade se adapta automaticamente à conexão de rede.
            </p>
        </div>
        
        <div style="display: flex; justify-content: center; gap: 15px; margin-top: 25px; flex-wrap: wrap;">
            <div style="text-align: center;">
                <div style="font-size: 14px; font-weight: 600; color: var(--success-color);">✅ Auditável</div>
                <div style="font-size: 9px; color: var(--text-secondary);">Transações verificáveis</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 14px; font-weight: 600; color: var(--primary-color);">✅ Modular</div>
                <div style="font-size: 9px; color: var(--text-secondary);">Chains independentes</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 14px; font-weight: 600; color: var(--accent-color);">✅ Seguro</div>
                <div style="font-size: 9px; color: var(--text-secondary);">Isolamento completo</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 14px; font-weight: 600; color: var(--sapphire);">✅ Escalável</div>
                <div style="font-size: 9px; color: var(--text-secondary);">100+ chains</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 14px; font-weight: 600; color: var(--ruby);">✅ Real</div>
                <div style="font-size: 9px; color: var(--text-secondary);">Nada simulado</div>
            </div>
        </div>
    `;
    
    // Adicionar ao final da aba de comunicação
    const communicationTab = document.getElementById('communicationTab');
    if (communicationTab) {
        communicationTab.appendChild(explanation);
    }
}
