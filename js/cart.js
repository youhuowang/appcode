mui.plusReady(function() {
	var vm = new Vue({
		el: "#app",
		data: {
			onOff: false,
			data: '',
			total: 0,
			num: 0,
			deleteList: [],
			istips: false,
		},
		methods: {
			deleteCart: function() {
				if(vm.deleteList.length != 0) {
					var btnArray = ['取消', '确认'];
					mui.confirm('你确要删除吗!', '优货网', btnArray, function(e) {
						if(e.index == 1) { //确认
							yh.ajax({
								url: '/delCar',
								type: "post",
								data: {
									data: vm.deleteList
								},
								fn: function(data) {
									mui.toast("删除成功");
									yh.ajax({
										url: '/goodsCar',
										type: "get",
										fn: function(data) {
											for(var i = 0; i < data.length; i++) {
												data[i].toggle = 1;
												data[i].price = 0;
												data[i].num = 0;
												data[i].species = 0;
												data[i].list.forEach(function(value, i) {　
													value.toggle = 1;
												})
											}
											vm.data = data;
											vm.isCheckbox();
										}
									}, true);
								}
							}, true);
						}
					})

				}
			},

			totalcheckbox: function() {
				var data = vm.data,
					len = data.length,
					i = 0,
					onOff = vm.onOff;
				for(i; i < len; i++) {
					data[i].list.forEach(function(value, i) {　
						value.active = onOff == 1 ? 0 : 1;
						value.spec.forEach(function(item, i) {
							item.active = onOff == 1 ? 0 : 1;
						})
					})
				}
				this.isCheckbox();
			},
			shopAll: function(list) { //店铺全选切换
				var checkbox = list.active;
				list.active = !checkbox;
				list.list.forEach(function(value, i) {
					value.active = checkbox == 1 ? 0 : 1;
					value.spec.forEach(function(item, i) {
						item.active = checkbox == 1 ? 0 : 1;
					})
				})
				this.isCheckbox();
			},
			listAll: function(list, i) { //list 全选切换
				var checkbox = list.active;
				list.active = !checkbox;
				list.spec.forEach(function(item, i) {
					item.active = checkbox == 1 ? 0 : 1;
				})
				this.isCheckbox();
			},
			myCheckbox: function(spec) { //size 单选切换
				spec.active = !spec.active;
				this.isCheckbox();
			},
			send: function() {
				if(vm.deleteList.length == 0) {
					mui.toast('请先选择要购买的商品');
					return
				};
				var str = JSON.stringify(vm.deleteList);
				plus.storage.setItem('list',str);
				mui.openWindow('_www/module/order_details.html?name=cart', 'order_details.html', {
					styles: {
						popGesture: "close",
						background: '#FFFFFF',
					},
				});
			},
			isCheckbox: function() {
				var total = 0,
					totalNum = 0,
					shopPrice = 0,
					shopNum = 0,
					species = 0,
					pce,
					num;
				var list = [],
					item, itemJson = [],
					spec;
				var data = vm.data,
					len = data.length,
					i = 0,
					a = 0,
					b, c, d, e;
				for(i; i < len; i++) {
					b = 0;
					c = 0;
					species = 0;
					shopNum = 0;
					shopPrice = 0;
					item = '';
					data[i].list.forEach(function(value, i) {　
						d = 0;
						e = 0;
						num = 0;
						pce = 0;
						itemJson = [];
						value.spec.forEach(function(item, i) {
							if(item.active == 1) {
								d++;
								num += parseInt(item.num);
								pce += item.num * value.price;
								spec = {
									color: item.color,
									size: item.size,
									num: item.num,
									id: item.id,
								};
								itemJson.push(spec);
							};
							e++;
						})
						if(itemJson.length != 0) {
							item = {
								carid: value.carid,
								goodsid: value.goodsid,
								spec: itemJson
							};
							list.push(item);
						}
						c++;
						species += d; //**种
						shopNum += num; //**件
						shopPrice += parseFloat(pce);
						value.active = d == e ? 1 : 0;
						if(value.active == 1) b++;
					})
					vm.deleteList = list;
					data[i].active = b == c ? 1 : 0;
					data[i].species = species; //**种
					data[i].num = shopNum; //件
					data[i].price = shopPrice.toFixed(2);
					if(data[i].active == 1) a++;
					total += shopPrice
					totalNum += shopNum;
				}
				vm.total = total.toFixed(2);
				vm.num = totalNum;
				vm.onOff = a == len ? true : false;
			},
			
			changeCarNum: function(spec, n) {
				var num = spec.num;
				if(n == -1) {
					num = num >= 2 ? num + n : 1;
				} else if(n == 1) {
					num++;
				} else {
					num = num == 0 || num == '' ? 1 : num;
				}
				spec.num = num;
				vm.toogglenum(spec.id,num)
			},
			toogglenum:function(id,num){
				yh.ajax({
					url: '/changeCarNum',
					type: "post",
					data: {
						id: id,
						num: num,
					},
					fn: function(data) {
						vm.isCheckbox();
					}
				}, true);
			}
		},
		computed: {
			isShow: function() {
				return function(n) {
					return n == 1 ? '收起' : '展开';
				};
			},
		}
	})
	window.addEventListener('refresh', function(e) {
		pulldownRefresh();
	});
	pulldownRefresh();
	function pulldownRefresh(){
		yh.ajax({
			url: '/goodsCar',
			type: "get",
			fn: function(data) {
				if(data == '') vm.istips = true;
				for(var i = 0; i < data.length; i++) {
					data[i].toggle = 1;
					data[i].price = 0;
					data[i].num = 0;
					data[i].species = 0;
					data[i].list.forEach(function(value, i) {　
						value.toggle = 1;
					})
				}
				vm.data = data;
			}
		}, true);
	}
	
});