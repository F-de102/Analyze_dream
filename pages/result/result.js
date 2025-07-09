const app = getApp(); 
Page({
  data: {
    dreamImage: '',
    dreamInterpretation: '',
    messages: [],
    chatMessage: '',
    dreamid:0,
  },

  onLoad(options) {
    const title = decodeURIComponent(options.title || '');
    const content = decodeURIComponent(options.content || '');
    const userid = app.globalData.userId;
  
    wx.showLoading({ title: '解析中...' });
  
    let accumulated = '';
    const requestTask = wx.request({
      url: 'http://localhost:8080/analyze',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      enableChunked: true,
      responseType: 'text',
      data: { title, content, userId: userid },
      success: () => {
        // 最终处理由 chunk 完成
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  
    requestTask.onChunkReceived?.((res) => {
      const text = this.arrayBufferToText(res.data);
      const lines = text.split('\n');
  
      lines.forEach(line => {
        if (line.startsWith('data:')) {
          const data = line.replace(/^data:\s*/, '');
  
          if (data === '[DONE]') return;
  
          try {
            const json = JSON.parse(data);
  
            if (json.content) {
              accumulated += json.content;
              this.setData({ dreamInterpretation: accumulated });
            } else if (json.done) {
              this.setData({
                dreamImage: json.imageUrl,
                dreamid: json.dreamId
              });
  
              // 预设欢迎语
              this.addMessage('assistant', '你好，我是梦境解析师，可以继续聊聊吗？');
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
  addMessage(role, content) {
    this.setData({
      messages: [...this.data.messages, {
        id: Date.now(),
        role,
        content
      }]
    });
  },

  onChatInput(e) {
    this.setData({ chatMessage: e.detail.value });
  },

  sendMessage() {
    const msg = this.data.chatMessage.trim();
    if (!msg) return;
  
    this.addMessage('user', msg);
    this.setData({ chatMessage: '' });
  
    let accumulated = '';
    const requestTask = wx.request({
      url: 'http://localhost:8080/chat',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      enableChunked: true,
      responseType: 'text',
      data: {
        user_id: app.globalData.userId,
        dream_id: this.data.dreamid,
        message: msg
      },
      success: () => {
        // 完整接收后不处理，onChunkReceived 中负责逐步更新
      },
      fail: () => {
        this.addMessage('assistant', '对不起，AI未能回复，请稍后再试~');
      }
    });
  
    requestTask.onChunkReceived?.((res) => {
      const text = this.arrayBufferToText(res.data);
      const lines = text.split('\n');
  
      lines.forEach(line => {
        if (line.startsWith('data:')) {
          const data = line.replace(/^data:\s*/, '');
  
          if (data === '[DONE]') return;
  
          try {
            const json = JSON.parse(data);
            if (json.content) {
              accumulated += json.content;
  
              // 更新最后一个 assistant 消息
              const msgs = [...this.data.messages];
              const last = msgs[msgs.length - 1];
  
              if (last && last.role === 'assistant') {
                last.content = accumulated;
                this.setData({ messages: msgs });
              } else {
                this.addMessage('assistant', json.content);
              }
            }
          } catch (e) {
            console.warn('解析出错', e);
          }
        }
      });
    });
  },
  

  goBack() {
    wx.navigateBack();
  }
});
