(function () {
  // Check if the modal already exists
  const myModal = document.getElementById('myModal');
  if (myModal) {
    myModal.style.display = 'block';
    return;
  }
  // Create modal HTML structure
  var modal = document.createElement('div');
  modal.id = 'myModal';
  modal.className = 'bmgpt_modal';

  var modalContent = document.createElement('div');
  modalContent.className = 'bmgpt_modal-content';

  var closeBtn = document.createElement('span');
  closeBtn.className = 'bmgpt_close';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = function () {
    modal.style.display = 'none';
  };

  chrome.runtime.onMessage.addListener(({ type }) => {
    // TODO: this doesn't work
    switch (type) {
      case 'CLOSE_MODAL':
        modal.style.display = 'none';
        return true;
    }
  });

  var modalText = document.createElement('p');
  modalText.innerHTML = 'This is a modal dialog!';

  modalContent.appendChild(closeBtn);
  modalContent.appendChild(modalText);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Show the modal
  modal.style.display = 'block';
})();
