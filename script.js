const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.content-box');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {

        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        tab.classList.add('active');

        const target = document.getElementById(tab.dataset.target);
        target.classList.add('active');
    });
});

// ================================
// Qualify Page Script
// ================================

const steps = document.querySelectorAll(".step");
const progress = document.querySelector(".progress-fill");

if (steps.length > 0 && progress) {

    let current = 0;

    const stepFieldNames = [
        "debtAmount",
        "goal",
        "worstDebtType",
        "biggestConcern",
        "propertyType",
        "location",
        "employmentStatus",
    ];

    const leadData = {};

    function updateProgress() {
        progress.style.width = ((current + 1) / steps.length) * 100 + "%";
    }

    function goToStep(index) {
        steps[current].classList.remove("active");
        current = index;
        if (current < steps.length) {
            steps[current].classList.add("active");
            updateProgress();
        }
    }

    // Back button support (goes to the previous step)
    document.querySelectorAll(".back-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            if (current > 0) {
                goToStep(current - 1);
            }
        });
    });

    // Option button clicks (steps 0-6): record the answer, then advance.
    document.querySelectorAll(".step .option").forEach((btn) => {
        btn.addEventListener("click", () => {
            const stepIndex = Array.from(steps).findIndex((s) => s.contains(btn));
            const fieldName = stepFieldNames[stepIndex];
            if (fieldName) leadData[fieldName] = btn.textContent.trim();
            goToStep(current + 1);
        });
    });

    // ---- Validation helpers ----

    // Requires at least a first name AND a surname (two words minimum),
    // matching the same rule enforced by the backend.
    function isValidFullName(value) {
    return value.trim().length > 0;
}

    function isValidGmail(value) {
        return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(value.trim());
    }

    // UK mobile numbers: 07 (or +44 7 / 0044 7) followed by digit 1-9, then 8 more digits.
    function isValidUKMobile(value) {
        const cleaned = value.replace(/[\s-]/g, "");
        return /^(?:\+44|0044|0)7[1-9]\d{8}$/.test(cleaned);
    }

    function showFieldError(input, message) {
        input.style.borderColor = "#ff4d4d";
        let errorEl = input.parentElement.querySelector(".js-field-error");
        if (!errorEl) {
            errorEl = document.createElement("small");
            errorEl.className = "js-field-error";
            errorEl.style.color = "#ff6b6b";
            errorEl.style.display = "block";
            errorEl.style.marginTop = "6px";
            errorEl.style.fontSize = "13px";
            input.insertAdjacentElement("afterend", errorEl);
        }
        errorEl.textContent = message;
    }

    function clearFieldError(input) {
        input.style.borderColor = "";
        const errorEl = input.parentElement.querySelector(".js-field-error");
        if (errorEl) errorEl.textContent = "";
    }



    // Name + Email step
    const submitBtn = document.getElementById("submitBtn");
    submitBtn?.addEventListener("click", () => {
        const nameInput = document.getElementById("name");
        const emailInput = document.getElementById("email");
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();

        let hasError = false;


        if (!isValidFullName(name)) {
            showFieldError(nameInput, "Please enter your first name and surname (e.g. John Smith).");
            hasError = true;
        } else {
            clearFieldError(nameInput);
        }

        if (!isValidGmail(email)) {
            showFieldError(emailInput, "Please enter a valid Gmail address (e.g. name@gmail.com).");
            hasError = true;
        } else {
            clearFieldError(emailInput);
        }

        if (hasError) return;

        leadData.name = name;
        leadData.email = email;

        const firstNameSpan = document.getElementById("leadFirstName");
        if (firstNameSpan) firstNameSpan.textContent = `${name.split(" ")[0]},`;

        goToStep(current + 1);
    });

    // Final phone step: validate, THEN actually submit to the backend and
    // WAIT for a real success response before showing the congratulations
    // step. (No more fake/background submission — if saving fails, the
    // user now sees an error instead of a false "success" screen.)
    const phoneStep = document.querySelector(".phone-step");
    const finalStepButtons = phoneStep?.querySelectorAll(".continue-btn");
    finalStepButtons?.forEach((btn) => {
        btn.addEventListener("click", async () => {
            const phoneInput = phoneStep.querySelector('input[type="tel"]');
            const phone = phoneInput ? phoneInput.value.trim() : "";

            if (!isValidUKMobile(phone)) {
                showFieldError(
                    phoneInput,
                    "Please enter a valid UK mobile number (e.g. 07123 456789 or +447123456789)."
                );
                return;
            }
            clearFieldError(phoneInput);
            leadData.phone = phone;

            btn.disabled = true;
            const originalText = btn.textContent;
            btn.textContent = "Submitting...";

            try {
                const res = await fetch(`${API_BASE_URL}/leads`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(leadData),
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    // Saved successfully -> now show the congratulations step.
                    const successIndex = Array.from(steps).findIndex((s) =>
                        s.classList.contains("success-step")
                    );
                    goToStep(successIndex !== -1 ? successIndex : current + 1);
                } else {
                    alert(
                        (data.message || "Something went wrong.") +
                            (data.errors ? "\n\n" + data.errors.map((e) => e.msg).join("\n") : "")
                    );
                    btn.disabled = false;
                    btn.textContent = originalText;
                }
            } catch (err) {
                alert("Unable to reach the server. Please make sure the backend is running and try again.");
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    });

    document.querySelectorAll(".continue-btn").forEach((btn) => {
        if (btn.id === "submitBtn") return;
        if (phoneStep?.contains(btn)) return;
        btn.addEventListener("click", () => goToStep(current + 1));
    });
}