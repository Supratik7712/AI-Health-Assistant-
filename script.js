/* ================================
   🔑  API KEY HERE
================================ */
const API_KEY = "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";
// OpenRouter model to use. Change this if your OpenRouter key supports a different model.
const OPENROUTER_MODEL = "gpt-4o-mini";

// THEME: toggle and persistence
function applyTheme(theme){
   document.body.setAttribute('data-theme', theme);
   const btn = document.getElementById('themeToggle');
   if(btn) {
      btn.textContent = theme === 'light' ? '🌞' : '🌙';
      btn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
      btn.title = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
   }
   localStorage.setItem('theme', theme);
}

function toggleTheme(){
   const current = document.body.getAttribute('data-theme') || 'dark';
   applyTheme(current === 'dark' ? 'light' : 'dark');
}

function initTheme(){
   const saved = localStorage.getItem('theme');
   const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
   applyTheme(saved || (prefersLight ? 'light' : 'dark'));
}


/* ================================
   TAB SWITCHING
================================ */
function openTab(tabName) {

document.querySelectorAll(".tabContent").forEach(tab=>{
tab.classList.remove("active");
});

document.querySelectorAll(".tab").forEach(tab=>{
tab.classList.remove("active");
});

document.getElementById(tabName).classList.add("active");
event.target.classList.add("active");

}


/* ================================
   SEND MESSAGE (CHAT)
================================ */
async function sendMessage() {

let inputField = document.getElementById("userInput");
let message = inputField.value.trim();

if(message === "") return;

// add user message
addMessage(message,"user");

// clear input
inputField.value="";

// show typing indicator
let typingIndicator = addMessage("Typing...","bot");

try {
let response = await getHealthAdvice(message);

// remove typing indicator
typingIndicator.remove();

// show AI response
addMessage(response,"bot");

} catch (error) {
typingIndicator.remove();
console.error("sendMessage error:", error);
addMessage(`⚠️ Error: ${error.message || error}`,"bot");
}

}


/* ================================
   ADD MESSAGE TO CHAT UI
================================ */
function addMessage(text,type){
   let chat = document.getElementById("chat");

   function escapeHtml(str){
      return String(str)
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#039;');
   }

   let msg = document.createElement("div");
   msg.classList.add("message",type);
   const now = new Date();
   const datePart = now.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
   const timePart = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
   const ts = `${datePart} ${timePart}`;
   msg.innerHTML = `<div class="content">${escapeHtml(text)}</div><span class="ts">${ts}</span>`;

   chat.appendChild(msg);
      // Ensure scrolling happens after layout so long messages don't escape the container
      requestAnimationFrame(() => {
         requestAnimationFrame(() => {
            chat.scrollTop = chat.scrollHeight;
         });
      });

   return msg;
}


/* ================================
   openrouter API CALL
================================ */
async function getHealthAdvice(userInput){

// OpenRouter endpoint for Gemini-Pro (adjust model if needed)
const url = "https://openrouter.ai/api/v1/chat/completions";

try {
   const response = await fetch(url, {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
            model: OPENROUTER_MODEL,
         messages: [
            {
               role: "system",
               content: `You are an AI healthcare assistant for students.\n\nProvide:\n• possible reasons for symptoms\n• basic precautions\n• when to see a doctor\n\nRules:\n- No medical diagnosis\n- Keep response under 100 words\n- Always add: \"This is not medical advice.\"`
            },
            {
               role: "user",
               content: userInput
            }
         ]
      })
   });

   // Check if the response is ok
   if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error: ${response.status} ${response.statusText} - ${errorText}`);
      const snippet = errorText ? `\nResponse: ${errorText.substring(0,300)}` : "";

      // Detect invalid-model errors and give actionable advice
      if (errorText && errorText.toLowerCase().includes('not a valid model')) {
         return `⚠️ Error ${response.status}: model \"${OPENROUTER_MODEL}\" is not valid on OpenRouter.\n` +
            `Try a different model name or check your OpenRouter dashboard for available models.`;
      }

      return `⚠️ Error ${response.status} ${response.statusText}.${snippet}`;
   }

   const data = await response.json();

   // Check if the expected data is present (OpenRouter format)
   if (!data.choices || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Unexpected response format:', data);
      return "⚠️ AI could not generate response. Check API key or model.";
   }

   return data.choices[0].message.content;

} catch (error) {
   console.error("Fetch error:", error);

   // Detect common browser fetch failure (often CORS or network)
   const msg = (error && error.message) ? error.message : String(error);
   if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('TypeError')) {
      return "⚠️ Network error (possible CORS or connectivity issue). Check browser console/network tab.\n" +
         "If this is a CORS error, the browser blocked the request — you must call OpenRouter from a server-side proxy or enable CORS on the API host.";
   }

   return `⚠️ Network error: ${msg}`;
}

}


