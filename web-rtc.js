// ======================================================
// WEBRTC SYSTEM - SISTEMA COMPLETO DE COMUNICAÇÃO P2P
// ======================================================

// CONFIGURAÇÃO WEBRTC
const WEBRTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
};

// VARIÁVEIS GLOBAIS WEBRTC
let webrtcConnections = new Map(); // Mapa de conexões por peerId
let webrtcLocalStream = null;
let webrtcDataChannels = new Map();
let webrtcSignalingChannel = null;

// ======================================================
// CLASSE PRINCIPAL WEBRTC
// ======================================================

class WebRTCSystem {
  constructor(peerId = null) {
    this.peerId = peerId || this.generatePeerId();
    this.peerConnection = null;
    this.dataChannel = null;
    this.localStream = null;
    this.remoteStream = null;
    this.isCaller = false;
    this.connected = false;
    this.iceCandidates = [];
    this.offer = null;
    this.answer = null;
  }

  generatePeerId() {
    return 'peer_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // ======================================================
  // INICIALIZAÇÃO DA CONEXÃO
  // ======================================================

  async initialize(isCaller = true) {
    try {
      this.isCaller = isCaller;
      
      // Criar nova conexão peer
      this.peerConnection = new RTCPeerConnection(WEBRTC_CONFIG);
      
      // Configurar handlers de eventos
      this.setupEventHandlers();
      
      // Adicionar stream local se disponível
      if (this.localStream) {
        this.addLocalStream();
      }
      
      // Criar data channel se for o caller
      if (isCaller) {
        this.createDataChannel();
      } else {
        this.setupDataChannelHandler();
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao inicializar WebRTC:', error);
      showNotification('Erro ao configurar conexão P2P', 'error');
      return false;
    }
  }

  setupEventHandlers() {
    // ICE Candidate handler
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const candidateData = {
          type: 'ice-candidate',
          candidate: event.candidate,
          peerId: this.peerId
        };
        
        // Salvar para envio posterior
        this.iceCandidates.push(event.candidate);
        
        // Em produção, enviaria via servidor de sinalização
        console.log('Novo ICE Candidate:', event.candidate);
      }
    };

    // Remote stream handler
    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        
        // Atualizar interface de vídeo
        this.updateRemoteVideo();
        
        showNotification('Stream remoto recebido', 'success');
      }
    };

    // Connection state handler
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Estado da conexão:', this.peerConnection.connectionState);
      
      if (this.peerConnection.connectionState === 'connected') {
        this.connected = true;
        showNotification('✅ Conexão P2P estabelecida!', 'success');
      } else if (this.peerConnection.connectionState === 'disconnected' ||
                 this.peerConnection.connectionState === 'failed' ||
                 this.peerConnection.connectionState === 'closed') {
        this.connected = false;
        showNotification('Conexão P2P perdida', 'warning');
      }
    };

    // ICE connection state handler
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('Estado ICE:', this.peerConnection.iceConnectionState);
    };
  }

  // ======================================================
  // GERENCIAMENTO DE STREAMS DE MÍDIA
  // ======================================================

  async getLocalMediaStream(constraints = { video: true, audio: true }) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Adicionar ao peer connection
      if (this.peerConnection) {
        this.addLocalStream();
      }
      
      return this.localStream;
    } catch (error) {
      console.error('Erro ao obter stream de mídia:', error);
      
      // Tentar com constraints mais simples
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        showNotification('Dispositivo de mídia não encontrado', 'error');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        showNotification('Dispositivo de mídia em uso', 'error');
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        // Tentar sem vídeo
        return await this.getLocalMediaStream({ video: false, audio: true });
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        showNotification('Permissão de mídia negada', 'error');
      } else if (error.name === 'TypeError') {
        showNotification('Parâmetros de mídia inválidos', 'error');
      } else {
        showNotification('Erro ao acessar mídia: ' + error.message, 'error');
      }
      
      return null;
    }
  }

  addLocalStream() {
    if (!this.localStream || !this.peerConnection) return;
    
    // Remover tracks antigas
    const senders = this.peerConnection.getSenders();
    senders.forEach(sender => {
      if (sender.track && sender.track.kind === 'audio') {
        this.peerConnection.removeTrack(sender);
      }
      if (sender.track && sender.track.kind === 'video') {
        this.peerConnection.removeTrack(sender);
      }
    });
    
    // Adicionar novas tracks
    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });
  }

  updateRemoteVideo() {
    const remoteVideo = document.getElementById('remoteVideo');
    if (remoteVideo && this.remoteStream) {
      remoteVideo.srcObject = this.remoteStream;
    }
    
    // Atualizar também para vídeo em grupo
    const groupVideoContainer = document.getElementById('groupVideoContainer');
    if (groupVideoContainer && this.remoteStream) {
      this.updateGroupVideoInterface();
    }
  }

  updateGroupVideoInterface() {
    // Implementação específica para vídeo em grupo
    const container = document.getElementById('groupVideoContainer');
    if (!container) return;
    
    // Criar elemento de vídeo se não existir
    let videoElement = document.getElementById(`remoteVideo_${this.peerId}`);
    if (!videoElement) {
      videoElement = document.createElement('video');
      videoElement.id = `remoteVideo_${this.peerId}`;
      videoElement.autoplay = true;
      videoElement.playsinline = true;
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.objectFit = 'cover';
      
      const videoItem = document.createElement('div');
      videoItem.className = 'group-video-item';
      videoItem.appendChild(videoElement);
      
      const overlay = document.createElement('div');
      overlay.className = 'group-video-overlay';
      overlay.textContent = `Peer ${this.peerId.substring(0, 8)}...`;
      videoItem.appendChild(overlay);
      
      container.appendChild(videoItem);
    }
    
    videoElement.srcObject = this.remoteStream;
  }

  // ======================================================
  // DATA CHANNELS (CHAT E DADOS)
  // ======================================================

  createDataChannel(label = 'chat', options = { ordered: true }) {
    try {
      this.dataChannel = this.peerConnection.createDataChannel(label, options);
      this.setupDataChannelEvents();
      
      webrtcDataChannels.set(this.peerId, this.dataChannel);
      
      return this.dataChannel;
    } catch (error) {
      console.error('Erro ao criar data channel:', error);
      return null;
    }
  }

  setupDataChannelHandler() {
    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannelEvents();
      
      webrtcDataChannels.set(this.peerId, this.dataChannel);
    };
  }

  setupDataChannelEvents() {
    this.dataChannel.onopen = () => {
      console.log('Data Channel aberto:', this.dataChannel.label);
      showNotification('Canal de dados P2P estabelecido', 'success');
    };

    this.dataChannel.onmessage = (event) => {
      this.handleDataChannelMessage(event.data);
    };

    this.dataChannel.onclose = () => {
      console.log('Data Channel fechado');
      webrtcDataChannels.delete(this.peerId);
    };

    this.dataChannel.onerror = (error) => {
      console.error('Erro no Data Channel:', error);
    };
  }

  handleDataChannelMessage(data) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'chat':
          this.handleChatMessage(message);
          break;
        case 'file':
          this.handleFileMessage(message);
          break;
        case 'call':
          this.handleCallMessage(message);
          break;
        case 'control':
          this.handleControlMessage(message);
          break;
        default:
          console.log('Mensagem desconhecida:', message);
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  }

  handleChatMessage(message) {
    // Adicionar mensagem ao chat UI
    const messagesContainer = document.getElementById('privateChatMessages') || 
                              document.getElementById('groupChatMessages');
    
    if (messagesContainer) {
      const messageElement = document.createElement('div');
      messageElement.className = 'message message-received';
      messageElement.innerHTML = `
        <div class="message-sender">${message.sender.substring(0, 8)}...</div>
        <div>${message.text}</div>
        <div class="message-time">${new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
      `;
      messagesContainer.appendChild(messageElement);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  // ======================================================
  // SINALIZAÇÃO (OFFER/ANSWER)
  // ======================================================

  async createOffer(options = {}) {
    try {
      if (!this.peerConnection) {
        throw new Error('Conexão não inicializada');
      }

      const offerOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        voiceActivityDetection: false,
        iceRestart: false,
        ...options
      };

      this.offer = await this.peerConnection.createOffer(offerOptions);
      await this.peerConnection.setLocalDescription(this.offer);
      
      return this.offer;
    } catch (error) {
      console.error('Erro ao criar offer:', error);
      throw error;
    }
  }

  async createAnswer() {
    try {
      if (!this.peerConnection || !this.offer) {
        throw new Error('Offer não recebido');
      }

      this.answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(this.answer);
      
      return this.answer;
    } catch (error) {
      console.error('Erro ao criar answer:', error);
      throw error;
    }
  }

  async setRemoteDescription(description) {
    try {
      if (!this.peerConnection) {
        throw new Error('Conexão não inicializada');
      }

      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(description)
      );
      
      // Adicionar candidatos ICE acumulados
      if (this.iceCandidates.length > 0) {
        for (const candidate of this.iceCandidates) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
        this.iceCandidates = [];
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao definir descrição remota:', error);
      throw error;
    }
  }

  async addIceCandidate(candidate) {
    try {
      if (!this.peerConnection) {
        // Armazenar para adicionar depois
        this.iceCandidates.push(candidate);
        return true;
      }

      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      return true;
    } catch (error) {
      console.error('Erro ao adicionar ICE candidate:', error);
      return false;
    }
  }

  // ======================================================
  // ENVIO DE MENSAGENS E DADOS
  // ======================================================

  sendMessage(message, type = 'chat') {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      showNotification('Canal de dados não está aberto', 'error');
      return false;
    }

    const messageData = {
      type: type,
      text: typeof message === 'string' ? message : JSON.stringify(message),
      sender: currentWallet ? currentWallet.address.substring(0, 10) + '...' : 'Anônimo',
      peerId: this.peerId,
      timestamp: new Date().toISOString(),
      signature: this.generateMessageSignature(message)
    };

    try {
      this.dataChannel.send(JSON.stringify(messageData));
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return false;
    }
  }

  sendFile(file) {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      showNotification('Canal de dados não está aberto', 'error');
      return false;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = {
        type: 'file',
        name: file.name,
        size: file.size,
        mimeType: file.type,
        data: event.target.result,
        sender: currentWallet ? currentWallet.address.substring(0, 10) + '...' : 'Anônimo',
        timestamp: new Date().toISOString()
      };

      try {
        this.dataChannel.send(JSON.stringify(fileData));
        showNotification(`Arquivo ${file.name} enviado`, 'success');
      } catch (error) {
        console.error('Erro ao enviar arquivo:', error);
        showNotification('Erro ao enviar arquivo', 'error');
      }
    };

    reader.readAsDataURL(file);
  }

  generateMessageSignature(message) {
    // Em produção, usar assinatura criptográfica real
    const data = typeof message === 'string' ? message : JSON.stringify(message);
    return ethers.id(data + Date.now()).substring(0, 16);
  }

  // ======================================================
  // CONTROLES DE MÍDIA
  // ======================================================

  toggleVideo(enabled = null) {
    if (!this.localStream) return false;
    
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      const newState = enabled !== null ? enabled : !videoTrack.enabled;
      videoTrack.enabled = newState;
      
      // Notificar peer sobre mudança
      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        this.sendMessage({ action: 'toggleVideo', enabled: newState }, 'control');
      }
      
      return newState;
    }
    
    return false;
  }

  toggleAudio(enabled = null) {
    if (!this.localStream) return false;
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      const newState = enabled !== null ? enabled : !audioTrack.enabled;
      audioTrack.enabled = newState;
      
      // Notificar peer sobre mudança
      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        this.sendMessage({ action: 'toggleAudio', enabled: newState }, 'control');
      }
      
      return newState;
    }
    
    return false;
  }

  switchCamera() {
    if (!this.localStream) return false;
    
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return false;
    
    const constraints = videoTrack.getConstraints();
    const facingMode = constraints.facingMode || 'user';
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    
    videoTrack.applyConstraints({
      facingMode: newFacingMode
    }).then(() => {
      showNotification(`Câmera alterada para ${newFacingMode === 'user' ? 'frontal' : 'traseira'}`);
    }).catch(error => {
      console.error('Erro ao alterar câmera:', error);
    });
    
    return newFacingMode;
  }

  // ======================================================
  // GERENCIAMENTO DE CONEXÕES
  // ======================================================

  close() {
    // Fechar streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }
    
    // Fechar data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    
    // Fechar peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    // Remover do mapa global
    webrtcConnections.delete(this.peerId);
    webrtcDataChannels.delete(this.peerId);
    
    this.connected = false;
    
    console.log('Conexão WebRTC fechada');
  }

  getStats() {
    if (!this.peerConnection) return null;
    
    return this.peerConnection.getStats().then(stats => {
      const result = {};
      
      stats.forEach(report => {
        result[report.type] = report;
      });
      
      return result;
    });
  }

  // ======================================================
  // UTILITÁRIOS
  // ======================================================

  getConnectionInfo() {
    return {
      peerId: this.peerId,
      connected: this.connected,
      isCaller: this.isCaller,
      dataChannel: this.dataChannel ? {
        label: this.dataChannel.label,
        readyState: this.dataChannel.readyState,
        bufferedAmount: this.dataChannel.bufferedAmount
      } : null,
      iceConnectionState: this.peerConnection ? this.peerConnection.iceConnectionState : 'disconnected',
      connectionState: this.peerConnection ? this.peerConnection.connectionState : 'disconnected'
    };
  }

  printConnectionInfo() {
    const info = this.getConnectionInfo();
    console.log('Informações da conexão:', info);
    return info;
  }
}

