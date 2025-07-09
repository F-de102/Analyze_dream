// pages/login/login.js
const app = getApp();

Page({
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    isHide: false,
    hasUserInfo: false,
    userInfo: {},
    isLogging: false // 防止重复登录
  },

  onLoad() {
    this.checkAuth();
  },

  // 新版授权方式
  getUserProfile() {
    if (this.data.isLogging) return;
    this.setData({ isLogging: true });
    
    wx.getUserProfile({
      desc: '用于登录',
      success: res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
        this.wxLogin(); // 统一调用登录逻辑
      },
      fail: () => {
        wx.showToast({ title: '授权失败', icon: 'none' });
        this.setData({ isLogging: false });
      }
    });
  },

  checkAuth() {
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已授权，先获取用户信息再登录
          this.getUserInfoAndLogin();
        } else {
          this.setData({ isHide: true });
        }
      }
    });
  },

  // 获取用户信息并登录（用于已授权的情况）
  getUserInfoAndLogin() {
    wx.getUserInfo({
      success: res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
        // 延迟一下显示用户信息，然后再跳转
        setTimeout(() => {
          this.wxLogin();
        }, 1500);
      },
      fail: () => {
        // 获取失败，显示授权按钮
        this.setData({ isHide: true });
      }
    });
  },

  wxLogin() {
    if (this.data.isLogging) return;
    
    this.setData({ isLogging: true });
    
    wx.login({
      success: res => {
        if (res.code) {
          console.log('=================== 前端调试信息 ===================');
          console.log('获取到的 code:', res.code);
          console.log('code 长度:', res.code.length);
          console.log('code 类型:', typeof res.code);
          console.log('当前时间:', new Date().toLocaleString());
          console.log('================================================');
          
          this.sendCodeToBackend(res.code);
        } else {
          console.log('登录失败！' + res.errMsg);
          this.setData({ isLogging: false });
        }
      },
      fail: (error) => {
        console.log('wx.login 调用失败:', error);
        wx.showToast({ title: '调用 wx.login 失败', icon: 'none' });
        this.setData({ isLogging: false });
      }
    });
  },

  // 发送请求到后端
  sendCodeToBackend(code) {
    const sendData = {
      code: code,
      userInfo: this.data.userInfo
    };

    // 旧版授权方式需要添加加密数据
    if (this.data.canIUse && !this.data.hasUserInfo) {
      wx.getUserInfo({
        success: res => {
          sendData.encryptedData = res.encryptedData;
          sendData.iv = res.iv;
          this.makeRequest(sendData);
        },
        fail: () => {
          this.setData({ isLogging: false });
        }
      });
    } else {
      this.makeRequest(sendData);
    }
  },
  
  makeRequest(data) {
    console.log("发送给后端的数据：", data);
    console.log("userInfo 详情：", data.userInfo);
    wx.request({
      url: 'http://localhost:8080/api/wxlogin',
      method: 'POST',
      data: data,
      success: res => {
        if (res.data.success) {
          app.globalData.isLoggedIn = true;
          app.globalData.userInfo = res.data.user;
          app.globalData.userId = res.data.user.id;
          
          // 同时保存到本地存储
          //wx.setStorageSync('token', res.data.token);
          //wx.setStorageSync('userId', res.data.user.id);
          //wx.setStorageSync('userInfo', res.data.user);
          
          console.log("登录成功，userId:", res.data.user.id);
          // 在跳转代码处添加完整错误处理
wx.reLaunch({
  url: '/pages/dream/dream',
  success: () => console.log('跳转成功'),
  fail: (err) => {
    console.error('跳转失败详情:', err)
    wx.showModal({
      title: '提示',
      content: `跳转失败：${err.errMsg || '未知错误'}\n请检查：\n1.页面路径是否正确\n2.app.json是否配置`,
      showCancel: false
    })
  }
});
        } else {
          wx.showToast({ title: res.data.message || '登录失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => {
        this.setData({ isLogging: false });
      }
    });
  }
});