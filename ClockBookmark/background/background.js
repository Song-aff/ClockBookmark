let datas = null;
function mapBackground(arg) {
  datas = arg;
}
function mapPopupClick(url) {
  window.open(url, "_blank");
}
// 获取当前选项卡ID
function getCurrentTabId(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (callback) callback(tabs.length ? tabs[0].id : null);
  });
}
function sendMessageToContentScript(message, callback) {
  getCurrentTabId((tabId) => {
    chrome.tabs.sendMessage(tabId, message, function (response) {
      if (callback) callback(response);
    });
  });
}

//创建菜单
chrome.contextMenus.create({
  type: "normal",
  title: "收藏至时钟书签",
  id: "clockBookmarks",
  onclick: function () {
    let temp = {
      title: "",
      url: "",
      parentId: 2,
    };
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (
      tabs
    ) {
      var url = tabs[0].url;
      temp.url = url;
    });
    sendMessageToContentScript("get", (response) => {
      if (response) {
        temp.title = response.title;
        chrome.bookmarks.create(
          {
            parentId: localStorage.getItem("clockBookmark"),
            url: temp.url,
            title: temp.title,
          },
          function (bookmark) {
            alert("收藏成功，会在7天后提醒。");
          }
        );
      }
    });
  },
});

//桌面消息通知
Notification.requestPermission(function (status) {
  //status值有三种：default/granted/denied
  if (Notification.permission !== status) {
    Notification.permission = status;
  }
});

setInterval(() => {
  if (localStorage.getItem("clockBookmark")) {
    chrome.bookmarks.getSubTree(
      localStorage.getItem("clockBookmark"),
      function (clockFolder) {
        if (!localStorage.getItem("clockBookmarkItems")) {
          localStorage.setItem("clockBookmarkItems", JSON.stringify({}));
        }
        let tempObj = JSON.parse(localStorage.getItem("clockBookmarkItems"));
        for (let i = 0; i < clockFolder[0].children.length; i++) {
          let id = clockFolder[0].children[i].id;
          tempObj[id] = tempObj[id]
            ? {
                dateUpdated:
                  tempObj[id].dateUpdated > clockFolder[0].children[i].dateAdded
                    ? tempObj[id].dateUpdated
                    : clockFolder[0].children[i].dateAdded,
              }
            : {
                dateUpdated: clockFolder[0].children[i].dateAdded,
              };

          if (
            new Date().getTime() - tempObj[id].dateUpdated >
            60 * 1000 * 60 * 24 * 7
          ) {
            setTimeout(() => {
              var options = {
                // dir: "ltr", //控制方向，据说目前浏览器还不支持
                lang: "utf-8",
                // icon: "icon48.png",
                body: clockFolder[0].children[i].title,
                url: clockFolder[0].children[i].url,
              };
              new Notification(
                "网页已经在收藏夹躺七天了!",
                options
              ).onclick = () => {
                tempObj[id].dateUpdated = new Date().getTime();
                localStorage.setItem(
                  "clockBookmarkItems",
                  JSON.stringify(tempObj)
                );
                window.open(options.url, "_blank");
              };
            }, 10 * 1000 * i);
          }
        }
        localStorage.setItem("clockBookmarkItems", JSON.stringify(tempObj));
      }
    );
  }
}, 1000 * 60 * 60 * 3);
