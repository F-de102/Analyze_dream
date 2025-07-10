// app.js
App({
  globalData: {
    isLoggedIn: false,
    userInfo: null,
    userId: null
  },

  onLaunch() {
    wx.requirePrivacyAuthorize({
      success: () => {
        // 用户同意后，再调用后台数据接口
        wx.getBackgroundFetchData({
          fetchType: 'pre',
          success(res) { console.log('获取数据:', res.fetchedData) },
          fail(err) { console.error('获取失败:', err) }
        })
      },
      fail: () => {
        console.error('用户拒绝隐私协议')
      }
    });
    // 启动时尝试恢复登录状态
    this.restoreLoginStatus();

    const fs = wx.getFileSystemManager();
    const logDirPath = `${wx.env.USER_DATA_PATH}/miniprogramLog`;
    const logFiles = ['log1', 'log2', 'log3','log4','log5'];
    
    // 创建目录
    fs.access({
        path: logDirPath,
        success: () => {
            console.log('Directory exists');
            checkAndCreateFiles();
        },
        fail: () => {
            console.log('Directory does not exist, creating it');
            fs.mkdir({
                dirPath: logDirPath,
                success: () => {
                    console.log('Directory created successfully');
                    checkAndCreateFiles();
                },
                fail: err => {
                    console.error('Failed to create directory', err);
                }
            });
        }
    });
    function checkAndCreateFiles() {
        logFiles.forEach(logFile => {
            const logFilePath = `${logDirPath}/${logFile}`;
            fs.access({
                path: logFilePath,
                success: () => {
                    console.log(`${logFile} exists`);
                },
                fail: () => {
                    console.log(`${logFile} does not exist, creating it`);
                    fs.writeFile({
                        filePath: logFilePath,
                        data: '',
                        success: res => {
                            console.log(`${logFile} created successfully`);
                        },
                        fail: err => {
                            console.error(`Failed to create ${logFile}`, err);
                        }
                    });
                }
            });
        });
    }

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