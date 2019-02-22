var yh = (function(w) {
	this.formalApi = "https://app.youhuowang.shop";
	this.aes = function() {
		var plaintText = '{"version": "1.0.0","time":' + new Date().getTime() + '}';
		var key = CryptoJS.enc.Utf8.parse("524dfrtfg365e1tr");
		var options = {
			iv: CryptoJS.enc.Utf8.parse("36ser2ty45ubg34r"),
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.Pkcs7
		}
		var encryptedData = CryptoJS.AES.encrypt(plaintText, key, options);
		var encryptedBase64Str = encryptedData.toString();
		return encryptedBase64Str;
	};
	this.istoken=function(fn){
		var token=plus.storage.getItem('token')||false;
		if(!token){
			mui.openWindow('_www/module/login.html', 'login', {
				styles: {
					popGesture: "none"
				},
				extras: {}
			});
			return;
		}
		fn();
	};
	this.messagelist=function(){
		istoken(function(){
			var webview = plus.webview.getWebviewById(plus.runtime.appid);
			if(webview) {
				webview.hide('none');
				mui.fire(webview, 'refresh', {
					index: 1
				});
				webview.show('slide-in-rihgt');
			}
			plus.webview.currentWebview().hide();
			plus.webview.currentWebview().close();
		})
	};
	this.ajax = function(data, onf, errorFn) {
		var token=plus.storage.getItem('token')||false;
		if(onf&&!token){
			mui.openWindow('_www/module/login.html', 'login', {
				styles: {
					popGesture: "none"
				},
				extras: {}
			});
			return;
		}
		mui.ajax(formalApi + data.url, {
			headers: {
				'sign': aes(),
				'token':token,
			},
			data: data.data || '',
			dataType: 'json', //服务器返回json格式数据
			crossDomain: true, //强制使用5+跨域
			type: data.type, //HTTP请求类型
			timeout:data.time||10000, //超时时间设置为10秒；
			success: function(reg) {
				if(reg.code == 'success') {
					data.fn(reg.data, reg.message);
				} else if(reg.code == '1001') {//未登录
					mui.alert('你的账号在其它设备上登录,如不是本人操作，请尽快修改密码!','警告','重新登录',function(){
						plus.storage.removeItem('token');
						mui.openWindow('_www/module/login.html', 'login', {
							styles: {
								popGesture: "none"
							},
							extras: {}
						});
					})
				} else {
					errorFn != undefined ? errorFn(reg) : mui.toast(reg.message);
				}
			},
			error: function(xhr, type, errorThrown) {
				
				if(errorFn != undefined )errorFn();
				if(xhr.status == 500){
					var str={
						data:data.data,
						sign: aes(),
						token:token,
					};
					console.log(JSON.stringify(str)+data.url);
					// mui.toast("服务器错误"+type.error);
					if(errorFn != undefined )errorFn();
				}
				console.log("status"+xhr.status+xhr.readyState);
			}
		});

	};
	this.getQueryString = function(name) {
		var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
		var r = window.location.search.substr(1).match(reg);
		if(r != null) return decodeURI(r[2]);
		return false;
	};
	return this;
})(window);