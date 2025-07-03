const API_BASE_URL = 'http://localhost:8080';

function initializeChatbot() {
    const toggleButton = document.getElementById('chatbot-toggle');
    const chatbotModal = document.getElementById('chatbot-modal');
    const closeButton = document.getElementById('chatbot-close');
    const chatbotForm = document.getElementById('chatbot-form');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const resetButton = document.getElementById('chatbot-reset');

    if (!toggleButton || !chatbotModal || !closeButton || !chatbotForm || !chatbotInput || !chatbotMessages) {
        console.error('Chatbot elements not found');
        return;
    }

    // Khôi phục lịch sử tin nhắn từ localStorage
    const savedMessages = localStorage.getItem('chatbotMessages');
    if (savedMessages) {
        chatbotMessages.innerHTML = savedMessages;
        scrollToBottom();
    } else {
        chatbotMessages.innerHTML = `
            <div class="chat-message bot-message mb-3 flex justify-start">
                <div class="flex items-start space-x-2">
                    <div class="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center">
                        <i class="fas fa-robot text-indigo-600 text-sm"></i>
                    </div>
                    <div class="rounded-2xl p-3 text-sm shadow-sm message-content max-w-[80%]" style="background: white; color: #1f2937;">
                        Xin chào! Tôi có thể giúp gì cho bạn hôm nay?
                    </div>
                </div>
            </div>
        `;
    }


    // Khôi phục trạng thái mở/đóng của chatbot
    const isChatbotOpen = localStorage.getItem('chatbotOpen') === 'true';
    if (isChatbotOpen) {
        chatbotModal.classList.remove('hidden');
        chatbotInput.focus();
    } else {
        chatbotModal.classList.add('hidden');
    }

    // Kiểm tra và khôi phục yêu cầu đang chờ
    const pendingRequest = localStorage.getItem('pendingRequest');
    const accumulatedText = localStorage.getItem('accumulatedText') || '';
    if (pendingRequest) {
        const message = JSON.parse(pendingRequest).message;
        addMessage(message, 'user');
        const botMessageElement = addMessage(accumulatedText, 'bot');
        const contentElement = botMessageElement.querySelector('.message-content');
        processPendingRequest(message, contentElement, accumulatedText);
    }

    scrollToBottom();


    toggleButton.addEventListener('click', () => {
        const isOpen = !chatbotModal.classList.contains('hidden');
        if (isOpen) {
            chatbotModal.classList.add('hidden');
            localStorage.setItem('chatbotOpen', 'false');
        } else {
            chatbotModal.classList.remove('hidden');
            localStorage.setItem('chatbotOpen', 'true');
            chatbotInput.focus();
        }
        scrollToBottom();
    });

    closeButton.addEventListener('click', () => {
        chatbotModal.classList.add('hidden');
        localStorage.setItem('chatbotOpen', 'false');
    });

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            localStorage.removeItem('chatbotMessages');
            localStorage.removeItem('pendingRequest');
            localStorage.removeItem('accumulatedText');
            chatbotMessages.innerHTML = `
                <div class="chat-message bot-message mb-3 flex justify-start">
                    <div class="flex items-start space-x-2">
                        <div class="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center">
                            <i class="fas fa-robot text-indigo-600 text-sm"></i>
                        </div>
                        <div class="rounded-2xl p-3 text-sm shadow-sm message-content max-w-[80%]" style="background: white; color: #1f2937;">
                            Xin chào! Tôi có thể giúp gì cho bạn hôm nay?
                        </div>
                    </div>
                </div>
            `;
            scrollToBottom();
            localStorage.setItem('chatbotMessages', chatbotMessages.innerHTML);
        });
    }

    chatbotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatbotInput.value.trim();
        if (!message) {
            const tempMessage = addMessage('Vui lòng nhập tin nhắn.', 'bot');
            setTimeout(() => {
                tempMessage.remove();
                localStorage.setItem('chatbotMessages', chatbotMessages.innerHTML);
            }, 3000);
            chatbotInput.focus();
            return;
        }

        addMessage(message, 'user');
        chatbotInput.value = '';

        // Lưu yêu cầu đang chờ
        localStorage.setItem('pendingRequest', JSON.stringify({ message }));
        localStorage.setItem('accumulatedText', '');

        try {
            const response = await fetchStreamWithRetry(`${API_BASE_URL}/api/chat/stream?chat=${encodeURIComponent(message)}`);
            const reader = response.body.getReader();
            const botMessageElement = addMessage('', 'bot');
            const contentElement = botMessageElement.querySelector('.message-content');
            await processStream(reader, contentElement, message);
            localStorage.setItem('chatbotMessages', chatbotMessages.innerHTML);
            localStorage.removeItem('pendingRequest');
            localStorage.removeItem('accumulatedText');
        } catch (error) {
            console.error('Lỗi chatbot:', error);
            addMessage('Lỗi kết nối server. Vui lòng thử lại sau.', 'bot');
            localStorage.setItem('chatbotMessages', chatbotMessages.innerHTML);
            localStorage.removeItem('pendingRequest');
            localStorage.removeItem('accumulatedText');
        }
    });

    async function processPendingRequest(message, contentElement, accumulatedText) {
        try {
            const response = await fetchStreamWithRetry(`${API_BASE_URL}/api/chat/stream?chat=${encodeURIComponent(message)}`);
            const reader = response.body.getReader();
            await processStream(reader, contentElement, message, accumulatedText);
            localStorage.setItem('chatbotMessages', chatbotMessages.innerHTML);
            localStorage.removeItem('pendingRequest');
            localStorage.removeItem('accumulatedText');
        } catch (error) {
            console.error('Lỗi xử lý yêu cầu đang chờ:', error);
            addMessage('Lỗi kết nối lại server. Vui lòng thử lại.', 'bot');
            localStorage.setItem('chatbotMessages', chatbotMessages.innerHTML);
            localStorage.removeItem('pendingRequest');
            localStorage.removeItem('accumulatedText');
        }
    }

    async function fetchStreamWithRetry(url, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Lỗi HTTP! trạng thái: ${response.status}`);
                return response;
            } catch (e) {
                console.error(`Thử lần ${i + 1} thất bại: ${e.message}`);
                if (i === retries - 1) throw e;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    async function processStream(reader, contentElement, message, accumulatedText = '') {
        const decoder = new TextDecoder('utf-8');
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    const sanitizedText = sanitizeText(accumulatedText);
                    const parsedHtml = marked.parse(sanitizedText, { breaks: true, gfm: true });
                    contentElement.innerHTML = stripOuterPTags(parsedHtml);
                    scrollToBottom();
                    break;
                }
                const chunk = decoder.decode(value, { stream: true });
                accumulatedText += chunk;
                localStorage.setItem('accumulatedText', accumulatedText);
                const sanitizedText = sanitizeText(accumulatedText);
                const parsedHtml = marked.parse(sanitizedText, { breaks: true, gfm: true });
                contentElement.innerHTML = stripOuterPTags(parsedHtml);
                scrollToBottom();
            }
        } catch (error) {
            console.error('Lỗi xử lý stream:', error);
            const sanitizedText = sanitizeText(accumulatedText + '\n[Lỗi: Stream bị gián đoạn. Vui lòng thử lại.]');
            const parsedHtml = marked.parse(sanitizedText, { breaks: true, gfm: true });
            contentElement.innerHTML = stripOuterPTags(parsedHtml);
            scrollToBottom();
        }
    }

    function sanitizeText(text) {
        return DOMPurify.sanitize(text, {
            ALLOWED_TAGS: ['strong', 'em', 'ul', 'ol', 'li', 'br', 'code', 'pre'],
            ALLOWED_ATTR: []
        }).trim();
    }

    function stripOuterPTags(html) {
        return html.replace(/^<p>([\s\S]*?)<\/p>$/, '$1').trim();
    }

    function addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}-message mb-3 flex ${type === 'user' ? 'justify-end' : 'justify-start'}`;
        messageDiv.innerHTML = `
            <div class="flex items-start space-x-2 ${type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}">
                <div class="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center">
                    <i class="fas ${type === 'user' ? 'fa-user' : 'fa-robot'} text-indigo-600 text-sm"></i>
                </div>
                <div class="rounded-2xl p-3 text-sm shadow-sm message-content max-w-[80%]" style="${type === 'user' ? 'background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white;' : 'background: white; color: #1f2937;'}">${type === 'user' ? text : ''}</div>
            </div>
        `;
        chatbotMessages.appendChild(messageDiv);
        scrollToBottom();
        return messageDiv;
    }

    function scrollToBottom() {
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', initializeChatbot);