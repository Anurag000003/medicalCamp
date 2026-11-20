/**
 * Medical Camp Registration Portal - Client Script
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Bootstrap Tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl));

  // Auto-dismiss Flash Alerts after 7 seconds
  const autoDismissAlerts = document.querySelectorAll('.alert-dismissible');
  autoDismissAlerts.forEach((alert) => {
    setTimeout(() => {
      const bsAlert = bootstrap.Alert.getInstance(alert);
      if (bsAlert) {
        bsAlert.close();
      }
    }, 7000);
  });

  // Client-side Registration Form Validation & Dynamic Camp Detail Preview
  const regForm = document.getElementById('campRegistrationForm');
  const campSelect = document.getElementById('campSelect');
  const campPreviewBox = document.getElementById('selectedCampPreview');

  if (campSelect && campPreviewBox) {
    const updateCampPreview = () => {
      const selectedOption = campSelect.options[campSelect.selectedIndex];
      if (selectedOption && selectedOption.value) {
        const date = selectedOption.getAttribute('data-date') || '';
        const venue = selectedOption.getAttribute('data-venue') || '';
        const seatsLeft = selectedOption.getAttribute('data-seats-left') || '';
        const capacity = selectedOption.getAttribute('data-capacity') || '';

        const previewContent = document.getElementById('campPreviewContent');
        if (previewContent) {
          previewContent.innerHTML = `
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <strong class="text-teal">${selectedOption.text.split('(')[0]}</strong>
                <div class="small text-muted"><i class="bi bi-calendar-event me-1"></i> ${date} &nbsp;|&nbsp; <i class="bi bi-geo-alt me-1"></i> ${venue}</div>
              </div>
              <div>
                <span class="badge ${parseInt(seatsLeft, 10) <= 10 ? 'bg-danger' : 'bg-success'} fs-6 px-3 py-2">
                  <i class="bi bi-ticket-perforated me-1"></i> ${seatsLeft} / ${capacity} Seats Left
                </span>
              </div>
            </div>
          `;
          campPreviewBox.classList.remove('d-none');
        }
      } else {
        campPreviewBox.classList.add('d-none');
      }
    };

    campSelect.addEventListener('change', updateCampPreview);
    // Trigger on initial page load if preselected
    if (campSelect.value) {
      updateCampPreview();
    }
  }

  // Client-side form validation feedback
  if (regForm) {
    regForm.addEventListener('submit', (event) => {
      if (!regForm.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      regForm.classList.add('was-validated');

      // Double-check consent checkbox
      const consentBox = document.getElementById('consentCheck');
      if (consentBox && !consentBox.checked) {
        consentBox.classList.add('is-invalid');
        event.preventDefault();
      }
    });
  }

  // Print Pass Handler
  const printPassBtn = document.getElementById('btnPrintPass');
  if (printPassBtn) {
    printPassBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Admin Camp Delete Confirmation
  const deleteCampForms = document.querySelectorAll('.delete-camp-form');
  deleteCampForms.forEach((form) => {
    form.addEventListener('submit', (e) => {
      const campName = form.getAttribute('data-camp-name') || 'this camp';
      const confirmed = confirm(
        `Are you sure you want to delete or archive "${campName}"?\n\nIf participants are already registered, the camp will be archived safely to preserve patient records.`
      );
      if (!confirmed) {
        e.preventDefault();
      }
    });
  });

  // Admin Registration Cancel Confirmation
  const cancelRegForms = document.querySelectorAll('.cancel-reg-form');
  cancelRegForms.forEach((form) => {
    form.addEventListener('submit', (e) => {
      const ref = form.getAttribute('data-ref') || 'this registration';
      const reason = prompt(`Please enter the cancellation reason for registration ${ref}:`, 'Participant requested cancellation');
      if (reason === null) {
        e.preventDefault();
        return;
      }
      const reasonInput = form.querySelector('input[name="reason"]');
      if (reasonInput) {
        reasonInput.value = reason;
      }
    });
  });
});
