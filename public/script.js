const form = document.getElementById("emailForm");
const toneRow = document.getElementById("toneRow");
const toneInput = document.getElementById("tone");
const generateBtn = document.getElementById("generateBtn");
const errorLine = document.getElementById("errorLine");

const letterEmpty = document.getElementById("letterEmpty");
const letterLoading = document.getElementById("letterLoading");
const letterContent = document.getElementById("letterContent");
const letterSubject = document.getElementById("letterSubject");
const letterBody = document.getElementById("letterBody");
const postmark = document.getElementById("postmark");
const copyBtn = document.getElementById("copyBtn");
const ticketNumber = document.getElementById("ticketNumber");

toneRow.addEventListener("click", (e) => {
  const btn = e.target.closest(".tone-chip");
  if (!btn) return;

  document.querySelectorAll(".tone-chip").forEach((chip) => chip.classList.remove("active"));
  btn.classList.add("active");
  toneInput.value = btn.dataset.tone;
});

function setLetterState(state) {
  letterEmpty.classList.toggle("hidden", state !== "empty");
  letterLoading.classList.toggle("hidden", state !== "loading");
  letterContent.classList.toggle("hidden", state !== "content");
  postmark.classList.toggle("show", state === "content");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorLine.textContent = "";

  const formData = {
    recipientName: document.getElementById("recipientName").value.trim(),
    recipientRole: document.getElementById("recipientRole").value.trim(),
    intent: document.getElementById("intent").value.trim(),
    keyPoints: document.getElementById("keyPoints").value.trim(),
    tone: toneInput.value,
    senderName: document.getElementById("senderName").value.trim(),
  };

  setLetterState("loading");
  generateBtn.disabled = true;

  try {
    const response = await fetch("/api/generate-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    // Parse AI response into Subject line and Body content
    const fullText = data.draft;
    const subjectMatch = fullText.match(/^Subject:\s*(.+)$/im);

    const subject = subjectMatch ? subjectMatch[1].trim() : "(no subject line)";
    const body = subjectMatch
      ? fullText.slice(subjectMatch.index + subjectMatch[0].length).trim()
      : fullText.trim();

    letterSubject.textContent = "Subject: " + subject;
    letterBody.textContent = body;

    setLetterState("content");

    const current = parseInt(ticketNumber.textContent.replace(/\D/g, ""), 10) || 1;
    ticketNumber.textContent = `TICKET №${String(current + 1).padStart(4, "0")}`;

  } catch (err) {
    console.error(err);
    errorLine.textContent = err.message;
    setLetterState("empty");
  } finally {
    generateBtn.disabled = false;
  }
});

copyBtn.addEventListener("click", () => {
  const text = `${letterSubject.textContent}\n\n${letterBody.textContent}`;
  navigator.clipboard.writeText(text).then(() => {
    const original = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = original), 1500);
  });
});

