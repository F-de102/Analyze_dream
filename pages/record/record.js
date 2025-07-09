const app = getApp()

Page({
  data: {
    activeTab: 'list', // 'list' 或 'calendar'
    dreamRecords: [], // 梦境列表数据
    trashRecords: [], 
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    days: [], // 日历天数数据
    isTrashMode: false,
    selectedDate: null, // 选中的日期
    selectedDreams: [], // 选中日期的梦境
    showDreamDetail: false, // 是否显示详情弹窗
    currentDream: {}, // 当前查看的梦境详情
  },

  onLoad() {
    this.checkLoginStatus()
    this.loadDreamRecords();
    this.generateCalendar();
  },

  onShow() {
    this.checkLoginStatus()
    if (app.globalData.isLoggedIn) {
      this.loadDreamRecords();
      // 如果当前在回收站页面，也加载回收站数据
      if (this.data.activeTab === 'trash') {
        this.loadTrashRecords();
      }
    }
  },
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        success: () => {
          wx.reLaunch({
            url: '/pages/index/index'
          });
        }
      });
      return false;
    }
    return true;
  },
  loadDreamRecords() {
    const userId = app.globalData.userId;
    
    console.log('record页面 userId:', userId);
    
    if (!userId) {
      console.log('userId 为空，跳转登录页');
      wx.reLaunch({
        url: '/pages/index/index'
      });
      return;
    }
  
    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: `http://localhost:8080/dreams?user_id=${encodeURIComponent(userId)}`, 
      method: 'GET',
      success: (res) => {
        console.log("返回结果：", res.data);
  
        const dreams = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.data)
            ? res.data.data
            : [];
      
        this.setData({
          dreamRecords: dreams.map(item => ({
            ...item,
            imageUrl: item.image_url, // 修复图片字段名
            date: this.formatDate(item.dream_date),
            summary: item.interpretation.length > 30 
              ? item.interpretation.substring(0, 30) + '...' 
              : item.interpretation
          }))
        });
        
        if (this.data.activeTab === 'calendar') {
          this.generateCalendar();
        }
      },
      fail: (err) => {
        console.log('请求失败:', err);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 切换选项卡
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    
    if (tab === 'calendar') {
      this.generateCalendar();
    }else if (tab === 'trash') {
      this.loadTrashRecords(); // 切换到回收站时加载数据
    }
  },

