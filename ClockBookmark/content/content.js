chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request) {
    case "get": {
      sendResponse({ title: document.querySelector("title").innerText });
      console.log(title);
      break;
    }
  }
});
