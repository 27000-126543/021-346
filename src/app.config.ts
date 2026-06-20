export default defineAppConfig({
  pages: [
    'pages/todo/index',
    'pages/records/index',
    'pages/detail/index',
    'pages/export/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#2b6cb0',
    navigationBarTitleText: '洽商会签',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#a0aec0',
    selectedColor: '#2b6cb0',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/todo/index',
        text: '待办'
      },
      {
        pagePath: 'pages/records/index',
        text: '记录'
      }
    ]
  }
})
