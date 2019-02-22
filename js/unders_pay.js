mui.plusReady(function() {
	var vm = new Vue({
		el: "#app",
		data: {
			data: '',
			content: '',
			paytype:2,//1支付宝 2微信
		},
		methods: {
			orderstatus: function(n) {
				return n == 0 ? '待支付' : n == 1 ? '待发货 ' : n == 2 ? '已发货' : '已完成';
			},
			send:function(){
				if(vm.data.unlinepaystatus==1){
					mui.alert('商家未确认该笔订单，请先联系商家确认','提示','确定');
					return;
				}
				var channel, payId = vm.paytype == 1 ? 'alipay' : 'wxpay';
				plus.payment.getChannels(function(channels) {
					mui.each(channels, function(index, element) {
						if(element.id == payId) {
							channel = element;
						}
					});
					if(!channel) {
						mui.toast('检测到系统未安装“支付宝快捷支付服务”，无法完成支付操作');
						return;
					}
					//发起支付
					yh.ajax({
						url: '/ConfirmPayment',
						data: {
							orderid: yh.getQueryString('id'),
							paytype: vm.paytype
						},
						type: "POST",
						fn: function(reg) {
							var waiting = plus.nativeUI.showWaiting();
							plus.payment.request(channel, reg, function(result) {
								mui.toast('支付完成');
								waiting.close();
								location.href = 'under_pay_details.html?id=' + vm.data.orderid;
							}, function(e) {
								waiting.close();
							});
						}
					}, true);

				}, function(e) {
					mui.toast("获取支付通道列表失败：" + e.message);
				});
			}
		},
		computed: {
			isprice: function() {
				return this.myreg.test(this.price) ? true : false;
			}
		}
	})
	yh.ajax({
		url: "/ContinuePay",
		data: {
			orderid: yh.getQueryString('id'),
		},
		type: "POST",
		fn: function(data) {
			vm.data = data;
		}
	}, true);
})