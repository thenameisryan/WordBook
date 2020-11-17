const LOADING_MESSAGE = browser.i18n.getMessage('loadingMessage');
const NO_DEFINITION_MESSAGE = browser.i18n.getMessage('noDefinitionMessage');
const OPENED_POPUPS = {};

let SETTINGS = {};

browser.storage.local.get('settings')
.then((item) => {
  SETTINGS = item.settings || {}
}); 


function getSelectionData() {

  const selection = window.getSelection();

  const rect = selection.getRangeAt(0).getBoundingClientRect();

  const data = {
    top: rect.top,
    bottom: rect.bottom,
    left: rect.left,
    right: rect.right,
    height: rect.height,
    width: rect.width,
    term: selection.toString().toLowerCase().trim()
  };

  data.centerX = data.left + rect.width / 2;
  data.centerY = data.top + rect.height / 2;

  return data;
}


function getPlacementCoords(width, height, beakSize, boundingRect) {
  /*
    Params: 
    width: width of the popup
    height: height of the popup
    beakSize: size of the beak to account for
    boundingRect: bounding rect object of the selection
  */

  const centerX = boundingRect.left + window.scrollX + boundingRect.width / 2;
  const centerY = boundingRect.top + window.scrollY + boundingRect.height / 2;

  let offsetLeft = - (width / 2);
  const startingPointX = centerX + offsetLeft;
  const endingPointX = centerX + (width / 2);

  if (startingPointX - 10 < 0) {
    offsetLeft = offsetLeft + (startingPointX * - 1) + 10;
  }

  if (endingPointX + 10 > window.innerWidth + window.scrollX) {
    offsetLeft = offsetLeft - (endingPointX + 20 - window.innerWidth - window.scrollX);
  }

  let startingPointY = centerY + (boundingRect.height / 2) + beakSize; // top
  let endingPointY = startingPointY + height;
  let position = 'bottom';

  if (endingPointY + 30 > window.innerHeight + window.scrollY) {
    startingPointY = centerY - (boundingRect.height / 2) - beakSize - height;
    position = 'top';
  }

  const coords = {
    top: startingPointY,
    left: centerX - beakSize / 2,
    offsetLeft: offsetLeft,
    position: position
  };

  return coords;
}


