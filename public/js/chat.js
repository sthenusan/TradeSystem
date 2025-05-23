document.getElementById('messageForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const content = document.getElementById('msgInput').value;
  const recipientId = document.getElementById('recipientId').value;
  const tradeId = document.getElementById('tradeId').value;

  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, recipientId, tradeId })
  });

  const message = await res.json();
  appendMessage(message);
  document.getElementById('msgInput').value = '';
});

function appendMessage(message) {
  const chatBox = document.getElementById('chatBox');
  const div = document.createElement('div');
  div.className = message.sender === CURRENT_USER_ID ? 'sent' : 'received';
  div.innerHTML = `
    <p>${message.content}</p>
    <span>${new Date(message.createdAt).toLocaleTimeString()}</span>
  `;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}
