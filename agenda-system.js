// ======================================================
// AGENDA SYSTEM - SISTEMA DE AGENDA PREMIUM (CÓDIGO ORIGINAL)
// ======================================================

// VARIÁVEIS DO SISTEMA DE AGENDA
let agendaEvents = [];
let currentAgendaDate = new Date();
let selectedAgendaDay = null;

// ======================================================
// INICIALIZAÇÃO DO SISTEMA DE AGENDA
// ======================================================

const agendaSystem = {
  init: function() {
    this.loadEvents();
    this.renderCalendar();
    this.renderUpcomingEvents();
    this.setupEventListeners();
  },

  // ======================================================
  // CARREGAMENTO E SALVAMENTO DE EVENTOS
  // ======================================================

  loadEvents: function() {
    const savedEvents = localStorage.getItem('exclusiveWalletAgendaEvents');
    agendaEvents = savedEvents ? JSON.parse(savedEvents) : [];
    
    // Adicionar eventos de exemplo se não houver eventos
    if (agendaEvents.length === 0) {
      this.addSampleEvents();
    }
  },

  saveEvents: function() {
    localStorage.setItem('exclusiveWalletAgendaEvents', JSON.stringify(agendaEvents));
  },

  addSampleEvents: function() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    agendaEvents = [
      {
        id: this.generateEventId(),
        title: "Reunião com Investidores Polygon",
        date: today.toISOString().split('T')[0],
        time: "14:30",
        description: "Apresentação do novo protocolo Identity Dynamic para investidores.",
        createdAt: new Date().toISOString(),
        wallet: currentWallet ? currentWallet.address : null
      },
      {
        id: this.generateEventId(),
        title: "Integração RPC Multichain",
        date: tomorrow.toISOString().split('T')[0],
        time: "10:00",
        description: "Teste de integração com 20 blockchains diferentes.",
        createdAt: new Date().toISOString(),
        wallet: currentWallet ? currentWallet.address : null
      },
      {
        id: this.generateEventId(),
        title: "Atualização de Segurança",
        date: nextWeek.toISOString().split('T')[0],
        time: "16:00",
        description: "Implementação de novas camadas de criptografia P2P.",
        createdAt: new Date().toISOString(),
        wallet: currentWallet ? currentWallet.address : null
      }
    ];
    
    this.saveEvents();
  },

  generateEventId: function() {
    return 'event_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  },

  // ======================================================
  // RENDERIZAÇÃO DO CALENDÁRIO
  // ======================================================

  renderCalendar: function() {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthTitle = document.getElementById('currentMonth');
    
    if (!calendarGrid || !monthTitle) return;
    
    // Atualizar título do mês
    const monthNames = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    
    monthTitle.textContent = `${monthNames[currentAgendaDate.getMonth()]} de ${currentAgendaDate.getFullYear()}`;
    
    // Limpar grade do calendário
    calendarGrid.innerHTML = '';
    
    // Adicionar cabeçalhos dos dias da semana
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    daysOfWeek.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'agenda-day';
      dayHeader.style.minHeight = '40px';
      dayHeader.style.display = 'flex';
      dayHeader.style.alignItems = 'center';
      dayHeader.style.justifyContent = 'center';
      dayHeader.style.fontWeight = '600';
      dayHeader.style.color = 'var(--primary-color)';
      dayHeader.textContent = day;
      calendarGrid.appendChild(dayHeader);
    });
    
    // Calcular primeiro dia do mês
    const firstDay = new Date(currentAgendaDate.getFullYear(), currentAgendaDate.getMonth(), 1);
    const startingDay = firstDay.getDay();
    
    // Calcular número de dias no mês
    const lastDay = new Date(currentAgendaDate.getFullYear(), currentAgendaDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Adicionar células vazias para dias do mês anterior
    for (let i = 0; i < startingDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'agenda-day';
      emptyDay.style.opacity = '0.3';
      calendarGrid.appendChild(emptyDay);
    }
    
    // Adicionar dias do mês atual
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'agenda-day';
      
      const dayDate = new Date(currentAgendaDate.getFullYear(), currentAgendaDate.getMonth(), day);
      const dayDateStr = dayDate.toISOString().split('T')[0];
      
      // Verificar se é hoje
      if (dayDateStr === todayStr) {
        dayElement.style.borderColor = 'var(--primary-color)';
        dayElement.style.background = 'rgba(212, 175, 55, 0.1)';
      }
      
      // Verificar se está selecionado
      if (selectedAgendaDay === dayDateStr) {
        dayElement.classList.add('selected');
      }
      
      // Adicionar número do dia
      const dayNumber = document.createElement('div');
      dayNumber.className = 'agenda-day-number';
      dayNumber.textContent = day;
      dayElement.appendChild(dayNumber);
      
      // Adicionar eventos do dia
      const dayEvents = this.getEventsForDay(dayDateStr);
      dayEvents.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'agenda-day-event';
        eventElement.textContent = event.title;
        eventElement.title = `${event.time} - ${event.title}`;
        dayElement.appendChild(eventElement);
      });
      
      // Event listener para selecionar dia
      dayElement.addEventListener('click', () => {
        this.selectDay(dayDateStr);
      });
      
      calendarGrid.appendChild(dayElement);
    }
  },

  // ======================================================
  // GERENCIAMENTO DE EVENTOS
  // ======================================================

  getEventsForDay: function(dateStr) {
    return agendaEvents.filter(event => event.date === dateStr).slice(0, 2); // Limitar a 2 eventos por dia no calendário
  },

  getEventsForMonth: function() {
    const year = currentAgendaDate.getFullYear();
    const month = currentAgendaDate.getMonth();
    
    return agendaEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  },

  getUpcomingEvents: function(limit = 5) {
    const today = new Date().toISOString().split('T')[0];
    
    return agendaEvents
      .filter(event => event.date >= today)
      .sort((a, b) => {
        if (a.date === b.date) {
          return a.time.localeCompare(b.time);
        }
        return a.date.localeCompare(b.date);
      })
      .slice(0, limit);
  },

  selectDay: function(dateStr) {
    selectedAgendaDay = dateStr;
    this.renderCalendar();
    
    // Preencher formulário com a data selecionada
    const eventDateInput = document.getElementById('eventDate');
    if (eventDateInput) {
      eventDateInput.value = dateStr;
    }
    
    // Mostrar eventos do dia selecionado
    this.renderDayEvents(dateStr);
  },

  renderDayEvents: function(dateStr) {
    // Implementação opcional para mostrar eventos detalhados do dia
  },

  // ======================================================
  // RENDERIZAÇÃO DE EVENTOS FUTUROS
  // ======================================================

  renderUpcomingEvents: function() {
    const eventsList = document.getElementById('eventsList');
    if (!eventsList) return;
    
    eventsList.innerHTML = '';
    
    const upcomingEvents = this.getUpcomingEvents();
    
    if (upcomingEvents.length === 0) {
      eventsList.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-secondary);">
          <i class="fas fa-calendar" style="font-size: 24px; margin-bottom: 10px;"></i>
          <div>Nenhum evento agendado</div>
          <div style="font-size: 12px; margin-top: 5px;">Adicione seu primeiro evento</div>
        </div>
      `;
      return;
    }
    
    upcomingEvents.forEach(event => {
      const eventElement = document.createElement('div');
      eventElement.className = 'agenda-entry';
      eventElement.innerHTML = `
        <div class="agenda-header">
          <div class="agenda-title">${event.title}</div>
          <div class="agenda-status status-in-progress">Agendado</div>
        </div>
        <div class="agenda-description">${event.description}</div>
        <div class="agenda-footer">
          <div>
            <i class="far fa-calendar"></i> ${this.formatDate(event.date)} • 
            <i class="far fa-clock"></i> ${event.time}
          </div>
          <button class="btn btn-secondary btn-small" onclick="agendaSystem.editEvent('${event.id}')" style="padding: 4px 8px; font-size: 10px;">
            <i class="fas fa-edit"></i> Editar
          </button>
        </div>
      `;
      eventsList.appendChild(eventElement);
    });
  },

  // ======================================================
  // ADIÇÃO E EDIÇÃO DE EVENTOS
  // ======================================================

  addEvent: function() {
    const titleInput = document.getElementById('eventTitle');
    const dateInput = document.getElementById('eventDate');
    const timeInput = document.getElementById('eventTime');
    const descriptionInput = document.getElementById('eventDescription');
    
    if (!titleInput || !dateInput || !timeInput || !descriptionInput) return;
    
    const title = titleInput.value.trim();
    const date = dateInput.value;
    const time = timeInput.value;
    const description = descriptionInput.value.trim();
    
    if (!title || !date || !time) {
      showNotification('Preencha título, data e horário', 'error');
      return;
    }
    
    const newEvent = {
      id: this.generateEventId(),
      title: title,
      date: date,
      time: time,
      description: description,
      createdAt: new Date().toISOString(),
      wallet: currentWallet ? currentWallet.address : null
    };
    
    agendaEvents.push(newEvent);
    this.saveEvents();
    
    // Limpar formulário
    titleInput.value = '';
    dateInput.value = '';
    timeInput.value = '';
    descriptionInput.value = '';
    
    // Atualizar interface
    this.renderCalendar();
    this.renderUpcomingEvents();
    
    showNotification('✅ Evento adicionado à agenda premium!', 'success');
  },

  editEvent: function(eventId) {
    const event = agendaEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const titleInput = document.getElementById('eventTitle');
    const dateInput = document.getElementById('eventDate');
    const timeInput = document.getElementById('eventTime');
    const descriptionInput = document.getElementById('eventDescription');
    
    if (titleInput) titleInput.value = event.title;
    if (dateInput) dateInput.value = event.date;
    if (timeInput) timeInput.value = event.time;
    if (descriptionInput) descriptionInput.value = event.description;
    
    // Alterar botão para edição
    const addButton = document.getElementById('addEvent');
    if (addButton) {
      addButton.innerHTML = '<i class="fas fa-save"></i> Salvar Edição';
      addButton.onclick = () => this.updateEvent(eventId);
    }
    
    showNotification('Editando evento...', 'info');
  },

  updateEvent: function(eventId) {
    const titleInput = document.getElementById('eventTitle');
    const dateInput = document.getElementById('eventDate');
    const timeInput = document.getElementById('eventTime');
    const descriptionInput = document.getElementById('eventDescription');
    
    if (!titleInput || !dateInput || !timeInput || !descriptionInput) return;
    
    const title = titleInput.value.trim();
    const date = dateInput.value;
    const time = timeInput.value;
    const description = descriptionInput.value.trim();
    
    if (!title || !date || !time) {
      showNotification('Preencha título, data e horário', 'error');
      return;
    }
    
    const eventIndex = agendaEvents.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return;
    
    agendaEvents[eventIndex] = {
      ...agendaEvents[eventIndex],
      title: title,
      date: date,
      time: time,
      description: description,
      updatedAt: new Date().toISOString()
    };
    
    this.saveEvents();
    
    // Limpar formulário e restaurar botão
    titleInput.value = '';
    dateInput.value = '';
    timeInput.value = '';
    descriptionInput.value = '';
    
    const addButton = document.getElementById('addEvent');
    if (addButton) {
      addButton.innerHTML = '<i class="fas fa-plus"></i> Adicionar Evento';
      addButton.onclick = () => this.addEvent();
    }
    
    // Atualizar interface
    this.renderCalendar();
    this.renderUpcomingEvents();
    
    showNotification('✅ Evento atualizado na agenda premium!', 'success');
  },

  deleteEvent: function(eventId) {
    if (confirm('Excluir este evento da agenda?')) {
      agendaEvents = agendaEvents.filter(e => e.id !== eventId);
      this.saveEvents();
      
      this.renderCalendar();
      this.renderUpcomingEvents();
      
      showNotification('Evento excluído', 'info');
    }
  },

  // ======================================================
  // NAVEGAÇÃO DO CALENDÁRIO
  // ======================================================

  prevMonth: function() {
    currentAgendaDate.setMonth(currentAgendaDate.getMonth() - 1);
    this.renderCalendar();
    this.renderUpcomingEvents();
  },

  nextMonth: function() {
    currentAgendaDate.setMonth(currentAgendaDate.getMonth() + 1);
    this.renderCalendar();
    this.renderUpcomingEvents();
  },

  // ======================================================
  // EXPORTAÇÃO DE AGENDA (PDF)
  // ======================================================

  exportToPDF: function() {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      showNotification('Biblioteca PDF não carregada', 'error');
      return;
    }

    showNotification('Gerando PDF da agenda premium...', 'info');

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Cabeçalho
      doc.setFillColor(26, 26, 26);
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      doc.setTextColor(212, 175, 55);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('AGENDA PREMIUM', pageWidth / 2, 15, { align: 'center' });
      
      doc.setTextColor(244, 228, 184);
      doc.setFontSize(10);
      doc.text('Exclusive Wallet • Sistema Polygon Identity', pageWidth / 2, 22, { align: 'center' });
      
      // Data de geração
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      doc.setTextColor(176, 176, 176);
      doc.setFontSize(8);
      doc.text(`Gerado em: ${formattedDate}`, pageWidth / 2, 28, { align: 'center' });
      
      // Linha divisória
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      doc.line(20, 35, pageWidth - 20, 35);
      
      // Mês atual
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      
      const currentMonth = monthNames[currentAgendaDate.getMonth()];
      const currentYear = currentAgendaDate.getFullYear();
      
      doc.setTextColor(212, 175, 55);
      doc.setFontSize(18);
      doc.text(`${currentMonth} de ${currentYear}`, pageWidth / 2, 45, { align: 'center' });
      
      // Eventos do mês
      const monthEvents = this.getEventsForMonth();
      
      let yPos = 55;
      
      if (monthEvents.length === 0) {
        doc.setTextColor(176, 176, 176);
        doc.setFontSize(12);
        doc.text('Nenhum evento agendado para este mês', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
      } else {
        doc.setTextColor(240, 240, 240);
        doc.setFontSize(14);
        doc.text('EVENTOS DO MÊS:', 20, yPos);
        yPos += 8;
        
        monthEvents.forEach((event, index) => {
          if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = 20;
          }
          
          // Data formatada
          const eventDate = new Date(event.date);
          const formattedEventDate = eventDate.toLocaleDateString('pt-BR', {
            weekday: 'short',
            day: '2-digit',
            month: 'short'
          });
          
          // Fundo do evento
          doc.setFillColor(30, 30, 30);
          doc.roundedRect(20, yPos, pageWidth - 40, 18, 2, 2, 'F');
          
          // Borda dourada
          doc.setDrawColor(212, 175, 55);
          doc.setLineWidth(0.3);
          doc.roundedRect(20, yPos, pageWidth - 40, 18, 2, 2);
          
          // Título
          doc.setTextColor(212, 175, 55);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text(event.title.substring(0, 40) + (event.title.length > 40 ? '...' : ''), 25, yPos + 6);
          
          // Data e hora
          doc.setTextColor(176, 176, 176);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.text(`${formattedEventDate} • ${event.time}`, 25, yPos + 12);
          
          yPos += 22;
        });
      }
      
      // Próximos eventos
      yPos += 10;
      
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }
      
      const upcomingEvents = this.getUpcomingEvents(10);
      
      doc.setTextColor(212, 175, 55);
      doc.setFontSize(14);
      doc.text('PRÓXIMOS EVENTOS:', 20, yPos);
      yPos += 8;
      
      if (upcomingEvents.length > 0) {
        upcomingEvents.forEach(event => {
          if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setTextColor(240, 240, 240);
          doc.setFontSize(9);
          doc.text(`• ${event.date} ${event.time} - ${event.title}`, 25, yPos);
          yPos += 6;
        });
      }
      
      // Rodapé
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text('Agenda Premium • Exclusive Wallet Polygon • Sistema 100% Client-Side', 
              pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Salvar PDF
      const fileName = `agenda-premium-${currentMonth.toLowerCase()}-${currentYear}.pdf`;
      doc.save(fileName);

      showNotification(`✅ Agenda salva como ${fileName}`, 'success');

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      showNotification('Erro ao gerar PDF da agenda: ' + error.message, 'error');
    }
  },

  // ======================================================
  // UTILITÁRIOS
  // ======================================================

  formatDate: function(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  },

  // ======================================================
  // SETUP DE EVENT LISTENERS
  // ======================================================

  setupEventListeners: function() {
    // Botões de navegação do mês
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const addEventBtn = document.getElementById('addEvent');
    const exportPDFBtn = document.getElementById('exportPDF');
    
    if (prevMonthBtn) {
      prevMonthBtn.addEventListener('click', () => this.prevMonth());
    }
    
    if (nextMonthBtn) {
      nextMonthBtn.addEventListener('click', () => this.nextMonth());
    }
    
    if (addEventBtn) {
      addEventBtn.addEventListener('click', () => this.addEvent());
    }
    
    if (exportPDFBtn) {
      exportPDFBtn.addEventListener('click', () => this.exportToPDF());
    }
    
    // Preencher data atual no formulário
    const today = new Date().toISOString().split('T')[0];
    const eventDateInput = document.getElementById('eventDate');
    if (eventDateInput && !eventDateInput.value) {
      eventDateInput.value = today;
    }
    
    // Preencher horário atual
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const eventTimeInput = document.getElementById('eventTime');
    if (eventTimeInput && !eventTimeInput.value) {
      eventTimeInput.value = `${hours}:${minutes}`;
    }
  }
};

// ======================================================
// EXPORTAÇÃO DO SISTEMA DE AGENDA
// ======================================================

window.agendaSystem = agendaSystem;

// Inicializar quando a aba for carregada
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar quando a aba de agenda for ativada
  const agendaTabButton = document.querySelector('.tab-button[data-tab="agendaTab"]');
  if (agendaTabButton) {
    agendaTabButton.addEventListener('click', function() {
      setTimeout(() => {
        if (typeof agendaSystem.init === 'function') {
          agendaSystem.init();
        }
      }, 300);
    });
  }
  
  // Inicializar se já estiver na aba de agenda
  if (document.getElementById('agendaTab') && 
      document.getElementById('agendaTab').classList.contains('active')) {
    setTimeout(() => {
      if (typeof agendaSystem.init === 'function') {
        agendaSystem.init();
      }
    }, 500);
  }
});
