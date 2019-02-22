mui.init({
	gestureConfig: {
		//		tap: true, //默认为true
		doubletap: true, //默认为false
		longtap: true, //默认为false
		swipe: true, //默认为true
		drag: true, //默认为true
		hold: true, //默认为false，不监听
		release: true //默认为false，不监听
	},
});
mui.plusReady(function() {
	plus.webview.currentWebview().setStyle({
		softinputMode: "adjustResize"
	});
	mui.init({
		beforeback: function() {
			plus.storage.removeItem('senderUserId');
			return true; //返回true,继续页面关闭逻辑
		}
	});
	var pause = false;
	document.addEventListener("pause", function() {
		pause = true;
		console.log('切换到后台');
	}, false);
	document.addEventListener('resume', function() {
		pause = false;
		console.log('前台');
	}, false);
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
			isfriend: '',
		},
		mounted: function() {
			mui('.mui-scroll-wrapper').scroll({
				deceleration: 0.0003,
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
					vm.isfriend = data.isfriend;
					plus.storage.setItem("senderUserId", yh.getQueryString('id'))
					document.getElementsByClassName('friend')[0].innerHTML = data.friend_name;
					getConnect(data.user_rytoken, vm.save);
					RongIMLib.RongIMClient.getInstance().getHistoryMessages(yh.getQueryString('id') == 'system' ? 6 : 1, yh.getQueryString('id'), null, 10, {
						onSuccess: function(list, hasMsg) {
							list.forEach(function(value) {
								value.time = showTime(value.sentTime);
								if(value.messageType == 'RecallCommandMessage') {
									value.content.content = value.senderUserId == vm.friend.friend_id ? vm.friend.friend_name + '撤回了一条消息' : '你撤回了一条消息';
								}
								if(value.messageType == 'VoiceMessage') value.audiotim = value.content.extra.tim;
							})
							vm.msglist = list;
						},
						onError: function(error) {
							mui.toast("获取聊天记录失败");
						}
					});
				}
			}, true);
		},
		methods: {
			yhh: function(e) {
				var images = [].slice.call(document.querySelectorAll('.msg-content img[msg]'));
				var urls = [];
				var index;
				images.forEach(function(item, len) {
					if(e.srcElement.src == item.src) index = len;
					urls.push(item.src);
				});
				plus.nativeUI.previewImage(urls, {
					current: index,
					loop: false,
					indicator: 'number'
				});
			},
			hide: function(name, e) {
				var m = e.srcElement.className;
				if(name == m || m == 'msg-item mymsg' || m == 'footer-right absolute' || m == 'iconfont icon-tianjia' || m == 'msg-item-self mymsg') plus.key.hideSoftKeybord();
			},
			value: function() {
				var text = document.getElementById('symptomTxt');
				this.msgcon = text.innerHTML;
			},
			openWindow: function(msg) {
				if(yh.getQueryString('id') != 'system') return;
				var type = msg.content.extra.type;
				if(type == 2) return;
				var url = type == 1 ? '_www/chat/html/friend_application.html' : type == 3 && msg.content.extra.ordertype == 1 ? '_www/module/orderDetails.html?id=' + msg.content.extra.orderid : type == 7 ? '_www/module/shopFansList.html' : '_www/module/under_pay_details.html?id=' + msg.content.extra.orderid;
				var id = url.split("?")[0];
				mui.openWindow(url, id, {
					styles: {
						popGesture: "close",
						background: '#FFFFFF',
					},
				})
			},
			gouserdatails: function(item) {
				if(vm.friend.friend_id == 'system') return;
				var url = item.senderUserId == vm.content.extra.id ? '../../module/user.html' : 'userdetails.html?id=' + item.senderUserId + "&msg=2";
				mui.openWindow(url, item.senderUserId == vm.content.extra.id ? 'user.html' : 'userdetails.html', {
					styles: {
						popGesture: "close",
						background: '#FFFFFF',
					},
				})
			},
			gohistorymsg: function(id) {
				mui.openWindow('historyMessages.html?id=' + id, 'historyMessages.html', {
					styles: {
						popGesture: "close",
						background: '#FFFFFF',
					},
				})
			},
			save: function(reg) {
				if(pause) { //后台运行时提示
					var con = reg.messageType == 'TextMessage' ? reg.content.content : reg.messageType == 'ImageMessage' ? '图片消息' : '你收到一条语音消息';
					plus.push.createMessage(con, '', {
						cover: true,
						sound: "none",
						title: reg.content.extra.name,
					})
				};
				if(reg.senderUserId == this.friend.friend_id || reg.targetId == this.friend.friend_id) {
					if(reg.messageType == 'RecallCommandMessage') {
						this.msglist.forEach(function(value) {
							if(value.messageUId == reg.content.messageUId) {
								value.content.content = vm.friend.friend_name + '撤回了一条消息';
								value.messageType = 'RecallCommandMessage';
							}
						})
						return;
					}
					this.msglist.push(reg);
				}
			},
			sendText: function() { //发送文字消息
				this.content.content = this.msgcon;
				this.content.type = 'text';
				this.msgcon = '';
				var text = document.getElementById('symptomTxt');
				text.innerHTML = '';
				this.sendContent();
			},
			setInterval: function() {
				vm.soundtim = 0;
				vm.timer = setInterval(refreshCount, 1000);

				function refreshCount() {
					if(vm.soundtim >= 60) { //最长60秒
						vm.audiostop();
						return;
					}
					vm.soundtim++;
				}
			},
			getRecorder: function(e) { //录音
				this.isvoice = true;
				this.recorder = plus.audio.getRecorder();
				if(vm.recorder == null) {
					mui.toast("不能获取录音对象");
					return;
				}
				this.setInterval();
				this.recorder.record({
					filename: "_document/" + this.friend.friend_id + "/",
					format: "amr"
				}, function(path) {
					vm.content.extra.tim = vm.soundtim;
					vm.isvoice = false;
					if(vm.soundtim >= 1) {
						vm.Audio2dataURL(path)
					} else {
						mui.toast('时间太短')
					}
				}, function(e) {
					vm.isvoice = false;
					clearInterval(vm.timer);
					vm.toast("录音时出现异常");
				});
			},
			audiostop: function() { //结束录音
				clearInterval(this.timer);
				if(this.recorder) this.recorder.stop();
			},
			Audio2dataURL: function(path) { ///音频转ba64
				plus.io.resolveLocalFileSystemURL(path, function(entry) {
					entry.file(function(file) {
						var reader = new plus.io.FileReader();
						reader.onloadend = function(e) {
							vm.uploadVoice(e.target.result, 'sound', path);
						};
						reader.readAsDataURL(file);
					}, function(e) {
						mui.toast("读写出现异常: " + e.message);
					})
				})
			},
			uploadVoice: function(file, type, path) { //上传音频文件
				yh.ajax({
					url: '/uploadVoice',
					data: {
						voice: file.split(',')[1],
					},
					type: "POST",
					fn: function(data) {
						vm.content.content = data;
						vm.content.type = type;
						vm.sendContent();
					}
				}, true);
			},
			selectImage: function() { //相册选取
				this.isimg = !this.isimg;
				plus.gallery.pick(function(path) {
					plus.zip.compressImage({
						src: path,
						dst: '_doc/image/' + (new Date()).getTime() + '.jpg',
						overwrite: true,
						quality: 32,
						format: 'jpg'
					}, function(e) {
						var p = plus.io.convertLocalFileSystemURL(e.target);
						vm.loadImage('file://' + p);
					}, function() {
						mui.toast("图片处理失败!");
					});
				}, function(e) {
					mui.toast("没有选择图片.");
				});
			},
			captureImage: function() { //拍照				
				var cmr = plus.camera.getCamera(1);
				this.isimg = !this.isimg;
				cmr.captureImage(function(path) {
					plus.gallery.save(path);
					var temp = path.split("/");
					var imgName = temp[temp.length - 1];
					plus.zip.compressImage({
						src: path,
						dst: '_doc/image/' + imgName,
						overwrite: true,
						quality: 32,
						format: 'jpg'
					}, function(e) {
						var p = plus.io.convertLocalFileSystemURL(e.target);
						vm.loadImage('file://' + p);
					}, function() {
						mui.toast("图片处理失败!");
					});
				}, function(err) {
					alert(err.message);
				}, {
					filename: "_doc/msg/" + vm.friendid + "/" + (new Date()).getTime() + ".jpg",
					format: 'jpg',
				});
			},
//			getBase64Image: function(img) { //图片转码
//				var canvas = document.createElement("canvas"); //创建canvas DOM元素，并设置其宽高和图片一样
//				canvas.width = img.width;
//				canvas.height = img.height;
//				var ctx = canvas.getContext("2d");
//				ctx.drawImage(img, 0, 0, img.width, img.height); //使用画布画图
//				var dataURL = canvas.toDataURL("image/" + 'jpeg'); //返回的是一串Base64编码的URL并指定格式
//				canvas = null; //释放
//				return dataURL;
//			},
			loadImage: function(path) { //确定选择图片				
				vm.waiting = plus.nativeUI.showWaiting('图片处理中');
//				var img = new Image();
//				img.src = path;
//				img.onload = function() {
					var bitmap = new plus.nativeObj.Bitmap();
					bitmap.load(path, function() {
						vm.token == '' ? vm.getQiniuUpTokenAndUrl(function() {
							vm.putb(bitmap.toBase64Data(), 'image')
						}) : vm.putb(bitmap.toBase64Data(), 'image');
					})
//					vm.token == '' ? vm.getQiniuUpTokenAndUrl(function() {
//						vm.putb(vm.getBase64Image(img), 'image')
//					}) : vm.putb(vm.getBase64Image(img), 'image');
//				};
			},
			fileSize: function(str) { /*通过base64编码字符流计算文件流大小函数*/
				var fileSize;
				if(str.indexOf('=') > 0) {
					var indexOf = str.indexOf('=');
					str = str.substring(0, indexOf); //把末尾的’=‘号去掉
				}
				fileSize = parseInt(str.length - (str.length / 8) * 2);
				return fileSize;
			},
			putb: function(pic, type) { //图片上传到服务器
				pic = pic.split(',')[1]; //去掉url的头
				var url = "http://upload.qiniup.com/putb64/" + this.fileSize(pic);
				var xhr = new XMLHttpRequest();
				xhr.onreadystatechange = function() {
					if(xhr.readyState == 4) {
						var keyText = JSON.parse(xhr.responseText);
						if(keyText.key) {
							vm.content.content = 'http://youxin.youhuowang.shop/' + keyText.key;
							vm.content.type = type;
							vm.sendContent();
							(new Image()).src = vm.content.content;
						} else {
							vm.getQiniuUpTokenAndUrl(function() { //token过期重新获取并上传
								vm.putb(pic, type);
							});
						}
						vm.waiting.close();
					}
				}
				xhr.open("POST", url, true);
				xhr.setRequestHeader("Content-Type", "application/octet-stream");
				xhr.setRequestHeader("Authorization", "UpToken " + vm.token);
				xhr.send(pic)
			},
			sendContent: function(content) { //发送消息
				if(plus.networkinfo.getCurrentType() == plus.networkinfo.CONNECTION_NONE) {
					RongIMClient.reconnect('', {
						// 默认 false, true 启用自动重连，启用则为必选参数
						auto: true,
						// 网络嗅探地址 [http(s)://]cdn.ronghub.com/RongIMLib-2.2.6.min.js 可选
						url: 'cdn.ronghub.com/RongIMLib-2.2.6.min.js',
						// 重试频率 [100, 1000, 3000, 6000, 10000, 18000] 单位为毫秒，可选
						rate: [100, 1000, 3000, 6000, 10000]
					});
					mui.toast('无网络链接，请检查网络!');
					return;
				}
				if(imStatus != '0') {
					mui.toast('发送失败，请重试');
					RongIMClient.reconnect('', {
						// 默认 false, true 启用自动重连，启用则为必选参数
						auto: true,
						// 网络嗅探地址 [http(s)://]cdn.ronghub.com/RongIMLib-2.2.6.min.js 可选
						url: 'cdn.ronghub.com/RongIMLib-2.2.6.min.js',
						// 重试频率 [100, 1000, 3000, 6000, 10000, 18000] 单位为毫秒，可选
						rate: [100, 1000, 3000, 6000, 10000]
					});
					return;
				}
				sendContent(this.friend.friend_id, content ? content : this.content, this.save);
			},
			preventDefault: function(e) { //点击发送不隐藏软件盘
				e.preventDefault();
			},
			hidepopovers: function(e) { //隐藏弹框
				var popovers = document.querySelector('#popovers');
				if(!e || e.srcElement.className != 'popovers-list') {
					popovers.style.cssText = "display: none";
				}
			},
			showpopovers: function(e, item) { //弹框
				this.msg = item;
				var popovers = document.querySelector('#popovers');
				var b_w = document.body.clientWidth;
				var p_h = item.messageType == 'TextMessage' && item.senderUserId != this.friend.friend_id ? 80 : item.messageType != 'TextMessage' || item.senderUserId == this.friend.friend_id ? 40 : 0;
				//				if(item.messageType=='ImageMessage'){
				//					p_h;
				//				}
				var x = e.detail.center.x,
					y = e.detail.center.y;
				if(x < b_w / 2 && y > p_h) {
					popovers.style.cssText = "top:" + (y - p_h) + "px;left:" + x + "px;display: block";
				} else if(x < b_w / 2 && y < p_h) {
					popovers.style.cssText = "top:" + y + "px;left:" + x + "px;display: block";
				} else if(x > b_w / 2 && y > p_h) {
					popovers.style.cssText = "top:" + (y - p_h) + "px;left:" + (x - 100) + "px;display: block";
				} else {
					popovers.style.cssText = "top:" + y + "px;left:" + (x - 100) + "px;display: block";
				}
			},
			copy: function(copy) { //参数copy是要复制的文本内容
				if(mui.os.ios) { //ios
					var UIPasteboard = plus.ios.importClass("UIPasteboard");
					var generalPasteboard = UIPasteboard.generalPasteboard();
					generalPasteboard.plusCallMethod({ //设置/获取文本内容:
						setValue: copy,
						forPasteboardType: "public.utf8-plain-text"
					});
					mui.toast("已成功复制到剪贴板");
					this.hidepopovers();
				} else { //安卓
					var context = plus.android.importClass("android.content.Context");
					var main = plus.android.runtimeMainActivity();
					var clip = main.getSystemService(context.CLIPBOARD_SERVICE);
					plus.android.invoke(clip, "setText", copy);
					mui.toast("已成功复制到剪贴板");
					this.hidepopovers();
				}
			},
			sendRecallMessage: function() { //撤回
				if((new Date()).valueOf() - this.msg.sentTime > 120000) {
					mui.toast('只能撤回两分钟以内的消息');
					return;
				}
				RongIMClient.getInstance().sendRecallMessage(this.msg, {
					onSuccess: function(message) {
						vm.msglist.forEach(function(value) {
							if(value.messageUId == message.content.messageUId) {
								value.content.content = '你撤回了一条消息';
								value.messageType = 'RecallCommandMessage';
							}
						})
						vm.hidepopovers();
					},
					onError: function(errorCode, message) {
						showResult("撤回失败");
					}
				});
			},
			savePicture: function() { //保存到相册
				vm.waiting = plus.nativeUI.showWaiting();
				var dtask = plus.downloader.createDownload(vm.msg.content.content, {
					filename: '_downloads/'
				}, function(d, status) {
					if(status == 200) { // 下载完成
						plus.gallery.save(d.filename, function() {
							mui.toast("操作成功");
						});
					} else {
						mui.toast("操作失败");
					}
					vm.waiting.close();
				});
				dtask.start();
				vm.hidepopovers();
			},
			getQiniuUpTokenAndUrl: function(fn) {
				yh.ajax({
					url: "/getFileMessageToken",
					type: "GET",
					fn: function(data) {
						vm.token = data.token;
						if(fn) fn();
					}
				}, true)
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
			reLayout: function() { //从新计算消息滚动组件
				mui('.mui-scroll-wrapper').scroll().reLayout();
				mui('.mui-scroll-wrapper').scroll().scrollToBottom(100);
			},
		},
		watch: {
			isimg: function() {
				this.$nextTick(function() {
					this.reLayout();
				})
			},
			msglist: function() {
				this.$nextTick(function() {
					var imglist = document.getElementsByClassName('msg-content-image');
					for(var i = 0; i < imglist.length - 1; i++) {
						imglist[i].onload = function(e) {
							vm.reLayout();
						}
					}
					vm.reLayout();
				})
			},
		},
		computed: {
			iscon: function() {
				return this.msgcon.length == 0 ? false : true;
			},
			itemclass: function() {
				return function(tag) {
					return tag == vm.content.extra.id ? 'msg-item-self mymsg' : 'msg-item mymsg';
				}
			}
		}
	});

	$(window).on('resize', function() {
		vm.reLayout();
	});
})