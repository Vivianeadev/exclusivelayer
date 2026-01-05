// Sistema de notificações
export function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  const messageElement = document.getElementById('notificationMessage');
  
  if (!notification || !messageElement) return;
  
  messageElement.textContent = message;
  
  const colors = {
    info: 'var(--primary-color)',
    success: 'var(--success-color)',
    warning: 'var(--warning-color)',
    error: 'var(--error-color)'
  };
  
  notification.style.borderColor = colors[type] || colors.info;
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 4000);
}
