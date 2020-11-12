class clockBookmark {
  constructor() {
    this.bg = chrome.extension.getBackgroundPage();
    // dom节点
    this.bookmarkBd = document.querySelector("#bookmark-bd");
    this.bookmarkNav = document.querySelector("#bookmark-hd-nav");
    // 浏览器收藏夹对象
    this.myBookmarks = null;
    //维护一个以id为键的对象
    this.hashBookmarks = {};
    //文件夹对象
    this.clockFolderID = null;
    //加载书签对象
    chrome.bookmarks.getTree((bookmarkArray) => {
      this.myBookmarks = bookmarkArray[0];
      this.hashID(this.myBookmarks, [], 0);
      //创建或加载时钟书签文件夹，初始化在里面确保首页可以正常显示
      if (localStorage.getItem("clockBookmark")) {
        this.clockFolderID = parseInt(localStorage.getItem("clockBookmark"));
        this.displayInit(this.bookmarkBd, this.myBookmarks);
      } else {
        try {
          chrome.bookmarks.create(
            {
              parentId: "2",
              index: 0,
              title: "时钟书签",
            },
            function (bookmark) {
              localStorage.setItem("clockBookmark", bookmark.id);
              this.clockFolderID = bookmark.id;
              this.displayInit(this.bookmarkBd, this.myBookmarks);
            }
          );
        } catch {
        } finally {
          this.displayInit(this.bookmarkBd, this.myBookmarks);
        }
      }
    });
    this.initScrollBar();
    this.initListClick(this.bookmarkBd);
    this.initNav();
    document.addEventListener("contextmenu", function (event) {
      // 阻止浏览器鼠标右击事件。
      event.preventDefault();
    });
  }
  //浅遍历，只看一层
  shallowErgodic(obj) {
    let list = [];
    if (obj === undefined) {
      return [];
    } else {
      if (obj.children) {
        for (let i = 0; i < obj.children.length; i++) {
          list.push(
            `
            <li  data-id=${obj.children[i].id}>
            <img data-id=${obj.children[i].id} src=${
              obj.children[i].url
                ? "chrome://favicon/" + obj.children[i].url
                : "../images/floder.png"
            }>
            <span data-id=${obj.children[i].id}>${obj.children[i].title}</span>
            </li>
            `
          );
        }
        return list;
      } else {
        return [];
      }
    }
  }
  //根目录渲染
  displayInit(el, myBookmarks) {
    this.bookmarkNav.innerHTML = "";
    let list = this.shallowErgodic(myBookmarks);
    //将时钟文件夹放至首页
    list.push(`
    <li  data-id=${this.clockFolderID}>
    <img data-id=${this.clockFolderID} src="../images/time.png"
    }>
    <span data-id=${this.clockFolderID}>时钟书签</span>
    </li>
    `);
    el.innerHTML = list.join("");
  }
  initNav() {
    let display = "block";
    let listTmep = "";
    let navTmep = "";
    let input = document.querySelector("#bookmark-hd input");
    let button = document.querySelector("#bookmark button");
    let inputEvent = (e) => {
      let str = e.target.value;
      console.log(str.length);
      if (str.length === 0) {
        this.bookmarkBd.innerHTML = "";
        return;
      }
      this.bookmarkBd.innerHTML = Object.keys(this.hashBookmarks)
        .filter(
          (i) =>
            new RegExp(str).test(this.hashBookmarks[i].title) ||
            new RegExp(str).test(this.hashBookmarks[i].url)
        )
        .map((id) => {
          let el = this.hashBookmarks[id];
          return `
          <li  data-id=${id}>
          <img data-id=${id} src=${
            el.url ? "chrome://favicon/" + el.url : "../images/floder.png"
          }>
          <span data-id=${id}>${el.title}</span>
          </li>
          `;
        })
        .join("");
    };
    this.initListClick(this.bookmarkNav);
    //home按键
    document
      .querySelector("#bookmark-hd-home")
      .addEventListener("click", (e) => {
        this.displayInit(this.bookmarkBd, this.myBookmarks);
      });
    //搜索按键
    document
      .querySelector("#bookmark-hd-search")
      .addEventListener("click", (e) => {
        if (display === "block") {
          input.style.display = display;
          input.disabled = false;
          input.focus();
          input.addEventListener("input", inputEvent);
          listTmep = this.bookmarkBd.innerHTML;
          navTmep = this.bookmarkNav.innerHTML;
          this.bookmarkBd.innerHTML = "";
          display = "none";
        } else {
          input.removeEventListener("input", inputEvent);
          input.value = "";
          input.style.display = display;
          display = "block";
          input.disabled = true;
          this.bookmarkBd.innerHTML = listTmep;
          this.bookmarkNav.innerHTML = navTmep;
          listTmep = "";
          navTmep = "";
        }
      });
    button.addEventListener("click", () => {
      chrome.tabs.create({ url: "chrome://bookmarks/" });
    });
  }
  initListClick(ul) {
    ul.addEventListener("click", (e) => {
      let bookObj = null;
      if (e.target.nodeName != "UL") {
        bookObj = this.getObjbyID(e.target.dataset.id);
        if (bookObj.children) {
          this.displayUpdate(
            { bd: this.bookmarkBd, nav: this.bookmarkNav },
            e.target.dataset.id
          );
        } else {
          this.bg.mapPopupClick(bookObj.url);
        }
      }
    });
  }
  initScrollBar() {
    let display = false;
    let timer = null;
    return (() => {
      document.querySelector("#bookmark-bd").addEventListener("scroll", (e) => {
        if (!display) {
          document.styleSheets[0].insertRule(
            "#bookmark-bd::-webkit-scrollbar{display: block!important;}",
            0
          );
          display = true;
        }
        clearTimeout(timer);
        timer = setTimeout(() => {
          display = false;
          document.styleSheets[0].deleteRule(0);
        }, 1000);
      });
    })();
  }
  hashID(obj, last, now) {
    if (obj === undefined) {
      return;
    } else {
      if (last.length !== 0) {
        this.hashBookmarks[obj.id] = {
          router: [...last, now],
          title: obj.title,
          url: obj.url,
          dateAdded: obj.dateAdded,
        };
      } else {
      }
      if (obj.children) {
        for (let i = 0; i < obj.children.length; i++) {
          this.hashID(obj.children[i], [...last, now], i);
        }
      } else {
        return;
      }
    }
  }
  getObjbyID(id) {
    let temp = null;
    //第0位没意义，从第一个开始
    for (let i = 1; i < this.hashBookmarks[id].router.length; i++) {
      if (!temp) {
        temp = this.myBookmarks.children[this.hashBookmarks[id].router[i]];
      } else {
        temp = temp.children[this.hashBookmarks[id].router[i]];
      }
    }
    return temp;
  }
  displayUpdate({ bd, nav }, id) {
    let navarr = [];
    let navs = [];
    let temp;
    for (let i = 1; i < this.hashBookmarks[id].router.length; i++) {
      if (!temp) {
        temp = this.myBookmarks.children[this.hashBookmarks[id].router[i]];
      } else {
        temp = temp.children[this.hashBookmarks[id].router[i]];
      }
      navarr.push(temp);
    }
    for (let i = 0; i < navarr.length; i++) {
      navs.push(`<li data-id=${navarr[i].id}>${navarr[i].title}</li>`);
    }
    console.log(navarr);
    let list = this.shallowErgodic(this.getObjbyID(id));
    bd.innerHTML = list.join("");
    nav.innerHTML = navs.join("");
  }
}

let Test = new clockBookmark();
