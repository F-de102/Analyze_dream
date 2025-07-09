Page({
  data: {
    zodiacSigns: ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
                  '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'],
    currentZodiac: '白羊座',
    zodiacPrediction: '',
    isLoading: false,
    dreamTitle: '',
    dreamContent: '',
    showModal: false,
  },

  onLoad() {
    this.getZodiacPredictionStream();
  },

  changeZodiac(e) {
    const index = e.detail.value;
    this.setData({
      currentZodiac: this.data.zodiacSigns[index],
      zodiacPrediction: ''
    });
    this.getZodiacPredictionStream();
  },

  getZodiacPredictionStream() {
    const zodiac = this.data.currentZodiac;

    this.setData({
      zodiacPrediction: '',
      isLoading: true
    });

    const requestTask = wx.request({
      url: 'http://localhost:8080/zodiac',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      enableChunked: true, // ⚠️基础库 >= 2.31.1 支持
      responseType: 'text',
      data: {
        zodiac: zodiac
      },
      success: (res) => {
        // 这里不会实时触发更新，只在连接完成时触发
        console.log('请求完成', res);
      },
      fail: (err) => {
        console.error('流式获取失败:', err);
        wx.showToast({
          title: '获取失败',
          icon: 'none'
        });
        this.setData({ isLoading: false });
      }
    });

    // 监听流式分块数据
    requestTask.onChunkReceived?.((res) => {
      const chunkText = this.arrayBufferToText(res.data);
      const lines = chunkText.split('\n');
      lines.forEach(line => {
        if (line.startsWith('data:')) {
          const contentStr = line.replace(/^data:\s*/, '');
          if (contentStr === '[DONE]') {
            this.setData({ isLoading: false });
            return;
          }

          try {
            const json = JSON.parse(contentStr);
            if (json.content) {
              const current = this.data.zodiacPrediction;
              this.setData({
                zodiacPrediction: current + json.content
              });
            }
          } catch (e) {
            console.warn('解析失败', e);
          }
        }
      });
    });
  },

  arrayBufferToText(buffer) {
    const uint8Array = new Uint8Array(buffer);
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(uint8Array);
  },

  showInputModal() {
    this.setData({ showModal: true });
  },

  hideInputModal() {
    this.setData({ showModal: false });
  },

  stopPropagation() {
    // 阻止冒泡
  },

  onTitleInput(e) {
    this.setData({ dreamTitle: e.detail.value });
  },

  onContentInput(e) {
    this.setData({ dreamContent: e.detail.value });
  },

  goToResultPage() {
    if (!this.data.dreamTitle || !this.data.dreamContent) {
      wx.showToast({
        title: '请填写完整梦境',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/result/result?title=${encodeURIComponent(this.data.dreamTitle)}&content=${encodeURIComponent(this.data.dreamContent)}`
    });

    this.setData({ showModal: false });
  }
});
