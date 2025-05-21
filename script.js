// DOM Elements
const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageBtn = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = fileUploadWrapper.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

// Proxy Configuration
const PROXY_URL = "https://deepsleep.joeqiao1234.workers.dev";
const PROXY_TOKEN = "YOUR_SECRET_TOKEN"; // Optional: Match this with your Worker's expected token

// User data and state
const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null,
  },
};

// Initialize chat
const initialInputHeight = messageInput.scrollHeight;
let isWaitingForResponse = false;

// Create message element
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Generate bot response via proxy
const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");
  
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${PROXY_TOKEN}` // Remove if not using auth
    },
    body: JSON.stringify({
      message: userData.message,
      ...(userData.file.data && {
        file: {
          data: userData.file.data,
          mime_type: userData.file.mime_type
        }
      })
    }),
  };

  try {
    const response = await fetch(PROXY_URL, requestOptions);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Failed to get response");
    }

    // Display the response (adjust based on your proxy's response format)
    const responseText = data.response || data.text || "I didn't understand that";
    messageElement.innerText = responseText;
    
  } catch (error) {
    console.error("Proxy Error:", error);
    messageElement.innerText = "DeepSleep AI is unavailable. Please try again later.";
    messageElement.style.color = "#ff4d4f";
  } finally {
    incomingMessageDiv.classList.remove("thinking");
    isWaitingForResponse = false;
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    userData.file = {};
  }
};

// Handle outgoing message
const handleOutgoingMessage = (e) => {
  e.preventDefault();
  
  if (isWaitingForResponse) return;
  
  const message = messageInput.value.trim();
  if (!message && !userData.file.data) return;

  userData.message = message;
  messageInput.value = "";
  messageInput.style.height = `${initialInputHeight}px`;
  fileUploadWrapper.classList.remove("file-uploaded");

  // Create user message
  const userMessageContent = `
    <div class="message-text">${userData.message}</div>
    ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />` : ""}
  `;
  const userMessageDiv = createMessageElement(userMessageContent, "user-message");
  chatBody.appendChild(userMessageDiv);

  // Create thinking indicator
  const botMessageContent = `
    <img class="bot-avatar" src="robotic.png" alt="DeepSleep AI" width="50" height="50">
    <div class="message-text">
      <div class="thinking-indicator">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>
  `;
  const botMessageDiv = createMessageElement(botMessageContent, "bot-message", "thinking");
  chatBody.appendChild(botMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  isWaitingForResponse = true;
  generateBotResponse(botMessageDiv);
};

// Event Listeners
messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`;
  messageInput.style.height = `${messageInput.scrollHeight}px`;
  document.querySelector(".chat-form").style.borderRadius = 
    messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && messageInput.value.trim()) {
    handleOutgoingMessage(e);
  }
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    fileUploadWrapper.querySelector("img").src = e.target.result;
    fileUploadWrapper.classList.add("file-uploaded");
    userData.file = {
      data: e.target.result.split(",")[1],
      mime_type: file.type
    };
  };
  reader.readAsDataURL(file);
});

fileCancelButton.addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("file-uploaded");
});

sendMessageBtn.addEventListener("click", handleOutgoingMessage);
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());
closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));

// Initialize emoji picker
const picker = new EmojiMart.Picker({
  theme: "light",
  onEmojiSelect: (emoji) => {
    const cursorPos = messageInput.selectionStart;
    messageInput.value = messageInput.value.substring(0, cursorPos) + 
                         emoji.native + 
                         messageInput.value.substring(cursorPos);
    messageInput.focus();
    messageInput.selectionEnd = cursorPos + emoji.native.length;
  }
});
document.querySelector(".chat-form").appendChild(picker);
