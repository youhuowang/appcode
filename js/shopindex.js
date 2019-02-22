mui.plusReady(function() {

	var vm = new Vue({
		el: "#app",
		data: {
			id: yh.getQueryString('id'),
			page: 0,
			notice: '',
			shopinfo: '',
			shopnotice: '',
			shoprecommend: '',
			goods: [],
			swiper: '',
			keyword: '',
		},
		methods: {
			godetails: function(id) {
//				if(plus.webview.getWebviewById('details.html')){
//					plus.webview.getWebviewById('details.html').close();
//				}
				mui.openWindow('details.html?id=' + id, 'details.html', {
					styles: {
						popGesture: "close",
						background: '#FFFFFF',
					},
					createNew:true,
				});
			},
			toggleGoods: function(item) { //收藏切换
				var url = item.collect == 1 ? "/collectGoods" : '/delCollectGoods';
				yh.ajax({
					url: url,
					data: {
						'goodsid': item.id,
					},
					type: "post",
					fn: function(data) {
						item.collect = item.collect == 1 ? 2 : 1;
						var info = item.collect == 2 ? '收藏成功' : '已取消收藏';
						mui.toast(info);
					}
				}, true, function() {
					mui.toast("操作失败");
				});
			},
			follow: function() { //关注
				yh.ajax({
					url: '/followShop',
					data: {
						'shopid': vm.shopinfo.id,
					},
					type: "post",
					fn: function(data) {
						mui.toast('关注成功');
						vm.shopinfo.count++;
						vm.shopinfo.follow = 2;
					}
				}, true);
			},
			messagelist: function() {
				yh.messagelist();
			},
			addFriend: function(uid) {
				yh.istoken(function(){
					mui.openWindow('_www/chat/html/userdetails.html?id=' + uid, 'userdetails.html', {
						styles: {
							popGesture: "close",
							background: '#FFFFFF',
						},
					});
				})
			},
			search: function() {
				if(vm.keyword == '') return;
				mui.openWindow("searchList.html?name=" + vm.keyword, 'searchList.html', {
					styles: {
						popGesture: "close",
						background: '#FFFFFF',
					},
				});
			}
		},
		watch: {
			shopnotice: function() {
				this.$nextTick(function() {
					vm.notice == '' ? vm.notice = new Swiper('.notice', { //滚动通知
						direction: 'vertical',
						loop: true, //启动自动切换
						loopAdditionalSlides: 1, //启动自动切换 前后各加一条
						autoplay: {
							delay: 5000,
						},
						noSwiping: false, //禁用滑动
						noSwipingClass: 'swiper-slide',
					}) : vm.notice.update();
				})
			},
			shoprecommend: function() {
				this.$nextTick(function() {
					vm.swiper == '' ? vm.swiper = new Swiper('.commend', {
						slidesPerView: 'auto',
					}) : vm.swiper.update();
				})
			}
		}
	});
	mui.init({
		pullRefresh: {
			container: '#pullrefresh',
			up: {
				auto: true,
				contentrefresh: '正在加载...',
				callback: pullupRefresh,
			}
		}
	});

	function pulldownRefresh() {
		yh.ajax({
			url: "/shopIndex",
			type: "get",
			data: {
				shopid: vm.id,
			},
			fn: function(data) {
				vm.shopinfo = data.shopinfo;
				vm.shopnotice = data.shopnotice;
				vm.shoprecommend = data.shoprecommend;
			}
		});
	};

	function pullupRefresh() {
		vm.page++;
		yh.ajax({
			url: "/shopGoods",
			type: "get",
			data: {
				shopid: vm.id,
				page: vm.page,
				num: 16,
			},
			fn: function(data) {
				data.forEach(function(value, i) {　
					vm.goods.push(value);
				})
				if(vm.page <= 1) pulldownRefresh();
				mui('#pullrefresh').pullRefresh().endPullupToRefresh(data.length < 16);
			}
		});
	};
});