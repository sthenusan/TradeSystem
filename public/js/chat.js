document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#messageForm');
  const input = document.querySelector('#messageInput');
  const chatBox = document.querySelector('#chat-box');

  // OPTIONAL: Initialize Socket.IO (you can skip this line until socket is wired)
  // const socket = io();

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const message = input.value.trim();
      if (!message) return;

      // Append message immediately (optional until sockets)
      const messageHTML = `
        <div class="message right-align">
          <p><strong>You:</strong> ${message}</p>
        </div>
      `;
      chatBox.innerHTML += messageHTML;
      chatBox.scrollTop = chatBox.scrollHeight;

      // socket.emit('chat message', message); // For real-time later

      form.submit(); // Let backend save message
    });
  }
});
