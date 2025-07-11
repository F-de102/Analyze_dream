// pages/weekly-report/weekly-report.js
Page({
  data: {
    showReport: false,
    isLoading: false,
    psychologyTyping: false,
    fortuneTyping: false,
    showFortune: false,
    showChart: false,
    displayPsychologyText: '',
    displayFortuneText: '',
    fortunePercent: 78,
    
    // 静态数据
    keywords: ['飞行', '追逐', '水', '迷路', '考试', '朋友'],
    weekDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    chartPoints: [
      { x: 7, y: 2 },   // 周一
      { x: 21, y: 6 },  // 周二  
      { x: 35, y: 4 },  // 周三
      { x: 49, y: 6 },  // 周四
      { x: 63, y: 1 },  // 周五
      { x: 77, y: 2 },  // 周六
      { x: 91, y: 5 }   // 周日
    ],
    
    psychologyText: '本周您的潜意识活动较为活跃，梦境中频繁出现飞行和追逐场景，反映出您内心对自由的渴望和对压力的逃避心理。水的元素暗示着情感的流动，您可能正在经历一些情感上的变化。迷路和考试的梦境显示您对未来方向的焦虑，建议适当放松，相信自己的能力。',
    
    fortuneText: '本周整体运势呈上升趋势，特别是在人际关系方面会有不错的发展。梦中出现朋友元素是好兆头，表示近期会有贵人相助。事业方面需要保持耐心，突破即将到来。健康运势良好，但需注意劳逸结合。'
  },

  // 生成报告
  generateReport() {
    this.setData({
      isLoading: true
    });

    // 模拟加载时间
    setTimeout(() => {
      this.setData({
        isLoading: false,
        showReport: true
      });
      
      // 开始打字机效果
      this.startTypewriterEffect();
    }, 2000);
  },

  // 开始打字机效果
  startTypewriterEffect() {
    // 心理分析打字机效果
    setTimeout(() => {
      this.typeText('psychology');
    }, 500);
    
    // 运势分析打字机效果（在心理分析完成后）
    setTimeout(() => {
      this.typeText('fortune');
    }, 4000);
    
    // 显示运势进度条
    setTimeout(() => {
      this.setData({
        showFortune: true
      });
    }, 7000);
    
    // 显示图表
    setTimeout(() => {
      this.setData({
        showChart: true
      });
    }, 8000);
  },

  // 打字机文本效果
  typeText(type) {
    const text = type === 'psychology' ? this.data.psychologyText : this.data.fortuneText;
    const displayField = type === 'psychology' ? 'displayPsychologyText' : 'displayFortuneText';
    const typingField = type === 'psychology' ? 'psychologyTyping' : 'fortuneTyping';
    
    this.setData({
      [typingField]: true,
      [displayField]: ''
    });
    
    let index = 0;
    const timer = setInterval(() => {
      if (index <= text.length) {
        this.setData({
          [displayField]: text.substring(0, index)
        });
        index++;
      } else {
        clearInterval(timer);
        this.setData({
          [typingField]: false
        });
      }
    }, 50);
  },

  onLoad(options) {
    // 页面加载时的逻辑
  },

  onReady() {
    // 页面初次渲染完成
  },

  onShow() {
    // 页面显示
  },

  onHide() {
    // 页面隐藏
  },

  onUnload() {
    // 页面卸载
  }
});