/* ================================
   BMI CALCULATOR
================================ */
function calculateBMI(){
   let height = document.getElementById("height").value;
   const unit = document.getElementById("heightUnit") ? document.getElementById("heightUnit").value : 'm';
   let weight = document.getElementById("weight").value;

   if(!height || !weight){
      document.getElementById("bmiResult").innerText =
         "Please enter height and weight.";
      return;
   }

   // Convert height to meters if provided in inches
   let heightMeters = parseFloat(height);
   if(unit === 'in'){
      heightMeters = heightMeters / 39.3700787; // inches to meters
   }

   const w = parseFloat(weight);
   const h = parseFloat(heightMeters);
   if(!h || !w){
      document.getElementById("bmiResult").innerText = "Please enter valid numeric values.";
      return;
   }

   let bmi = w/(h*h);
   let status="";

   if(bmi<18.5) status="Underweight";
   else if(bmi<25) status="Normal";
   else if(bmi<30) status="Overweight";
   else status="Obese";

   document.getElementById("bmiResult").innerText =
      `Your BMI: ${bmi.toFixed(2)} (${status})`;
}


/* ================================
   ENTER KEY SUPPORT (BETTER UX)
================================ */
function clearChat(){
   const chat = document.getElementById('chat');
   if(chat) chat.innerHTML = '';
}

function newChat(){
   clearChat();
   addMessage('New chat started. Describe your symptoms...','bot');
}

document.addEventListener("DOMContentLoaded",()=>{
   let inputField = document.getElementById("userInput");

   if(inputField){
      inputField.addEventListener("keypress",(e)=>{
         if(e.key === "Enter"){
            sendMessage();
         }
      });
   }

   // Initialize theme
   initTheme();

   // Attach optional controls if present
   const newBtn = document.getElementById('newChatBtn');
   const clearBtn = document.getElementById('clearChatBtn');
   const themeBtn = document.getElementById('themeToggle');

   if(newBtn) newBtn.addEventListener('click', newChat);
   if(clearBtn) clearBtn.addEventListener('click', clearChat);
   // Only attach a click listener if there's no inline onclick to avoid double-invoking
   if(themeBtn && !themeBtn.hasAttribute('onclick')) {
      themeBtn.addEventListener('click', toggleTheme);
   }
  
   // Update height placeholder when unit changes
   const heightUnit = document.getElementById('heightUnit');
   const heightInput = document.getElementById('height');
   if(heightUnit && heightInput){
         function updatePlaceholder(){
               if(heightUnit.value === 'in') heightInput.placeholder = 'Height (in)';
               else heightInput.placeholder = 'Height (meters)';
         }
         heightUnit.addEventListener('change', updatePlaceholder);
         updatePlaceholder();
   }
});

// Ensure theme is applied even if DOMContentLoaded already fired
try{
   if (!document.body.getAttribute('data-theme')) {
      initTheme();
   }
} catch(e){
   // ignore
}
