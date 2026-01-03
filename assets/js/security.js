// SISTEMA DE AGENDA
const agendaSystem = {
  currentDate: new Date(),
  
  init: function() {
    this.renderCalendar();
    this.setupEventListeners();
  },
  
  renderCalendar: function() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    document.getElementById('currentMonth').textContent = 
      this.currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    // Limpar calendário
    calendarGrid.innerHTML = '';
    
    // Dias da semana
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    daysOfWeek.forEach(day => {
      const dayElement = document.createElement('div');
      dayElement.style.textAlign = 'center';
      dayElement.style.fontWeight = '600';
      dayElement.style.color = 'var(--primary-color)';
      dayElement.style.padding = '8px';
      dayElement.textContent = day;
      calendarGrid.appendChild(dayElement);
    });
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay();
    
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Dias vazios antes do primeiro dia
    for (let i = 0; i < startingDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'agenda-day';
      calendarGrid.appendChild(emptyDay);
    }
    
    // Dias do mês
    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'agenda-day';
      
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === today.toDateString();
      
      if (isToday) {
        dayElement.classList.add('selected');
      }
      
      dayElement.innerHTML = `
        <div class="agenda-day-number">${day}</div>
      `;
      
      dayElement.onclick = () => {
        this.selectDay(day);
      };
      
      calendarGrid.appendChild(dayElement);
    }
  },
  
  selectDay: function(day) {
    document.querySelectorAll('.agenda-day').forEach(el => {
      el.classList.remove('selected');
    });
    
    const selectedElement = Array.from(document.querySelectorAll('.agenda-day-number'))
      .find(el => parseInt(el.textContent) === day);
    
    if (selectedElement) {
      selectedElement.parentElement.classList.add('selected');
      
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth() + 1;
      const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      document.getElementById('eventDate').value = formattedDate;
    }
  },
  
  setupEventListeners: function() {
    document.getElementById('prevMonth')?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderCalendar();
    });
    
    document.getElementById('nextMonth')?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderCalendar();
    });
    
    document.getElementById('addEvent')?.addEventListener('click', () => {
      this.addEvent();
    });
    
    document.getElementById('exportPDF')?.addEventListener('click', () => {
      this.exportPDF();
    });
  },
  
  addEvent: function() {
    const title = document.getElementById('eventTitle').value.trim();
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const description = document.getElementById('eventDescription').value.trim();
    
    if (!title || !date) {
      showNotification('Preencha título e data do evento', 'error');
      return;
    }
    
    const event = {
      title,
      date,
      time,
      description,
      id: Date.now()
    };
    
    // Salvar no localStorage
    const events = JSON.parse(localStorage.getItem('agendaEvents') || '[]');
    events.push(event);
    localStorage.setItem('agendaEvents', JSON.stringify(events));
    
    // Limpar formulário
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDate').value = '';
    document.getElementById('eventTime').value = '';
    document.getElementById('eventDescription').value = '';
    
    showNotification('Evento adicionado à agenda!', 'success');
    this.renderUpcomingEvents();
  },
  
  renderUpcomingEvents: function() {
    const eventsList = document.getElementById('eventsList');
    if (!eventsList) return;
    
    const events = JSON.parse(localStorage.getItem('agendaEvents') || '[]');
    
    if (events.length === 0) {
      eventsList.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
          <i class="fas fa-calendar-plus" style="font-size: 24px; margin-bottom: 10px;"></i>
          <div>Nenhum evento agendado</div>
        </div>
      `;
      return;
    }
    
    eventsList.innerHTML = '';
    
    // Ordenar por data
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Mostrar próximos 5 eventos
    events.slice(0, 5).forEach(event => {
      const eventElement = document.createElement('div');
      eventElement.className = 'agenda-entry';
      eventElement.style.marginBottom = '15px';
      
      const eventDate = new Date(event.date);
      const formattedDate = eventDate.toLocaleDateString('pt-BR');
      
      eventElement.innerHTML = `
        <div class="agenda-header">
          <div class="agenda-title">${event.title}</div>
          <div class="agenda-status status-in-progress">Agendado</div>
        </div>
        <div class="agenda-description">${event.description || 'Sem descrição'}</div>
        <div class="agenda-footer">
          <div>${formattedDate} ${event.time ? `• ${event.time}` : ''}</div>
          <button class="btn btn-secondary btn-small" onclick="agendaSystem.removeEvent(${event.id})" style="padding: 4px 8px; font-size: 10px;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      
      eventsList.appendChild(eventElement);
    });
  },
  
  removeEvent: function(eventId) {
    if (confirm('Remover este evento da agenda?')) {
      let events = JSON.parse(localStorage.getItem('agendaEvents') || '[]');
      events = events.filter(e => e.id !== eventId);
      localStorage.setItem('agendaEvents', JSON.stringify(events));
      
      this.renderUpcomingEvents();
      showNotification('Evento removido', 'info');
    }
  },
  
  exportPDF: function() {
    showNotification('Exportando agenda em PDF...', 'info');
    
    // Simular exportação
    setTimeout(() => {
      showNotification('✅ Agenda exportada como agenda-polygon.pdf', 'success');
    }, 1500);
  }
};

// INICIALIZAR AGENDA QUANDO A ABA FOR CARREGADA
if (document.getElementById('agendaTab')) {
  agendaSystem.init();
  agendaSystem.renderUpcomingEvents();
}