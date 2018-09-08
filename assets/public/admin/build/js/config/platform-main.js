var CSURL = 'https://kf1.learnsaas.com/chat/chatClient/chatbox.jsp?companyID=861942&configID=66977&jid=3381946439&info=';
(function setInitGlobalData() {
  var defaultResourceUrl = window.___ENV == 'dev' ? "" : "https://v6tp.edumf.cn";
  var resourceUrl;
  (function setResourceUrl() {
    var host = window.location.host;
    var domainCDNColl = window.DOMAIN_COLL_CDN || {};
    resourceUrl = domainCDNColl[host] ? domainCDNColl[host] : defaultResourceUrl;
  })();
  var imageUrl = (resourceUrl || '.') + '/images/';
  var IMG = null;

  var GlobalConfig = {
    IMAGE_MAPPER: {
      activity: imageUrl + 'activity/',
      face: imageUrl + 'face/',
      download: imageUrl + 'download/',
      logo: imageUrl + 'logo/logo.main.png',
      logoLogin: imageUrl + 'logo/logo.main.png',
      lotIcon: imageUrl + 'lott-icons/',
      awardBg: imageUrl + 'other/award.png',
      indexPage: imageUrl + 'home-page/',
      trend: imageUrl + 'trend.png',
      wallpager: imageUrl + 'wallpager/',
      wallpagerThumb: imageUrl + 'wallpager/thumb/',
      banks: imageUrl + 'banks/',
      opening: imageUrl + 'common/play_banner.png',
    },
    THIRD_CONFIG: {
      SlotConfigURL: 'public/slot/gamelist.json',
    },
    MANAGER_CONFIG: {
      UnbindBankCardable: false,
      NeedPWForCard: false,
      DisableGooglePW: false,
      DisableBindPhone: false,
      DisableBindEmail: false,
      SudoURL: 'https://xy588.net',
      RecommandRechargeMode: {
        idx: 0,
        text: 'QQ 钱包充值, 更快更方便'
      },
      RechargeTip: '提示：标注(收费)的是高速充值通道，但是会收取一定的手续费，请留意具体渠道信息',
      WaitingTxt: '敬请期待',
      DepositStepInfo: {
        1: [
          '选择第三方方式并填写金额', '跳转至第三方充值平台', '查询充值结果'
        ],
        2: [
          '选择银行并填写金额', '跳转至选择的网银充值页面', '查询充值结果'
        ],
        3: [
          '选择银行并填写金额', '跳转至选择的网银充值页面', '查询充值结果'
        ],
        4: ['选择微信', '跳转至微信支付页面, 扫一扫付款即可', '查询充值结果']
      },
      BonusConfigDesc: [
        '计算公式: 实际分红 = 团队总亏损 x 已设置的分红比例',
        '保底的分红设定不能降低, 高级设置的比例必须比上一条设置的比例大, 否则设置不通过',
        '分红周期: 半个月为一个周期, 月中累计、月底清零, 分红每月 1 号和 16 号凌晨 2:00 分后开始结算',
        '有明显团队结构，并非个人刷量（最少有10个活跃会员为团队）',
        '分红时间为分红日凌晨 2:00 , 当日下午 18:00 前所有代理暂停提现功能, 如期间没有下级反映分红不到账, 即可恢复提款功能, 如期间有下级反馈分红未发放, 将锁定该代理账号, 经协调无果的代理账号, 平台为保障下级分红权益, 将扣除该代理账号金额强制进行分红发放, 并撤销该代理资格.',
        "上下级之间分红设定需双方确认分红比例，若没核对分红比例设置，自行负责！",
        "充值100元以上才为有效用户"
      ],
      GooglePWDesc: [
        '下载 <谷歌身份验证器> APP',
        '输入资金密码生成验证二维码, 并且只能生成一次, 必须要绑定成功, 如果不成功, 请联系客服',
        '使用 <谷歌身份验证器> 扫一扫对应的二维码即可绑定',
        '以后每一次登录需要输入 <谷歌身份验证器> 中生成的密码',
        '如果已经绑定过一次, 再次生成即绑定新的验证码, 需要重新绑定'
      ],
      GooglePWHelperLink: 'https://help.sschelp.net/help/v6/#ru-he-bang-ding-gu-ge-yan-zheng-ma'
    },
    PLATFORM_CONTAINER: {
      HelpLink: 'https://help.sschelp.net/help/v6/#chang-jian-wen-ti',
      SupportURL: 'https://rent.9street.net/',
      BalanceTip: {
        bonus: '游戏 + 分红 + 活动',
        total: '总余额',
        wellet: '资金转换',
        activity: '活动 + 分红',
        game: '游戏余额'
      },
      BalanceDesc: [
        "现金余额的金额，是充值 代充 自身返点的钱，需要 30% 流水才能提现。",
        "分红 + 活动的金额，是所有的活动的收益和分红，可以直接提现。如需使用分红余额进行投注，需把分红余额转到彩票余额方可投注。",
        "分红 + 活动余额的金额，给下级转账，需要先转换到彩票余额，在给下级充值。",
        "注：自身返点属于个人投注行为故此在彩票余额， 下级给上级返点属于活动收益在分红余额。"
      ],
      downloadLinkConfig: {
        windows: {
          link: 'http://download.edumf.cn/store/v6/client/client/win/win_client.zip',
          title: 'PC 客户端'
        },
        iMac: {
          link: 'http://download.edumf.cn/store/v6/client/client/mac/mac_client.dmg',
          title: 'macOS 客户端'
        },
        hangup: {
          link: 'https://download.edumf.cn/store/v6/client/gameplan/download/gameplan.zip',
          title: '挂机神器'
        },
        security: {
          link: 'http://sj.qq.com/myapp/detail.htm?apkName=com.google.android.apps.authenticator2',
          title: '谷歌验证器',
          qrcode: true
        },
        android: {
          link: window.location.href,
          title: '安卓客户端',
          qrcode: true
        },
        iOS: {
          link: window.location.href,
          title: 'iOS 客户端',
          qrcode: true
        },
      },
    },
  };

  Object.defineProperties(window, {
    $Config: {
      get: function() {
        return Object.assign({}, GlobalConfig);
      }
    }
  });

  /**
   * 设置全局的方法
   */
  Object.assign(window, {
    LoadStuff: function(options) {
      options = options || {}
      var cdn = typeof options.cdn == 'undefined' ? true: options.cdn;
      var times = 0;

      var loadUrl = (cdn ? window.SCRIPT_CND_URL || "" : '') + options.source + (window.SCRIPT_VERSION && options.needVersion ? '?v=' + window.SCRIPT_VERSION : '');

      function load(element) {
        if (times > 2) return 0;
        times++;
        element.onload = function(e) {
          if(typeof options.callback === 'function') options.callback(e);
        };
        element.onerror = load;
        document.body.appendChild(element);
      };

      switch (options.type) {
        case 'css':
          var link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = loadUrl;
          load(link);
          break;
        case 'script':
          var script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = loadUrl;
          load(script);
          break;
      }
    },
    LoadLink: function(options) {
      options.type = 'css';
      window.LoadStuff(options);
    },
    LoadScript: function(options) {
      options.type = 'script';
      window.LoadStuff(options);
    },
    OPEN_CUSTOMER: function(info) {
      window.open(
        CSURL + info,
        null,
        'height=600,width=800,left=100%,status=yes,z-look=yes,location=no,right=0,channelmode=yes')
    },
    GET_CS_URL: function() {
      return CSURL;
    },
    GetBgImageElem: function() {
      var coverImage = window.COVER_IMAGE_DOM || document.querySelector('#coverImage') || null;
      if(coverImage) window.COVER_IMAGE_DOM = coverImage;
      return coverImage;
    },
    SetBgImageClass: function(type, classList) {
      var coverImage = window.GetBgImageElem();
      if(!coverImage) return;
      switch (type) {
        case 'remove':
          coverImage.classList.remove(classList);
          break;
        case 'add':
          coverImage.classList.add(classList);
          break;
      }
    },
    BLURBG: function() {
      window.SetBgImageClass('add', 'blur');
    },
    UNBLURBG: function() {
      window.SetBgImageClass('remove', 'blur');
    },
    TOGGLE_BG_BRIGHTNESS: function(isAdd) {
      window.SetBgImageClass(isAdd ? 'add' : 'remove', 'brightness');
    },
    SET_WALL_PAGE: function(bgItem) {
      var coverImage = window.GetBgImageElem();
      var coverBgColor = document.querySelector('#coverBgColor');
      if(!coverImage || !coverBgColor) return;

      var bgItemInfo = bgItem || localStorage.getItem('USER_LIKE_WALLPAGE') || (window.ORIGINAL_WALLPAGES ? window.ORIGINAL_WALLPAGES[0] : '001.jpg');
      var isImage = /\.(png|jpg)$/.test(bgItemInfo);
      if (isImage) {
        if (IMG) {
          IMG.onload = null
          IMG = null
        }
        var bgItemInfoBgUrl = GlobalConfig.IMAGE_MAPPER.wallpager + bgItemInfo;
        IMG = new Image();
        IMG.onload = function() {
          coverImage.classList.add('active');
          coverImage.style.backgroundImage = "url('" + bgItemInfoBgUrl + "')";
        }
        IMG.src = bgItemInfoBgUrl;
        coverImage.style.opacity = 1;
        coverBgColor.style.opacity = 0;
      } else {
        coverBgColor.style.background = bgItem;
        coverImage.style.opacity = 0;
        coverBgColor.style.opacity = 1;
      }
      localStorage.setItem('USER_LIKE_WALLPAGE', bgItemInfo);
    },
    _log: function(desc, men) {
      console.log(desc, men);
    }
  });

  if(window.___ENV != 'dev') {
    window.onbeforeunload = function(event) {
      var text = '确定离开当前页面吗？';
      event.returnValue = text;
      return text;
    }
    _log('%c老大哥在看着你.', 'color: red;font-size: 16px');
    // _log('%c学习 || 合作 || 生活 || 人生, 我们都可以聊', 'color: #289dd9;');
    // _log('%c联系 support@v6team.net, 我们在招聘前端工程师呢', 'color: #289dd9;');
  }
})();