//////////////////////////////////日历
  // 生成日历数据
  generateCalendar() {
    const { currentYear, currentMonth } = this.data;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
    
// 获取有梦境的日期 - 直接截取日期部分
const dreamDates = this.data.dreamRecords.map(item => 
  item.dream_date.split('T')[0]  // 直接取 "2025-07-09T00:00:00+08:00" 的前面部分
);

console.log('梦境日期列表:', dreamDates); // 调试
    
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === currentYear && 
                          today.getMonth() + 1 === currentMonth;
    
    const days = [];
    
    // 上个月的最后几天
    const prevMonthDays = firstDayOfMonth;
    if (prevMonthDays > 0) {
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
      
      for (let i = 0; i < prevMonthDays; i++) {
        const day = daysInPrevMonth - prevMonthDays + i + 1;
        days.push({
          day,
          isCurrentMonth: false,
          isToday: false,
          hasDream: false,
          date: `${prevYear}-${this.padZero(prevMonth)}-${this.padZero(day)}`
        });
      }
    }
    
    // 当前月的天数
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentYear}-${this.padZero(currentMonth)}-${this.padZero(i)}`;
      days.push({
        day: i,
        isCurrentMonth: true,
        isToday: isCurrentMonth && i === today.getDate(),
        hasDream: dreamDates.includes(dateStr),
        date: dateStr
      });
    }
    
    // 下个月的前几天
    const totalCells = Math.ceil((days.length) / 7) * 7;
    const nextMonthDays = totalCells - days.length;
    if (nextMonthDays > 0) {
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      
      for (let i = 1; i <= nextMonthDays; i++) {
        days.push({
          day: i,
          isCurrentMonth: false,
          isToday: false,
          hasDream: false,
          date: `${nextYear}-${this.padZero(nextMonth)}-${this.padZero(i)}`
        });
      }
    }
    
    this.setData({ days });
  },

  // 上个月
  prevMonth() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 1) {
      currentMonth = 12;
      currentYear--;
    } else {
      currentMonth--;
    }
    
    this.setData({
      currentYear,
      currentMonth
    }, () => {
      this.generateCalendar();
    });
  },

  // 下个月
  nextMonth() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 12) {
      currentMonth = 1;
      currentYear++;
    } else {
      currentMonth++;
    }
    
    this.setData({
      currentYear,
      currentMonth
    }, () => {
      this.generateCalendar();
    });
  },

  // 回到今天
  goToday() {
    const today = new Date();
    this.setData({
      currentYear: today.getFullYear(),
      currentMonth: today.getMonth() + 1
    }, () => {
      this.generateCalendar();
    });
  },

  // 选择日期
  selectDay(e) {
    const date = e.currentTarget.dataset.date;
    console.log('选择的日期:', date); // 调试用
    const dreams = this.data.dreamRecords.filter(item => 
      item.dream_date.split('T')[0] === date 
    );
    
    this.setData({
      selectedDate: `${date.split('-')[0]}年${parseInt(date.split('-')[1])}月${parseInt(date.split('-')[2])}日`,
      selectedDreams: dreams
    });
  },

// 修改 viewDreamDetail 方法
viewDreamDetail(e) {
  const id = e.currentTarget.dataset.id;
  const dream = this.data.dreamRecords.find(item => item.id === id || item.ID === id);
  
  if (dream) {
    this.setData({
      currentDream: dream,
      showDreamDetail: true,
      isTrashMode: false // 正常模式
    });
  }
},
// 隐藏详情时重置模式
hideDreamDetail() {
  this.setData({ 
    showDreamDetail: false,
    isTrashMode: false
  });
},

  // 阻止事件冒泡
  stopPropagation() {},

  deleteDream() {
    wx.showModal({
      title: '提示',
      content: '确定要删除这条梦境记录吗？',
      success: (res) => {
        if (res.confirm) {
          const dreamId = this.data.currentDream.id || this.data.currentDream.ID;
          
          console.log('要删除的梦境ID:', dreamId); // 调试用
          
          if (!dreamId) {
            wx.showToast({ title: '梦境ID不存在', icon: 'none' });
            return;
          }
  
          wx.showLoading({ title: '删除中...' });
          
          wx.request({
            url: `http://localhost:8080/dreams/${dreamId}`,
            method: 'DELETE',
            success: (res) => {
              console.log('删除响应:', res.data);
              wx.showToast({ title: '删除成功' });
              this.loadDreamRecords(); // 重新加载列表
              this.hideDreamDetail();  // 关闭详情弹窗
            },
            fail: (err) => {
              console.log('删除失败:', err);
              wx.showToast({ title: '删除失败', icon: 'none' });
            },
            complete: () => {
              wx.hideLoading();
            }
          });
        }
      }
    });
  },
  // 辅助函数：格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  },

  // 辅助函数：补零
  padZero(num) {
    return num < 10 ? `0${num}` : num;
  },

  /////////////////////////////////////////////////////// 加载回收站记录