function getStyles(placement, popUpHeight, popUpWidth) {
  const theme = 'light';

  let style = `
    * {
      line-height: 1;
      box-sizing: border-box;
      font-size: 1rem;
      letter-spacing: 0;
      text-shadow: none;
      text-align: left;
    }
    .hide {
      display: none !important;
    }
    .container {
      position: absolute;
      top: ${ placement.top }px;
      left: ${ placement.left }px;
      z-index: 2000;
      display: block;
      width: 0;
      overflow: visible;
    }

    .popup {
      background-color: ${theme === 'dark' ? '#222' : '#fff'};
      border: 1px solid ${theme === 'dark' ? '#000' : '#ddd'};
      border-radius: 4px;
      box-shadow: 0 0 16px rgba(0, 0, 0, 0.3);
      min-height: ${ popUpHeight }px;
      width: ${ popUpWidth }px;
      display: block;
      padding: 6px 12px;
      margin-left: ${ placement.offsetLeft }px;
    }

    .beak {
      width: 14px;
      height: 14px;
      content: '';
      transform: rotate(45deg);
      background: ${theme === 'dark' ? '#222' : '#fff'};
      position: absolute;
      left: 0;
      right: 0;
      margin: auto;
    }
    .popup-bottom .beak {
      top: -7px;
      border-left: 1px solid ${theme === 'dark' ? '#000' : '#d6d6d6'};
      border-top: 1px solid ${theme === 'dark' ? '#000' : '#d6d6d6'};
    }
    .popup-top .beak {
      bottom: -7px;
      border-right: 1px solid ${theme === 'dark' ? '#000' : '#d6d6d6'};
      border-bottom: 1px solid ${theme === 'dark' ? '#000' : '#d6d6d6'};
    }

    .header .btn {
      width: 18px;
      height: 18px;
      border: none;
      border-radius: 100%;
      float: right;
      background-color: transparent;
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
    }

    .header {
      padding-bottom: 3px;
    }

    .header .btn:hover {
      cursor: pointer;
      background-color: ${theme === 'dark' ? '#000' : '#eee'};
    }

    .btn-listen {
      margin-right: 6px;
      background-image: url("data:image/svg+xml,%3Csvg width='1em' height='1em' viewBox='0 0 16 16' class='bi bi-volume-up' fill='${theme === 'dark' ? '%23eeeeee' : '%23000000'}' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' d='M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zM6 5.04L4.312 6.39A.5.5 0 0 1 4 6.5H2v3h2a.5.5 0 0 1 .312.11L6 10.96V5.04z'/%3E%3Cpath d='M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z'/%3E%3Cpath d='M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z'/%3E%3Cpath d='M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707z'/%3E%3C/svg%3E");
    }

    .btn-close {
      background-image: url("data:image/svg+xml,%3Csvg width='1em' height='1em' viewBox='0 0 16 16' class='bi bi-x-circle' fill='${theme === 'dark' ? '%23eeeeee' : '%23000000'}' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' d='M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z'/%3E%3Cpath fill-rule='evenodd' d='M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
    }

    .term {
      color: ${theme === 'dark' ? '#eee' : '#000'};
      font-family: sans-serif;
      font-weight: bold;
      font-size: 18px;
      line-height: 1.2;
    }

    .content {
      min-height: 80px;
      padding-bottom: 12px;
    }

    .phonetic {
      font-family: sans-serif;
      font-size: 14px;
      font-weight: normal;
      color: ${theme === 'dark' ? '#aaa' : '#777'};
      padding-bottom: 6px;
    }

    .type {
      font-family: sans-serif;
      font-size: 14px;
      font-style: italic;
      font-weight: normal;
      color: ${theme === 'dark' ? '#aaa' : '#777'};
      padding-bottom: 6px;
    }

    .definition {
      color: ${theme === 'dark' ? '#fff' : '#333'};
      font-family: sans-serif;
      font-size: 14px;
      font-weight: normal;
      line-height: 1.3;
    }

    .link-more {
      color: ${theme === 'dark' ? '#d9d943' : 'blue'};
      font-family: sans-serif;
      font-weight: normal;
      font-size: 13px;
      display: inline-block;
      float: right;
      margin-top: 4px;
    }

    .link-more:hover {
      background-color: ${theme === 'dark' ? '#000' : '#eee'};
    }

    .link-more::after {
      content: " ";
      width: 14px;
      height: 14px;
      margin-left: 3px;
      display: inline-block;
      vertical-align: bottom;
      background-image: url("data:image/svg+xml,%3Csvg width='1em' height='1em' viewBox='0 0 16 16' class='bi bi-box-arrow-up-right' fill='${theme === 'dark' ? '%23d9d943' : 'blue'}' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' d='M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z'/%3E%3Cpath fill-rule='evenodd' d='M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
    }

    .footer {
      padding-top: 6px;
      display: table;
      width: 100%;
    }

    .footer .btn {
      color: ${theme === 'dark' ? '#fff' : '#000'};
      background-color: ${theme === 'dark' ? '#444' : '#e8e8e8'};
      font-family: sans-serif;
      font-weight: normal;
      font-size: 13px;
      padding: 4px 10px;
      margin-right: 6px;
      border: none;
      border-radius: 10rem;
    }

    .footer .btn:hover {
      background-color: ${theme === 'dark' ? '#000' : '#ddd'};
      cursor: pointer;
    }

    .footer .btn::before {
      content: " ";
      height: 14px;
      width: 14px;
      margin-right: 4px;
      display: inline-block;
      vertical-align: middle;
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
      vertical-align: top;
    }    
  `;

  return style;


  const promise = new Promise((resolutionFunc, rejectionFunc) => {
    resolutionFunc(style);
  });

  return promise;
}