// (function setMobileEvent() {
//   var isWindowTop = false;
//   var lastTouchY = 0;
//   var touchStartHandler = function(e) {
//     if (e.touches.length !== 1)
//       return;
//     lastTouchY = e.touches[0].clientY;
//     isWindowTop = (window.pageYOffset === 0);
//   };
//   var touchMoveHandler = function(e) {
//     var touchY = e.touches[0].clientY;
//     var touchYmove = touchY - lastTouchY;
//     lastTouchY = touchY;
//     if (isWindowTop) {
//       isWindowTop = false;
//       // 阻擋移動事件
//       if (touchYmove > 0) {
//         e.preventDefault();
//         return;
//       }
//     }
//   };
//   document.addEventListener('touchstart', touchStartHandler, false);
//   document.addEventListener('touchmove', touchMoveHandler, false);
// })();

(function loadMainScript() {

  var loadT = Date.now();
  var processObj = {};

  function initGame() {

    if(window.SetLoadingDOM) processObj = window.SetLoadingDOM();

    LoadScript({source: "/public-js/client.mapper.js", needVersion: true});
    LoadScript({source: './js/config/lott.js', cdn: false});
    if(window.___ENV == 'dev') {
      LoadScript({
        source: "/js/dev-libs/platform.config.js", 
        needVersion: false, 
        cdn: false,
        callback: function() {
          window.onloadBundle();
        }
      });
    } else {
      LoadScript({source: './static/js/main.js', needVersion: true, callback: onloadBundle, cdn: false});
      LoadScript({source: "/public-js/platform.config.js", needVersion: true});
    }
  }
  window.onloadBundle = function onloadBundle() {
    // loadingContainer.classList.add('loaded-script');
    setTimeout(function () {
      processObj.done();
    }, 500);


    var loadedT = Date.now();
    window.LOADED_VAR = loadedT - loadT;
    window.SetBgImageClass('add', 'loaded');

    loadDepsScript();

    if(window.___ENV !== 'dev') {
      setTimeout(loadGoogleA, 1500);
    }
  }

  function loadDepsScript() {
    LoadScript({source: './js/libs/wallpage.js', cdn: false});
    LoadScript({source: './js/info/version.js', needVersion: true, cdn: false});

    LoadLink({source: './css/icon.css/external.css'});
    LoadLink({source: './css/flatpickr/dark.css', cdn: false});
  }

  initGame();

  function loadGoogleA() {
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

    ga('create', 'UA-81913535-1', 'auto');
    ga('send', 'pageview');
  }
})(window);
