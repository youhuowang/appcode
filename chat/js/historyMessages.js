
mui.plusReady(function() {
	plus.webview.currentWebview().setStyle({
		softinputMode: "adjustResize"
	});
	var vm = new Vue({
		el: '#app',
		data: {
			token: '',
			type: true,
			isimg: false,
			isimg: false,
			msgcon: "",
			isvoice: false,
			ispopovers: true,
			audio: document.querySelector('#audio'),
			content: '',
			friend: {},
			msglist: [],
			soundtim: 0,
			timer: null,
			recorder: '',
			msg: '',
			waiting: '',
			isfriend:'',
			rytoken:'',
		},
		mounted: function() {
			mui('.main').on('tap', 'img[msg]', function() {
				var images = [].slice.call(document.querySelectorAll('.main img[msg]'));
				var urls = [];
				images.forEach(function(item) {
					urls.push(item.src);
				});
				var index = images.indexOf(this);
				plus.nativeUI.previewImage(urls, {
					current: index,
					loop: false,
					indicator: 'number'
				});
			});
			yh.ajax({ //获取用户信息
				url: '/ryUserInfo',
				data: {
					userid: yh.getQueryString('id'),
				},
				type: "GET",
				fn: function(data) {
					vm.content = {
						con: "",
						type: '',
						extra: {
							img: data.user_headpic,
							name: data.user_name,
							id: data.user_id,
							friend_name: data.friend_name,
							friend_headpic: data.friend_headpic,
							friend_id: yh.getQueryString('id')
						},
					};
					vm.friend = {
						friend_name: data.friend_name,
						friend_headpic: data.friend_headpic,
						friend_id: yh.getQueryString('id')
					};
					vm.isfriend=data.isfriend;
					vm.rytoken=data.user_rytoken;
					getmsg();
				}
			}, true);
		},
		methods: {
			openWindow:function(msg){
				if(yh.getQueryString('id')!='system')return;
				var type=msg.content.extra.type;
				if(type==2)return;
				var url=type==1?'_www/chat/html/friend_application.html':type==4?'_www/module/tab_top.html?id=1':type==7?'shopFansList.html':'_www/module/tab_top.html?id=2';
				var id = url.split("?")[0];
				mui.openWindow(url,id, {
					styles: {
						popGesture: "close",
						background: '#FFFFFF',
					},
				})
			},
			gouserdatails: function(item) {
				if(vm.friend.friend_id=='system')return;
				var url = item.senderUserId == vm.content.extra.id ? '../../module/user.html' : 'userdetails.html?id=' + item.senderUserId+"&msg=2";
				mui.openWindow(url, item.senderUserId == vm.content.extra.id ? 'user.html' : 'userdetails.html', {
					styles: {
						popGesture: "close"
					},
				})
			},
			play: function(path, e) {
				path = path + '?v=1'
				if(path != this.audio.src) {
					$(".msg-content-audio").removeClass("audio-active");
					this.audio.pause();
					this.audio.setAttribute('src', path);
					this.audio.addEventListener('ended', function() {
						$(e.srcElement).removeClass('audio-active');
					}, false);
				}
				if(this.audio.paused) { //如果当前是暂停状态
					$(e.srcElement).addClass('audio-active')
					this.audio.play(); //播放
					return;
				} else { //当前是播放状态
					$(e.srcElement).removeClass('audio-active');
					this.audio.pause(); //暂停
					this.audio.currentTime = 0.0;
				}
			},
		},
		computed: {
			itemclass: function() {
				return function(tag) {
					return tag == vm.content.extra.id ? 'msg-item-self mymsg' : 'msg-item mymsg';
				}
			}
		}
	});
	mui.init({
		gestureConfig: {
			tap: true, //默认为true
			doubletap: true, //默认为false
			longtap: true, //默认为false
			swipe: true, //默认为true
			drag: true, //默认为true
			hold: true, //默认为false，不监听
			release: true //默认为false，不监听
		},
	  pullRefresh : {
	    container:'#pullRefresh',//待刷新区域标识，querySelector能定位的css选择器均可，比如：id、.class等
	    up : {
	      height:50,//可选.默认50.触发上拉加载拖动距离
	      auto:false,//可选,默认false.自动上拉加载一次
	      contentrefresh : "正在加载...",//可选，正在加载状态时，上拉加载控件上显示的标题内容
	      contentnomore:'没有更多数据了',//可选，请求完毕若没有更多数据时显示的提醒内容；
	      callback :pullupRefresh //必选，刷新函数，根据具体业务来编写，比如通过ajax从服务器获取新数据；
	    }
	  }
	});
	function getmsg(){
		getConnect(vm.rytoken, function(){});
		pullupRefresh();
	}
	function pullupRefresh(){
		var $this = this;
		RongIMLib.RongIMClient.getInstance().getHistoryMessages(yh.getQueryString('id')=='system'?6:1, yh.getQueryString('id'), null, 20, {
			onSuccess: function(list, hasMsg) {
				list.reverse().forEach(function(value) {
					value.time = historytim(value.sentTime);
					if(value.messageType == 'RecallCommandMessage') {
						value.content.content = value.senderUserId == vm.friend.friend_id ? vm.friend.friend_name + '撤回了一条消息' : '你撤回了一条消息';
					}
					if(value.messageType == 'VoiceMessage') value.audiotim = value.content.extra.tim;
					vm.msglist.push(value);
				})
				mui('#pullRefresh').pullRefresh().endPullupToRefresh(!hasMsg);
			},
			onError: function(error) {
				mui.toast("获取聊天记录失败");
			}
		});
	};
})