// ======================================================
// FUNÇÕES GLOBAIS WEBRTC
// ======================================================

// Instância global do sistema WebRTC
let globalWebRTCSystem = null;

function initializeWebRTCSystem() {
  globalWebRTCSystem = new WebRTCSystem();
  webrtcConnections.set(globalWebRTCSystem.peerId, globalWebRTCSystem);
  return globalWebRTCSystem;
}

function getWebRTCSystem(peerId = null) {
  if (peerId && webrtcConnections.has(peerId)) {
    return webrtcConnections.get(peerId);
  }
  
  if (!globalWebRTCSystem) {
    return initializeWebRTCSystem();
  }
  
  return globalWebRTCSystem;
}

// ======================================================
// FUNÇÕES DE INTERFACE
// ======================================================

async function startWebRTCCall(contactAddress) {
  const contact = contacts.find(c => c.address === contactAddress);
  if (!contact) {
    showNotification('Contato não encontrado', 'error');
    return;
  }

  try {
    showNotification('Iniciando chamada WebRTC P2P...', 'info');
    
    const webrtc = getWebRTCSystem();
    
    // Obter stream de mídia
    await webrtc.getLocalMediaStream();
    
    // Inicializar como caller
    await webrtc.initialize(true);
    
    // Criar offer
    const offer = await webrtc.createOffer();
    
    // Configurar interface de vídeo
    setupVideoCallInterface(webrtc);
    
    // Em produção, enviaria offer via servidor de sinalização
    // Aqui simulamos a conexão
    simulateWebRTCConnection(webrtc, contact);
    
    showNotification('Chamada WebRTC iniciada', 'success');
    
  } catch (error) {
    console.error('Erro ao iniciar chamada WebRTC:', error);
    showNotification('Erro: ' + error.message, 'error');
  }
}

