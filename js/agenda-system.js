// EXCLUSIVE WALLET PREMIUM - AGENDA SYSTEM

const agendaSystem = {
  currentDate: new Date(),
  selectedDate: new Date(),
  events: JSON.parse(localStorage.getItem('exclusiveWalletAgenda') || '{}'),

  init() {
    this.renderCalendar();
    this.renderEvents();
    this.updateFormDate();
    this.bindEvents();
  },

  bindEvents() {
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const addEventBtn = document.getElementById('addEvent');
    const exportPDFBtn = document.getElementById('exportPDF');

    if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => this.prevMonth());
    if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => this.nextMonth());
    if (addEventBtn) addEventBtn.addEventListener('click', () => this.addEvent());
    if (exportPDFBtn) exportPDFBtn.addEventListener('click', () => this.exportToPDF());
  },

  renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const monthNames = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    
    const currentMonthElement = document.getElementById('currentMonth');
    if (currentMonthElement) {
      currentMonthElement.textContent = `${monthNames[month]} de ${year}`;
    }

    calendarGrid.innerHTML = '';

    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    daysOfWeek.forEach(day => {
      const dayElement = document.createElement('div');
      dayElement.style.background = 'var(--card-bg)';
      dayElement.style.padding = '8px';
      dayElement.style.textAlign = 'center';
      dayElement.style.fontSize = '12px';
      dayElement.style.color = 'var(--primary-color)';
      dayElement.style.fontWeight = '500';
      dayElement.textContent = day;
      calendarGrid.appendChild(dayElement);
    });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();

    for (let i = 0; i < firstDayOfWeek; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'agenda-day';
      emptyDay.style.opacity = '0.3';
      calendarGrid.appendChild(emptyDay);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'agenda-day';
      dayElement.title = 'Clique para ver/editar eventos deste dia';

      const currentDate = new Date(year, month, day);
      const isToday = this.isSameDate(currentDate, new Date());
      const isSelected = this.isSameDate(currentDate, this.selectedDate);

      if (isSelected) {
        dayElement.classList.add('selected');
      }

      dayElement.onclick = () => this.selectDate(year, month, day);

      const dayNumber = document.createElement('div');
      dayNumber.className = 'agenda-day-number';
      dayNumber.textContent = day;
      
      if (isToday) {
        dayNumber.style.color = 'var(--primary-color)';
        dayNumber.style.fontWeight = '700';
        dayElement.style.border = '1px solid var(--primary-color)';
      }

      dayElement.appendChild(dayNumber);

      const dateKey = `${year}-${month + 1}-${day}`;
      if (this.events[dateKey]) {
        this.events[dateKey].forEach(event => {
          const eventElement = document.createElement('div');
          eventElement.className = 'agenda-day-event';
          eventElement.title = event.title;
          eventElement.textContent = event.title.substring(0, 15) + (event.title.length > 15 ? '...' : '');
          dayElement.appendChild(eventElement);
        });
      }

      calendarGrid.appendChild(dayElement);
    }
  },

  selectDate(year, month, day) {
    this.selectedDate = new Date(year, month, day);
    this.renderCalendar();
    this.updateFormDate();
    this.renderEvents();
    showNotification(`Data ${day}/${month + 1}/${year} selecionada`, 'info');
  },

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.renderCalendar();
  },

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.renderCalendar();
  },

  updateFormDate() {
    const dateInput = document.getElementById('eventDate');
    if (!dateInput) return;

    const year = this.selectedDate.getFullYear();
    const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(this.selectedDate.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
  },

  addEvent() {
    const title = document.getElementById('eventTitle').value.trim();
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const description = document.getElementById('eventDescription').value.trim();

    if (!title) {
      showNotification('Digite um título para o evento', 'error');
      return;
    }

    const eventId = Date.now().toString();
    const event = {
      id: eventId,
      title,
      date,
      time,
      description,
      createdAt: new Date().toISOString()
    };

    const dateKey = date;
    if (!this.events[dateKey]) {
      this.events[dateKey] = [];
    }

    this.events[dateKey].push(event);
    this.saveEvents();

    document.getElementById('eventTitle').value = '';
    document.getElementById('eventTime').value = '';
    document.getElementById('eventDescription').value = '';

    this.renderCalendar();
    this.renderEvents();
    showNotification('Evento adicionado com sucesso!', 'success');
  },

  deleteEvent(eventId) {
    for (const dateKey in this.events) {
      this.events[dateKey] = this.events[dateKey].filter(event => event.id !== eventId);
      if (this.events[dateKey].length === 0) {
        delete this.events[dateKey];
      }
    }
    this.saveEvents();
    this.renderCalendar();
    this.renderEvents();
    showNotification('Evento removido com sucesso!', 'success');
  },

  renderEvents() {
    const eventsList = document.getElementById('eventsList');
    if (!eventsList) return;

    eventsList.innerHTML = '';

    const allEvents = [];
    for (const dateKey in this.events) {
      this.events[dateKey].forEach(event => {
        allEvents.push({
          ...event,
          dateKey
        });
      });
    }

    allEvents.sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));

    if (allEvents.length === 0) {
      eventsList.innerHTML = `
        <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
          <i class="fas fa-calendar-plus" style="font-size: 24px; margin-bottom: 10px;"></i><br>
          Nenhum evento agendado. Adicione seu primeiro evento acima.
        </div>
      `;
      return;
    }

    allEvents.forEach(event => {
      const eventDate = new Date(event.date);
      const formattedDate = eventDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      
      const eventTime = event.time ? ` às ${event.time}` : '';

      const eventElement = document.createElement('div');
      eventElement.className = 'token-item';
      eventElement.innerHTML = `
        <div class="token-info">
          <div style="width: 40px; height: 40px; background: var(--gradient-card); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-calendar-day" style="color: var(--primary-color);"></i>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div class="token-symbol" style="font-size: 14px; margin-bottom: 4px;">${event.title}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">
              <i class="far fa-calendar"></i> ${formattedDate}${eventTime}
            </div>
            ${event.description ? `
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 5px; line-height: 1.4;">
                <i class="far fa-file-alt"></i> ${event.description}
              </div>
            ` : ''}
          </div>
        </div>
        <div class="token-balance">
          <button class="btn btn-secondary btn-small" 
                  style="margin: 0; padding: 5px 10px;" 
                  onclick="agendaSystem.deleteEvent('${event.id}')"
                  title="Remover evento">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      eventsList.appendChild(eventElement);
    });
  },

  saveEvents() {
    localStorage.setItem('exclusiveWalletAgenda', JSON.stringify(this.events));
  },

  isSameDate(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  },

  exportToPDF() {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      showNotification('Biblioteca PDF não carregada. Atualize a página.', 'error');
      return;
    }
    
    showNotification('Gerando PDF da agenda...', 'info');
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      doc.setFillColor(26, 26, 26);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(212, 175, 55);
      doc.setFont('helvetica
