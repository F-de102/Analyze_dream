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
    buffer: '' // 添加缓冲区
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

  // 改进的流式获取方法
  getZodiacPredictionStream() {
    const zodiac = this.data.currentZodiac;

    this.setData({
      zodiacPrediction: '',
      isLoading: true,
      buffer: '' // 重置缓冲区
    });

    const requestTask = wx.request({
      url: 'http://localhost:8080/zodiac',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      enableChunked: true,
      responseType: 'text',
      data: {
        zodiac: this.data.currentZodiac
      },
      success: (res) => {
          // 完整接收后不处理，onChunkReceived 中负责逐步更新
        this.setData({ isLoading: false });
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

 
    requestTask.onChunkReceived?.((res) => {
      const text = this.arrayBufferToText(res.data);
      //console.log('原始数据:', text); // 调试日志
      
      const lines = text.split('\n');
      let accumulated = this.data.zodiacPrediction || '';
    
      lines.forEach(line => {
        if (!line.trim()) return; // 跳过空行
        
        try {
          // 处理可能的非标准SSE格式
          let data = line;
          if (line.startsWith('data:')) {
            data = line.replace(/^data:\s*/, '').trim();
            if (data === '[DONE]') return;
          }
    
          // 尝试解析JSON
          if (data.startsWith('{') || data.startsWith('[')) {
            const json = JSON.parse(data);
            if (json.content) {
              accumulated += json.content;
              this.setData({ 
                zodiacPrediction: accumulated,
                isLoading: false
              });
            } else if (json.error) {
              console.error('API错误:', json.error);
              this.setData({
                zodiacPrediction: `错误: ${json.error}`,
                isLoading: false
              });
            }
          } else if (data) {
            // 非JSON数据直接显示
            accumulated += data + '\n';
            this.setData({
              zodiacPrediction: accumulated,
              isLoading: false
            });
          }
        } catch (e) {
          console.warn('解析数据失败:', { line, error: e });
          // 将原始数据作为文本显示
          accumulated += line + '\n';
          this.setData({
            zodiacPrediction: accumulated,
            isLoading: false
          });
        }
      });
    });
  },

  
  arrayBufferToText(buffer) {
    const uint8Array = new Uint8Array(buffer);
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(uint8Array);
  },

  // 其他方法保持不变...
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