loadTrashRecords() {
  const userId = app.globalData.userId;
  
  if (!userId) {
    wx.reLaunch({
      url: '/pages/index/index'
    });
    return;
  }

  wx.showLoading({ title: '加载回收站...' });
  wx.request({
    url: `http://localhost:8080/dreams/trash?user_id=${encodeURIComponent(userId)}`,
    method: 'GET',
    success: (res) => {
      console.log("回收站数据：", res.data);

      const dreams = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
          ? res.data.data
          : [];
    
      this.setData({
        trashRecords: dreams.map(item => ({
          ...item,
          imageUrl: item.image_url,
          date: this.formatDate(item.dream_date),
          summary: item.interpretation && item.interpretation.length > 30 
            ? item.interpretation.substring(0, 30) + '...' 
            : item.interpretation || '无解析内容'
        }))
      });
    },
    fail: (err) => {
      console.log('回收站加载失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    },
    complete: () => {
      wx.hideLoading();
    }
  });
}, // 查看回收站梦境详情
// 修改 viewTrashDetail 方法
viewTrashDetail(e) {
  const id = e.currentTarget.dataset.id;
  const dream = this.data.trashRecords.find(item => item.id === id || item.ID === id);
  
  if (dream) {
    this.setData({
      currentDream: dream,
      showDreamDetail: true,
      isTrashMode: true // 回收站模式
    });
  }
},
// 从弹窗恢复梦境
restoreDreamFromModal() {
  const dreamId = this.data.currentDream.id || this.data.currentDream.ID;
  
  wx.showModal({
    title: '确认恢复',
    content: '确定要恢复这条梦境记录吗？',
    success: (res) => {
      if (res.confirm) {
        this.restoreDreamById(dreamId, () => {
          this.hideDreamDetail(); // 恢复成功后关闭弹窗
        });
      }
    }
  });
},

// 从弹窗永久删除梦境
permanentDeleteFromModal() {
  const dreamId = this.data.currentDream.id || this.data.currentDream.ID;
  
  wx.showModal({
    title: '永久删除',
    content: '确定要永久删除这条记录吗？删除后无法恢复！',
    confirmColor: '#ff4757',
    success: (res) => {
      if (res.confirm) {
        this.permanentDeleteById(dreamId, () => {
          this.hideDreamDetail(); // 删除成功后关闭弹窗
        });
      }
    }
  });
},

// 抽取恢复逻辑为独立方法
restoreDreamById(dreamId, callback) {
  wx.showLoading({ title: '恢复中...' });
  
  wx.request({
    url: `http://localhost:8080/dreams/${dreamId}/restore`,
    method: 'POST',
    success: (res) => {
      console.log('恢复响应:', res.data);
      wx.showToast({ title: '恢复成功' });
      
      // 重新加载数据
      this.loadTrashRecords();
      this.loadDreamRecords();
      
      if (callback) callback();
    },
    fail: (err) => {
      console.log('恢复失败:', err);
      wx.showToast({ title: '恢复失败', icon: 'none' });
    },
    complete: () => {
      wx.hideLoading();
    }
  });
},

// 抽取永久删除逻辑为独立方法
permanentDeleteById(dreamId, callback) {
  wx.showLoading({ title: '删除中...' });
  
  wx.request({
    url: `http://localhost:8080/dreams/${dreamId}/permanent`,
    method: 'DELETE',
    success: (res) => {
      console.log('永久删除响应:', res.data);
      wx.showToast({ title: '永久删除成功' });
      
      // 重新加载回收站数据
      this.loadTrashRecords();
      
      if (callback) callback();
    },
    fail: (err) => {
      console.log('永久删除失败:', err);
      wx.showToast({ title: '删除失败', icon: 'none' });
    },
    complete: () => {
      wx.hideLoading();
    }
  });
},

// 修改原有的 restoreDream 方法，使用新的抽取方法
restoreDream(e) {
  const dreamId = e.currentTarget.dataset.id;
  
  wx.showModal({
    title: '确认恢复',
    content: '确定要恢复这条梦境记录吗？',
    success: (res) => {
      if (res.confirm) {
        this.restoreDreamById(dreamId);
      }
    }
  });
},

// 修改原有的 permanentDelete 方法，使用新的抽取方法
permanentDelete(e) {
  const dreamId = e.currentTarget.dataset.id;
  
  wx.showModal({
    title: '永久删除',
    content: '确定要永久删除这条记录吗？删除后无法恢复！',
    confirmColor: '#ff4757',
    success: (res) => {
      if (res.confirm) {
        this.permanentDeleteById(dreamId);
      }
    }
  });
},// 清空回收站
clearAllTrash() {
  wx.showModal({
    title: '清空回收站',
    content: '确定要清空整个回收站吗？所有记录将被永久删除！',
    confirmColor: '#ff4757',
    success: (res) => {
      if (res.confirm) {
        const userId = app.globalData.userId;
        
        wx.showLoading({ title: '清空中...' });
        
        wx.request({
          url: `http://localhost:8080/dreams/trash/clear?user_id=${encodeURIComponent(userId)}`,
          method: 'DELETE',
          success: (res) => {
            wx.showToast({ title: '回收站已清空' });
            this.loadTrashRecords(); // 重新加载
          },
          fail: (err) => {
            console.log('清空失败:', err);
            wx.showToast({ title: '清空失败', icon: 'none' });
          },
          complete: () => {
            wx.hideLoading();
          }
        });
      }
    }
  });
},

});