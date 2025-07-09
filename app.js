// app.js
App({
  globalData: {
    isLoggedIn: false,
    userInfo: null,
    userId: null
  },

  onLaunch() {
    // 启动时尝试恢复登录状态
    this.restoreLoginStatus();
  },

  restoreLoginStatus() {
    const token = wx.getStorageSync('token');
    const userId = wx.getStorageSync('userId');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userId) {
      this.globalData.isLoggedIn = true;
      this.globalData.userId = userId;
      this.globalData.userInfo = userInfo;
      console.log('恢复登录状态成功，userId:', userId);
    }
  }
});