function createPopUp() {
  // :TODO: break this function into smaller functions 

  const selectionData = getSelectionData();

  if (!selectionData.term.trim().length)
    return;

  const key = generateRandomKey();

  let wrapper = document.createElement('div'); // outer wrapper for the popup used for shadow dom

  wrapper.setAttribute('class', 'dictionary-plus-popup-wrapper');

  let shadow = wrapper.attachShadow({mode: 'open'});

  const popUpWidth = 300;
  const popUpHeight = 150;

  let style = document.createElement('style');

  const placement = getPlacementCoords(popUpWidth, popUpHeight, 10, selectionData);

  style.textContent = getStyles(placement, popUpHeight, popUpWidth);

  let container = document.createElement('div'); 
  container.setAttribute('class', 'container popup-' + placement.position);
  container.style.top = placement.top + 'px';

  let popup = document.createElement('div'); // inner popup
  popup.setAttribute('class', 'popup');

  let beak = document.createElement('div');
  beak.setAttribute('class', 'beak');

  let header = document.createElement('div');
  header.setAttribute('class', 'header');

  let btnListen = document.createElement('button');
  btnListen.setAttribute('class', 'btn btn-listen hide');
  btnListen.setAttribute('type', 'button');
  btnListen.setAttribute('title', browser.i18n.getMessage("pronounceBtnTitle"));

  let btnClose = document.createElement('button');
  btnClose.setAttribute('class', 'btn btn-close');
  btnClose.setAttribute('type', 'button');
  btnClose.setAttribute('title', browser.i18n.getMessage("closeBtnTitle"));
  btnClose.onclick = function(e) {
    destroyPopUp(key);
  };

  let term = document.createElement('span');
  term.setAttribute('class', 'term');

  const selectedText = selectionData.term;
  term.textContent = selectedText;

  let content = document.createElement('div');
  content.setAttribute('class', 'content');

  let phonetic = document.createElement('div');
  phonetic.setAttribute('class', 'phonetic');

  let type = document.createElement('div');
  type.setAttribute('class', 'type');

  let definition = document.createElement('div');
  definition.setAttribute('class', 'definition');
  definition.textContent = LOADING_MESSAGE;

  let linkMore = document.createElement('a');
  linkMore.setAttribute('class', 'link-more');
  linkMore.setAttribute('href', 'https://google.com/search?q=define+' + selectedText);
  linkMore.setAttribute('target', '_blank');
  linkMore.textContent = browser.i18n.getMessage("moreBtnLabel");
  linkMore.setAttribute('title', browser.i18n.getMessage("moreBtnTitle"));

  let footer = document.createElement('div');
  footer.setAttribute('class', 'footer');


  document.body.appendChild(wrapper);

  OPENED_POPUPS[key] = {node: wrapper, selectionData: {...selectionData}};


  let sending = browser.runtime.sendMessage({
      type: 'fetch-meaning',
      term: selectionData.term
  });

  sending.then((response) => {
    updatePopUp(key, response);
  });
}


function getPopUpElements(key) {
  /*Returns important children elemnts of a popup */
  const node = OPENED_POPUPS[key].node;
  const popup = node.shadowRoot;
  return {
    node: node,
    shadowRoot: popup,
    term: popup.querySelector('.term'),
    definition: popup.querySelector('.definition'),
    phonetic: popup.querySelector('.phonetic'),
    type: popup.querySelector('.type'),
    audio: popup.querySelector('audio'),
    btnSave: popup.querySelector('.btn-save'),
    labelSave: popup.querySelector('.label-save'),
  }
}



function destroyPopUp(key) {
  const popup = OPENED_POPUPS[key];

  popup.node.remove();

  delete OPENED_POPUPS[key];
}


const USED_KEYS = [];

function generateRandomKey() {
  let key;

  while (key === undefined || !isNaN(+key) || USED_KEYS.includes(key)) {
    key = Math.random().toString(36).substring(7);
  }

  USED_KEYS.push(key);
  return key;
}


browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'context-menu') { /* from context menu */
    if (message.data === 'open-popup') {
      // :TODO: don't open popup if already open for current selection
      // or maybe close previous popups before opening new
      createPopUp();
    }
  }
});


document.addEventListener('dblclick', (e) => {
  createPopUp();
});


document.addEventListener('click', (e) => {
  // Destroy all popups ONLY when the click is not on a popup
  if(!e.target.classList.contains("dictionary-plus-popup-wrapper")) {
      let popups = {...OPENED_POPUPS};
      Object.keys(popups).map((key) => destroyPopUp(key));
  }
});


function onStorageChange(changes, area) {
  const settings = changes.settings;

  if (!settings)
    return;

  // update settings
  SETTINGS = settings.newValue;
}

browser.storage.onChanged.addListener(onStorageChange);