// ======================================================
// SISTEMA DE AGENDA
// ======================================================

// Sistema de agenda
const agendaSystem = {
  events: [],
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),

  // Inicializar agenda
  init() {
    this.loadEvents();
    this.renderCalendar();
    this.renderEventsList();
    
    // Adicionar event listeners
    document.getElementById('prevMonth')?.addEventListener('click', () => this.changeMonth(-1));
    document.getElementById('nextMonth')?.addEventListener('click', () => this.changeMonth(1));
    document.getElementById('addEvent')?.addEventListener('click', () => this.addEvent());
    document.getElementById('exportPDF')?.addEventListener('click', () => this.exportToPDF());
  },

  // Carregar eventos do localStorage
  loadEvents() {
    this.events = loadFromStorage('exclusiveWalletAgenda', []);
  },

  // Salvar eventos no localStorage
  saveEvents() {
    saveToStorage('exclusiveWalletAgenda', this.events);
  },

  // Renderizar calendário
  renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;

    // Limpar calendário
    calendarGrid.innerHTML = '';

    // Cabeçalhos dos dias da semana
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    daysOfWeek.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'agenda-day';
      dayHeader.style.textAlign = 'center';
      dayHeader.style.fontWeight = '600';
      dayHeader.style.color = 'var(--primary-color)';
      dayHeader.textContent = day;
      calendarGrid.appendChild(dayHeader);
    });

    // Primeiro dia do mês
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    // Último dia do mês
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    
    // Dias do mês anterior para preencher o início
    const startingDay = firstDay.getDay();
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();

    // Total de células no calendário (6 semanas * 7 dias = 42)
    for (let i = 0; i < 42; i++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'agenda-day';

      let dayNumber;
      let isCurrentMonth = false;

      if (i < startingDay) {
        // Dias do mês anterior
        dayNumber = prevMonthLastDay - startingDay + i + 1;
        dayElement.style.opacity = '0.5';
      } else if (i - startingDay + 1 > lastDay.getDate()) {
        // Dias do próximo mês
        dayNumber = i - startingDay - lastDay.getDate() + 1;
        dayElement.style.opacity = '0.5';
      } else {
        // Dias do mês atual
        dayNumber = i - startingDay + 1;
        isCurrentMonth = true;
      }

      // Adicionar número do dia
      const dayNumberElement = document.createElement('div');
      dayNumberElement.className = 'agenda-day-number';
      dayNumberElement.textContent = dayNumber;
      dayElement.appendChild(dayNumberElement);

      // Adicionar eventos deste dia
      if (isCurrentMonth) {
        const currentDate = new Date(this.currentYear, this.currentMonth, dayNumber);
        const dayEvents = this.getEventsForDate(currentDate);
        
        dayEvents.forEach(event => {
          const eventElement = document.createElement('div');
          eventElement.className = 'agenda-day-event';
          eventElement.textContent = event.title;
          eventElement.title = `${event.title}\n${event.description || ''}`;
          dayElement.appendChild(eventElement);
        });

        // Marcar dia atual
        const today = new Date();
        if (currentDate.toDateString() === today.toDateString()) {
          dayElement.classList.add('selected');
        }

        // Adicionar clique para selecionar data
        dayElement.addEventListener('click', () => {
          this.selectDate(currentDate);
        });
      }

      calendarGrid.appendChild(dayElement);
    }

    // Atualizar título do mês
    const monthTitle = document.getElementById('currentMonth');
    if (monthTitle) {
      const monthNames = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
      ];
      monthTitle.textContent = `${monthNames[this.currentMonth]} de ${this.currentYear}`;
    }
  },

  // Mudar mês
  changeMonth(delta) {
    this.currentMonth += delta;
    
    // Ajustar ano se necessário
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    
    this.renderCalendar();
  },

  // Selecionar data
  selectDate(date) {
    const eventDateInput = document.getElementById('eventDate');
    if (eventDateInput) {
      eventDateInput.value = date.toISOString().split('T')[0];
    }
    
    // Atualizar seleção visual
    document.querySelectorAll('.agenda-day').forEach(day => {
      day.classList.remove('selected');
    });
    
    // Encontrar e selecionar o dia clicado
    const days = document.querySelectorAll('.agenda-day');
    const clickedDay = Array.from(days).find(day => {
      const dayNumber = day.querySelector('.agenda-day-number')?.textContent;
      if (dayNumber && !day.style.opacity) {
        const dayDate = new Date(this.currentYear, this.currentMonth, parseInt(dayNumber));
        return dayDate.toDateString() === date.toDateString();
      }
      return false;
    });
    
    if (clickedDay) {
      clickedDay.classList.add('selected');
    }
  },

  // Obter eventos para uma data específica
  getEventsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return this.events.filter(event => {
      const eventDate = new Date(event.date);
      const eventDateStr = eventDate.toISOString().split('T')[0];
      return eventDateStr === dateStr;
    });
  },

  // Adicionar evento
  addEvent() {
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

    const eventDate = new Date(`${date}T${time}`);
    
    const newEvent = {
      id: generateId(),
      title: title,
      date: eventDate.toISOString(),
      time: time,
      description: description,
      createdAt: new Date().toISOString()
    };

    this.events.push(newEvent);
    this.saveEvents();
    this.renderCalendar();
    this.renderEventsList();

    // Limpar formulário
    titleInput.value = '';
    dateInput.value = '';
    timeInput.value = '';
    descriptionInput.value = '';

    showNotification('✅ Evento adicionado à agenda!', 'success');
  },

  // Renderizar lista de eventos
  renderEventsList() {
    const eventsList = document.getElementById('eventsList');
    if (!eventsList) return;

    eventsList.innerHTML = '';

    // Ordenar eventos por data (mais próximos primeiro)
    const sortedEvents = [...this.events].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Pegar próximos 5 eventos
    const upcomingEvents = sortedEvents.filter(event => new Date(event.date) >= new Date()).slice(0, 5);

    if (upcomingEvents.length === 0) {
      eventsList.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-secondary);">
          <i class="fas fa-calendar" style="font-size: 24px; margin-bottom: 10px;"></i>
          <div>Nenhum evento agendado</div>
        </div>
      `;
      return;
    }

    upcomingEvents.forEach(event => {
      const eventElement = document.createElement('div');
      eventElement.className = 'agenda-entry';
      
      const eventDate = new Date(event.date);
      const formattedDate = eventDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });

      eventElement.innerHTML = `
        <div class="agenda-header">
          <div class="agenda-title">${sanitizeInput(event.title)}</div>
          <div class="agenda-status ${this.getEventStatus(event)}">${this.getEventStatusText(event)}</div>
        </div>
        <div class="agenda-description">${sanitizeInput(event.description || 'Sem descrição')}</div>
        <div class="agenda-footer">
          <div>${formattedDate}</div>
          <button class="btn btn-secondary btn-small" onclick="agendaSystem.removeEvent('${event.id}')" style="padding: 4px 8px; font-size: 10px;">
            <i class="fas fa-trash"></i> Remover
          </button>
        </div>
      `;
      eventsList.appendChild(eventElement);
    });
  },

  // Obter status do evento
  getEventStatus(event) {
    const eventDate = new Date(event.date);
    const now = new Date();
    
    if (eventDate < now) {
      return 'status-completed';
    } else if ((eventDate - now) < 24 * 60 * 60 * 1000) { // Próximas 24 horas
      return 'status-in-progress';
    } else {
      return 'status-planning';
    }
  },

  // Obter texto do status
  getEventStatusText(event) {
    const eventDate = new Date(event.date);
    const now = new Date();
    
    if (eventDate < now) {
      return 'Concluído';
    } else if ((eventDate - now) < 24 * 60 * 60 * 1000) {
      return 'Em breve';
    } else {
      return 'Agendado';
    }
  },

  // Remover evento
  removeEvent(eventId) {
    if (confirm('Remover este evento da agenda?')) {
      this.events = this.events.filter(event => event.id !== eventId);
      this.saveEvents();
      this.renderCalendar();
      this.renderEventsList();
      showNotification('Evento removido', 'info');
    }
  },

  // Exportar para PDF
  exportToPDF() {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      showNotification('Biblioteca PDF não carregada', 'error');
      return;
    }

    showNotification('Gerando PDF da agenda...', 'info');

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Cabeçalho
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(212, 175, 55);
      doc.text('Agenda Premium Polygon', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(128, 128, 128);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 30, { align: 'center' });
      
      // Linha divisória
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      doc.line(20, 35, pageWidth - 20, 35);
      
      // Lista de eventos
      let yPos = 45;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      
      const sortedEvents = [...this.events].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      sortedEvents.forEach((event, index) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${event.title}`, 20, yPos);
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Data: ${formattedDate}`, 25, yPos + 7);
        
        if (event.description) {
          const descriptionLines = doc.splitTextToSize(`Descrição: ${event.description}`, pageWidth - 40);
          doc.text(descriptionLines, 25, yPos + 14);
          yPos += 7 * descriptionLines.length;
        }
        
        yPos += 25;
        
        // Linha divisória entre eventos
        if (index < sortedEvents.length - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.2);
          doc.line(20, yPos - 5, pageWidth - 20, yPos - 5);
        }
      });
      
      // Rodapé
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Exclusive Wallet Premium • Sistema Polygon Identity', pageWidth / 2, 280, { align: 'center' });
      
      // Salvar PDF
      const fileName = `agenda-polygon-${new Date().getTime()}.pdf`;
      doc.save(fileName);
      
      showNotification(`✅ Agenda exportada como ${fileName}`, 'success');
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      showNotification('Erro ao gerar PDF da agenda', 'error');
    }
  }
};

// Inicializar agenda quando a aba for ativada
function initAgenda() {
  agendaSystem.init();
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.agenda = agendaSystem;
  window.initAgenda = initAgenda;
  window.agendaSystem = agendaSystem;
}
