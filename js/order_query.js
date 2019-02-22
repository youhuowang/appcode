mui.plusReady(function() {	
	var vm = new Vue({
		el: "#app",
		data: {
			entrytype: yh.getQueryString("id"),
			ordertype: yh.getQueryString("ordertype"),
			page: 0,
			starttime: '',
			endtime: '',
			status: [],
			orderstatus: '',
			orderstatusval: "",
			onOff: false,
			page: 0,
			info: [],
			isquery: true,
			tag:false,
		},
		mounted: function() {
			this.starttime = this.getNowFormatDate();
			this.endtime = this.getNowFormatDate();
			var order = this.ordertype;
			this.status = order == 1 ? ['待付款', '待发货', '已发货', '已完成', '未付完'] : order == 2 ? ['待发货', '已发货', '已完成', ] : ['待发货', '已发货', '已完成', '未付完'];
			this.isorderstatus(this.status[0]);
		},
		methods: {
			toggletime: function(e, name) {
				var dDate = new Date();
				var year = dDate.getFullYear();
				var month = dDate.getMonth();
				var strDate = dDate.getDate();
				dDate.setFullYear(year, month, strDate);
				var minDate = new Date();
				minDate.setFullYear(2019, 0, 1);
				var maxDate = new Date();
				maxDate.setFullYear(year, month, strDate);
				plus.nativeUI.pickDate(function(e) {
					var time=e.date.getFullYear() + "-" + vm.add0(e.date.getMonth() + 1) + "-" + vm.add0(e.date.getDate());
					name ? vm.endtime = time : vm.starttime = time;
				}, function(e) {
				
				}, {
					title: "请选择日期",
					date: dDate,
					minDate: minDate,
					maxDate: maxDate
				});
				
			},
			add0:function(m) {
				return m < 10 ? '0' + m : m
			},
			getNowFormatDate: function() {
				var date = new Date();
				var seperator1 = "-";
				var year = date.getFullYear();
				var month = date.getMonth() + 1;
				var strDate = date.getDate();
				if(month >= 1 && month <= 9) {
					month = "0" + month;
				}
				if(strDate >= 0 && strDate <= 9) {
					strDate = "0" + strDate;
				}
				var currentdate = year + seperator1 + month + seperator1 + strDate;
				return currentdate;
			},
			isorderstatus: function(value,e) {
//				e.stopPropagation();
				this.orderstatusval = value;
				this.orderstatus = value == '待付款' ? 0 : value == '待发货' ? 1 : value == '已发货' ? 2 : value == '已完成' ? 3 : 4;
				this.onOff = false;
			},
			preventDefault:function(e){
				e.preventDefault;
			},
			openWindow: function(id, url) {
				mui.openWindow({
					url: url,
					id: id,
					styles: {
						top: 0,
						bottom: 0,
						background:'#FFFFFF',
					},
				})
			},
			remindSendGoods: function(id) { //提醒发货
				yh.ajax({
					url: '/remindSendGoods',
					type: "POST",
					data: {
						orderid: id,
					},
					fn: function(reg) {
						mui.toast('提醒成功');
					}
				}, true);
			},
			sendmessage:function(uid){//聊天
				mui.openWindow({
					url: '../chat/html/message.html?id='+uid,
					id: 'messige.html',
					styles: {
						top: 0,
						bottom: 0,
						background:'#FFFFFF',
					},
				})
			},
			goDetails: function(item) {
				if(item.goodsid==''){
					mui.toast("该商品不存在或已被删除");
					return;
				}
				var href = 'details.html?id=' + item.goodsid;
				var id = 'details.html';
				this.openWindow(id, href);
			},
			ContinuePay: function(id) {
				this.openWindow('unders_pay.html', 'unders_pay.html?id=' + id);
			},
			goShop: function(id) {
				var href = 'shopindex.html?id=' + id;
				var id = 'shopindex.html';
				this.openWindow(id, href);
			},
			goOrderDetails: function(item) {//支付方式 0：未支付 1：支付宝支付 2：微信支付 3：延期付款未付完 4：延期付款已付完 5：延期付款未付完但已确认
				item.paytype == 3 || item.paytype == 4 || item.paytype == 5? this.openWindow('under_pay_details.html', 'under_pay_details.html?id=' + item.orderid) : this.openWindow('orderDetails.html', 'orderDetails.html?id=' + item.orderid);
			},
			gopay: function(id) {//继续支付
				this.openWindow('beecloud.html', 'beecloud.html?orderid=' + id);
			},
			getorderList: function(start, end, status) {
				vm.page++;
				yh.ajax({
					url: '/orderList',
					type: "get",
					data: {
						entrytype: vm.entrytype,
						ordertype: vm.ordertype,
						page: vm.page,
						num: 20,
						starttime: start||"",
						endtime: end||"",
						orderstatus: end?status:"",
					},
					fn: function(reg) {
						reg.info.forEach(function(value, i) {
							vm.info.push(value);
						});
						vm.tag=true;
						if(reg.info.length < 20) mui('#pullrefresh').pullRefresh().disablePullupToRefresh();
						mui('#pullrefresh').pullRefresh().endPullupToRefresh(reg.info.length<20);
					}
				}, true,function(reg){
					vm.isquery = true;
				});
			},
			query: function() { //查询
				mui('#pullrefresh').pullRefresh().refresh(true);
				vm.page = 0;
				vm.info = [];
				vm.tag=false;
				vm.isquery = false;
				vm.getorderList(vm.starttime, vm.endtime, vm.orderstatus);
			},
			delOrder: function(item) { //取消订单
				mui.confirm('你确定要取消该订单吗？取消后无法恢复。','提示',['取消','确定'],function(e){
					if (e.index == 1) {
						yh.ajax({
							url: '/delOrder',
							type: "POST",
							data: {
								orderid: item.orderid,
							},
							fn: function(reg, msg) {
								item.orderstatus = 6;
							}
						}, true);
					}
				})
			},
			ConfirmSend: function(item) {//
				mui.confirm('执行此操作前请确认该订单的详细信息，是否继续该操作？', '提示', ['否', '是'], function(e) {
					if(e.index == 1) {
						yh.ajax({
							url: '/ConfirmSend',
							type: "POST",
							data: {
								orderid: item.orderid,
							},
							fn: function(reg) {
								item.orderstatus = 2;
							}
						}, true);
					}
				})
			},
			ConfirmCollect: function(item) {//确认收货
				mui.confirm('请确保已收收到该商品后，再执行此操作，是否继续该操作？', '提示', ['否', '是'], function(e) {
					if (e.index == 1) {
						yh.ajax({
							url: '/ConfirmCollect',
							type: "POST",
							data: {
								orderid: item.orderid,
							},
							fn: function(reg) {
								item.orderstatus = 3;
							}
						}, true);
					}
				})
			},			
		}
	});
	mui.init({
		swipeBack: false,
		keyEventBind: {
			backbutton: false //关闭back按键监听
		},
		pullRefresh: {
			container: '#pullrefresh',
			down: {
				style: 'circle',
				callback: pulldownRefresh,
			},
			up: {
				auto: true,
				contentrefresh: '正在加载...',
				callback: pullupRefresh
			}
		}
	});
	function pulldownRefresh() {
		var $this = this;
		yh.ajax({
			url: '/orderList',
			type: "get",
			data: {
				entrytype: vm.entrytype,
				ordertype: vm.ordertype,
				page: 1,
				num: vm.page * 20,
				starttime: !vm.isquery ? vm.starttime : '',
				endtime: !vm.isquery ? vm.endtime : '',
				orderstatus: !vm.isquery ? vm.orderstatus : '',
			},
			fn: function(reg) {
				vm.info = [];				
				reg.info.forEach(function(value, i) {
					vm.info.push(value);
				});
				var str = JSON.stringify(reg.info);
				mui('#pullrefresh').pullRefresh().endPulldown();
			}
		}, true);
	}
	window.addEventListener('refresh', function(e) {
		pulldownRefresh();
	});
	function pullupRefresh() {
		vm.isquery ? vm.getorderList() : vm.getorderList(vm.starttime, vm.endtime, vm.orderstatus);
	};
})