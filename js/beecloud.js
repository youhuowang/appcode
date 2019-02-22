mui.plusReady(function() {
	var vm = new Vue({
		el: '#app',
		data: {
			payTyp: 2,
			orderno: '',
			totalprice: '',
			orderid: getQueryString("orderid"),
			usertype:'',
		},
		methods: {
			pay: function() {
				if(vm.payTyp == 3) {
					if(vm.usertype==1){
						mui.alert('您还未获得商家可延期付款的权限,如需延期付款请联系商家','提示','确定');
						return;
					}
					location.href = 'under_pay.html?id=' + vm.orderid;
					return;
				}
				var channel, payId = vm.payTyp == 1 ? 'alipay' : 'wxpay';
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
							orderid: vm.orderid,
							paytype: vm.payTyp
						},
						type: "POST",
						fn: function(reg) {
							var waiting = plus.nativeUI.showWaiting();
							plus.payment.request(channel, reg, function(result) {
								mui.toast('支付完成');
								waiting.close();
								location.href = 'paySuccessCB.html?id=' + vm.orderno;
							}, function(e) {
								waiting.close();
//								plus.nativeUI.alert("支付失败：" + JSON.stringify(e), null, "支付通知");
							});
						}
					}, true);

				}, function(e) {
					mui.toast("获取支付通道列表失败：" + e.message);
				});

			}
		},
	})
	yh.ajax({
		url: '/orderPay',
		data: {
			orderid: vm.orderid,
		},
		type: "POST",
		fn: function(reg) {
			vm.orderno = reg.orderno;
			vm.totalprice = reg.totalprice;
			vm.usertype= reg.usertype;
		}
	}, true);
})