function setupVideoCallInterface(webrtc) {
  const videoContainer = document.getElementById('videoCallContainer');
  if (!videoContainer) return;
  
  videoContainer.innerHTML = `
    <div class="video-call-container">
      <video id="remoteVideo" autoplay playsinline></video>
      <div class="local-video">
        <video id="localVideo" autoplay playsinline muted></video>
      </div>
    </div>
  `;
  
  const localVideo = document.getElementById('localVideo');
  if (localVideo && webrtc.localStream) {
    localVideo.srcObject = webrtc.localStream;
  }
  
  // Atualizar controles
  updateVideoCallControls(true);
}

function simulateWebRTCConnection(webrtc, contact) {
  // Em produção, isso seria feito via servidor de sinalização
  setTimeout(() => {
    showNotification(`Conexão P2P estabelecida com ${contact.name || 'Contato'}`, 'success');
  }, 2000);
}

function endWebRTCCall() {
  const webrtc = getWebRTCSystem();
  if (webrtc) {
    webrtc.close();
  }
  
  // Resetar interface
  const videoContainer = document.getElementById('videoCallContainer');
  if (videoContainer) {
    videoContainer.innerHTML = `
      <div class="video-placeholder">
        <i class="fas fa-video"></i>
        <div>Chamada de vídeo não iniciada</div>
        <div style="font-size: 12px; margin-top: 10px;">Selecione um contato para iniciar uma chamada P2P</div>
      </div>
    `;
  }
  
  // Atualizar controles
  updateVideoCallControls(false);
  
  showNotification('Chamada WebRTC encerrada', 'info');
}

function updateVideoCallControls(isActive) {
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
// EXPORTAÇÃO DAS FUNÇÕES
// ======================================================

// Classe principal
window.WebRTCSystem = WebRTCSystem;

// Funções globais
window.initializeWebRTCSystem = initializeWebRTCSystem;
window.getWebRTCSystem = getWebRTCSystem;
window.startWebRTCCall = startWebRTCCall;
window.endWebRTCCall = endWebRTCCall;

// Funções de controle
window.toggleVideo = function() {
  const webrtc = getWebRTCSystem();
  if (webrtc) {
    const enabled = webrtc.toggleVideo();
    showNotification(enabled ? 'Vídeo ativado' : 'Vídeo desativado', 'info');
  }
};

window.toggleAudio = function() {
  const webrtc = getWebRTCSystem();
  if (webrtc) {
    const enabled = webrtc.toggleAudio();
    showNotification(enabled ? 'Áudio ativado' : 'Áudio desativado', 'info');
  }
};

window.switchCamera = function() {
  const webrtc = getWebRTCSystem();
  if (webrtc) {
    webrtc.switchCamera();
  }
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar sistema WebRTC
  initializeWebRTCSystem();
});
