function updateSavedCounter() {
  browser.storage.local.get('saved')
  .then((item) => {
    const saved = item.saved || {};
  });
}


function populateWords() {
  browser.storage.local.get('saved')
  .then((item) => {
    const saved = item.saved || {};

    const container = document.getElementById('wordsContainer');

    const words = Object.keys(saved).reverse();

    if (!words.length) {
      const emptyMsg = document.createElement('h2');
      emptyMsg.setAttribute('class', 'empty-msg');
      emptyMsg.textContent = browser.i18n.getMessage('emptyListMessage');
      container.appendChild(emptyMsg);
    }


    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      const data = saved[word];

      let panel = document.createElement('div');
      panel.setAttribute('class', 'word-panel');

      let header = document.createElement('div');
      header.setAttribute('class', 'header');

      let term = document.createElement('span');
      term.setAttribute('class', 'term');
      term.textContent = word;

      let content = document.createElement('div');
      content.setAttribute('class', 'content');

      let definition = document.createElement('div');
      definition.setAttribute('class', 'definition');
      definition.textContent = data.definition;

      let linkMore = document.createElement('a');
      linkMore.setAttribute('class', 'link-more');
      linkMore.setAttribute('href', 'https://google.com/search?q=define+' + word);
      linkMore.setAttribute('target', '_blank');
      linkMore.textContent = browser.i18n.getMessage('moreBtnLabel');
      linkMore.setAttribute('title', browser.i18n.getMessage('moreBtnTitle'));

      let footer = document.createElement('div');
      footer.setAttribute('class', 'footer');

      let btnRemove = document.createElement('button');
      btnRemove.setAttribute('class', 'btn btn-remove');
      btnRemove.textContent = browser.i18n.getMessage('removeBtnLabel');
      btnRemove.setAttribute('title', browser.i18n.getMessage('removeBtnTitle'));
      btnRemove.onclick = function(e) {
        removeWord(word);
      }

      container.appendChild(panel);
      
      panel.appendChild(header);
      header.appendChild(term);

      panel.appendChild(content);
      content.appendChild(definition);

      panel.appendChild(footer);
      footer.appendChild(btnRemove);
      footer.appendChild(linkMore);
    }

  });

}


function removeWord(word) {
  const modal = document.getElementById('confirmRemoveModal');
  modal.classList.remove('hide');

  const confirmButton = document.getElementById('confirmButton').addEventListener('click', (e) => {
    browser.storage.local.get('saved')
    .then((item) => {
      const saved = item.saved || {};
      delete saved[word];
      browser.storage.local.set({saved: {...saved}})
      .then(() => window.location.reload());
    });
  });
}


function onStorageChange(changes, area) {
  const saved = changes.saved;

  if (!saved)
    return;

  // ask user to reload page
  const reloadPrompt = document.getElementById('reloadPrompt');
  reloadPrompt.classList.remove('hide');
}


browser.storage.onChanged.addListener(onStorageChange);


function closeModal(e) {
  document.getElementById('confirmRemoveModal').classList.add('hide');
}

document.getElementById('confirmRemoveModal').addEventListener('click', function(e) {
  if (e.target === this)
    closeModal(e);
});
document.getElementById('cancelButton').addEventListener('click', closeModal);

(function () {
  updateSavedCounter();
  populateWords();
})();