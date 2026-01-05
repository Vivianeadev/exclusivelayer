// AGENDA FUNCTIONS
const agendaSystem = {
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  events: [],

  init: function() {
    this.loadEvents();
    this.renderCalendar();
    this.renderUpcomingEvents();
    
    document.getElementById('prevMonth').addEventListener('click', () => this.prevMonth());
    document.getElementById('nextMonth').addEventListener('click', () => this.nextMonth());
    document.getElementById('addEvent').addEventListener('click', () => this.addEvent());
    document.getElementById('exportPDF').addEventListener('click', () => this.exportPDF());
  },

  loadEvents: function() {
    const savedEvents = localStorage.getItem('exclusiveWalletAgenda');
    this.events = savedEvents ? JSON.parse(savedEvents) : [];
  },

  saveEvents: function() {
    localStorage.setItem('exclusiveWalletAgenda', JSON.stringify(this.events));
  },

  renderCalendar: function() {
    const monthNames = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];

    document.getElementById('currentMonth').textContent = 
      `${monthNames[this.currentMonth]} de ${this.currentYear}`;

    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    dayNames.forEach(day => {
      const dayElement = document.createElement('div');
      dayElement.style.textAlign = 'center';
      dayElement.style.fontWeight = '600';
      dayElement.style.color = 'var(--primary-color)';
      dayElement.style.padding = '10px 0';
      dayElement.textContent = day;
      calendarGrid.appendChild(dayElement);
    });

    for (let i = 0; i < startingDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'agenda-day';
      calendarGrid.appendChild(emptyDay);
    }

    const today = new Date();
    const isCurrentMonth = today.getMonth() === this.currentMonth && today.getFullYear() === this.currentYear;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'agenda-day';
      
      if (isCurrentMonth && day === today.getDate()) {
        dayElement.classList.add('selected');
      }

      const dayNumber = document.createElement('div');
      dayNumber.className = 'agenda-day-number';
      dayNumber.textContent = day;
      dayElement.appendChild(dayNumber);

      const dayEvents = this.getEventsForDay(day);
      dayEvents.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'agenda-day-event';
        eventElement.textContent = event.title;
        eventElement.title = `${event.title} - ${event.time}`;
        dayElement.appendChild(eventElement);
      });

      dayElement.addEventListener('click', () => this.selectDay(day));
      calendarGrid.appendChild(dayElement);
    }
  },

  getEventsForDay: function(day) {
    return this.events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === this.currentMonth && 
             eventDate.getFullYear() === this.currentYear;
    });
  },

  selectDay: function(day) {
    const selectedDate = new Date(this.currentYear, this.currentMonth, day);
    document.getElementById('eventDate').value = selectedDate.toISOString().split('T')[0];
    
    document.querySelectorAll('.agenda-day').forEach(el => el.classList.remove('selected'));
    
    const dayElements = document.querySelectorAll('.agenda-day');
    const dayIndex = Array.from(dayElements).findIndex(el => 
      el.querySelector('.agenda-day-number')?.textContent === day.toString()
    );
    
    if (dayIndex >= 0) {
      dayElements[dayIndex].classList.add('selected');
    }
  },

  prevMonth: function() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.renderCalendar();
  },

  nextMonth: function() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.renderCalendar();
  },

  addEvent: function() {
    const title = document.getElementById('eventTitle').value.trim();
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const description = document.getElementById('eventDescription').value.trim();

    if (!title || !date) {
      showNotification('Preencha pelo menos título e data', 'error');
      return;
    }

    const event = {
      id: Date.now().toString(),
      title: title,
      date: date,
      time: time || '00:00',
      description: description,
      createdAt: new Date().toISOString()
    };

    this.events.push(event);
    this.saveEvents();
    this.renderCalendar();
    this.renderUpcomingEvents();

    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDate').value = '';
    document.getElementById('eventTime').value = '';
    document.getElementById('eventDescription').value = '';

    showNotification('Evento adicionado à agenda premium', 'success');
  },

  renderUpcomingEvents: function() {
    const container = document.getElementById('eventsList');
    if (!container) return;

    container.innerHTML = '';

    const now = new Date();
    const upcomingEvents = this.events
      .filter(event => new Date(event.date + 'T' + event.time) > now)
      .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
      .slice(0, 5);

    if (upcomingEvents.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
          <i class="fas fa-calendar-plus" style="font-size: 24px; margin-bottom: 10px;"></i>
          <div>Nenhum evento agendado</div>
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
          <div class="agenda-status status-planning">Agendado</div>
        </div>
        <div class="agenda-description">
          ${this.formatDate(event.date)} • ${event.time || 'Horário não definido'}
          ${event.description ? `<br>${event.description}` : ''}
        </div>
        <div class="agenda-footer">
          <div>${this.formatRelativeTime(event.date)}</div>
          <button class="btn btn-secondary btn-small" onclick="agendaSystem.removeEvent('${event.id}')" style="padding: 4px 8px; font-size: 10px;">
            <i class="fas fa-trash"></i> Remover
          </button>
        </div>
      `;
      container.appendChild(eventElement);
    });
  },

  removeEvent: function(eventId) {
    if (confirm('Remover este evento da agenda?')) {
      this.events = this.events.filter(event => event.id !== eventId);
      this.saveEvents();
      this.renderCalendar();
      this.renderUpcomingEvents();
      showNotification('Evento removido', 'info');
    }
  },

  formatDate: function(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  },

  formatRelativeTime: function(dateString) {
    const now = new Date();
    const eventDate = new Date(dateString);
    const diffTime = eventDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays < 0) return 'Passado';
    if (diffDays < 7) return `Em ${diffDays} dias`;
    if (diffDays < 30) return `Em ${Math.floor(diffDays / 7)} semanas`;
    return `Em ${Math.floor(diffDays / 30)} meses`;
  },

  exportPDF: function() {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      showNotification('Biblioteca PDF não carregada', 'error');
      return;
    }

    showNotification('Gerando PDF da agenda premium...', 'info');

    try {
      const doc = new jsPDF();
      const monthNames = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
      ];

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(212, 175, 55);
      doc.text('Agenda Premium Polygon', 105, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setTextColor(26, 26, 26);
      doc.text(`${monthNames[this.currentMonth]} de ${this.currentYear}`, 105, 30, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 38, { align: 'center' });

      let yPos = 50;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(26, 26, 26);
      doc.text('Próximos Eventos:', 20, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const now = new Date();
      const upcomingEvents = this.events
        .filter(event => new Date(event.date + 'T' + event.time) > now)
        .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));

      if (upcomingEvents.length === 0) {
        doc.setTextColor(150, 150, 150);
        doc.text('Nenhum evento agendado', 25, yPos);
        yPos += 6;
      } else {
        upcomingEvents.forEach((event, index) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }

          doc.setTextColor(26, 26, 26);
          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}. ${event.title}`, 25, yPos);
          yPos += 5;

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          const dateStr = `${this.formatDate(event.date)} • ${event.time || 'Sem horário'}`;
          doc.text(dateStr, 30, yPos);
          yPos += 5;

          if (event.description) {
            const lines = doc.splitTextToSize(event.description, 160);
            doc.text(lines, 30, yPos);
            yPos += lines.length * 5;
          }

          yPos += 3;
        });
      }

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Agenda Premium Polygon • Sistema exclusivo client-side', 105, 285, { align: 'center' });

      const fileName = `agenda-polygon-${this.currentYear}-${this.currentMonth + 1}.pdf`;
      doc.save(fileName);

      showNotification(`✅ Agenda exportada como ${fileName}`, 'success');

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      showNotification('Erro ao gerar PDF da agenda: ' + error.message, 'error');
    }
  }
};

// Inicialização automática quando a aba é carregada
document.addEventListener('DOMContentLoaded', function() {
  // Inicialização é feita via switchTab() em main.js
});
