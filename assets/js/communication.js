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
    
    switchSubTab('chatTab
