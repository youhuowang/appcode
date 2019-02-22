var imStatus = null;
RongIMLib.RongIMClient.init("3argexb63mc9e");
function getConnect(token,fn,getmsglist) {
	var userid;
	RongIMClient.setConnectionStatusListener({
		onChanged: function(status) {
			imStatus = status;
			switch(status) {
				case RongIMLib.ConnectionStatus.CONNECTED:
					if(getmsglist!=undefined)getmsglist();
					console.log('链接成功');
					break;
				case RongIMLib.ConnectionStatus.CONNECTING:
					console.log('正在链接');
					break;
				case RongIMLib.ConnectionStatus.DISCONNECTED:
					console.log('断开连接');
					break;
				case RongIMLib.ConnectionStatus.KICKED_OFFLINE_BY_OTHER_CLIENT:
					console.log('其他设备登陆');
					break;
				case RongIMLib.ConnectionStatus.NETWORK_UNAVAILABLE:
					RongIMClient.reconnect({
				        onSuccess: function(userId) {
				            console.log("Reconnect successfully." + userId);
				        },
				        onTokenIncorrect: function() {
				            console.log('token无效');
				        },
				        onError:function(errorCode){
				            console.log(errorcode);
				        }
				    }, {
				        auto: true,
				        url: 'cdn.ronghub.com/RongIMLib-2.2.6.min.js',
				        rate: [100, 1000, 3000, 6000, 10000]
				    });
//					mui.toast('网络不可用');
					break;
			}
		}
	});
	RongIMClient.setOnReceiveMessageListener({ //接收消息
		onReceived: function(msg) {
			if(msg.messageType == 'VoiceMessage') msg.audiotim = msg.content.extra.tim;
			if(msg.messageType == 'ImageMessage')(new Image()).src = msg.content.content;
			msg.time = showTime(msg.sentTime);
			fn(msg);
		}
	});
	RongIMClient.connect(token, {
		onSuccess: function(userId) {
			userid = userId;
		},
		onTokenIncorrect: function() {
			mui.toast('用户不存在');
		},
		onError: function(errorCode) {
			var info = '';
			switch(errorCode) {
				case RongIMLib.ErrorCode.TIMEOUT:
					info = '超时';
					break;
				case RongIMLib.ErrorCode.UNKNOWN_ERROR:
					info = '未知错误';
					break;
				case RongIMLib.ErrorCode.UNACCEPTABLE_PaROTOCOL_VERSION:
					info = '不可接受的协议版本';
					break;
				case RongIMLib.ErrorCode.IDENTIFIER_REJECTED:
					info = 'appkey不正确';
					break;
				case RongIMLib.ErrorCode.SERVER_UNAVAILABLE:
					info = '服务器不可用';
					break;
			}
			console.log(info + ':' + errorCode);
		}
	});
}

function sendContent(targetId, content, fn) {
	var msg = null;
	if(content.type == "text") {
		msg = new RongIMLib.TextMessage(content);
	} else if(content.type == "image") {
		msg = new RongIMLib.ImageMessage(content);
	} else if(content.type == "sound") {
		msg = new RongIMLib.VoiceMessage(content);
	}
	var conversationtype = RongIMLib.ConversationType.PRIVATE; // 私聊
	RongIMClient.getInstance().sendMessage(conversationtype, targetId, msg, {
		onSuccess: function(msg) { // 发送消息成功
			if(msg.messageType == 'VoiceMessage') msg.audiotim = msg.content.extra.tim;
			msg.time = showTime(msg.sentTime);
			msg.tag = true;
			fn(msg);
		},
		onError: function(errorCode, message) {
			mui.toast('发送失败:' + info);
		}
	});
}

function getFile(data) {
	plus.io.requestFileSystem(plus.io.PUBLIC_DOCUMENTS, function(fs) {
		fs.root.getFile(data.url, {
				create: true,
				exclusive: false
			},
			function(fileEntry) {
				data.fn(fileEntry);
			},
			function(e) {
				alert('111' + e.message);
			});
	}, function(e) {
		alert(e.message);
	});
}

function getMiTime() {
	var date = new Date();
	var year = date.getFullYear();
	var month = date.getMonth() > 8 ? date.getMonth() + 1 : "0" + (date.getMonth() + 1);
	var day = date.getDate() > 9 ? date.getDate() : "0" + date.getDate();
	var time = {
		year: year,
		month: month,
		day: day,
		date: date.getTime(),
	};
	return time;
}
var sent = null;

function showTime(tim) {
	var t = tim - sent <= 120000 ? '' : format(tim, true);
	sent = tim;
	return t;
}
function historytim(tim){
	var t = sent - tim <= 120000 ? '' : format(tim, true);
	sent = tim;
	return t;
}
function format(sentTime, on) {
	var mytime = null;
	var start = getMiTime();
	var time = new Date(sentTime); //年
	var y = time.getFullYear(); //月
	var m = time.getMonth() + 1; //日
	var d = time.getDate(); //时
	var h = time.getHours(); //分
	var mm = time.getMinutes(); //秒
	var s = time.getSeconds(); //毫秒
	mytime = h < 12 ? '上午' + h + ':' + add0(mm) : '下午' + h + ':' + add0(mm);
	if(isYestday(time)) {
		mytime = h < 12 ? '上午' + h + ':' + add0(mm) : '下午' + h + ':' + add0(mm);
		mytime = '昨天' + mytime;
	} else if(on) {
		mytime = y + "年" + add0(m) + "月" + add0(d) + "日 " + mytime
	} else {
		mytime = y + "/" + add0(m) + "/" + add0(d)
	}
	return mytime;
}

function add0(m) {
	return m < 10 ? '0' + m : m
};

function isYestday(theDate) {
	var date = (new Date()); //当前时间
	var today = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(); //今天凌晨
	var yestday = new Date(today - 24 * 3600 * 1000).getTime();
	return theDate.getTime() < today && yestday <= theDate.getTime();
}