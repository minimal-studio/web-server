(function setupLottData(window) {
  Object.assign(window, {
    LOTT_GAME_CONFIG: {
      RaceCarURL: '/public/pk10-animation/index.html',
      TrendURL: '/public/trend/build/index.html',
      DICE_URL: '/public/dice/build/dice.html',
      CountdownNotifyConfig: {
        url: '/css/countdown.mp3',
        duration: 3
      },
      HotAndNewLotInfo: {
        hot: [
          'CQSSC', 'PTSSC60S', 'TXSSC60S', 'KRSSC90S',
          'GD115', 'BJPK10', 'FC3D', 'SYYDJ115', 'PL35'
        ],
        newAdd: ['HKLHC', 'XYPCDD']
      },
      DSDesc: "说明：;\n1、每一注号码之间的间隔符支持 回车 空格 [ ] 逗号[,] 分号[;];\n2、文件格式必须是.txt格式;\n3、导入文本内容将覆盖文本框中现有的内容。;\n4、一次投注支持100,000注！"
    }
  });
})(window);
