mui.plusReady(function() {
	window.addEventListener('refresh', function(e) {
		pulldownRefresh();
	});
	mui.init({
		beforeback: function() {　　　　
			var list = plus.webview.currentWebview().opener(); //获得父页面的webview 	　　　　
			mui.fire(list, 'refresh'); //触发父页面的自定义事件(refresh),从而进行刷新	
			return true; //返回true,继续页面关闭逻辑
		}
	});
	var vm = new Vue({
		el: "#app",
		data: {
			info: '',
			address: '',
			order_list: [],
			total: 0,
		},
		methods: {
			goaddress: function() {
				location.href = 'address.html?name=order';
			},
			sendPay: function() {
				var list, good;
				vm.info.forEach(function(value, i) {　
					list = [];
					value.list.forEach(function(item, j) {
						good = {
							goodsid: item.goodsid,
							spec: item.spec
						};
						list.push(good);
					})
					mylist = {
						shopid: value.shopid,
						content: value.content,
						list: list,
					}
					vm.order_list.push(mylist);
				})
				if(vm.address == '') {
					mui.toast("请先添加一个收货地址");
					return;
				};
				var waiting = plus.nativeUI.showWaiting();
				yh.ajax({
					url: '/setOrder',
					type: "post",
					data: {
						addressid: vm.address.id,
						orderinfo: vm.order_list,
					},
					fn: function(data) {
						waiting.close();
						var url = data.location == 1 ? 'beecloud.html?orderid=' + data.orderid : 'tab_top.html?id=1';
						location.href = url;
					}
				}, true)
			}
		},
		computed: {
			substr: function() {
				return function(t) {
					return t.substr(0, 1);
				}
			}
		}
	})
	var list = eval('(' + plus.storage.getItem('list') + ')');
	pulldownRefresh();
	function pulldownRefresh(){
		yh.ajax({
			url: '/settlement',
			type: "post",
			data: {
				data: list,
			},
			fn: function(data) {
				vm.address = data.address;
				data.info.forEach(function(value, i) {　
					value.content = '';
					vm.total += value.totalprice;
				})
				vm.info = data.info;
			}
		}, true);
	}
	
})