mui.plusReady(function() {
	window.addEventListener('refresh', function(e) {
		vm.phone=e.detail.phone;
	});
	var vm = new Vue({
		el: '#app',
		data: {
			onOff: true,
			isObtainCode: true,
			waiting:'',
			title: '用户登录',
			tips: '手机号:',
			mode: '短信验证登录',
			codeText: '发送验证码',
			timer: null,
			phone: '',
			password: '',
			code: '',
			myreg: /^1(3|4|5|7|8|9)\d{9}$/,
			isPassword: /^[a-zA-Z0-9]{6,24}$/,
		},
		mounted: function() {
			mui('body').on('tap','a[reg]', function() {
				mui.openWindow('register.html','register.html', {
					styles: {
						popGesture: "close",
						background:'#FFFFFF',
					},
				});
			});
		},
		methods: {
			toggleLog: function() { //登录方式切换
				vm.onOff = !vm.onOff;
				if(vm.onOff) { //密码登录模式
					vm.title = '用户登录';
					vm.tips = '手机号';
					vm.mode = '短信验证登录';
				} else { //验证码登录模式
					vm.title = '请输入手机号';
					vm.tips = '';
					vm.mode = '密码登录';
				}
				vm.password = '';
				vm.code = '';
			},
			obtainCode: function() { //发送验证码
				if(!this.isObtain) return;
				vm.waiting = plus.nativeUI.showWaiting();
				this.isObtainCode = false;
				var second = 60;
				yh.ajax({
					url: "/getSmsCode",
					data: {
						phone: vm.phone,
						type: 2,
					},
					type: "post",
					fn: function(data) {
						vm.waiting.close();
						vm.codeText = second + '秒';
						vm.timer = setInterval(function() {
							second -= 1;
							if(second > 0) vm.codeText = second + "秒";
							else {
								clearInterval(vm.timer);
								vm.codeText = "发送验证码";
								vm.isObtainCode = true;
							}
						}, 1000);
					}
				}, false, function(reg) {
					mui.toast(reg.message);
					clearInterval(vm.timer);
					vm.isObtainCode = true;
				});
			},
			login: function() {
				var url, data;
				if(!this.isPhone){
					mui.toast("手机号不正确");
					return;
				}
				if(vm.onOff) {
					if(!this.isPasswords){
						mui.toast("密码输入错误");
						return;
					}
					url = '/pwdLogin';
					data = {
						phone: vm.phone,
						password: vm.password,
					};
				} else {
					if(!this.isCode){
						mui.toast("验证码有误");
						return;
					}
					url = '/codeLogin';
					data = {
						phone: vm.phone,
						code: vm.code,
					};
				};
				data.cid=plus.push.getClientInfo().clientid;
				vm.waiting = plus.nativeUI.showWaiting('登录中...');
				yh.ajax({
					url: url,
					data: data,
					type: "post",
					fn: function(data) {
						vm.waiting.close();
						plus.storage.setItem("token", data.token);
						plus.storage.setItem("rytoken", data.rytoken);
						plus.storage.setItem("userid", data.userid);
						var webview=plus.webview.getWebviewById(plus.runtime.appid);
						webview.evalJS("msgint()");
						mui.back();
					}
				},false,function(reg){
					if(reg)mui.toast(reg.message);
					vm.waiting.close();
				});
			}
		},
		computed: {
			isPhone: function() {
				return this.myreg.test(this.phone) ? true : false;
			},
			isCode: function() {
				return this.code.length == 6 ? true : false;
			},
			isPasswords: function() {
				return this.isPassword.test(this.password) ? true : false;
			},
			isObtain: function() {
				return this.isObtainCode && this.isPhone ? true : false;
			}
		}
	})
	mui.init({
		beforeback: function() { //返回触发刷新
			var list = plus.webview.currentWebview().opener();
			mui.fire(list, 'refresh');
			return true;
		}
	})
});