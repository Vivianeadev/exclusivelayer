// SISTEMA WEBRTC REAL - COMUNICAÇÃO PREMIUM
class WebRTCManager {
  static peers = new Map();
  static localStream = null;
  static dataChannels = new Map();
  static iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { 
      urls: 'turn:turn.bistri.com:80',
      credential: 'homeo',
      username: 'homeo'
    }
  ];

  static init() {
    console.log('WebRTC Manager inicializado');
    this.setupEventListeners();
    this.loadContacts();
  }

  static async startVideoCall(contactId) {
    try {
      // Obter permissão de mídia
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Criar conexão Peer
      const peerConnection = new RTCPeerConnection({
        iceServers: this.iceServers
      });

      // Adicionar stream local
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });

      // Criar canal de dados para chat
      const dataChannel = peerConnection.createDataChannel('chat', {
        ordered: true,
        maxRetransmits: 3
      });

      this.setupDataChannel(dataChannel, contactId);

      // Criar oferta
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Em produção: enviar oferta via servidor de sinalização
      this.sendOfferToContact(contactId, offer);

      // Salvar peer
      this.peers.set(contactId, { peerConnection, dataChannel });

      return true;
    } catch (error) {
      console.error('Erro ao iniciar chamada:', error);
      this.showError('Erro ao acessar câmera/microfone');
      return false;
    }
  }

  static setupDataChannel(dataChannel, contactId) {
    dataChannel.onopen = () => {
      console.log(`Canal de dados aberto com ${contactId}`);
      this.showNotification(`Conexão estabelecida com ${contactId}`);
    };

    dataChannel.onmessage = (event) => {
      this.handleIncomingMessage(event.data, contactId);
    };

    dataChannel.onclose = () => {
      console.log(`Canal fechado com ${contactId}`);
      this.peers.delete(contactId);
    };

    this.dataChannels.set(contactId, dataChannel);
  }

  static handleIncomingMessage(data, contactId) {
    try {
      const message = JSON.parse(data);
      
      switch(message.type) {
        case 'chat':
          this.displayMessage(message, contactId);
          break;
        case 'video_offer':
          this.handleVideoOffer(message, contactId);
          break;
        case 'ice_candidate':
          this.handleICECandidate(message, contactId);
          break;
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  }

  static async sendChatMessage(contactId, text) {
    const dataChannel = this.dataChannels.get(contactId);
    
    if (dataChannel && dataChannel.readyState === 'open') {
      const message = {
        type: 'chat',
        text: text,
        sender: 'Você',
        timestamp: new Date().toISOString(),
        encrypted: true
      };
      
      dataChannel.send(JSON.stringify(message));
      this.displayMessage(message, contactId);
      return true;
    }
    
    return false;
  }

  static displayMessage(message, contactId) {
    const chatContainer = document.getElementById('privateChatMessages');
    if (!chatContainer) return;

    const messageElement = document.createElement('div');
    messageElement.className = message.sender === 'Você' ? 
      'message message-sent' : 'message message-received';
    
    messageElement.innerHTML = `
      <div class="message-sender">${message.sender}</div>
      <div>${message.text}</div>
      <div class="message-time">
        ${new Date(message.timestamp).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    `;

    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  static async startGroupVideo(participants) {
    try {
      // Obter stream local
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });

      // Criar container de vídeo em grupo
      const videoContainer = document.getElementById('groupVideoContainer');
      videoContainer.innerHTML = '';

      // Adicionar vídeo local
      const localVideo = document.createElement('video');
      localVideo.srcObject = this.localStream;
      localVideo.autoplay = true;
      localVideo.muted = true;
      localVideo.playsInline = true;
      localVideo.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
      `;

      const localContainer = document.createElement('div');
      localContainer.className = 'group-video-item';
      localContainer.style.position = 'relative';
      localContainer.appendChild(localVideo);
      
      const localLabel = document.createElement('div');
      localLabel.className = 'group-video-overlay';
      localLabel.textContent = 'Você';
      localContainer.appendChild(localLabel);

      videoContainer.appendChild(localContainer);

      // Conectar com cada participante
      for (const participant of participants) {
        await this.connectToParticipant(participant, videoContainer);
      }

      return true;
    } catch (error) {
      console.error('Erro ao iniciar vídeo em grupo:', error);
      return false;
    }
  }

  static async connectToParticipant(participantId, videoContainer) {
    const peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    });

    // Adicionar stream local
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });
    }

    // Tratar stream remoto
    peerConnection.ontrack = (event) => {
      const remoteVideo = document.createElement('video');
      remoteVideo.srcObject = event.streams[0];
      remoteVideo.autoplay = true;
      remoteVideo.playsInline = true;
      remoteVideo.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
      `;

      const remoteContainer = document.createElement('div');
      remoteContainer.className = 'group-video-item';
      remoteContainer.style.position = 'relative';
      remoteContainer.appendChild(remoteVideo);
      
      const remoteLabel = document.createElement('div');
      remoteLabel.className = 'group-video-overlay';
      remoteLabel.textContent = participantId.substring(0, 8) + '...';
      remoteContainer.appendChild(remoteLabel);

      videoContainer.appendChild(remoteContainer);
    };

    // Criar oferta
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Salvar conexão
    this.peers.set(participantId, peerConnection);

    // Em produção: enviar oferta via servidor
    console.log(`Oferta criada para ${participantId}`);
  }

  static sendOfferToContact(contactId, offer) {
    // Em produção: enviar via WebSocket ou servidor de sinalização
    console.log(`Enviando oferta para ${contactId}:`, offer);
    
    // Simulação: em produção real, isso seria enviado para o servidor
    setTimeout(() => {
      this.simulateIncomingAnswer(contactId);
    }, 1000);
  }

  static simulateIncomingAnswer(contactId) {
    // Simulação para demonstração
    console.log(`Resposta simulada de ${contactId}`);
    
    // Em produção real: receber do servidor e processar
    this.showNotification(`Chamada com ${contactId} conectada (simulado)`);
  }

  static showNotification(message) {
    // Enviar notificação para o index principal
    window.parent.postMessage({
      type: 'NOTIFICATION',
      message: message,
      notificationType: 'info'
    }, '*');
  }

  static showError(message) {
    window.parent.postMessage({
      type: 'NOTIFICATION',
      message: '❌ ' + message,
      notificationType: 'error'
    }, '*');
  }

  static loadContacts() {
    // Carregar contatos do localStorage
    const savedContacts = localStorage.getItem('exclusiveWalletContacts');
    const contacts = savedContacts ? JSON.parse(savedContacts) : [];
    
    // Preencher selects
    this.populateContactSelects(contacts);
    return contacts;
  }

  static populateContactSelects(contacts) {
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

  static setupEventListeners() {
    // Configurar botões de vídeo
    const startBtn = document.getElementById('startVideoBtn');
    const endBtn = document.getElementById('endVideoBtn');
    
    if (startBtn) {
      startBtn.addEventListener('click', async () => {
        const select = document.getElementById('selectVideoContact');
        const contactId = select.value;
        
        if (!contactId) {
          this.showError('Selecione um contato primeiro');
          return;
        }
        
        const success = await this.startVideoCall(contactId);
        if (success) {
          startBtn.disabled = true;
          endBtn.disabled = false;
        }
      });
    }
    
    if (endBtn) {
      endBtn.addEventListener('click', () => {
        // Encerrar todas as conexões
        this.peers.forEach((peer, contactId) => {
          peer.peerConnection?.close();
        });
        this.peers.clear();
        
        if (this.localStream) {
          this.localStream.getTracks().forEach(track => track.stop());
          this.localStream = null;
        }
        
        startBtn.disabled = false;
        endBtn.disabled = true;
        
        this.showNotification('Chamada encerrada');
      });
    }
  }
}

// Inicializar quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
  WebRTCManager.init();
});

// Exportar para uso global
window.WebRTCManager = WebRTCManager;
